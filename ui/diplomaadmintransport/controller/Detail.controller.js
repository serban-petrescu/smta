/*global location */
sap.ui.define([
	"diploma/admin/transport/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"diploma/admin/transport/model/formatter"
], function(BaseController, JSONModel, MessageToast, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("diploma.admin.transport.controller.Detail", {

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
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading"),
				limitTypes: [
					{
						key: 0,
						name: this.getResourceBundle().getText("lowerThan", ["X", this.getResourceBundle().getText("units")])
					},
					{
						key: 1,
						name: this.getResourceBundle().getText("greaterThan", ["X", this.getResourceBundle().getText("units")])
					},
					{
						key: 2,
						name: this.getResourceBundle().getText("between", ["X", "Y", this.getResourceBundle().getText("units")])
					}
				],
				limit: {
					measure: "",
					type:	"2",
					lower:	0,
					upper:	100
				},
				person: {
				    id:     "",
				    name:   "",
				    role:   "",
				    advanced: false
				}
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			
			var sStyleClass = this.getOwnerComponent().getContentDensityClass();
			this.byId("page").getDependents().forEach(function(oItem){
			    oItem.addStyleClass(sStyleClass);
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
		
		/** Called when the user presses an email. Opens the default email client. */
		onSendEmail: function(oEvent) {
		    sap.m.URLHelper.triggerEmail(oEvent.getSource().getBindingContext().getProperty("Person/email"));
		},
		
		/** Called when the route has changed. */
		onRouteChange: function(oEvent) {
		    var oItem = oEvent.getSource().getSelectedItem();
		    if (oItem) {
    			this.byId("transSchedule").bindElement(oItem.getBindingContext().getPath());
		    }
		},

		/**
		 * Commits the changes to the backend. 
		 */
		onUpdateCommit: function() {
		    var oDate = this._getDateTime(),
		        oBinding = this.getView().getElementBinding();
		    if (oBinding.getBoundContext().getProperty("lastLocation") && oBinding.getBoundContext().getProperty("lastWhen")
		        && oBinding.getBoundContext().getProperty("lastWhen").getTime() !== oDate.getTime()) {
		        MessageBox.error(this.getResourceBundle().getText("errorMessageTransportStarted"));
		        return;
		    }
		    this.getModel().update(oBinding.getPath(), {
				description:	this.byId("transDesc").getValue(),
				tWhen:			oDate,
				route:			this.byId("transRoute").getSelectedKey(),
				schedule:		this.byId("transSchedule").getSelectedKey(),
				returning:      this.byId("transReturning").getSelected() ? 1 : 0,
				lastWhen:       oDate,
				done:           0
			}, {
				success: function() {
					MessageToast.show(this.getResourceBundle().getText("changesSavedSuccesfully"));
				}.bind(this)
			});
		},
		
		/**
		 * Commits the changes to the backend. 
		 */
		onCreateCommit: function() {
		    var oDate = this._getDateTime();
			this.getModel().create("/Transports", {
				id:				"",
				description:	this.byId("transDesc").getValue(),
				tWhen:			oDate,
				route:			this.byId("transRoute").getSelectedKey(),
				schedule:		this.byId("transSchedule").getSelectedKey(),
				returning:      this.byId("transReturning").getSelected() ? 1 : 0,
				lastWhen:       oDate,
				lastLocation:   null,
				done:           0
			}, {
				success: function(oData) {
					this.getRouter().navTo("object", {objectId: oData.id});
				}.bind(this)
			});
		},
		
		/**
		 * Event handler for pressing the edit button.
		 */
		onEdit: function() {
			this.getModel("global").setProperty("/edit", true);
		},
		
		/** Revert the changes done to the transport. */
		onUndo: function() {
		    var sRoute = this.getView().getElementBinding().getBoundContext().getProperty("route");
		    if (sRoute) {
			    this.byId("transSchedule").bindElement("/Routes('" + sRoute  + "')");
		    }
			this.getModel().updateBindings(true);
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
		    var sRoute = this.getView().getElementBinding().getBoundContext().getProperty("route");
		    this.getModel("global").setProperty("/edit", false);
		    if (sRoute) {
    			this.byId("transSchedule").bindElement("/Routes('" + sRoute + "')");
		    }
			this.getModel().updateBindings(true);
		},
		
		/**
		 * Deletes a transport.
		 */
		onDelete: function() {
		    var oContext = this.getView().getBindingContext(),
		        fnOnSuccess = this.getRouter().navTo.bind(this.getRouter(), "master");
	        MessageBox.confirm(this.getResourceBundle().getText("confirmDeleteTransport", [oContext.getProperty("description")]), {
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
		 * Opens the limit maintainence dialog.
		 */
		openLimitDialog: function() {
			this.byId("dialogLimit").open();
		},
		
		/**
		 * Closes the limit maintainence dialog.
		 */
		closeLimitDialog: function() {
			this.byId("dialogLimit").close();
		},
		
		/**
		 * Creates a new limit.
		 */
		onNewLimit: function() {
			var oModel = this.getModel("detailView");
			this.getModel().create("/Limits", {
				transport:	this.getView().getBindingContext().getProperty("id"),
				measure:	oModel.getProperty("/limit/measure"),
				lowerBound: oModel.getProperty("/limit/type") === "0" ? undefined : oModel.getProperty("/limit/lower") + "",
				upperBound: oModel.getProperty("/limit/type") === "1" ? undefined : oModel.getProperty("/limit/upper") + "",
				notified:	0
			}, {success: this.closeLimitDialog.bind(this)});
		},
		
		/**
		 * Deletes a limit.
		 * @param	{object}	oEvent	The event object.
		 * @returns {void}
		 */
		deleteLimit: function(oEvent) {
			this.getModel().remove(oEvent.getParameter("listItem").getBindingContext().getPath());
		},
		
		/**
		 * Calls the navigation service and attempts to open the organization application.
		 * @param	{object}	oEvent	The event object.
		 * @returns {void}
		 */
		navigateToOrganization: function(oEvent) {
			var sId = oEvent.getSource().getBindingContext().getProperty("Person/organization");
			
			if (!sap.ushell || !sap.ushell.Container || !sap.ushell.Container.getService) {
				return;
			}
			var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (!oService) {
				return;
			}
			
			oService.toExternal({
				target: {
					shellHash: "Organization-Manage&/Organization/" + sId
				}
			});
		},
		
		/**
		 * Calls the navigation service and attempts to open the device application.
		 * @param	{object}	oEvent	The event object.
		 * @returns {void}
		 */
		navigateToDevice: function(oEvent) {
			var sDeviceId = oEvent.getSource().getBindingContext().getProperty("id");
			
			if (!sap.ushell || !sap.ushell.Container || !sap.ushell.Container.getService) {
				return;
			}
			var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
			if (!oService) {
				return;
			}
			
			oService.toExternal({
				target: {
					shellHash: "Device-Manage&/Devices/" + sDeviceId
				}
			});
		},
		
		/**
		 * Opens the person value help dialog.
		 */
		openPersonVhd: function() {
		    var oViewModel = this.getModel("detailView");
		    oViewModel.setProperty("/person/name", "");
		    oViewModel.setProperty("/person/role", "");
		    oViewModel.setProperty("/person/id", "");
		    this.byId("vhdPerson").open();
		},

        /**
		 * Called when the "Advanced" / "Basic" button is pressed.
		 * Updates the view model to show or hide the advanced search panel.
		 * @returns {void}
		 */
		onTogglePersonAdvancedSearch: function() {
		    this.getModel("detailView").setProperty("/person/advanced", 
		        !this.getModel("detailView").getProperty("/person/advanced"));
		},
		
		/**
		 * Common "search" event handler for all search fields on the person value help dialog.
		 * Performs a filtering based on the type of search (basic / advanced) and the search queries.
		 * @returns {void}
		 */
		onSearchPersonMain: function() {
		    var aFilters = [], sQuery,
		        bAdvanced = this.getModel("detailView").getProperty("/person/advanced");
		    
		    sQuery = this.byId("seaPersonNameSearch").getValue();
			if (sQuery && sQuery.length > 0) {
				aFilters.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			sQuery = this.byId("seaPersonOrganizationSearch").getValue();
			if (sQuery && sQuery.length > 0 && bAdvanced) {
				aFilters.push(new sap.ui.model.Filter("Organization/name", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			sQuery = this.byId("seaPersonEmailSearch").getValue();
			if (sQuery && sQuery.length > 0 && bAdvanced) {
				aFilters.push(new sap.ui.model.Filter("email", sap.ui.model.FilterOperator.Contains, sQuery));
			}
			
			this.byId("tblPersonSearchMain").getBinding("items").filter(aFilters, "Application");
		},
		
		/**
		 * Closes the person value help dialog.
		 */
		onPersonVhdClose: function() {
		    this.byId("vhdPerson").close();
		},
		
		/**
		 * Called when the confirm button is pressed.
		 * Creates a new involvement and, on success, closes the dialog.
		 */
		onPersonVhdConfirm: function() {
		    this.getModel().create("/Involvements", {
		        transport:  this.getView().getBindingContext().getProperty("id"),
		        person:     this.getModel("detailView").getProperty("/person/id"),
		        role:       this.getModel("detailView").getProperty("/person/role")
		    }, {success:    this.onPersonVhdClose.bind(this)});
		},
		
		/**
		 * Called when a person from the value help dialg is pressed.
		 * Updates the view model with the newly selected person's info.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		onPersonSelected: function(oEvent) {
		    var oContext = oEvent.getSource().getBindingContext(),
		        oViewModel = this.getModel("detailView");
		    oViewModel.setProperty("/person/id", oContext.getProperty("id"));
		    oViewModel.setProperty("/person/name", oContext.getProperty("name"));
		    oViewModel.setProperty("/person/role", oContext.getProperty("defaultRole"));
		},
		
		/**
		 * Called when a delete button from the person list is presed.
		 * Deletes the corresponding person.
		 * @param   {Event} oEvent  The event object.
		 * @returns {void}
		 */
		 onPersonDelete: function(oEvent) {
			this.getModel().remove(oEvent.getParameter("listItem").getBindingContext().getPath());
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
				var aItems = this.byId("transRoute").getItems();
				if (aItems && aItems.length) {
				    this.byId("transRoute").setSelectedItem(aItems[0]);
				    this.byId("transSchedule").bindElement(aItems[0].getBindingContext().getPath());
				}
			} else {
				if (oGlobalModel.getProperty("/isNew")) {
					oGlobalModel.setProperty("/edit", false);
				}
				oGlobalModel.setProperty("/isNew", false);
				var sObjectPath = "/Transports('" + sObjectId + "')";
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
				parameters: {expand: "Route,Schedule"}
			});
			
		},

		/**
		 * Called when the page's event binding was changed.
		 */
		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oContext = oElementBinding.getBoundContext();

			// No data for the binding
			if (!oContext) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath();
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			if (oContext.getProperty("route")) {
			    this.byId("transSchedule").bindElement("/Routes('" + oContext.getProperty("route")  + "')");
			}
		},
        
        /**
         * Combines the date and time from the inputs to obtain the UTC datetime instance.
         * @returns {Date}  The UTC date time from the inputs.
         */
        _getDateTime: function() {
		    var oTime = this.byId("transWhenTime").getDateValue(),
		        oDate = this.byId("transWhenDate").getDateValue();
		    return new Date(oDate.getFullYear(), oDate.getMonth(), oDate.getDate(), 
		            oTime.getHours(), oTime.getMinutes(), oTime.getSeconds());
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
		}
	});

});