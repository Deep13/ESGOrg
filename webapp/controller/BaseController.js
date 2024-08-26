sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel"],
  function (Controller, JSONModel) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.BaseController", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       * @memberOf RecieptApp.RecieptApp.view.ClientPayment
       */
      onInit: function () {
      },
      getRouter: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        return oRouter;
      },
      checkgetUserLog: function () {
        return new Promise((resolve, reject) => {
          var that = this;
          sap.ui.core.BusyIndicator.show();
          firebase.auth().onAuthStateChanged((user) => {
            if (user) {
              resolve(user);
              sap.ui.core.BusyIndicator.hide();

              // ...
            } else {
              that.getRouter().navTo("Login");
              sap.ui.core.BusyIndicator.hide();
              reject();
            }
          });
        })

      },


      logOut: function () {
        firebase.auth().signOut();
        this.getRouter().navTo("Login")
      }

    });
  }
);
