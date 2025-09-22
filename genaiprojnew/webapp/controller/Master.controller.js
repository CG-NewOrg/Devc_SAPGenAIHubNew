sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.Master", {
    onInit: function () {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("detail").attachPatternMatched(this._onRouteMatched, this);
    },

    onTabSelect: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("listItem");
      var sTabKey = oSelectedItem.getCustomData()[0].getValue();

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
    }
  });
});
