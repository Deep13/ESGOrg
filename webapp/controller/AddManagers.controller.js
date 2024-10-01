sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageToast", "sap/m/MessageBox",
        "sap/m/Dialog",
        "sap/m/Button",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/ComboBox",
        "sap/m/MultiComboBox"],
    function (Controller, JSONModel, MessageToast, MessageBox, Dialog, Button, Label, Input, ComboBox, MultiComboBox) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.AddManagers", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.AddManagers
             */

            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("AddManagers")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    firebase.firestore().collection(user.domain).doc("Master Data").collection("Employees").get().then(snapShot => {
                        var employees = [];
                        snapShot.docs.map(doc => {
                            employees.push(doc.data());
                        });
                        var employeeModel = new JSONModel({ employees: employees });
                        that.getView().setModel(employeeModel, "employeeModel");
                    }).catch((error) => {

                    });;



                    // Static JSON data for branches
                    var branchData = {
                        branches: that.getMaster().branches
                    };

                    // Create models for employees and branches

                    var branchModel = new JSONModel(branchData);

                    // Set the models to the view

                    that.getView().setModel(branchModel, "branchModel");
                });
            },
            onAddEmployee: function () {
                var oView = this.getView();
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(oView.getId(), "ESGOrg.ESGOrg.fragments.EmployeeForm", this);
                    oView.addDependent(this._oDialog);
                }
                this._oDialog.open();
            },

            onEditEmployee: function (oEvent) {
                var oView = this.getView();
                var oSelectedItem = oEvent.getSource().getBindingContext("employeeModel").getObject();
                var oSelectedIndex = oEvent.getSource().getBindingContext("employeeModel").getPath();

                // Store the selected employee object in the controller to update it later
                this._oEditingEmployee = oSelectedIndex;

                // Open the dialog
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment(oView.getId(), "ESGOrg.ESGOrg.fragments.EmployeeForm", this);
                    oView.addDependent(this._oDialog);
                }

                // Pre-fill the dialog with the selected employee data
                oView.byId("nameInput").setValue(oSelectedItem.name);
                oView.byId("emailInput").setValue(oSelectedItem.email);
                oView.byId("contactInput").setValue(oSelectedItem.phone);
                oView.byId("roleInput").setSelectedKey(oSelectedItem.role);
                oView.byId("branchInput").setSelectedKeys(this.branchText(oSelectedItem.branches)?.split(", "));

                // Open the dialog in "Edit Mode"
                this._oDialog.open();
            },

            onDeleteEmployee: function (oEvent) {
                var oListItem = oEvent.getSource().getParent(); // Get the parent of the button (the list item)
                var oContext = oListItem.getBindingContext("employeeModel"); // Get the binding context of the item
                var oEmployee = oContext.getObject(); // Get the employee object from the context

                // Show confirmation dialog before deleting
                MessageBox.confirm(
                    "Are you sure you want to delete employee " + oEmployee.Name + "?", {
                    title: "Delete Confirmation",
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            // User confirmed, proceed with delete
                            var oModel = oContext.getModel(); // Get the model bound to the table
                            var aEmployees = oModel.getData().employees; // Get the array of employees

                            // Find the index of the employee in the array
                            var iIndex = aEmployees.indexOf(oEmployee);

                            // Remove the employee from the array
                            if (iIndex !== -1) {
                                aEmployees.splice(iIndex, 1);
                                oModel.refresh(); // Refresh the model to update the table UI
                                sap.m.MessageToast.show("Employee deleted successfully!");
                            }
                        }
                    }
                }
                );
            },


            onSaveEmployee: function () {
                var oView = this.getView();

                // Retrieve values from the fragment inputs
                var sName = oView.byId("nameInput").getValue();
                var sEmail = oView.byId("emailInput").getValue();
                var sContact = oView.byId("contactInput").getValue();
                var sRole = oView.byId("roleInput").getSelectedKey();
                var aBranch = oView.byId("branchInput").getSelectedItems();
                var aSelectedBranch = [];
                aBranch.map(val => {
                    aSelectedBranch.push(val.getBindingContext("branchModel").getObject());
                })
                // Validation checks for empty fields (optional)
                if (!sName || !sEmail || !sRole || !aBranch) {
                    sap.m.MessageToast.show("Please fill in all required fields.");
                    return;
                }
                var oModel = this.getView().getModel("employeeModel");
                var aEmployees = oModel.getData().employees;
                var employeeData = null;

                // Check if an existing employee is being edited
                if (this._oEditingEmployee) {
                    var selectedEmployee = oModel.getProperty(this._oEditingEmployee);
                    // Update the existing employee with the new values
                    selectedEmployee.name = sName;
                    selectedEmployee.email = sEmail;
                    selectedEmployee.phone = sContact;
                    selectedEmployee.role = sRole;
                    selectedEmployee.branches = aSelectedBranch;
                    oModel.setProperty(this._oEditingEmployee, selectedEmployee)
                    // Reset the editing flag
                    this._oEditingEmployee = null;
                    employeeData = selectedEmployee;
                    sap.m.MessageToast.show("Employee updated successfully!");
                } else {
                    // Create a new employee object and add it to the model
                    var oNewEmployee = {
                        "name": sName,
                        "userId": "N1M9EMNyvHRaB16wbYNBJ10LpQn2",
                        "role": sRole,
                        "domain": "ey.esgkosh",
                        "branches": aSelectedBranch,
                        "username": "saquib.siddiqui@ey.esgkosh",
                        "phone": sContact,
                        "email": sEmail
                    };

                    // Get the employee model and add the new employee

                    aEmployees.push(oNewEmployee);
                    // Refresh the model to update the UI
                    employeeData = oNewEmployee;

                    sap.m.MessageToast.show("Employee added successfully!");
                }
                var user = this.getUser();
                firebase.firestore().collection(user.domain).doc("Master Data").collection("Employees").doc(user.userId).set(employeeData)
                    .then(() => {

                        MessageBox.success("User saved successfully.");

                    })
                    .catch((error) => {
                        MessageBox.error("Error writing document: " + error);
                    });
                oModel.refresh();
                // Close the dialog
                this._oDialog.close();
            },

            branchText: function (branch) {
                if (branch && branch.length > 0) {
                    var branchText = [];
                    branch.map(val => {
                        branchText.push(val.branch)
                    })
                    return branchText.join(", ");
                }
                else {
                    return branch
                }
            },
            onCancelEmployee: function () {
                this._oDialog.close();
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