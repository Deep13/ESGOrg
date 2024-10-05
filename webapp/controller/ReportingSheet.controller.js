sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/Column",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/MessageBox"],
    function (Controller, JSONModel, Column, Label, Input, MessageBox) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.ReportingSheet", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.FuelBioRef
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("ReportingSheet")
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
                    that.byId("status").setText("");
                    that.byId("title").setText(that.module);
                    var oModel = new JSONModel({ results: [] });
                    this.getView().setModel(oModel, "moduleMaster");
                    var oModel = new sap.ui.model.json.JSONModel({
                        isEditable: true // Prefill with backend data or start empty
                    });
                    oModel.setSizeLimit(20000);
                    this.getView().setModel(oModel, "editableModel");
                    var uniqueOfficeTypes = [...new Set(user.branches.map(item => item.officeType))];

                    // Convert unique officeType values to the desired format
                    var formattedOfficeTypes = uniqueOfficeTypes.map(type => ({ officeType: type }));
                    var masterModel = { ...that.getMaster(), EmployeeBranches: user.branches, EmployeeOffices: formattedOfficeTypes };

                    var oModel = new sap.ui.model.json.JSONModel(masterModel);
                    oModel.setSizeLimit(20000);
                    this.getView().setModel(oModel, "masterModel");
                    if (user.role === "Admin") {
                        that.getView().byId("adminVariant").setVisible(true);
                        if (masterModel.currentReportingCycle.status) {
                            that.getView().byId("adminVariantCreate").setVisible(false);
                        }
                        else {
                            that.getView().byId("adminVariantCreate").setVisible(true);
                            that._initializeTableVariant([]);
                            that.createVariantMaster();
                        }
                    }
                    else {
                        that.getView().byId("adminVariantCreate").setVisible(false);
                        that.getView().byId("adminVariant").setVisible(false);
                    }
                });

            },
            onItemSelect: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
                this.byId("dataBranch").setSelectedKey("");
                this.byId("variantBranch").setSelectedKey("");
                this.byId("selectedOffice").setSelectedKey("");
                this.byId("status").setText("");
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                oTable = this.byId("VariantTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
            },
            selectBranch: function (oEvent) {
                var that = this;
                var userData = this.userData;
                var monthYear = this.getView().getModel("masterModel").getProperty("/currentReportingCycle");
                var officeType = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().officeType;
                var branch = oEvent.getParameter("selectedItem").getBindingContext("masterModel").getObject().branch;
                that.byId("status").setText("");
                if (this.moduleData) {
                    if (this.moduleData[branch]) {
                        if (this.moduleData[branch].dataType == "Variant") {
                            if (this.moduleData[branch].status == "Submitted") {
                                that.byId("status").setText("Submitted");
                                that._initializeTable(that.moduleData[branch].data, false);
                            }
                            else {

                                that._initializeTable(that.moduleData[branch].data, true);
                            }
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
                            const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
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
                                else {
                                    this.variantData = undefined;
                                    that.createModuleTable();
                                }
                            }).catch((error) => {
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
                                    if (this.moduleData[branch].status == "Submitted") {
                                        that.byId("status").setText("Submitted");
                                        that._initializeTable(that.moduleData[branch].data, false);
                                    }
                                    else {

                                        that._initializeTable(that.moduleData[branch].data, true);
                                    }

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
                                    const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
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
                                        else {
                                            this.variantData = undefined;
                                            that.createModuleTable();
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
                                const docRef = firebase.firestore().collection(userData.domain).doc("Master Data").collection("Reporting Variant").doc(that.module);
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
                                    else {
                                        this.variantData = undefined;
                                        that.createModuleTable();
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
                var that = this;
                this.custom = true;
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                oTable.unbindItems();
                // Get table reference
                // this.getView().getModel("moduleMaster").setProperty("/results", this.structData);
                this.getView().getModel("moduleMaster").setData({ results: this.structData });
                // Dynamically create columns based on JSON keys
                var aKeys = this.getColumns(that.module);
                aKeys.forEach(function (sKey) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Text({ text: sKey.title })
                    }));
                });

                // Create template for the table rows (items)
                var oTemplate = new sap.m.ColumnListItem({
                    cells: aKeys.map(function (sKey) {
                        if (sKey.editable) {
                            return new Input({
                                value: "{moduleMaster>" + sKey.title + "}",

                            });
                        }
                        return new sap.m.Text({
                            text: "{moduleMaster>" + sKey.title + "}" // Bind each column to the corresponding key
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
            _initializeTable: function (aRows, status) {
                var that = this;
                this.custom = false;
                var oTable = this.byId("editableTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                // Dynamically create columns based on aColumns array
                var columns = this.getColumns(that.module);
                columns.forEach(function (column) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Label({ text: column.title })
                    }));
                }, this);

                if (aRows && aRows.length > 0) {
                    // this._prefillRows(aRows, columns);
                    this.createCellTemplate(columns, status);
                    var oModel = new sap.ui.model.json.JSONModel({
                        results: aRows  // Prefill with backend data or start empty
                    });
                    oModel.setSizeLimit(20000);
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
                var aKeys = this.getColumns(this.module);
                aKeys.forEach(function (sKey) {
                    oTable.addColumn(new sap.m.Column({
                        header: new sap.m.Text({ text: sKey.title })
                    }));
                });

                // Create template for the table rows (items)
                var oTemplate = new sap.m.ColumnListItem({
                    cells: aKeys.map(function (sKey) {
                        if (sKey.editable) {
                            return new Input({
                                value: "{moduleMaster>" + sKey.title + "}",

                            });
                        }
                        return new sap.m.Text({
                            text: "{moduleMaster>" + sKey.title + "}" // Bind each column to the corresponding key
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
                var user = that.userData;
                firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc(that.module).set({
                    [branch]: {
                        data: aData,
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

            },
            onSave: function () {
                var that = this;
                // Show confirmation dialog before deleting
                var branch = that.getView().getModel("masterModel").getProperty("/EmployeeBranch");
                if (!branch) {
                    MessageBox.warning("Kindly select branch");
                    return;
                }
                var columns = that.getColumns(that.module);
                var checkCol = [];
                columns.map(val => {
                    if (val.editable) {
                        checkCol.push(val.title)
                    }
                })
                MessageBox.confirm(
                    "Are you sure you want to Submit?", {
                    title: "Submit Confirmation",
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            var aData = that.getView().getModel("moduleMaster").getData().results;
                            var monthYear = that.getView().getModel("masterModel").getProperty("/currentReportingCycle");

                            console.log(aData);
                            var aFilteredData = [];
                            aFilteredData = aData.filter(row => {
                                return checkCol.every(key => row[key] && row[key] !== '');
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
                                                    dataType: "Variant"
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
                                        dataType: "Variant"
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
            createCellTemplate: function (columns, status) {
                var acolumns = [];
                columns.map(val => {
                    if (status) {
                        acolumns.push(new Input({
                            value: "{moduleMaster>" + val.title + "}",
                            editable: false
                        }))
                    }
                    else {
                        if (val.editable) {
                            acolumns.push(new Input({
                                value: "{moduleMaster>" + val.title + "}",
                                editable: true
                            }))
                        }
                        else {
                            acolumns.push(new Input({
                                value: "{moduleMaster>" + val.title + "}",
                                editable: false
                            }))
                        }
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
            createCellTemplateVariant: function (rowData, oColumnData) {
                return new Input({
                    value: rowData[oColumnData.title] ? rowData[oColumnData.title] : "",
                    editable: oColumnData.editable
                });

            },
            _initializeTableVariant: function (aRows) {
                var that = this;
                var oTable = this.byId("VariantTable");
                oTable.removeAllColumns();
                oTable.removeAllItems();
                var columns = this.getColumns(that.module);
                // Dynamically create columns based on aColumns array
                columns.forEach(function (column) {
                    oTable.addColumn(new Column({
                        header: new Label({ text: column.title })
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

                                })
                                .catch((error) => {
                                    MessageBox.error("Error writing document: " + error);
                                });
                        }
                    })
                    .catch((error) => {
                        MessageBox.error("Error writing document: " + error);
                    });
                // firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).set({
                //     [branch]: selectData
                // }, { merge: true })
                //     .then(() => {
                //         MessageBox.success("Variant successfully saved!");
                //         if (that.variantData) {
                //             that.variantData[branch] = selectData;
                //         }
                //         else {
                //             that.variantData = { [branch]: selectData }
                //         }

                //     })
                //     .catch((error) => {
                //         MessageBox.error("Error writing document: " + error);
                //     });
            },
            onDeleteVariant: function () {
                var that = this;
                var branch = this.byId("variantBranch").getSelectedItem().getBindingContext("masterModel").getObject().officeType;
                var oTable = this.byId("VariantTable");
                var aSelectedItems = oTable.getSelectedItems();
                var oModel = this.getView().getModel("variantDataModel");

                if (aSelectedItems.length > 0) {
                    var aSelectedIndices = aSelectedItems.map(function (item) {
                        return oTable.indexOfItem(item);
                    });
                    aSelectedItems.map(function (item) {
                        oTable.removeItem(item)
                    });
                    // Remove selected rows from the flight data


                    // Update the model

                    MessageBox.confirm(`Are you sure you want to delete these data for office ${branch}`, {
                        onClose: function (oAction) {
                            if (oAction === "OK") {

                                var user = that.userData;
                                firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).update({
                                    [branch]: that.variantData[branch]
                                })
                                    .then(() => {
                                        aSelectedIndices.sort().reverse().forEach(function (index) {
                                            that.variantData[branch].splice(index, 1);
                                        });
                                        MessageBox.success("Variant successfully deleted!");

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
            // onDeleteVariant: function () {
            //     var that = this;
            //     var branch = this.byId("variantBranch").getSelectedItem().getBindingContext("masterModel").getObject().officeType;
            //     if (that.variantData[branch] && that.variantData[branch].length > 0) {
            //         MessageBox.confirm(`Are you sure you want to delete variant for office ${branch}`, {
            //             onClose: function (oAction) {
            //                 if (oAction === "OK") {
            //                     var user = that.userData;
            //                     firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Variant").doc(that.module).update({
            //                         [branch]: firebase.firestore.FieldValue.delete()
            //                     })
            //                         .then(() => {
            //                             MessageBox.success("Variant successfully deleted!");
            //                             delete (that.variantData[branch]);
            //                             var oTable = that.byId("VariantTable");
            //                             oTable.removeAllColumns();
            //                             oTable.removeAllItems();

            //                         })
            //                         .catch((error) => {
            //                             MessageBox.error("Error writing document: " + error);
            //                         });
            //                 }
            //             }
            //         })
            //     }
            // },
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
            findGHGConversion: function (data1, data2) {
                var that = this;
                return data1.map(entry1 => {
                    // Concatenate the necessary fields from Data 1
                    // let concatenatedValue = Object.values(entry1).join("");

                    // Find matching entry in Data 2 by comparing concatenatedValue to Lookup
                    if (entry1.Reference) {
                        if (that.module == "Food") {
                            return entry1;
                        }
                        else if (["Elec heat cooling"].indexOf(that.module) == -1) {
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
                    }
                    else {
                        return entry1;
                    }

                });
            },
            updateStructWithIncoming: function (data, incoming) {
                var struct = JSON.parse(JSON.stringify(data));
                // Loop through each element in struct
                struct.forEach(structItem => {
                    // Find matching entry in incoming based on multiple fields
                    let matchedIncoming = incoming.find(incomingItem =>
                        incomingItem.Reference == structItem.Reference);

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
                        oModel.setSizeLimit(20000);
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


            }
        });
    });