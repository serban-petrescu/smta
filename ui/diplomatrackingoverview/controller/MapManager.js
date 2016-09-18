sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";
	
	/**
	 * Helper control for managing the map and it's markers. 
	 * @class
	 * @name MapManager
	 */
	return Control.extend("diploma.tracking.overview.controller.MapManager", {
		metadata: {
			properties: {
				googleMap: {type: "object"}
			},
			aggregations: {
				"locations": {
					singularName: "location", 
					multiple: true, 
					type: "diploma.tracking.overview.controller.Marker",
					bindable: true
				},
				"transports": {
					singularName: "transport", 
					multiple: true, 
					type: "diploma.tracking.overview.controller.Marker",
					bindable: true
				},
				"locationDetails": {
					singularName: "locationDetail", 
					multiple: true, 
					type: "diploma.tracking.overview.controller.MarkerBase",
					bindable: true
				},
				"transportDetails": {
					singularName: "transportDetail", 
					multiple: true, 
					type: "diploma.tracking.overview.controller.MarkerBase",
					bindable: true
				}
			},
			events: {
				locationPress: {
					location: "string"
				},
				transportPress: {
					transport: "string",
					reading: "string",
					alreadySelected: "boolean"
				},
				selectionRemoved: {}
			}
		},
		
		/** Lifecycle hook. Initializes the control. */
		init: function() {
			this._mMarkers = {};
			this._selectedKey = "";
		},
		
		/**
		 * Adds a location to the location aggregation.
		 * Saves the location in the marker map and attaches a press event handler.
		 * @override
		 * @param	{Marker}	oLocation	The location marker to be added.
		 * @returns {void}
		 */
		addLocation: function(oLocation) {
			this.addAggregation("locations", oLocation);
			this._mMarkers[oLocation.getKey()] = oLocation;
			oLocation.attachPress(function(oEvent){
				var oSource = oEvent.getSource();
				this._selectedKey = oSource.getKey();
				this.fireEvent("locationPress", {
					location: oSource.getKey()
				});
			}, this);
		},
		
		/**
		 * Adds a transport to the transport aggregation.
		 * Saves the transport in the marker map and attaches a press event handler.
		 * @override
		 * @param	{Marker}	oTransport	The transport marker to be added.
		 * @returns {void}
		 */
		addTransport: function(oTransport) {
			this.addAggregation("transports", oTransport);
			this._mMarkers[oTransport.getKey()] = oTransport;
			oTransport.attachPress(function(oEvent){
				var oSource = oEvent.getSource();
				this.fireEvent("transportPress", {
					transport: oSource.getKey(),
					reading:   oSource.getDetailKey(),
					alreadySelected: this._selectedKey === oSource.getKey()
				});
				this._selectedKey = oSource.getKey();
			}, this);
		},
		
		/**
		 * Adds a location detail to the location detail aggregation.
		 * Updates the corresponding marker with the detail information.
		 * @override
		 * @param	{MarkerBase}	oDetail	The location marker data.
		 * @returns {void}
		 */
		addLocationDetail: function(oDetail) {
			this.addAggregation("locationDetails", oDetail);
			if (this._mMarkers.hasOwnProperty(oDetail.getKey())) {
				this._mMarkers[oDetail.getKey()].setData(oDetail);                         
			}
			if (this._selectedKey === oDetail.getKey()) {
				if (oDetail.getVisible()) {
					this.fireEvent("locationPress", {
						location:	oDetail.getKey()
					});
				}
				else {
					this._selectedKey = "";
					this.fireEvent("selectionRemoved");
				}
			}
		},
		
		/**
		 * Adds a transport detail to the transport detail aggregation.
		 * Updates the corresponding marker with the detail information.
		 * @override
		 * @param	{MarkerBase}	oDetail	The transport marker data.
		 * @returns {void}
		 */
		addTransportDetail: function(oDetail) {
			this.addAggregation("transportDetails", oDetail);
			if (this._mMarkers.hasOwnProperty(oDetail.getKey())) {
				this._mMarkers[oDetail.getKey()].setData(oDetail);                         
			}
			if (this._selectedKey === oDetail.getKey()) {
				if (oDetail.getVisible()) {
					this.fireEvent("transportPress", {
						transport:	oDetail.getKey(),
						reading:	oDetail.getDetailKey(),
						alreadySelected: true
					});
				}
				else {
					this._selectedKey = "";
					this.fireEvent("selectionRemoved");
				}
			}
		},
		
		/**
		 * Clears the currently selected marker.
		 */
		clearSelection: function() {
			this._selectedKey = null;
		},
		
		/**
		 * Centers the map arround a marker.
		 * @param	{Marker|string}	oMarker	The marker or the key of the marker.
		 * @returns {void}
		 */
		goToMarker: function(oMarker) {
			var oMap = this.getGoogleMap();
			if (!oMap) {
				return;
			}
			if (typeof oMarker === "string") {
				if (this._mMarkers.hasOwnProperty(oMarker)) {
					oMarker = this._mMarkers[oMarker];
				}
				else {
					return;
				}
			}
			oMap.setZoom(9);
			oMap.setCenter(oMarker.getPosition());
			if (oMarker.isCurrentlyVisible()) {
				oMarker.fireEvent("press");
			}
		},
		
		/**
		 * Gets data out of all the currently visible markers.
		 * @returns {object[]}	An array of marker data (key, icon and title). 
		 */
		getVisibleMarkers: function() {
			var aMarkers = [],
				aTransports = this.getTransports(),
				aLocations = this.getLocations(),
				i;
			for (i = 0; aLocations && i < aLocations.length; ++i) {
				if (aLocations[i].isCurrentlyVisible()) {
					aMarkers.push({
						key:	aLocations[i].getKey(),
						icon:	aLocations[i].getIcon(),
						title:	aLocations[i].getTitle()
					});
				}
			}
			for (i = 0; aTransports && i < aTransports.length; ++i) {
				if (aTransports[i].isCurrentlyVisible()) {
					aMarkers.push({
						key:	aTransports[i].getKey(),
						icon:	aTransports[i].getIcon(),
						title:	aTransports[i].getTitle()
					});
				}
			}
			return aMarkers;
		}
	});
});