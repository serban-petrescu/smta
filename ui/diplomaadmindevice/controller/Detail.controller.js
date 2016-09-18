/*global location */
sap.ui.define([
	"diploma/admin/devices/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"diploma/admin/devices/model/formatter"
], function(BaseController, JSONModel, MessageToast, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("diploma.admin.devices.controller.Detail", {
		
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
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			
			var sDensityClass = this.getOwnerComponent().getContentDensityClass();
			this.byId("page").getDependents().forEach(function(oItem) {
			    oItem.addStyleClass(sDensityClass);
			});
			
			this.byId("vhdTransports").getController().addStyleClass(sDensityClass);
			this.byId("vhdTransports").getController().attachSelect(this.onTransportValueHelpSelect, this);
			this.byId("vhdTransports").getController().attachClear(this.onTransportValueHelpClear, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        
        /**
         * Called when the value help of the transport input field is pressed.
         * Opens the transport value help dialog. 
         */
        onTransportValueHelpRequested: function() {
            this.byId("vhdTransports").getController().open();
        },
        
        /**
         * Called when the user selects a transport in the value help.
         * Updates the device transport input.
         * @param   {Event} oEvent  The event object.
         * @returns {void}
         */
        onTransportValueHelpSelect: function(oEvent) {
            var oContext = oEvent.getParameter("source").getBindingContext();
            this.byId("deviceTrans").setValue(oContext.getProperty("Transport/description"));
            this.byId("deviceTrans").data("transport", oContext.getProperty("id"));
        },
        
        /**
         * Called when the user pressed the clear button the value help.
         * Updates the device transport input.
         * @returns {void}
         */
        onTransportValueHelpClear: function() {
            this.byId("deviceTrans").setValue("");
            this.byId("deviceTrans").data("transport", "");
        },
        
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
			}
			else {
				if (oGlobalModel.getProperty("/isNew")) {
					oGlobalModel.setProperty("/edit", false);
				}
				oGlobalModel.setProperty("/isNew", false);
				var sObjectPath = "/Devices('" + sObjectId + "')";
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
					expand: "Transport,Transport/Route/ToLocation,Transport/Route/FromLocation"
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
			this.getOwnerComponent().oListSelector.selectAListItem(oElementBinding.getPath());
		},
		
		/**
		 * Called when the odata service's model is loaded. Hides the busy indicator and resets busy delay.
		 */
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});
			
			if (!this.getModel("global").getProperty("/isNew")) {
				// Binding the view will set it to not busy - so the view is always busy if it is not bound
				oViewModel.setProperty("/busy", true);
				// Restore original busy indicator delay for the detail view
				oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
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
		onCreateCancel: function() {
			this.getModel("global").setProperty("/edit", false);
			this.getModel("global").setProperty("/isNew", false);
			this.getRouter().navTo("master");
		},
		
		/**  
		* Event handler for pressing the display button.
		*/
		onDisplay: function() {
		    this.getModel("global").setProperty("/edit", false);
			this.getModel().updateBindings(true);
		},
		
		/** Revert the changes done to the entity. */
		onUndo: function() {
			this.getModel().updateBindings(true);
		},
		
		/**
		 * Deletes a device.
		 */
		onDelete: function() {
		    var oContext = this.getView().getBindingContext(),
		        fnOnSuccess = this.getRouter().navTo.bind(this.getRouter(), "master");
	        MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteDevice", [oContext.getProperty("name")]), {
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
		 * Commits the changes to the backend. 
		 * 
		 */
		onUpdateCommit: function() {
		    this.getModel().update(this.getView().getElementBinding().getPath(), {
				name:			this.byId("deviceName").getValue(),
				description:	this.byId("deviceDesc").getValue(),
				active:			1,
				transport:		this.byId("deviceTrans").data("transport")
			}, {
				success: function() {
					MessageToast.show(this.getResourceBundle().getText("changesSavedSuccesfully"));
				}.bind(this)
			});
		},
		
		/**
		 * Commits the newly created entity to the backend.
		 */
		onCreateCommit: function() {
			this.getModel().create("/Devices", {
				id:				"",
				name:			this.byId("deviceName").getValue(),
				description:	this.byId("deviceDesc").getValue(),
				active:			1,
				transport:		this.byId("deviceTrans").data("transport")
			}, {
				success: function(oData) {
					this.getRouter().navTo("object", {objectId: oData.id});
				}.bind(this)
			});
		},
		
		
		/**
		 * Opens the sensor maintainence dialog.
		 */
		openSensorDialog: function() {
			this.byId("sensorNumber").setValue("");
			this.byId("dialogSensor").open();
		},
		
		/**
		 * Closes the sensor maintainence dialog.
		 */
		closeSensorDialog: function() {
			this.byId("dialogSensor").close();
		},
		
		/**
		 * Creates a new sensor.
		 */
		onCreateSensor: function() {
			this.getModel().create("/DeviceSensors", {
				device: 	this.getView().getBindingContext().getProperty("id"),
				number:		parseInt(this.byId("sensorNumber").getValue()),
				sensorType: this.byId("sensorType").getSelectedKey()
			},{ success:  this.closeSensorDialog.bind(this)});
		},
		
		/**
		 * Deletes a sensor
		 */
		onDeleteSensor: function(oEvent) {
			this.getModel().remove(oEvent.getParameter("listItem").getBindingContext().getPath());
		},
		
		/**
		 * Calls the navigation service if available and atempts to open the sensor management app.
		 */
		navigateToSensor: function(oEvent) {
			var sSensorId = oEvent.getSource().getBindingContext().getProperty("sensorType");
			
			if (!sap.ushell || !sap.ushell.Container || !sap.ushell.Container.getService) {
				return;
			}
			var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (!oService) {
				return;
			}
			
			oService.toExternal({
				target: {
					shellHash: "Sensor-Manage&/SensorTypes/" + sSensorId
				}
			});
		},
		
		
		/**
		 * Calls the navigation service if available and atempts to open the sensor management app.
		 */
		navigateToTransport: function(oEvent) {
			var sTransportId = oEvent.getSource().getBindingContext().getProperty("Transport/id");
			
			if (!sap.ushell || !sap.ushell.Container || !sap.ushell.Container.getService) {
				return;
			}
			var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (!oService) {
				return;
			}
			
			oService.toExternal({
				target: {
					shellHash: "Transport-Display&/Transports/" + sTransportId
				}
			});
		}
	});

});