sap.ui.define([
		"sap/ui/core/Control",
		"sap/m/ResponsivePopover",
		"sap/m/NavContainer"
	], function (Control, ResponsivePopover, NavContainer) {
		"use strict";
		return Control.extend("diploma.analytics.forecast.controller.HelpPopover", {
			metadata: {
				defaultAggregation: "pages",
				aggregations: {
					pages:		{type: "diploma.analytics.forecast.controller.HelpPage", multiple: true, singleName: "page"},
					_popover:	{type: "sap.m.ResponsivePopover", multiple: false, visibility: "hidden"}
				}
			},
			
			_initialize: function() {
				if (!this._oNavContainer) {
					var aPages = this.removeAllPages(),
						i,
						oPopover;
					this.unbindAggregation("pages");
					
					this._mPages = {};
					for (i = 0; i < aPages.length; ++i) {
					    aPages[i]._initialize();
						this._mPages[aPages[i].getPageId()] = aPages[i];
						aPages[i].attachOnNavigate(this._navForwards, this);
						aPages[i].attachNavButtonPress(this._navBackwards, this);
					}
					
					this._oNavContainer = new NavContainer({
						pages: aPages
					});
					this._oNavContainer.attachAfterNavigate(function(oEvent){
						if (!oEvent.getParameter("isBack")) {
							oEvent.getParameter("to").scrollTo(0);
						}
					});
					
					oPopover = new ResponsivePopover({
						placement: "Vertical",
						contentHeight:	"25rem",
						contentWidth:	"22rem",
						content: [this._oNavContainer],
						showHeader: false,
						showCloseButton : true
					});
					oPopover.attachAfterOpen(function(){
						this._oNavContainer.getCurrentPage().scrollTo(0);
					}.bind(this));
					this.setAggregation("_popover", oPopover);
					
				}
			},
			
			openBy: function(oControl, sPageId) {
				this._initialize();
				var oPage = this._mPages[sPageId];
				oPage.setShowNavButton(false);
				this._navStack = [];
				this._oNavContainer.to(oPage, "show");
				this.getAggregation("_popover").openBy(oControl);
			},
			
			_navForwards: function(oEvent) {
				var oPage = this._mPages[oEvent.getParameter("pageId")];
				this._navStack.push(this._oNavContainer.getCurrentPage().getPageId());
				oPage.setShowNavButton(true);
				this._oNavContainer.to(oPage);
			},
			
			_navBackwards: function(oEvent) {
				var sPage = this._navStack.pop(),
					oPage;
				if (sPage === undefined) {
					oEvent.getSource().setShowNavButton(false);
				}
				else {
					oPage = this._mPages[sPage];
					oPage.setShowNavButton(this._navStack.length !== 0);
					this._oNavContainer.backToPage(oPage);
				}
			},
			
			renderer: function(){ }
			
		});
	}
);