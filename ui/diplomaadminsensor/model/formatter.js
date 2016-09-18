sap.ui.define([], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
		
		
		/**
		 * Formats the display text for measures.
		 * @param	{string}	sText	The translatable text with placeholders.
		 * @param	{string}	sName	The name of the measure.
		 * @param	{string}	sUnit	The measure's unit.
		 * @returns	The measure display text.
		 */
		measureText: function(sText, sName, sUnit) {
			if (!sName && !sUnit) {
				return "";
			}
			if (!sUnit) {
				return sName;
			}
			return jQuery.sap.formatMessage(sText, [sName, sUnit || ""]);
		}
		
	};

});