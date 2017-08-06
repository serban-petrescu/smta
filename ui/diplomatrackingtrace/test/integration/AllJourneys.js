jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"diploma/tracking/overview/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"diploma/tracking/overview/test/integration/pages/Worklist",
	"diploma/tracking/overview/test/integration/pages/Object",
	"diploma/tracking/overview/test/integration/pages/NotFound",
	"diploma/tracking/overview/test/integration/pages/Browser",
	"diploma/tracking/overview/test/integration/pages/App"
], function(Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "diploma.tracking.trace.view."
	});

	sap.ui.require([
		"diploma/tracking/overview/test/integration/WorklistJourney",
		"diploma/tracking/overview/test/integration/ObjectJourney",
		"diploma/tracking/overview/test/integration/NavigationJourney",
		"diploma/tracking/overview/test/integration/NotFoundJourney",
		"diploma/tracking/overview/test/integration/FLPIntegrationJourney"
	], function() {
		QUnit.start();
	});
});