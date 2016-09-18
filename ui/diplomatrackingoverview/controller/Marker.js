sap.ui.define([
	"diploma/tracking/overview/controller/MarkerBase",
	"diploma/tracking/overview/controller/MarkerManager"
], function(MarkerBase, MarkerManager) {
	"use strict";
	
	/**
	 * Helper function for checking if a value is "set" (not null or undefined).
	 * @param	{any}	aValue	The value to be checked.
	 * @returns {boolean}	Flag indicating if the value is "set" or not.
	 */
	function isSet(aValue) {
		return aValue !== undefined && aValue !== null;
	}
	
	/**
	 * Helper function for checking if a value is "set" and has changed.
	 * @param	{any}	aPrev	The previous value.
	 * @param	{any}	aCurr	The current value.
	 * @returns {boolean}	Flag indicating if the current value is set and has changed.
	 */
	function hasChanged(aPrev, aCurr) {
		return isSet(aCurr) && (aPrev !== aCurr);
	}
	
	/**
	 * Class which encapsulates a google maps marker.
	 * @class
	 * @name Marker
	 */
	return MarkerBase.extend("diploma.tracking.overview.controller.Marker", {
		metadata: {
			events: {
				press: {}
			}
		},
		
		/**
		 * Setter method for the "visible" property.
		 * Also updates the underlying google maps marker.
		 * @override
		 * @param	{boolean}	bVisible	The new value of the visibility.
		 * @returns {void}
		 */
		setVisible: function(bVisible) {
			this.setProperty("visible", bVisible);
			this._updateVisible();
		},
		
		/**
		 * Gets the position of the marker.
		 * @return {LatLng}	The marker's position.
		 */
		getPosition: function() {
			return this._marker.getPosition();
		},
		
		/** Lifecycle hook. Creates the google map marker and adds the press event listener. */
		init: function() {
			this._marker = MarkerManager.create();
			this._marker.addListener("mousedown", this.fireEvent.bind(this, "press"));
			this._oBase = null;
		},
		
		/** Lifecycle hook. Removes the marker from the map. */
		exit: function() {
			MarkerManager.remove(this._marker);                         
		},
		
		/**
		 * Copies out the data from the given marker base. Only the "set" properties are transferred.
		 * The given marker base is linked with the current instance: a change in the marker base's 
		 * visibility affects the marker itself as well.
		 * @param	{MarkerBase}	oBase	The marker base which holds the data.
		 * @returns {void}
		 */
		setData: function(oBase) {
			var oThat = this;
			this._oBase = oBase;
			this._oBase.setVisible = function(bVisible) {
				this.setProperty("visible", bVisible);
				oThat._updateVisible();
			};
			if (isSet(oBase.getTitle())) {
				this.setProperty("title", oBase.getTitle());
			}
			if (isSet(oBase.getIcon())) {
				this.setProperty("icon", oBase.getIcon());
			}
			if (isSet(oBase.getLatitude())) {
				this.setProperty("latitude", oBase.getLatitude());
			}
			if (isSet(oBase.getLongitude())) {
				this.setProperty("longitude", oBase.getLongitude());
			}
			if (isSet(oBase.getDetailKey())) {
				this.setProperty("detailKey", oBase.getDetailKey());
			}
			this._copyToMarker();
		},
		
		/**
		 * Checks if the marker is visible on the map. This is not necessarily the same as the 
		 * visible property (because the linked marker base is also taken into account).
		 * @returns {boolean}	Flag indicating if the marker is visible.
		 */
		isCurrentlyVisible: function() {
			return this._marker.getMap() !== null;
		},
		
		/**
		 * Updates the visibility of the underlying marker based on the current properties and base.
		 * @private
		 */
		_updateVisible: function() {
			if (this._oBase && this._oBase.getVisible() && this.getVisible()) {
				if (!this.isCurrentlyVisible()) {
					this._marker.setMap(this.getParent().getGoogleMap());
				} 
			}
			else {
				this._marker.setMap(null);
			}
		},
		
		/**
		 * Copies the data from this instance to the google maps marker object.
		 * @private
		 */
		_copyToMarker: function() {
			this._updateVisible();
			if (hasChanged(this._marker.getTitle(), this.getTitle())) {
				this._marker.setTitle(this.getTitle());
			}
			if (hasChanged(this._marker.getIcon(), this.getIcon())) {
				this._marker.setIcon(this.getIcon());
			}
			var oPosition = this._marker.getPosition() || {lat: function(){}, lng: function(){}};
			if (hasChanged(oPosition.lat(), this.getLatitude()) || hasChanged(oPosition.lng(), this.getLongitude())) {
				this._marker.setPosition({
					lat:	this.getLatitude(),
					lng:	this.getLongitude()
				});
			}
		}
	});
});