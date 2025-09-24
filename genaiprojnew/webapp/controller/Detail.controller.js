sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "genaiprojnew/utils/utility",
  "genaiprojnew/model/models",
  "sap/m/BusyDialog"
], function (Controller, Fragment, MessageBox, Utility, models, BusyDialog) {
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

      this.BSinitialSysMsg = false;

      var oViewModel = models.createViewModel();
      this.getView().setModel(oViewModel, "viewModel");

      var oResponseModel = models.createResponseModel();
      this.getView().setModel(oResponseModel, "responseModel");

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
    },
    onParameterPopUp: function (oEvent) {
      var oButton = oEvent.getSource(),
        oView = this.getView();
      var oModelFlag = this.getView().getModel("viewModel");
      oModelFlag.setProperty("/isParamPopupOpen", true);
      oModelFlag.setProperty("/isParamPopupEdited", false);
      var sFragmentName = "genaiprojnew.fragment.ParameterPopup";

      if (!this._pParamPopover) {
        this._pParamPopover = Fragment.load({
          id: oView.getId(),
          name: sFragmentName,
          controller: this
        }).then(function (oPopover) {
          oView.addDependent(oPopover);
          oPopover.attachAfterClose(function () {
            oPopover.destroy();
            this._pParamPopover = null;
          }.bind(this));
          return oPopover;
        }.bind(this));
      } else {
        this._pParamPopover.then(function (oPopover) {
          oPopover.destroy();
          this._pParamPopover = Fragment.load({
            id: oView.getId(),
            name: sFragmentName,
            controller: this
          }).then(function (oNewPopover) {
            oView.addDependent(oNewPopover);
            oNewPopover.attachAfterClose(function () {
              oNewPopover.destroy();
              this._pParamPopover = null;
            }.bind(this));
            oNewPopover.openBy(oButton);
            return oNewPopover;
          }.bind(this));
        }.bind(this));
      }
      this._pParamPopover.then(function (oPopover) {
        oPopover.openBy(oButton);
      });
    },
    handleRefreshParameterPopUp: function () {
      var oViewModel = this.getView().getModel("viewModel");
      oViewModel.setProperty("/comnPopUpModelParamTemp", 0.7);
      oViewModel.setProperty("/comnPopUpModelParamTopP", 0.95);
      oViewModel.setProperty("/comnPopUpModelParamMaxLength", 4000);
      oViewModel.setProperty("/comnPopUpModelParamFreqP", 0.1);
      oViewModel.setProperty("/comnPopUpModelParamPresenceP", 0.1);
      oViewModel.setProperty("/comnPopUpModelParamContextHist", 2);
      oViewModel.setProperty("/SelectedStopSequence", "None");
      oViewModel.setProperty("/TokenCount", 0);
      oViewModel.refresh(true);
    },
    handleSaveParameterPopUp: function (oEvent) {

      this._pParamPopover.then(function (oPopover) {
        this._savedTemperature = this.getView().getModel("viewModel").getProperty("/paramTemparture");
        this._savedTopP = this.getView().getModel("viewModel").getProperty("/paramParamTopP");
        this._maxResponse = this.getView().getModel("viewModel").getProperty("/paramMaxLength");
        this._freqPenalty = this.getView().getModel("viewModel").getProperty("/paramFreqP");
        this._prePenalty = this.getView().getModel("viewModel").getProperty("/paramPresenceP");
        this._contextHist = this.getView().getModel("viewModel").getProperty("/paramContextHist");
        oPopover.close();
      }.bind(this)).catch(function (oError) {
        console.error("Failed to get the popover instance:", oError);
      });
    },
    handleCancelParameterPopUp: function (oEvent) {
      var oViewModel = this.getView().getModel("viewModel");
      oViewModel.setProperty("/isParamPopupOpen", false);
      this._pParamPopover.then(function (oPopover) {
        oPopover.close();
      });
    },
    onSliderChangeTempartre: function (oEvent) {
      Utility.onSliderChange(oEvent, "temperature", this);
    },
    onSliderChangeTopProblity: function (oEvent) {
      Utility.onSliderChange(oEvent, "topP", this);
    },
    onSliderChangeParamMaxLength: function (oEvent) {
      Utility.onSliderChange(oEvent, "maxLength", this);
    },
    onSliderChangeParamFreqP: function (oEvent) {
      Utility.onSliderChange(oEvent, "freqP", this);
    },
    onSliderChangeParamPresenceP: function (oEvent) {
      Utility.onSliderChange(oEvent, "presenceP", this);
    },
    onSliderChangeParamContextHist: function (oEvent) {
      Utility.onSliderChange(oEvent, "contextHist", this);
    },

    onShowDialog: function () {
      this.byId("addexample").open();
    },

    onSaveDialog: function () {
      var oResponseModel = this.getView().getModel("responseModel");
      var aMessages = oResponseModel.getProperty("/BSThread");
      var firstValue = aMessages[0];
      oResponseModel.setProperty("/BSThread", []);
      var sUserValue = this.byId("usertextarea").getValue();
      var sAssistantValue = this.byId("assistanttextarea").getValue();
      oResponseModel.setProperty("/BSThread", [
        firstValue,
        {
          role: "user",
          content: sUserValue
        },
        {
          role: "assistant",
          content: sAssistantValue
        }
      ]);
      this.byId("addexample").close();
    },

    onCancelDialog: function () {
      this.byId("addexample").close();
    },
    SystemMsgSave: function () {
      var oTextArea = this.getView().byId("SysTextArea");
      var oIcon = this.getView().byId("editicon");
      var oBundle = this.getView().getModel("i18n").getResourceBundle();
      var _this = this;


      if (!oTextArea.getEditable()) {
        sap.m.MessageBox.warning(oBundle.getText("warningSystemMessage"), {
          title: "Warning",
          actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
          onClose: function (oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
              oTextArea.setEditable(true);
              var osaveBtn = _this.getView().byId("SaveBtn");
              osaveBtn.setVisible(true);

              _this.oSysMsgChange();
              _this.isSystemSaved = false;
            }
          }
        });
      } else {
        var sText = oTextArea.getValue();
        var oResponseModel = _this.getView().getModel("responseModel");
        var aBSMessages = [{
          "role": "system",
          "content": sText
        }];
        oResponseModel.setProperty("/BSThread", aBSMessages);

        oTextArea.setEditable(false);
        oIcon.setSrc("sap-icon://edit");
        _this.isSystemSaved = true;
      }

    },

    onSystemSave: function () {
      var that = this;
      var oBundle = this.getView().getModel("i18n").getResourceBundle();
      var oModel = this.getView().getModel("viewModel"),
        sSysKey = oModel.getProperty("/systemKey"),
        sTextArea = this.getView().byId("SysTextArea"),
        sText = sTextArea.getValue();
      var _ProjectDetail = "CG-PBSDevCockpit";
      var sSelectedIconTab = "BS";
      var busyDialog = new BusyDialog();

      if (!sSysKey || !sText) {
        MessageBox.error(oBundle.getText("warningSysMsgEmpty"));
      } else {
        var oResponseModel = that.getView().getModel("responseModel"),
          sTextArea = this.getView().byId("SysTextArea"), 
          sText = sTextArea.getValue();
        var aBSMessages = [{
          "role": "system",
          "content": sText
        }];
        oResponseModel.setProperty("/BSThread", aBSMessages);

        if (!sSysKey) {
          sap.m.MessageToast.show(oBundle.getText("warningSysMsgKeyEmpty"));
        } else {

          that.byId("InfoLabel").setVisible(false);
          // var sSelectedIconTab = that.getView().byId("iconTabBar").getSelectedKey();
          that.previousPromt[sSelectedIconTab] = sText;
          sSysKey = sSysKey.includes(oModel.getProperty("/systemKeyPrefix")) ? sSysKey : oModel.getProperty("/systemKeyPrefix") + sSysKey;
          var oPayload = {
            "Prompt_Template": sText,
            "Category": sSelectedIconTab,
            "MsgType": "sysmsg",
            "PromptId": sSysKey,
            //"ProjectId": that._ProjectDetail,
            "ProjectId": _ProjectDetail,
            "UserId": that._loggedInUser
          };
          var payload = {};
          payload["payload"] = oPayload;
          busyDialog.open();

          $.ajax({
            url: "/cockpit/createPromptDetails",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function (res) {
              that.isSystemSaved = true;
              that.getData().then((data) => {
                if (data) {
                  var oResponseModel = that.getView().getModel("responseModel");
                  that.getView().byId("SysTextArea").setValue(sText);
                  var aBSMessages = [{
                    "role": "system",
                    "content": sText
                  }];
                  oResponseModel.setProperty("/BSThread", aBSMessages);
                  that.getView().byId("systemMessageInput").setValue(sSysKey);


                }
              }).catch(
                (
                  error
                ) => {

                });

              var oSaveButton = that.byId("SaveBtn");
              oSaveButton.setVisible(false);
              busyDialog.close();

              oModel.setProperty("/systemKey", sSysKey);

              oModel.setProperty("/Visible/SystemKeyVisible", false);
              oModel.setProperty("/Visible/SystemTextAreaEditable", false);
              MessageToast.show(oBundle.getText("successSysMsgSave"));
              that.BSinitialSysMsg = true;
            },
            error: function (xhr, status, error) {
              busyDialog.close();

              if (!(xhr.responseJSON.status === 400 && xhr.responseJSON.message === 'Record already exists'))
                sap.m.MessageToast.show(xhr.responseJSON.message);

            }
          })
        }

      }
    },
  });
});
