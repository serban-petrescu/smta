sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	function getFrameUrl(sHash, sUrlParameters) {
		var sUrl = jQuery.sap.getResourcePath("diploma/tracking/overview/app", ".html");
		sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

		if (sHash) {
			sHash = "#TrackingOverview-display&/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
		} else {
			sHash = "#TrackingOverview-display";
		}

		return sUrl + sUrlParameters + sHash;
	}

	return Opa5.extend("diploma.tracking.trace.test.integration.pages.Common", {

		iStartMyApp: function(oOptions) {
			var sUrlParameters;
			oOptions = oOptions || {};

			// Start the app with a minimal delay to make tests run fast but still async to discover basic timing issues
			var iDelay = oOptions.delay || 50;

			sUrlParameters = "serverDelay=" + iDelay;

			this.iStartMyAppInAFrame(getFrameUrl(oOptions.hash, sUrlParameters));
		},

		iLookAtTheScreen: function() {
			return this;
		},

		createAWaitForAnEntitySet: function(oOptions) {
			return {
				success: function() {
					var bMockServerAvailable = false,
						aEntitySet;

					this.getMockServer().then(function(oMockServer) {
						aEntitySet = oMockServer.getEntitySetData(oOptions.entitySet);
						bMockServerAvailable = true;
					});

					return this.waitFor({
						check: function() {
							return bMockServerAvailable;
						},
						success: function() {
							oOptions.success.call(this, aEntitySet);
						},
						errorMessage: "was not able to retireve the entity set " + oOptions.entitySet
					});
				}
			};
		},

		getMockServer: function() {
			return new Promise(function(success) {
				Opa5.getWindow().sap.ui.require(["diploma/tracking/overview/localService/mockserver"], function(mockserver) {
					success(mockserver.getMockServer());
				});
			});
		},

		iStartMyAppOnADesktopToTestErrorHandler: function(sParam) {
			this.iStartMyAppInAFrame(getFrameUrl("", sParam));
		}

	});

});