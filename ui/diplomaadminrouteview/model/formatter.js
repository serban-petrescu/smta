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
			 * Formats the details title.
			 * @param	{string}	sWithRoute		Translatable text with placeholder for route name.
			 * @param	{string}	sWithotuRoute	Translatable text with no placeholder.
			 * @param	{string}	sRouteName		Route name.
			 * @returns {string}	The detail view title.
			 */
			detailTitle: function(sWithRoute, sWithoutRoute, sRouteName){
				if (sRouteName) {
					return jQuery.sap.formatMessage(sWithRoute, [sRouteName]);
				}
				else {
					return sWithoutRoute;
				}
			}
		};

	}
);