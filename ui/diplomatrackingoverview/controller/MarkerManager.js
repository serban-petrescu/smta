/* global google */
sap.ui.define([], function() {
	"use strict";
	var aFree = [];
	
	return {
		/**
		 * Gets a "new" marker. This marker can either be created or taken from the "free" markers.
		 * @returns {object}	A google maps marker.
		 */
		create: function() {
			var oMarker;
			if (aFree.length) {
				oMarker = aFree.pop();
			}
			else {
				oMarker = new google.maps.Marker(); 
			}
			return oMarker;
		},
		
		/**
		 * Marks a marker as being free. The marker can then be reused by subsequent create calls.
		 * @param	{object}	oMarker	A google maps marker.
		 * @returns {void}
		 */
		remove: function(oMarker) {
			aFree.push(oMarker);
			oMarker.setMap(null);
			google.maps.event.clearListeners(oMarker, "mousedown");
		}
		
	};
});