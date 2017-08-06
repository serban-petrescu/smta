sap.ui.define([
	"diploma/tracking/trace/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"diploma/tracking/trace/model/formatter",
	"sap/m/MessageBox",
	"sap/ui/layout/form/FormElement",
	"sap/ui/layout/GridData",
	"sap/m/Text",
	"./MicroChartBuilder",
	"sap/ui/core/format/NumberFormat"
], function(BaseController, JSONModel, formatter, MessageBox, FormElement, GridData, Text, MicroChartBuilder, NumberFormat) {
	"use strict";
	
	var oIntegerFormat = NumberFormat.getIntegerInstance({groupingEnabled: false});
	var oFloatFormat = NumberFormat.getIntegerInstance({groupingEnabled: false, maxFractionDigits: 3});	

	return BaseController.extend("diploma.tracking.trace.controller.Main", {

		formatter: formatter,
		
		_index: null,
		
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the controller is instantiated.
		 */
		onInit: function() {
			var oComponent = this.getOwnerComponent(),
				oViewModel = new JSONModel({
					selectedTrace: null,
					started: false,
					finished: false,
					paused: false,
					data: {
						start:	null,
						end:	null,
						current: null,
						points:	null,
						limits: null
					},
					busy: true,
					nguwDead: false,
					policyLoading: false,
					policy: null
				});
			
			this.setModel(oViewModel, "view");
			oComponent.getMapPromise().then(function() {
				this.byId("sideContent").addMainContent(sap.ui.xmlfragment(this.getView().getId(), "diploma.tracking.trace.view.Map"), this);
				jQuery.sap.delayedCall(500, this.byId("map"), this.byId("map").resize);
			}.bind(this));
			
			var sDensityClass = oComponent.getContentDensityClass();
			this.byId("page").getDependents().forEach(function(oItem) {
			    oItem.addStyleClass(sDensityClass);
			});
			
			oComponent.getRouter().getRoute("main").attachPatternMatched(function(){
				oComponent.getModel().read("/Traces", {
					urlParameters: {"$top": 1, "$orderby": "priority"}, 
					success: function(oData) {
						if (oData.results.length) {
							oComponent.getRouter().navTo("mainWithId", {id: oData.results[0].id}, true);
						}
						else {
							MessageBox.error(this.getOwnerComponent().getModel("i18n").getProperty("noObjectsAvailableText"));
						}
					}.bind(this),
					error:	this.getOwnerComponent().getErrorHandler()
				});
				if (this.byId("map")) {
					jQuery.sap.delayedCall(500, this.byId("map"), this.byId("map").resize);
				}
			}, this);
			
			oComponent.getRouter().getRoute("mainWithId").attachPatternMatched(function(oEvent){
				this._readData(oEvent.getParameter("arguments").id);
				if (this.byId("map")) {
					jQuery.sap.delayedCall(500, this.byId("map"), this.byId("map").resize);
				}
			}, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
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
		
		onOpenTraceActionSheet: function(oEvent) {
			this.byId("ashTraces").openBy(oEvent.getSource());
		},
		
		onChangeTrace: function(oEvent) {
			var sKey = oEvent.getSource().getBindingContext().getProperty("id");
			this.onReset();
			this.getOwnerComponent().getRouter().navTo("mainWithId", {id: sKey});
		},
		
		onStart: function() {
			var oModel = this.getModel("view"),
				aPoints = oModel.getProperty("/data/points"),
				i,
				oPoly;
				
			oModel.setProperty("/started", true);
			this._index = 0;
			oModel.setProperty("/data/current", aPoints[0]);
			oModel.setProperty("/data/limits", [aPoints[0].values]);
			
			this.byId("plyPast").clearPoints();
			oPoly = this.byId("plyFuture");
			for (i = aPoints.length - 1; i >= 0; --i) {
				oPoly.pushPoint(aPoints[i].latitude, aPoints[i].longitude);
			}
			
			if (aPoints[this._index].events && aPoints[this._index].events.length) {
				this.onNguwEventOccured();
			}
		},
		
		onReset: function() {
			var oModel = this.getModel("view");
			oModel.setProperty("/policy", null);
			oModel.setProperty("/started", false);
			oModel.setProperty("/finished", false);
			oModel.setProperty("/paused", false);
			oModel.setProperty("/data/limits", []);
			oModel.setProperty("/data/current", null);
			this.byId("plyPast").clearPoints();
			this.byId("plyFuture").clearPoints();
		},
		
		onPause: function() {
			this.getModel("view").setProperty("/paused", true);
		},
		
		onResume: function() {
			this.getModel("view").setProperty("/paused", false);
		},
		
		onOpenPolicyDialog: function(oEvent) {
			var aDevices = oEvent.getSource().getBindingContext().getProperty("Transport/Devices"),
				sName = this.getModel().getProperty("/" + aDevices[0] + "/name"),
				oModel = this.getModel("view");
			oModel.setProperty("/policyLoading", true);
			oModel.setProperty("/nguwDead", false);
			oModel.setProperty("/policy", null);
			
			if (oModel.getProperty("/started")) {
				oModel.setProperty("/paused", true);
			}
			
			jQuery.ajax({
				method:	"GET",
				url:	"/destinations/INET_HTTP_DIPLOMA_J0I/services/demo.xsjs",
				data:	{action: "policy", isoContainer: sName.split(" ")[1]},
				dataType: "json",
				success: function(oData) {
					oModel.setProperty("/policyLoading", false);
					oModel.setProperty("/policy", oData);
				},
				error:	function() {
					oModel.setProperty("/policyLoading", false);
					oModel.setProperty("/nguwDead", true);
				}
			});
			this.byId("dlgPolicyData").open();
		},
		
		onClosePolicyDialog: function() {
			if (this.getModel("view").getProperty("/started")) {
				this.getModel("view").setProperty("/paused", false);
			}
			this.byId("dlgPolicyData").close();
		},
		
		onNguwEventOccured: function() {
			var oModel = this.getModel("view"),
				aEvents = oModel.getProperty("/data/current/events"),
				fnOnSuccess, 
				iTries = 0,
				fnOnError,
				sToken = this.getModel().getSecurityToken(),
				fnSendRequest;
			
			fnOnSuccess = function(sResponse) {
				if (sResponse.indexOf("An existing connection was forcibly closed by the remote host") >= 0) {
					fnSendRequest();
				}
				else {
					try {
						oModel.setProperty("/nguwMessages", JSON.parse(sResponse));
						oModel.setProperty("/nguwDead", false);
					}
					catch(e) {
						fnSendRequest();
					}
				}
			};
			
			fnOnError = function() {
				var aMessages = [], i;
				for (i = 0; i < aEvents.length; ++i) {
					if (aEvents[i].responseCache) {
						try {
							aMessages.push.apply(aMessages, JSON.parse(aEvents[i].responseCache));
						}
						catch (e) {
							//nothing to do, means that somehow an invalid response was cached.
						}
					}
				}
				oModel.setProperty("/nguwMessages", aMessages);
				oModel.setProperty("/nguwDead", true);
			};
			
			fnSendRequest = function() {
				if (++iTries <= 3) {
					jQuery.ajax({
						method:			"POST",
						url:			"/destinations/INET_HTTP_DIPLOMA_J0I/services/demo.xsjs?action=nguw",
						dataType:		"text",
						contentType:	"application/json",
						data:			JSON.stringify(aEvents.map(function(oEvent){return oEvent.id; })),
						headers:		{"X-CSRF-TOKEN": sToken},
						success:		fnOnSuccess,
						error:			fnOnError
					});
				}
				else {
					fnOnError();
				}
			};
			
			fnSendRequest();
			
			oModel.setProperty("/nguwMessages", null);
			
			this.onPause();
			
			this.byId("dlgNguwEvent").open();
		},
		
		onCloseNguwEventDialog: function() {
			this.onResume();
			this.byId("dlgNguwEvent").close();
		},
		
		onTrigger: function() {
			var oModel = this.getModel("view"),
				aLimits,
				aPoints = oModel.getProperty("/data/points");
			if (!oModel.getProperty("/paused")) {
				this._index++;
				if (this._index >= aPoints.length) {
					oModel.setProperty("/finished", true);
				}
				else {
					oModel.setProperty("/data/current", aPoints[this._index]);
					aLimits = oModel.getProperty("/data/limits");
					aLimits.unshift(aPoints[this._index].values);
					if (aLimits.length > 5) {
						aLimits.pop();
					}
					oModel.setProperty("/data/limits", aLimits);
					this.byId("plyPast").pushPoint(aPoints[this._index].latitude, aPoints[this._index].longitude);
					this.byId("plyFuture").popPoint();
					if (aPoints[this._index].events && aPoints[this._index].events.length) {
						this.onNguwEventOccured();
					}
				}
			}
		},
		
		buildMeasureLabelAndText: function(sId, oContext) {
			var aPoints = this.getModel("view").getProperty("/data/points"),
				iCount = 0,
				sMeasure = oContext.getProperty("id"),
				oElement = new FormElement({
					label: oContext.getProperty("name"),
					fields: [
						new Text({text: {
							path: "/data/current/values/" + oContext.getProperty("id"),
							model: "view",
							formatter: function(fValue) {
								if (fValue % 1 === 0) {
									return oIntegerFormat.format(fValue) + " " + oContext.getProperty("unit");
								}
								else {
									return oFloatFormat.format(fValue) + " " + oContext.getProperty("unit");
								}
							}
						}})
					]
				});
			aPoints.forEach(function(oPoint) {
				if (oPoint.values[sMeasure] !== null && oPoint.values[sMeasure] !== undefined) {
					++iCount;
				}
			});
			oElement.setVisible(iCount > 5);
			return oElement; 
		},
		
		buildLimitChartElement: function(sId, oContext) {
			var oModel = this.getModel("view"),
				sMeasure = oContext.getProperty("measure"),
				aPoints = oModel.getProperty("/data/points"), 
				nMin = null, 
				iCount = 0,
				nMax = null;
			aPoints.forEach(function(oPoint) {
				if (oPoint.values[sMeasure] !== null && oPoint.values[sMeasure] !== undefined) {
					++iCount;
				}
				if (nMin === null || nMin > oPoint.values[sMeasure]) {
					nMin = oPoint.values[sMeasure];
				}
				if (nMax === null || nMax < oPoint.values[sMeasure]) {
					nMax = oPoint.values[sMeasure];
				}
			});
			return new FormElement(sId, {
				label:	oContext.getProperty("Measure/name"),
				visible: nMax !== nMin && iCount > 5,
				fields: [MicroChartBuilder.buildChart(oContext, nMin, nMax)],
				layoutData: new GridData({span: "L12 M12 S12"})
			});
		},
		
		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */
		
		_readData: function(sId) {
			var oModel = this.getModel("view"),
				oPage = this.byId("page");
			jQuery.ajax({
				method: "GET",
				url:	"/destinations/INET_HTTP_DIPLOMA_J0I/services/demo.xsjs?action=trace&id=" + sId,
				dataType: "json",
				success: function(aData) {
					oModel.setProperty("/selectedTrace", sId);
					oModel.setProperty("/data/start", aData[0]);
					oModel.setProperty("/data/end", aData[aData.length - 1]);
					oModel.setProperty("/data/points", aData);
					oModel.setProperty("/busy", false);
					oPage.bindElement({
						path: "/Traces('" + sId + "')",
						parameters: {expand: "Transport,Transport/Route/ToLocation,Transport/Route/FromLocation,Transport/Devices"}
					});
				},
				error:	this.getOwnerComponent().getErrorHandler()
			});
		}
		
	});
});