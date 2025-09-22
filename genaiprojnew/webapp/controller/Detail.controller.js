sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "genaiprojnew/utils/utility"
], function (Controller, Fragment, MessageBox, Utility) {
  "use strict";


  return Controller.extend("genaiprojnew.controller.Detail", {
    onInit: function () {
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
      var sContent = "You selected tab: " + this.sTabKey;

      // Delay execution until view is fully rendered
      this.getView().addEventDelegate({
        onAfterRendering: function () {
          var oText = this.getView().byId("detailText");
        }
      });
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
    _onRouteMatched: function (oEvent) {
      var oAppModel = this.getOwnerComponent().getModel("appmodel");
      var oBundle = this.getView().getModel("i18n").getResourceBundle();

      if (oEvent.getParameter("name") === "detail") {
        this._ProjectDetail = oAppModel.getProperty("/selectedProject");
        this._loggedInUser = oAppModel.getProperty("/loggedInUserEmailId");

        if (this._loggedInUser) {
          this.getDataSysMsg("BS"); 
        } else {
          sap.m.MessageBox.error(oBundle.getText("warningEmailMissing"));
        }
      }
    },
    onValueHelpRequest: function () {
      var that = this;
      this.getDataSysMsg("BS").then(function () {
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
              Utility.initializeModel(that.getView(), "BSData", filteredData);
              resolve(data);
            } else {
              MessageBox.information("No system messages found.");
              resolve(null);
            }
          },
          error: function (error) {
            reject(error);
          }
        });
      });
    },

    onSystemMessageSelected: function (oEvent) {
      var sSelectedMsg = oEvent.getParameter("listItem").getTitle();
      this.getView().getModel("appmodel").setProperty("/atcSystemMessage", sSelectedMsg);
      this._oSysMsgDialog.close();
    },

    onCloseSystemMessageDialog: function () {
      this._oSysMsgDialog.close();
    }
  });
});
