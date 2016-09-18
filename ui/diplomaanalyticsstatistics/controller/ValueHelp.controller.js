sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/ColumnListItem",
	"sap/m/Text",
	"sap/m/Token",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"diploma/analytics/statistics/model/formatter"
], function(Controller, ColumnListItem, Text, Token, JSONModel, Filter, FilterOperator, formatter) {
	"use strict";
	
	return Controller.extend("diploma.analytics.statistics.controller.ValueHelp", {
		
		formatter: formatter,
		
		/** Initialization lifecycle hook. */
		onInit: function() {
			this.getView().setModel(new JSONModel(), "view");
		},
		
		/**
		 * Attaches an event listener on the "confirm" event.
		 * This event is a proxy event for the press event of the list items.
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
		
		/** Called when the user presses the confirm button */
		onConfirm: function() {
		    var oModel = this.getView().getModel("view"),
		        aTokens = this.byId("tknSelection").getTokens(),
		        mParams = {
		            entity: 	oModel.getProperty("/entity"),
		            selection:	[]
		        };
		    if (aTokens) {
		        aTokens.forEach(function(oToken) {
		            mParams.selection.push({
		                key:    oToken.getKey(),
		                text:   oToken.getText()
		            });
		        });
		    }
		    if (this.fireEvent("confirm", mParams, true)) {
		        this.close();
		    }
		},
		
		/** Called when the user presses the cancel button. Closes the dialog. */
		onCancel: function() {
		    if (this.fireEvent("cancel", {}, true)) {
		        this.close();
		    }
		},
		
		/**
		 * Called when the users selects an intem from the results table.
		 * Adds a new token to the tokenizer.
		 * @param {Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onItemPress: function(oEvent) {
			var oContext = oEvent.getSource().getBindingContext(),
				sId = oContext.getProperty("id"),
				sField = this.getView().getModel("view").getProperty("/simple/field"),
				aTokens,
				i;
				
			aTokens = this.byId("tknSelection").getTokens();
			if (aTokens) {
				for (i = 0; i < aTokens.length; ++i) {
					if (aTokens[i].getKey() === sId) {
						return;
					}
				}
			}
			
			this.byId("tknSelection").addToken(new Token({
				key:	sId,
				text:	oContext.getProperty(sField)
			}));
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
			this.byId("tknSelection").removeAllTokens();
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
				case "Transport":
					this.getView().getModel("view").setData({
						advanced: false,
						name:		i18n.getText("filterTypeTransport"),
						entitySet:	"Transports",
						entity:		"Transport",
						hasAdvanced: true,
						expand:		"Route,Schedule",
						simple: {
							placeholder:	i18n.getText("seaSimplePlaceholderDescription"),
							value:			"",
							field:			"description"
						},
						complex: [{
							label:			i18n.getText("lblTransportRouteText"),
							value:			"",
							field:			"Route/name"
						},{
							label:			i18n.getText("lblTransportScheduleText"),
							value:			"",
							field:			"Schedule/name"
						}],
						display: [{
							header:			i18n.getText("colTransportDescHeader"),
							field:			"description"
						},{
							header:			i18n.getText("colTransportRouteHeader"),
							field:			"Route/name"
						},{
							header:			i18n.getText("colTransportScheduleHeader"),
							field:			"Schedule/name"
						}]
					});	
					break;
			}
		}
		
	});
});