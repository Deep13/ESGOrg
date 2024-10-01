sap.ui.define(
    ["../../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Select",
        "sap/ui/core/Item",
        "sap/m/ColumnListItem",
        "sap/m/MessageToast", "sap/m/MessageBox"],
    function (Controller, JSONModel, Column, Label, Input, Select, Item, ColumnListItem, MessageToast, MessageBox) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.Emissions.FuelBioRef", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.FuelBioRef
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("FuelBioRef")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            onExit: function () {

            },
            onItemSelect: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    var oModel = new JSONModel({ results: [] });
                    this.getView().setModel(oModel, "moduleMaster");
                    var oModel = new sap.ui.model.json.JSONModel({
                        isEditable: true // Prefill with backend data or start empty
                    });
                    this.getView().setModel(oModel, "editableModel");
                    var uniqueOfficeTypes = [...new Set(user.branches.map(item => item.officeType))];

                    // Convert unique officeType values to the desired format
                    var formattedOfficeTypes = uniqueOfficeTypes.map(type => ({ officeType: type }));
                    var masterModel = { ...that.getMaster(), EmployeeBranches: user.branches, EmployeeOffices: formattedOfficeTypes };

                    var oModel = new sap.ui.model.json.JSONModel(masterModel);
                    this.getView().setModel(oModel, "masterModel");
                    if (user.role === "Admin") {
                        that.getView().byId("adminVariant").setVisible(true);
                        if (masterModel.currentReportingCycle.status) {
                            that.getView().byId("adminVariantCreate").setVisible(false);
                        }
                        else {
                            that.getView().byId("adminVariantCreate").setVisible(true);
                            that.createVariantMaster();
                        }
                    }
                    else {
                        that.getView().byId("adminVariantCreate").setVisible(false);
                        that.getView().byId("adminVariant").setVisible(false);
                    }

                });


            },
            selectBranch: function (oEvent) {
                var that = this;
                var userData = this.userData;
                var monthYear = this.getView().getModel("masterModel").getProperty("/currentReportingCycle");
                var officeType = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().officeType;
                var branch = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().branch;
                if (this.moduleData) {
                    if (this.moduleData[branch]) {
                        if (this.moduleData[branch].dataType == "Variant") {
                            that._initializeTable(that.moduleData[branch].data);
                        }
                        else {
                            that._initializeTableCustom(that.moduleData[branch].data);
                        }
                    }
                    else {
                        if (that.variantData) {
                            if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                that._initializeTable(that.variantData[officeType])
                            }
                            else {
                                that.createModuleTable();
                            }
                        }
                        else {
                            const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref");
                            docRef.get().then((doc) => {
                                if (doc.exists) {
                                    console.log("Document data:", doc.data());
                                    this.variantData = doc.data();
                                    if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                        that._initializeTable(that.variantData[officeType])
                                    }
                                    else {
                                        that.createModuleTable();
                                    }
                                }
                            }).catch((error) => {
                                that.createModuleTable()
                            });
                        }
                    }
                }
                else {
                    const docRefRecord = firebase.firestore().collection(userData.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Fuel Bio Ref");
                    docRefRecord.get().then((doc) => {
                        if (doc.exists) {
                            console.log("Document data:", doc.data());
                            this.moduleData = doc.data();
                            if (that.moduleData[branch]) {

                                if (this.moduleData[branch].dataType == "Variant") {
                                    that._initializeTable(that.moduleData[branch].data);
                                }
                                else {
                                    that._initializeTableCustom(that.moduleData[branch].data);
                                }
                            }
                            else {
                                if (that.variantData) {
                                    if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                        that._initializeTable(that.variantData[officeType])
                                    }
                                    else {
                                        that.createModuleTable();
                                    }
                                }
                                else {
                                    const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref");
                                    docRef.get().then((doc) => {
                                        if (doc.exists) {
                                            console.log("Document data:", doc.data());
                                            this.variantData = doc.data();
                                            if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                                that._initializeTable(that.variantData[officeType])
                                            }
                                            else {
                                                that.createModuleTable();
                                            }
                                        }
                                    }).catch((error) => {
                                        that.createModuleTable()
                                    });
                                }
                            }
                        } else {
                            if (that.variantData) {
                                if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                    that._initializeTable(that.variantData[officeType])
                                }
                                else {
                                    that.createModuleTable();
                                }
                            }
                            else {
                                const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref");
                                docRef.get().then((doc) => {
                                    if (doc.exists) {
                                        console.log("Document data:", doc.data());
                                        this.variantData = doc.data();
                                        if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                            that._initializeTable(that.variantData[officeType])
                                        }
                                        else {
                                            that.createModuleTable();
                                        }
                                    }
                                }).catch((error) => {
                                    that.createModuleTable()
                                });
                            }

                        }
                    }).catch((error) => {
                        that._initializeTable([])


                    });
                }
            },
            createModuleTable: function () {
                this.custom = true;
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                oTable.unbindItems();
                // Get table reference
                // this.getView().getModel("moduleMaster").setProperty("/results", this.structData);
                this.getView().getModel("moduleMaster").setData({ results: this.structData });
                // Dynamically create columns based on JSON keys
                var oFirstRow = this.structData[0]; // Assuming all rows have the same structure
                var aKeys = Object.keys(oFirstRow);
                aKeys = aKeys.filter(item => item !== "Factor");
                aKeys.push("Amount");
                aKeys.push("Factor");
                aKeys.forEach(function (sKey) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Text({ text: sKey })
                    }));
                });

                // Create template for the table rows (items)
                var oTemplate = new sap.m.ColumnListItem({
                    cells: aKeys.map(function (sKey) {
                        if (sKey == "Factor" || sKey == "Amount") {
                            return new Input({
                                value: "{moduleMaster>" + sKey + "}",

                            });
                        }
                        return new sap.m.Text({
                            text: "{moduleMaster>" + sKey + "}" // Bind each column to the corresponding key
                        });
                    })
                });

                // Bind rows/items to the table
                oTable.bindItems({
                    path: "moduleMaster>/results",
                    template: oTemplate
                });

            },
            selectBranchVariant: function (oEvent) {
                var that = this;
                var userData = this.userData;
                var officeType = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().officeType;

                if (!this.variantData) {
                    const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref");
                    docRef.get().then((doc) => {
                        if (doc.exists) {
                            console.log("Document data:", doc.data());
                            this.variantData = doc.data();
                            if (that.variantData[officeType]) {
                                that._initializeTableVariant(that.variantData[officeType]);
                            }
                            else {
                                that._initializeTableVariant([]);
                            }
                        }
                    }).catch((error) => {
                        that._initializeTableVariant([])
                    });
                }
                else {
                    that._initializeTableVariant(that.variantData[officeType]);
                }
            },
            _prefillRows: function (aRows, columns) {
                var oTable = this.byId("editableTable");
                var aCells;

                aRows.forEach(function (oRowData) {
                    aCells = [];

                    // Create cells for each column based on column type and prefill data
                    columns.forEach(function (oColumnData) {
                        var oCellTemplate = this.createCellTemplate(oRowData[oColumnData] ? oRowData[oColumnData] : "", oColumnData);
                        aCells.push(oCellTemplate);
                    }.bind(this));

                    var oNewItem = new sap.m.ColumnListItem({
                        cells: aCells
                    });

                    oTable.addItem(oNewItem);
                }.bind(this));
            },
            _initializeTable: function (aRows) {
                this.custom = false;
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();




                // Dynamically create columns based on aColumns array
                var columns = [...new Set(aRows.flatMap(Object.keys))];
                columns = columns.filter(item => item !== "Amount");
                columns.push("Amount");
                columns = columns.filter(item => item !== "Factor");
                columns.push("Factor");
                columns.forEach(function (column) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Label({ text: column })
                    }));
                }, this);

                if (aRows && aRows.length > 0) {
                    // this._prefillRows(aRows, columns);
                    this.createCellTemplate(columns);
                    var oModel = new sap.ui.model.json.JSONModel({
                        results: aRows  // Prefill with backend data or start empty
                    });
                    this.getView().setModel(oModel, "moduleMaster");
                }
            },

            _initializeTableCustom: function (data) {
                this.custom = true;
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                oTable.unbindItems();
                var struct = [...this.structData];
                var combinedData = this.updateStructWithIncoming(struct, data)
                this.getView().getModel("moduleMaster").setData({ results: combinedData });
                // Dynamically create columns based on JSON keys
                var oFirstRow = combinedData[0]; // Assuming all rows have the same structure
                var aKeys = Object.keys(oFirstRow);
                aKeys = aKeys.filter(item => item !== "Amount");
                aKeys.push("Amount");
                aKeys = aKeys.filter(item => item !== "Factor");
                aKeys.push("Factor");
                aKeys.forEach(function (sKey) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Text({ text: sKey })
                    }));
                });

                // Create template for the table rows (items)
                var oTemplate = new sap.m.ColumnListItem({
                    cells: aKeys.map(function (sKey) {
                        if (sKey == "Factor" || sKey == "Amount") {
                            return new Input({
                                value: "{moduleMaster>" + sKey + "}",

                            });
                        }
                        return new sap.m.Text({
                            text: "{moduleMaster>" + sKey + "}" // Bind each column to the corresponding key
                        });
                    })
                });

                // Bind rows/items to the table
                oTable.bindItems({
                    path: "moduleMaster>/results",
                    template: oTemplate
                });

            },

            onSubmit: function () {
                var that = this;
                var aData = this.getView().getModel("moduleMaster").getData().results;
                var monthYear = this.getView().getModel("masterModel").getProperty("/currentReportingCycle");
                var branch = this.getView().getModel("masterModel").getProperty("/EmployeeBranch");
                if (!branch) {
                    MessageBox.warning("Kindly select branch");
                    return;
                }
                console.log(aData);
                var aFilteredData = []
                aData.map(val => {
                    if (val.Amount) {
                        aFilteredData.push(val)

                    }

                });
                if (aFilteredData.length !== aData.length) {
                    MessageBox.confirm(
                        "Columns with empty Amount would be ignored. Do you still want to proceed?", {
                        title: "Confirmation",
                        onClose: function (oAction) {
                            if (oAction === "OK") {
                                var user = that.userData;
                                firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Fuel Bio Ref").set({
                                    [branch]: {
                                        data: aFilteredData,
                                        status: "Draft",
                                        updatedAt: new Date(),
                                        updatedBy: user.userId,
                                        dataType: that.custom ? "Custom" : "Variant"
                                    }

                                }, { merge: true })
                                    .then(() => {
                                        MessageBox.success("Data successfully saved as draft!");
                                    })
                                    .catch((error) => {
                                        MessageBox.error("Error writing document: " + error);
                                    });
                            }
                        }
                    });
                }
                else {
                    var user = that.userData;
                    firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Fuel Bio Ref").set({
                        [branch]: {
                            data: aFilteredData,
                            status: "Draft",
                            updatedAt: new Date(),
                            updatedBy: user.userId,
                            dataType: that.custom ? "Custom" : "Variant"
                        }

                    }, { merge: true })
                        .then(() => {
                            MessageBox.success("Data successfully saved as draft!");
                        })
                        .catch((error) => {
                            MessageBox.error("Error writing document: " + error);
                        });
                }

            },
            onSave: function () {
                var that = this;
                // Show confirmation dialog before deleting
                var branch = that.getView().getModel("masterModel").getProperty("/EmployeeBranch");
                if (!branch) {
                    MessageBox.warning("Kindly select branch");
                    return;
                }
                MessageBox.confirm(
                    "Are you sure you want to Submit?", {
                    title: "Submit Confirmation",
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            var aData = that.getView().getModel("moduleMaster").getData().results;
                            var monthYear = that.getView().getModel("masterModel").getProperty("/currentReportingCycle");

                            console.log(aData);
                            var aFilteredData = []
                            aData.map(val => {
                                if (val.Amount) {
                                    aFilteredData.push(val)

                                }

                            });
                            if (aFilteredData.length !== aData.length) {
                                MessageBox.confirm(
                                    "Columns with empty Amount would be ignored. Do you still want to proceed?", {
                                    title: "Confirmation",
                                    onClose: function (oAction) {
                                        if (oAction === "OK") {
                                            var user = that.userData;
                                            firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Fuel Bio Ref").set({
                                                [branch]: {
                                                    data: aFilteredData,
                                                    status: "Submitted",
                                                    updatedAt: new Date(),
                                                    updatedBy: user.userId,
                                                    dataType: "Variant"
                                                }

                                            }, { merge: true })
                                                .then(() => {
                                                    firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Statistics").set({
                                                        [branch]: {
                                                            completed: "10%",
                                                            Emissions: ["Fuel", "Materials"],
                                                            Social: ["Retention", "Leave"],
                                                            Governance: ["Entity"],
                                                        }

                                                    }, { merge: true })
                                                        .then(() => {
                                                            MessageBox.success("Data successfully saved as draft!");

                                                        })
                                                        .catch((error) => {
                                                            MessageBox.error("Error writing document: " + error);
                                                        });
                                                    MessageBox.success("Data successfully saved as draft!");


                                                })
                                                .catch((error) => {
                                                    MessageBox.error("Error writing document: " + error);
                                                });
                                        }
                                    }
                                });
                            }
                            else {
                                var user = that.userData;
                                firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Fuel Bio Ref").set({
                                    [branch]: {
                                        data: aFilteredData,
                                        status: "Submitted",
                                        updatedAt: new Date(),
                                        updatedBy: user.userId,
                                        dataType: "Variant"
                                    }

                                }, { merge: true })
                                    .then(() => {
                                        firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Statistics").set({
                                            [branch]: {
                                                completed: "10%",
                                                Emissions: ["Fuel", "Materials"],
                                                Social: ["Retention", "Leave"],
                                                Governance: ["Entity"],
                                            }

                                        }, { merge: true })
                                            .then(() => {
                                                MessageBox.success("Data successfully saved as draft!");

                                            })
                                            .catch((error) => {
                                                MessageBox.error("Error writing document: " + error);
                                            });
                                        MessageBox.success("Data successfully saved as draft!");


                                    })
                                    .catch((error) => {
                                        MessageBox.error("Error writing document: " + error);
                                    });
                            }

                        }
                    }
                }
                );
            },
            createCellTemplate: function (columns) {
                var acolumns = [];
                columns.map(val => {
                    if (val == "Factor" || val == "Amount") {
                        acolumns.push(new Input({
                            value: "{moduleMaster>" + val + "}",
                            editable: true
                        }))
                    }
                    else {
                        acolumns.push(new Input({
                            value: "{moduleMaster>" + val + "}",
                            editable: false
                        }))
                    }
                });
                var oTable = this.byId("editableTable");
                oTable.bindItems({
                    path: "moduleMaster>/results", // Adjust to your model
                    template: new sap.m.ColumnListItem({
                        cells: acolumns
                    })
                });


            },
            createCellTemplateVariant: function (oColumnData) {
                return new Input({
                    value: oColumnData,
                    editable: false
                });

            },
            _initializeTableVariant: function (aRows) {
                var oTable = this.byId("VariantTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                // this.getView().setModel(oModel);
                // var oModel = new sap.ui.model.json.JSONModel({
                //     rows: aRows
                // });
                // this.getView().setModel(oModel, "Variant");

                var columns = [...new Set(aRows.flatMap(Object.keys))];
                columns = columns.filter(item => item !== "Factor");
                columns.push("Factor");
                // Dynamically create columns based on aColumns array
                columns.forEach(function (column) {
                    oTable.addColumn(new Column({
                        header: new Label({ text: column })
                    }));
                }, this);
                if (aRows && aRows.length > 0) {
                    this._prefillRowsVariant(aRows, columns);
                }
                // Add initial row

            },

            onSaveVariant: function () {
                var that = this;
                var branch = this.getView().byId("selectedOffice").getSelectedKey();
                if (!branch) {
                    MessageBox.warning("Kindly select office");
                    return;
                }
                var oTable = this.byId("CreateVariantTable");
                var data = oTable.getSelectedItems();
                if (data.length > 0) {
                    var selectData = [];
                    data.map(val => {
                        selectData.push(val.getBindingContext("variantMaster").getObject());
                    })
                }
                else {
                    var selectData = [];
                }
                var user = this.userData;
                firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref").set({
                    [branch]: selectData
                }, { merge: true })
                    .then(() => {
                        MessageBox.success("Variant successfully saved!");
                        if (that.variantData) {
                            that.variantData[branch] = selectData;
                        }
                        else {
                            that.variantData = { [branch]: selectData }
                        }

                    })
                    .catch((error) => {
                        MessageBox.error("Error writing document: " + error);
                    });
            },
            onDeleteVariant: function () {
                var that = this;
                var branch = this.byId("variantBranch").getSelectedItem().getBindingContext("masterModel").getObject().officeType;
                if (that.variantData[branch] && that.variantData[branch].length > 0) {
                    MessageBox.confirm(`Are you sure you want to delete variant for office ${branch}`, {
                        onClose: function (oAction) {
                            if (oAction === "OK") {
                                var user = that.userData;
                                firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc("Fuel Bio Ref").update({
                                    [branch]: firebase.firestore.FieldValue.delete()
                                })
                                    .then(() => {
                                        MessageBox.success("Variant successfully deleted!");
                                        delete (that.variantData[branch]);
                                        var oTable = that.byId("VariantTable");
                                        oTable.removeAllColumns();
                                        oTable.removeAllItems();

                                    })
                                    .catch((error) => {
                                        MessageBox.error("Error writing document: " + error);
                                    });
                            }
                        }
                    })
                }
            },
            _prefillRowsVariant: function (aRows, columns) {
                var oTable = this.byId("VariantTable");
                var aCells;

                aRows.forEach(function (aRowData) {
                    aCells = [];

                    // Create cells for each column based on column type and prefill data
                    columns.forEach(function (oColumnData) {
                        var oCellTemplate = this.createCellTemplateVariant(aRowData[oColumnData] ? aRowData[oColumnData] : "");
                        aCells.push(oCellTemplate);
                    }.bind(this));

                    var oNewItem = new sap.m.ColumnListItem({
                        cells: aCells
                    });

                    oTable.addItem(oNewItem);
                }.bind(this));
                // var oModel = this.getView().getModel("Variant");
                // oModel.setProperty("/rows", aRows)
            },
            onpressBack: function (oEvent) {
                this.oRouter.navTo("EmmissionsReporting");
            },
            // onLogOut: function () {
            //     this.logOut();
            // },
            findGHGConversion: function (data1, data2) {
                return data1.map(entry1 => {
                    // Concatenate the necessary fields from Data 1
                    let concatenatedValue = Object.values(entry1).join("");

                    // Find matching entry in Data 2 by comparing concatenatedValue to Lookup
                    let matchedEntry = data2.find(entry2 => entry2.Lookup === concatenatedValue);

                    // If a match is found, return the GHG Conversion, else return null or "Not Found"
                    return {
                        ...entry1,  // Include original data from Data 1
                        Factor: matchedEntry ? matchedEntry['GHG Conversion'] : 'Not Found'
                    };
                });
            },
            updateStructWithIncoming: function (data, incoming) {
                var struct = JSON.parse(JSON.stringify(data));
                // Loop through each element in struct
                struct.forEach(structItem => {
                    // Find matching entry in incoming based on multiple fields
                    let matchedIncoming = incoming.find(incomingItem =>
                        incomingItem.Scope === structItem.Scope &&
                        incomingItem.Fuels === structItem.Fuels &&
                        incomingItem.Type === structItem.Type &&
                        incomingItem.Fuel === structItem.Fuel &&
                        incomingItem.Unit === structItem.Unit
                    );

                    // If a match is found, update the struct item with Factor and Amount from incoming
                    if (matchedIncoming) {
                        structItem.Factor = matchedIncoming.Factor; // Update Factor
                        structItem.Amount = matchedIncoming.Amount; // Add Amount
                    }
                });

                return struct;
            },
            createVariantMaster: function () {
                var that = this;
                // JSON data
                var oData = [
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "CNG",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "LNG",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "LPG",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "Natural gas",
                        "Unit": "cubic metres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "Natural gas (100% mineral blend)",
                        "Unit": "cubic metres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Gaseous fuels",
                        "Fuel": "Other petroleum gas",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Aviation spirit",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Aviation turbine fuel",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Burning oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Diesel (average biofuel blend)",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Diesel (100% mineral diesel)",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Fuel oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Gas oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Lubricants",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Naphtha",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Petrol (100% mineral petrol)",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Processed fuel oils - residual oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Processed fuel oils - distillate oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Waste oils",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Marine gas oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Liquid fuels",
                        "Fuel": "Marine fuel oil",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Coal (industrial)",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Coal (electricity generation)",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Coal (domestic)",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Coking coal",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Petroleum coke",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Fuels",
                        "Type": "Solid fuels",
                        "Fuel": "Coal (electricity generation - home produced coal only)",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biofuel",
                        "Fuel": "Bioethanol",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biofuel",
                        "Fuel": "Biodiesel ME",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biofuel",
                        "Fuel": "Biodiesel ME (from used cooking oil)",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biofuel",
                        "Fuel": "Biodiesel ME (from tallow)",
                        "Unit": "litres"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biomass",
                        "Fuel": "Wood logs",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biomass",
                        "Fuel": "Wood chips",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biomass",
                        "Fuel": "Wood pellets",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biomass",
                        "Fuel": "Grass/straw",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biogas",
                        "Fuel": "Biogas",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Bioenergy",
                        "Type": "Biogas",
                        "Fuel": "Landfill gas",
                        "Unit": "tonnes"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "Carbon dioxide",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "Methane",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "Nitrous oxide",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-23",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-32",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-41",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-125",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-134",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-134a",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-143",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-143a",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-152a",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-227ea",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-236fa",
                        "Unit": "kg"
                    },
                    {
                        "Scope": "Scope 1",
                        "Fuels": "Refrigerant & other",
                        "Type": "Kyoto protocol - standard",
                        "Fuel": "HFC-245ca",
                        "Unit": "kg"
                    }
                ]
                    ;
                var conData = "";
                const docRef = firebase.firestore().collection("Master Data").doc("Factors");
                docRef.get().then((doc) => {
                    if (doc.exists) {
                        console.log("Document data:", doc.data());
                        conData = that.findGHGConversion(oData, doc.data().factor);
                        // Create JSONModel and set the data
                        that.structData = conData;
                        var oModel = new JSONModel({ results: conData });
                        that.getView().setModel(oModel, "variantMaster");

                        // Get table reference
                        var oTable = that.byId("CreateVariantTable");

                        // Dynamically create columns based on JSON keys
                        var oFirstRow = conData[0]; // Assuming all rows have the same structure
                        var aKeys = Object.keys(oFirstRow);
                        // aKeys.push("Factor");
                        aKeys.forEach(function (sKey) {
                            oTable.addColumn(new sap.m.Column({
                                header: new sap.m.Text({ text: sKey })
                            }));
                        });

                        // Create template for the table rows (items)
                        var oTemplate = new sap.m.ColumnListItem({
                            cells: aKeys.map(function (sKey) {
                                if (sKey == "Factor") {
                                    return new Input({
                                        value: "{variantMaster>" + sKey + "}",

                                    });
                                }
                                return new sap.m.Text({
                                    text: "{variantMaster>" + sKey + "}" // Bind each column to the corresponding key
                                });
                            })
                        });

                        // Bind rows/items to the table
                        oTable.bindItems({
                            path: "variantMaster>/results",
                            template: oTemplate
                        });
                    }
                }).catch((error) => {
                });


            }
        });
    }
);