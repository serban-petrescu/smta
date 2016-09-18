/* global google */
sap.ui.define([
	"diploma/analytics/evolution/controller/BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/controls/Popover",
    "sap/m/MessageBox",
	"diploma/analytics/evolution/model/formatter"
], function(BaseController, JSONModel, FlattenedDataset, FeedItem, ChartFormatter, Popover, MessageBox, formatter) {
	"use strict";
		
    var FIORI_LABEL_SHORTFORMAT_10 = "__UI5__ShortIntegerMaxFraction10";
    var FIORI_LABEL_FORMAT_2 = "__UI5__FloatMaxFraction2";
    var FIORI_LABEL_SHORTFORMAT_2 = "__UI5__ShortIntegerMaxFraction2";
    var FIORI_LABEL_DATEFORMAT = "__UI5__CustomDate";
				
	/**
	 * Transforms a weight into a color.
	 * @param	{float}	fWeight	The weight of the data point.
	 * @returns {string}	A string with the CSS color.
	 */
	var fnWeightToColor = function(fWeight) {
		var iR, iG, iB;
		fWeight = Math.min(1, Math.max(1 - fWeight, 0));
		if (fWeight <=  0.3333) {
			iR = 255;
			iB = 0;
			iG = Math.min(255, Math.ceil(255 * (fWeight / 0.3333)));
		}
		else if (fWeight <= 0.6666) {
			iR = 255 - Math.min(255, Math.ceil(255 * (fWeight - 0.3333) / 0.3333));
			iB = 0;
			iG = 255;
		}
		else {
			iR = 0;
			iB = Math.min(255, Math.ceil(255 * (fWeight - 0.6666) / 0.3333));
			iG = 255;
		}
		return "rgb(" + iR + "," + iG + "," + iB + ")";
	};
    
	return BaseController.extend("diploma.analytics.evolution.controller.Main", {
		
		formatter: formatter,
		
		_measure: null,
		_transport: null,
		
		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function() {
			this.byId("icoRefresh").setTooltip(this.getResourceBundle().getText("refresh"));
			this.setModel(new JSONModel({}), "data");
			
			this._initChartFormatter();
			this._initScatterChart();
			this._initLineChart();
			this.getOwnerComponent().getLoadPromise().then(function(){
				this.byId("heatMap").attachAfterRendering({}, this._updateMap, this);
			}.bind(this));  
			
			var oVhd = sap.ui.xmlview("diploma.analytics.evolution.view.TransportValueHelp");
			this.byId("page").addDependent(oVhd);
			this._vhdc = oVhd.getController();
			this._vhdc.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this._vhdc.attachCancel(this.onVhdCancel, this);
			this._vhdc.attachConfirm(this.onVhdConfirm, this);
		},
		
        /** Lifecycle hook. Used to show the VHD at the beginning. */
        onAfterRendering: function() {
            if (this._measure === null || this._transport === null) {
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
            if (this._measure !== null && this._transport !== null) {
                this._load(this._transport, this._measure);
            }
            if (this.byId("tblScheduleEvolution").getBinding("items")) {
            	this.byId("tblScheduleEvolution").getBinding("items").refresh();
            }
		},
		
		/** Called when the user presses the cancel button. */
		onVhdCancel: function() {
		    if (this._measure === null || this._transport === null) {
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
		     if (mParams.measure === null ||  mParams.transport === null) {
		         MessageBox.error(this.getResourceBundle().getText("errorInvalidSelection"));
		         oEvent.preventDefault();   
		     }
		     else {
		         this._measure = mParams.measure;
		         this._transport = mParams.transport;
		         this._load(mParams.transport, mParams.measure);
		     }
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
		},
		
		/**
		 * Loads the data for the charts.
		 * @private
		 * @param	{string}	oTransport	The transport's properties.
		 * @param	{string}	oMeasure	The measure's properties.
		 * @returns {void}
		 */
		_load: function(oTransport, oMeasure) {
			var oContainer = this.byId("chartContainer");
			if (oTransport && oTransport.id) {
				this.byId("tblScheduleEvolution").getBinding("items").filter([
					new sap.ui.model.Filter("transport", "EQ", oTransport.id)]);
			}
			if (oMeasure && oTransport) {
				oContainer.setBusy(true);
				jQuery.get("/destinations/INET_HTTP_DIPLOMA_J0I/services/secondary.xsjs", {
						entity: 	"Value",
						action:		"Read",
						transport:	oTransport.id,
						measure:	oMeasure.id
					}, 
					this._processData.bind(this, oTransport, oMeasure), 
					"json"
				).fail(this.getOwnerComponent().getErrorHandler())
				.always(oContainer.setBusy.bind(oContainer, false));
			}
		},
		
		/**
		 * Processes the data obtained from the backend.
		 * @private
		 * @param	{string}	oTransport	The transport's properties.
		 * @param	{string}	oMeasure	The measure's properties.
		 * @param	{object[]}	aData	    The data retrieved.
		 * @returns {void}
		 */
		_processData: function(oTransport, oMeasure, aData) {
			var i, nMax = Number.MIN_VALUE, nMin = Number.MAX_VALUE;
			for (i = 0; i < aData.length; ++i) {
				aData[i].date = new Date(aData[i].timestamp);
				aData[i].value = parseFloat(aData[i].value);
				nMax = Math.max(nMax, aData[i].value);
				nMin = Math.min(nMin, aData[i].value);
			}
			this.getModel("data").setData(aData);
			this._refeshLabels(oTransport, oMeasure);
			
			this._clearMap();
			var aMapData = [];
			var nInterval = Math.abs(nMax - nMin) || 1;
			if (aData.length > 20) {
    			for (i = 1; i < aData.length; ++i) {
    				aMapData.push({
    					type: "Feature",
    					properties: {
    						weight: Math.abs((aData[i].value + aData[i - 1].value) / 2 - nMin) / nInterval
    					},
    					geometry: {
    						type:	"LineString",
    						coordinates: [
    							aData[i - 1].position,
    							aData[i].position
    						]
    					}
    				});
    			}
    			this._features = aMapData;
			}
			else {
			    for (i = 0; i < aData.length; ++i) {
			        aMapData.push(new google.maps.Marker({
                        position: {
                            lat: aData[i].position[1],
                            lng: aData[i].position[0]
                        },
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillColor: fnWeightToColor(Math.abs((aData[i].value- nMin) / nInterval)),
                            fillOpacity: 1,
                            strokeColor: "black",
                            strokeWeight: 2
                        },
                        draggable: false
                    }));
			    }
			    this._markers = aMapData;
			}
			this._setMapData();
			this._setMapCenter();
		},
		
		/**
		 * Focuses the map to show the data.
		 * @private
		 */
		_setMapCenter: function() {
			if (this._map && this.byId("chartContainer") && this.byId("chartContainer").getSelectedContent() && 
				this.byId("chartContainer").getSelectedContent().getId() === this.createId("heatMapCont")) {
				var oBounds = new google.maps.LatLngBounds();
				if (this._features && this._features.length) {
    				oBounds.extend(new google.maps.LatLng({
    					lat: this._features[0].geometry.coordinates[0][1],
    					lng: this._features[0].geometry.coordinates[0][0]
    				}));
    				oBounds.extend(new google.maps.LatLng({
    					lat: this._features[this._features.length - 1].geometry.coordinates[1][1],
    					lng: this._features[this._features.length - 1].geometry.coordinates[1][0]
    				}));
				}
				else if (this._markers && this._markers.length) {
				    oBounds.extend(this._markers[0].getPosition());
				    oBounds.extend(this._markers[this._markers.length - 1].getPosition());
				}
				else {
				    return;
				}
		    	this._map.fitBounds(oBounds);
			}
		},
		
		/**
		 * Writes the data to the data layer of the map or to the markers.
		 * @private
		 */
		_setMapData: function() {
			if (this._map) {
			    if (this._features && this._features.length) {
			        this._map.data.addGeoJson({type: "FeatureCollection", features: this._features});
			    }
				else if (this._markers && this._markers.length) {
				    for (var i = 0; i < this._markers.length; ++i) {
				        this._markers[i].setMap(this._map);
				    }
				}
			}
		},
		
		/**
		 * Clears the map by removing the features and markers.
		 * @private
		 */
		_clearMap: function() {
		    if (this._map) {
				this._map.data.forEach(function(feature) {
			        this._map.data.remove(feature);
			    }.bind(this));
		    }
		    if (this._markers) {
		        for (var i = 0; i < this._markers.length; ++i) {
		            this._markers[i].setMap(null);
		        }
		    }
		    this._features = [];
		    this._markers = [];
		},
		
		/**
		 * Builds the map if needed and updates its size to fit the container.
		 */
		_updateMap: function() {
			if (!this._map) {
				this._map = new google.maps.Map(this.byId("heatMap").getDomRef(), {
					center:		new google.maps.LatLng(45.33,28.20),
					mapTypeId:	google.maps.MapTypeId.HYBRID
				});
				this._map.data.setStyle(function(oFeature) {
				    var fWeight = oFeature.getProperty("weight");
				    return {
				      strokeColor: fnWeightToColor(fWeight),
				      strokeWeight: 3
				    };
				});
				this._setMapData();
			}
			var oMap = this.byId("heatMap").getDomRef();
			var oWrapper = oMap.parentElement;
			var oContainer = oWrapper.parentElement;
			oContainer.style.height = "100%";
			var nHeight = oContainer.clientHeight - oContainer.firstChild.clientHeight;
			oWrapper.style.height = nHeight + "px";
			google.maps.event.trigger(this._map, "resize");
            this._setMapCenter();
		},
		
		/**
		 * Refreshes the labels of the charts.
		 * @param	{string}	oTransport	The transport's properties.
		 * @param	{string}	oMeasure	The measure's properties.
		 * @returns {void}
		 */
		_refeshLabels: function(oTransport, oMeasure) {
			var sLimitKey   = this.getModel().createKey("Limits", {
			        transport:  oTransport.id,
			        measure:    oMeasure.id
			    });
			
			this.getModel().read("/" + sLimitKey, {
			    success:  function(oData) {
			        var aLines = [];
			        if (oData.upperBound !== null && oData.upperBound !== undefined) {
    				    aLines.push({
        					value:		Number(oData.upperBound),
                            visible:	true,
                            size:		1,
                            type:		"dotted",
                            label: {
                                text:	this.getResourceBundle().getText("upperBound"),
                                visible: true
                            }
        				});
        			}
        			if (oData.lowerBound !== null && oData.lowerBound !== undefined) {
        				aLines.push({
        					value:		Number(oData.lowerBound),
                            visible:	true,
                            size:		1,
                            type:		"dotted",
                            label: {
                                text:	this.getResourceBundle().getText("lowerBound"),
                                visible: true
                            }
        				});
        			}
        			this.getView().byId("scatterChart").setVizProperties({
        				plotArea: {
        					referenceLine: {
        						line: {
        							valueAxis: aLines 
        						}
        					}
        				}
        			 });
        			this.getView().byId("lineChart").setVizProperties({
        				plotArea: {
        					referenceLine: {
        						line: {
        							valueAxis: aLines 
        						}
        					}
        				}
        			 });
			    }.bind(this),
			    error: function() { }
			});
			
			
			this.getView().byId("scatterChart").setVizProperties({
            	title: {
            		text: this.getResourceBundle().getText("chartTitle", [oTransport.name, oMeasure.name])
            	},
                valueAxis: {
                	title: {
                		text: this.getResourceBundle().getText("valueTitle", [oMeasure.name, oMeasure.unit])
                	}
                },
				plotArea: {
					referenceLine: {
						line: {
							valueAxis: [] 
						}
					}
				}
			 });
			this.getView().byId("lineChart").setVizProperties({
            	title: {
            		text: this.getResourceBundle().getText("chartTitle", [oTransport.name, oMeasure.name])
            	},
                valueAxis: {
                	title: {
                		text: this.getResourceBundle().getText("valueTitle", [oMeasure.name, oMeasure.unit])
                	}
                },
				plotArea: {
					referenceLine: {
						line: {
							valueAxis: [] 
						}
					}
				}
			 });
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
                var fixedDate = sap.ui.core.format.DateFormat.getDateTimeInstance("dd.MM.yyyy HH:mm:ss");
                return fixedDate.format(value);
            });
            sap.viz.api.env.Format.numericFormatter(chartFormatter);
		},
		
		/**
		 * Initializes the scatter chart.
		 */
		_initScatterChart: function() {
			var oVizFrame = this.getView().byId("scatterChart");
            oVizFrame.setVizType("timeseries_scatter");
            oVizFrame.setUiConfig({
                "applicationSet": "fiori"
            });
            
            var oPopOver = new Popover();
            this.getView().addDependent(oPopOver);
            oPopOver.connect(oVizFrame.getVizUid());
            
            var oDataset = new FlattenedDataset({
				dimensions: [{
					name:		this.getResourceBundle().getText("timeDimension"),
					value:		"{date}",
					dataType:	"date"
				}],
                measures: [{
                    name:	this.getResourceBundle().getText("valueDimension"),
                    value:	"{value}"
                }],
                data: {
                    path: "/"
                }
            });
            
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
			
            oVizFrame.setDataset(oDataset);
            oVizFrame.setModel(this.getModel("data"));
            oVizFrame.addFeed(new FeedItem({
                uid:	"timeAxis",
                type:	"Dimension",
                values: [this.getResourceBundle().getText("timeDimension")]
            }));
            oVizFrame.addFeed(new FeedItem({
                uid:	"valueAxis",
                type:	"Measure",
                values: [this.getResourceBundle().getText("valueDimension")]
            }));
		},
		
		/**
		 * Initializes the line chart.
		 */
		_initLineChart: function() {
			var oVizFrame = this.getView().byId("lineChart");
            oVizFrame.setVizType("timeseries_line");
            oVizFrame.setUiConfig({
                "applicationSet": "fiori"
            });
            
            var oPopOver = new Popover();
            this.getView().addDependent(oPopOver);
            oPopOver.connect(oVizFrame.getVizUid());
            
            var oDataset = new FlattenedDataset({
				dimensions: [{
					name:		this.getResourceBundle().getText("timeDimension"),
					value:		"{date}",
					dataType:	"date"
				}],
                measures: [{
                    name:	this.getResourceBundle().getText("valueDimension"),
                    value:	"{value}"
                }],
                data: {
                    path: "/"
                }
            });
            
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
			
            oVizFrame.setDataset(oDataset);
            oVizFrame.setModel(this.getModel("data"));
            oVizFrame.addFeed(new FeedItem({
                uid:	"timeAxis",
                type:	"Dimension",
                values: [this.getResourceBundle().getText("timeDimension")]
            }));
            oVizFrame.addFeed(new FeedItem({
                uid:	"valueAxis",
                type:	"Measure",
                values: [this.getResourceBundle().getText("valueDimension")]
            }));
		}
	});
});