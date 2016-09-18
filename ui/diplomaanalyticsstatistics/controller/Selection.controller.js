sap.ui.define([
	"diploma/analytics/statistics/controller/BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/m/Token",
	"diploma/analytics/statistics/model/formatter",
    "diploma/analytics/statistics/controller/FioriDependencies"
], function(BaseController, JSONModel, Token, formatter) {
	"use strict";
	return BaseController.extend("diploma.analytics.statistics.controller.Selection", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this._createViewModel();
			
			this.byId("vhdEntity").getController().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.byId("vhdEntity").getController().attachConfirm(this.onSelectFilterEntities, this);
		},
		
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/**
		 * Called when the user confirms the selection from the value help.
		 * Removes all previous selections and adds the new ones.
		 * @public
		 * @param	{Event}	oEvent	The event object.
		 * @returns {void}
		 */
		onSelectFilterEntities: function(oEvent) {
			var aSelection = oEvent.getParameter("selection"),
				sEntity = oEvent.getParameter("entity"),
				i,
				sInput = this.byId("mltFilterValues");
				
			sInput.removeAllTokens();	
			if (this.getModel("view").getProperty("/selection/filterType") === sEntity) {
				for (i = 0; i < aSelection.length; ++i) {
					sInput.addToken(new Token(aSelection[i]));
				}
			}
		},
		
		/** Called when the user presses the filter value help. Opens the value help view. */
		onValueHelpRequest: function() {
			this.byId("vhdEntity").getController().open(this.getModel("view").getProperty("/selection/filterType"));
		},
		
		/** Called when the user presses the "next" button. */
		onNextPress: function(){
			var oViewModel = this.getModel("view"),
				aTokens = this.byId("mltFilterValues").getTokens(),
				oData = jQuery.extend({}, oViewModel.getProperty("/selection"), {
					filterValue:	aTokens.map(function(oToken) {
						return oToken.getKey();
					}) 
				});
			oViewModel.setProperty("/busy", true);
			$.ajax({
				method: 	"POST",
				url:		"/destinations/INET_HTTP_DIPLOMA_J0I/services/secondary.xsjs?entity=Statistics",
				dataType:	"json",
				data:		JSON.stringify(oData),
				headers:	{ "X-CSRF-Token": this.getModel().getSecurityToken() },
				success:	function(oResult){
					this.getModel("data").setData(oResult);
					this.getOwnerComponent().getRouter().navTo("results");
				}.bind(this),
				error:		this.getOwnerComponent().getErrorHandler()
			}).always(oViewModel.setProperty.bind(oViewModel, "/busy", false));
		},
		
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},
		
		/** Called when the user changes the filter type. Removes all filter value selections. */
		onFilterTypeChange: function() {
			this.byId("mltFilterValues").removeAllTokens();	
		},
		
		/**
		 * Builds the view model.
		 * @private
		 * @returns {void}
		 */
		_createViewModel: function() {
			var i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			this.setModel(new JSONModel({
				busy: false,
				selection: {
					measure:	null,
					dataType:	"0",
					aggregationType: "None",
					timeType:	"None",
					filterType:	"None"
				},
				dataTypes: [{
					key:	"Value",
					text:	i18n.getText("valueSeries")
				}, {
					key:	"Count",
					text:	i18n.getText("countSeries")
				}, {
					key:	"Offset",
					text:	i18n.getText("offsetSeries")
				}],
				aggregationTypes: [{
					key:	"None",
					text:	i18n.getText("aggregationTypeNone")
				}, {
					key:	"Route",
					text:	i18n.getText("aggregationTypeRoute")
				}, {
					key:	"Schedule",
					text:	i18n.getText("aggregationTypeSchedule")
				}, {
					key:	"Person",
					text:	i18n.getText("aggregationTypePerson")
				}, {
					key:	"Organization",
					text:	i18n.getText("aggregationTypeOrganization")
				}, {
					key:	"Transport",
					text:	i18n.getText("aggregationTypeTransport")
				}],
				timeTypes: [{
					key:	"None",
					text:	i18n.getText("timeTypeNone")
				},{
					key:	"Day",
					text:	i18n.getText("timeTypeDay")
				}, {
					key:	"Month",
					text:	i18n.getText("timeTypeMonth")
				}, {
					key:	"Year",
					text:	i18n.getText("timeTypeYear")
				}],
				filterTypes: [{
					key:	"None",
					text:	i18n.getText("filterTypeNone")
				}, {
					key:	"Route",
					text:	i18n.getText("filterTypeRoute")
				}, {
					key:	"Schedule",
					text:	i18n.getText("filterTypeSchedule")
				}, {
					key:	"Person",
					text:	i18n.getText("filterTypePerson")
				}, {
					key:	"Organization",
					text:	i18n.getText("filterTypeOrganization")
				}, {
					key:	"Transport",
					text:	i18n.getText("filterTypeTransport")
				}]
			}), "view");
		}
		
		
	});
});