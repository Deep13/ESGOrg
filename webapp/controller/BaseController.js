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
              firebase.app("employee").auth().onAuthStateChanged((employee) => {
                if (employee) {
                  // employee is signed in, see docs for a list of available properties
                  // https://firebase.google.com/docs/reference/js/firebase.employee
                  if (employee) {
                    resolve(employee);
                    sap.ui.core.BusyIndicator.hide();
                  }
                  else {
                    that.getRouter().navTo("EmployeeLogin");
                    sap.ui.core.BusyIndicator.hide();
                    reject();
                  }
                  // ...
                } else {
                  that.getRouter().navTo("EmployeeLogin");
                  sap.ui.core.BusyIndicator.hide();
                  reject();
                }
              });
              // ...
            } else {
              that.getRouter().navTo("Login");
              sap.ui.core.BusyIndicator.hide();
              reject();
            }
          });
        })

      },

      getUserLog: function () {

        if (firebase.app("employee").auth().currentUser) {
          return firebase.app("employee").auth().currentUser
        }
        else {
          return null;
        }
      },
      logOut: function () {
        firebase.auth().signOut();
        this.getRouter().navTo("Login")
      },
      logOutEmployee: function () {
        firebase.app("employee").auth().signOut();
        this.getRouter().navTo("EmployeeLogin")
      }

    });
  }
);
