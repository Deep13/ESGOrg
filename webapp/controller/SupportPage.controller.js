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
        }
    });
});
