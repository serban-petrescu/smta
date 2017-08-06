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
		},
		
		/**
		 * Formats the title of the page.
		 */
		title: function(sTitleNothingSelected, sTitleWithPlaceholder, sName) {
			if (sName) {
				return jQuery.sap.formatMessage(sTitleWithPlaceholder, [sName]);
			}
			else {
				return sTitleNothingSelected;
			}
		},
		
		icon: function(sName) {
			return jQuery.sap.getModulePath("diploma.tracking.trace.images", "/" + sName);
		},
		
		messageTypeStatus: function(sType) {
			switch(sType) {
				case "E": return "Error";
				case "W": return "Warning";
				case "S": return "Success";
				default: return "None";
			}
		},
		
		messageTypeText: function(sType) {
			var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			switch(sType) {
				case "E": return i18n.getText("txtMessageErrorText");
				case "W": return i18n.getText("txtMessageWarningText");
				case "S": return i18n.getText("txtMessageSuccessText");
				default: return i18n.getText("txtMessageNoneText");
			}
		},
		
		reading: function(sTitle, sTitleWithPlaceholders, iTimestamp) {
			if (iTimestamp) {
				return jQuery.sap.formatMessage(sTitleWithPlaceholders, [this.formatter.dateTime(iTimestamp)]);
			}
			else {
				return sTitle;
			}
		},
		
		nameOrDescription: function(sName, sDescription) {
			return sDescription || sName || "";
		}

	};

});