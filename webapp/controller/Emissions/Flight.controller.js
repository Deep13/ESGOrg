sap.ui.define([
    "../../controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/Input",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, Column, Label, Input, MessageBox) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.Emissions.Flight", {

        onInit: function () {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter
                .getRoute("Flight")
                .attachPatternMatched(this._handleRouteMatched, this);

        },
        _handleRouteMatched: function (oEvent) {
            var that = this;
            var oModule = oEvent.getParameter("arguments").module;
            this.module = JSON.parse(oModule).sub;
            this.tile = JSON.parse(oModule).tile;
            this.variantData = undefined;
            this.moduleData = undefined;
            this.checkgetUserLog().then(async user => {
                var oModel = new JSONModel({
                    results: []
                });
                that.getView().setModel(oModel, "variantModel");
                var oModel = new JSONModel({
                    results: []
                });
                that.getView().setModel(oModel, "variantDataModel");
                var oModel = new JSONModel({
                    results: []
                });
                that.getView().setModel(oModel, "dataModel");
                // Initializing the model with an empty array for flights
                that.byId("status").setText("");
                that.byId("title").setText(that.module);
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
                        that._initializeTableVariant([]);
                        // that.createVariantMaster();
                    }
                }
                else {
                    that.getView().byId("adminVariantCreate").setVisible(false);
                    that.getView().byId("adminVariant").setVisible(false);
                }

            });
        },
        selectBranch: function (oEvent) {
            this.byId("flightTable").removeSelections()

            this.byId("headToolbar").setVisible(true)
            var that = this;
            var userData = this.userData;
            var monthYear = this.getView().getModel("masterModel").getProperty("/currentReportingCycle");
            var officeType = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().officeType;
            var branch = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().branch;
            that.byId("status").setText("");
            if (this.moduleData) {
                if (this.moduleData[branch]) {
                    if (this.moduleData[branch].dataType == "Variant") {
                        that.custom = false;

                        if (this.moduleData[branch].status == "Submitted") {
                            that.byId("status").setText("Submitted");
                            that._initializeTable(that.moduleData[branch].data, false);
                        }
                        else {
                            if (this.moduleData[branch].status == "Submitted") {
                                that.byId("status").setText("Submitted");
                            }
                            that._initializeTable(that.moduleData[branch].data, false);
                        }
                    }
                    else {
                        if (this.moduleData[branch].status == "Submitted") {
                            that.byId("status").setText("Submitted");
                        }
                        that.custom = true;
                        that._initializeTable(that.moduleData[branch].data, true);
                    }
                }
                else {
                    if (that.variantData) {
                        if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                            that.custom = false;

                            that._initializeTable(that.variantData[officeType])
                        }
                        else {
                            that.custom = true;

                            that.createModuleTable();
                        }
                    }
                    else {
                        const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
                        docRef.get().then((doc) => {
                            if (doc.exists) {
                                console.log("Document data:", doc.data());
                                this.variantData = doc.data();
                                if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                    that.custom = false;
                                    that._initializeTable(that.variantData[officeType])
                                }
                                else {
                                    that.custom = true;
                                    that.createModuleTable();
                                }
                            }
                            else {
                                that.custom = true;
                                this.variantData = undefined;
                                that.createModuleTable();
                            }
                        }).catch((error) => {
                            that.custom = true;
                            that.createModuleTable()
                        });
                    }
                }
            }
            else {
                const docRefRecord = firebase.firestore().collection(userData.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module);
                docRefRecord.get().then((doc) => {
                    if (doc.exists) {
                        console.log("Document data:", doc.data());
                        this.moduleData = doc.data();
                        if (that.moduleData[branch]) {

                            if (this.moduleData[branch].dataType == "Variant") {
                                that.custom = false;
                                if (this.moduleData[branch].status == "Submitted") {
                                    that.byId("status").setText("Submitted");
                                    that._initializeTable(that.moduleData[branch].data, false);
                                }
                                else {

                                    that._initializeTable(that.moduleData[branch].data, false);
                                }

                            }
                            else {
                                that.custom = true;
                                that._initializeTable(that.moduleData[branch].data, true);
                            }
                        }
                        else {
                            if (that.variantData) {
                                if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                    that.custom = false;
                                    that._initializeTable(that.variantData[officeType])
                                }
                                else {
                                    that.custom = true;
                                    that.createModuleTable();
                                }
                            }
                            else {
                                const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
                                docRef.get().then((doc) => {
                                    if (doc.exists) {
                                        console.log("Document data:", doc.data());
                                        this.variantData = doc.data();
                                        if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                            that.custom = false;
                                            that._initializeTable(that.variantData[officeType])
                                        }
                                        else {
                                            that.custom = true;
                                            that.createModuleTable();
                                        }
                                    }
                                    else {
                                        this.variantData = undefined;
                                        that.custom = true;
                                        that.createModuleTable();
                                    }
                                }).catch((error) => {
                                    that.custom = true;
                                    that.createModuleTable()
                                });
                            }
                        }
                    } else {
                        if (that.variantData) {
                            if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                that.custom = false;
                                that._initializeTable(that.variantData[officeType])
                            }
                            else {
                                that.custom = true;
                                that.createModuleTable();
                            }
                        }
                        else {
                            const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
                            docRef.get().then((doc) => {
                                if (doc.exists) {
                                    console.log("Document data:", doc.data());
                                    this.variantData = doc.data();
                                    if (that.variantData[officeType] && that.variantData[officeType].length > 0) {
                                        that.custom = false;
                                        that._initializeTable(that.variantData[officeType])
                                    }
                                    else {
                                        that.custom = true;
                                        that.createModuleTable();
                                    }
                                }
                                else {
                                    this.variantData = undefined;
                                    that.custom = true;
                                    that.createModuleTable();
                                }
                            }).catch((error) => {
                                that.custom = true;
                                that.createModuleTable()
                            });
                        }

                    }
                }).catch((error) => {
                    that.custom = true;
                    that._initializeTable([])


                });
            }
        },
        _initializeTable: function (aRows, status) {
            var that = this;
            that.getView().getModel("dataModel").setProperty("/results", aRows);
            that.getView().getModel("dataModel").setProperty("/editable", status ? status : false);
            that.getView().getModel("dataModel").refresh(true)
        },
        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
        },
        onAddRow: function () {
            // Get the model and the flight data
            var oModel = this.getView().getModel("dataModel");
            var aFlights = oModel.getProperty("/results");

            // Add a new empty row
            aFlights.push({
                origin: "",
                destination: "",
                class: "Economy",
                tripType: "Single way",
                co2e: ""
            });

            // Update the model with the new row
            oModel.setProperty("/results", aFlights);
        },
        onAddRowVariant: function () {
            // Get the model and the flight data
            var oModel = this.getView().getModel("variantModel");
            var aFlights = oModel.getProperty("/results");

            // Add a new empty row
            aFlights.push({
                origin: "",
                destination: "",
                class: "Economy",
                tripType: "Single way",
                co2e: ""
            });

            // Update the model with the new row
            oModel.setProperty("/results", aFlights);
        },

        onDeleteRow: function () {
            var oTable = this.getView().byId("flightTable");
            var oModel = this.getView().getModel("dataModel");
            var aFlights = oModel.getProperty("/results");

            // Get selected item
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length > 0) {
                var aSelectedIndices = aSelectedItems.map(function (item) {
                    return oTable.indexOfItem(item);
                });

                // Remove selected rows from the flight data
                aSelectedIndices.sort().reverse().forEach(function (index) {
                    aFlights.splice(index, 1);
                });

                // Update the model
                oModel.setProperty("/results", aFlights);
                MessageToast.show("Row(s) deleted successfully.");
            } else {
                MessageToast.show("Please select a row to delete.");
            }
            oTable.removeSelections();
        },
        onDeleteRowVariant: function () {
            var oTable = this.getView().byId("CreateVariantTable");
            var oModel = this.getView().getModel("variantModel");
            var aFlights = oModel.getProperty("/results");

            // Get selected item
            var aSelectedItems = oTable.getSelectedItems();

            if (aSelectedItems.length > 0) {
                var aSelectedIndices = aSelectedItems.map(function (item) {
                    return oTable.indexOfItem(item);
                });

                // Remove selected rows from the flight data
                aSelectedIndices.sort().reverse().forEach(function (index) {
                    aFlights.splice(index, 1);
                });

                // Update the model
                oModel.setProperty("/results", aFlights);
                MessageToast.show("Row(s) deleted successfully.");
                oTable.removeSelections();
            } else {
                MessageToast.show("Please select a row to delete.");

            }
        },
        selectBranchVariant: function (oEvent) {
            var that = this;
            var userData = this.userData;
            var officeType = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().officeType;

            if (!this.variantData) {
                const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
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
                    else {
                        that._initializeTableVariant([]);
                    }
                }).catch((error) => {
                    that._initializeTableVariant([])
                });
            }
            else {
                that._initializeTableVariant(that.variantData[officeType]);
            }
        },
        _initializeTableVariant: function (aRows) {
            var that = this;
            that.getView().getModel("variantDataModel").setProperty("/results", aRows);
            that.getView().getModel("variantDataModel").refresh(true)

        },
        _prefillRowsVariant: function (aRows, columns) {
            var oTable = this.byId("VariantTable");
            var aCells;

            aRows.forEach(function (aRowData) {
                aCells = [];

                // Create cells for each column based on column type and prefill data
                columns.forEach(function (oColumnData) {
                    var oCellTemplate = this.createCellTemplateVariant(aRowData, oColumnData);
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
        createCellTemplateVariant: function (rowData, oColumnData) {
            return new Input({
                value: rowData[oColumnData.title] ? rowData[oColumnData.title] : "",
                editable: oColumnData.editable
            });

        },
        findGHGConversion: function (data1, data2) {
            var that = this;
            return data1.map(entry1 => {
                // Concatenate the necessary fields from Data 1
                // let concatenatedValue = Object.values(entry1).join("");

                // Find matching entry in Data 2 by comparing concatenatedValue to Lookup
                if (["Elec heat cooling"].indexOf(that.module) == -1) {
                    let matchedEntry = data2.find(entry2 => entry2.ID == entry1.Reference);
                    // delete entry1.Reference;
                    // If a match is found, return the GHG Conversion, else return null or "Not Found"
                    return {
                        ...entry1,  // Include original data from Data 1
                        Factor: matchedEntry ? matchedEntry['GHG Conversion'] : ''
                    };
                }
                else {
                    var returnData = {};
                    let matchedEntry = data2.find(entry2 => entry2.ID == entry1.Reference);
                    // delete entry1.Reference;
                    // If a match is found, return the GHG Conversion, else return null or "Not Found"
                    returnData = {
                        ...entry1,  // Include original data from Data 1
                        ["GEF Factors"]: matchedEntry ? matchedEntry['GHG Conversion'] : ''
                    };
                    let matchedEntry2 = data2.find(entry2 => entry2.ID == entry1["Reference 2"]);
                    // delete entry1["Reference 2"];
                    returnData["T&D Factors"] = matchedEntry2 ? matchedEntry2['GHG Conversion'] : ''
                    return returnData
                }

            });
        },
        onSubmit: function () {
            var that = this;
            var oTable = this.byId("flightTable");
            var data = oTable.getSelectedItems();
            var selectData = [];
            if (data.length > 0) {

                data.map(val => {
                    selectData.push(val.getBindingContext("dataModel").getObject());
                })
            }
            else {
                MessageToast.show("No Values selected");
                return;
            }
            var monthYear = this.getView().getModel("masterModel").getProperty("/currentReportingCycle");
            var branch = this.getView().getModel("masterModel").getProperty("/EmployeeBranch");
            if (!branch) {
                MessageBox.warning("Kindly select branch");
                return;
            }
            console.log(selectData);
            var aFilteredData = []
            selectData.map(val => {
                if (val.co2e) {
                    aFilteredData.push(val)
                }
            });
            if (aFilteredData.length !== selectData.length) {
                MessageBox.confirm(
                    "Columns with empty Amount would be ignored. Do you still want to proceed?", {
                    title: "Confirmation",
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            var user = that.userData;
                            firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module).set({
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
                firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module).set({
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
            var oTable = this.byId("flightTable");
            var aData = that.getView().getModel("dataModel").getData().results;
            if (!branch) {
                MessageBox.warning("Kindly select branch");
                return;
            }
            MessageBox.confirm(
                "Are you sure you want to Submit?", {
                title: "Submit Confirmation",
                onClose: function (oAction) {
                    if (oAction === "OK") {
                        var monthYear = that.getView().getModel("masterModel").getProperty("/currentReportingCycle");

                        console.log(aData);
                        var aFilteredData = []
                        aData.map(val => {
                            if (val.co2e) {
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
                                        firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module).set({
                                            [branch]: {
                                                data: aFilteredData,
                                                status: "Submitted",
                                                updatedAt: new Date(),
                                                updatedBy: user.userId,
                                                dataType: that.custom ? "Custom" : "Variant"
                                            }

                                        }, { merge: true })
                                            .then(() => {
                                                firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Statistics").set({
                                                    [branch]: {
                                                        [that.tile]: firebase.firestore.FieldValue.arrayUnion(that.module)
                                                    }

                                                }, { merge: true })
                                                    .then(() => {
                                                        // MessageBox.success("Data successfully saved as draft!");

                                                    })
                                                    .catch((error) => {
                                                        // MessageBox.error("Error writing document: " + error);
                                                    });
                                                MessageBox.success("Data successfully submitted for reporting");


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
                            firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module).set({
                                [branch]: {
                                    data: aFilteredData,
                                    status: "Submitted",
                                    updatedAt: new Date(),
                                    updatedBy: user.userId,
                                    dataType: that.custom ? "Custom" : "Variant"
                                }

                            }, { merge: true })
                                .then(() => {
                                    firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Statistics").set({
                                        [branch]: {
                                            [that.tile]: firebase.firestore.FieldValue.arrayUnion(that.module)
                                        }

                                    }, { merge: true })
                                        .then(() => {
                                            // MessageBox.success("Data successfully saved as draft!");

                                        })
                                        .catch((error) => {
                                            // MessageBox.error("Error writing document: " + error);
                                        });
                                    MessageBox.success("Data successfully submitted for reporting");


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
        createVariantMaster: function () {
            var that = this;
            var conData = "";
            const docRef = firebase.firestore().collection("Master Data").doc("Factors");
            docRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("Document data:", doc.data());
                    var oData = that.getVariantData(that.module);
                    conData = that.findGHGConversion(oData, doc.data().factor);
                    // Create JSONModel and set the data
                    that.structData = conData;
                    var oModel = new JSONModel({ results: conData });
                    that.getView().setModel(oModel, "variantMaster");

                    // Get table reference
                    var oTable = that.byId("CreateVariantTable");
                    oTable.removeAllColumns();
                    oTable.removeAllItems();
                    // Dynamically create columns based on JSON keys
                    var oFirstRow = conData[0]; // Assuming all rows have the same structure
                    var aKeys = this.getColumns(that.module);
                    // aKeys.push("Factor");
                    aKeys.forEach(function (sKey) {
                        oTable.addColumn(new sap.m.Column({
                            header: new sap.m.Text({ text: sKey.title })
                        }));
                    });

                    // Create template for the table rows (items)
                    var oTemplate = new sap.m.ColumnListItem({
                        cells: aKeys.map(function (sKey) {
                            return new Input({
                                value: "{variantMaster>" + sKey.title + "}",
                                editable: sKey.editable

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
                    selectData.push(val.getBindingContext("variantModel").getObject());
                })
            }
            else {
                MessageToast.show("No Values selected");
                return;
            }
            var user = this.userData;
            firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).get()
                .then((data) => {
                    if (data.exists && data.data()[branch]) {
                        firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).update({
                            [branch]: firebase.firestore.FieldValue.arrayUnion(...selectData)
                        })
                            .then(() => {
                                MessageBox.success("Variant successfully saved!");
                                if (that.variantData) {
                                    that.variantData[branch] = [...data.data()[branch], ...selectData];
                                }
                                else {
                                    that.variantData = { [branch]: [...data.data()[branch], ...selectData] }
                                }
                                that.getView().getModel("variantDataModel").setProperty("/results", [...data.data()[branch], ...selectData]);
                                that.getView().getModel("variantDataModel").refresh(true)

                            })
                            .catch((error) => {
                                MessageBox.error("Error writing document: " + error);
                            });
                    }
                    else {
                        firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).set({
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
                                that.getView().getModel("variantDataModel").setProperty("/results", selectData);
                                that.getView().getModel("variantDataModel").refresh(true)

                            })
                            .catch((error) => {
                                MessageBox.error("Error writing document: " + error);
                            });
                    }
                })
                .catch((error) => {
                    MessageBox.error("Error writing document: " + error);
                });

        },
        onDeleteVariant: function () {
            var that = this;
            var branch = this.byId("variantBranch").getSelectedItem().getBindingContext("masterModel").getObject().officeType;
            var oTable = this.byId("VariantTable");
            var aSelectedItems = oTable.getSelectedItems();
            var oModel = this.getView().getModel("variantDataModel");
            var aFlights = oModel.getProperty("/results");
            if (aSelectedItems.length > 0) {
                var aSelectedIndices = aSelectedItems.map(function (item) {
                    return oTable.indexOfItem(item);
                });

                // Remove selected rows from the flight data
                aSelectedIndices.sort().reverse().forEach(function (index) {
                    aFlights.splice(index, 1);
                });

                // Update the model

                MessageBox.confirm(`Are you sure you want to delete these data for office ${branch}`, {
                    onClose: function (oAction) {
                        if (oAction === "OK") {

                            var user = that.userData;
                            firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).update({
                                [branch]: aFlights
                            })
                                .then(() => {
                                    oModel.setProperty("/results", aFlights);
                                    MessageBox.success("Variant successfully deleted!");
                                    that.variantData[branch] = aFlights

                                })
                                .catch((error) => {
                                    MessageBox.error("Error writing document: " + error);
                                });
                        }
                    }
                })
            } else {
                MessageBox.confirm(`Are you sure you want to delete variant for office ${branch}`, {
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            oModel.setProperty("/results", aFlights);
                            var user = that.userData;
                            firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).update({
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
        createModuleTable: function () {
            var that = this;
            this.custom = true;
            that.getView().getModel("dataModel").setProperty("/results", []);
            that.getView().getModel("dataModel").setProperty("/editable", true);
            that.getView().getModel("dataModel").refresh(true)

        },
    });
});
