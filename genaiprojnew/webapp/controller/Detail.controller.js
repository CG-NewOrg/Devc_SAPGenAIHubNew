sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "genaiprojnew/utils/utility"
], function (Controller, Fragment, MessageBox, Utility) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.Detail", {
    onInit: function () {
      var oAppModel = new sap.ui.model.json.JSONModel({
        atcSystemMessage: "",
        selectedSysMsgTemplate: "",
        selectedPrompt: ""
      });
      this.getView().setModel(oAppModel, "appmodel");

      this.getView().getModel("appmodel").setProperty("/selectedTabKey");
      this._ProjectDetail = "CG-PBSDevCockpit"; // Replace with actual value

      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);

      var oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.subscribe("DetailChannel", "SendToAI", this.onSendToAI, this);

      var oModel = new sap.ui.model.json.JSONModel({
        ragEnabled: false,
        subToggleState: false
      });
      this.getView().setModel(oModel);

    },

    _onDetailMatched: function (oEvent) {
      this.sTabKey = oEvent.getParameter("arguments").tab;
      // ... (your logic)
    },

    onSendToAI: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detailDetail", {
        tab: this.sTabKey,
        layout: "MidColumnFullScreen"
      });
    },

    onRagToggleChange: function (oEvent) {
      var bState = oEvent.getParameter("state");
      this.getView().getModel().setProperty("/ragEnabled", bState);
    },

    // --- DYNAMIC SYSTEM MESSAGE VALUE HELP ---
    onValueHelpRequest: function (oEvent) {

      const sInputId = oEvent.getSource().getId();
      const sTabKey = this.sTabKey || this.getView().getModel("appmodel").getProperty("/selectedTabKey");

      console.log("Value help triggered by:", sInputId);
      console.log("Current tab key:", sTabKey);

      if (sInputId.includes("systemMessageInput")) {
        this.openSystemMessageDialog(sTabKey);
      } else if (sInputId.includes("promptInput")) {
        this.openPromptDialog(sTabKey);
      }
    },

    openSystemMessageDialog: function (category) {
      var that = this;
      this.getDataSysMsg(category).then(function (filteredData) {
        Utility.initializeDynamicModel(that.getView(), "dynamicSysMsgModel", filteredData);
        if (!that._oSysMsgDialog) {
          Fragment.load({
            name: "genaiprojnew.fragment.SystemMessageDialog",
            controller: that
          }).then(function (oDialog) {
            that._oSysMsgDialog = oDialog;
            that.getView().addDependent(oDialog);
            oDialog.open();
          });
        } else {
          that._oSysMsgDialog.open();
        }
        that._currentSysMsgCategory = category; // Store for use in selection
      }).catch(function () {
        MessageBox.error("Failed to fetch system messages.");
      });
    },

    getDataSysMsg: function (category) {
      var that = this;
      var sUrl = "/cockpit/getPromptDetails(ProjectId='" + this._ProjectDetail + "')";
      return new Promise(function (resolve, reject) {
        $.ajax({
          url: sUrl,
          method: "GET",
          success: function (data) {
            if (data && data.value.result && data.value.result.length > 0) {
              var filteredData = Utility.filterAndSortMessages(data, category);
              resolve(filteredData);
            } else {
              MessageBox.information("No system messages found.");
              resolve([]);
            }
          },
          error: function (error) {
            reject(error);
          }
        });
      });
    },
    onSystemMessageSelected: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("listItem");
      var sPromptId = oSelectedItem.getBindingContext("dynamicSysMsgModel").getProperty("PROMPTID");
      var sPromptTemplate = oSelectedItem.getBindingContext("dynamicSysMsgModel").getProperty("PROMPT_TEMPLATE");

      // Set the input value (if needed)
      this.getView().getModel("appmodel").setProperty("/atcSystemMessage", sPromptId);

      // Set the TextArea value to the prompt template (or fallback to PROMPTID)
      this.getView().getModel("appmodel").setProperty(
        "/selectedSysMsgTemplate",
        sPromptTemplate || sPromptId
      );

      this._oSysMsgDialog.close();
    },
    onCloseSystemMessageDialog: function () {
      this._oSysMsgDialog.close();
    },
    openPromptDialog: function (category) {
      const oView = this.getView();
      const that = this;

      this.getDataPromptMsg(category).then(function (modelName) {
        if (!modelName) return;

        const oModel = oView.getModel(modelName);
        if (!oModel) {
          MessageBox.error("Prompt model not found for category: " + category);
          return;
        }

        if (!that._pPromptDialog) {
          Fragment.load({
            id: oView.getId(),
            name: "genaiprojnew.fragment.PromptDialog",
            controller: that
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.setModel(oModel, "dynamicPromptModel");
            // oDialog.attachConfirm(that.onPromptConfirm.bind(that, modelName));
            oDialog.attachConfirm(function (oEvent) {
              this.onPromptConfirm(sModelName, oEvent);
            }.bind(this));
            oDialog.attachCancel(that.onPromptCancel, that);
            oDialog.attachLiveChange(that.onPromptSearch, that);
            oDialog.open();
            that._pPromptDialog = oDialog;
          }).catch(function (error) {
            console.error("Prompt Fragment Load Failed:", error);
          });
        } else {
          that._pPromptDialog.setModel(oModel, "dynamicPromptModel");
          that._pPromptDialog.open();
        }
      }).catch(function () {
        MessageBox.error("Failed to fetch prompt data.");
      });
    },
    getDataPromptMsg: function (category) {
      const that = this;
      const sUrl = `/cockpit/getPromptDetails(ProjectId='${this._ProjectDetail}')`;

      return new Promise(function (resolve, reject) {
        $.ajax({
          url: sUrl,
          method: "GET",
          success: function (data) {
            if (data && data.value.result && data.value.result.length > 0) {
              const filteredData = Utility.getSortedPromptData(data, category);
              const modelName = category + "PromptData";
              Utility.initializePromptModels(that.getView(), modelName, filteredData);
              resolve(modelName);
            } else {
              MessageBox.information("No prompt data found.");
              resolve(null);
            }
          },
          error: function (error) {
            reject(error);
          }
        });
      });
    },
    onPromptConfirm: function (oEvent, sModelName) {
  const oSelectedItem = oEvent.getParameter("selectedItem");
  if (oSelectedItem) {
    const sPrompt = oSelectedItem.getTitle();
    this.getView().getModel("appmodel").setProperty("/selectedPrompt", sPrompt);
    this.getView().getModel("appmodel").setProperty("/selectedPromptText", sPrompt); // for editable TextArea
    sap.m.MessageToast.show("Selected Prompt from " + sModelName + ": " + sPrompt);
  }
},
    onPromptCancel: function () {
      // Optional cancel logic
    },

    onPromptSearch: function (oEvent) {
      const sValue = oEvent.getParameter("value");
      const oBinding = oEvent.getSource().getBinding("items");
      const oFilter = new sap.ui.model.Filter("PROMPT_TEMPLATE", sap.ui.model.FilterOperator.Contains, sValue);
      oBinding.filter([oFilter]);
    }
  });
});
