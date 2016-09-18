/*global location */
sap.ui.define([
	"diploma/admin/sensor/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"diploma/admin/sensor/model/formatter"
], function(BaseController, JSONModel, MessageBox, formatter) {
	"use strict";
	
	var aMathFunctions = ["abs", "acos", "asin", "atan", "atan2", "ceil", 
		"cos", "exp", "floor", "log", "max", "min", "pow", "round", "sin", "sqrt", "tan"];
	var oConversionRegex = /^[ #0-9()/*+\-,.]*$/;
	var oExprFieldRegex = /\$(M|S)\([0-9a-zA-Z ]+\)/g;
	
	return BaseController.extend("diploma.admin.sensor.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				convertCorrect: true,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			
			sap.ui.getCore().attachValidationError(function (evt) {
				var control = evt.getParameter("element");
				if (control && control.setValueState) {
					control.setValueState("Error");
				}
			});
			sap.ui.getCore().attachValidationSuccess(function (evt) {
				var control = evt.getParameter("element");
				if (control && control.setValueState) {
					control.setValueState("None");
				}
			});
			
			var sDensityClass = this.getOwnerComponent().getContentDensityClass();
			this.byId("page").getDependents().forEach(function(oItem) {
			    oItem.addStyleClass(sDensityClass);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var oViewModel = this.getModel("detailView");
			var oGlobalModel = this.getModel("global");
			var sObjectId = oEvent.getParameter("arguments").objectId;
			if (sObjectId === "new") {
				oGlobalModel.setProperty("/isNew", true);
				oGlobalModel.setProperty("/edit", true);
				oViewModel.setProperty("/busy", false);
				this.getView().unbindElement();
			} else {
				if (oGlobalModel.getProperty("/isNew")) {
					oGlobalModel.setProperty("/edit", false);
				}
				oGlobalModel.setProperty("/isNew", false);
				var sObjectPath = "/SensorTypes('" + sObjectId + "')";
				this._bindView(sObjectPath);
			}
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				},
				parameters: {
					expand: "Measure"
				}
			});
		},

		/**
		 * Called when the page's event binding was changed.
		 */
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath();

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

		},

		/**
		 * Called when the odata service's model is loaded. Hides the busy indicator and resets busy delay.
		 */
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);
			
			if (!this.getModel("global").getProperty("/isNew")) {
				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
			}
		},
		
		/**
		 * Called when the virtual checkbox is pressed.
		 * Hides / shows the right input fields (either conversion or expresion field).
		 * @param	{object}	oEvent	The event object.
		 * @returns {void}
		 */
		onVirtualChanged: function(oEvent) {
			var bSelected = oEvent.getSource().getSelected();
			this.byId("lblConv").setVisible(!bSelected);
			this.byId("sensorConv").setVisible(!bSelected);
			this.byId("lblExpr").setVisible(bSelected);
			this.byId("sensorExpr").setVisible(bSelected);
		},
		
		/**
		 * Commits the changes to the backend. This can either call a create or an update operation.
		 */
		onSave: function() {
			var sConversion = !this.byId("sensorVirtual").getSelected() 
				? (this.byId("sensorConv").getValue() === "" ? null : this.byId("sensorConv").getValue())
				: (this.byId("sensorExpr").getValue() === "" ? null : this.byId("sensorExpr").getValue());
			if (this.getModel("global").getProperty("/isNew")) {
				this.getModel().create("/SensorTypes", {
					id:				"",
					name:			this.byId("sensorName").getValue(),
					description:	this.byId("sensorDesc").getValue(),
					measure:		this.byId("sensorMeasure").getSelectedKey(),
					conversion:		sConversion,
					virtual:		this.byId("sensorVirtual").getSelected() ? 1 : 0
				}, {
					success: function(oData) {
						this.getRouter().navTo("object", {objectId: oData.id});
					}.bind(this)
				});
			}
			else {
				this.getModel().update(this.getView().getElementBinding().getPath(), {
					name:			this.byId("sensorName").getValue(),
					description:	this.byId("sensorDesc").getValue(),
					measure:		this.byId("sensorMeasure").getSelectedKey(),
					conversion:	    sConversion,
					virtual:		this.byId("sensorVirtual").getSelected() ? 1 : 0
				}, {
					success: function() {
						this.getModel().refresh();
						this.getModel("global").setProperty("/edit", false);
					}.bind(this)
				});
			}
		},
		
		/**
		 * Event handler for pressing the edit button.
		 */
		onEdit: function() {
			this.getModel("global").setProperty("/edit", true);
		},
		
		/**
		 * Event handler for pressing the cancel button.
		 */
		onCancel: function() {
			this.getModel("global").setProperty("/edit", false);
			if (this.getModel("global").getProperty("/isNew")) {
				this.getRouter().navTo("master");
			}
			else {
				this.getModel().updateBindings(true);
			}
		},
		
		/**
		 * Deletes a sensor type.
		 */
		onDelete: function() {
		    var oContext = this.getView().getBindingContext(),
		        fnOnSuccess = this.getRouter().navTo.bind(this.getRouter(), "master");
	        MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteSensor", [oContext.getProperty("name")]), {
	            onClose: function(sAction) {
	                if (sAction === MessageBox.Action.OK) {
	                    oContext.getModel().remove(oContext.getPath(), {
	                        success: fnOnSuccess
	                    });
	                }
	            }
	        });
		},
		
		/**
		 * Opens the conversion rule editor dialog.
		 */
		openConvertDialog: function() {
			this.getModel("detailView").setProperty("/convertCorrect", true);
			this.byId("inpExpression").setValue(this.byId("sensorConv").getValue());
			this.byId("lblExprResult").setText(this.getResourceBundle().getText("testResultEmpty"));
			this.byId("dialogConvert").setVisible(true).open();
		},
		
		/**
		 * Closes the conversion rule editor dialog.
		 */
		closeConvertDialog: function() {
			this.byId("dialogConvert").setVisible(false).close();
		},
		
		/**
		 * Parses and evaluates a conversion formula.
		 */
		testExpression: function() {
			if (this.byId("inpExpression").getValue() === "") {
				return;
			}
			var sValue = this.byId("inpExpression").getValue();
			var sReplaced = sValue.replace(new RegExp("(" + aMathFunctions.join("|") + ")", "g"), "0");
			if (!oConversionRegex.test(sReplaced)){
				this.byId("lblExprResult").setText(this.getResourceBundle().getText("exprError"));
				this.getModel("detailView").setProperty("/convertCorrect", false);
			}
			else {
				if (this.byId("inpTest").getValue() === "") {
					this.byId("lblExprResult").setText(this.getResourceBundle().getText("testResultEmpty"));
					this.getModel("detailView").setProperty("/convertCorrect", true);
					return;
				}
				var nTest = Number(this.byId("inpTest").getValue());
				if (isNaN(nTest)) {
					this.byId("lblExprResult").setText(this.getResourceBundle().getText("testError"));
					this.getModel("detailView").setProperty("/convertCorrect", false);
				}
				else {
					sReplaced = sValue.replace(new RegExp("(" + aMathFunctions.join("|") + ")", "g"), "Math.$1");
					sReplaced = sReplaced.replace(/[#]+/g, nTest);
					try {
						this.byId("lblExprResult").setText(this.getResourceBundle().getText("testResult", [eval(sReplaced)]));
						this.getModel("detailView").setProperty("/convertCorrect", true);
					}
					catch(e) {
						this.byId("lblExprResult").setText(this.getResourceBundle().getText("exprError"));
						this.getModel("detailView").setProperty("/convertCorrect", false);
					}
				}
			}
		},
		
		/**
		 * Applies the changes made in the dialog to the "real" input field.
		 */
		changeConvertValue: function() {
			this.byId("sensorConv").setValue(this.byId("inpExpression").getValue());
			this.closeConvertDialog();
		},
		
			/**
		 * Opens the expression rule editor dialog.
		 */
		openExpressionDialog: function() {
			var sValue = this.byId("sensorExpr").getValue();
			this.getModel("detailView").setProperty("/expressionCorrect", true);
			this.byId("inpCalculation").setValue(sValue);
			this._parseExpressionFields(sValue);
			this.byId("lblCalcResult").setText(this.getResourceBundle().getText("testResultEmpty"));
			this.byId("dialogExpression").setVisible(true).open();
		},
		
		/**
		 * Closes the expression rule editor dialog.
		 */
		closeExpressionDialog: function() {
			this.byId("dialogExpression").setVisible(false).close();
		},
		
		/**
		 * Retrieves the fields from an expression and saves them in the model.
		 * @param	{string}	sExpression	The calculation expression.
		 * @returns {void}
		 */
		_parseExpressionFields: function(sExpression) {
			var aFields = sExpression.match(oExprFieldRegex),
				aResults = [],
				i,
				i18n = this.getResourceBundle(); 
			for (i = 0; aFields && i < aFields.length; ++i) {
				var sLabel = aFields[i].charAt(1) === "S" 
					? i18n.getText("systemFieldLabel", [aFields[i].substring(3, aFields[i].length - 1)])
					: i18n.getText("measureFieldLabel", [aFields[i].substring(3, aFields[i].length - 1)]);
				aResults.push({
					label: sLabel,
					name: aFields[i],
					value: 0
				});
			}
			this.getModel("detailView").getData().expressionFields = aResults;
			this.getModel("detailView").refresh();
		},
		
		/**
		 * Called when the calculation expression is changed. Parses the expression and tests it.
		 */
		onCalcExprChanged: function() {
			var sValue = this.byId("inpCalculation").getValue();
			if (sValue === "") {
				return;
			}
			this._parseExpressionFields(sValue);
			this.testCalculation();
		},
		
		/**
		 * Parses and evaluates a calculation formula.
		 */
		testCalculation: function() {
			var sValue = this.byId("inpCalculation").getValue(),
				sReplaced,
				aItems = this.byId("frcFields").getFormElements(),
				i,
				sName,
				nTest;
			sReplaced = sValue.replace(new RegExp("(" + aMathFunctions.join("|") + ")", "g"), "0");
			sReplaced = sReplaced.replace(oExprFieldRegex, "0");
			if (!oConversionRegex.test(sReplaced)){
				this.byId("lblCalcResult").setText(this.getResourceBundle().getText("exprError"));
				this.getModel("detailView").setProperty("/expressionCorrect", false);
			}
			else {
				sReplaced = sValue;
				for (i = 0; i < aItems.length; ++i) {
					sName = aItems[i].getBindingContext("detailView").getProperty("name");
					nTest = parseFloat(aItems[i].getFields()[0].getValue()) || 0;
					nTest = isNaN(nTest) ? 0 : nTest;
					sReplaced = sReplaced.replace(new RegExp(sName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), nTest);
				}
				sReplaced = sReplaced.replace(new RegExp("(" + aMathFunctions.join("|") + ")", "g"), "Math.$1");
				try {
					this.byId("lblCalcResult").setText(this.getResourceBundle().getText("testResult", [eval(sReplaced)]));
					this.getModel("detailView").setProperty("/expressionCorrect", true);
				}
				catch(e) {
					this.byId("lblCalcResult").setText(this.getResourceBundle().getText("exprError"));
					this.getModel("detailView").setProperty("/expressionCorrect", false);
				}
			}
		},
		
		/**
		 * Applies the changes made in the dialog to the "real" input field.
		 */
		changeExpressionValue: function() {
			this.byId("sensorExpr").setValue(this.byId("inpCalculation").getValue());
			this.closeExpressionDialog();
		}
		

	});

});