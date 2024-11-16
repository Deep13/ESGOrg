sap.ui.define([
    "../controller/BaseController",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/uxap/ObjectPageSection",
    "sap/uxap/ObjectPageSubSection",
], function (Controller, HBox, VBox, ObjectPageSection, ObjectPageSubSection) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.SupportPage", {
        onInit: function () {
            this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            this.oRouter
                .getRoute("SupportPage")
                .attachPatternMatched(this._handleRouteMatched, this);
        },
        _handleRouteMatched: function (oEvent) {
            var that = this;
            // Sample data for demonstration
            this.checkgetUserLog().then(async user => {

                sap.ui.core.BusyIndicator.show();
                var data = await that.getSheets(user);
                var branches = user.branches;
                var masterData = that.getMaster();
                var monthYear = masterData.currentReportingCycle;
                var docRef;
                if (user.role == "Admin") {
                    docRef = firebase.firestore().collection("Incidents").where("orgID", "==", user.domain);
                }
                else {
                    docRef = firebase.firestore().collection("Incidents").where("email", "==", user.email);
                }
                const tableData = [];
                docRef.get().then((snapShots) => {
                    snapShots.docs.map(doc => {
                        tableData.push(doc.data());
                    });


                    const oModel = new sap.ui.model.json.JSONModel({ results: tableData });
                    this.getView().setModel(oModel);

                    sap.ui.core.BusyIndicator.hide();
                }).catch((error) => {

                });
            });






        },


        // Filter Logic

        _applyTableFilter: function (sField, sValue) {
            const oTable = this.byId("branchTable");
            const oBinding = oTable.getBinding("items");
            let aFilters = oBinding.aFilters || [];

            // Remove any existing filter for the given field
            aFilters = aFilters.filter(f => f.sPath !== sField);

            // If a value is selected and it's not "All", apply the new filter
            if (sValue && sValue !== "All") {
                aFilters.push(new sap.ui.model.Filter(sField, sap.ui.model.FilterOperator.EQ, sValue));
            }

            // Apply the new set of filters (or no filters if "All" was selected)
            oBinding.filter(aFilters);
        },
        onStatusFilter: function (oEvent) {
            const selectedKey = oEvent.getParameter("selectedItem").getKey();
            this._applyTableFilter("status", selectedKey);
        },
        onPriorityFilter: function (oEvent) {
            const selectedKey = oEvent.getParameter("selectedItem").getKey();
            this._applyTableFilter("priority", selectedKey);
        },


        onResetFilters: function () {
            // Clear all filters from the table
            const oTable = this.byId("branchTable");
            const oBinding = oTable.getBinding("items");
            oBinding.filter([]); // Remove all filters

            this.byId("statusFilter").setSelectedKey("All");

            // Optional: Manually trigger any logic if necessary
            this.applyFilters(); // Or call any logic that re-applies empty filters if needed
        },








        calculateCompletion: function (statistics, reports, branches) {
            let result = {};
            let totalPercentage = 0;
            let totalCategories = 0;

            let totalEmissionsPercentage = 0;
            let totalSocialPercentage = 0;
            let totalGovernancePercentage = 0;
            let totalOverviewPercentage = 0;

            let branchesWithData = 0;

            // Loop through only the branches present in the provided branch array
            branches.forEach(branchObj => {
                let location = branchObj.branch; // Access the branch key
                // If branch does not exist in statistics, it will have 0% for all categories
                if (statistics[location]) {
                    let locationData = statistics[location];
                    let locationResult = {};
                    let locationPercentageSum = 0;
                    let categoryCount = 0;

                    // Loop through categories: Emissions, Social, Governance
                    Object.keys(reports).forEach(category => {
                        let statCategory = locationData[category] || [];
                        let reportCategory = reports[category];

                        // Calculate the number of matches
                        let matches = statCategory.filter(item => reportCategory.includes(item)).length;
                        let totalInReport = reportCategory.length;

                        // Calculate the percentage
                        let percentage = (matches / totalInReport) * 100;
                        locationResult[category] = percentage.toFixed(2);

                        // Accumulate percentage for the location
                        locationPercentageSum += percentage;
                        categoryCount++;

                        // Track category-specific percentages
                        if (category === "Environment") {
                            totalEmissionsPercentage += percentage;
                        } else if (category === "Social") {
                            totalSocialPercentage += percentage;
                        } else if (category === "Governance") {
                            totalGovernancePercentage += percentage;
                        }
                    });

                    // Calculate total percentage for the location
                    let locationTotalPercentage = (locationPercentageSum / categoryCount).toFixed(2);
                    locationResult["Total"] = locationTotalPercentage;
                    totalOverviewPercentage += parseFloat(locationTotalPercentage);
                    // Add to overall percentage calculation
                    totalPercentage += locationPercentageSum;
                    totalCategories += categoryCount;
                    branchesWithData++;

                    result[location] = locationResult;
                } else {
                    // If location is missing from statistics, set all categories to 0%
                    let locationResult = {
                        "Environment": "0.00",
                        "Social": "0.00",
                        "Governance": "0.00",
                        "Total": "0.00"
                    };
                    result[location] = locationResult;
                    totalCategories += 3;  // 3 categories: Emissions, Social, Governance
                }
            });

            // Calculate full total percentage across all branches
            let fullTotalPercentage = (totalOverviewPercentage / branches.length).toFixed(2);

            // Calculate overall category-specific percentages
            let avgEmissionsPercentage = (totalEmissionsPercentage / branches.length).toFixed(2);
            let avgSocialPercentage = (totalSocialPercentage / branches.length).toFixed(2);
            let avgGovernancePercentage = (totalGovernancePercentage / branches.length).toFixed(2);

            return {
                result,
                fullTotalPercentage,
                avgEmissionsPercentage,
                avgSocialPercentage,
                avgGovernancePercentage
            };
        },

        _renderSections: function (oData) {
            var oObjectPageLayout = this.byId("objectPageLayout");
            oObjectPageLayout.removeAllSections(); // Clear any existing sections
            var oSection = new ObjectPageSection({
                title: "Overview",
                subSections: [
                    this._createSubSection(oData.overall)
                ]
            });
            oObjectPageLayout.addSection(oSection);
            // Loop through each key in the data to create sections and subsections
            oData.branches.map(val => {
                // Create a new ObjectPageSection
                var title = val.name.split("-");

                var oSection = new ObjectPageSection({
                    title: title[title.length - 1],
                    subSections: [
                        this._createSubSection(val, title[title.length - 1])
                    ]
                });
                oObjectPageLayout.addSection(oSection);
            })
        },
        _createSubSection: function (sectionData, title) {
            var HBox = new sap.m.HBox({ width: "100%", justifyContent: "SpaceBetween" });
            var oVBox = new sap.m.VBox({ width: "20%" });
            var oProgressIndicator = new sap.m.ProgressIndicator({
                percentValue: sectionData.Overview,
                displayValue: sectionData.Overview + "%"
            });
            oVBox.addItem(new sap.m.Label({ text: "Overview" + ": " }));
            oVBox.addItem(oProgressIndicator);
            HBox.addItem(oVBox);

            var oVBox = new sap.m.VBox({ width: "20%" });
            var oProgressIndicator = new sap.m.ProgressIndicator({
                state: "Success",
                percentValue: sectionData.Environment,
                displayValue: sectionData.Environment + "%"
            });
            oVBox.addItem(new sap.m.Label({ text: "Environment" + ": " }));
            oVBox.addItem(oProgressIndicator);

            if (sectionData.completedModules && sectionData.completedModules["Environment"] && sectionData.completedModules["Environment"].length > 0) {
                oVBox.addItem(new sap.m.Label({ text: "Environment" + " Completed Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Completed Modules list
                var oCompletedList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aCompletedModules = sectionData.completedModules["Environment"] || [];
                aCompletedModules.forEach(function (module) {
                    oCompletedList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oCompletedList);
            }
            if (sectionData.incompleteModules && sectionData.incompleteModules["Environment"] && sectionData.incompleteModules["Environment"].length > 0) {
                // Add title for Incomplete modules
                oVBox.addItem(new sap.m.Label({ text: "Environment" + " Incomplete Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Incomplete Modules list
                var oIncompleteList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aIncompleteModules = sectionData.incompleteModules["Environment"] || [];
                aIncompleteModules.forEach(function (module) {
                    oIncompleteList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oIncompleteList);
            }
            HBox.addItem(oVBox);

            var oVBox = new sap.m.VBox({ width: "20%" });
            var oProgressIndicator = new sap.m.ProgressIndicator({
                state: "Warning",
                percentValue: sectionData.Social,
                displayValue: sectionData.Social + "%"
            });
            oVBox.addItem(new sap.m.Label({ text: "Social" + ": " }));
            oVBox.addItem(oProgressIndicator);
            if (sectionData.completedModules && sectionData.completedModules["Social"] && sectionData.completedModules["Social"].length > 0) {

                oVBox.addItem(new sap.m.Label({ text: "Social" + " Completed Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Completed Modules list
                var oCompletedList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aCompletedModules = sectionData.completedModules["Social"] || [];
                aCompletedModules.forEach(function (module) {
                    oCompletedList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oCompletedList);
            }
            if (sectionData.incompleteModules && sectionData.incompleteModules["Social"] && sectionData.incompleteModules["Social"].length > 0) {

                // Add title for Incomplete modules
                oVBox.addItem(new sap.m.Label({ text: "Social" + " Incomplete Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Incomplete Modules list
                var oIncompleteList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aIncompleteModules = sectionData.incompleteModules["Social"] || [];
                aIncompleteModules.forEach(function (module) {
                    oIncompleteList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oIncompleteList);
            }
            HBox.addItem(oVBox);

            var oVBox = new sap.m.VBox({ width: "20%" });
            var oProgressIndicator = new sap.m.ProgressIndicator({
                state: "Error",
                percentValue: sectionData.Governance,
                displayValue: sectionData.Governance + "%"
            });
            oVBox.addItem(new sap.m.Label({ text: "Governance" + ": " }));
            oVBox.addItem(oProgressIndicator);
            if (sectionData.completedModules && sectionData.completedModules["Governance"] && sectionData.completedModules["Governance"].length > 0) {

                oVBox.addItem(new sap.m.Label({ text: "Governance" + " Completed Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Completed Modules list
                var oCompletedList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aCompletedModules = sectionData.completedModules["Governance"] || [];
                aCompletedModules.forEach(function (module) {
                    oCompletedList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oCompletedList);
            }
            if (sectionData.incompleteModules && sectionData.incompleteModules["Governance"] && sectionData.incompleteModules["Governance"].length > 0) {
                // Add title for Incomplete modules
                oVBox.addItem(new sap.m.Label({ text: "Governance" + " Incomplete Modules: " }).addStyleClass("sapUiMediumMarginTop"));

                // Create the Incomplete Modules list
                var oIncompleteList = new sap.m.List({ backgroundDesign: "Transparent" });
                var aIncompleteModules = sectionData.incompleteModules["Governance"] || [];
                aIncompleteModules.forEach(function (module) {
                    oIncompleteList.addItem(new sap.m.StandardListItem({
                        title: module
                    }));
                });
                oVBox.addItem(oIncompleteList);
            }
            HBox.addItem(oVBox);



            var oVBox = new sap.m.VBox({
                items: [HBox]
            });


            return new sap.uxap.ObjectPageSubSection({
                title: title,
                blocks: [oVBox]
            });
        },
        _createBranchProgress: function () {
            var oBranchesContainer = this.byId("branchesContainer");
            var aBranches = this.getView().getModel().getProperty("/branches");

            aBranches.forEach(branch => {
                var oPanel = new sap.m.Panel({
                    headerText: branch.name,
                    expandable: true,
                    expanded: true
                });

                var oVBox = new sap.m.VBox({ spacing: "0.5rem" });

                // Create progress indicators for each category
                for (var key in branch) {
                    if (branch.hasOwnProperty(key) && key !== "name" && key !== "completedModules" && key !== "incompleteModules") {
                        var value = branch[key];
                        var oProgressIndicator = new sap.m.ProgressIndicator({
                            percentValue: value,
                            displayValue: value + "%"
                        });
                        oVBox.addItem(new sap.m.Label({ text: key + ": " }));
                        oVBox.addItem(oProgressIndicator);
                    }
                }

                // Add completed and incomplete modules
                var categories = ["Environment", "Social", "Governance"];
                categories.forEach(category => {
                    var completedModules = branch.completedModules[category] || [];
                    var incompleteModules = branch.incompleteModules[category] || [];

                    oVBox.addItem(new sap.m.Label({ text: category + " Completed Modules: " }));
                    oVBox.addItem(new sap.m.Text({ text: completedModules.join(", ") || "None" }));

                    oVBox.addItem(new sap.m.Label({ text: category + " Incomplete Modules: " }));
                    oVBox.addItem(new sap.m.Text({ text: incompleteModules.join(", ") || "None" }));
                });

                oPanel.addContent(oVBox);
                oBranchesContainer.addItem(oPanel);
            });
        }
    });
});
