sap.ui.define([
	"diploma/analytics/evolution/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("diploma.analytics.evolution.controller.TransportValueHelp", {
		
		/**
		 *	Flag indicating that the value help was not yet opened at all.
		 *  @private
		 *  @type {boolean}
		 */
		_initial: true,
		
		/** Lifecycle method for initialization. */
		onInit: function() {
		    this.setModel(new JSONModel(), "view");
		    this._setInitialModelData();
		},
		
		_setInitialModelData: function() {
		    this.getModel("view").setData({
		        transport: {
		            name: "",
		            id:   null
		        },
		        measure: null,
		        advanced: false,
		        search: {
		            description: "",
		            route: {
		                name: "",
		                from: "",
		                to:   ""
		            },
		            person: {
		                organization: "",
		                name: ""
		            },
		            waypoints: {
		                name:   "",
		                country:"",
		                region: ""
		            },
		            schedule: {
		                name:   "",
		                start:  null,
		                low:    "",
		                high:   ""
		            }
		        }
		    });
		},
		
		/**
		 * Adds the given style class directly to the dialog.
		 * @param   {string}    sStyleClass     The style class to be added.
		 * @returns {void}
		 */
		addStyleClass: function(sStyleClass) {
		    this.byId("vhdTransport").addStyleClass(sStyleClass);
		},
		
		/** Resets the view. */
		clear: function() {
		    this._setInitialModelData();
		    this.byId("selMeasure").unbindElement();
		    this.byId("tblSearchMain").getBinding("items").filter([], "Application");
		},
		
		/** Opens the dialog. Initializes the model. */
		open: function() {
			if (this._initial) {
				this._initial = false;
				this.clear();
			}
	        this.byId("vhdTransport").open();
		},
		
		/** Closes the dialog. */
		close: function() {
		    this.byId("vhdTransport").close();
		},
		
		/** Toggles between basic and advanced searching. */
		onToggle: function() {
		    this.getModel("view").setProperty("/advanced", !this.getModel("view").getProperty("/advanced"));
		},
		
		/** Called when the user presses the cancel button. Closes the dialog. */
		onCancel: function() {
		    if (this.fireEvent("cancel", {}, true)) {
		        this.close();
		    }
		},
		
		/** Called when the user presses the confirm button */
		onConfirm: function() {
		    var oModel = this.getModel("view"),
		        mParams = {
		            measure:    null,
		            transport:  oModel.getObject("/transport") 
		        },
		        oItem = this.byId("selMeasure").getSelectedItem();
		    if (oItem) {
		        mParams.measure = {
		           id:      oItem.getBindingContext().getProperty("id"),
		           name:    oItem.getBindingContext().getProperty("name"),
		           unit:    oItem.getBindingContext().getProperty("unit")
		        };
		    }
		    if (this.fireEvent("confirm", mParams, true)) {
		        this.close();
		    }
		},
		
		/**
		 * Attaches an event listener on the "confirm" event.
		 * This event is fired when the user presses the confirm button.
		 * @param   {function}  fnHandler   Callback function.
		 * @param   {object=}   oListener   Listener object on which the handler is called.    
		 * @returns {void}
		 */
		attachConfirm: function(fnHandler, oListener) {
		    this.attachEvent("confirm", fnHandler, oListener);
		},
		
		/**
		 * Attaches an event listener on the "cancel" event.
		 * This event is fired when the user presses the cancel button.
		 * @param   {function}  fnHandler   Callback function.
		 * @param   {object=}   oListener   Listener object on which the handler is called.    
		 * @returns {void}
		 */
		attachCancel: function(fnHandler, oListener) {
		    this.attachEvent("cancel", fnHandler, oListener);
		},
		
		/** 
		 * Handler method which is called when an item is pressed. 
		 * Changes the binding of the select input.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void} 
		 */
		onSelect: function(oEvent) {
		    var oContext = oEvent.getSource().getBindingContext();
		    this.byId("selMeasure").bindElement(oContext.getPath());
		    this.getModel("view").setProperty("/transport/id", oContext.getProperty("id"));
		    this.getModel("view").setProperty("/transport/name", oContext.getProperty("Transport/description"));
		},
		
		/** Common handler method for all search events of the search fields. Performs the list filtering.*/
		onSearch: function() {
		    var oModel = this.getModel("view"),
		        aFilters = [],
		        sQuery,
		        /**
		         * Helper function. Adds a new "contains" filter to the filter list.
		         * @param   {string}    sViewProperty   The path in the view model where the query is stored.
		         * @param   {string}    sOdataProperty  The OData model path on which the filtering is done.
		         * @param	{boolean}	bEscape			Flag indicating the the value should be escaped.
		         * @returns {void}
		         */
		        fnAddContainsFilter = function(sViewProperty, sOdataProperty, bEscape) {
		            sQuery = oModel.getProperty(sViewProperty);
        		    if (sQuery) {
        		        aFilters.push(new Filter(sOdataProperty, FilterOperator.Contains, 
        		        	bEscape ? "'" + sQuery + "'" : sQuery));
        		    }
		        },
		        /**
		         * Helper function. Increments the given date by one day.
		         * @param   {Date}  oDate   The input date.
		         * @returns {Date}  The new, incremented date.
		         */
		        fnAddOneDay = function(oDate) {
		            return new Date(oDate.getFullYear(),oDate.getMonth(),oDate.getDate()+1);
		        };
		        
		    fnAddContainsFilter("/search/description", "Transport/description");
		    if (oModel.getProperty("/advanced")) {
		        fnAddContainsFilter("/search/route/name", "Transport/Route/name", true);
		        fnAddContainsFilter("/search/route/from", "fromName");
		        fnAddContainsFilter("/search/route/to", "toName");
		        
		        fnAddContainsFilter("/search/waypoints/name", "waypointNames");
		        fnAddContainsFilter("/search/waypoints/country", "waypointCountries");
		        fnAddContainsFilter("/search/waypoints/region", "waypointRegions");
		        
		        fnAddContainsFilter("/search/schedule/name", "Transport/Schedule/name", true);
	            sQuery = oModel.getProperty("/search/schedule/low");
    		    if (sQuery && !isNaN(sQuery)) {
    		        aFilters.push(new Filter("totalDuration", FilterOperator.GE, parseInt(sQuery, 10)));
    		    }
	            sQuery = oModel.getProperty("/search/schedule/high");
    		    if (sQuery && !isNaN(sQuery)) {
    		        aFilters.push(new Filter("totalDuration", FilterOperator.LE, parseInt(sQuery, 10)));
    		    }
    		    sQuery = oModel.getProperty("/search/schedule/start");
    		    if (sQuery) {
    		        aFilters.push(new Filter("Transport/tWhen", FilterOperator.BT, sQuery, fnAddOneDay(sQuery)));
    		    }
		        
		        fnAddContainsFilter("/search/person/name", "persons");
		        fnAddContainsFilter("/search/person/organization", "organizations");
		    }
		    
		    this.byId("tblSearchMain").getBinding("items").filter(aFilters, "Application");
		}
		
	});
});