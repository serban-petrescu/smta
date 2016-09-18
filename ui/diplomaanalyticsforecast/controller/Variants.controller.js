sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], function(Controller, JSONModel){
	
	return Controller.extend("diploma.analytics.forecast.controller.Variants", {
		
		/** Lifecycle hook. */
		onInit: function() {
			var oData = {variants: []};
			if (window.localStorage) {
				try {
					oData = JSON.parse(window.localStorage.getItem("diploma.analytics.forecast.variants") || "{}");
				}
				catch (e) {
					oData = {
						variants: []
					};
				}
			}
			if (!oData.variants) {
				oData.variants = [];
			}
			this.getView().setModel(new JSONModel(oData), "view");
		},
		
		/**
		 * Adds the given style class directly to the dialog.
		 * @param   {string}    sStyleClass     The style class to be added.
		 * @returns {void}
		 */
		addStyleClass: function(sStyleClass) {
		    this.byId("dlgVariants").addStyleClass(sStyleClass);
		},
		
		
		/**
		 * Attaches an event listener on the "load" event.
		 * This event is fired when the user presses the load button.
		 * @param   {function}  fnHandler   Callback function.
		 * @param   {object=}   oListener   Listener object on which the handler is called.    
		 * @returns {void}
		 */
		attachLoad: function(fnHandler, oListener) {
		    this.attachEvent("load", fnHandler, oListener);
		},
		
		/** Opens the dialog */
		open: function() {
			this.byId("dlgVariants").open();
		},
		
		/**
		 * Event handler for the press event of the close button.
		 * Saves the new data and closes the dialog.
		 */
		onClose: function() {
			var oData = this.getView().getModel("view").getData();
			if (window.localStorage) {
				try {
					window.localStorage.setItem("diploma.analytics.forecast.variants", JSON.stringify(oData));
				}
				catch (e) {
					oData = {};
				}
			}
			this.byId("dlgVariants").close();	
		},
		
		/** Event handler for the save button. Creates a new variant. */
		onSave: function() {
			var oModel = this.getView().getModel("view");
			oModel.getData().variants.push({
				name:		this.getView().getModel("i18n").getProperty("itmVariantDefaultName"),
				content:	jQuery.extend(true, {}, this.getView().getModel("request").getData())
			});
			oModel.refresh();
		},
		
		/** Event handler for the delete button. Removes the selected variant. */
		onDelete: function() {
			var oItem = this.byId("lstVariants").getSelectedItem(),
				aPath,
				oModel = this.getView().getModel("view");
			if (!oItem) {
				return;
			}
			aPath = oItem.getBindingContext("view").getPath().split("/");
			
			oModel.getData().variants.splice(parseInt(aPath[aPath.length - 1]), 1);
			oModel.refresh();
		},
		
		/** Event handler for the load button. Fires the load event. */
		onLoad: function() {
			var oItem = this.byId("lstVariants").getSelectedItem();
			if (!oItem) {
				return;
			}
			this.fireEvent("load", jQuery.extend(true, {}, oItem.getBindingContext("view").getObject()));
			this.byId("dlgVariants").close();
		}
		
	});
	
});