sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/resource/ResourceModel", "sap/ui/model/json/JSONModel",
"sap/m/MessageBox", "sap/m/Dialog", "sap/m/TextArea", "sap/m/Button", "sap/ui/thirdparty/vkbeautify"],
function (Controller, ResourceModel, JSONModel, MessageBox, Dialog, TextArea, Button, vkbeautify) {

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
        onInit: function () {
            var oModel = new JSONModel({});
            this.setModel(oModel);
            this.setModel(new ResourceModel({ bundleName: "i18n.i18n" }), "i18n");

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

            var oThat = this;
            window.onResult = function(){
                oThat.onResult.apply(oThat, arguments);
            };
            window.external.Sync("getModel", "", "onResult");
        },

        /**
        * Helper method which calls the corresponding method from the view.
        * @returns {Model}  The requested model.
        */
        getModel: function () {
            return this.getView().getModel.apply(this.getView(), arguments);
        },

        /**
        * Helper method which calls the corresponding method from the view.
        * @returns {object} This.
        */
        setModel: function () {
            this.getView().setModel.apply(this.getView(), arguments);
            return this;
        },

        /**
        * Helper method which retrieves the ResourceBundle of the i18n model.
        * @returns {ResourceBundle}  The i18n resource bundle.
        */
        getResourceBundle: function () {
            return this.getView().getModel("i18n").getResourceBundle();
        },

        /**
        * Handler method for backend result messages.
        * @param {string} sMethod The method called (to differentiate between messages).
        * @param {...*}   aParams The remaining parameters are treated acordingly per method.
        * @returns {void}
        */
        onResult: function (sMethod) {
            switch (sMethod) {
                case "getModel":
                    this.getModel().setData(JSON.parse(arguments[1]));
                    break;
                case "openPort":
                    this.getModel().setProperty("/ports/" + arguments[1] + "/busy", false);
                    break;
                case "onPortClosed":
                    this.getModel().setProperty("/ports/" + arguments[1] + "/enabled", false);
                    if (arguments[2] === "true") {
                        MessageBox.error(this.getResourceBundle().getText("portClosedUnexpected", [arguments[1]]));
                    }
                    break;
                case "onIncoming":
                    this.getModel().getData().incoming.push(JSON.parse(arguments[1]));
                    this.getModel().refresh();
                    break;
                case "onOutgoing":
                    this.getModel().getData().outgoing.push(JSON.parse(arguments[1]));
                    this.getModel().refresh();
                    break;
                case "onOutgoingError":
                    MessageBox.error(this.getResourceBundle().getText("outgoingRequestError"), {details: arguments[1]});
                    break;
            }
        },

        /**
        * Called when a switch is pressed. Either opens or closes a port (via async call).
        * @param {Event} oEvent The event object.
        * @returns {void}
        */
        onSwitchChange: function(oEvent) {
            var sPath = oEvent.getSource().getBindingContext().getPath();
            if (oEvent.getSource().getState()) {
                this.getModel().setProperty(sPath + "/busy", true);
                window.external.Async("openPort", this.getModel().getProperty(sPath + "/name"), "onResult");
            }
            else {
                window.external.Async("closePort", this.getModel().getProperty(sPath + "/name"), "onResult")
            }
        },
        
        /**
        * Called when a request is pressed. Opens a dialog with the body content of the request.
        * @param {Event} oEvent The event object.
        * @returns {void}
        */
        onRequestPress: function (oEvent) {
            var sBody = oEvent.getSource().getBindingContext().getProperty("body");
            this._showBody(vkbeautify.json(sBody), this.getResourceBundle().getText("requestBodyDialogTitle"));
        },

        /**
        * Called when a response is pressed. Opens a dialog with the body content of the response.
        * @param {Event} oEvent The event object.
        * @returns {void}
        */
        onResponsePress: function (oEvent) {
            var sBody = oEvent.getSource().getBindingContext().getProperty("body");
            this._showBody(sBody, this.getResourceBundle().getText("responseBodyDialogTitle"));
        },

        /**
        * Called when the target URL has changed. Notifies the back-end.
        * @param {Event} oEvent The event object.
        * @returns {void}
        */
        onTargetChange: function(oEvent) {
            window.external.Async("changeTarget", oEvent.getSource().getValue(), "onResult");
        },

        /**
        * Displays a dialog with the body of a request / response.
        * @param {string} sBody     The body of the request / response.
        * @param {string} sTitle    The title of the dialog.
        * @returns {void}
        */
        _showBody: function(sBody, sTitle) {
            var oDialog = new Dialog({
                title: sTitle,
                content: [new TextArea({
                    rows: 20,
                    cols: 80,
                    editable: false
                }).setValue(sBody)],

                endButton: new Button({
                    text: this.getResourceBundle().getText("close"),
                    press: function () {
                        oDialog.close();
                        oDialog.destroy();
                    }
                })
            });
            oDialog.addStyleClass("sapUiSizeCompact");
            oDialog.open();
        }
    });
});
