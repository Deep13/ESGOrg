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
        return Controller.extend("ESGOrg.ESGOrg.controller.ReportingTiles", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.EmmissionsReporting
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("ReportingTiles")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function (oEvent) {
                var that = this;
                this.module = oEvent.getParameter("arguments").module;
                this.checkgetUserLog().then(async user => {
                    var data = await that.getSheets(user);
                    this._generateTiles(data[that.module]);
                    that.byId("title").setText(that.module)
                    // this._fetchTilesData();
                });

            },
            _generateTiles: function (tilesData) {
                var oPanel = this.byId("tilePanel");
                var that = this;
                oPanel.removeAllContent();
                // Clear any existing tiles
                // oTilesContainer.removeAllItems();


                tilesData.forEach(function (tileData) {
                    var iconMap = this.getIconMap(this.module);

                    // Create the GenericTile
                    var oTile = new GenericTile({
                        header: tileData,
                        press: function () {
                            that.onPressTile(tileData)
                        },
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
            onPressTile: function (val) {
                this.oRouter.navTo("ReportingSheet", { module: JSON.stringify({ tile: this.module, sub: val }) });
            },
        });
    })