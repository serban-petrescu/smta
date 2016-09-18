sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/ColumnListItem",
	"sap/m/Text",
	"sap/m/Token",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/v2/ODataModel",
	"diploma/analytics/forecast/model/formatter"
], function(Controller, ColumnListItem, Text, Token, JSONModel, Filter, FilterOperator, ODataModel, formatter) {
	"use strict";
	
	return Controller.extend("diploma.analytics.forecast.controller.ValueHelp", {
		
		formatter: formatter,
		
		/** Initialization lifecycle hook. */
		onInit: function() {
			this.getView().setModel(new JSONModel(), "view");
			this.getView().setModel(new ODataModel("/destinations/INET_HTTP_DIPLOMA_J0I/services/primary.xsodata/"));
		},
		
		/**
		 * Attaches an event listener on the "select" event.
		 * This event is a proxy event for the press event of the list items.
		 * @param   {function}  fnHandler   Callback function.
		 * @param   {object=}   oListener   Listener object on which the handler is called.    
		 * @returns {void}
		 */
		attachSelect: function(fnHandler, oListener) {
		    this.attachEvent("select", fnHandler, oListener);
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
		
		/** Called when the user presses the cancel button. Closes the dialog. */
		onCancel: function() {
		    if (this.fireEvent("cancel", {}, true)) {
		        this.close();
		    }
		},
		
		/**
		 * Called when the users selects an intem from the results table.
		 * Fires the selection event and closes the dialog.
		 * @param {Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onItemPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext(),
				sId = oContext.getProperty("id"),
				sField = this.getView().getModel("view").getProperty("/simple/field"),
				sName = oContext.getProperty(sField);
		    if (this.fireEvent("select", {id: sId, name: sName}, true)) {
		        this.close();
		    }
		},
		
		/**
		 * Called when the user triggers a search action on one of the search fields.
		 * Filters the result table.
		 * @returns {void}
		 */
		onSearch: function() {
			 var oModel = this.getView().getModel("view"),
		         aFilters = [],
		         sQuery,
		         i,
		         aComplex = oModel.getProperty("/complex");
		         
			sQuery = oModel.getProperty("/simple/value");
		    if (sQuery) {
		        aFilters.push(new Filter(oModel.getProperty("/simple/field"), FilterOperator.Contains, sQuery));
		    }
		    
		    if (oModel.getProperty("/advanced")) {
		    	for (i = 0; i < aComplex.length; ++i) {
		    		if (aComplex[i].value) {
		        		aFilters.push(new Filter(aComplex[i].field, FilterOperator.Contains, aComplex[i].value));
		    		}
		    	}
		    }
		    
		    this.byId("tblSearchMain").getBinding("items").filter(aFilters, "Application");
		},
		
		/**
		 * Adds the given style class directly to the dialog.
		 * @param   {string}    sStyleClass     The style class to be added.
		 * @returns {void}
		 */
		addStyleClass: function(sStyleClass) {
		    this.byId("dlgValueHelp").addStyleClass(sStyleClass);
		},
		
		/**
		 * Opens the dialog. Builds the model and binds the table.
		 * @param	{string}	sEntity		The entity name.
		 * @returns {void}
		 */
		open: function(sEntity) {
			this._buildModel(sEntity);
			this._bindTable();
			this.byId("dlgValueHelp").open();
		},
		
		/** Toggles between basic and advanced search. */
		onToggle: function() {
			var oModel = this.getView().getModel("view");
			oModel.setProperty("/advanced", !oModel.getProperty("/advanced"));
		},
		
		/** Close the dialog. */
		close: function() {
			this.byId("dlgValueHelp").close();
		},
		
		/** 
		 * Binds the search result table lines to the current entity. 
		 * @private
		 * @returns {void}
		 */
		_bindTable: function() {
			var oModel = this.getView().getModel("view"),
				aDisplay = oModel.getProperty("/display"),
				i,
				aCells = [],
				mParameters = oModel.getProperty("/expand") ? {
					expand:	oModel.getProperty("/expand")
				} : {};
			for (i = 0; i < aDisplay.length; ++i) {
				aCells.push(new Text({text: "{" + aDisplay[i].field + "}" }));
			}
			this.byId("tblSearchMain").bindItems({
				path:		"/" + oModel.getProperty("/entitySet"),
				parameters: mParameters,
				template:	new ColumnListItem({
					type:	"Active",
					press:	this.onItemPress.bind(this),
					cells:	aCells
				})
			});
		},
		
		/**
		 * Builds the model based on the current entity.
		 * @private
		 * @param	{string}	sEntity		The entity name.
		 * @returns {void}
		 */
		_buildModel: function(sEntity) {
			var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			switch (sEntity) {
				case "Route":
					this.getView().getModel("view").setData({
						advanced: false,
						name:		i18n.getText("filterTypeRoute"),
						entitySet:	"Routes",
						entity:		"Route",
						hasAdvanced: true,
						expand:		"FromLocation,ToLocation",
						simple: {
							placeholder:	i18n.getText("seaSimplePlaceholderName"),
							value:			"",
							field:			"name"
						},
						complex: [{
							label:			i18n.getText("lblRouteLocationFromText"),
							value:			"",
							field:			"FromLocation/name"
						},{
							label:			i18n.getText("lblRouteLocationToText"),
							value:			"",
							field:			"ToLocation/name"
						}],
						display: [{
							header:			i18n.getText("colRouteNameHeader"),
							field:			"name"
						},{
							header:			i18n.getText("colLocationFromHeader"),
							field:			"FromLocation/name"
						},{
							header:			i18n.getText("colLocationToHeader"),
							field:			"ToLocation/name"
						}]
					});	
					break;
				case "Schedule":
					this.getView().getModel("view").setData({
						advanced: false,
						name:		i18n.getText("filterTypeSchedule"),
						entitySet:	"Schedules",
						entity:		"Schedule",
						expand:		"Route",
						hasAdvanced: true,
						simple: {
							placeholder:	i18n.getText("seaSimplePlaceholderName"),
							value:			"",
							field:			"name"
						},
						complex: [{
							label:			i18n.getText("lblScheduleRouteNameText"),
							value:			"",
							field:			"Route/name"
						}],
						display: [{
							header:			i18n.getText("colScheduleNameHeader"),
							field:			"name"
						},{
							header:			i18n.getText("colScheduleRouteHeader"),
							field:			"Route/name"
						}]
					});	
					break;
				case "Person":
					this.getView().getModel("view").setData({
						advanced: false,
						name:		i18n.getText("filterTypePerson"),
						entitySet:	"Persons",
						entity:		"Person",
						expand:		"Organization",
						hasAdvanced: true,
						simple: {
							placeholder:	i18n.getText("seaSimplePlaceholderName"),
							value:			"",
							field:			"name"
						},
						complex: [{
							label:			i18n.getText("lblPersonEmailText"),
							value:			"",
							field:			"email"
						},{
							label:			i18n.getText("lblPersonOrganizationText"),
							value:			"",
							field:			"Organization/name"
						}],
						display: [{
							header:			i18n.getText("colPersonNameHeader"),
							field:			"name"
						},{
							header:			i18n.getText("colPersonEmailHeader"),
							field:			"email"
						},{
							header:			i18n.getText("colPersonOrganizationHeader"),
							field:			"Organization/name"
						}]
					});	
					break;
				case "Organization":
					this.getView().getModel("view").setData({
						advanced: false,
						name:		i18n.getText("filterTypeOrganization"),
						entitySet:	"Organizations",
						entity:		"Organization",
						hasAdvanced: false,
						simple: {
							placeholder:	i18n.getText("seaSimplePlaceholderName"),
							value:			"",
							field:			"name"
						},
						complex: [],
						display: [{
							header:			i18n.getText("colOrganizationNameHeader"),
							field:			"name"
						}]
					});	
					break;
			}
		}
		
	});
});