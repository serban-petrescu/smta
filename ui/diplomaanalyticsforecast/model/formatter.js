sap.ui.define([], function() {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		number: function(sValue) {
			if (isNaN(sValue) || sValue === null) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		
		/**
		 * Formats a date.
		 * @public
		 * @param {date}    dValue  The date to be formatted.
		 * @returns {string}    The formatted date.
		 */
		date: function(dValue) {
		    var fixedDate = sap.ui.core.format.DateFormat.getDateInstance({style: "short"});
            return fixedDate.format(dValue);
		},
		
		/**
		 * Identity formatter.
		 */
		none: function(sValue) {
		    return sValue;
		},
		
		/**
		 * Replaces placeholders in a text.
		 * @public
		 * @param	{string}	sText	The text with placeholders.
		 * @param	{string...}	aValues	The values to replace the placeholders.
		 * @returns {string} The formatted string.
		 */
		formatMessage: function(sText) {
			return jQuery.sap.formatMessage(sText, Array.prototype.slice.call(arguments, 1));
		}

	};

});