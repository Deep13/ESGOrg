sap.ui.define(
  ["../controller/BaseController", "sap/m/MessageStrip", "sap/m/MessageBox", "sap/m/MessageToast", 'sap/ui/core/Fragment', "sap/m/Popover",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Select",
    "sap/m/Button",
    "sap/ui/core/Item"],
  function (Controller, MessageStrip, MessageBox, MessageToast, Fragment, Popover, Input, TextArea, Select, Button, Item) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.Main", {
      onInit: function () {

        this.getRouter()
          .getRoute("Main")
          .attachPatternMatched(this._handleRouteMatched, this);
      },
      _handleRouteMatched: function (oEvent) {
        var that = this;
        this.checkgetUserLog().then(async user => {
          that.getView().byId("user").setText("Welcome, " + user.email);
          if (user.role === "Admin") {
            that.getView().byId("AdminPanel").setVisible(true);
          }
          else {
            that.getView().byId("AdminPanel").setVisible(false);
          }
          // sap.ui.core.BusyIndicator.show();
          var data = await that.getSheets(user);
          var branches = user.branches;
          var masterData = that.getMaster();
          var monthYear = masterData.currentReportingCycle;
          const docRef = firebase.firestore().collection(user.domain).doc("TransactionData").collection(monthYear.month + "-" + monthYear.year).doc("Statistics");
          docRef.get().then((doc) => {
            if (doc.exists) {
              var { result, fullTotalPercentage, avgEmissionsPercentage, avgSocialPercentage, avgGovernancePercentage } = that.calculateCompletion(doc.data(), data, branches);
              that.branchReporting = result;
              console.log(result);
            } else {
              var result = [];
              var fullTotalPercentage = 0;
              var avgEmissionsPercentage = 0;
              var avgSocialPercentage = 0;
              var avgGovernancePercentage = 0
            }
            if (monthYear.status) {
              that.byId("progressText").setText("In Progress");
              that.byId("progressText").setState("Warning");
              that.byId("progressAll").setState("Warning");
              that.byId("EmissionTile").setValueColor("Critical");
              that.byId("SocialTile").setValueColor("Critical");
              that.byId("GovernanceTile").setValueColor("Critical");
              that.byId("reportinCycleText").setText("Current Reporting Cycle:" + monthYear.month + "-" + monthYear.year);

            }
            else {
              that.byId("progressText").setText("Closed");
              that.byId("progressAll").setState("None");
              that.byId("EmissionTile").setValueColor("Neutral");
              that.byId("SocialTile").setValueColor("Neutral");
              that.byId("GovernanceTile").setValueColor("Neutral");
              that.byId("progressText").setState("None");
              that.byId("reportinCycleText").setText("Last Reporting Cycle:" + monthYear.month + "-" + monthYear.year);

            }
            that.byId("progressAll").setPercentValue(fullTotalPercentage);
            that.byId("progressAll").setDisplayValue(fullTotalPercentage);
            // console.log("Full Total Percentage: " + fullTotalPercentage);
            that.byId("EmissionTile").setValue(avgEmissionsPercentage);
            that.byId("SocialTile").setValue(avgSocialPercentage);
            that.byId("GovernanceTile").setValue(avgGovernancePercentage);

          }).catch((error) => {

          });
        });


      },

      calculateCompletion: function (statistics, reports, branches) {
        let result = {};
        let totalPercentage = 0;
        let totalCategories = 0;

        let totalEmissionsPercentage = 0;
        let totalSocialPercentage = 0;
        let totalGovernancePercentage = 0;

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
              locationResult[category] = percentage.toFixed(2) + "%";

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
            let locationTotalPercentage = (locationPercentageSum / categoryCount).toFixed(2) + "%";
            locationResult["Total"] = locationTotalPercentage;

            // Add to overall percentage calculation
            totalPercentage += locationPercentageSum;
            totalCategories += categoryCount;
            branchesWithData++;

            result[location] = locationResult;
          } else {
            // If location is missing from statistics, set all categories to 0%
            let locationResult = {
              "Environment": "0.00%",
              "Social": "0.00%",
              "Governance": "0.00%",
              "Total": "0.00%"
            };
            result[location] = locationResult;
            totalCategories += 3;  // 3 categories: Environment, Social, Governance
          }
        });

        // Calculate full total percentage across all branches
        let fullTotalPercentage = (totalPercentage / totalCategories).toFixed(2) + "%";

        // Calculate overall category-specific percentages
        let avgEmissionsPercentage = (totalEmissionsPercentage / branchesWithData).toFixed(2) + "%";
        let avgSocialPercentage = (totalSocialPercentage / branchesWithData).toFixed(2) + "%";
        let avgGovernancePercentage = (totalGovernancePercentage / branchesWithData).toFixed(2) + "%";

        return {
          result,
          fullTotalPercentage,
          avgEmissionsPercentage,
          avgSocialPercentage,
          avgGovernancePercentage
        };
      },



      handlePopoverPress: function (oEvent) {
        var oButton = oEvent.getSource(),
          oView = this.getView();

        // create popover
        if (!this._pPopover) {
          this._pPopover = Fragment.load({
            id: oView.getId(),
            name: "ESGOrg.ESGOrg.fragments.DetailChart",
            controller: this
          }).then(function (oPopover) {
            oView.addDependent(oPopover);
            return oPopover;
          });
        }
        this._pPopover.then(function (oPopover) {
          oPopover.openBy(oButton);
        });
      },
      loadChart: function () {
        if (this._chart) {
          this._chart.destroy();
        }
        var branches = this.getUser().branches;

        var ctx = document.getElementById("BranchChart").getContext("2d");
        this._chart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Ahmdebad", "Delhi", "Jharkhand"],
            datasets: [{
              label: "Progress",
              data: ["10", "50", "40"],
              backgroundColor: ["#5c6cc0", "#b81d1c", "#ffb300"]
            }]
          },
          options: {
            indexAxis: 'y',
            plugins: {
              legend: {
                position: 'bottom'
              },
              title: {
                display: true,
                text: "Branch Wise Progress"
              },
            }
          }
        });


      },

      onOpenPopover: function (oEvent) {
        // Create a new Popover
        if (!this._oPopover) {
          this._oPopover = new Popover({
            id: "incidentId",
            title: "Raise Incident",
            contentWidth: "300px",
            placement: "Bottom",
            contentPadding: true,
            content: [
              new Input({
                placeholder: "Enter Title",
                width: "100%",
                value: "{/title}"
              }),
              new TextArea({
                placeholder: "Enter Description",
                width: "100%",
                rows: 3,
                value: "{/description}"
              }),
              new Input({
                placeholder: "Enter Phone Number",
                width: "100%",
                type: "Tel",
                value: "{/phone}"
              }),
              new Input({
                placeholder: "Enter Email Address",
                width: "100%",
                type: "Email",
                value: "{/email}"
              }),
              new Select({
                width: "100%",
                items: [
                  new Item({ text: "Low", key: "Low" }),
                  new Item({ text: "Medium", key: "Medium" }),
                  new Item({ text: "High", key: "High" })
                ],
                selectedKey: "{/priority}"
              })
            ],
            footer: new sap.m.Bar({
              contentRight: [
                new Button({
                  text: "Submit",
                  type: "Emphasized",
                  press: this.onSubmit.bind(this)
                })
              ]
            })
          });
          this._oPopover.addStyleClass("sapUiResponsivePadding")
          // Bind popover to the current view model
          this.getView().addDependent(this._oPopover);
        }

        // Open the popover next to the triggering button
        this._oPopover.openBy(oEvent.getSource());
      },
      onShowBranchData: function () {
        this.getRouter().navTo("BranchWiseProgress");
      },

      onSubmit: function () {
        // Get the data entered in the popover
        // var oModel = this.getView().getModel();
        // var oData = oModel.getData();

        // console.log("Title:", oData.title);
        // console.log("Description:", oData.description);
        // console.log("Phone:", oData.phone);
        // console.log("Email:", oData.email);
        // console.log("Priority:", oData.priority);

        // Close the popover after submission
        this._oPopover.close();
      },

      handleEmailPress: function (oEvent) {
        this.byId("myPopover").close();
        MessageToast.show("E-Mail has been sent");
      },

      onPressEnvironment: function () {
        this.getRouter().navTo("EnvironmentAnalytics");
      },
      onPressEmissions: function () {
        this.getRouter().navTo("ReportingTiles", {
          module: "Environment"
        });
      },
      onPressSocial: function () {
        this.getRouter().navTo("ReportingTiles", {
          module: "Social"
        });
      },
      onPressGovernance: function () {
        this.getRouter().navTo("ReportingTiles", {
          module: "Governance"
        });
      },
      onPressESGOverview: function () {
        this.getRouter().navTo("ESGOverview");
      },
      onPressManagers: function () {
        this.getRouter().navTo("AddManagers");
      },
      onPressFactor: function () {
        this.getRouter().navTo("ManageFactors");
      },
      onPressCycle: function () {
        this.getRouter().navTo("ReportingCycle");
      },

    });
  }
);
