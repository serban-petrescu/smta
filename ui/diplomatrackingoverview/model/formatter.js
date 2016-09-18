sap.ui.define([
	"sap/ui/core/format/DateFormat"
	], function(DateFormat) {
	"use strict";
	
	var _dInstance = DateFormat.getInstance({pattern: "dd.MM.yyyy"});
	var _dtInstance = DateFormat.getInstance({pattern: "dd.MM.yyyy HH:mm:ss"});
	
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
		 * Formats a date.
		 * @public
		 * @param {any}	aValue	The value to be formatted.
		 * @returns {string}	The formatted date.	
		 */
		date: function(aValue) {
			if (typeof aValue === "object") {
				return _dInstance.format(aValue);
			}
			else {
				return _dInstance.format(new Date(aValue));
			}
		},
		
		/**
		 * Formats a date and time.
		 * @public
		 * @param {any}	aValue	The value to be formatted.
		 * @returns {string}	The formatted date and time.	
		 */
		dateTime: function(aValue) {
			if (typeof aValue === "object") {
				return _dtInstance.format(aValue);
			}
			else {
				return _dtInstance.format(new Date(aValue));
			}
		}

	};

});