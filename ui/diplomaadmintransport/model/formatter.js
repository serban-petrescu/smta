sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			
			/**
			 * Formats the limit label.
			 * @param	{string|double}	dLower	The lower bound.
			 * @param	{string|upper}	dUpper	The upper bound.
			 * @param	{string}		sUnit	The measure unit.
			 * @returns {string}	The limit label text.
			 */
			limitLabel: function(dLower, dUpper, sUnit) {
				if (dLower === null || dLower === undefined) {
					return this.getResourceBundle().getText("lowerThan", [dUpper, sUnit]);
				}
				else if (dUpper === null || dUpper === undefined) {
					return this.getResourceBundle().getText("greaterThan", [dLower, sUnit]);
				} 
				else {
					return this.getResourceBundle().getText("between", [dLower, dUpper, sUnit]);
				}
			},
			
			/**
			 * Formats the person label.
			 * @param	{string}	sName	The person's name.
			 * @param	{string}	sEmail	The person's email.
			 * @returns {string}	The person label text.
			 */
			personLabel: function(sName, sEmail) {
			    if (sName && sEmail) {
			        return this.getResourceBundle().getText("personLabel", [sName, sEmail]);
			    }
			    else {
			        return sName || sEmail || "";
			    }
			},
			
			/**
			 * Formats the detail view's title.
			 * @param	{string}	sDescription	The transport's description.
			 * @returns {string}	The detail view's title.
			 */
			detailTitle: function(sDescription) {
				if (sDescription) {
					return this.getResourceBundle().getText("detailTitle", [sDescription]);
				}
				else {
					return this.getResourceBundle().getText("detailTitleNoTransport");
				}
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

	}
);