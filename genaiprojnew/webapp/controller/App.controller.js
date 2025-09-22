sap.ui.define([
  "sap/ui/core/mvc/Controller"
], function (Controller) {
  "use strict";

  return Controller.extend("genaiprojnew.controller.App", {
    onInit: function () {
      this.getOwnerComponent().getRouter().initialize();
      var oFlexibleColumnLayout = this.byId("flexibleColumnLayout");
      oFlexibleColumnLayout.setLayout("TwoColumnsMidExpanded");
    },
    onSendToAI: function () {
      var oEventBus = sap.ui.getCore().getEventBus();
      oEventBus.publish("DetailChannel", "SendToAI");
    }

  });
});
