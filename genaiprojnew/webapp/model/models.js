sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime information for the device the UI5 app is running on as a JSONModel.
             * @returns {sap.ui.model.json.JSONModel} The device model.
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },
            createViewModel: function () {
                return new JSONModel({
                    gptModels: [],
                    systemMsgResizeDialog: "",
                    systemKey: "",
                    systemKeyPrefix: "Single_",
                    bFileContentChanged: false,
                    contentBuffer: "",
                    isResponseFileContent: false,
                    Visible: {
                        SystemKeyVisible: false,
                        SystemTextAreaEditable: false,
                        BranchDdVisible: false // Include only if needed
                    },
                    isParamPopupOpen: false,
                    isParamPopupEdited: false,
                    comnPopUpModelParamTemp: 0.7,
                    comnPopUpModelParamTopP: 0.95,
                    comnPopUpModelParamMaxLength: 4000,
                    comnPopUpModelParamMax: 1200,
                    comnPopUpModelParamFreqP: 0.1,
                    comnPopUpModelParamPresenceP: 0.1,
                    AiModelParamTemp: 0.7,
                    AiModelParamTopP: 0.95,
                    AiModelParamMaxLength: 4000,
                    AiModelParamMax: 1200,
                    AiModelParamFreqP: 0.1,
                    AiModelParamPresenceP: 0.1
                });
            },
            createResponseModel: function () {
                var oResponseModel = new JSONModel({
                    "responseModel": {
                        "content": ""
                    }
                });
                return oResponseModel;
            }
        };

    });