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
        }
    };
});
