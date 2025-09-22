sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.DetailDetail", {
    onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("detailDetail")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      this.sTabKey = oEvent.getParameter("arguments").tab; // ✅ Store tab key
      var sResponse = "AI Response for tab: " + this.sTabKey;
      this.getView().byId("aiResponseArea").setValue(sResponse);
    },

    onNavBack: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("detail", {
        tab: this.sTabKey,
        layout: "TwoColumnsMidExpanded"
      });
    }
  });
});
