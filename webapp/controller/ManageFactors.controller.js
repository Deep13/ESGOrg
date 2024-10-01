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
        return Controller.extend("ESGOrg.ESGOrg.controller.ManageFactors", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.ManageFactors
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("ManageFactors")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                this.checkgetUserLog().then(user => {
                    this._fetchTilesData();

                });
            },
            _fetchTilesData: function () {
                // Example API response data
                const tilesData = [
                    { title: "Fuel Bio Ref", enabled: true },
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
                var oPanel = this.byId("EmissionsPanel");

                // Clear any existing tiles
                // oTilesContainer.removeAllItems();

                tilesData.forEach(function (tileData) {
                    var iconMap = {
                        "Fuel Bio Ref": "sap-icon://energy-saving-lightbulb",
                        "Elec Heat Cooling": "sap-icon://temperature",
                        "Owned Vehicles": "sap-icon://car-rental",
                        "Materials": "sap-icon://supplier",
                        "WTT - Fuels": "sap-icon://mileage",
                        "Waste": "sap-icon://delete",
                        "Flight": "sap-icon://flight",
                        "Accommodation": "sap-icon://home",
                        "Business Travel - Land and Sea": "sap-icon://bus-public-transport",
                        "Freighting Goods": "sap-icon://cargo-train",
                        "Employees Commuting": "sap-icon://employee",
                        "Food": "sap-icon://meal",
                        "Home Office": "sap-icon://laptop",
                        "Water": "sap-icon://paint-bucket"
                    };

                    var pressFunctionMap = {
                        "Fuel Bio Ref": this.onPressFuelBioRef,
                        "Elec Heat Cooling": this.onPressElecHeatCooling,
                        "Owned Vehicles": this.onPressOwnedVehicles,
                        "Materials": this.onPressMaterials,
                        "WTT - Fuels": this.onPressWTTFuels,
                        "Waste": this.onPressWaste,
                        "Flight": this.onPressFlight,
                        "Accommodation": this.onPressAccommodation,
                        "Business Travel - Land and Sea": this.onPressBusinessTravelLandSea,
                        "Freighting Goods": this.onPressFreightingGoods,
                        "Employees Commuting": this.onPressEmployeesCommuting,
                        "Food": this.onPressFood,
                        "Home Office": this.onPressHomeOffice,
                        "Water": this.onPressWater
                    };

                    // Create the GenericTile
                    var oTile = new GenericTile({
                        class: "sapUiSmallMargin tileLayout",
                        header: tileData.title,
                        // press: this.showPopUp(tileData.title),
                        enabled: tileData.enabled
                    });

                    // Create the TileContent and ImageContent
                    var oTileContent = new TileContent();
                    var oImageContent = new ImageContent({
                        src: iconMap[tileData.title] || "sap-icon://question-mark"
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
            // showPopUp: function (title) {
            //     var formData = {
            //         "Fuel Bio Ref": [
            //             {
            //                 name: "Fuels",
            //                 type: "dropdown",
            //                 dropdownValues: ["Fuels", "Bioenergy", "Refrigerant & other"]
            //             },
            //             {
            //                 name: "Type",
            //                 type: "dropdown",
            //                 dropdownValues: ["Gaseous fuels", "Liquid fuels", "Kyoto protocol - standard", "Solid fuels"]
            //             },
            //             {
            //                 name: "Fuel",
            //                 type: "dropdown",
            //                 dropdownValues: ["CNG", "LNG", "LPG"]
            //             },
            //             {
            //                 name: "Unit",
            //                 type: "dropdown",
            //                 dropdownValues: ["litres", "cubic metres", "tonnes"]
            //             },
            //             {
            //                 name: "Amount",
            //                 type: "text"
            //             },
            //             {
            //                 name: "Factor",
            //                 type: "text"
            //             }
            //         ],
            //         "ElecHeatCooling": [
            //             {
            //                 name: "Activity",
            //                 type: "dropdown",
            //                 dropdownValues: ["Electricity", "Heat and steam", "District cooling", "Electricity - Backup"]
            //             },
            //             {
            //                 name: "Country",
            //                 type: "dropdown",
            //                 dropdownValues: ["India", "District heat and steam"]
            //             },
            //             {
            //                 name: "Unit",
            //                 type: "dropdown",
            //                 dropdownValues: ["kWh", "Ton of refrigeration"]
            //             },
            //             {
            //                 name: "Amount",
            //                 type: "text",
            //             },
            //             {
            //                 name: "GEF Factors",
            //                 type: "text"
            //             },
            //             {
            //                 name: "T&D Factors",
            //                 type: "text"
            //             }
            //         ]

            //     }
            //     var fields = formData[title];
            //     const formContainer = this.byId("formContainer");
            //     formContainer.removeAllItems();  // Clear previous items

            //     fields.forEach(field => {
            //         let control;
            //         if (field.type === "dropdown") {
            //             control = new sap.m.MultiComboBox({
            //                 id: field.name,
            //                 items: {
            //                     items: field.dropdownValues.map(function (value) {
            //                         return new sap.ui.core.Item({ key: value, text: value });
            //                     }),
            //                 }
            //             });
            //         } else if (field.type === "text") {
            //             control = new sap.m.Input({
            //                 id: field.name,
            //                 value: ""
            //             });
            //         }
            //         formContainer.addItem(new sap.m.Label({ text: field.field }));
            //         formContainer.addItem(control);
            //     });

            //     this.byId("dynamicDialog").open();
            // },
            onCloseDialog: function () {
                this.byId("dynamicDialog").close();
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("Main");
            },
            onLogOut: function () {
                this.logOut();
            }
        });
    }
);