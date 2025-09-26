sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/BusyDialog"
], function (Controller, JSONModel, BusyDialog) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.Master", {
    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);

      var oModel = new JSONModel({
        "selectedProject": "",
        "loggedInUserEmailId": "",
        "UseCaseKey": ""
      });
      this.getOwnerComponent().setModel(oModel, "NetworkGraphModel");

      var that = this;
      window.onbeforeunload = function (event) {
        that.getLogoutTime();
        return "";
      };

      var oModel = new sap.ui.model.json.JSONModel(jQuery.extend(true, {}, this._initappmodelSchema()));
      this.getView().setModel(oModel, "appmodel");

    },
    onBeforeRendering: function (oEvent) {
      this.getUserinfo();
      this.getTime();
    },
    _initappmodelSchema: function () {
      return {
        "feedbackForm": {
          "priority": "Low",
          "issueType": "Technical",
          "issueSubject": "",
          "issueDesc": "",
          "CreatedBy": ""
        }
      }
    },

    onTabSelect: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("listItem");
      var sTabKey = oSelectedItem.getCustomData()[0].getValue();

      const oAppModel = this.getView().getModel("appmodel");
      oAppModel.setProperty("/selectedTabKey", sTabKey);

      this.getOwnerComponent().getRouter().navTo("detail", {
        tab: sTabKey,
        layout: "TwoColumnsMidExpanded"
      });
    },

    _onRouteMatched: function (oEvent) {
      var sTabKey = oEvent.getParameter("arguments").tab;
      var oList = this.byId("list");
      var aItems = oList.getItems();

      aItems.forEach(function (item) {
        var key = item.getCustomData()[0].getValue();
        item.setSelected(key === sTabKey);
        item.removeStyleClass("selectedTab");
        if (key === sTabKey) {
          item.addStyleClass("selectedTab");
        }
      });
    },
    onAllLogsPress: function () {
      var oview = this.getView();
      var that = this;
      $.ajax({
        url: '/cockpit/getLoginDetailsOfAllUser',
        type: "POST",
        contentType: "application/json",

        success: function (data, status, xhr) {
          var flattenedData = [];

          // Directly iterate over the flat result array
          data.value.result.forEach(function (session) {
            flattenedData.push({
              USERNAME: session.USERNAME,
              EMAIL_ID: session.EMAIL_ID,
              date: new Date(session.date).toLocaleDateString('en-GB'),
              project: session.project === "null" ? " " : session.project,
              totalSessions: session.totalSessions,
              totalDuration: session.totalDuration,
              totalTokensConsumed: session.totalTokensConsumed
            });
          });

          var UserloginModel = new sap.ui.model.json.JSONModel();
          UserloginModel.setData(flattenedData);
          oview.setModel(UserloginModel, "UserloginModel");

          that.openUserloglist();
          console.log("Success");
        },

        error: function (jqXhr, textStatus, errorMessage) {
          console.log("Error");
          console.log(JSON.parse(jqXhr.responseText).error.message);
        }
      });
    },
    openUserloglist: function (oEvent) {
      if (!this._userlistDialog) {
        this._userlistDialog = sap.ui.xmlfragment(this.createId("iduserListDialog"), "genaiprojnew.fragment.UserListDialog", this);
        this.getView().addDependent(this._userlistDialog);
      }

      this._userlistDialog.open();

    },
    openUserloglistCancel: function (oEvent) {
      this._userlistDialog.close();
    },
    onUserLogsPress: function (oEvent) {

      var mailId = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
      var that = this;
      var oPayload = {
        Email_Id: mailId
      };
      var oPayload1 = JSON.stringify(oPayload);
      var oview = this.getView();

      $.ajax({
        url: '/cockpit/getLoginDetails',
        type: "POST",
        contentType: "application/json",
        data: oPayload1,
        success: function (data, status, xhr) {

          var flattenedData = [];
          var mailId = data.value.result.EMAIL_ID;
          var uname = data.value.result.USERNAME;
          data.value.result.sessionHistory.forEach(function (session) {

            flattenedData.push({
              USERNAME: uname,
              EMAIL_ID: mailId,
              date: new Date(session.date).toLocaleDateString('en-GB'),
              totalSessions: session.totalSessions,
              totalDuration: session.totalDuration,
              project: session.project
            });

          });
          var loginModel = new sap.ui.model.json.JSONModel();
          loginModel.setData(flattenedData);
          oview.setModel(loginModel, "loginModel");
          that.openlist();
          console.log("Success");

        },
        error: function (jqXhr, textStatus, errorMessage) {
          console.log("Error");
          console.log(JSON.parse(jqXhr.responseText).error.message);

        }
      });

    },
    openlist: function (oEvent) {
      if (!this._ologinlistDialog) {
        this._ologinlistDialog = sap.ui.xmlfragment(this.createId("idloginListDialog"), "genaiprojnew.fragment.loginDialog", this);
        this.getView().addDependent(this._ologinlistDialog);
      }

      this._ologinlistDialog.open();

    },
    onOpenlistCancel: function (oEvent) {
      this._ologinlistDialog.close();
    },
    getLogoutTime: function () {

      var that = this;
      var mailId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
      var date = new Date().toISOString();
      var logout_time = date.slice(0, date.indexOf("."));
      logout_time = logout_time + "Z";
      var sessionId = that.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/sessionId");
      var oPayload = {
        Email_Id: mailId,
        logout_time: logout_time,
        session_id: sessionId
      };
      var payload = {};

      payload["payload"] = oPayload;
      $.ajax({
        url: '/cockpit/saveLogout',
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (data, status, xhr) {
          console.log("logout time recorded");
          console.log(data.value.message);
        },
        error: function (jqXhr, textStatus, errorMessage) {
          console.log("Error");
          console.log(JSON.parse(jqXhr.responseText).error.message);

        }
      });
    },
    getUserinfo: function () {
      if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("UserInfo")) {
        var oUserInfoService = sap.ushell.Container.getService("UserInfo");
        var sUserId = oUserInfoService.getId();
        var sEmailId = oUserInfoService.getEmail();
        if (sEmailId) {
          this._loggedInUser = sEmailId;
        } else if (sUserId && sUserId !== 'DEFAULT_USER')
          this._loggedInUser = sUserId;
      }
      this.getOwnerComponent().getModel("NetworkGraphModel").setProperty("/loggedInUserEmailId", this._loggedInUser);
      this.getOwnerComponent().getModel("NetworkGraphModel").setProperty("/loggedInUserName", oUserInfoService.getFullName());
    },
    getTime: function () {
      var userName = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserName");
      var mailId = this.getOwnerComponent().getModel("NetworkGraphModel").getProperty("/loggedInUserEmailId");
      var date = new Date().toISOString();
      var loginTime = date.slice(0, date.indexOf("."));
      loginTime = loginTime + "Z";
      var nwModel = this.getOwnerComponent().getModel("NetworkGraphModel");

      var oPayload = {
        Email_Id: mailId,
        UserName: userName,
        login_time: loginTime

      };
      var payload = {};
      payload["payload"] = oPayload;
      $.ajax({
        url: '/cockpit/saveLogin',
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (data, status, xhr) {
          var sessionId = data.value.result.session_id;
          nwModel.setProperty("/sessionId", sessionId);

          console.log("Success");
          console.log(data.value.message);
        },
        error: function (jqXhr, textStatus, errorMessage) {
          console.log("Error");
          console.log(JSON.parse(jqXhr.responseText).error.message);
        }
      });
    },
    handlePressFeedback: function (oEvent) {
      var oModel = this.getView().getModel("appmodel");
      oModel.refresh(true);
      var oFeedbackInit = {
        "priority": "Low",
        "issueType": "Technical",
        "issueSubject": "",
        "issueDesc": "",
        "CreatedBy": ""
      }
      oModel.setProperty("/feedbackForm", oFeedbackInit);

      if (!this._oFeedbackDialog) {
        this._oFeedbackDialog = sap.ui.xmlfragment(this.createId("idFeedbackDialog"), "genaiprojnew.fragment.FeedbackDialog", this);
        this.getView().addDependent(this._oFeedbackDialog);
      }
      this._oFeedbackDialog.open();
    },
    onFeedbackSubmit: function () {
      var oBundle = this.getView().getModel("i18n").getResourceBundle();
      var oModel = this.getView().getModel("appmodel"),
        sPriority = oModel.getProperty("/feedbackForm/priority"),
        sIssueSub = oModel.getProperty("/feedbackForm/issueSubject"),
        sIssueDetail = oModel.getProperty("/feedbackForm/issueDesc"),
        sIssueType = oModel.getProperty("/feedbackForm/issueType"),
        that = this;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so add 1
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      const formattedTime = `${hours}:${minutes}:${seconds}`;
      const dateTime = `${formattedDate} ${formattedTime}`;
      console.log("Date and Time:", dateTime);

      if (!sPriority || !sIssueDetail || !sIssueSub || !sIssueType) {
        sap.m.MessageBox.information(oBundle.getText("fillDetails"));
        return
      }
      var oPayload = {
        "Priority": sPriority,
        "IssueType": sIssueType,
        "IssueTitle": sIssueSub,
        "IssueDetail": sIssueDetail,
        "UserId": this._loggedInUser,
        "DateTime": dateTime
      };
      var payload = {};
      payload["payload"] = oPayload;

      oModel.setProperty("/feedbackDialog", oPayload);
      this.busyDialog = new BusyDialog();
      this.busyDialog.open();

      $.ajax({
        url: "/cockpit/createFeedback",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),
        success: function (data, status, xhr) {
          var oFeedbackInit = {
            "priority": "Low",
            "issueType": "Technical",
            "issueSubject": "",
            "issueDesc": "",
            "CreatedBy": ""
          }
          oModel.setProperty("/feedbackForm", oFeedbackInit);
          that.busyDialog.close();
          that._oFeedbackDialog.close();
          sap.m.MessageBox.information(oBundle.getText("thankYouFeedback"));
        },
        error: function (jqXhr, textStatus, errorMessage) {
          that.busyDialog.close();
          sap.m.MessageBox.information(oBundle.getText("errContactITTeam"));
        }
      });
    },

    onPressFeedbackEmail: function () {
      var oModel = this.getView().getModel("appmodel"),
        sIssueSub = oModel.getProperty("/feedbackForm/issueSubject") || " ",
        sIssueDetail = oModel.getProperty("/feedbackForm/issueDesc") || " ";
      window.location.href = "mailto:naassap-technicalsolutioncenter.in@capgemini.com?subject=" + sIssueSub + "&body=" + sIssueDetail;
    },

    onFeedbackCancel: function (oEvent) {
      this._oFeedbackDialog.close();
      this._oFeedbackDialog.destroy();
      this._oFeedbackDialog = null;

    },

  });
});
