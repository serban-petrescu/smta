/*global location */
sap.ui.define([
	"diploma/admin/organization/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"diploma/admin/organization/model/formatter"
], function(BaseController, JSONModel, MessageToast, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("diploma.admin.organization.controller.Detail", {
		
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
			if (this.byId("tblPeople").getBinding("items").isLengthFinal()) {
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
				var sObjectPath = "/Organizations('" + sObjectId + "')";
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
				oLineItemTable = this.byId("tblPeople"),
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
		 * Deletes an organization.
		 */
		onDelete: function() {
		    var oContext = this.getView().getBindingContext(),
		        fnOnSuccess = this.getRouter().navTo.bind(this.getRouter(), "master");
	        MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteOrganization", [oContext.getProperty("name")]), {
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
				name:			this.byId("inpOrganizationName").getValue()
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
			this.getModel().create("/Organizations", {
				id:				"",
				name:			this.byId("inpOrganizationName").getValue()
			}, {
				success: function(oData) {
					this.getRouter().navTo("object", {objectId: oData.id});
				}.bind(this)
			});
		},
		
		/**
		 * Opens the person update dialog.
		 */
		openEditPersonDialog: function() {
		    var oItem = this.byId("tblPeople").getSelectedItem();
		    if (oItem) {
		        this.byId("dlgPerson").bindElement(oItem.getBindingContext().getPath());
		    }
			this.byId("dlgPerson").open();
		},
		
		/**
		 * Opens the person creation dialog.
		 */
		openAddPersonDialog: function() {
		    this.byId("dlgPerson").unbindElement();
			this.byId("inpPersonName").setValue("");
			this.byId("inpPersonEmail").setValue("");
			this.byId("selPersonRole").setSelectedKey(null);
			this.byId("dlgPerson").open();
		},
		
		/**
		 * Closes the person maintainence dialog.
		 */
		closePersonDialog: function() {
			this.byId("dlgPerson").close();
		},
		
		/**
		 * Creates a new person or updates an existing one.
		 */
		onSavePerson: function() {
		    var sDefaultRole = this.byId("selPersonRole").getSelectedKey(),
		        oBinding = this.byId("dlgPerson").getElementBinding();
		    if (oBinding) {
    			this.getModel().update(oBinding.getPath(), {
    				name: 	    this.byId("inpPersonName").getValue(),
    				email:      this.byId("inpPersonEmail").getValue(),
    				organization: this.getView().getBindingContext().getProperty("id"),
    				defaultRole: sDefaultRole ? sDefaultRole : null
    			},{ success:  this.closePersonDialog.bind(this)});
		    }
		    else {
    			this.getModel().create("/Persons", {
    			    id:         "",
    				name: 	    this.byId("inpPersonName").getValue(),
    				email:      this.byId("inpPersonEmail").getValue(),
    				organization: this.getView().getBindingContext().getProperty("id"),
    				defaultRole: sDefaultRole ? sDefaultRole : null
    			},{ success:  this.closePersonDialog.bind(this)});
		    }
		},
		
		/**
		 * Deletes a person.
		 */
		onDeletePerson: function() {
		    var oItem = this.byId("tblPeople").getSelectedItem(),
		        oContext;
		    if (oItem) {
		        oContext = oItem.getBindingContext();
    	        MessageBox.confirm(this.getResourceBundle().getText("confirmDeletePerson", [oContext.getProperty("name")]), {
    	            onClose: function(sAction) {
    	                if (sAction === MessageBox.Action.OK) {
    	                    oContext.getModel().remove(oContext.getPath());
    	                }
    	            }
    	        });
		    }
		}
	});

});