sap.ui.define([
		"sap/m/Page",
		"sap/m/PageRenderer",
		"sap/m/Panel",
		"sap/m/List",
		"sap/m/StandardListItem",
		"./HelpTitle",
		"sap/m/Link"
	], function (Page, PageRenderer, Panel, List, StandardListItem, HelpTitle, Link) {
		"use strict";
		return Page.extend("diploma.analytics.forecast.controller.HelpPage", {
			metadata: {
				properties: {
					pageId:			{type: "string"},
					header:			{type: "string"},
					childrenHeader:	{type: "string"},
					description:	{type: "string"},
					link:			{type: "string"},	
					intro:			{type: "string"},
					introPageId:	{type: "string"}
				},
				defaultAggregation: "children",
				aggregations: {
					children: {type: "sap.ui.core.Item", singularName: "child", multiple: true},
					_page:	  {type: "sap.m.Page", visibility: "hidden", multiple: false}
				},
				events: {
					onNavigate: {
						parameters: {
							pageId: "string"
						}
					}
				}
			},
			
			renderer: { },
			
			_initialize: function() {
				var oList,
					aItems,
					i;
					
				this.addStyleClass("sapUiContentPadding");
				if (this.getIntro()) {
					this.addContent(new Link({
						text:		this.getIntro(),
						subtle:		true,
						enabled:	this.getIntroPageId() ? true : false,
						press:		this.fireEvent.bind(this, "onNavigate", {pageId: this.getIntroPageId()})
					}));
				}
				this.addContent(new HelpTitle({
					title:			this.getHeader(),
					titleActive:	this.getLink() ? true : false,
					href:			this.getLink(),
					target:			"_blank",
					text:			this.getDescription()
				}).addStyleClass("sapUiSmallMarginBottom").addStyleClass("sapUiTinyMarginTop"));
				
				aItems = this.getChildren();
				if (aItems && aItems.length) {
					oList = new List({
						headerText:	this.getChildrenHeader()
					});
					for (i = 0; i < aItems.length; ++i) {
						oList.addItem(new StandardListItem({
							title:	aItems[i].getText(),
							type:	"Navigation",
							press:	this.fireEvent.bind(this, "onNavigate", {pageId: aItems[i].getKey()})
						}));
					}
					this.addContent(oList);
				}
			}
			
		});
	}
);