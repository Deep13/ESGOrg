sap.ui.define(
    ["../../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Select",
        "sap/ui/core/Item",
        "sap/m/ColumnListItem",
        "sap/m/MessageToast",
        "sap/m/MessageBox"
    ],
    function (Controller, JSONModel, Column, Label, Input, Select, Item, ColumnListItem, MessageToast, MessageBox) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.Governance.EcoPerformance", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.EcoPerformance
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("EcoPerformance")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                this.checkgetUserLog().then(user => {

                });
                this.aColumns = [
                    {
                        name: "Data",
                        type: "dropdown",
                        dropdownValues: ["Total turnover", "Total Revenue", "Direct economic value generated", "Direct economic value Distributed", "Financial assistance received from governments", "Remuneration ratio of BOD vs Employee"]
                    },
                    {
                        name: "Values",
                        type: "text"
                    }
                ];

                this._initializeTable();
            },
            _initializeTable: function () {
                var oTable = this.byId("editableTable");
                var oModel = new sap.ui.model.json.JSONModel({
                    rows: []
                });
                this.getView().setModel(oModel);

                // Dynamically create columns based on aColumns array
                this.aColumns.forEach(function (column) {
                    oTable.addColumn(new Column({
                        header: new Label({ text: column.name })
                    }));
                }, this);

                // Add initial row
                this.onAddRow();
            },

            onAddRow: function () {
                var oTable = this.byId("editableTable");
                var oModel = this.getView().getModel();
                var oNewRow = {};
                var aCells = [];

                this.aColumns.forEach(function (oColumnData) {
                    oNewRow[oColumnData.name] = "";  // Initialize with empty value

                    // Create the cell based on column type
                    var oCellTemplate = this.createCellTemplate(oColumnData);
                    aCells.push(oCellTemplate);
                }.bind(this));

                var oNewItem = new ColumnListItem({
                    cells: aCells
                });

                oTable.addItem(oNewItem);

                var aRows = oModel.getProperty("/rows");
                aRows.push(oNewRow);
                oModel.setProperty("/rows", aRows);
            },

            onDeleteRow: function () {
                var oTable = this.byId("editableTable");
                var oModel = this.getView().getModel();
                var aSelectedItems = oTable.getSelectedItems();

                if (aSelectedItems.length === 0) {
                    MessageToast.show("Please select rows to delete.");
                    return;
                }

                var aRows = oModel.getProperty("/rows");

                aSelectedItems.forEach(function (oItem) {
                    var iIndex = oTable.indexOfItem(oItem);
                    aRows.splice(iIndex, 1);
                });

                oModel.setProperty("/rows", aRows);
                oTable.removeSelections();
            },

            onSubmit: function () {
                var oModel = this.getView().getModel();
                var aData = oModel.getProperty("/rows");
                console.log(aData);
                MessageBox.success("Data recorded successfully")
            },

            createCellTemplate: function (oColumnData) {
                if (oColumnData.type === "dropdown") {
                    return new Select({
                        items: oColumnData.dropdownValues.map(function (value) {
                            return new Item({ key: value, text: value });
                        }),
                        selectedKey: "{path: '" + oColumnData.name + "'}",
                        forceSelection: false
                    });
                } else if (oColumnData.type === "text") {
                    return new Input({
                        value: "{path: '" + oColumnData.name + "'}"
                    });
                }
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("GovernanceReporting");
            },
            onLogOut: function () {
                this.logOut();
            }
        });
    }
);