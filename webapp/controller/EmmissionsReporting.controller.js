sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Select",
        "sap/ui/core/Item",
        "sap/m/ColumnListItem",
        "sap/m/MessageToast"],
    function (Controller, JSONModel, Column, Label, Input, Select, Item, ColumnListItem, MessageToast) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.EmmissionsReporting", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.EmmissionsReporting
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("EmmissionsReporting")
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
            onPressFuelBioRef: function (oEvent) {
                this.oRouter.navTo("FuelBioRef");
            },
            onPressElecHeatCooling: function (oEvent) {
                this.oRouter.navTo("ElecHeatCooling");
            },
        });
    }
);