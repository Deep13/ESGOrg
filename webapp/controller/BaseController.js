sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History"],
  function (Controller, JSONModel, History) {
    "use strict";

    return Controller.extend("ESGOrg.ESGOrg.controller.BaseController", {
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       * @memberOf RecieptApp.RecieptApp.view.ClientPayment
       */
      onInit: function () {
      },
      getRouter: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        return oRouter;
      },
      checkgetUserLog: function () {
        var that = this;
        return new Promise((resolve, reject) => {


          sap.ui.core.BusyIndicator.show();
          firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
              console.log("Document data:", user);

              var domain = user.email.split("@");
              const docMasterRef = firebase.firestore().collection(domain[1]).doc("Master Data");
              docMasterRef.get().then((doc) => {
                if (doc.exists) {
                  that.setMaster(doc.data());
                  const docRef = firebase.firestore().collection(domain[1]).doc("Master Data").collection("Employees").doc(user.uid);
                  docRef.get().then((doc) => {
                    if (doc.exists) {
                      console.log("Document data:", doc.data());
                      that.setUser(doc.data());
                      resolve(doc.data());
                      sap.ui.core.BusyIndicator.hide();
                    } else {
                      // doc.data() will be undefined in this case
                      that.setUser(undefined)
                      console.log("No such document!");
                      that.getRouter().navTo("Login");
                      sap.ui.core.BusyIndicator.hide();
                      reject();
                    }
                  }).catch((error) => {
                    that.setUser(undefined)

                    console.log("Error getting document:", error);
                    that.getRouter().navTo("Login");
                    sap.ui.core.BusyIndicator.hide();
                    reject();
                  });
                } else {
                  // doc.data() will be undefined in this case
                  that.setMaster(undefined);
                  console.log("Error getting document:", error);
                  that.getRouter().navTo("Login");
                  sap.ui.core.BusyIndicator.hide();
                  reject();
                }
              }).catch((error) => {
                that.setMaster(undefined);
                console.log("Error getting document:", error);
                that.getRouter().navTo("Login");
                sap.ui.core.BusyIndicator.hide();
                reject();
              });



              // ...
            } else {
              that.setMaster(undefined)
              that.setUser(undefined)

              that.getRouter().navTo("Login");
              sap.ui.core.BusyIndicator.hide();
              reject();
            }
          });


        })


      },

      setUser: function (val) {
        this.userData = val
      },
      setMaster: function (val) {
        this.MasterData = val;
      },
      getUser: function () {
        return this.userData;
      },
      getMaster: function () {
        return this.MasterData;

      },
      setSheets: function (data) {
        this.reportingSheets = data
      },
      getSheets: async function (user) {
        var that = this;
        return await new Promise((resolve, reject) => {
          if (!this.reportingSheets) {

            const docRef = firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Master Data").doc("ReportingSheets");
            docRef.get().then((doc) => {
              if (doc.exists) {
                var data = doc.data();
                var Emissions = [];
                var Social = [];
                var Governance = [];

                // Iterate through the data array
                data.complianceData.forEach(function (item) {
                  // Check if enabled is true, and push the sheetName to the respective array based on complianceType
                  if (item.enabled) {
                    if (item.complianceType === "Emissions") {
                      Emissions.push(item.sheetName);
                    } else if (item.complianceType === "Social") {
                      Social.push(item.sheetName);
                    } else if (item.complianceType === "Governance") {
                      Governance.push(item.sheetName);
                    }
                  }
                });
                that.reportingSheets = { Emissions, Social, Governance }
                return resolve(that.reportingSheets)
              } else {
                that.reportingSheets = undefined
                return resolve(that.reportingSheets)
              }
            }).catch((error) => {
              that.reportingSheets = undefined
              return resolve(that.reportingSheets)
            });
          }
          else {
            return resolve(that.reportingSheets)
          }

        })
      },
      getIconMap: function (module) {
        var iconMap = {
          "Emissions": {
            "Fuel": "sap-icon://mileage",
            "Bioenergy": "sap-icon://e-care",
            "Refrigerant and other": "sap-icon://fridge",
            "Elec heat cooling": "sap-icon://temperature",
            "Owned Vehicles": "sap-icon://car-rental",
            "Materials": "sap-icon://supplier",
            "WTT- fuels": "sap-icon://mileage",
            "Waste Disposal": "sap-icon://delete",
            "Flight": "sap-icon://flight",
            "Accommodation": "sap-icon://home",
            "Business travel - land and sea": "sap-icon://bus-public-transport",
            "Freighting goods": "sap-icon://cargo-train",
            "Employees commuting": "sap-icon://employee",
            "Food": "sap-icon://meal",
            "Home Office": "sap-icon://laptop",
            "Water": "sap-icon://paint-bucket"
          },
          "Governance": {
            "Entity": "sap-icon://building",
            "Eco. Performance": "sap-icon://business-objects-experience",
            "Market Presence": "sap-icon://marketing-campaign"
          },
          "Social": {
            "Employment": "sap-icon://person-placeholder",
            "Leave": "sap-icon://calendar",
            "Retention": "sap-icon://attachment-photo",
            "OH and S": "sap-icon://nutrition-activity",
            "Training and Edu": "sap-icon://education",
            "Child Labor": "sap-icon://family-care",
            "Customer Privacy": "sap-icon://locked",
            "Mktg and Labelling": "sap-icon://tag",
            "CHS": "sap-icon://business-objects-experience",
            "Social Benefits": "sap-icon://group"
          }
        };

        return iconMap[module];
      },
      getColumns: function (module) {
        var columns = {
          "Fuel": [
            { "title": "Scope", "editable": false },
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Bioenergy": [
            { "title": "Scope", "editable": false },
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Refrigerant and other": [
            { "title": "Scope", "editable": false },
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Elec heat cooling": [
            { "title": "Scope", "editable": false },
            { "title": "Activity", "editable": false },
            { "title": "Country-Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "GEF Factors", "editable": true },
            { "title": "T&D Factors", "editable": true }
          ],
          "Owned Vehicles": [
            { "title": "Scope", "editable": false },
            { "title": "Level 1", "editable": false },
            { "title": "Level 2", "editable": false },
            { "title": "Level 3", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Distance (km)", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Materials": [
            { "title": "Scope", "editable": false },
            { "title": "Activity", "editable": false },
            { "title": "Waste type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount (tonnes)", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "WTT- fuels": [
            { "title": "Scope", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Waste Disposal": [
            { "title": "Scope", "editable": false },
            { "title": "Activity", "editable": false },
            { "title": "Waste Material", "editable": false },
            { "title": "Source Description", "editable": false },
            { "title": "Disposal Method", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Weight", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Flight": [
            { "title": "Scope", "editable": false },
            { "title": "Origin (city or IATA code)", "editable": false },
            { "title": "Destination (city or IATA code)", "editable": false },
            { "title": "Class", "editable": false },
            { "title": "Single way / return", "editable": false },
            { "title": "kg CO2e", "editable": false }
          ],
          "Accommodation": [
            { "title": "Country", "editable": false },
            { "title": "Number of occupied rooms", "editable": true },
            { "title": "Number of nights per room", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Business travel - land and sea": [
            { "title": "Scope", "editable": false },
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Total distance", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Freighting goods": [
            { "title": "Scope", "editable": false },
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Weight (tonnes)", "editable": true },
            { "title": "Distance (km)", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Employees commuting": [
            { "title": "Scope", "editable": false },
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Total distance", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Food": [
            { "title": "Meal Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Home Office": [
            { "title": "Type of home office", "editable": false },
            { "title": "Number of employees", "editable": true },
            { "title": "Working regime (For full-time: 100%)", "editable": true },
            { "title": "% working from home (e.g. 50% from home)", "editable": true },
            { "title": "Number of months", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Water": [
            { "title": "Scope", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Source", "editable": true },
            { "title": "Amount", "editable": true },
            { "title": "Factor", "editable": true }
          ],
          "Employment": [
            { "title": "Employment Type", "editable": false },
            { "title": "Category", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Count", "editable": true }
          ],
          "Leave": [
            { "title": "Framework", "editable": false },
            { "title": "Type of Leave", "editable": false },
            { "title": "Duration in Days", "editable": true },
            { "title": "Count of Employees", "editable": true }
          ],
          "Retention": [
            { "title": "Framework", "editable": false },
            { "title": "Employee Type", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Tenure", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Count", "editable": true }
          ],
          "OH and S": [
            { "title": "Framework", "editable": false },
            { "title": "Injury Type", "editable": false },
            { "title": "Number of Incidents", "editable": true },
            { "title": "Gender", "editable": false },
            { "title": "Count of Persons", "editable": true }
          ],
          "Training and Edu": [
            { "title": "Framework", "editable": false },
            { "title": "Types of training", "editable": false },
            { "title": "Avg Hours per batch", "editable": true },
            { "title": "No. of employees", "editable": true },
            { "title": "Financial investment", "editable": true },
            { "title": "Segment", "editable": false }
          ],
          "Child Labor": [
            { "title": "Framework", "editable": false },
            { "title": "Supplier Name", "editable": false },
            { "title": "Risk Level", "editable": false },
            { "title": "No. of Incidents reported", "editable": true }
          ],
          "Customer Privacy": [
            { "title": "Framework", "editable": false },
            { "title": "Nature of Complaints", "editable": false },
            { "title": "No. of complaints received", "editable": true },
            { "title": "No. of complaints solved", "editable": true }
          ],
          "Mktg & Labelling": [
            { "title": "Framework", "editable": false },
            { "title": "Incident", "editable": false },
            { "title": "No. of non-compliance Incidents", "editable": true },
            { "title": "No. of times regulation violated", "editable": true }
          ],
          "CHS": [
            { "title": "Framework", "editable": false },
            { "title": "Type of Incident", "editable": false },
            { "title": "No. of non-compliance Incidents", "editable": true },
            { "title": "Customers Impacted", "editable": true }
          ],
          "Social Benefits": [
            { "title": "Framework", "editable": false },
            { "title": "Program name", "editable": false },
            { "title": "Domain", "editable": false },
            { "title": "No. of Beneficiaries", "editable": true },
            { "title": "Expenditure", "editable": true }
          ],
          "Entity": [
            { "title": "Framework", "editable": false },
            { "title": "Entity Type", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Tenure", "editable": false },
            { "title": "Count", "editable": true }
          ],
          "Eco. Performance": [
            { "title": "Framework", "editable": false },
            { "title": "Data", "editable": false },
            { "title": "Values", "editable": true }
          ],
          "Market Presence": [
            { "title": "Framework", "editable": false },
            { "title": "Data", "editable": false },
            { "title": "Values", "editable": true }
          ]
        };

        return columns[module];
      },
      getVariantData: function (module) {
        var variantMap = {
          "Fuel": [
            {
              "Reference": 7,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "CNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 11,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "LNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 15,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "LPG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 19,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Natural gas",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 2779,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Natural gas (100% mineral blend)",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 23,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Other petroleum gas",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 31,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Aviation spirit",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 35,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Aviation turbine fuel",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 39,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Burning oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 43,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Diesel (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 47,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Diesel (100% mineral diesel)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 51,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 55,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 59,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Lubricants",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 63,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Naphtha",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 71,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Petrol (100% mineral petrol)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 75,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Processed fuel oils - residual oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 79,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Processed fuel oils - distillate oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 87,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Waste oils",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 91,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Marine gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 95,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Marine fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 99,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (industrial)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 102,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (electricity generation)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 105,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (domestic)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 108,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coking coal",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 111,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Petroleum coke",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 114,
              "Scope": "Scope 1",
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (electricity generation - home produced coal only)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            }
          ],
          "Bioenergy": [
            {
              "Amount": "",
              "Factor": "",
              "Reference": 117,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Bioethanol",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 120,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 126,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME (from used cooking oil)",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 129,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME (from tallow)",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 143,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood logs",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 145,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood chips",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 147,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood pellets",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 149,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Grass/straw",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 151,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biogas",
              "Fuel": "Biogas",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 153,
              "Scope": "Scope 1",
              "Fuels": "Bioenergy",
              "Type": "Biogas",
              "Fuel": "Landfill gas",
              "Unit": "tonnes"
            }
          ],
          "Refrigerant and other": [
            {
              "Reference": "154",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Carbon dioxide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "155",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Methane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "156",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Nitrous oxide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "157",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-23",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "158",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-32",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "159",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-41",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "160",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-125",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "161",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-134",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "162",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-134a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "163",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-143",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "164",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-143a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "165",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-152a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "166",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-227ea",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "167",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236fa",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "168",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-245fa",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "169",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-43-I0mee",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "170",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoromethane (PFC-14)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "171",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoroethane (PFC-116)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "172",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoropropane (PFC-218)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "173",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorocyclobutane (PFC-318)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "174",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorobutane (PFC-3-1-10)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "175",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoropentane (PFC-4-1-12)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "176",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorohexane (PFC-5-1-14)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "177",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Sulphur hexafluoride (SF6)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "178",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-152",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "179",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-161",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "180",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236cb",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "181",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236ea",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "182",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-245ca",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "183",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-365mfc",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "184",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R404A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "185",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "186",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407C",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "187",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407F",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "188",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R408A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "189",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R410A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "190",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R507A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "191",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R508B",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "192",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R403A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "193",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-11/R11 = trichlorofluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "194",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-12/R12 = dichlorodifluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "195",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-13",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "196",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-113",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "197",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-114",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "198",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-115",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "199",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-1211",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "200",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-1301",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "201",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-2402",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "202",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Carbon tetrachloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "203",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Methyl bromide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "204",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Methyl chloroform",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "205",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-22/R22 = chlorodifluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "206",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-123",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "207",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-124",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "208",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-141b",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "209",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-142b",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "210",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-225ca",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "211",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-225cb",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "212",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-21",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "213",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Nitrogen trifluoride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "214",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "PFC-9-1-18",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "215",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Trifluoromethyl sulphur pentafluoride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "216",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Perfluorocyclopropane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "217",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-125",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "218",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-134",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "219",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-143a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "220",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HCFE-235da2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "221",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-245cb2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "222",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-245fa2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "223",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-254cb2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "224",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-347mcc3",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "225",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-347pcf2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "226",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-356pcc3",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "227",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-449sl (HFE-7100)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "228",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-569sf2 (HFE-7200)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "229",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-43-10pccc124 (H-Galden1040x)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "230",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-236ca12 (HG-10)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "231",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-338pcc13 (HG-01)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "232",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "PFPMIE",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "233",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Dimethylether",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "234",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Methylene chloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "235",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Methyl chloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "236",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "R290 = propane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "237",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "R600A = isobutane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "240",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - blends",
              "Fuel": "R406A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "241",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - blends",
              "Fuel": "R409A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "242",
              "Scope": "Scope 1",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - blends",
              "Fuel": "R502",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            }
          ]
          ,
          "Elec heat cooling": [
            {
              "Reference": 2938,
              "Reference 2": 814,
              "Scope": "Scope 2",
              "Activity": "Electricity",
              "Country-Type": "India",
              "Unit": "kWh",
              "Amount": null,
              "GEF Factors": null,
              "T&D Factors": null
            },
            {
              "Reference": 667,
              "Reference 2": 815,
              "Scope": "Scope 2",
              "Activity": "Heat and steam",
              "Country-Type": "District heat and steam",
              "Unit": "kWh",
              "Amount": null,
              "GEF Factors": null,
              "T&D Factors": null
            },
            {
              "Reference": 3172,
              "Reference 2": null,
              "Scope": "Scope 2",
              "Activity": "District cooling",
              "Country-Type": "India",
              "Unit": "Ton of refrigeration",
              "Amount": null,
              "GEF Factors": null,
              "T&D Factors": null
            },
            {
              "Reference": 2938,
              "Reference 2": 814,
              "Scope": "Scope 2",
              "Activity": "Electricity - Backup",
              "Country-Type": "India",
              "Unit": "kWh",
              "Amount": null,
              "GEF Factors": null,
              "T&D Factors": null
            }
          ],
          "Owned Vehicles": [
            {
              "Reference": "626",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "628",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "630",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "632",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "634",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "636",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "638",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "640",
              "Scope": "Scope 2",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "333",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "335",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "337",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "343",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "349",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "351",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "353",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "355",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "357",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "359",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "365",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "367",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "369",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "371",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "373",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "375",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "381",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "383",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "385",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "387",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "389",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "391",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "397",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Small",
              "Fuel": "",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "399",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "401",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Large",
              "Fuel": "",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "403",
              "Scope": "Scope 1",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Average",
              "Fuel": "",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "645",
              "Scope": "Scope 2",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "651",
              "Scope": "Scope 2",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "657",
              "Scope": "Scope 2",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "663",
              "Scope": "Scope 2",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "405",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "407",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "409",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "411",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "413",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "419",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "421",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "423",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "425",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "427",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "433",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "435",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "437",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "439",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "441",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "447",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "449",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "451",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "453",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "455",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "467",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "475",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "483",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "491",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All rigids",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "499",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "507",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "515",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All artics",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "523",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "531",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "539",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "547",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "555",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All rigids",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "563",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "571",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "579",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All artics",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            },
            {
              "Reference": "587",
              "Scope": "Scope 1",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance": "",
              "Factor": ""
            }
          ],
          "Materials": [
            {
              "Reference": "672",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Aggregates",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "676",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Average construction",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "680",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Asbestos",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "684",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Asphalt",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "688",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Bricks",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "692",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Concrete",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "696",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Insulation",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "700",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Metals",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "708",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Mineral oil",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "712",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Plasterboard",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "716",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Tyres",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "720",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste type": "Wood",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "728",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste type": "Glass",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "732",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste type": "Clothing",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "736",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste type": "Food and drink",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "740",
              "Scope": "Scope 3",
              "Activity": "Organic",
              "Waste type": "Compost derived from garden waste",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "741",
              "Scope": "Scope 3",
              "Activity": "Organic",
              "Waste type": "Compost derived from food and garden waste",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "742",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - fridges and freezers",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "746",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - large",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "750",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - IT",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "754",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - small",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "758",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Batteries - Alkaline",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "762",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Batteries - Li ion",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "766",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste type": "Batteries - NiMh",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "770",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste type": "Metal: aluminium cans and foil (excl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "772",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste type": "Metal: mixed cans",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "774",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste type": "Metal: scrap metal",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "776",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste type": "Metal: steel cans",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "778",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastics",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "781",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastic film",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "784",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastic rigid",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "787",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: HDPE (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "790",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: LDPE and LLDPE (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "793",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: PET (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "796",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: PP (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "799",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: PS (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "802",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste type": "Plastics: PVC (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "805",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste type": "Paper and board: board",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "808",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste type": "Paper and board: mixed",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "811",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste type": "Paper and board: paper",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            }
          ],
          "WTT- fuels": [
            {
              "Reference": "894",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Butane",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "898",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "CNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "902",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "LNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "906",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "LPG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "910",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Natural Gas",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "914",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Other Petroleum Gas",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "918",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Propane",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "922",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Aviation Spirit",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "926",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Aviation Turbine Fuel",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "930",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Burning Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "934",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Diesel (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "938",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Diesel (100% mineral diesel)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "942",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Fuel Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "946",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Gas Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "950",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Lubricants",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "954",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Naphtha",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "958",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Petrol (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "962",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Petrol (100% mineral petrol)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "966",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Processed fuel oils - residual oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "970",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Processed fuel oils - distillate oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "974",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Refinery Miscellaneous",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "978",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Waste oils",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "982",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Marine gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "986",
              "Scope": "Scope 3",
              "Type": "WTT- liquid fuels",
              "Fuel": "Marine fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "2783",
              "Scope": "Scope 3",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Natural gas (100% mineral blend)",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            }
          ],
          "Waste Disposal": [
            {
              "Reference": "2518",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Aggregates",
              "Source Description": "Packaging",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2524",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Average construction",
              "Source Description": "Packaging",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2530",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Asbestos",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2536",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Asphalt",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2542",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Bricks",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2548",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Concrete",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2554",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Insulation",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2560",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Metals",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2566",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Soils",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2572",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Mineral oil",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2578",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Plasterboard",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2584",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Tyres",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2590",
              "Scope": "Scope 3",
              "Activity": "Construction",
              "Waste Material": "Wood",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2596",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste Material": "Books",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2602",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste Material": "Glass",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2608",
              "Scope": "Scope 3",
              "Activity": "Other",
              "Waste Material": "Clothing",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2614",
              "Scope": "Scope 3",
              "Activity": "Refuse",
              "Waste Material": "Household residual waste",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2620",
              "Scope": "Scope 3",
              "Activity": "Refuse",
              "Waste Material": "Organic: food and drink waste",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2626",
              "Scope": "Scope 3",
              "Activity": "Refuse",
              "Waste Material": "Organic: garden waste",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2632",
              "Scope": "Scope 3",
              "Activity": "Refuse",
              "Waste Material": "Organic: mixed food and garden waste",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2638",
              "Scope": "Scope 3",
              "Activity": "Refuse",
              "Waste Material": "Commercial and industrial waste",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2642",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - fridges and freezers",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2646",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - large",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2650",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - mixed",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2654",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - small",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2658",
              "Scope": "Scope 3",
              "Activity": "Electrical items",
              "Waste Material": "Batteries",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2662",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste Material": "Metal: aluminium cans and foil (excl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2666",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste Material": "Metal: mixed cans",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2670",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste Material": "Metal: scrap metal",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2674",
              "Scope": "Scope 3",
              "Activity": "Metal",
              "Waste Material": "Metal: steel cans",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2678",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastics",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2682",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic film",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2686",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic rigid",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2690",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: HDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2694",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: LDPE and LLDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2698",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PET (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2702",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PP (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2706",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PS (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2710",
              "Scope": "Scope 3",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PVC (incl. forming)",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2715",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste Material": "Paper and board: board",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2720",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste Material": "Paper and board: mixed",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2725",
              "Scope": "Scope 3",
              "Activity": "Paper",
              "Waste Material": "Paper and board: paper",
              "Source Description": "",
              "Disposal Method": "",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            }
          ],
          "Flight": [
            {
              "Scope": "Scope 3",
              "Origin (city or IATA code)": "Delhi",
              "Destination (city or IATA code)": "Mumbai",
              "Class": "Economy",
              "Single way / \nreturn": " Single way",
              "kg CO2e": ""
            },
            {
              "Scope": "Scope 3",
              "Origin (city or IATA code)": "Mumbai",
              "Destination (city or IATA code)": "Delhi",
              "Class": "Economy",
              "Single way / \nreturn": " Single way",
              "kg CO2e": ""
            }
          ],
          "Accommodation": [
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            },
            {
              "Reference": 2806,
              "Country": "India",
              "Number of occupied rooms": "",
              "Number of nights per room": "",
              "Factor": ""
            }
          ],
          "Business travel - land and sea": [
            {
              "Reference": "1850",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1866",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1882",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1898",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1842",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1858",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1874",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1890",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1836",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1852",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1868",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1884",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1840",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1856",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1872",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1888",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1844",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1860",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1876",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1892",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1838",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1854",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1870",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1886",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1848",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1864",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1880",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1896",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1846",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1862",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1878",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1894",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1743",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Foot passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1744",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Car passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1745",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Average (all passenger)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1900",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Small",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1902",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1904",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Large",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1906",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Average",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1908",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1909",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1910",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1911",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1912",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Local bus (not London)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1913",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Local London bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1914",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Average local bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1915",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Coach",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1916",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "National rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1917",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "International rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1918",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "Light rail and tram",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1919",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "London Underground",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            }
          ],
          "Freighting goods": [
            {
              "Reference": "2177",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "Diesel",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2180",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "Petrol",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2183",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "CNG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2186",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "LPG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2189",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "Unknown",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2192",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2195",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class I (up to 1.305 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2198",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Diesel",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2201",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Petrol",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2204",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "CNG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2207",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "LPG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2210",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Unknown",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2213",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2216",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2219",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2222",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2225",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2228",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2231",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2234",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2237",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2240",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2243",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2246",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2249",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2252",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2255",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2258",
              "Scope": "Scope 3",
              "Vehicle": "Vans",
              "Type": "Average (up to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2270",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2282",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2294",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2306",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "All rigids",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2318",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2330",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2342",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "All artics",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2354",
              "Scope": "Scope 3",
              "Vehicle": "HGV (all diesel)",
              "Type": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2366",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2378",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2390",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2402",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "All rigids",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2414",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2426",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2438",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "All artics",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2450",
              "Scope": "Scope 3",
              "Vehicle": "HGV refrigerated (all diesel)",
              "Type": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2451",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Domestic, to/from UK",
              "Fuel": "With RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2452",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Domestic, to/from UK",
              "Fuel": "Without RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2453",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Short-haul, to/from UK",
              "Fuel": "With RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2454",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Short-haul, to/from UK",
              "Fuel": "Without RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2455",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Long-haul, to/from UK",
              "Fuel": "With RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2456",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "Long-haul, to/from UK",
              "Fuel": "Without RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2457",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "International, to/from non-UK",
              "Fuel": "With RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2458",
              "Scope": "Scope 3",
              "Vehicle": "Freight flights",
              "Type": "International, to/from non-UK",
              "Fuel": "Without RF",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2459",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "Freight train",
              "Fuel": "",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2460",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "200,000+ dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2461",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "120,000–199,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2462",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "80,000–119,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2463",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "60,000–79,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2464",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "10,000–59,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2465",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "0–9999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2466",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Crude tanker",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2467",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "60,000+ dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2468",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "20,000–59,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2469",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "10,000–19,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2470",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "5000–9999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2471",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "0–4999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2472",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Products tanker ",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2473",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Chemical tanker ",
              "Fuel": "20,000+ dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2474",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Chemical tanker ",
              "Fuel": "10,000–19,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2475",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Chemical tanker ",
              "Fuel": "5000–9999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2476",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Chemical tanker ",
              "Fuel": "0–4999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2477",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "Chemical tanker ",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2478",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LNG tanker",
              "Fuel": "200,000+ m3",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2479",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LNG tanker",
              "Fuel": "0–199,999 m3",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2480",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LNG tanker",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2481",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LPG Tanker",
              "Fuel": "50,000+ m3",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2482",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LPG Tanker",
              "Fuel": "0–49,999 m3",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2483",
              "Scope": "Scope 3",
              "Vehicle": "Sea tanker",
              "Type": "LPG Tanker",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2484",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "200,000+ dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2485",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "100,000–199,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2486",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "60,000–99,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2487",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "35,000–59,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2488",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "10,000–34,999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2489",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "0–9999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2490",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Bulk carrier",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2491",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "10,000+ dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2492",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "5000–9999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2493",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "0–4999 dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2494",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "10,000+ dwt 100+ TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2495",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "5000–9999 dwt 100+ TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2496",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "0–4999 dwt 100+ TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2497",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "General cargo",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2498",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "8000+ TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2499",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "5000–7999 TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2500",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "3000–4999 TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2501",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "2000–2999 TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2502",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "1000–1999 TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2503",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "0–999 TEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2504",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Container ship",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2505",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Vehicle transport",
              "Fuel": "4000+ CEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2506",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Vehicle transport",
              "Fuel": "0–3999 CEU",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2507",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Vehicle transport",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2508",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "RoRo-Ferry",
              "Fuel": "2000+ LM",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2509",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "RoRo-Ferry",
              "Fuel": "0–1999 LM",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2510",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "RoRo-Ferry",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2511",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Large RoPax ferry",
              "Fuel": "Average",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Reference": "2512",
              "Scope": "Scope 3",
              "Vehicle": "Cargo ship",
              "Type": "Refrigerated cargo",
              "Fuel": " All dwt",
              "Unit": "tonne.km",
              "Weight (tonnes)": "",
              "Distance (km)": "",
              "Factor": ""
            }
          ],
          "Employees commuting": [
            {
              "Reference": "1850",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1866",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1882",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1898",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1842",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1858",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1874",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1890",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1836",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1852",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1868",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1884",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1840",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1856",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1872",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1888",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1844",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1860",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1876",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1892",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1838",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1854",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1870",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1886",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1848",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1864",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1880",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1896",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1846",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1862",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1878",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1894",
              "Scope": "Scope 3",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1743",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Foot passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1744",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Car passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1745",
              "Scope": "Scope 3",
              "Vehicle": "Ferry",
              "Type": "Average (all passenger)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1900",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Small",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1902",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1904",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Large",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1906",
              "Scope": "Scope 3",
              "Vehicle": "Motorbike",
              "Type": "Average",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1908",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1909",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1910",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1911",
              "Scope": "Scope 3",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1912",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Local bus (not London)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1913",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Local London bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1914",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Average local bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1915",
              "Scope": "Scope 3",
              "Vehicle": "Bus",
              "Type": "Coach",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1916",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "National rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1917",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "International rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1918",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "Light rail and tram",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1919",
              "Scope": "Scope 3",
              "Vehicle": "Rail",
              "Type": "London Underground",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            }
          ],
          "Food": [
            {
              "Meal Type": "1 standard breakfast",
              "Unit": "breakfast",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "1 gourmet breakfast",
              "Unit": "breakfast",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "1 cold or hot snack",
              "Unit": "hot snack",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "1 average meal",
              "Unit": "meal",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Non-alcoholic beverage",
              "Unit": "litre",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Alcoholic beverage",
              "Unit": "litre",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "1 hot snack (burger + frites)",
              "Unit": "hot snack",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "1 sandwich",
              "Unit": "sandwich",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Meal, vegan",
              "Unit": "meal",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Meal, vegetarian",
              "Unit": "meal",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Meal, with beef",
              "Unit": "meal",
              "Amount": "",
              "Factor": ""
            },
            {
              "Meal Type": "Meal, with chicken",
              "Unit": "meal",
              "Amount": "",
              "Factor": ""
            }
          ],
          "Home Office": [
            {
              "Type of home office": "With cooling",
              "Number of employees": "",
              "Working regime (For full-time: 100%)": "",
              "% working from home": "",
              "Number of months": "",
              "Factor": ""
            },
            {
              "Type of home office": "No heating/No cooling",
              "Number of employees": "",
              "Working regime (For full-time: 100%)": "",
              "% working from home": "",
              "Number of months": "",
              "Factor": ""
            },
            {
              "Type of home office": "With heating",
              "Number of employees": "",
              "Working regime (For full-time: 100%)": "",
              "% working from home": "",
              "Number of months": "",
              "Factor": ""
            }
          ],
          "Water": [
            {
              "Reference": "668",
              "Scope": "Scope 3",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "670",
              "Scope": "Scope 3",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "",
              "Amount": "",
              "Factor": ""
            }
          ],

          "Entity": [
            {
              "Framework": "GRI",
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Entity Type": "CFO/CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1-2 years",
              "Count": ""
            },
            {
              "Framework": "GRI",
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1-2 years",
              "Count": ""
            },
            {
              "Framework": "GRI",
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1-2 years",
              "Count": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1-2 years",
              "Count": ""
            },
            {
              "Framework": "GRI",
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1-2 years",
              "Count": ""
            }
          ]
          ,
          "Eco. Performance": [
            {
              "Framework": "GRI,BRSR",
              "Data": "Total turnover",
              "Values": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "Total Revenue",
              "Values": ""
            },
            {
              "Framework": "GRI",
              "Data": "Direct economic value generated",
              "Values": ""
            },
            {
              "Framework": "GRI",
              "Data": "Direct economic value Distributed",
              "Values": ""
            },
            {
              "Framework": "GRI",
              "Data": "Financial assistance received from governments",
              "Values": ""
            },
            {
              "Framework": "GRI",
              "Data": "Remuneration ratio of BOD vs Employee",
              "Values": ""
            }
          ],
          "Market Presence": [
            {
              "Framework": "GRI,BRSR",
              "Data": "Entry level wage",
              "Values": "1"
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "Minimum level wage",
              "Values": "2"
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "Ratio of entry to minimum wage",
              "Values": "3"
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "No of presence in national level",
              "Values": "4"
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "No.of offices in International level",
              "Values": "5"
            },
            {
              "Framework": "GRI,BRSR",
              "Data": "currently presence in states",
              "Values": "6"
            }
          ],

          "Employment": [
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "",
              "Gender": "",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "",
              "Gender": "",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Employees",
              "Category": "",
              "Gender": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employment Type": "Workers",
              "Category": "",
              "Gender": "",
              "Age": "",
              "Count": ""
            }
          ],
          "Leave": [
            {
              "Framework": "GRI,BRSR",
              "Type of Leave": "Sick leave",
              "Duration in Days": "",
              "Count of Employees": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Leave": "Paternity leave",
              "Duration in Days": "",
              "Count of Employees": ""
            }
          ],
          "Retention": [
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Temporary Employee",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Workers",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "BOD",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            },
            {
              "Framework": "",
              "Employee Type": "Employees",
              "Gender": "",
              "Tenure": "",
              "Age": "",
              "Count": ""
            }
          ]
          ,
          "OH and S": [
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Slips, Trips, and Falls",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Cuts and Lacerations",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Overexertion Injuries",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Contact with Objects and Equipment",
              "Number of Incidents": "",
              "Gender": "",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Fires and Explosions",
              "Number of Incidents": "",
              "Gender": "",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Exposure to Hazardous Materials",
              "Number of Incidents": "",
              "Gender": "",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Accident during Business Travel",
              "Number of Incidents": "",
              "Gender": "",
              "Count of Persons": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Injury Type": "Accident during workplace commute",
              "Number of Incidents": "",
              "Gender": "",
              "Count of Persons": ""
            }
          ]
          ,
          "Training and Edu": [
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Employee health & safety training",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "BOD"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Employee Skill Upgradation Training",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "Key management personnel"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Onboarding and orientation",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "Workers"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Technical Training",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "Others"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Corporate Training",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "Employees"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Anti-corruption Training",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "BOD"
            },
            {
              "Framework": "GRI,BRSR",
              "Types of training": "Other",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
              "Segment": "BOD"
            }
          ]
          ,
          "Child Labor": [
            {
              "Framework": "GRI,BRSR",
              "Supplier Name": "M/S Dev & sons",
              "Risk Level": "Uncertain",
              "No. of Incidents reported": ""
            }
          ]
          ,
          "Customer Privacy": [
            {
              "Framework": "GRI,BRSR",
              "Nature of Complaints": "Data Breaches",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Nature of Complaints": "Data Leaks",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Nature of Complaints": "Unauthorized Data Collection or Use",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Nature of Complaints": "Difficulties Accessing or Controlling Personal Data",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            }
          ]
          ,
          "Mktg and Labelling": [
            {
              "Framework": "GRI",
              "Incident": "Comparative Advertising",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Consumer Protection",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "False Advertising and Misleading Claims",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Greenwashing",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Health and Wellness Claims",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Labeling Compliance",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Product Liability",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Framework": "GRI",
              "Incident": "Trademark and Intellectual Property",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            }
          ]
          ,
          "CHS": [
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Product defects or malfunctions",
              "No.of non-compliance Incident": 1,
              "Customers Impacted": 10
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Safety hazards",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Injuries or illnesses",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Product recalls",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Errors or omissions in service delivery",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Inadequate customer support",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Security incidents",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Framework": "GRI,BRSR",
              "Type of Incident": "Others",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            }
          ]
          ,
          "Social Benefits": [
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Plantation"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Livlihoods"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Education"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Rain water harvesting"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Renewable energy"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Training and Awareness"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Forestry"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Natural Farming"
            },
            {
              "Framework": "GRI,BRSR",
              "Initiative": "Plantation Drive",
              "Type": "Food Safety"
            }
          ]

        };

        return variantMap[module];
      },
      onpressBack: function (oEvent) {
        const oHistory = History.getInstance();
        const sPreviousHash = oHistory.getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
          this.oRouter.navTo("Main");
        }

      },
      onLogOut: function () {
        firebase.auth().signOut();
        this.MasterData = undefined;
        this.userData = undefined;
        this.getRouter().navTo("Login")
      },

    });
  }
);
