sap.ui.define([
	"diploma/analytics/compare/controller/BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/controls/Popover",
    "sap/m/MessageBox",
	"diploma/analytics/compare/model/formatter"
], function(BaseController, JSONModel, FlattenedDataset, FeedItem, ChartFormatter, Popover, MessageBox, formatter) {
	"use strict";

    var FIORI_LABEL_SHORTFORMAT_2 = "__UI5__ShortIntegerMaxFraction2";
    var FIORI_LABEL_DATEFORMAT = "__UI5__CustomDate";
    
	return BaseController.extend("diploma.analytics.compare.controller.Main", {

		formatter: formatter,
		
		/**
		 * The parameters which were used to load the current dataset.
		 * @private
		 * @property	{object[]}		transports	The transports attributes.
		 * @property	{object}		measure		The measure attributes.
		 * @property	{int|string}	alignment	The alignment type.
		 * @property	{int|string}	resolution	The resolution (number of points).
		 */
        _params: null,
        
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this.setModel(new JSONModel({}), "data");
			this._initLineChart();
			
			var oVhd = sap.ui.xmlview("diploma.analytics.compare.view.TransportValueHelp");
			this.byId("page").addDependent(oVhd);
			this._vhdc = oVhd.getController();
			this._vhdc.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._vhdc.attachCancel(this.onVhdCancel, this);
			this._vhdc.attachConfirm(this.onVhdConfirm, this);
		},
        
        /** Lifecycle hook. Used to show the VHD at the beginning. */
        onAfterRendering: function() {
            if (this._params === null) {
                this._vhdc.open();
            }
        },
        
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		
		/** Called when the user presses the "change selection" button. Opens the VHD. */
		onChangeSelection: function() {
		    this._vhdc.open();
		},
		
		/** Called when the refresh button is pressed. Reloads the data.*/
		onRefresh: function() {
            if (this._params !== null) {
                this._load(this._params);
            }
		},
		
		/** Called when the user presses the cancel button. */
		onVhdCancel: function() {
		    if (this._params === null) {
		        this.onNavBack();
		    }
		},
		
		/** 
		 * Called when the user presses the VHD confirm button.
		 * Checks that at least one measure + transport wre selected.
		 * If yes, then it loads the data, else it shows an eror message.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		 onVhdConfirm: function(oEvent) {
		     var mParams = oEvent.getParameters();
		     if (mParams.measure === null ||  mParams.transports.length === 0 || 
		    		parseInt(mParams.resolution, 10) <= 0) {
		         MessageBox.error(this.getResourceBundle().getText("errorInvalidSelection"));
		         oEvent.preventDefault();   
		     }
		     else {
		         this._params = mParams;
		         this._load(mParams);
		     }
		 },
		
		/**
		 * Loads the data for the comparison.
		 * @param	{object}	oMeasure	The measure info.
		 * @param   {object[]}  aTransports The transports info.
		 * @returns {void}
		 */
		_load: function(oParams) {
		    var aTransportIds = [],
		    	oContainer = this.byId("chcMain");
		    oParams.transports.forEach(function(oItem){
		        aTransportIds.push(oItem.id);
		    });
		    oContainer.setBusy(true);
			jQuery.get("/destinations/INET_HTTP_DIPLOMA_J0I/services/secondary.xsjs", {
					entity: 	"Transport",
					action:		"Compare",
					transports:	aTransportIds.join(","),
					measure:	oParams.measure.id,
					align:		oParams.alignment,
					resolution: oParams.resolution
				}, 
				function(aData){
					for (var j = 0; j < aData.length; ++j) {
						aData[j].date = new Date(aData[j].timestamp);
					}
					this.getModel("data").setData(aData);
					this._bindLineChart(oParams.measure, oParams.transports);
				}.bind(this),
				"json"
			).fail(this.getOwnerComponent().getErrorHandler())
			.always(oContainer.setBusy.bind(oContainer, false));
		},
		
		/**
		 * Initializes the line chart.
		 */
		_initLineChart: function() {
			var chartFormatter = ChartFormatter.getInstance();
            chartFormatter.registerCustomFormatter(FIORI_LABEL_SHORTFORMAT_2, function(value) {
                var fixedInteger = sap.ui.core.format.NumberFormat.getIntegerInstance({style: "short",
                    maxFractionDigits: 2});
                return fixedInteger.format(value);
            });
            chartFormatter.registerCustomFormatter(FIORI_LABEL_DATEFORMAT, function(value) {
                var fixedDate = sap.ui.core.format.DateFormat.getDateTimeInstance("dd.MM.yyyy HH:mm:ss");
                return fixedDate.format(value);
            });
            sap.viz.api.env.Format.numericFormatter(chartFormatter);
            
			var oVizFrame = this.getView().byId("lineChart");
            oVizFrame.setVizType("timeseries_line");
            oVizFrame.setUiConfig({
                "applicationSet": "fiori"
            });
            
            var oPopOver = new Popover();
            this.getView().addDependent(oPopOver);
            oPopOver.connect(oVizFrame.getVizUid());
            
            oVizFrame.setVizProperties({
                general: {
                    layout: {
                        padding: 0.04
                    }
                },
                timeAxis: {
                	levels: ["minute", "hour", "day","month"],
                	title: {
                		visible: false,
                		text:	 this.getResourceBundle().getText("timeDimension")
                	},
                    interval: {
                        unit: "auto"
                    }
                },
                valueAxis: {
                	title: {
                		visible: true
                	}
                },
                plotArea: {
                    dataLabel: {                        
                        visible: false,
                        formatString:FIORI_LABEL_SHORTFORMAT_2,
                        hideWhenOverlap: true
                    },
                    window: {
                        start: null,
                        end: null
                    }
                },
                interaction: {
                	selectability: {
                		mode: "SINGLE"
                	}
                }
            });
			var oFormat = {};
			oFormat[this.getResourceBundle().getText("timeDimension")] = FIORI_LABEL_DATEFORMAT;
			oPopOver.setFormatString(oFormat);
			
            oVizFrame.setModel(this.getModel("data"));
		},
		
		/**
		 * Binds the data to the line chart.
		 * @param	{object}	oMeasure	The measure info.
		 * @param   {object[]}  aTransports The transports info.
		 * @returns {void}
		 */
		_bindLineChart: function(oMeasure, aTransports){
			var oVizFrame = this.getView().byId("lineChart");
			var aTransportNames = [], aTransportMeasures = [];
			for (var i = 0; i < aTransports.length; ++i) {
				aTransportNames.push(aTransports[i].name);
				aTransportMeasures.push({
					name:	aTransports[i].name,
					value:  "{" + aTransports[i].id + "}"
				});
			}
            var oDataset = new FlattenedDataset({
				dimensions: [{
					name:		this.getResourceBundle().getText("timeDimension"),
					value:		"{date}",
					dataType:	"date"
				}],
                measures: aTransportMeasures,
                data: {
                    path: "/"
                }
            });
            oVizFrame.removeAllFeeds();
            oVizFrame.addFeed(new FeedItem({
                uid:	"timeAxis",
                type:	"Dimension",
                values: [this.getResourceBundle().getText("timeDimension")]
            }));
            oVizFrame.addFeed(new FeedItem({
                uid:	"valueAxis",
                type:	"Measure",
                values: aTransportNames
            }));
            oVizFrame.setDataset(oDataset);	
			oVizFrame.setVizProperties({
            	title: {
            		text: oMeasure.name
            	},
                valueAxis: {
                	title: {
                		text: this.getResourceBundle().getText("valueTitle", 
                		    [oMeasure.name, oMeasure.unit])
                	}
                }
			 });
		},
		
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
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
		}
	});
});