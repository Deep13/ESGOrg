sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Select",
        "sap/ui/core/Item",
        "sap/m/ColumnListItem",
        "sap/m/MessageToast",
        "sap/m/GenericTile",
        "sap/m/TileContent",
        "sap/m/ImageContent"],
    function (Controller, JSONModel, Column, Label, Input, Select, Item, ColumnListItem, MessageToast, GenericTile, TileContent, ImageContent) {
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
                var that = this;
                this.checkgetUserLog().then(async user => {
                    var data = await that.getSheets(user);
                    this._generateTiles(data.Emissions);
                    // this._fetchTilesData();
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
            _fetchTilesData: function () {
                // Example API response data
                const tilesData = [
                    { title: "Fuel", enabled: true },
                    { title: "Bioenergy", enabled: true },
                    { title: "Refrigerant & other", enabled: true },
                    { title: "Elec Heat Cooling", enabled: false },
                    { title: "Owned Vehicles", enabled: true },
                    { title: "Materials", enabled: true },
                    { title: "WTT - Fuels", enabled: false },
                    { title: "Waste", enabled: true },
                    { title: "Flight", enabled: true },
                    { title: "Accommodation", enabled: true },
                    { title: "Business Travel - Land and Sea", enabled: true },
                    { title: "Freighting Goods", enabled: true },
                    { title: "Employees Commuting", enabled: true },
                    { title: "Food", enabled: true },
                    { title: "Home Office", enabled: true },
                    { title: "Water", enabled: false }
                ];

                // Call the function to dynamically generate tiles
                this._generateTiles(tilesData);
            },

            _generateTiles: function (tilesData) {
                var oPanel = this.byId("tilePanel");
                oPanel.removeAllContent();
                // Clear any existing tiles
                // oTilesContainer.removeAllItems();

                tilesData.forEach(function (tileData) {


                    var pressFunctionMap = {
                        "Fuel": this.onPressFuelBioRef,
                        "Bioenergy": this.onPressFuelBioRef,
                        "Refrigerant & other": this.onPressFuelBioRef,
                        "Elec heat cooling": this.onPressElecHeatCooling,
                        "Owned Vehicles": this.onPressOwnedVehicles,
                        "Materials": this.onPressMaterials,
                        "WTT- fuels": this.onPressWTTFuels,
                        "Waste Disposal": this.onPressWaste,
                        "Flight": this.onPressFlight,
                        "Accommodation": this.onPressAccommodation,
                        "Business travel - land and sea": this.onPressBusinessTravelLandSea,
                        "Freighting goods": this.onPressFreightingGoods,
                        "Employees commuting": this.onPressEmployeesCommuting,
                        "Food": this.onPressFood,
                        "Home Office": this.onPressHomeOffice,
                        "Water": this.onPressWater
                    };

                    // Create the GenericTile
                    var oTile = new GenericTile({
                        header: tileData,
                        press: pressFunctionMap[tileData] ? pressFunctionMap[tileData].bind(this) : null,

                    });

                    // Create the TileContent and ImageContent
                    var oTileContent = new TileContent();
                    var oImageContent = new ImageContent({
                        src: iconMap[tileData] || "sap-icon://question-mark"
                    });

                    // Add the ImageContent to the TileContent
                    oTileContent.setContent(oImageContent);

                    // Add the TileContent to the GenericTile
                    oTile.addTileContent(oTileContent);
                    oTile.addStyleClass("sapUiSmallMargin tileLayout")
                    // Add the GenericTile to the VBox container
                    oPanel.addContent(oTile);
                }, this);
            },

            onPressOwnedVehicles: function () {
                sap.m.MessageToast.show("Owned Vehicles Pressed");
            },
            onPressMaterials: function () {
                sap.m.MessageToast.show("Materials Pressed");
            },
            onPressWTTFuels: function () {
                sap.m.MessageToast.show("WTT - Fuels Pressed");
            },
            onPressWaste: function () {
                sap.m.MessageToast.show("Waste Pressed");
            },
            onPressFlight: function () {
                sap.m.MessageToast.show("Flight Pressed");
            },
            onPressAccommodation: function () {
                sap.m.MessageToast.show("Accommodation Pressed");
            },
            onPressBusinessTravelLandSea: function () {
                sap.m.MessageToast.show("Business Travel - Land and Sea Pressed");
            },
            onPressFreightingGoods: function () {
                sap.m.MessageToast.show("Freighting Goods Pressed");
            },
            onPressEmployeesCommuting: function () {
                sap.m.MessageToast.show("Employees Commuting Pressed");
            },
            onPressFood: function () {
                sap.m.MessageToast.show("Food Pressed");
            },
            onPressHomeOffice: function () {
                sap.m.MessageToast.show("Home Office Pressed");
            },
            onPressWater: function () {
                sap.m.MessageToast.show("Water Pressed");
            }
        });
    }
);