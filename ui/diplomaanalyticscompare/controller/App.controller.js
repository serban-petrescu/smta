sap.ui.define([
	"diploma/analytics/compare/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("diploma.analytics.compare.controller.App", {

		onInit: function() {
			var oViewModel = new JSONModel({
			    busy: true,
			    delay: 0
			}),
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
            this.setModel(oViewModel, "appView");
            
			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}
	});

});