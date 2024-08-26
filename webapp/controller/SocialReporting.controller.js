sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel"],
    function (Controller, JSONModel) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.SocialReporting", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.SocialReporting
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("SocialReporting")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                this.checkgetUserLog().then(user => {

                });
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("Main");
            },
            onLogOut: function () {
                this.logOut();
            },
            onPressEmployment: function (oEvent) {
                this.oRouter.navTo("Employement");
            },
            onPressLeave: function (oEvent) {
                this.oRouter.navTo("Leave");
            },
        });
    }
);