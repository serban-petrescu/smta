sap.ui.define([], function() {
	"use strict";

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