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

    initializeDynamicModel: function (view, modelName, dataArray) {
      // No unshift for dynamic model, just set filtered array
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
    getSortedPromptData: function (data, category) {
      return data.value.result
        .filter(function (item) {
          return item.CATEGORY === category && item.MSGTYPE === "prompt";
        })
        .sort(function (a, b) {
          return new Date(b.DATE_ADDED) - new Date(a.DATE_ADDED);
        });
    },
    initializePromptModels: function (view, modelName, dataArray) {
      dataArray.unshift({
        key: "Select Prompt",
        text: "Select Prompt"
      });
      var oModel = new sap.ui.model.json.JSONModel();
      oModel.setData(dataArray);
      view.setModel(oModel, modelName);
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
    }
  };
});

