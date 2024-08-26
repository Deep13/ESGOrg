sap.ui.define(
  ["../controller/BaseController", "sap/m/MessageStrip"],
  function (Controller, MessageStrip) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.Main", {
      onInit: function () {

        this.getRouter()
          .getRoute("Main")
          .attachPatternMatched(this._handleRouteMatched, this);
      },
      _handleRouteMatched: function (oEvent) {
        var that = this;
        this.checkgetUserLog().then(user => {
          that.getView().byId("user").setText("Welcome, " + user.email);
        });

        var data = [
          {
            name: "Fuels",
            type: "dropdown",
            dropdownValues: ["Fuels", "Bioenergy", "Refrigerant & other"]
          },
          {
            name: "Type",
            type: "dropdown",
            dropdownValues: ["Gaseous fuels", "Liquid fuels", "Kyoto protocol - standard", "Solid fuels"]
          },
          {
            name: "Fuel",
            type: "dropdown",
            dropdownValues: ["CNG", "LNG", "LPG"]
          },
          {
            name: "Unit",
            type: "dropdown",
            dropdownValues: ["litres", "cubic metres", "tonnes"]
          }, {
            name: "Amount",
            type: "text",
          }, {
            name: "Factor",
            type: "text",
          }
        ]


      },


      onRenderPL: function () {
        var ctx = document.getElementById("myPLChart").getContext("2d");
        var myChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ['50+', '35-50', 'Less than 22', "22 to 35"],
            datasets: [
              {
                data: [52.6, 36.8, 7.9, 2.6],
                backgroundColor: ["#1977d3", "#b81d1c", "#ffb300", "#378f3c"]
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                position: 'bottom' // Position the legend at the bottom
              },
              // title: {
              //   display: true,
              //   text: 'Age Distribution in Percentage' // Title of the chart
              // },
            }
          }
        });
      },

      onRenderMF: function () {
        var ctx = document.getElementById("myMFChart").getContext("2d");
        var myChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ['Male', 'Female', 'Others'],
            datasets: [
              {
                data: [52.6, 44.7, 2.6],
                backgroundColor: ["#1977d3", "#b81d1c", "#ffb300"]
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                position: 'bottom' // Position the legend at the bottom
              },
              // title: {
              //   display: true,
              //   text: 'Age Distribution in Percentage' // Title of the chart
              // },
            }
          }
        });
      },

      onRenderScope: function () {
        var ctx = document.getElementById("myScopeChart").getContext("2d");
        var myChart = new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ['Scope 1', 'Scope 2', 'Scope 3'],
            datasets: [
              {
                data: [88, 0, 12],
                backgroundColor: ["#1977d3", "#b81d1c", "#ffb300"]
              },
            ],
          },
          options: {
            plugins: {
              legend: {
                position: 'bottom' // Position the legend at the bottom
              },
              // title: {
              //   display: true,
              //   text: 'Age Distribution in Percentage' // Title of the chart
              // },
            }
          }
        });
      },

      onLogOut: function () {
        this.logOut();
      },
      onPressEnvironment: function () {
        this.getRouter().navTo("EnvironmentAnalytics");
      },
      onPressEmissions: function () {
        this.getRouter().navTo("EmmissionsReporting");
      },
      onPressSocial: function () {
        this.getRouter().navTo("SocialReporting");
      },
      onPressGovernance: function () {
        this.getRouter().navTo("GovernanceReporting");
      },


    });
  }
);
