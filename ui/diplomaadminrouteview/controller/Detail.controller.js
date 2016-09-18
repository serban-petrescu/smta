/*global location, google */
sap.ui.define([
		"diploma/admin/route/view/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
		"diploma/admin/route/view/model/formatter"
	], function (BaseController, JSONModel, MessageBox, formatter) {
		"use strict";

		return BaseController.extend("diploma.admin.route.view.controller.Detail", {
            
            /**
             * Holds the loaded path string.
             * Once the string is shown on the map, this attribute null'ed to free up memory.
             * @private
             */
            _path: null,
            
            
            /**
             * Holds the waypoint coordinates.
             * Once the markers are shown on the map, this attribute null'ed to free up memory.
             * @private
             */
            _waypoints: null,
            
            /**
             * Holds the marker references.
             * @private
             */
            _markers: [],
            
            /**
             * Holds the bounds of the map.
             * @private
             */
            _bounds: null,
    
			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */
            
            /** Lifecycle hook. Builds the view model, attaches promise and event callbacks and adds style classes. */
			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var oViewModel = new JSONModel({
					busy : false,
					delay : 0,
					lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
				});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				this.setModel(oViewModel, "detailView");

				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				this.getOwnerComponent().getMapPromise().then(this._refreshMap.bind(this));
				this.byId("map").attachAfterRendering(this._refreshMap, this);
				
				//this is a workaround to avoid OData errors caused by the edit schedule dialog relative binding
				//(because the dialog is embedded in the view, the OData model attempts to load the relatively
				//binded data, relative to the view --> we actually want to change the element binding just before show)
				this.byId("dlgEditSchedule").setModel(oViewModel);
				
				var sStyleClass = this.getOwnerComponent().getContentDensityClass();
    			this.byId("page").getDependents().forEach(function(oItem){
    			    oItem.addStyleClass(sStyleClass);
    			});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */
		
			/**
			 * Updates the item count within the line item table's header
			 * @param {object} oEvent an event containing the total number of items in the list
			 * @private
			 */
			onListUpdateFinished : function (oEvent) {
				var sTitle,
					iTotalItems = oEvent.getParameter("total"),
					oViewModel = this.getModel("detailView");

				// only update the counter if the length is final
				if (this.byId("lstLegs").getBinding("items").isLengthFinal()) {
					if (iTotalItems) {
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					} else {
						//Display 'Line Items' instead of 'Line items (0)'
						sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
					}
					oViewModel.setProperty("/lineItemListTitle", sTitle);
				}
			},

			/**
			 * Event handler  for navigating back.
			 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
			 * If not, it will replace the current entry of the browser history with the master route.
			 * @public
			 */
			onNavBack : function() {
				var sPreviousHash = sap.ui.core.routing.History.getInstance().getPreviousHash(),
					oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

				if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
					history.go(-1);
				} else {
					this.getRouter().navTo("master", {}, true);
				}
			},
			
			/**
			 * Called when the "plus" button of the schedule list is pressed.
			 * Opens the "create schedule" dialog.
			 * @returns {void}
			 */
			onAddSchedule: function() {
			    this.byId("dlgCreateSchedule").setVisible(true).open();
			},
			
			/**
			 * Called when the cancel button is pressed (on the create schedule dialog).
			 * Closes the dialog.
			 * @returns {void}
			 */
			onCreateScheduleCancel: function() {
			    this.byId("dlgCreateSchedule").setVisible(false).close();
			},
			
			/**
			 * Called when the confirm button is pressed (on the create schedule dialog).
			 * Collects data and sends it to the backend. If the ajax call is successful,
			 * the dialog is closed. If not, an error message is shown.
			 * @returns {void}
			 */
			onCreateScheduleConfirm: function() {
			    var oDialog = this.byId("dlgCreateSchedule"),
			        oi18n = this.getResourceBundle(), 
			        oScheduleList = this.byId("lstSchedules"),
			        aFormElements = this.byId("frcCreateScheduleLegDurations").getFormElements(),
			        i,
			        oData = {
			            route:      this.getView().getBindingContext().getProperty("id"),
			            name:       this.byId("inpCreateScheduleName").getValue(),
			            comment:    this.byId("inpCreateScheduleComment").getValue(),
			            legs:       []
			        };
			    for (i = 0; i < aFormElements.length; ++i) {
			        oData.legs.push({
			            sequence:   aFormElements[i].getBindingContext().getProperty("sequence"),
			            duration:   parseInt(aFormElements[i].getFields()[0].getItems()[0].getValue(), 10)
			        });
			    }
			    $.ajax({
			        method:     "POST",
			        url:        "/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs?entity=Schedule",
			        data:       JSON.stringify(oData),
		            headers:    { "X-CSRF-Token": this.getModel().getSecurityToken() },
			        success:    function() {
			            oDialog.setVisible(false).close();
			            oScheduleList.getBinding("items").refresh();
			        },
			        error:      function(oRequest) {
			            MessageBox.error(oi18n.getText("errorText"), {details: oRequest.responseText});
			        }
			    });
			},
			
			/**
			 * Called when the "edit" button of the schedule list is pressed.
			 * Sents the appropriate binding and model for the "edit schedule" dialog and opens the dialog.
			 * @returns {void}
			 */
			onEditSchedule: function() {
			    var oItem = this.byId("lstSchedules").getSelectedItem();
			    if (oItem) {
    			    this.getModel().resetChanges();
				    this.byId("dlgEditSchedule").setModel(this.getModel());
    			    this.byId("dlgEditSchedule").bindElement(oItem.getBindingContext().getPath());
    			    this.byId("dlgEditSchedule").setVisible(true).open();
			    }
			},
			
			/**
			 * Called when the cancel button is pressed (on the edit schedule dialog).
			 * Closes the dialog.
			 * @returns {void}
			 */
			onEditScheduleCancel: function() {
			    this.byId("dlgEditSchedule").setVisible(false).close();
			    this.getModel().resetChanges();
			    this.byId("dlgEditSchedule").setModel(this.getModel("detailView"));
			},
			
			/**
			 * Called when the confirm button is pressed (on the create schedule dialog).
			 * Instructs the OData model to commit changes.
			 * @returns {void}
			 */
			onEditScheduleConfirm: function() {
			    var oDialog = this.byId("dlgEditSchedule");
			    if (this.getModel().hasPendingChanges()) {
			        this.getModel().submitChanges({
			            success: function() {
			                oDialog.setVisible(false).close();
			            }
			        });
			    }
			    else {
			        oDialog.setVisible(false).close();
			    }
			},
			
			/**
			 * Called when the "delete" button of the schedule list is pressed.
			 * Shows a confirmation message box and deletes the seleted schedule if the user confirms.
			 * @returns {void}
			 */
			onDeleteSchedule: function() {
			    var oItem = this.byId("lstSchedules").getSelectedItem(),
			        oi18n = this.getResourceBundle(),
			        oModel = this.getModel();
			    if (oItem) {
			        MessageBox.confirm(oi18n.getText("confirmDeleteSchedule", [oItem.getBindingContext().getProperty("name")]), {
			            onClose: function(sAction) {
			                if (sAction === MessageBox.Action.OK) {
			                    oModel.remove(oItem.getBindingContext().getPath());
			                }
			            }
			        });
			    }
			},
			
			/**
			 * Called when the delete button from the detail page - footer - is pressed.
			 * Shows a confirmation message and deletes the currently displayed route on user confirmation.
			 * @returns {void}
			 */
			onRouteDelete: function() {
			    var oView = this.getView(),
			        oi18n = this.getResourceBundle(),
			        oModel = this.getModel(),
			        fnOnSuccess = this.getRouter().getTargets().display.bind(this.getRouter().getTargets(), "detailObjectNotFound");
			    MessageBox.confirm(oi18n.getText("confirmDeleteRoute", [oView.getBindingContext().getProperty("name")]), {
		            onClose: function(sAction) {
		                if (sAction === MessageBox.Action.OK) {
		                    oModel.remove(oView.getBindingContext().getPath(), {success: fnOnSuccess});
		                }
		            }
		        });
			},

			/* =========================================================== */
			/* begin: internal methods                                     */
			/* =========================================================== */

			/**
			 * Binds the view to the object path and expands the aggregated line items.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched : function (oEvent) {
				var sObjectId =  oEvent.getParameter("arguments").objectId;
				this.getModel().metadataLoaded().then( function() {
					var sObjectPath = this.getModel().createKey("Routes", {
						id :  sObjectId
					});
					this._bindView("/" + sObjectPath);
				}.bind(this));
			},

			/**
			 * Binds the view to the object path. Makes sure that detail view displays
			 * a busy indicator while data for the corresponding element binding is loaded.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound to the view.
			 * @private
			 */
			_bindView : function (sObjectPath) {
				// Set busy indicator during view binding
				var oViewModel = this.getModel("detailView");

				// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
				oViewModel.setProperty("/busy", false);

				this.getView().bindElement({
					path : sObjectPath,
					parameters: {
					    expand:     "ToLocation,FromLocation"
					},
					events: {
						change : this._onBindingChange.bind(this),
						dataRequested : function () {
							oViewModel.setProperty("/busy", true);
						},
						dataReceived: function () {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},
            
            /**
             * Called when the view element binding has changed.
             * Updates the master list accordingly and loads the route's path.
             * @private
             * @returns {void}
             */
			_onBindingChange : function () {
				var oView = this.getView(),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("detailObjectNotFound");
					// if object could not be found, the selection in the master list
					// does not make sense anymore.
					this.getOwnerComponent().oListSelector.clearMasterListSelection();
					return;
				}

				var sPath = oElementBinding.getPath();
				this.getOwnerComponent().oListSelector.selectAListItem(sPath);
				
			    this._loadRoute();
			},
            
            /**
             * Called when the metadata of the OData service was loaded.
             * Updates the view model to show that the view is busy until data is received.
             * @private
             * @returns {void}
             */
			_onMetadataLoaded : function () {
				// Store original busy indicator delay for the detail view
				var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
					oViewModel = this.getModel("detailView"),
					oLineItemTable = this.byId("lstLegs"),
					iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

				// Make sure busy indicator is displayed immediately when
				// detail view is displayed for the first time
				oViewModel.setProperty("/delay", 0);
				oViewModel.setProperty("/lineItemTableDelay", 0);

				oLineItemTable.attachEventOnce("updateFinished", function() {
					// Restore original busy indicator delay for line item table
					oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
				});

				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			},
			
			/**
			 * Checks if the map was already initialized; if not, the this method initializes it.
			 * Checks the {@link _path} and {@link _waypoints} attributes for not-null values and adds
			 * them to the map if any data is available (i.e. if any of these two attributes are not null).
			 * @private
			 * @returns {void}
			 */
    		_refreshMap: function() {
    		    if (this.byId("map").getDomRef() && typeof google !== "undefined" && !this._map) {
    		        this.byId("map").getDomRef().parentElement.style.height = "100%";
    		        this._map = new google.maps.Map(this.byId("map").getDomRef(), {
        				mapTypeId:	google.maps.MapTypeId.ROADMAP,
        				center: 	new google.maps.LatLng(45.33,28.20),
        				zoom:		6
    				});
    				this._map.data.setStyle({
    					strokeWeight: 4,
    					strokeColor: "blue"
    				});
    		    }
    		    
    		    if (this._path && this._map) {
        			this._map.data.forEach(function(oFeature) {
        		        this._map.data.remove(oFeature);
        		    }.bind(this));
    		        this._map.data.addGeoJson({
    					type: "Feature",
    					geometry: this._path
    				});
    				this._path = null;
    		    }
    		    
    		    this._showMarkers();
    		},
    		
    		/**
    		 * Displays the markers for the waypoints.
    		 * @private
    		 * @returns {void}
    		 */
    		_showMarkers: function() {
		        var i,
		            sIcon,
		            oBounds;
    		    if (this._waypoints && this._map) {
    		        oBounds = new google.maps.LatLngBounds();
    		        
    		        //remove the old markers
    		        for (i = 0; i < this._markers.length; ++i) {
    		            this._markers[i].setMap(null);
    		        }
    		        this._markers = [];
    		        
    		        for (i = 0; i < this._waypoints.length; ++i) {
    		            if (i === 0) {
    		                sIcon = "/green-dot.png";
    		            }
    		            else if (i === this._waypoints.length - 1) {
    		                sIcon = "/red-dot.png";
    		            }
    		            else {
    		                sIcon = "/via.png";
    		            }
    		            this._markers.push(new google.maps.Marker({
        					icon:   $.sap.getModulePath("diploma.admin.route.view.images", sIcon),
        					map:    this._map,
        					title:  this._waypoints[i].name,
        					position: {
        				        lat: this._waypoints[i].position[1],
        				        lng: this._waypoints[i].position[0]
        				    }
        				}));
    				    oBounds.extend(this._markers[i].getPosition());
    		        }
    		    	this._waypoints = null;
    		    	this._bounds = oBounds;
    		    }
    		    
    		    if (this._bounds !== null) {
    		    	this._map.fitBounds(this._bounds);
    		    }
    		},
		
    		/**
    		 * Loads the path of the current route and the start / end markers.
    		 * Saves the results in the correspinding private fields.
    		 * @private
    		 * @returns {void}
    		 */
    		_loadRoute: function() {
    			var sId = this.getView().getBindingContext().getProperty("id"),
    				fnOnError = MessageBox.error.bind(MessageBox, this.getResourceBundle().getText("errorText"));
    			$.ajax({
    				method: "GET",
    				url:	"/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs", 
    				data: {
    					entity:	"Route",
    					id:		sId
    				}, 
    				dataType: "json",
    				success: function(oData){
    					this._path = oData;
    				    this._refreshMap();
    				}.bind(this),
    				error: fnOnError
    			});
    			$.ajax({
    				method:	"GET",
    				url:	"/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs",
    				data: {
    					entity:     "Waypoint",
    					reference:  "Route",
    					id:         sId
    				},
    				dataType: "json",
    				success: function(oData) {
    				    this._waypoints = oData;
    				    this._refreshMap();
    				}.bind(this),
    				error: fnOnError
    			});
    		}

		});

	}
);