sap.ui.define([
	"diploma/analytics/statistics/controller/BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/ui/model/Filter",
    "sap/viz/ui5/controls/Popover",
    "sap/m/Token",
	"diploma/analytics/statistics/model/formatter",
    "diploma/analytics/statistics/controller/FioriDependencies"
], function(BaseController, JSONModel, FlattenedDataset, FeedItem, ChartFormatter, Filter, Popover, Token, formatter) {
	"use strict";
    
    var FIORI_LABEL_SHORTFORMAT_10 = "__UI5__ShortIntegerMaxFraction10";
    var FIORI_LABEL_FORMAT_2 = "__UI5__FloatMaxFraction2";
    var FIORI_LABEL_SHORTFORMAT_2 = "__UI5__ShortIntegerMaxFraction2";
    var FIORI_LABEL_DATEFORMAT = "__UI5__CustomDate";
    
	return BaseController.extend("diploma.analytics.statistics.controller.Results", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			var oVizFrame, oPopOver;
			this._initChartFormatter();
			
			oVizFrame = this.getView().byId("lineChart");
            oPopOver = new Popover({id: this.createId("linePopover")});
            this.getView().addDependent(oPopOver);
            oPopOver.connect(oVizFrame.getVizUid());
            
			this.getRouter().getRoute("results").attachPatternMatched(this._onResultsMatched, this);
		},
		
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oRouter = this.getOwnerComponent().getRouter();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to selection screen
				oRouter.navTo("selection");
			}
		},
		
		/**
		 * Called when the results route is matched.
		 * If new data has been received, it is parsed.
		 * If no data is available, then a navigation to the selection screen is issued.
		 * @private
		 * @returns {void}
		 */
		_onResultsMatched: function() {
			var oData = this.getView().getModel("data").getData();
			if (oData && (oData.config || oData.length)) {
				if (oData.config) {
					this._onDataReceived(oData);
				}
			}
			else {
				this.onNavBack();
			}
		},
		
		
		/**
		 * Called when data is received from the server.
		 * Processes the data and initializes the charts.
		 * @private
		 * @param	{object}	oData	The data received from the server.
		 * @returns	{void}
		 */
		_onDataReceived: function(oData) {
			var oDataModel = this.getModel("data"),
				i18n = this.getModel("i18n").getResourceBundle(),
				fnReplaceI18n = function(oObject) {
					var sKey, i, aParams;
					if (typeof oObject === "object" && oObject !== null) {
						if (oObject.text && oObject.params instanceof Array && oObject.text.indexOf("i18n>") === 0) {
							for (i = 0, aParams = []; i < oObject.params.length; ++i) {
								aParams.push(fnReplaceI18n(oObject.params[i]));
							}
							return i18n.getText(oObject.text.substr(5), aParams); 
						}
						else {
							for (sKey in oObject) {
								if (oObject.hasOwnProperty(sKey)) {
									oObject[sKey] = fnReplaceI18n(oObject[sKey]);
								}
							}
						}
					}
					else if (typeof oObject === "string") {
						if (oObject.indexOf("i18n>") === 0) {
							return i18n.getText(oObject.substr(5));
						}
						else {
							return oObject;
						}
					}
					return oObject;
				};
				
			for (var i = 0; i < oData.results.length; ++i) {
				if (oData.results[i].date) {
					oData.results[i].date = new Date(oData.results[i].date);
				}
			}
			if (!(oData && oData.config && oData.config.window && oData.config.window.start && oData.config.window.end)) {
				oData.config.window = {start: null, end: null};
			}
			oDataModel.setData(oData.results);
			oData.config = fnReplaceI18n(oData.config);
			this._initLineChart(oData.config);
		},
		
		/**
		 * Initializes the chart formatter.
		 */
		_initChartFormatter: function() {
			var chartFormatter = ChartFormatter.getInstance();
            chartFormatter.registerCustomFormatter(FIORI_LABEL_SHORTFORMAT_10, function(value) {
                var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({style: "short",
                    maxFractionDigits: 10});
                return fixedInteger.format(value);
            });
            chartFormatter.registerCustomFormatter(FIORI_LABEL_FORMAT_2, function(value) {
                var fixedFloat = sap.ui.core.format.NumberFormat.getFloatInstance({style: "Standard",
                    maxFractionDigits: 2});
                return fixedFloat.format(value);
            });
            chartFormatter.registerCustomFormatter(FIORI_LABEL_SHORTFORMAT_2, function(value) {
                var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({style: "short",
                    maxFractionDigits: 2});
                return fixedInteger.format(value);
            });
            chartFormatter.registerCustomFormatter(FIORI_LABEL_DATEFORMAT, function(value) {
                var fixedDate = sap.ui.core.format.DateFormat.getDateInstance("dd.MM.yyyy");
                return fixedDate.format(value);
            });
            sap.viz.api.env.Format.numericFormatter(chartFormatter);
		},
		
		
		/**
		 * Initializes the line chart.
		 */
		_initLineChart: function(oData) {
			var oVizFrame = this.getView().byId("lineChart"),
				oDataset,
				oPopover = this.byId("linePopover"),
				oFormat = {};
            oVizFrame.setVizType(oData.time ? "timeseries_line" : "column");
            oVizFrame.removeAllFeeds();
            
            oVizFrame.setVizProperties({
                general: {
                    layout: {
                        padding: 0.04
                    }
                },
                title: {
                	visible: false
                },
                timeAxis: oData.time ? {
                	title: {
                		visible: true,
                		text:	 this.getResourceBundle().getText("timeDimension")
                	},
                    interval: {
                        unit: "auto"
                    },
                    levels: oData.levels
                } : undefined,
                valueAxis: {
                	title: {
                		visible: true,
                		text:	 oData.value.title
                	}
                },
                plotArea: {
                    dataLabel: {                        
                        visible: false,
                        formatString: FIORI_LABEL_SHORTFORMAT_2,
                        hideWhenOverlap: true
                    },
                    window: oData.window
                },
                interaction: {
                	selectability: {
                		mode: "SINGLE"
                	}
                }
            });
			
			if (oData.time) {
	            oDataset = new FlattenedDataset({
					dimensions: [{
						name:		this.getResourceBundle().getText("timeDimension"),
						value:		"{date}",
						dataType:	"date"
					}],
	                measures: [oData.measures.map(function(oMeasure){
	        			oFormat[oMeasure.name] = FIORI_LABEL_FORMAT_2;
	                	return {
	                		name:	oMeasure.name,
	                		value:	"{" + oMeasure.field + "}"
	                	};
	                })],
	                data: {
	                	path: "/"
	                }
	            });
			}
			else {
	            oDataset = new FlattenedDataset({
					dimensions: [{
						name:		oData.dimension.name,
						value:		"{label}"
					}],
	                measures: [{
	                	name:		oData.measure.name,
	                	value:		"{value}"
	                }],
	                data: {
	                	path: "/"
	                }
	            });
	            oFormat[oData.measure.name] = FIORI_LABEL_FORMAT_2;
			}
			
			oFormat[this.getResourceBundle().getText("timeDimension")] = FIORI_LABEL_DATEFORMAT;
			oPopover.setFormatString(oFormat);
			
            oVizFrame.setDataset(oDataset);
            oVizFrame.setModel(this.getModel("data"));
            
            if (oData.time) {
	            oVizFrame.addFeed(new FeedItem({
	                uid:	"timeAxis",
	                type:	"Dimension",
	                values: [this.getResourceBundle().getText("timeDimension")]
	            }));
	            oVizFrame.addFeed(new FeedItem({
	                uid:	"valueAxis",
	                type:	"Measure",
	                values: oData.measures.map(function(oMeasure){
	                	return oMeasure.name;
	                })
	            }));
            }
            else {
	            oVizFrame.addFeed(new FeedItem({
	                uid:	"categoryAxis",
	                type:	"Dimension",
	                values: [oData.dimension.name]
	            }));
	            oVizFrame.addFeed(new FeedItem({
	                uid:	"valueAxis",
	                type:	"Measure",
	                values:	[oData.measure.name]
	            }));
            }
		}
	});
});