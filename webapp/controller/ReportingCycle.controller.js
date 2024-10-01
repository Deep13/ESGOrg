sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/MessageToast", 'sap/ui/core/Fragment'],
    function (Controller, JSONModel, MessageBox, MessageToast, Fragment) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.ReportingCycle", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.ReportingCycle
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("ReportingCycle")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    sap.ui.core.BusyIndicator.show();
                    that.updateCycle();
                    firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").get().then(snapShot => {
                        var cycle = [];
                        snapShot.docs.map(doc => {
                            cycle.push(doc.data());
                        });
                        var cycleModel = new JSONModel({ results: cycle });
                        that.getView().setModel(cycleModel);
                        sap.ui.core.BusyIndicator.hide();
                    });
                });
            },
            updateCycle: function () {
                var that = this;
                var reportingCycle = this.MasterData.currentReportingCycle;
                if (reportingCycle.status) {
                    that.byId("lastCycle").setText(`Reporting Cycle in Progress:${reportingCycle.month}/${reportingCycle.year}`);
                    that.byId("lastCycle").setState("Success");
                }
                else {
                    that.byId("lastCycle").setText(`Last Reporting Cycle:${reportingCycle.month}/${reportingCycle.year}`);
                    that.byId("lastCycle").setState("None");
                }
            },
            dateText: function (date) {
                if (date) {
                    return date.toDate().toLocaleDateString();
                }
                return date;
            },
            onPressCycle: function () {
                var that = this;
                var user = this.userData;
                const docRef = firebase.firestore().collection(user.domain).doc("Master Data");
                docRef.get().then((doc) => {
                    if (doc.exists) {
                        console.log("Document data:", doc.data());
                        const data = doc.data();
                        that.MasterData.currentReportingCycle = data.currentReportingCycle;
                        that.updateCycle();
                        if (data.currentReportingCycle?.status) {
                            MessageBox.confirm(`Reporting Cycle for ${data.currentReportingCycle.month}/${data.currentReportingCycle.year} is in progress. Do you want to close this?`, {
                                onClose: function (oAction) {
                                    if (oAction === "OK") {
                                        var closedData = { ...data.currentReportingCycle }
                                        closedData.status = false;
                                        closedData.closedAt = new Date();
                                        closedData.progress = "100%";
                                        firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").doc(closedData.month + "-" + closedData.year).set(closedData, { merge: true })
                                            .then(() => {
                                                that.MasterData.currentReportingCycle.status = false;
                                                that.updateCycle();
                                            })
                                            .catch((error) => {
                                                MessageBox.error("Error writing document: " + error);
                                            });
                                        firebase.firestore().collection(user.domain).doc("Master Data").set({
                                            currentReportingCycle: {
                                                status: false
                                            }
                                        }, { merge: true })
                                            .then(() => {
                                                MessageBox.success(`Reporting Cycle for ${data.currentReportingCycle.month}/${data.currentReportingCycle.year} is closed.`);

                                            })
                                            .catch((error) => {
                                                MessageBox.error("Error writing document: " + error);
                                            });
                                    }
                                }
                            })
                        }
                        else {
                            if (!that._oDialog) {
                                that._oDialog = that.byId("monthYearDialog");
                            }
                            var date = new Date().toLocaleDateString().split("/");
                            that.byId("yearInput").setValue(date[2])
                            that.byId("monthSelect").setSelectedKey(date[1])
                            that._oDialog.open();
                        }
                    } else {
                    }
                }).catch((error) => {
                });
            },
            onDialogConfirm: function () {
                var that = this;
                var user = this.userData;
                var oMonthSelect = this.byId("monthSelect");
                var oYearInput = this.byId("yearInput");

                var sSelectedMonth = oMonthSelect.getSelectedItem().getKey();
                var sYear = oYearInput.getValue();

                if (sYear && sSelectedMonth) {

                    firebase.firestore().collection(user.domain).doc("Master Data").set({
                        currentReportingCycle: {
                            month: sSelectedMonth,
                            year: sYear,
                            status: true,
                            startedAt: new Date()
                        }
                    }, { merge: true })
                        .then(() => {
                            that.MasterData.currentReportingCycle = {
                                month: sSelectedMonth,
                                year: sYear,
                                status: true,
                                startedAt: new Date()
                            };
                            that.updateCycle();
                            MessageBox.success(`Reporting Cycle for ${sSelectedMonth}/${sYear} is initiated.`);
                            this._oDialog.close();
                        })
                        .catch((error) => {
                            MessageBox.error("Error writing document: " + error);
                        });

                } else {
                    MessageToast.show("Please enter both month and year.");
                }
            },

            onDialogCancel: function () {
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