sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/resource/ResourceModel", "sap/ui/model/json/JSONModel",
"sap/m/MessageBox", "sap/m/Dialog", "sap/m/Text", "sap/m/Button", "sap/ui/model/type/Integer", "sap/ui/model/ValidateException"],
function(Controller, ResourceModel, JSONModel, MessageBox, Dialog, Text, Button, Integer, ValidateException){

    /**
     * The main controller for the view.
     * @class
     */
    return Controller.extend("controllers.Main", {

        /**
         * Lifecycle hook.
         * Creates the models and binds the form elements.
         * @returns {void}
         */
        onInit: function() {
            var oModel = new JSONModel({
                settings: {
                    sensors: [],
                    name: "",
                    interval: 1,
                    internet: {
                        available: false,
                        enabled:   false
                    }
                },
                started: false
            });
            this.setModel(oModel);
            this.setModel(new ResourceModel({bundleName: "i18n.i18n"}), "i18n");

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

            this.onRefresh();
        },

        /**
        * Helper method which calls the corresponding method from the view.
        * @returns {Model}  The requested model.
        */
        getModel: function() {
            return this.getView().getModel.apply(this.getView(), arguments);
        },

        /**
        * Helper method which calls the corresponding method from the view.
        * @returns {object} This.
        */
        setModel: function() {
            this.getView().setModel.apply(this.getView(), arguments);
            return this;
        },

        /**
        * Helper method which retrieves the ResourceBundle of the i18n model.
        * @returns {ResourceBundle}  The i18n resource bundle.
        */
        getResourceBundle: function() {
            return this.getView().getModel("i18n").getResourceBundle();
        },

        /**
        *  Removes the currently selected sensor.
        *  @param   {Event}     oEvent      The event object.
        *  @returns {void}
        */
        onDeleteSensor: function(oEvent) {
            var sPath = oEvent.getParameter("listItem").getBindingContext().getPath(),
                oFilter = new sap.ui.model.Filter("enabled", "EQ", true);
            this.getModel().setProperty(sPath + "/enabled", false);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        /**
        *  Resets all the sensors by making them all visible again.
        *  @returns {void}
        */
        onResetSensors: function() {
            var aSensors = this.getModel().getObject("/settings/sensors");
            for (var i = 0; i < aSensors.length; ++i) {
                aSensors[i].enabled = true;
            }
            this.getModel().refresh();
            this.byId("lstSensors").getBinding("items").filter(new sap.ui.model.Filter("enabled", "EQ", true));
        },

        /**
        *  Called when a sensor's number has changed. Checks the inputs for duplicate sensor numbers.
        *  @returns {void}
        */
        onSensorNumberChange: function() {
            var mValues = {},
                aStates = [],
                aItems = this.byId("lstSensors").getItems(),
                i,
                sValue;
            for (i = 0; i < aItems.length; ++i) {
                sValue = aItems[i].getContent()[0].getValue();
                if (mValues[sValue] !== undefined) {
                    aStates.push(false);
                    aStates[mValues[sValue]] = false;
                }
                else {
                    mValues[sValue] = i;
                    aStates.push(true);
                }
            }
            for (i = 0; i < aItems.length; ++i) {
                aItems[i].getContent()[0].setValueState(aStates[i] ? "None" : "Error");
            }
        },

        /**
        * Refreshes the model by reloading all the data.
        * @returns {void}
        */
        onRefresh: function() {
            this._makeRequest("/service/data/", function(oData){
                this.getModel().setData(oData);
            });
        },

        /**
        *  Starts the data collection service.
        *  @returns {void}
        */
        onStart: function() {
            var oSettings = this.getModel().getData().settings,
                aItems,
                oRequest = {
                    n:  oSettings.name,
                    i:  oSettings.interval,
                    h:  oSettings.internet.enabled,
                    s:  []
                },
                i;
            aItems = this.byId("lstSensors").getItems();
            aItems = aItems.concat(this.byId("lstSettings").getItems());
            for (i = 0; i < aItems.length; ++i) {
                var oContent = aItems[i].getContent()[0];
                if (oContent.getValueState && oContent.getValueState() !== "None") {
                    MessageBox.error(this.getResourceBundle().getText("invalidInputError"));
                    return;
                }
            }
            for (i = 0; i < oSettings.sensors.length; ++i) {
                oRequest.s.push({
                    t:  oSettings.sensors[i].id,
                    n:  oSettings.sensors[i].enabled ? oSettings.sensors[i].number : -1
                });
            }
            var sUrl = "/service/start/" + encodeURIComponent(JSON.stringify(oRequest));
            this._makeRequest(sUrl, this.onRefresh);
        },

        /**
        *  Stops the data collection service.
        *  @returns {void}
        */
        onStop: function() {
            this._makeRequest("/service/stop/", this.onRefresh);
        },

        /**
        *  Displays the selected file in a new dialog.
        *  @returns {void}
        */
        onDisplayFile: function() {
            this._useSelectedFileName(function(sName){
                var oi18n = this.getResourceBundle(),
                    sUrl = "/service/file/read/" + sName;
                this._makeRequest(sUrl, function(sData) {
                    var oTextArea = new Text({
                            width:  "100%",
                            text:  sData
                        }),
                        oDialog = new Dialog({
                            title:      oi18n.getText("fileContentTitle"),
                            stretch:    true,
                            content:    [oTextArea],
                            endButton: new Button({
                                text:   oi18n.getText("close"),
                                press: function() {
                                    oDialog.close();
                                    oDialog.destroy();
                                }
                            })
                        });
                    oDialog.open();
                });
            });
        },

        /**
        *  Deletes the selected file.
        *  @returns {void}
        */
        onDeleteFile: function() {
            this._useSelectedFileName(function(sName){
                var sUrl = "/service/file/delete/" + sName;
                this._makeRequest(sUrl, this.onRefresh);
            });
        },

        /**
        *  Uploads the selected file. Because this operation can be lengthy, a busy ind. is shown.
        *  @returns {void}
        */
        onUploadFile: function() {
            this._useSelectedFileName(function(sName){
                var sUrl = "/service/file/upload/" + sName,
                    oPage = this.byId("pagMain");
                oPage.setBusy(true);
                this._makeRequest(sUrl, this.onRefresh).always(oPage.setBusy.bind(oPage, false));
            });
        },

        /**
        * Helper function which gets the currently selected file's name.
        * If there is no file currently selected, an error is shown.
        * @param    {function}  fnCallback  The callback function. Can accept one parameter: the file name.
        * @returns {void}
        */
        _useSelectedFileName: function(fnCallback) {
            var oItem = this.byId("lstFiles").getSelectedItem(),
                oi18n = this.getResourceBundle();
            if (oItem) {
                fnCallback.call(this, oItem.getBindingContext().getProperty("name"));
            }
            else {
                MessageBox.error(oi18n.getText("errorMessageNoItemSelected"));
            }
        },

        /**
        *  Makes a request to the service provider.
        *  @param   {string}    sPath       The path on which the request should be made.
        *  @param   {function}  fnSuccess   The function to be called on success.
        *                                   It will be bound to the controller.
        *  @returns {object}    The result of the $.ajax call.
        */
        _makeRequest: function(sPath, fnSuccess) {
            var oi18n = this.getResourceBundle(),
                oThat = this;
            return $.ajax({
                url: sPath,
                type: "GET",
                success: function(oData) {
                    if (oData.error) {
                        MessageBox.error(oi18n.getText("errorMessage"), {
                            details: oData.error
                        });
                    }
                    else {
                        if (fnSuccess) {
                            fnSuccess.apply(oThat, arguments);
                        }
                    }
                },
                error: function() {
                    MessageBox.error(oi18n.getText("errorMessage"));
                }
            });
        }
    });
});