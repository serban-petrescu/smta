/* global google */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Sorter",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(Controller, Device, JSONModel, Sorter, MessageToast, MessageBox) {
	"use strict";

	return Controller.extend("diploma.admin.route.create.controller.Main", {
        
        /** Lifecycle hook. Creates the view model, attaches promise callbacks and sets style classes.*/
		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				locationAdvancedSearch: false,
				waypointCount: 0,
				toggleDetailsVisible: Device.system.phone,
				toggleMapVisible: false,
				selected: false,
				routeName: "",
				waypoints: {}
			});
			this.getView().setModel(oViewModel, "view");
            
			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};
            
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			
			this.byId("map").attachAfterRendering(this._initMap, this);
			this.getOwnerComponent().getMapPromise().then(this._initMap.bind(this));                         
			
			
			var sStyleClass = this.getOwnerComponent().getContentDensityClass();
			// apply content density mode to root view
			
			this.getView().addStyleClass(sStyleClass);
			this.byId("appRouteCreate").getDependents().forEach(function(oItem){
			    oItem.addStyleClass(sStyleClass);
			});
			
			jQuery.sap.delayedCall(500, this, function(){
				if (google && this._map) {
					google.maps.event.trigger(this._map, "resize");
					this._map.setCenter(new google.maps.LatLng(45.33,28.20));
				}
			});
		},
		
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter : function () {
			return this.getOwnerComponent().getRouter();
		},

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel : function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel : function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle : function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
        
        /**
         * Custom formatter for displaying the country and region of a location in one text field.
         * This formatter is needed to avoid the displaying of stranded commas if the country / region is empty.
         * @param   {string}    sCountry    The country of the location.
         * @param   {string}    sRegion     The region of the location.
         * @returns {string}    The formatted string.
         */
        formatLocationInfo: function(sCountry, sRegion) {
            if (!sCountry && !sRegion) {
                return "";
            }
            else if (!sCountry || !sRegion) {
                return sCountry || sRegion;
            }
            else {
                return sRegion + ", " + sCountry;
            }
        },
        
		/**
		 * Event handler  for navigating back.
		 * It checks if there is a history entry. If yes, history.go(-1) will happen.
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = sap.ui.core.routing.History.getInstance().getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: {shellHash: "#Shell-home"}
				});
			}
		},
		
		/**
		 * Called when  the dynamic side container changes the breakpoint.
		 * Updates the view model to ajust the toggle buttons visibilities.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		onBreakpointChange: function (oEvent) {
			var sCurrentBreakpoint = oEvent.getParameter("currentBreakpoint"),
			    oViewModel = this.getView().getModel("view");
 
			if (sCurrentBreakpoint === "S") {
				oViewModel.setProperty("/toggleMapVisible", !this.byId("dscMain").getShowMainContent());
				oViewModel.setProperty("/toggleDetailsVisible", !this.byId("dscMain").getShowSideContent());
			} else {
				oViewModel.setProperty("/toggleMapVisible", false);
				oViewModel.setProperty("/toggleDetailsVisible", false);
			}
		},
		
		/**
		 * Called when the selection of the waypoint list is changed.
		 * Updates the view model in order to enable / disable selection based buttons.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		onListSelectionChange: function(oEvent){
		    this.getModel("view").setProperty("/selected", oEvent.getParameter("selected"));
		},
		
		/**
		 * Called when the "plus" button is pressed.
		 * Clears the search fields and filtering of the value help dialog and then opens it.
		 * @returns {void}
		 */
		onAddWaypoint: function() {
		    this.byId("seaLocationNameSearch").setValue("");
		    this.byId("seaLocationCountrySearch").setValue("");
		    this.byId("seaLocationRegionSearch").setValue("");
		    this.getModel("view").setProperty("/locationAdvancedSearch", false);
		    this.onSearchLocationMain();
		    this.byId("vhdLocation").open();
		},
		
		/**
		 * Called when the "delete" button is pressed.
		 * Removes the selected waypoint and recomputes the route.
		 * @returns {void}
		 */
		onRemoveWaypoint: function() {
		    var oItem = this.byId("lstWaypoints").getSelectedItem();
		    if (oItem) {
		        var sKey = oItem.getBindingContext("view").getProperty("id"),
		            oData = this.getModel("view").getData(),
		            iOrder = oData.waypoints[sKey].order,
		            sCurrent;
		        for (sCurrent in oData.waypoints) {
		            if (oData.waypoints.hasOwnProperty(sCurrent) && oData.waypoints[sCurrent].order > iOrder) {
		                oData.waypoints[sCurrent].order--;
		            }
		        }
		        delete oData.waypoints[sKey];
		        oData.waypointCount--;
		        oData.selected = false;
		        this.getModel("view").refresh();
		        this._updateDirections();
		    }
		},
		
		/**
		 * Called when the "up" button is pressed.
		 * Moves the currently selected waypoint one place upwards by decrementing its order property
		 * (and incrementing the order property of the waypoint above it).
		 * @returns {void}
		 */
		onMoveWaypointUp: function() {
		    var oItem = this.byId("lstWaypoints").getSelectedItem();
		    if (oItem) {
		        var sKey = oItem.getBindingContext("view").getProperty("id"),
		            oWaypoints = this.getModel("view").getObject("/waypoints"),
		            iOrder = oWaypoints[sKey].order - 1,
		            sCurrent;
		        for (sCurrent in oWaypoints) {
		            if (oWaypoints.hasOwnProperty(sCurrent) && oWaypoints[sCurrent].order === iOrder) {
		                oWaypoints[sCurrent].order++;
		                oWaypoints[sKey].order--;
        		        this.byId("lstWaypoints").getBinding("items").sort(new Sorter("order"));
        		        this._updateDirections();
        		        break;
		            }
		        }
		    }
		},
		
		/**
		 * Called when the "down" button is pressed.
		 * Moves the currently selected waypoint one place downwards by incrementing its order property
		 * (and decrementing the order property of the waypoint above it).
		 * @returns {void}
		 */
		onMoveWaypointDown: function() {
		    var oItem = this.byId("lstWaypoints").getSelectedItem();
		    if (oItem) {
		        var sKey = oItem.getBindingContext("view").getProperty("id"),
		            oWaypoints = this.getModel("view").getObject("/waypoints"),
		            iOrder = oWaypoints[sKey].order + 1,
		            sCurrent;
		        for (sCurrent in oWaypoints) {
		            if (oWaypoints.hasOwnProperty(sCurrent) && oWaypoints[sCurrent].order === iOrder) {
		                oWaypoints[sCurrent].order--;
		                oWaypoints[sKey].order++;
        		        this.byId("lstWaypoints").getBinding("items").sort(new Sorter("order"));
        		        this._updateDirections();
        		        break;
		            }
		        }
		    }
		},
		
		/**
		 * Called when the "Advanced" / "Basic" button is pressed.
		 * Updates the view model to show or hide the advanced search panel.
		 * @returns {void}
		 */
		onToggleAdvancedSearch: function() {
		    this.getModel("view").setProperty("/locationAdvancedSearch", 
		        !this.getModel("view").getProperty("/locationAdvancedSearch"));
		},
		
		/**
		 * Called when the "show map" button is pressed. This can only happen if the size of the screen is below 
		 * the breakpoint defined in the sideContentFallDown of the dynamic side container.
		 * Updates the model accordingly and instructs the dynamic side container to switch content.
		 * @returns {void}
		 */
		onShowMap: function() {
		    var oViewModel = this.getView().getModel("view");
			oViewModel.setProperty("/toggleMapVisible", false);
			oViewModel.setProperty("/toggleDetailsVisible", true);
			this.byId("dscMain").toggle();
		},
		
		/**
		 * Called when the "show details" button is pressed. This can only happen if the size of the screen is below 
		 * the breakpoint defined in the sideContentFallDown of the dynamic side container.
		 * Updates the model accordingly and instructs the dynamic side container to switch content.
		 * @returns {void}
		 */
		onShowDetails: function() {
		    var oViewModel = this.getView().getModel("view");
			oViewModel.setProperty("/toggleMapVisible", true);
			oViewModel.setProperty("/toggleDetailsVisible", false);
			this.byId("dscMain").toggle();
		},
		
		/**
		 * Called when the "save" button is pressed.
		 * Collects the necessary data, performs validations and sends the data to the backend.
		 * If the operation is succesfully finished, the "View Route" app is opened with the newly created route.
		 * @returns {void}
		 */
		onSaveRoute: function() {
		    var sKey,
		        oWaypoints = this.getModel("view").getObject("/waypoints"),
		        aWaypoints = [],
		        oi18n = this.getResourceBundle(),
		        sName = this.getModel("view").getProperty("/routeName"),
		        oDirections,
		        oRoute,
		        oLeg, 
		        oStep,
		        aRes = [],
		        i, j, k;
		        
            oDirections = this._display.getDirections();
		    for (sKey in oWaypoints) {
                if (oWaypoints.hasOwnProperty(sKey)) {
                    aWaypoints.push(oWaypoints[sKey]);
                }
            }
            if (aWaypoints.length < 2 || !sName || !(oDirections && oDirections.routes && oDirections.routes.length)) {
                MessageBox.error(oi18n.getText("errorInvalidParameters"));
                return;
            }
            
            aWaypoints.sort(function(a, b){ return a.order - b.order; });
            for (i = 0; i < aWaypoints.length; ++i) {
                aWaypoints[i] = aWaypoints[i].id;
            }
            
            oRoute = oDirections.routes[0];
			for (i = 0; i < oRoute.legs.length; ++i) {
				oLeg = oRoute.legs[i];
				for (j = 0; j < oLeg.steps.length; ++j) {
					oStep = oLeg.steps[j];
					for (k = 0; k < oStep.path.length; ++k) {
						aRes.push(oStep.path[k].lng().toFixed(5) + " " + oStep.path[k].lat().toFixed(5));
					}
				}
			}
            
            $.ajax({
                url:    "/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs?entity=Route&name=" + 
                            sName + "&waypoints=" + aWaypoints.join(","),
                method: "POST",
	            headers: { "X-CSRF-Token": this.getModel().getSecurityToken() },
                data:   "LINESTRING( " + aRes.join(", ") + " )",
                success: function(sRouteId) {
                    if (!sap.ushell || !sap.ushell.Container || !sap.ushell.Container.getService) {
        				return;
        			}
        			var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
        			if (!oService) {
        				return;
        			}
        			
        			oService.toExternal({
        				target: {
        					shellHash: "Route-View&/Routes/" + sRouteId
        				}
        			});
                },
                error:  function(oRequest) {
                    MessageBox.error(oi18n.getText("errorText", {details: oRequest.responseText}));
                }
            });
		},
		
		/**
		 * Opens the location maintainence dialog.
		 * @returns {void}
		 */
		openLocationDialog: function() {
			this.byId("locationName").setValue("");
			this.byId("locationLat").setValue("");
			this.byId("locationLng").setValue("");
			this.byId("dialogLocation").open();
		},
		
		/**
		 * Closes the location maintainence dialog.
		 * @returns {void}
		 */
		closeLocationDialog: function() {
			this.byId("dialogLocation").close();
		},
		
		/**
		 * Creates a new location.
		 * @returns {void}
		 */
		createLocation: function() {
			$.ajax({
				url: "/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs?entity=Location",
				method: "POST",
	            headers: { "X-CSRF-Token": this.getModel().getSecurityToken() },
				data: JSON.stringify([{
					name:		this.byId("locationName").getValue(), 
					latitude:	this.byId("locationLat").getValue(),
					longitude:	this.byId("locationLng").getValue(),
					region: 	this.byId("locationRegion").getValue(),
					country:	this.byId("locationCountry").getValue()
				}]),
				success: function() {
					MessageToast.show(this.getResourceBundle().getText("successCreateLocation"));
					this.byId("locationName").setValue("");
					this.byId("locationLat").setValue("");
					this.byId("locationLng").setValue("");
					this.byId("locationRegion").setValue("");
					this.byId("locationCountry").setValue("");
					this.getModel().refresh();
				}.bind(this),
				error: function() {
					MessageToast.show(this.getResourceBundle().getText("errorText"));
				}.bind(this)
			});
		},
		
		/**
		 * Deletes the selected location.
		 * @param	{Event}	oEvent	The event object.
		 * @returns {void}
		 */
		deleteLocation: function(oEvent) {
			this.getModel().remove(oEvent.getParameter("listItem").getBindingContext().getPath());
		},
		
		/**
		 * Event handler for the upload button press.
		 * Uploads the CSV file to the backend.
		 * @returns {void}
		 */
		onLocationUploadPress: function() {
			this.byId("locationUploader").removeAllHeaderParameters();
            this.byId("locationUploader").addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
                name:   "X-CSRF-Token",
                value:  this.getModel().getSecurityToken()
            }));
            this.byId("locationUploader").setUploadUrl("/destinations/INET_HTTP_DIPLOMA_J0I/" + 
            	"services/primary.xsjs?upload=true&entity=Location&header=" + this.byId("locationHeader").getSelected());
			this.byId("locationUploader").upload();
		},
		
		/**
		 * Common "search" event handler for all three search fields on the location value help dialog.
		 * Performs a filtering based on the type of search (basic / advanced) and the search queries.
		 * @returns {void}
		 */
		onSearchLocationMain: function() {
		    var aFilters = [], sQuery,
		        bAdvanced = this.getModel("view").getProperty("/locationAdvancedSearch");
		    
		    sQuery = this.byId("seaLocationNameSearch").getValue();
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			sQuery = this.byId("seaLocationCountrySearch").getValue();
			if (sQuery && sQuery.length > 0 && bAdvanced) {
				aFilters.push(new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			sQuery = this.byId("seaLocationRegionSearch").getValue();
			if (sQuery && sQuery.length > 0 && bAdvanced) {
				aFilters.push(new sap.ui.model.Filter("region", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			this.byId("tblLocationSearchMain").getBinding("items").filter(aFilters, "Application");
		},
		
		/**
		 * Closes the location value help dialog.
		 * @returns {void}
		 */
		onLocationMainClose: function() {
		    this.byId("vhdLocation").close();
		},
		
		/**
		 * Called when an item from the location value search help is pressed.
		 * Loads the coordinates of the selected location from the backend and updates the route.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		onLocationAdded: function(oEvent) {
		    var oModel = this.getModel("view"),
		        oContext = oEvent.getSource().getBindingContext(),
		        oWaypoints = oModel.getObject("/waypoints"),
		        iLength = 0,
		        sKey,
		        fnOnError = MessageToast.show.bind(MessageToast, this.getResourceBundle().getText("errorText"));
		        
		    for (sKey in oWaypoints) {
		        if (oWaypoints.hasOwnProperty(sKey)) {
		            ++iLength;
		        }
		    }
		    sKey = oContext.getProperty("id");
		    if (oWaypoints[sKey]) {
		        return;
		    }
		    oWaypoints[sKey] = {
	            id:     sKey,
	            name:   oContext.getProperty("name"),
	            order:  iLength + 1
	        };
	        oModel.getData().waypointCount++;
	        oModel.refresh();
	        
	        $.ajax({
	            url:    "/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs",
	            data:   {
	                entity: "Location",
	                ids:    sKey
	            },
	            success: function(oData) {
	                if (oData && oData[sKey]) {
	                    oWaypoints[sKey].latitude = oData[sKey].position[1];
	                    oWaypoints[sKey].longitude = oData[sKey].position[0];
	                    this._updateDirections();
	                }
	                else {
	                    fnOnError();
	                }
	            }.bind(this),
	            error:  fnOnError
	        });
	        
	        this.byId("vhdLocation").close();
		},
		
		/**
		 * Called when the search event of the search bar from the delete location list is triggered.
		 * Applies a simple filtering to the location list.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		onLocationDeleteSearch: function(oEvent) {
		    var aFilters = [],
		        sQuery = oEvent.getParameter("query");
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			this.byId("locationList").getBinding("items").filter(aFilters, "Application");
		},
		
		/**
		 * Event handler for the upload complete event of the file uploader.
		 * Shows a message (either success or error) and refreshes the model.
		 * @param	{object}	oEvent	The event object.
		 */
		onLocationUploadComplete: function(oEvent) {
			if (oEvent.getParameter("status") === 200 || oEvent.getParameter("status") === 204) {
				MessageToast.show(this.getResourceBundle().getText("uploadSuccess"));
				this.getModel().refresh();
				this.byId("locationUploader").clear();
			}
			else {
				MessageToast.show(this.getResourceBundle().getText("errorText"));
			}
		},
        
        /**
         * Updates the proposed route based on the current waypoints.
         * If there are less than 2 waypoints, the map is cleared.
         * @private
         * @returns {void}
         */
        _updateDirections: function() {
            var oWaypoints = this.getModel("view").getObject("/waypoints"),
                aWaypoints = [],
                aLatLngs = [],
                sKey,
                i;
            if (!this._service){
                return;
            }
            
            for (sKey in oWaypoints) {
                if (oWaypoints.hasOwnProperty(sKey)) {
                    aWaypoints.push(oWaypoints[sKey]);
                }
            }
            aWaypoints.sort(function(a, b){ return a.order - b.order; });
            if (aWaypoints.length < 2) {
                this._display.setMap(null);
                return;
            }
            this._display.setMap(this._map);
            
            for (i = 1; i < aWaypoints.length - 1; ++i) {
                aLatLngs.push({
                    location: {
                        lat: aWaypoints[i].latitude, 
                        lng: aWaypoints[i].longitude
                    },
                    stopover: false
                });
            }
            
            this._service.route({
                origin:         {lat: aWaypoints[0].latitude, lng: aWaypoints[0].longitude},
                destination:    {lat: aWaypoints[aWaypoints.length - 1].latitude, lng: aWaypoints[aWaypoints.length - 1].longitude},
                waypoints:      aLatLngs,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(oResult, iStatus) {
                if (iStatus === google.maps.DirectionsStatus.OK) {
                    this._display.setDirections(oResult);
                }
            }.bind(this));
        },
        
        /**
         * Initializes the map (either after rendering or after google maps lib load).
         * This method is guaranted to be called at least once is both the map and the details panel are visible 
         * and each time the map is displayed if only one panel is visible at a time.
         * Refreshes the route displaye on the map.
         */
		_initMap: function() {
		    if (this.byId("map").getDomRef() && typeof google !== "undefined" && !this._map) {
		        this.byId("map").getDomRef().parentElement.style.height = "100%";
		        this._map = new google.maps.Map(this.byId("map").getDomRef(), {
    				mapTypeId:	google.maps.MapTypeId.ROADMAP,
    				center: 	new google.maps.LatLng(45.33,28.20),
    				zoom:		6
				});
				this._service = new google.maps.DirectionsService();
				this._display = new google.maps.DirectionsRenderer({
					map: this._map
				});
		    }
		    this._updateDirections();
		}
	});

});