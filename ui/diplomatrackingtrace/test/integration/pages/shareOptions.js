sap.ui.define([
	"sap/ui/test/matchers/PropertyStrictEquals"
], function(PropertyStrictEquals) {
	"use strict";

	return {

		createActions: function(sViewName) {
			return {
				iPressOnTheShareButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: sViewName,
						matchers: new PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://action"
						}),
						success: function(aButtons) {
							aButtons[0].$().trigger("tap");
						},
						errorMessage: "Did not find the share button"
					});
				}
			};
		},

		createAssertions: function(sViewName) {
			return {

				iShouldSeeTheShareEmailButton: function() {
					return this.waitFor({
						viewName: sViewName,
						controlType: "sap.m.Button",
						matchers: new PropertyStrictEquals({
							name: "icon",
							value: "sap-icon://email"
						}),
						success: function() {
							QUnit.ok(true, "The E-Mail button is visible");
						},
						errorMessage: "The E-Mail button was not found"
					});
				},

				iShouldSeeTheShareTileButton: function() {
					return this.waitFor({
						id: "shareTile",
						viewName: sViewName,
						success: function() {
							QUnit.ok(true, "The Save as Tile button is visible");
						},
						errorMessage: "The Save as Tile  button was not found"
					});
				},

				iShouldSeeTheShareJamButton: function() {
					return this.waitFor({
						id: "shareJam",
						viewName: sViewName,
						success: function() {
							QUnit.ok(true, "The Jam share button is visible");
						},
						errorMessage: "The Jam share button was not found"
					});
				}

			};

		}

	};

});