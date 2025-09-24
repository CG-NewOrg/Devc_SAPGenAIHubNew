sap.ui.define([], function () {
    "use strict";

    return {
        filterAndSortMessages: function (data, category) {
            return data.value.result
                .filter(item => item.CATEGORY === category && item.MSGTYPE === "sysmsg")
                .sort((a, b) => {
                    if (a.PROMPT_TEMPLATE === 'Custom Message') return -1;
                    if (b.PROMPT_TEMPLATE === 'Custom Message') return 1;
                    return 0;
                });
        },

        initializeModel: function (view, modelName, dataArray) {
            dataArray.unshift({
                PROMPTID: "",
                PROMPT_TEMPLATE: ""
            });
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(dataArray);
            view.setModel(oModel, modelName);
        },

        getSystemMessage: function (oView, sId) {
            var oInput = oView.byId(sId);
            var sValue = oInput ? oInput.getValue() : "";
            return [{
                role: "system",
                content: sValue
            }];
        },

        onSliderChange: function (oEvent, sliderType, oController) {
            var changedValue = oEvent.getParameter("value");
            var oViewModel = oController.getView().getModel("viewModel");
            oViewModel.setProperty("/isParamPopupEdited", true);

            var defaultValue, propertyPath;

            switch (sliderType) {
                case "temperature":
                    defaultValue = oViewModel.getProperty("/comnPopUpModelParamTemp");
                    propertyPath = "/paramTemparture";
                    break;
                case "topP":
                    defaultValue = oViewModel.getProperty("/comnPopUpModelParamTopP");
                    propertyPath = "/paramParamTopP";
                    break;
                case "maxLength":
                    changedValue = parseFloat(changedValue);
                    defaultValue = parseFloat(oViewModel.getProperty("/comnPopUpModelParamMaxLength"));
                    propertyPath = "/paramMaxLength";
                    break;
                case "freqP":
                    defaultValue = oViewModel.getProperty("/comnPopUpModelParamFreqP");
                    propertyPath = "/paramFreqP";
                    break;
                case "presenceP":
                    defaultValue = oViewModel.getProperty("/comnPopUpModelParamPresenceP");
                    propertyPath = "/paramPresenceP";
                    break;
                case "contextHist":
                    defaultValue = oViewModel.getProperty("/comnPopUpModelParamContextHist");
                    propertyPath = "/paramContextHist";
                    break;
                default:
                    console.warn("Unknown slider type:", sliderType);
                    return;
            }

            var currentValue = (changedValue !== defaultValue) ? changedValue : defaultValue;
            oViewModel.setProperty(propertyPath, currentValue);
        },
                SystemMsgSave: function (type, oController) {
            var oView = oController.getView();
            var oBundle = oView.getModel("i18n").getResourceBundle();
            var oResponseModel = oView.getModel("responseModel");

            var config = {
                BS: {
                    textAreaId: "BSTextArea",
                    iconId: "BSedit",
                    saveBtnId: "BSSaveBtn",
                    modelPath: "/BSThread"
                },
                UserStory: {
                    textAreaId: "UserStorySysTextArea",
                    iconId: "UserStoryedit",
                    saveBtnId: "UserStorySaveBtn",
                    modelPath: "/UserThread"
                },
                FsToConf: {
                    textAreaId: "FsConfSysTextArea",
                    iconId: "FsToConfedit",
                    saveBtnId: "FsConfSaveBtn",
                    modelPath: "/fsconfThread"
                },
                FsToTs: {
                    textAreaId: "fsSysTextArea",
                    iconId: "fstotsedit",
                    saveBtnId: "fsSaveBtn",
                    modelPath: "/fsThread"
                },
                TsToCode: {
                    textAreaId: "tsTextArea",
                    iconId: "tstocodeedit",
                    saveBtnId: "tssavebtn",
                    modelPath: "/tsThread"
                },
                TsToCodeGit: {
                    textAreaId: "tsGitTextArea",
                    iconId: "tstocodeGitedit",
                    saveBtnId: "tsGitsavebtn",
                    modelPath: "/tsGitThread"
                },
                CodeRem: {
                    textAreaId: "coderemTextArea",
                    iconId: "coderemedit",
                    saveBtnId: "coderemSavebtn",
                    modelPath: "/ECCCodeThread"
                },
                CodeSum: {
                    textAreaId: "codesymTextArea",
                    iconId: "codesumedit",
                    saveBtnId: "codesumSaveBtn",
                    modelPath: "/codeThread"
                },
                TUT: {
                    textAreaId: "tutTextArea",
                    iconId: "tutedit",
                    saveBtnId: "tutSaveBtn",
                    modelPath: "/TUTThread"
                },
            };

            var settings = config[type];
            if (!settings) {
                console.error("Invalid type provided to SystemMsgSave");
                return;
            }

            var oTextArea = oView.byId(settings.textAreaId);
            var oIcon = oView.byId(settings.iconId);
            var oSaveBtn = oView.byId(settings.saveBtnId);

            if (!oTextArea.getEditable()) {
                sap.m.MessageBox.warning(oBundle.getText("warningSystemMessage"), {
                    title: "Warning",
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            oTextArea.setEditable(true);
                            oSaveBtn.setVisible(true);
                            if (typeof oController.oSysMsgChange === "function") {
                                oController.oSysMsgChange();
                            }
                            oController.isSystemSaved = false;
                        }
                    }
                });
            } else {
                var sText = oTextArea.getValue();
                var aMessages = [{
                    "role": "system",
                    "content": sText
                }];

                oResponseModel.setProperty(settings.modelPath, aMessages);

                oTextArea.setEditable(false);
                oIcon.setSrc("sap-icon://edit");
                oController.isSystemSaved = true;
            }
        },
    };
});
