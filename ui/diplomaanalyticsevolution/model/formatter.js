sap.ui.define(["sap/ui/core/format/DateFormat"], function(DateFormat) {
	"use strict";
	var oInstance = DateFormat.getDateTimeInstance({
		style: "medium"
	});
	
	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function(sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		
		/**
		 * Formats a timestamp to the medium locale-specific format.
		 * @public
		 * @params	{Date|int}	dTimestamp	The timestamp.
		 * @returns {string}	The formatted timestamp.
		 */
		tsToDateTimeMedium: function(dTimestamp) {
			if (typeof dTimestamp === "number") {
				dTimestamp = new Date(dTimestamp);
			}
			return oInstance.format(dTimestamp);
		}

	};

});