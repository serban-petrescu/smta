sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function(JSONModel, Device) {
	"use strict";

	return {
        
        /**
         * Builds the model for storing the device characteristics.
         * @returns {JSONModel} The device model.
         */
		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		/**
		 * Builds the model for storing the request object.
		 * All the user inputs from the application have their value binded to this model.
		 * The data from this model can be used directly in a request to the backend.
		 * @returns {JSONModel} The request model.
		 */
		createRequestModel: function() {
			return new JSONModel({
				input:		{},
				control:	{},
				algorithm:	"ARIMA"
			});
		},
		
		/**
		 * Creates the data model which will store the results from the backend.
		 * @returns {JSONModel} The data model.
		 */
		createDataModel: function() {
		    var oModel = new JSONModel();
		    oModel.setSizeLimit(5000);
		    
		    /**
		     * Override for parsing the results by adding a new date column.
		     * This new column is obtained from the timestamp property.
		     * @param   {object}    oData   The new data for the model.
		     * @param   {boolean}   bForce  Whether or not to refresh the forcibly bindings.
		     * @returns {JSONModel} this.
		     */
		    oModel.setData = function(aData, bForce) {
		        if (aData && aData.result && aData.result.length) {
    		        for (var i = 0; i < aData.result.length; ++i) {
    		            aData.result[i].date = new Date(aData.result[i].timestamp);
    		        }
		        }
		        JSONModel.prototype.setData.call(this, aData, bForce);
		        return this;
		    };
			return oModel;        
		},
		
		/**
		 * Builds the main model. This model will simulataneusly contain the configuration data and 
		 * the avaliable measures and transports.
		 * @returns {JSONModel} The main model.
		 */
		createMainModel: function() {
			var oModel = new JSONModel({}),
				fnReplacei18n;
		    oModel.setSizeLimit(5000);
			$.ajax({
				method: 	"GET",
				url:		"/destinations/INET_HTTP_DIPLOMA_J0I/services/secondary.xsjs?entity=Measure&action=Read",
				dataType:	"json",
				success:	function(oData) {
					oModel.setData({
						measures:	oData
					}, true);
				}
			});
			$.ajax({
				method: 	"GET",
				url:		jQuery.sap.getModulePath("diploma.analytics.forecast.model", "/config.json"),
				dataType:	"json",
				success:	function(oData) {
					if (oModel._i18n) {
						fnReplacei18n(oModel._i18n, oData);
					}
					oModel.setData({
						config:		oData
					}, true);
				}
			});
			
			fnReplacei18n = function(i18n, oData) {
				if (typeof oData !== "object") {
					return;
				}
				for (var sKey in oData) {
					if (oData.hasOwnProperty(sKey)) {
						if (typeof oData[sKey] === "string") {
							if (oData[sKey].substring(0,5) === "i18n>") {
								oData[sKey] = i18n.getText(oData[sKey].substring(5));
							}
						} 
						else if (typeof oData[sKey] === "object") {
							fnReplacei18n(i18n, oData[sKey]);
						}
					}
				}
			};
			
			/**
			 * Convenience method for replacing the i18n references in the configuration.
			 * @param   {ResourceBundle}    i18n    The i18n resource model.
			 * @returns {void}
			 */
			oModel.seti18n = function(i18n) {
				if (this.getData() && this.getData().config) {
					fnReplacei18n(i18n, this.getData());
					this.refresh();
				}
				this._i18n = i18n;
			};
			return oModel;
		}

	};

});