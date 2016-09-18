sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/type/Integer",
	"sap/ui/model/type/Float",
	"sap/m/MessageToast",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/controls/Popover",
    "diploma/analytics/forecast/model/formatter",
    "sap/m/MessageBox",
    "diploma/analytics/forecast/controller/FioriDependencies"
], function(Controller, Integer, Float, MessageToast, FlattenedDataset, FeedItem, ChartFormatter, Popover, formatter, MessageBox) {
	"use strict";

    var FIORI_LABEL_SHORTFORMAT_2 = "__UI5__ShortIntegerMaxFraction2";
    var FIORI_LABEL_DATEFORMAT = "__UI5__CustomDate";
    
	return Controller.extend("diploma.analytics.forecast.controller.Main", {
		
		formatter: formatter,
		
		/**
		 * Filecycle hook.
		 * Attaches vaidation handlers, bind elements to initial bindings, initializes the chart .
		 */
		onInit: function() {
			var oModel = this.getOwnerComponent().getModel(),
				i18n = this.getOwnerComponent().getModel("i18n").getResourceBundle();
			oModel.seti18n(i18n);
			
			sap.ui.getCore().attachValidationError(function (oEvent) {
				var oControl = oEvent.getParameter("element");
				if (oControl && oControl.setValueState) {
					oControl.setValueState("Error");
				}
			});
			sap.ui.getCore().attachValidationSuccess(function (oEvent) {
				var oControl = oEvent.getParameter("element");
				if (oControl && oControl.setValueState) {
					oControl.setValueState("None");
				}
			});
			
			this.byId("fmcControlFields").bindAggregation("formElements", {
				path: "/config/control/ARIMA",
				factory: this.formElementFactory.bind(this)
			});
			
			this._initLineChart();
			
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.byId("vhdEntity").getController().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			this.byId("dlgVariants").getController().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this.byId("vhdEntity").getController().attachSelect(this.onSelectFilterEntities, this);
			this.byId("dlgVariants").getController().attachLoad(this.onVariantRestore, this);
		},
		
		onVariantRestore: function(oEvent) {
			var oContent = oEvent.getParameter("content");
			this.byId("fmcControlFields").bindAggregation("formElements", {
				path:		"/config/control/" + oContent.algorithm,
				factory:	this.formElementFactory.bind(this)
			});
			jQuery.sap.delayedCall(500, this, function(){
				this.getView().getModel("request").setData(oContent);
			});
		},
		
		onOpenVariants: function(){
			this.byId("dlgVariants").getController().open();
		},
		
		onOpenValueHelp: function() {
			var oModel = this.getView().getModel("request");
			this.byId("vhdEntity").getController().open(oModel.getProperty("/input/filterType"));
		},
		
		onSelectFilterEntities: function(oEvent) {
			var oModel = this.getView().getModel("request");
			oModel.setProperty("/input/filterValue", oEvent.getParameter("id"));
			oModel.setProperty("/input/filterName", oEvent.getParameter("name"));
		},
		
		onFilterTypeChange: function() {
			var oModel = this.getView().getModel("request");
			oModel.setProperty("/input/filterValue", "");
			oModel.setProperty("/input/filterName", "");
		},
		
		/**
		 * Called when the algorithm select box is changed. Rebinds the form elements for the control parameters.
		 * @param   {object}    oEvent  The event object,
		 * @returns {void}
		 */
		onAlgorithmChanged: function(oEvent) {
			var sAlgorithm = oEvent.getSource().getSelectedKey(),
				oModel = this.getView().getModel("request");
			oModel.getData().control = {};
			oModel.refresh();
			this.byId("fmcControlFields").bindAggregation("formElements", {
				path:		"/config/control/" + sAlgorithm,
				factory:	this.formElementFactory.bind(this)
			});
		},
		
		/**
		 * Called when a help button is pressed. Reads the help page from the custom data of the source button 
		 * and opens the help popover accordingly.
		 * @param   {object}    oEvent  The event object,
		 * @returns {void}
		 */
		onHelpPress: function(oEvent) {
			var sPage = oEvent.getSource().data("page");
			this.byId("popHelp").openBy(oEvent.getSource(), sPage);
		},
		
		/**
		 * Called when the execute button is pressed.
		 * First, this method checks if all the fields have corect values. If not a message is shown.
		 * Otherwise, the busy indicator is shown and the request data is sent to the backend.
		 * Then the request returns, on success the result page is binded and shown.
		 * @returns {void}
		 */
		onExecute: function() {
		    var aElements = this.byId("fmcControlFields").getFormElements(),
		        oFlexBox,
		        oControl,
		        i,
		        i18n = this.getView().getModel("i18n").getResourceBundle(),
		        sAlgorithm = this.getView().getModel("request").getProperty("/algorithm"),
		        oPage = this.byId("pageResults");
		    
		    for (i = 0; i < aElements.length; ++i) {
		        oFlexBox = aElements[i].getFields()[0];
		        oControl = oFlexBox.getItems()[0];
		        if (oControl.getValueState && oControl.getValueState() === "Error") {
		            MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("invalidFieldValues"));
		            return;
		        }
		    }
		    
		    if (!this.getView().getModel("request").getProperty("/input/filterValue")) {
		    	MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("noFilter"));
	            return;
		    }
		    
		    this.getView().setBusy(true);
		    $.ajax({
		        method: "POST",
		        url:    "/destinations/INET_HTTP_DIPLOMA_J0I/services/secondary.xsjs?action=Pal",
		        dataType: "json",
		        headers: { "x-csrf-token": this.byId("vhdEntity").getModel().getSecurityToken() },
		        data:   JSON.stringify(this.getView().getModel("request").getData()),
		        success:   function(oData) {
		            this.getView().getModel("data").setData(oData);
        	        this._bindResultPage("/config/output/presets/" + 
        	            this.getView().getModel().getProperty("/config/output/usage/" + sAlgorithm));
        		    this.byId("appControlForecast").to(oPage);
		        }.bind(this),
		        error: function(oResponse) {
        			MessageBox.error(i18n.getText("errorMessage"), {
        				details:    oResponse.responseText
        			});
		        }
		    }).always(this.getView().setBusy.bind(this.getView(), false));
		    
		},
		
		/**
		 * Called when the restart button is pressed. Simply navigates to the input page and discards the results.
		 * @returns {void}
		 */
		onRestart: function() {
		    this.getView().getModel("data").setData({});
		    this.byId("appControlForecast").back();
		},
		
		/**
		 * Factory method for building the control field form elements.
		 * @param   {string}    sId     The ID of the element to be created.
		 * @param   {BindingContext}    oContext    The binding context of the object.
		 * @returns {FormElement}   The newly created form element.
		 */
		formElementFactory: function(sId, oContext) {
		    var sAlgorithm = oContext.getPath().split("/")[3],
		        i18n = this.getView().getModel("i18n").getResourceBundle();
			return new sap.ui.layout.form.FormElement(sId, {
				label:	oContext.getProperty("name"),
				fields:	[
					new sap.m.FlexBox({
						alignItems: "Start",
						items: [
							this._buildFieldInput(oContext).setLayoutData(new sap.m.FlexItemData({
								growFactor: 1
							})),
							new sap.m.Button({
								icon: "sap-icon://sys-help",
								type: "Transparent",
								tooltip: i18n.getText("helpTooltip"),
								press: this.onHelpPress.bind(this),
								customData: [new sap.ui.core.CustomData({
								    key:    "page",
								    value:  sAlgorithm.toLowerCase() + "-" + oContext.getProperty("id").toLowerCase()
								})]
							}).setLayoutData(new sap.m.FlexItemData({
								growFactor: 0
							}))
						]
					})	
				]
			}); 
		},
		
		/**
		 * Builds an input field for a control parameter. The type is determined from the context.
		 * Also, default values, constraints for input fields and possible items for select boxes are also taken from the context.
		 * @private
		 * @param   {BindingContext}    oContext    The binding context for the containing form element.
		 * @returns {Input|CheckBox|Select} A contro based on the configuration from the context.   
		 */
		_buildFieldInput: function(oContext) {
			var sField = oContext.getProperty("field"),
				oConstraints = {},
				sResultPath = "/control/" + oContext.getProperty("id"),
				oType;
			this.getView().getModel("request").setProperty(sResultPath, oContext.getProperty("default"));
			switch(sField) {
				case "Checkbox": return new sap.m.CheckBox().bindProperty("selected", {
					model:	"request",
					path:	sResultPath
				});
				case "Number": 
					if (oContext.getProperty("minimum") !== undefined) {
						oConstraints.minimum = oContext.getProperty("minimum");
					}
					if (oContext.getProperty("maximum") !== undefined) {
						oConstraints.maximum = oContext.getProperty("maximum");
					}
					if (oContext.getProperty("type") === "integer") {
						oType = new Integer({}, oConstraints);
					}
					else if (oContext.getProperty("type") === "float") {
						oType = new Float({}, oConstraints);
					}
					var oInput = new sap.m.Input({
						type:	"Number",
						width:	"100%"
					}).bindValue({
						model:	"request",
						path:	sResultPath,
						type:	oType
					}).attachChange(function(oEvent) {
					    var oControl = oEvent.getSource();
					    if (oControl.getValue() === "") {
					        oControl.setValueState("Error");
					    }
					});
					return oInput;
				case "Select": return new sap.m.Select({width:	"100%"}).bindItems({
					path:		oContext.getPath() + "/items",
					template:	new sap.ui.core.Item({
						key:	"{key}",
						text:	"{text}"
					})
				}).bindProperty("selectedKey", {
					model:	"request",
					path:	sResultPath
				});
			}
		},
		
		/**
		 * Binds the result page based on a output preset from the configuration.
		 * @private
		 * @param   {string}    sPresetPath     The path to the preset in the model.
		 * @returns {void}
		 */
		_bindResultPage: function(sPresetPath) {
		    var i,
		        oItem,
		        oPage = this.byId("pageResults"),
		        oPreset = this.getView().getModel().getObject(sPresetPath);
		    
		    oPage.bindElement({
		        path:   sPresetPath
		    });
		    
		    if (oPreset.measures) {
		        this._bindLineChart(oPreset.measures);
    		    oItem = new sap.m.ColumnListItem({type: "Inactive"});
    		    for (i = 0; i < oPreset.measures.length; ++i) {
    		        oItem.addCell(new sap.m.Text().bindProperty("text",{
    		            path:   oPreset.measures[i].field,
    		            model:  "data",
    		            formatter: oPreset.measures[i].format ? formatter[oPreset.measures[i].format] : formatter.none
    		        }));
    		    }
    		    this.byId("tblResults").bindItems({
    		        path:   "/result",
    		        model:  "data",
    		        sorter: new sap.ui.model.Sorter("timestamp", true),
    		        template: oItem
    		    });
		    }
		    
		    if (oPreset.stats) {
		        oItem = new sap.m.ColumnListItem({type: "Inactive"});
    		    for (i = 0; i < oPreset.stats.length; ++i) {
    		        oItem.addCell(new sap.m.Text({text: "{data>" + oPreset.stats[i].field + "}"}));
    		    }
    		    this.byId("tblStats").bindItems({
    		        path:   "/statistics",
    		        model:  "data",
    		        template: oItem
    		    });
		    }
		},
		
	
		/**
		 * Initializes the line chart.
		 * @private
		 * @returns {void}
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
                title: {
                    visible: false
                },
                general: {
                    layout: {
                        padding: 0.04
                    }
                },
                timeAxis: {
                	levels: ["day","month", "year"],
                	title: {
                		visible: false
                	},
                    interval: {
                        unit: "auto"
                    }
                },
                valueAxis: {
                	title: {
                		visible: false
                	},
                    label: {
                        formatString: FIORI_LABEL_SHORTFORMAT_2
                    }
                },
                plotArea: {
                    dataLabel: {                        
                        visible:		false,
                        formatString:	FIORI_LABEL_SHORTFORMAT_2,
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
			oFormat[this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("timeDimension")] = FIORI_LABEL_DATEFORMAT;
			oPopOver.setFormatString(oFormat);
			
            oVizFrame.setModel(this.getOwnerComponent().getModel("data"));
		},
		
		/**
		 * Binds the data to the line chart.
		 * @param	{object}	aChartMeasures	The chart measure data (from the preset).
		 * @returns {void}
		 */
		_bindLineChart: function(aChartMeasures){
			var oVizFrame = this.getView().byId("lineChart");
			var aNames = [], aMeasures = [], aRules = [];
			for (var i = 0; i < aChartMeasures.length; ++i) {
			    if (aChartMeasures[i].field !== "date") {
    				aNames.push(aChartMeasures[i].name);
    				aMeasures.push({
    					name:	aChartMeasures[i].name,
    					value:  "{" + aChartMeasures[i].field + "}"
    				});
    				aRules.push({
    				    "dataContext": {"measureNames": aChartMeasures[i].name},
                        "properties": {
                            "color": aChartMeasures[i].color,
                            "lineColor": aChartMeasures[i].color,
                            "lineType": aChartMeasures[i].dotted ? "dotted" : "line"
                        },
                        "displayName": aChartMeasures[i].name
    				});
			    }
			}
			
            var oDataset = new FlattenedDataset({
				dimensions: [{
					name:		this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("timeDimension"),
					value:		"{date}",
					dataType:	"date"
				}],
                measures: aMeasures,
                data: {
                    path: "/result"
                }
            });
            
            oVizFrame.removeAllFeeds();
            oVizFrame.addFeed(new FeedItem({
                uid:	"timeAxis",
                type:	"Dimension",
                values: [this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("timeDimension")]
            }));
            oVizFrame.addFeed(new FeedItem({
                uid:	"valueAxis",
                type:	"Measure",
                values: aNames
            }));
            
            oVizFrame.setDataset(oDataset);	
			oVizFrame.setVizProperties({
                plotArea: {
                    dataPointStyle: {
                        "rules": aRules
                    }
                }
			 });
		}
		
	});

});