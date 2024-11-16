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
                    // sap.ui.core.BusyIndicator.show();
                    that.updateCycle();
                    firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").doc("All Cycle").get().then(doc => {
                        var cycle = [];
                        if (doc.exists) {

                            Object.keys(doc.data()).map(val => {
                                cycle.push(doc.data()[val]);
                            });
                        }
                        else {

                        }

                        var cycleModel = new JSONModel({ results: cycle });
                        that.getView().setModel(cycleModel);
                        sap.ui.core.BusyIndicator.hide();
                    });

                });
            },
            updateCycle: function () {
                var that = this;

                var reportingCycle = this.MasterData.currentReportingCycle;
                if (reportingCycle) {
                    if (reportingCycle.status) {
                        that.byId("lastCycle").setText(`Reporting Cycle in Progress:${reportingCycle.month}/${reportingCycle.year}`);
                        that.byId("lastCycle").setState("Success");
                    }
                    else {
                        that.byId("lastCycle").setText(`Last Reporting Cycle:${reportingCycle.month}/${reportingCycle.year}`);
                        that.byId("lastCycle").setState("None");
                    }
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
                            MessageBox.confirm(`Reporting Cycle for ${data.currentReportingCycle.month}/${data.currentReportingCycle.year} is in progress. Do you want to submit and close this?`, {
                                onClose: function (oAction) {
                                    if (oAction === "OK") {
                                        var closedData = { ...data.currentReportingCycle }
                                        closedData.status = false;
                                        closedData.closedAt = new Date();
                                        closedData.progress = "100%";
                                        firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").doc("All Cycle").set({ [closedData.month + "-" + closedData.year]: closedData }, { merge: true })
                                            .then(() => {
                                                that.MasterData.currentReportingCycle.status = false;
                                                that.updateCycle();
                                                that.updateAnalytics(closedData);
                                            })
                                            .catch((error) => {
                                                MessageBox.error("Error writing document: " + error);
                                            });
                                        firebase.firestore().collection(user.domain).doc("Master Data").set({
                                            currentReportingCycle: {
                                                status: false,
                                                closedAt: new Date()
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
            updateAnalytics: async function (closedData) {
                var that = this;
                var user = this.userData;
                var data = await that.getSheets(user);
                const docRef = firebase.firestore().collection(user.domain).doc("TransactionData").collection(closedData.month + "-" + closedData.year);
                docRef.get().then((snapShot) => {
                    var rData = [];
                    snapShot.docs.map(doc => {
                        rData.push({ [doc.id]: doc.data() })

                    });
                    var restructred = that.groupSubmittedModulesByBranch(rData, data);
                    firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").doc(closedData.month + "-" + closedData.year).set({ "data": restructred })
                        .then(() => {
                            // MessageBox.success("Incident Report sent");
                            sap.ui.core.BusyIndicator.hide();
                            that._oPopover.destroy();
                        })
                        .catch((error) => {
                            sap.ui.core.BusyIndicator.hide();

                            // MessageBox.error("Error writing document: " + error);
                        });

                });

            },
            getModuleCategory: function (moduleName, moduleCategories) {
                if (moduleCategories.Environment.includes(moduleName)) {
                    return "Environment";
                } else if (moduleCategories.Social.includes(moduleName)) {
                    return "Social";
                } else if (moduleCategories.Governance.includes(moduleName)) {
                    return "Governance";
                }
                return "Unknown"; // Fallback if the module doesn't match any category
            },

            // Function to calculate emissions for each environment-related module
            calculateEmissions: function (moduleName, moduleData) {
                let totalEmissions = 0;

                switch (moduleName) {
                    case "Fuel":
                    case "Bioenergy":
                    case "Refrigerant and other":
                    case "WTT- fuels":
                    case "Food":
                    case "Water":
                        // For these modules, use Amount x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item.Amount ? item.Amount : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;
                    case "Accommodation":
                        // For these modules, use Amount x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item["Number of occupied rooms"] ? item["Number of occupied rooms"] : 0) * parseFloat(item["Number of nights per room"] ? item["Number of nights per room"] : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;

                    case "Materials":
                        // For these modules, use Total distance x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item["Amount (tonnes)"] ? item["Amount (tonnes)"] : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;
                    case "Elec heat cooling":
                        // For Elec Heat Cooling, use Amount x GEF Factors + Amount x T&D Factors
                        moduleData.data.forEach(item => {
                            totalEmissions += (parseFloat(item.Amount ? item.Amount : 0) * (parseFloat(item["GEF Factors"] ? item["GEF Factors"] : 0)) + (parseFloat(item.Amount ? item.Amount : 0) * parseFloat(item["T&D Factors"] ? item["T&D Factors"] : 0)));
                        });
                        break;

                    case "Owned Vehicles":
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item["Distance (km)"] ? item["Distance (km)"] : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;

                    case "Freighting goods":
                        // For these modules, use Amount x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item["Weight (tonnes)"] ? item["Weight (tonnes)"] : 0) * parseFloat(item["Distance (km)"] ? item["Distance (km)"] : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;
                    case "Employees commuting":
                    case "Business travel - land and sea":
                        // For these modules, use Total distance x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item["Total distance"] ? item["Total distance"] : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;

                    case "Waste Disposal":
                        // For Waste Disposal, use Weight x Factor
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item.Weight ? item.Weight : 0) * parseFloat(item.Factor ? item.Factor : 0);
                        });
                        break;

                    case "Flight":
                        // For Flight, use kg CO2e
                        moduleData.data.forEach(item => {
                            totalEmissions += parseFloat(item.co2e ? item.co2e : 0);
                        });
                        break;
                    case "Home Office":
                        // For Flight, use kg CO2e
                        moduleData.data.forEach(item => {
                            totalEmissions += (parseFloat(item["Working regime (For full-time)"] ? item["Working regime (For full-time)"] : 0) * parseFloat(item["Number of months"] ? item["Number of months"] : 0) * parseFloat(item["Factor"] ? item["Factor"] : 0)) + ((parseFloat(item["Working from home"] ? item["Working from home"] : 0) / 2) * parseFloat(item["Number of months"] ? item["Number of months"] : 0) * parseFloat(item["Factor"] ? item["Factor"] : 0));
                        });
                        break;

                    default:
                        break;
                }

                return totalEmissions;
            },
            calculateFemaleToMaleRatio: function (femaleCount, maleCount) {
                // Check if maleCount is 0 to avoid division by zero
                if (maleCount === 0) {
                    return 0;
                }

                // Calculate the ratio
                const ratio = femaleCount / maleCount;

                // Return the ratio if it's greater than 0, otherwise return 0
                return ratio > 0 ? ratio : 0;
            },

            // Function to group data branch-wise, filter by "Submitted" status, and calculate emissions
            groupSubmittedModulesByBranch: function (data, moduleCategories) {
                let branchWiseData = {};
                var that = this;
                const scopeData = {
                    "Fuel": "Scope 1",
                    "Bioenergy": "Scope 1",
                    "Refrigerant and other": "Scope 1",
                    "Elec heat cooling": "Scope 2",
                    "Owned Vehicles": "Scope 1",
                    "Materials": "Scope 3",
                    "WTT- fuels": "Scope 3",
                    "Waste Disposal": "Scope 3",
                    "Flight": "Scope 3",
                    "Business travel - land and sea": "Scope 3",
                    "Freighting goods": "Scope 3",
                    "Employees commuting": "Scope 3",
                    "Water": "Scope 3",
                    "Accommodation": "Scope 3",
                    "Food": "Scope 3",
                    "Home Office": "Scope 3"
                };
                // Iterate over each module in the data
                data.forEach(moduleData => {
                    // Get module name (the key of the first object inside the module data)
                    const moduleName = Object.keys(moduleData)[0];
                    const moduleCategory = this.getModuleCategory(moduleName, moduleCategories); // Get module category (Environment, Social, Governance)
                    const branches = moduleData[moduleName];

                    // Iterate over each branch in the module
                    Object.keys(branches).forEach(branch => {
                        const branchData = branches[branch];

                        // Only add modules that have the status "Submitted"
                        if (branchData.status === "Submitted") {
                            // If the branch does not exist in the result, initialize it
                            if (!branchWiseData[branch]) {
                                branchWiseData[branch] = {
                                    modules: {},
                                    Overview: {
                                        TotalEmissions: 0,
                                        Water: 0,
                                        Waste: 0,
                                        Biodiversity: 0,   // Initialize Biodiversity
                                        Beneficiaries: 0,  // Initialize Beneficiaries
                                        GenderSplit: 0,     // Initialize GenderSplit
                                        SocialSpend: 0,
                                        AgeCount: {
                                            "50+": 0,        // Initialize age group counts
                                            "35 to 50": 0,
                                            "22 to 35": 0,
                                            "Less than 22": 0
                                        },      // Initialize AgeCount
                                        GenderCount: { "Male": 0, "Female": 0, "Others": 0 },
                                        Scope: {           // Initialize Scope totals
                                            "Scope 1": 0,
                                            "Scope 2": 0,
                                            "Scope 3": 0
                                        }
                                    },
                                    Environment: {
                                        "Overview": {
                                            TotalEmissions: 0,
                                            "Scope 1": 0,
                                            "Scope 2": 0,
                                            "Scope 3": 0,
                                            Water: 0,
                                            "Water Stress": 0,
                                            Waste: 0,
                                            Scope: {
                                                "Scope 1": 0,
                                                "Scope 2": 0,
                                                "Scope 3": 0
                                            }
                                        },        // Add new Environment key in the branch
                                        "Scope 1": {
                                            "Scope 1": 0,
                                            "Bioenergy": 0,
                                            "Fuels": 0,
                                            "Owned Vehicles": 0,
                                            "Refrigerant": 0,
                                            Emission: {
                                            },
                                            BioenergySplit: {}

                                        },      // Initialize Scope 1, 2, 3 for Environment
                                        "Scope 2": {
                                            "Scope 2": 0,
                                            "District Cooling": 0,
                                            "Electricity": 0,
                                            "Heat and steam": 0,
                                            "Electricity - Backup": 0,
                                            "Owned Vehicles": 0,
                                            Activities: {
                                            },
                                            Emission: {}

                                        },
                                        "Scope 3": {
                                            "Scope 3": 0,
                                            "Business travel - land and sea": 0,
                                            "Employees commuting": 0,
                                            "Flight": 0,
                                            "Freighting goods": 0,
                                            "Materials": 0,
                                            "Waste Disposal": 0,
                                            "WTT- fuels": 0,
                                            Emission: {
                                            }

                                        }
                                    },
                                    Social: {
                                        "Overview": {
                                            Headcount: 0,
                                            "Female:Male": 0,
                                            "Total training Hrs": 0,
                                            "CSR Spend": 0,
                                            Attrition: 0,
                                            Retention: 0,
                                            EmployementType: {},
                                            Gender: {},
                                            GenderForInjuries: {},
                                            ChildLabor: {},
                                            Training: {},
                                            InjuryType: {},
                                            ChildLaborSupplier: {},
                                            TrainingType: {},
                                        },
                                        "PrivacyOthers": {
                                            "Complaints": {
                                            },
                                            "CHS": {
                                            },
                                            "Mktg and Labelling": {
                                            },
                                            "SocialEx": {
                                            },
                                            "SocialBe": {
                                            }
                                        }
                                    },
                                    Governance: {
                                        "Overview": {
                                            BODs: 0,
                                            "BODSFemale": 0,
                                            "CFO/CEO": 0,
                                            "CFO/CEO-Female": 0,
                                            "Independent Directors": 0,
                                            Revenue: 0,
                                            Turnover: 0,
                                            Gender: {},
                                            EntityType: {}
                                        }
                                    }
                                };
                            }

                            // Add the module data to the corresponding branch, along with its category
                            branchWiseData[branch].modules[moduleName] = {
                                ...branchData,
                                category: moduleCategory, // Add the module category (Environment, Social, Governance)
                                scope: scopeData[moduleName] || ""
                            };

                            // If the module belongs to the "Environment" category, calculate and add its emissions
                            if (moduleCategory === "Environment") {
                                const emissions = that.calculateEmissions(moduleName, branchData);
                                branchWiseData[branch].Overview.TotalEmissions += emissions;
                                const scope = scopeData[moduleName];
                                if (scope) {
                                    if (moduleName == "Owned Vehicles") {
                                        branchData.data.map(val => {
                                            branchWiseData[branch].Overview.Scope[val.Scope] += parseFloat(val["Distance (km)"]) * parseFloat(val.Factor);
                                        })
                                    }
                                    else {
                                        branchWiseData[branch].Overview.Scope[scope] += emissions;
                                    }
                                }
                                // branchData.data.forEach(item => {
                                branchWiseData[branch].Environment[scope].Emission[moduleName] = (branchWiseData[branch].Environment[scope].Emission[moduleName] || 0) + emissions;
                                // });
                                if (moduleName === "Water") {
                                    branchWiseData[branch].Overview.Water += emissions;
                                    branchWiseData[branch].Environment.Overview.Water += emissions;
                                    branchWiseData[branch].Environment["Scope 3"].Water = (branchWiseData[branch].Environment["Scope 3"].Water || 0) + emissions;
                                }
                                if (moduleName === "Accommodation") {
                                    branchWiseData[branch].Environment["Scope 3"].Accommodation = (branchWiseData[branch].Environment["Scope 3"].Accommodation || 0) + emissions;
                                }
                                if (moduleName === "Food") {
                                    branchWiseData[branch].Environment["Scope 3"].Food = (branchWiseData[branch].Environment["Scope 3"].Food || 0) + emissions;
                                }
                                if (moduleName === "Home Office") {
                                    branchWiseData[branch].Environment["Scope 3"]["Home Office"] = (branchWiseData[branch].Environment["Scope 3"]["Home Office"] || 0) + emissions;
                                }

                                if (moduleName === "Elec heat cooling") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Environment["Scope 2"][item.Activity]) {
                                            branchWiseData[branch].Environment["Scope 2"][item.Activity] += (parseFloat(item.Amount) * (parseFloat(item["GEF Factors"])) + (parseFloat(item.Amount) * parseFloat(item["T&D Factors"])));
                                        }
                                        else {
                                            branchWiseData[branch].Environment["Scope 2"][item.Activity] = (parseFloat(item.Amount) * (parseFloat(item["GEF Factors"])) + (parseFloat(item.Amount) * parseFloat(item["T&D Factors"])))
                                        }
                                        if (branchWiseData[branch].Environment["Scope 2"].Activities[item.Activity]) {
                                            branchWiseData[branch].Environment["Scope 2"].Activities[item.Activity] += (parseFloat(item.Amount) * (parseFloat(item["GEF Factors"])) + (parseFloat(item.Amount) * parseFloat(item["T&D Factors"])));
                                        }
                                        else {
                                            branchWiseData[branch].Environment["Scope 2"].Activities[item.Activity] = (parseFloat(item.Amount) * (parseFloat(item["GEF Factors"])) + (parseFloat(item.Amount) * parseFloat(item["T&D Factors"])))
                                        }
                                    });
                                }
                                if (moduleName === "Waste Disposal") {
                                    branchWiseData[branch].Overview.Waste += emissions;
                                    branchWiseData[branch].Environment.Overview.Waste += emissions;
                                }
                                if (moduleName === "Bioenergy") {
                                    branchWiseData[branch].Environment["Scope 1"].Bioenergy += emissions;
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Environment["Scope 1"].BioenergySplit[item.Type]) {
                                            branchWiseData[branch].Environment["Scope 1"].BioenergySplit[item.Type] += parseFloat(item.Amount) * parseFloat(item.Factor);
                                        }
                                        else {
                                            branchWiseData[branch].Environment["Scope 1"].BioenergySplit[item.Type] = parseFloat(item.Amount) * parseFloat(item.Factor)
                                        }
                                    });

                                }
                                if (moduleName === "Fuel") {
                                    branchWiseData[branch].Environment["Scope 1"].Fuels += emissions;
                                }
                                if (moduleName === "Owned Vehicles") {
                                    branchData.data.map(val => {
                                        branchWiseData[branch].Environment[val.Scope]["Owned Vehicles"] += parseFloat(val["Distance (km)"]) * parseFloat(val.Factor);
                                    })
                                }
                                if (moduleName === "Refrigerant and other") {
                                    branchWiseData[branch].Environment["Scope 1"]["Refrigerant"] += emissions;
                                }
                                if (moduleName === "Business travel - land and sea") {
                                    branchWiseData[branch].Environment["Scope 3"]["Business travel - land and sea"] += emissions;
                                }
                                if (moduleName === "Employees commuting") {
                                    branchWiseData[branch].Environment["Scope 3"]["Employees commuting"] += emissions;
                                }
                                if (moduleName === "Flight") {
                                    branchWiseData[branch].Environment["Scope 3"]["Flight"] += emissions;
                                }
                                if (moduleName === "Freighting goods") {
                                    branchWiseData[branch].Environment["Scope 3"]["Freighting goods"] += emissions;
                                }
                                if (moduleName === "Materials") {
                                    branchWiseData[branch].Environment["Scope 3"]["Materials"] += emissions;
                                } if (moduleName === "Waste Disposal") {
                                    branchWiseData[branch].Environment["Scope 3"]["Waste Disposal"] += emissions;
                                } if (moduleName === "WTT- fuels") {
                                    branchWiseData[branch].Environment["Scope 3"]["WTT- fuels"] += emissions;
                                }




                                // if (scope == "Scope 1") {
                                //     if (branchWiseData[branch].Environment["Scope 1"].Emission[moduleName]) {
                                //         if (moduleName === "Owned Vehicles") {
                                //             branchData.data.map(val => {
                                //                 branchWiseData[branch].Environment["Scope 1"].Emission[moduleName] += parseFloat(val["Distance (km)"]) * parseFloat(val.Factor);
                                //             })
                                //         }
                                //         else {
                                //             branchWiseData[branch].Environment["Scope 1"].Emission[moduleName] += emissions;
                                //         }
                                //     }
                                //     else {
                                //         branchWiseData[branch].Environment["Scope 1"].Emission[moduleName] = emissions
                                //     }


                                // }
                                // if (scope == "Scope 3") {
                                //     if (branchWiseData[branch].Environment["Scope 3"].Emission[moduleName]) {
                                //         branchWiseData[branch].Environment["Scope 3"].Emission[moduleName] += emissions;
                                //     }
                                //     else {
                                //         branchWiseData[branch].Environment["Scope 3"].Emission[moduleName] = emissions
                                //     }


                                // }

                                let waterStress = 0;
                                branchData.data.forEach(item => {
                                    // Gender Count logic
                                    if (item.Type === "Water Drainage") {
                                        waterStress += parseFloat(item.Amount) || 0;
                                    }
                                });
                                branchWiseData[branch].Environment.Overview["Water Stress"] += waterStress;
                            }
                            // If the module belongs to the "Social" category and is "Social Benefits", sum "No. of Beneficiaries" and "Expenditure"
                            if (moduleCategory === "Social") {
                                if (moduleName === "Social Benefits") {
                                    branchData.data.forEach(item => {
                                        branchWiseData[branch].Overview.Biodiversity += parseFloat(item["No. of Beneficiaries"]) || 0;
                                        branchWiseData[branch].Overview.Beneficiaries += parseFloat(item.Expenditure) || 0;
                                        branchWiseData[branch].Overview.SocialSpend += parseFloat(item.Expenditure) || 0;
                                        branchWiseData[branch].Social["Overview"]["CSR Spend"] += parseFloat(item.Expenditure) || 0;
                                        if (branchWiseData[branch].Social["PrivacyOthers"]["SocialEx"][item["Domain"]]) {
                                            branchWiseData[branch].Social["PrivacyOthers"]["SocialEx"][item["Domain"]] += parseFloat(item["Expenditure"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["PrivacyOthers"]["SocialEx"][item["Domain"]] = parseFloat(item["Expenditure"]) || 0;
                                        }
                                        if (branchWiseData[branch].Social["PrivacyOthers"]["SocialBe"][item["Domain"]]) {
                                            branchWiseData[branch].Social["PrivacyOthers"]["SocialBe"][item["Domain"]] += parseFloat(item["No. of Beneficiaries"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["PrivacyOthers"]["SocialBe"][item["Domain"]] = parseFloat(item["No. of Beneficiaries"]) || 0;
                                        }

                                    });
                                }
                                if (moduleName === "Training and Edu") {
                                    branchData.data.forEach(item => {
                                        branchWiseData[branch].Social["Overview"]["Total training Hrs"] += parseFloat(item["Avg Hours per batch"]) || 0;
                                    });
                                }
                                if (moduleName === "Retention") {
                                    branchData.data.forEach(item => {
                                        branchWiseData[branch].Social["Overview"]["Attrition"] += parseFloat(item["Head Count"]) || 0;
                                    });
                                }
                                if (moduleName === "Child Labor") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["Overview"]["ChildLabor"][item["Risk Level"]]) {
                                            branchWiseData[branch].Social["Overview"]["ChildLabor"][item["Risk Level"]] += parseFloat(item["No. of Incidents reported"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["ChildLabor"][item["Risk Level"]] = parseFloat(item["No. of Incidents reported"]) || 0;
                                        }
                                        if (branchWiseData[branch].Social["Overview"]["ChildLaborSupplier"][item["Risk Level"]]) {
                                            branchWiseData[branch].Social["Overview"]["ChildLaborSupplier"][item["Risk Level"]] += parseFloat(item["Supplier Name"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["ChildLaborSupplier"][item["Risk Level"]] = parseFloat(item["Supplier Name"]) || 0;
                                        }
                                    });
                                }
                                if (moduleName === "Customer Privacy") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["PrivacyOthers"]["Complaints"][item["Nature of Complaints"]]) {
                                            branchWiseData[branch].Social["PrivacyOthers"]["Complaints"][item["Nature of Complaints"]]["No. of complaints received"] += parseFloat(item["No. of complaints received"]);
                                            branchWiseData[branch].Social["PrivacyOthers"]["Complaints"][item["Nature of Complaints"]]["No. of complaints solved"] += parseFloat(item["No. of complaints solved"]);

                                        }
                                        else {
                                            branchWiseData[branch].Social["PrivacyOthers"]["Complaints"][item["Nature of Complaints"]] = {
                                                "No. of complaints received": parseFloat(item["No. of complaints received"]) || 0,
                                                "No. of complaints solved": parseFloat(item["No. of complaints solved"]) || 0
                                            }
                                        }
                                    });
                                }
                                if (moduleName === "CHS") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["PrivacyOthers"]["CHS"][item["Type of Incident"]]) {
                                            branchWiseData[branch].Social["PrivacyOthers"]["CHS"][item["Type of Incident"]]["No. of non-compliance Incidents"] += parseFloat(item["No. of non-compliance Incidents"]);
                                            branchWiseData[branch].Social["PrivacyOthers"]["CHS"][item["Type of Incident"]]["Customers Impacted"] += parseFloat(item["Customers Impacted"]);

                                        }
                                        else {
                                            branchWiseData[branch].Social["PrivacyOthers"]["CHS"][item["Type of Incident"]] = {
                                                "No. of non-compliance Incidents": parseFloat(item["No. of non-compliance Incidents"]) || 0,
                                                "Customers Impacted": parseFloat(item["Customers Impacted"]) || 0
                                            }
                                        }
                                    });
                                }
                                if (moduleName === "Mktg and Labelling") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["PrivacyOthers"]["Mktg and Labelling"][item["Incident"]]) {
                                            branchWiseData[branch].Social["PrivacyOthers"]["Mktg and Labelling"][item["Incident"]]["No. of non-compliance Incidents"] += parseFloat(item["No. of non-compliance Incidents"]);
                                            branchWiseData[branch].Social["PrivacyOthers"]["Mktg and Labelling"][item["Incident"]]["No. of times regulation violated"] += parseFloat(item["No. of times regulation violated"]);

                                        }
                                        else {
                                            branchWiseData[branch].Social["PrivacyOthers"]["Mktg and Labelling"][item["Incident"]] = {
                                                "No. of non-compliance Incidents": parseFloat(item["No. of non-compliance Incidents"]) || 0,
                                                "No. of times regulation violated": parseFloat(item["No. of times regulation violated"]) || 0
                                            }
                                        }
                                    });
                                }
                                if (moduleName === "Training and Edu") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["Overview"]["Training"][item["Segment"]]) {
                                            branchWiseData[branch].Social["Overview"]["Training"][item["Segment"]] += parseFloat(item["Head Count"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["Training"][item["Segment"]] = parseFloat(item["Head Count"]) || 0;
                                        }

                                        if (branchWiseData[branch].Social["Overview"]["TrainingType"][item["Types of training"]]) {
                                            branchWiseData[branch].Social["Overview"]["TrainingType"][item["Types of training"]] += parseFloat(item["Financial investment"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["TrainingType"][item["Types of training"]] = parseFloat(item["Financial investment"]) || 0;
                                        }
                                    });
                                }
                                if (moduleName === "OH and S") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["Overview"]["GenderForInjuries"][item["Gender"]]) {
                                            branchWiseData[branch].Social["Overview"]["GenderForInjuries"][item["Gender"]] += parseFloat(item["Head Count"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["GenderForInjuries"][item["Gender"]] = parseFloat(item["Head Count"]) || 0;
                                        }

                                        if (branchWiseData[branch].Social["Overview"]["InjuryType"][item["Injury Type"]]) {
                                            branchWiseData[branch].Social["Overview"]["InjuryType"][item["Injury Type"]] += parseFloat(item["Number of Incidents"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["InjuryType"][item["Injury Type"]] = parseFloat(item["Number of Incidents"]) || 0;
                                        }
                                    });
                                }
                                if (moduleName === "Employment") {
                                    branchData.data.forEach(item => {
                                        if (branchWiseData[branch].Social["Overview"]["EmployementType"][item["Employment Type"]]) {
                                            branchWiseData[branch].Social["Overview"]["EmployementType"][item["Employment Type"]] += parseFloat(item["Head Count"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["EmployementType"][item["Employment Type"]] = parseFloat(item["Head Count"]) || 0
                                        }
                                        if (branchWiseData[branch].Social["Overview"]["Gender"][item["Gender"]]) {
                                            branchWiseData[branch].Social["Overview"]["Gender"][item["Gender"]] += parseFloat(item["Head Count"]) || 0;
                                        }
                                        else {
                                            branchWiseData[branch].Social["Overview"]["Gender"][item["Gender"]] = parseFloat(item["Head Count"]) || 0
                                        }
                                    });
                                }
                            }
                            // If the module is "Entity" and category is "Governance", calculate the GenderSplit
                            // If the module is "Entity" and category is "Governance", calculate GenderSplit, AgeCount, and GenderCount
                            // If the module is "Entity" and category is "Governance", calculate GenderSplit, AgeCount, and GenderCount
                            if (moduleCategory === "Governance") {
                                if (moduleName === "Entity") {
                                    let femaleCount = 0;
                                    let maleCount = 0;
                                    let othersCount = 0;
                                    let femaleBODCount = 0;
                                    let maleBODCount = 0;
                                    let othersBODCount = 0;
                                    let allCount = 0;

                                    branchData.data.forEach(item => {
                                        // Gender Count logic
                                        allCount += parseFloat(item["Head Count"])
                                        if (item.Gender === "Female") {
                                            femaleCount += parseFloat(item["Head Count"]) || 0;
                                        } else if (item.Gender === "Male") {
                                            maleCount += parseFloat(item["Head Count"]) || 0;
                                        }
                                        else if (item.Gender === "Others") {
                                            othersCount += parseFloat(item["Head Count"]) || 0;
                                        }


                                        // Age Count logic with defined age ranges
                                        const age = parseInt(item.Age, 10);
                                        if (age >= 50) {
                                            branchWiseData[branch].Overview.AgeCount["50+"] += parseFloat(item["Head Count"]) || 0;
                                        } else if (age >= 35 && age < 50) {
                                            branchWiseData[branch].Overview.AgeCount["35 to 50"] += parseFloat(item["Head Count"]) || 0;
                                        } else if (age >= 22 && age < 35) {
                                            branchWiseData[branch].Overview.AgeCount["22 to 35"] += parseFloat(item["Head Count"]) || 0;
                                        } else if (age < 22) {
                                            branchWiseData[branch].Overview.AgeCount["Less than 22"] += parseFloat(item["Head Count"]) || 0;
                                        }

                                        if (item["Entity Type"] !== "BOD turnover rate" && item["Entity Type"] !== "Compensation ratio") {
                                            branchWiseData[branch].Social["Overview"].Headcount += parseFloat(item["Head Count"]) || 0;
                                            if (branchWiseData[branch].Governance["Overview"]["Gender"][item["Gender"]]) {
                                                branchWiseData[branch].Governance["Overview"]["Gender"][item["Gender"]] += parseFloat(item["Head Count"]) || 0;
                                            }
                                            else {
                                                branchWiseData[branch].Governance["Overview"]["Gender"][item["Gender"]] = parseFloat(item["Head Count"]) || 0
                                            }
                                            if (branchWiseData[branch].Governance["Overview"]["EntityType"][item["Entity Type"]]) {
                                                branchWiseData[branch].Governance["Overview"]["EntityType"][item["Entity Type"]] += parseFloat(item["Head Count"]) || 0;
                                            }
                                            else {
                                                branchWiseData[branch].Governance["Overview"]["EntityType"][item["Entity Type"]] = parseFloat(item["Head Count"]) || 0
                                            }
                                        }
                                        // GenderSplit logic
                                        if (item["Entity Type"] === "BOD") { // Filter by "Entity Type" as "BOD"
                                            branchWiseData[branch].Governance["Overview"].BODs += parseFloat(item["Head Count"]) || 0;
                                            if (item.Gender === "Female") {
                                                femaleBODCount += parseFloat(item["Head Count"]) || 0;
                                                branchWiseData[branch].Governance["Overview"]["BODSFemale"] += parseFloat(item["Head Count"]) || 0;

                                            } else if (item.Gender === "Male") {
                                                maleBODCount += parseFloat(item["Head Count"]) || 0;
                                            }
                                            else if (item.Gender === "Others") {
                                                othersBODCount += parseFloat(item["Head Count"]) || 0;
                                            }
                                        }


                                        if (item["Entity Type"] === "CFO/CEO") { // Filter by "Entity Type" as "BOD"

                                            branchWiseData[branch].Governance["Overview"]["CFO/CEO"] += parseFloat(item["Head Count"]) || 0;
                                            if (item.Gender === "Female") {
                                                branchWiseData[branch].Governance["Overview"]["CFO/CEO-Female"] += parseFloat(item["Head Count"]) || 0;
                                            }
                                        }
                                        if (item["Entity Type"] === "Independent Directors") { // Filter by "Entity Type" as "BOD"

                                            branchWiseData[branch].Governance["Overview"]["Independent Directors"] += parseFloat(item["Head Count"]) || 0;
                                        }
                                    });



                                    // Calculate GenderSplit (femaleCount / maleCount)
                                    if (maleCount > 0) {  // To avoid division by zero
                                        branchWiseData[branch].Overview.GenderSplit = `${femaleCount}:${maleCount}`;
                                    }


                                    // Set Gender Count
                                    branchWiseData[branch].Overview.GenderCount = {
                                        Male: maleCount,
                                        Female: femaleCount,
                                        Others: othersCount,
                                    };
                                    branchWiseData[branch].Social["Overview"]["Female:Male"] = `${femaleCount}:${maleCount}`
                                }
                                if (moduleName === "Eco. Performance") {
                                    branchData.data.forEach(item => {
                                        if (item["Data"] === "Total Revenue") { // Filter by "Entity Type" as "BOD"

                                            branchWiseData[branch].Governance["Overview"]["Revenue"] += parseFloat(item.Values) || 0;
                                        }
                                        if (item["Data"] === "Total turnover") { // Filter by "Entity Type" as "BOD"

                                            branchWiseData[branch].Governance["Overview"]["Turnover"] += parseFloat(item.Values) || 0;
                                        }
                                    });
                                }

                            }
                        }
                    });
                });
                // Round off TotalEmissions to two decimal places for every branch
                Object.keys(branchWiseData).forEach(branch => {
                    branchWiseData[branch].Overview.TotalEmissions = parseFloat(branchWiseData[branch].Overview.TotalEmissions.toFixed(2));
                    branchWiseData[branch].Environment.Overview.TotalEmissions = parseFloat(branchWiseData[branch].Overview.TotalEmissions.toFixed(2));
                    delete branchWiseData[branch].modules;
                    const totalEmissions = branchWiseData[branch].Overview.TotalEmissions;
                    if (totalEmissions > 0) {
                        const scopeData = { ...branchWiseData[branch].Overview.Scope };
                        Object.keys(scopeData).forEach(scope => {
                            // Convert scope emissions to percentage of total emissions
                            branchWiseData[branch].Overview.Scope[scope] = parseFloat(((scopeData[scope] / totalEmissions) * 100).toFixed(2));
                            branchWiseData[branch].Environment.Overview.Scope[scope] = parseFloat(((scopeData[scope] / totalEmissions) * 100).toFixed(2));
                            branchWiseData[branch].Environment.Overview[scope] = scopeData[scope].toFixed(2);
                            if (scope == "Scope 1") {
                                branchWiseData[branch].Environment["Scope 1"]["Scope 1"] = scopeData[scope].toFixed(2);
                            }
                            if (scope == "Scope 3") {
                                branchWiseData[branch].Environment["Scope 3"]["Scope 3"] = scopeData[scope].toFixed(2);
                                Object.keys(branchWiseData[branch].Environment["Scope 3"].Emission).map(val => {
                                    branchWiseData[branch].Environment["Scope 3"].Emission[val] = parseFloat(((branchWiseData[branch].Environment["Scope 3"].Emission[val] / scopeData[scope]) * 100).toFixed(2));
                                }
                                )
                            }
                            if (scope == "Scope 2") {
                                branchWiseData[branch].Environment["Scope 2"]["Scope 2"] = scopeData[scope].toFixed(2);
                                Object.keys(branchWiseData[branch].Environment["Scope 2"].Activities).map(val => {
                                    branchWiseData[branch].Environment["Scope 2"].Activities[val] = parseFloat(((branchWiseData[branch].Environment["Scope 2"].Activities[val] / scopeData[scope]) * 100).toFixed(2));
                                }
                                )
                            }

                        });
                        branchWiseData[branch].Social["Overview"]["Retention"] = parseFloat((branchWiseData[branch].Social["Overview"]["Attrition"] / branchWiseData[branch].Social["Overview"].Headcount).toFixed(2));
                    }
                });
                return branchWiseData;
            },
            findSimplifiedRatio: function (a, b) {
                if (!a) {
                    a = 0;
                }
                if (!b) {
                    b = 0
                }
                if (b === 0) {
                    return a + ":0";
                }
                if (a === 0) {
                    return "0:" + b; // Any ratio with 0 as numerator simplifies to 0:1
                }

                // Function to calculate the GCD (Greatest Common Divisor)
                const gcd = (x, y) => (y === 0 ? x : gcd(y, x % y));

                const divisor = gcd(a, b); // Find GCD of a and b
                const simplifiedA = a / divisor;
                const simplifiedB = b / divisor;
                if (Number.isInteger(simplifiedA) && Number.isInteger(simplifiedB)) {
                    return `${simplifiedA}:${simplifiedB}`;
                } else {
                    return `${simplifiedA.toFixed(2)}:${simplifiedB.toFixed(2)}`;
                }
            }
        });
    }
);