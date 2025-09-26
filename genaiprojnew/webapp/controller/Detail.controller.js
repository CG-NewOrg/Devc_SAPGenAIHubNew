sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/m/MessageBox",
  "genaiprojnew/utils/utility",
  "genaiprojnew/model/models",
  "genaiprojnew/lib/pdf.min",
  "genaiprojnew/lib/pdf.worker.min",
  "sap/m/BusyDialog"
], function (Controller, Fragment, MessageBox, Utility, models, BusyDialog) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.Detail", {
    // onInit: function () {
    //   this.getOwnerComponent().getRouter().getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
    //   const oView = this.getView();
    //   var oAppModel = new sap.ui.model.json.JSONModel({
    //     atcSystemMessage: "",
    //     selectedSysMsgTemplate: "",
    //     selectedPrompt: "",
    //     selectedFileType: "",
    //     previewUrl: "",
    //     extractedText: "",
    //     selectedFileName: "",
    //     selectedFileObject: null,
    //     uploadedFileUrl: "",
    //     BSContent: "",
    //     UserContent: "",
    //     fstoconfContent: "",
    //     fstotsContent: "",
    //     tstocodeContent: "",
    //     tstocodeGitContent: "",
    //     coderemContent: "",
    //     codesumContent: "",
    //     TUTContent: ""
    //   });
    //   this.getView().setModel(oAppModel, "appmodel");

    //   this.getView().getModel("appmodel").setProperty("/selectedTabKey");
    //   this._ProjectDetail = "CG-PBSDevCockpit"; // Replace with actual value

    //   var oRouter = this.getOwnerComponent().getRouter();
    //   oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);

    //   var oEventBus = sap.ui.getCore().getEventBus();
    //   oEventBus.subscribe("DetailChannel", "SendToAI", this.onSendToAI, this);

    //   var oModel = new sap.ui.model.json.JSONModel({
    //     ragEnabled: false,
    //     subToggleState: false
    //   });
    //   this.getView().setModel(oModel);

    //   this.BSinitialSysMsg = false;

    //   var oViewModel = models.createViewModel();
    //   this.getView().setModel(oViewModel, "viewModel");

    //   var oResponseModel = models.createResponseModel();
    //   this.getView().setModel(oResponseModel, "responseModel");
    // },
    onInit: function () {
      const oView = this.getView();

      // Set up appmodel with all required properties
      const oAppModel = new sap.ui.model.json.JSONModel({
        atcSystemMessage: "",
        selectedSysMsgTemplate: "",
        selectedPrompt: "",
        selectedFileType: "",
        previewUrl: "",
        extractedText: "",
        selectedFileName: "",
        selectedFileObject: null,
        uploadedFileUrl: "",
        selectedTabKey: "", // ✅ Add this explicitly
        BSContent: "",
        UserContent: "",
        fstoconfContent: "",
        fstotsContent: "",
        tstocodeContent: "",
        tstocodeGitContent: "",
        coderemContent: "",
        codesumContent: "",
        TUTContent: ""
      });
      oView.setModel(oAppModel, "appmodel");

      this._ProjectDetail = "CG-PBSDevCockpit";

      this.getOwnerComponent().getRouter().getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
      const oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.subscribe("DetailChannel", "SendToAI", this.onSendToAI, this);

      const oViewModel = models.createViewModel();
      oView.setModel(oViewModel, "viewModel");

      const oResponseModel = models.createResponseModel();
      oView.setModel(oResponseModel, "responseModel");

      const oModel = new sap.ui.model.json.JSONModel({
        ragEnabled: false,
        subToggleState: false
      });
      oView.setModel(oModel);

      this.BSinitialSysMsg = false;
    },

    _onDetailMatched: function (oEvent) {

      const sTabKey = oEvent.getParameter("arguments").tab;
      this._selectedTabKey = sTabKey;
      console.log("Selected Tab Key:", this._selectedTabKey);
      // Optional: store in model
      this.getView().getModel("appmodel").setProperty("/selectedTabKey", sTabKey);

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

    getObjectStoreFile: function () {
      var that = this;
      var sSelectedIconTab = this.getView().byId("iconTabBar").getSelectedKey();
      var listObjectsUrl = `/cockpit/getFiles(Category='${sSelectedIconTab}')`;

      $.ajax({
        url: listObjectsUrl,
        type: "GET",
        success: function (data) {
          var contents = data?.value?.data?.Contents;
          var fileNames = [];

          if (contents && Array.isArray(contents)) {
            var filteredFiles = contents.filter(item => item.category === sSelectedIconTab);
            fileNames = filteredFiles.map(file => ({
              Key: file.Key,
              Name: file.Key.split('/').pop()
            }));
          }

          var oModel = new sap.ui.model.json.JSONModel();
          oModel.setData(fileNames);
          that.getView().setModel(oModel, "ObjectFileList");
        },
        error: function () {
          MessageBox.error("Failed to fetch files from Object Store.");
        }
      });
    },
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
              // Step 1: Filter system messages for the selected category
              var filteredData = Utility.filterAndSortMessages(data, category);

              // Step 2: Initialize dynamic model for dialog display
              Utility.initializeDynamicModel(that.getView(), "dynamicSysMsgModel", filteredData);

              // Step 3: Update responseModel dynamically
              var oResponseModel = that.getView().getModel("responseModel");
              var modelKey = category + "SysMsg";

              // Mapping tabKey to responseModel thread path
              var threadPathMap = {
                "BS": "/BSThread",
                "User": "/UserThread",
                "fstoconf": "/fsconfThread",
                "fstots": "/fsThread",
                "tstocode": "/tsThread",
                "tstocodeGit": "/tsGitThread",
                "coderem": "/ECCCodeThread",
                "codesum": "/codeThread",
                "TUT": "/tutThread"
              };

              var threadPath = threadPathMap[category];
              if (threadPath) {
                var messages = Utility.getSystemMessage(that.getView(), modelKey);
                oResponseModel.setProperty(threadPath, messages);
              }

              // Step 4: Optionally update ATC system message thread
              var atcMessage = that.getView().getModel("appmodel").getProperty("/atcSystemMessage");
              if (atcMessage) {
                oResponseModel.setProperty("/atcThread", [{
                  role: "system",
                  content: atcMessage
                }]);
              }

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
              that.onPromptConfirm(oEvent, modelName);
            });

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
      var that = this;
      var sUrl = "/cockpit/getPromptDetails(ProjectId='" + this._ProjectDetail + "')";

      return new Promise(function (resolve, reject) {
        $.ajax({
          url: sUrl,
          method: "GET",
          success: function (data) {
            if (data && data.value.result && data.value.result.length > 0) {
              // Step 1: Filter prompt messages for the selected category
              var filteredPromptData = Utility.getSortedPromptData(data, category);

              // Step 2: Initialize dynamic prompt model
              var modelName = category + "PromptData";
              Utility.initializePromptModels(that.getView(), modelName, filteredPromptData);

              // Step 3: Update responseModel dynamically (optional but consistent)
              var oResponseModel = that.getView().getModel("responseModel");
              var modelKey = category + "SysMsg";

              var threadPathMap = {
                "BS": "/BSThread",
                "User": "/UserThread",
                "fstoconf": "/fsconfThread",
                "fstots": "/fsThread",
                "tstocode": "/tsThread",
                "tstocodeGit": "/tsGitThread",
                "coderem": "/ECCCodeThread",
                "codesum": "/codeThread",
                "TUT": "/tutThread"
              };

              var threadPath = threadPathMap[category];
              if (threadPath) {
                var messages = Utility.getSystemMessage(that.getView(), modelKey);
                oResponseModel.setProperty(threadPath, messages);
              }

              // Step 4: Optionally update ATC system message thread
              var atcMessage = that.getView().getModel("appmodel").getProperty("/atcSystemMessage");
              if (atcMessage) {
                oResponseModel.setProperty("/atcThread", [{
                  role: "system",
                  content: atcMessage
                }]);
              }

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
    onUploadFile: function () {
      const that = this;
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".pdf,.docx,.jpeg,.jpg,.png,.txt";
      fileInput.style.display = "none";

      fileInput.onchange = function (event) {
        const oFile = event.target.files[0];
        const oModel = that.getView().getModel("appmodel");
        const tabKey = oModel.getProperty("/selectedTabKey");
        const vector = 0;

        if (!oFile || !tabKey) {
          sap.m.MessageBox.warning("Please select a file and tab.");
          return;
        }

        oModel.setProperty("/selectedFileName", oFile.name);
        oModel.setProperty("/selectedFileObject", oFile);

        const formData = new FormData();
        formData.append("file", oFile);

        const objectStoreUrl = `/cockpit/upload/Category=${tabKey}/Project=${that._ProjectDetail}/Vector=${vector}`;
        const busyDialog = new sap.m.BusyDialog();
        busyDialog.open();

        $.ajax({
          url: objectStoreUrl,
          method: "POST",
          processData: false,
          contentType: false,
          data: formData,
          success: function (response) {
            busyDialog.close();
            // const previewUrl = `/cockpit/getFileDetails?key=${response.objectStoreRefKey}`;
            // oModel.setProperty("/previewUrl", previewUrl);
            // oModel.setProperty("/uploadedFileUrl", previewUrl);
            // sap.m.MessageBox.success("File uploaded successfully.");

            if (!response.objectStoreRefKey) {
              sap.m.MessageBox.error("Upload failed. No preview available.");
              return;
            }
            const previewUrl = `/cockpit/getFileDetails?key=${response.objectStoreRefKey}`;
            oModel.setProperty("/previewUrl", previewUrl);
            oModel.setProperty("/uploadedFileUrl", previewUrl);
            sap.m.MessageBox.success("File uploaded successfully.");
            that.extractPDFText(oFile);

          },
          error: function () {
            busyDialog.close();
            sap.m.MessageBox.error("Error uploading file.");
          }
        });
      };

      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    },
    handleUpload: function () {
      const oModel = this.getView().getModel("appmodel");
      const oFile = oModel.getProperty("/selectedFileObject");
      const tabKey = oModel.getProperty("/selectedTabKey");
      const busyDialog = new sap.m.BusyDialog();
      const objectStoreUrl = `/cockpit/upload/Category=${tabKey}/Project=${this._ProjectDetail}/Vector=0`;

      if (!oFile) {
        sap.m.MessageBox.warning("Please select a file.");
        return;
      }

      const formData = new FormData();
      formData.append("file", oFile);

      busyDialog.open();

      $.ajax({
        url: objectStoreUrl,
        method: "POST",
        processData: false,
        contentType: false,
        data: formData,
        success: function (response) {
          busyDialog.close();

          const previewUrl = `/cockpit/getFileDetails?key=${response.objectStoreRefKey}`;
          oModel.setProperty("/previewUrl", previewUrl);
          oModel.setProperty("/uploadedFileUrl", previewUrl);

          sap.m.MessageBox.success("File uploaded successfully.");
        },
        error: function () {
          busyDialog.close();
          sap.m.MessageBox.error("Error uploading file.");
        }
      });
    },
    onPreviewFile: function () {
      const oModel = this.getView().getModel("appmodel");
      const fileUrl = oModel.getProperty("/previewUrl");
      const fileName = oModel.getProperty("/selectedFileName");

      if (!fileUrl || !fileName) {
        sap.m.MessageBox.information("No file uploaded to preview.");
        return;
      }

      const fileExt = fileName.split('.').pop().toLowerCase();

      const oPdfViewer = this.byId("dialogPdfViewer");
      const oImage = this.byId("dialogImagePreview");
      const oTextArea = this.byId("dialogTextPreview");

      // Hide all preview controls first
      oPdfViewer.setVisible(false);
      oImage.setVisible(false);
      oTextArea.setVisible(false);

      switch (fileExt) {
        case "pdf":
          console.log("Previewing PDF:", fileUrl);
          console.log("PDF Viewer:", oPdfViewer);
          oPdfViewer.setSource(fileUrl);
          oPdfViewer.setVisible(true);
          break;

        case "jpeg":
        case "jpg":
        case "png":
          oImage.setSrc(fileUrl);
          oImage.setVisible(true);
          break;

        case "txt":
        case "docx":
          $.get(fileUrl, function (data) {
            oTextArea.setValue(data);
            oTextArea.setVisible(true);
          });
          break;

        default:
          sap.m.MessageBox.information("Preview not supported for this file type.");
          return;
      }

      this.byId("previewDialog").open();
    },

    onClosePreviewDialog: function () {
      this.byId("previewDialog").close();
    },
    extractPDFText: function (file) {
      const that = this;
      const reader = new FileReader();

      reader.onload = function (event) {
        const arrayBuffer = event.target.result;

        pdfjsLib.getDocument({ data: arrayBuffer }).promise.then(function (pdf) {
          const maxPages = pdf.numPages;
          const promises = [];

          for (let i = 1; i <= maxPages; i++) {
            promises.push(
              pdf.getPage(i).then(page =>
                page.getTextContent().then(content =>
                  content.items.map(item => item.str).join('')
                )
              )
            );
          }

          Promise.all(promises).then(function (texts) {
            const fullText = texts.join('');
            const tabKey = this.getView().getModel("appmodel").getProperty("/selectedTabKey");
            this.getView().getModel("appmodel").setProperty(`/${tabKey}Content`, fullText);
          }.bind(this));
        }.bind(this));
      }.bind(this);

      reader.readAsArrayBuffer(file);
    },
    onFilesButtonPress: function () {
      const that = this;
      const tabKey = this.getView().getModel("appmodel").getProperty("/selectedTabKey");
      const currentUser = that._loggedInUser; // Assuming this is set during login/init

      if (!tabKey) {
        sap.m.MessageBox.warning("Please select a tab first.");
        return;
      }

      const listObjectsUrl = `/cockpit/getFiles(Category='${tabKey}')`;
      const busyDialog = new sap.m.BusyDialog();
      busyDialog.open();

      $.ajax({
        url: listObjectsUrl,
        method: "GET",
        success: function (data) {
          busyDialog.close();

          const contents = data?.value?.data?.Contents || [];
          const userFiles = contents
            .filter(item => item.category === tabKey && item.uploadedBy === currentUser)
            .map(file => ({
              Name: file.Key.split('/').pop() // Only title
            }));

          const oModel = new sap.ui.model.json.JSONModel(userFiles);
          that.getView().setModel(oModel, "ObjectFileList");

          that.openFilesDialog();
        },
        error: function () {
          busyDialog.close();
          sap.m.MessageBox.error("Failed to fetch files.");
        }
      });
    },
    openFilesDialog: function () {
      const oView = this.getView();
      if (!this._pFilesDialog) {
        Fragment.load({
          id: oView.getId(),
          name: "genaiprojnew.fragment.FilesDialog",
          controller: this
        }).then(dialog => {
          oView.addDependent(dialog);
          this._pFilesDialog = dialog;
          dialog.open();
        });
      } else {
        this._pFilesDialog.open();
      }
    },

    onFileSelected: function (oEvent) {
      const selectedItem = oEvent.getParameter("listItem");
      const fileKey = selectedItem.getBindingContext("ObjectFileList").getProperty("Key");
      const fileName = selectedItem.getBindingContext("ObjectFileList").getProperty("Name");

      const previewUrl = `/cockpit/getFileDetails?key=${fileKey}`;
      const oModel = this.getView().getModel("appmodel");
      oModel.setProperty("/previewUrl", previewUrl);
      oModel.setProperty("/selectedFileName", fileName);

      this.onPreviewFile(); // Reuse your existing preview logic
    },

    onCloseFilesDialog: function () {
      this.byId("filesDialog").close();
    }
  });
});