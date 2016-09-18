sap.ui.define([
		"sap/m/ObjectIdentifier"
	], function (ObjectIdentifier) {
		"use strict";
		return ObjectIdentifier.extend("diploma.analytics.forecast.controller.HelpTitle", {
			metadata: {
				properties: {
					href : {type : "sap.ui.core.URI"},
					target : {type: "string"}
				}
			},
			
			setHref: function(sHref) {
				this.setProperty("href", sHref);
				if (this._getTitleControl().setHref) {
					this._getTitleControl().setHref(sHref);
				}
			},
			
			setTarget: function(sTarget) {
				this.setProperty("target", sTarget);
				if (this._getTitleControl().setTarget) {
					this._getTitleControl().setTarget(sTarget);
				}
			},
			
			renderer: {}
		});
	}
);