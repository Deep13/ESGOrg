sap.ui.define(
  ["../controller/BaseController", "sap/m/MessageStrip"],
  function (Controller, MessageStrip) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.Main", {
      onInit: function () {

        this.getRouter()
          .getRoute("Main")
          .attachPatternMatched(this._handleRouteMatched, this);
      },
      _handleRouteMatched: function (oEvent) {
        var that = this;
        this.checkgetUserLog().then(user => {
          that.getView().byId("user").setText("Welcome, " + user.email);
        });

      },

      onLogOut: function () {
        this.logOutEmployee();
      }



    });
  }
);
