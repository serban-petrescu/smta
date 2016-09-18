/* global google */
sap.ui.define([
	"diploma/tracking/overview/controller/BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/m/GroupHeaderListItem",
    "diploma/tracking/overview/controller/MapManager",
    "diploma/tracking/overview/controller/MarkerBase",
    "diploma/tracking/overview/controller/Marker",
	"diploma/tracking/overview/model/formatter"
], function(BaseController, JSONModel, GroupHeaderListItem, MapManager, MarkerBase, Marker, formatter) {
	"use strict";
	
	var iAutoRefreshInterval = 5000;

	return BaseController.extend("diploma.tracking.overview.controller.Main", {

		formatter: formatter,
		
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the controller is instantiated.
		 */
		onInit: function() {
			var oi18n = this.getResourceBundle(),
				oViewModel = new JSONModel({
				type: -1,
				filters: [{
					icon:		$.sap.getModulePath("diploma.tracking.overview.images", "/blue.png"),
					title:		oi18n.getText("inactiveLocations"),
					selected:	true
				},{
					icon:		$.sap.getModulePath("diploma.tracking.overview.images", "/blue-dot.png"),
					title:		oi18n.getText("activeLocations"),
					selected:	true
				},{
					icon:		$.sap.getModulePath("diploma.tracking.overview.images", "/red-dot.png"),
					title:		oi18n.getText("transports"),
					selected:	true
				}],
				settings: {
					fetchType: 0,
					autorefresh: true,
					fixedDate: new Date(),
					beginDate: new Date(new Date().setDate(new Date().getDate()-1)),
					endDate: new Date()
				},
				controls: {
					firstFetch: true,
					secondFetch: false,
					thirdFetch: false
				},
				slider: {
					min:		0,
					max:		100,
					selected:	50
				}
			});
			
			this._lastDate = new Date();
			
			this.setModel(oViewModel, "main");
			this.getOwnerComponent().getMapPromise().then(this.onAfterMapRender.bind(this));
			this.byId("map").attachAfterRendering(this.onAfterMapRender, this);
			
			setInterval(function(){
				if (oViewModel.getProperty("/settings/autorefresh") && oViewModel.getProperty("/settings/fetchType") === 0) {
					this.onRebind();
				}
			}.bind(this), iAutoRefreshInterval);
			
			var oText = new sap.m.Text({
				width:		"100%",
				textAlign:	"Center"
			});
			this._popover = new sap.m.Popover({
				showHeader: false,
				placement:  "Top",
				content:	[oText]
			});
			this._popover.setText = oText.setText.bind(oText);
			
			var sDensityClass = this.getOwnerComponent().getContentDensityClass();
			this.byId("page").getDependents().forEach(function(oItem) {
			    oItem.addStyleClass(sDensityClass);
			});
			jQuery.sap.delayedCall(500, this, function(){
				if (google && this._map) {
					google.maps.event.trigger(this._map, "resize");
					this._map.setCenter(new google.maps.LatLng(45.33,28.20));
				}
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/** 
		 * Called after the map is redered or the google maps lib is loaded.
		 * Initializes the map and map manager.
		 */
		onAfterMapRender: function(){
			var oMapRef = this.byId("map").getDomRef();
			if (typeof google !== "undefined" && oMapRef && !this._map) {
				this._map = new google.maps.Map(oMapRef, {
    				mapTypeId:	google.maps.MapTypeId.ROADMAP,
    				zoom:		6
				});
				this._map.data.setStyle({
					strokeWeight: 3,
					strokeColor: "blue"
				});
				this._createMapManager();
				this.onRebind();
			}
		},
		
		onRefresh: function() {
			this.getModel().refresh();
		},
		
		/**
		 * Called when the model manager needs to be rebinded.
		 * Selects the appropriate date on for the rebinding and rebinds the datail aggragations.
		 * @param	{Date=}	oDate	The date to be used for the binding. 
		 *							If it is not provided, the current date is used.
		 * @returns {void}
		 */
		onRebind: function(oDate) {
			var oManager = this.byId("mapManager");
			if (!oManager) {
				return;
			}
			if (!oDate) {
				oDate = new Date();
			}
			this._lastDate = oDate;
			oManager.bindLocationDetails({
				path: "/" + this.getModel().createKey("LatestLocationTypesParameters", {
					"IV_DATE":	oDate
				}) + "/LatestLocationTypes",
				template: new MarkerBase({
					key:	"{id}",
					icon: {
						path: "active",
						formatter: function(iIsActive) {
							return $.sap.getModulePath("diploma.tracking.overview.images", 
								iIsActive === 0 ? "/blue.png" : "/blue-dot.png");
						}
					},
					visible: {
						parts: ["active", "main>/filters/1/selected", "main>/filters/0/selected"],
						formatter: function(iIsActive, bShowActive, bShowInactive) {
							return (iIsActive === 0 && bShowInactive) || (iIsActive === 1 && bShowActive);
						}
					}
				})
			});
			oManager.bindTransportDetails({
				path: "/" + this.getModel().createKey("LatestTransportReadingParameters", {
					"IV_DATE":	oDate
				}) + "/LatestTransportReadings",
				template: new MarkerBase({
					key:		"{transport}",
					detailKey:	"{reading}",
					visible: {
						path: "active",
						formatter: function(iIsActive) {
							return iIsActive !== 0;
						}
					},
					latitude: {
						path:		"latitude",
						formatter:	parseFloat
					},
					longitude: {
						path:		"longitude",
						formatter:	parseFloat
					}
				})
			});
		},
		
        /**
         * Factory function for the grouping headers of the linked transport list for a location.
         * @param   {object}    oGroup  The group object passed by the framework.
         * @returns {GroupHeaderListItem} The created list item (group header).
         */
        getLinkGroupHeader: function(oGroup) {
            var oi18n = this.getResourceBundle();
            return new GroupHeaderListItem({
                title:  oGroup.key === 0 ? oi18n.getText("incoming") : oi18n.getText("outgoing"),
				upperCase: false
            });
        },
		
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},
		
		/**
		 * Open the place filter dialog.
		 */
		openFilterDialog: function() {
			this.byId("dialogFilter").open();
		},
		
		/**
		 * Event handler for when the user changes the slider (and releases it).
		 * Refreshes the map content based on the slider value.
		 * @param	{object}	oEvent The event object.
		 * @returns {void}
		 */
		onSliderChange: function(oEvent) {
			var iValue = oEvent.getSource().getValue();
			this.onRebind(new Date(iValue));
		},
		
		/**
		 * Event handler for when the user changes the slider (and does not yet release it).
		 * Refreshes the popover value.
		 * @param	{object}	oEvent The event object.
		 * @returns {void}
		 */
		onSliderLiveChange: function(oEvent) {
			this._popover.setText(formatter.dateTime(oEvent.getSource().getValue()));
			this._popover.openBy(oEvent.getSource());
		},
		
		/**
		 * Closes the filter dialog
		 */
		closeFilter: function() {
			this.byId("dialogFilter").close();
		},
		
		
		/**
		 * Open the place search dialog.
		 */
		openSearchDialog: function() {
			this.getModel("main").setProperty("/markers", this.byId("mapManager").getVisibleMarkers());        
			this.byId("dialogSearch").getBinding("items").filter([]);
			this.byId("dialogSearch").open();
		},
		
		/**
		 * Close the place search dialog.
		 */
		closeSearchDialog: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				this.byId("mapManager").goToMarker(aContexts[0].getProperty("key"));
			}
		},
		
		/**
		 * Open the settings dialog.
		 */
		openSettingsDialog: function() {
			this.byId("dialogSettings").open();
		},
		
		/**
		 * Event handler for the change event of the radio button group.
		 */
		onRadioChange: function() {
			var oModel = this.getModel("main");
			var iIndex = oModel.getProperty("/settings/fetchType");
			oModel.setProperty("/controls/firstFetch", iIndex === 0);
			oModel.setProperty("/controls/secondFetch", iIndex === 1);
			oModel.setProperty("/controls/thirdFetch", iIndex === 2);
		},
		
		/**
		 * Applies the settings entered by the user.
		 */
		applySettings: function() {
			var oModel = this.getModel("main");
			var iType = oModel.getProperty("/settings/fetchType");
			if (iType === 0) {
				this.onRebind();
			}
			else if (iType === 1) {
				this.onRebind(oModel.getProperty("/settings/fixedDate"));
			}
			else {
				var iBegin = Math.min(oModel.getProperty("/settings/beginDate").getTime(), oModel.getProperty("/settings/endDate").getTime());
				var iEnd   = Math.max(oModel.getProperty("/settings/beginDate").getTime(), oModel.getProperty("/settings/endDate").getTime());
				oModel.setProperty("/slider/min", iBegin);
				oModel.setProperty("/slider/max", iEnd);
				oModel.setProperty("/slider/selected", (iEnd + iBegin) / 2);
				this.onRebind(new Date((iEnd + iBegin) / 2));
			}
			this.byId("dialogSettings").close();
		},
		
		/**
		 * Search a string in the list of places.
		 * @param	{Event}	oEvent	The event object.
		 * @retuns {void}
		 */
		onSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new sap.ui.model.Filter("title", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		
		/**
		 * Event handler for pressing a transport list item.
		 * @param	{Event}	oEvent	The event object.
		 * @returns	{void}
		 */
		onTransportPress: function(oEvent) {
			var oItem = oEvent.getParameter("listItem");
			if (oItem) {
				var sId = oItem.getBindingContext().getProperty("transport");
				this.byId("mapManager").goToMarker(sId);
			}
		},
		
		/**
		 * Event handler for pressing a link to a location.
		 * @param	{Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onLocationPress: function(oEvent) {
			this.byId("mapManager").goToMarker(oEvent.getSource().data("id"));
		},
		
		/** 
		 * Event handler for when the user presses the "X" button on the side content.
		 * Closes the side content and notifies the map manager to clear the selection.
		 */
		onCloseSizeContent: function() {
			this._hideSideContent(true);
		},
		
		/**
		 * Called when a transport marker is pressed.
		 * Rebinds the transport details panel. Loads the route if necessary.
		 * @param	{Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onTransportMarkerPress: function(oEvent) {	
			var oModel = this.getModel(),
				sPath = "/" + oModel.createKey("Readings", {id: oEvent.getParameter("reading")});
			this._onMarkerPress(2);
			this.byId("readingDetails").bindElement(sPath, {
				expand: "Transport,Transport/Route/ToLocation,Transport/Route/FromLocation"
			});
			if (!oEvent.getParameter("alreadySelected")) {
				this._clearRoute();
				this._loadRoute(oEvent.getParameter("transport"));
			}
		},
		
		/**
		 * Called when a location marker is pressed.
		 * Rebinds the location links table and the location details panel.
		 * @param	{Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onLocationMarkerPress: function(oEvent) {
			var oModel = this.getModel(),
				sLocationPath = "/" + oModel.createKey("Locations", {id: oEvent.getParameter("location")}),
				sLinkPath = "/" + oModel.createKey("LocationLinkParameters", {
					"IV_LOCATION":	oEvent.getParameter("location"),
					"IV_DATE":		this._lastDate
				});
			this._clearRoute();
			this._onMarkerPress(1);
			this.byId("lstLocationLinks").bindElement(sLinkPath);
			this.byId("locationDetails").bindElement(sLocationPath);
		},
		
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		
		/**
		 * Hide the content of the side panel.
		 * The function can also notify the map manager to clear the selection.
		 * @private
		 * @param	{boolean}	bNotifyManager	Flag indicating if the manager should be notified.
		 * @returns {void}	
		 */
		_hideSideContent: function(bNotifyManager) {
			this.getModel("main").setProperty("/type", -1);
			var oCenter = this._map.getCenter();
			google.maps.event.trigger(this._map, "resize");
			this._map.setCenter(oCenter);
			if (bNotifyManager === true) {
				this.byId("mapManager").clearSelection();            
			}
		},
		
		/**
		 * Helper method which manages the side content when a marker is pressed.
		 * @private
		 * @param	{integer}	iNewType	The type of the pressed marker. 1 for locations, 2 for transports.
		 * @returns {void}
		 */
		_onMarkerPress: function(iNewType) {
			var iType = this.getModel("main").getProperty("/type");
			this.getModel("main").setProperty("/type", iNewType);
			if (this.byId("sideContent").getCurrentBreakpoint() === "S") {
				this.byId("sideContent").toggle();
			}
			if (iType < 0) {
				var oCenter = this._map.getCenter();
				google.maps.event.trigger(this._map, "resize");
				this._map.setCenter(oCenter);
			}
		},
		
		/**
		 * Loads a route to display it.
		 * @private
		 * @param	{string}	sTransportId	The id of the transport.
		 * @returns {void}	
		 */
		_loadRoute: function(sTransportId) {
			var oMap = this._map;
			$.ajax({
				method: "GET",
				url:	"/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsjs", 
				data: {
					entity:	"Transport",
					id:		sTransportId
				}, 
				dataType: "json",
				success: function(oData){
					if (oData) {
						oMap.data.addGeoJson({
							type: "Feature",
							geometry: oData
						});
					}
				}
			});
		},
		
		/**
		 * Clears the route from the map.
		 * @private
		 */
		_clearRoute: function() {
			this._map.data.forEach(function(feature) {
		        this._map.data.remove(feature);
		    }.bind(this));
		},
		
		/** 
		 *  Builds the map manager. 
		 *  @private 
		 */
		_createMapManager: function() {
			var oMapManager = new MapManager(this.createId("mapManager"), {
				googleMap: this._map,
				locationPress: [this.onLocationMarkerPress, this],
				transportPress: [this.onTransportMarkerPress, this],
				selectionRemoved: [function(){
					this._hideSideContent(false);
					this._clearRoute();
				}, this]
			});
			this.getView().addDependent(oMapManager);
			oMapManager.bindLocations({
				path:	"/ExpandedLocations",
				template: new Marker({
					key:		"{id}",
					detailKey:	"{id}",
					title:		"{name}",
					visible:	true,
					latitude: {
						path:		"latitude",
						formatter:	parseFloat
					},
					longitude: {
						path:		"longitude",
						formatter:	parseFloat
					}
				})
			});
			oMapManager.bindTransports({
				path:	"/Transports",
				template: new Marker({
					key:	"{id}",
					icon:	$.sap.getModulePath("diploma.tracking.overview.images", "/red-dot.png"),
					title:	"{description}",
					visible: "{main>/filters/2/selected}"
				})
			});
		}
		
	});
});