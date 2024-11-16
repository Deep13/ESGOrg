sap.ui.define(
  ["sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/ui/core/routing/History", "sap/m/Popover",
    "sap/m/Input",
    "sap/m/TextArea",
    "sap/m/Select",
    "sap/m/Button",
    "sap/ui/core/Item", "sap/m/MessageBox"],
  function (Controller, JSONModel, History, Popover, Input, TextArea, Select, Button, Item, MessageBox) {
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
        var isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        if (isMobileDevice) {
          var msg = 'Application Not Supported on Mobile Devices, Please open this application on a laptop or desktop for the best experience.';
          sap.m.MessageBox.error(
            msg,
            {
              title: "Unsupported Device",
              onClose: function () {
                // Navigate to the specified website on close of the message box
                window.location.href = "https://www.koshishindia.in/";
              }
            }
          );
        } else {
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
                    const docRef = firebase.firestore().collection(domain[1]).doc("Master Data").collection("Employees").where("userId", "==", user.uid);
                    docRef.get().then((querySnapshot) => {
                      querySnapshot.forEach(function (doc) {
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
                      });
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
        }



      },
      onOpenPopover: function (oEvent) {
        // Create a new Popover
        if (this._oPopover) {
          this._oPopover.destroy();

        }
        if (sap.ui.getCore().byId("incidentId")) {
          sap.ui.getCore().byId("incidentId").destroy()

        }
        var user = this.userData;


        this._oPopover = new Popover({
          id: "incidentId",
          title: "Raise Incident",
          contentWidth: "300px",
          placement: "Bottom",
          modal: true,
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
              forceSelection: false,
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
              }),
              new Button({
                text: "Close",
                type: "Transparent",
                press: this.closePopover.bind(this)
              })
            ]
          })
        });
        this._oPopover.addStyleClass("sapUiResponsivePadding")
        // Bind popover to the current view model
        this.getView().addDependent(this._oPopover);
        var ajson = new JSONModel({ phone: user.phone, email: user.email });
        this._oPopover.setModel(ajson)

        // Open the popover next to the triggering button
        this._oPopover.openBy(oEvent.getSource());
      },
      onSubmit: function () {
        // Get the data entered in the popover
        // var oModel = this.getView().getModel();
        var that = this;
        var oData = sap.ui.getCore().byId("incidentId").getModel().getData();
        var user = this.userData;
        var master = this.MasterData;
        var incidentID = this.generateIncidentIdWithKeyword();
        if (oData.title && oData.description && oData.phone && oData.email) {
          var sendData = { incidentID: incidentID, "priority": oData.priority, "orgID": user.domain, "email": oData.email, "status": "New", "title": oData.title, "description": oData.description, "orgName": master.organisationName, "createdDate": new Date().toLocaleDateString(), "phone": oData.phone };
          sap.ui.core.BusyIndicator.show();
          firebase.firestore().collection("Incidents").doc().set(sendData, { merge: true })
            .then(() => {
              MessageBox.success("Incident Report sent");
              sap.ui.core.BusyIndicator.hide();
              that._oPopover.destroy();
            })
            .catch((error) => {
              sap.ui.core.BusyIndicator.hide();

              MessageBox.error("Error writing document: " + error);
            });
        }
        else {
          MessageBox.error("All fields are mandatory");
        }

      },
      closePopover: function () {
        this._oPopover.destroy();
      },
      generateIncidentIdWithKeyword: function () {
        var now = new Date();
        var timestamp = now.getFullYear() +
          ("0" + (now.getMonth() + 1)).slice(-2) +  // Month with leading zero
          ("0" + now.getDate()).slice(-2) +         // Day with leading zero
          ("0" + now.getHours()).slice(-2) +        // Hours with leading zero
          ("0" + now.getMinutes()).slice(-2) +      // Minutes with leading zero
          ("0" + now.getSeconds()).slice(-2);       // Seconds with leading zero

        return "ESGKOSH-" + timestamp;  // Generate ID like 'ESGKOSH-20241012123045'
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
                var Environment = [];
                var Social = [];
                var Governance = [];

                // Iterate through the data array
                data.complianceData.forEach(function (item) {
                  // Check if enabled is true, and push the sheetName to the respective array based on complianceType
                  // if (item.enabled) {
                  if (item.complianceType === "Environment") {
                    Environment.push(item.sheetName);
                  } else if (item.complianceType === "Social") {
                    Social.push(item.sheetName);
                  } else if (item.complianceType === "Governance") {
                    Governance.push(item.sheetName);
                  }
                  // }
                });
                that.reportingSheets = { Environment, Social, Governance }
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
          "Environment": {
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
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Bioenergy": [
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Refrigerant and other": [
            { "title": "Fuels", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Elec heat cooling": [
            { "title": "Activity", "editable": false },
            { "title": "Country-Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "GEF Factors", "editable": true, "type": "Number" },
            { "title": "T&D Factors", "editable": true, "type": "Number" }
          ],
          "Owned Vehicles": [
            { "title": "Scope", "editable": false },
            { "title": "Level 1", "editable": false },
            { "title": "Level 2", "editable": false },
            { "title": "Level 3", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Distance (km)", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Materials": [
            { "title": "Activity", "editable": false },
            { "title": "Waste type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount (tonnes)", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "WTT- fuels": [
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Waste Disposal": [
            { "title": "Activity", "editable": false },
            { "title": "Waste Material", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Disposal Method", "editable": false },
            { "title": "Source Description", "editable": true },
            { "title": "Weight", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Flight": [
            { "title": "Origin (city or IATA code)", "editable": true },
            { "title": "Destination (city or IATA code)", "editable": true },
            { "title": "Direct / Indirect", "editable": true },
            { "title": "Class", "editable": true },
            { "title": "Single way / return", "editable": true },
            { "title": "kg CO2e", "editable": true, "type": "Number" },
          ],
          "Accommodation": [
            { "title": "Country", "editable": false },
            { "title": "Number of occupied rooms", "editable": true, "type": "Number" },
            { "title": "Number of nights per room", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Business travel - land and sea": [
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Total distance", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Freighting goods": [
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Weight (tonnes)", "editable": true, "type": "Number" },
            { "title": "Distance (km)", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Employees commuting": [
            { "title": "Vehicle", "editable": false },
            { "title": "Type", "editable": false },
            { "title": "Fuel", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Total distance", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Food": [
            { "title": "Meal Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Home Office": [
            { "title": "Type of home office", "editable": false },
            { "title": "Number of employees", "editable": true, "type": "Number" },
            { "title": "Working regime (For full-time)", "editable": true, "type": "Number" },
            { "title": "Working from home", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Water": [
            { "title": "Type", "editable": false },
            { "title": "Unit", "editable": false },
            { "title": "Source", "editable": true },
            { "title": "Amount", "editable": true, "type": "Number" },
            { "title": "Factor", "editable": true, "type": "Number" }
          ],
          "Employment": [
            { "title": "Employment Type", "editable": false },
            { "title": "Category", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Head Count", "editable": true, "type": "Number" }
          ],
          "Leave": [
            { "title": "Type of Leave", "editable": false },
            { "title": "Duration in Days", "editable": true, "type": "Number" },
            { "title": "Head Count", "editable": true, "type": "Number" }
          ],
          "Retention": [
            { "title": "Employee Type", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Tenure", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Head Count", "editable": true, "type": "Number" }
          ],
          "OH and S": [
            { "title": "Injury Type", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Number of Incidents", "editable": true, "type": "Number" },
            { "title": "Head Count", "editable": true, "type": "Number" }
          ],
          "Training and Edu": [
            { "title": "Types of training", "editable": false },
            { "title": "Segment", "editable": false },
            { "title": "Avg Hours per batch", "editable": true, "type": "Number" },
            { "title": "Head Count", "editable": true, "type": "Number" },
            { "title": "Financial investment", "editable": true, "type": "Number" },
          ],
          "Child Labor": [
            { "title": "Risk Level", "editable": false },
            { "title": "Supplier Name", "editable": true },
            { "title": "No. of Incidents reported", "editable": true, "type": "Number" }
          ],
          "Customer Privacy": [
            { "title": "Nature of Complaints", "editable": false },
            { "title": "No. of complaints received", "editable": true, "type": "Number" },
            { "title": "No. of complaints solved", "editable": true, "type": "Number" }
          ],
          "Mktg and Labelling": [
            { "title": "Incident", "editable": false },
            { "title": "No. of non-compliance Incidents", "editable": true, "type": "Number" },
            { "title": "No. of times regulation violated", "editable": true, "type": "Number" }
          ],
          "CHS": [
            { "title": "Type of Incident", "editable": false },
            { "title": "No. of non-compliance Incidents", "editable": true, "type": "Number" },
            { "title": "Customers Impacted", "editable": true, "type": "Number" }
          ],
          "Social Benefits": [
            { "title": "Domain", "editable": false },
            { "title": "Program name", "editable": true },
            { "title": "No. of Beneficiaries", "editable": true, "type": "Number" },
            { "title": "Expenditure", "editable": true, "type": "Number" }
          ],
          "Entity": [
            { "title": "Entity Type", "editable": false },
            { "title": "Gender", "editable": false },
            { "title": "Age", "editable": false },
            { "title": "Tenure", "editable": false },
            { "title": "Head Count", "editable": true, "type": "Number" }
          ],
          "Eco. Performance": [
            { "title": "Data", "editable": false },
            { "title": "Values", "editable": true, "type": "Number" }
          ],
          "Market Presence": [
            { "title": "Data", "editable": false },
            { "title": "Values", "editable": true, "type": "Number" }
          ]
        };

        return columns[module];
      },
      getTitle: function (title) {
        const aTitle = {
          "Fuel": "Fuel",
          "Bioenergy": "Bioenergy",
          "Refrigerant and other": "Refrigerant and Other",
          "Elec heat cooling": "Electricity Heat and Cooling",
          "Owned Vehicles": "Company Owned Vehicle",
          "Materials": "Materials",
          "WTT- fuels": "WTT- Fuels",
          "Waste Disposal": "Waste Disposal",
          "Flight": "Flight",
          "Accommodation": "Accommodation",
          "Business travel - land and sea": "Business Travel - Land and Sea",
          "Freighting goods": "Freighting Goods",
          "Employees commuting": "Employees Commuting",
          "Food": "Food",
          "Home Office": "Home Office",
          "Water": "Water",
          "Employment": "Employment",
          "Leave": "Leave",
          "Retention": "Retention",
          "OH and S": "Occupational Health and Safety",
          "Training and Edu": "Training and Education",
          "Child Labor": "Child Labor",
          "Customer Privacy": "Customer Privacy",
          "Mktg and Labelling": "Marketing and Labelling ",
          "CHS": "Customer Health & Safety",
          "Social Benefits": "Social Benefits",
          "Entity": "Entity",
          "Eco. Performance": "Economic Performance",
          "Market Presence": "Market Presence",
        }
        if (aTitle[title]) {
          return aTitle[title];
        }
        else {
          return title
        }
      },
      getVariantData: function (module) {
        var variantMap = {
          "Fuel": [
            {
              "Reference": 7,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "CNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 11,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "LNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 15,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "LPG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 19,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Natural gas",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 2779,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Natural gas (100% mineral blend)",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 23,
              "Fuels": "Fuels",
              "Type": "Gaseous fuels",
              "Fuel": "Other petroleum gas",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 31,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Aviation spirit",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 35,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Aviation turbine fuel",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 39,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Burning oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 43,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Diesel (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 47,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Diesel (100% mineral diesel)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 51,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 55,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 59,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Lubricants",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 63,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Naphtha",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 71,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Petrol (100% mineral petrol)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 75,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Processed fuel oils - residual oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 79,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Processed fuel oils - distillate oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 87,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Waste oils",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 91,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Marine gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 95,
              "Fuels": "Fuels",
              "Type": "Liquid fuels",
              "Fuel": "Marine fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 99,
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (industrial)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 102,
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (electricity generation)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 105,
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coal (domestic)",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 108,
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Coking coal",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 111,
              "Fuels": "Fuels",
              "Type": "Solid fuels",
              "Fuel": "Petroleum coke",
              "Unit": "tonnes",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": 114,
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
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Bioethanol",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 120,
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 126,
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME (from used cooking oil)",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 129,
              "Fuels": "Bioenergy",
              "Type": "Biofuel",
              "Fuel": "Biodiesel ME (from tallow)",
              "Unit": "litres"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 143,
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood logs",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 145,
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood chips",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 147,
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Wood pellets",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 149,
              "Fuels": "Bioenergy",
              "Type": "Biomass",
              "Fuel": "Grass/straw",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 151,
              "Fuels": "Bioenergy",
              "Type": "Biogas",
              "Fuel": "Biogas",
              "Unit": "tonnes"
            },
            {
              "Amount": "",
              "Factor": "",
              "Reference": 153,
              "Fuels": "Bioenergy",
              "Type": "Biogas",
              "Fuel": "Landfill gas",
              "Unit": "tonnes"
            }
          ],
          "Refrigerant and other": [
            {
              "Reference": "154",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Carbon dioxide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "155",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Methane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "156",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Nitrous oxide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "157",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-23",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "158",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-32",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "159",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-41",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "160",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-125",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "161",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-134",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "162",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-134a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "163",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-143",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "164",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-143a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "165",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-152a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "166",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-227ea",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "167",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236fa",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "168",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-245fa",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "169",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-43-I0mee",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "170",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoromethane (PFC-14)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "171",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoroethane (PFC-116)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "172",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoropropane (PFC-218)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "173",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorocyclobutane (PFC-318)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "174",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorobutane (PFC-3-1-10)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "175",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluoropentane (PFC-4-1-12)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "176",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Perfluorohexane (PFC-5-1-14)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "177",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "Sulphur hexafluoride (SF6)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "178",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-152",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "179",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-161",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "180",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236cb",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "181",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-236ea",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "182",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-245ca",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "183",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol - standard",
              "Fuel": "HFC-365mfc",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "184",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R404A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "185",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "186",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407C",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "187",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R407F",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "188",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R408A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "189",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R410A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "190",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R507A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "191",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R508B",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "192",
              "Fuels": "Refrigerant & other",
              "Type": "Kyoto protocol- blends",
              "Fuel": "R403A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "193",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-11/R11 = trichlorofluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "194",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-12/R12 = dichlorodifluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "195",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-13",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "196",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-113",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "197",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-114",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "198",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "CFC-115",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "199",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-1211",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "200",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-1301",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "201",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Halon-2402",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "202",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Carbon tetrachloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "203",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Methyl bromide",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "204",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "Methyl chloroform",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "205",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-22/R22 = chlorodifluoromethane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "206",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-123",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "207",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-124",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "208",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-141b",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "209",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-142b",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "210",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-225ca",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "211",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-225cb",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "212",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - standard",
              "Fuel": "HCFC-21",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "213",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Nitrogen trifluoride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "214",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "PFC-9-1-18",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "215",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Trifluoromethyl sulphur pentafluoride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "216",
              "Fuels": "Refrigerant & other",
              "Type": "Other perfluorinated gases",
              "Fuel": "Perfluorocyclopropane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "217",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-125",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "218",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-134",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "219",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-143a",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "220",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HCFE-235da2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "221",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-245cb2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "222",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-245fa2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "223",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-254cb2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "224",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-347mcc3",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "225",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-347pcf2",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "226",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-356pcc3",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "227",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-449sl (HFE-7100)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "228",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-569sf2 (HFE-7200)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "229",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-43-10pccc124 (H-Galden1040x)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "230",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-236ca12 (HG-10)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "231",
              "Fuels": "Refrigerant & other",
              "Type": "Fluorinated ethers",
              "Fuel": "HFE-338pcc13 (HG-01)",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "232",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "PFPMIE",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "233",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Dimethylether",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "234",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Methylene chloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "235",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "Methyl chloride",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "236",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "R290 = propane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "237",
              "Fuels": "Refrigerant & other",
              "Type": "Other refrigerants",
              "Fuel": "R600A = isobutane",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "240",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - blends",
              "Fuel": "R406A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "241",
              "Fuels": "Refrigerant & other",
              "Type": "Montreal protocol - blends",
              "Fuel": "R409A",
              "Unit": "kg",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "242",
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
              "Scope": "Scope 1",
              "Reference": "345",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },

            {
              "Scope": "Scope 1",
              "Reference": "361",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },

            {
              "Scope": "Scope 1",
              "Reference": "377",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },

            {
              "Scope": "Scope 1",
              "Reference": "393",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },

            {
              "Scope": "Scope 1",
              "Reference": "333",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "335",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "337",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "343",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "349",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "351",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "353",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "355",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "357",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "359",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "365",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "367",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "369",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "371",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "373",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "375",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "381",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "383",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "385",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "387",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "389",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "391",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "397",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Small",
              "Fuel": "",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "399",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "401",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Large",
              "Fuel": "",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "403",
              "Level 1": "Passenger vehicles",
              "Level 2": "Motorbike",
              "Level 3": "Average",
              "Fuel": "",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },


            {
              "Scope": "Scope 1",
              "Reference": "405",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "407",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "409",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "411",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "413",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "419",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "421",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "423",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "425",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "427",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "433",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "435",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "437",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "439",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "441",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "447",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Diesel",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "449",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Petrol",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "451",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "CNG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "453",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "LPG",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "455",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Unknown",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "467",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "475",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "483",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "491",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All rigids",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "499",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "507",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "515",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All artics",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "523",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGV (all diesel)",
              "Level 3": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "531",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>3.5 - 7.5 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "539",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>7.5 tonnes-17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "547",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Rigid (>17 tonnes)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "555",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All rigids",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "563",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Articulated (>3.5 - 33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "571",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "Articulated (>33t)",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "579",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All artics",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 1",
              "Reference": "587",
              "Level 1": "Delivery vehicles",
              "Level 2": "HGVs refrigerated (all diesel)",
              "Level 3": "All HGVs",
              "Fuel": "Average laden",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "628",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "632",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "636",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "640",
              "Level 1": "Passenger vehicles",
              "Level 2": "Cars (by size)",
              "Level 3": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "645",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class I (up to 1.305 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "651",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class II (1.305 to 1.74 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "657",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Class III (1.74 to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
            {
              "Scope": "Scope 2",
              "Reference": "663",
              "Level 1": "Delivery vehicles",
              "Level 2": "Vans",
              "Level 3": "Average (up to 3.5 tonnes)",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Distance (km)": "",
              "Factor": ""
            },
          ],
          "Materials": [
            {
              "Reference": "672",
              "Activity": "Construction",
              "Waste type": "Aggregates",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "676",
              "Activity": "Construction",
              "Waste type": "Average construction",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "680",
              "Activity": "Construction",
              "Waste type": "Asbestos",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "684",
              "Activity": "Construction",
              "Waste type": "Asphalt",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "688",
              "Activity": "Construction",
              "Waste type": "Bricks",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "692",
              "Activity": "Construction",
              "Waste type": "Concrete",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "696",
              "Activity": "Construction",
              "Waste type": "Insulation",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "700",
              "Activity": "Construction",
              "Waste type": "Metals",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "708",
              "Activity": "Construction",
              "Waste type": "Mineral oil",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "712",
              "Activity": "Construction",
              "Waste type": "Plasterboard",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "716",
              "Activity": "Construction",
              "Waste type": "Tyres",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "720",
              "Activity": "Construction",
              "Waste type": "Wood",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "728",
              "Activity": "Other",
              "Waste type": "Glass",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "732",
              "Activity": "Other",
              "Waste type": "Clothing",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "736",
              "Activity": "Other",
              "Waste type": "Food and drink",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "740",
              "Activity": "Organic",
              "Waste type": "Compost derived from garden waste",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "741",
              "Activity": "Organic",
              "Waste type": "Compost derived from food and garden waste",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "742",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - fridges and freezers",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "746",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - large",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "750",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - IT",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "754",
              "Activity": "Electrical items",
              "Waste type": "Electrical items - small",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "758",
              "Activity": "Electrical items",
              "Waste type": "Batteries - Alkaline",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "762",
              "Activity": "Electrical items",
              "Waste type": "Batteries - Li ion",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "766",
              "Activity": "Electrical items",
              "Waste type": "Batteries - NiMh",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "770",
              "Activity": "Metal",
              "Waste type": "Metal: aluminium cans and foil (excl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "772",
              "Activity": "Metal",
              "Waste type": "Metal: mixed cans",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "774",
              "Activity": "Metal",
              "Waste type": "Metal: scrap metal",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "776",
              "Activity": "Metal",
              "Waste type": "Metal: steel cans",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "778",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastics",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "781",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastic film",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "784",
              "Activity": "Plastic",
              "Waste type": "Plastics: average plastic rigid",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "787",
              "Activity": "Plastic",
              "Waste type": "Plastics: HDPE (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "790",
              "Activity": "Plastic",
              "Waste type": "Plastics: LDPE and LLDPE (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "793",
              "Activity": "Plastic",
              "Waste type": "Plastics: PET (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "796",
              "Activity": "Plastic",
              "Waste type": "Plastics: PP (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "799",
              "Activity": "Plastic",
              "Waste type": "Plastics: PS (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "802",
              "Activity": "Plastic",
              "Waste type": "Plastics: PVC (incl. forming)",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "805",
              "Activity": "Paper",
              "Waste type": "Paper and board: board",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "808",
              "Activity": "Paper",
              "Waste type": "Paper and board: mixed",
              "Unit": "tonnes",
              "Amount (tonnes)": "",
              "Factor": ""
            },
            {
              "Reference": "811",
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
              "Type": "WTT- gaseous fuels",
              "Fuel": "Butane",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "898",
              "Type": "WTT- gaseous fuels",
              "Fuel": "CNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "902",
              "Type": "WTT- gaseous fuels",
              "Fuel": "LNG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "906",
              "Type": "WTT- gaseous fuels",
              "Fuel": "LPG",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "910",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Natural Gas",
              "Unit": "cubic metres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "914",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Other Petroleum Gas",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "918",
              "Type": "WTT- gaseous fuels",
              "Fuel": "Propane",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "922",
              "Type": "WTT- liquid fuels",
              "Fuel": "Aviation Spirit",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "926",
              "Type": "WTT- liquid fuels",
              "Fuel": "Aviation Turbine Fuel",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "930",
              "Type": "WTT- liquid fuels",
              "Fuel": "Burning Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "934",
              "Type": "WTT- liquid fuels",
              "Fuel": "Diesel (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "938",
              "Type": "WTT- liquid fuels",
              "Fuel": "Diesel (100% mineral diesel)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "942",
              "Type": "WTT- liquid fuels",
              "Fuel": "Fuel Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "946",
              "Type": "WTT- liquid fuels",
              "Fuel": "Gas Oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "950",
              "Type": "WTT- liquid fuels",
              "Fuel": "Lubricants",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "954",
              "Type": "WTT- liquid fuels",
              "Fuel": "Naphtha",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "958",
              "Type": "WTT- liquid fuels",
              "Fuel": "Petrol (average biofuel blend)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "962",
              "Type": "WTT- liquid fuels",
              "Fuel": "Petrol (100% mineral petrol)",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "966",
              "Type": "WTT- liquid fuels",
              "Fuel": "Processed fuel oils - residual oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "970",
              "Type": "WTT- liquid fuels",
              "Fuel": "Processed fuel oils - distillate oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "974",
              "Type": "WTT- liquid fuels",
              "Fuel": "Refinery Miscellaneous",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "978",
              "Type": "WTT- liquid fuels",
              "Fuel": "Waste oils",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "982",
              "Type": "WTT- liquid fuels",
              "Fuel": "Marine gas oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "986",
              "Type": "WTT- liquid fuels",
              "Fuel": "Marine fuel oil",
              "Unit": "litres",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "2783",
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
              "Activity": "Construction",
              "Waste Material": "Aggregates",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2518",
              "Activity": "Construction",
              "Waste Material": "Aggregates",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2518",
              "Activity": "Construction",
              "Waste Material": "Aggregates",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2524",
              "Activity": "Construction",
              "Waste Material": "Average construction",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2524",
              "Activity": "Construction",
              "Waste Material": "Average construction",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2524",
              "Activity": "Construction",
              "Waste Material": "Average construction",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2530",
              "Activity": "Construction",
              "Waste Material": "Asbestos",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2530",
              "Activity": "Construction",
              "Waste Material": "Asbestos",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2530",
              "Activity": "Construction",
              "Waste Material": "Asbestos",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2536",
              "Activity": "Construction",
              "Waste Material": "Asphalt",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2536",
              "Activity": "Construction",
              "Waste Material": "Asphalt",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2536",
              "Activity": "Construction",
              "Waste Material": "Asphalt",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2542",
              "Activity": "Construction",
              "Waste Material": "Bricks",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2542",
              "Activity": "Construction",
              "Waste Material": "Bricks",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2542",
              "Activity": "Construction",
              "Waste Material": "Bricks",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2548",
              "Activity": "Construction",
              "Waste Material": "Concrete",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2548",
              "Activity": "Construction",
              "Waste Material": "Concrete",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2548",
              "Activity": "Construction",
              "Waste Material": "Concrete",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2554",
              "Activity": "Construction",
              "Waste Material": "Insulation",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2554",
              "Activity": "Construction",
              "Waste Material": "Insulation",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2554",
              "Activity": "Construction",
              "Waste Material": "Insulation",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2560",
              "Activity": "Construction",
              "Waste Material": "Metals",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2560",
              "Activity": "Construction",
              "Waste Material": "Metals",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2560",
              "Activity": "Construction",
              "Waste Material": "Metals",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2566",
              "Activity": "Construction",
              "Waste Material": "Soils",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2566",
              "Activity": "Construction",
              "Waste Material": "Soils",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2566",
              "Activity": "Construction",
              "Waste Material": "Soils",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2572",
              "Activity": "Construction",
              "Waste Material": "Mineral oil",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2572",
              "Activity": "Construction",
              "Waste Material": "Mineral oil",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2572",
              "Activity": "Construction",
              "Waste Material": "Mineral oil",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2578",
              "Activity": "Construction",
              "Waste Material": "Plasterboard",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2578",
              "Activity": "Construction",
              "Waste Material": "Plasterboard",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2578",
              "Activity": "Construction",
              "Waste Material": "Plasterboard",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2584",
              "Activity": "Construction",
              "Waste Material": "Tyres",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2584",
              "Activity": "Construction",
              "Waste Material": "Tyres",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2584",
              "Activity": "Construction",
              "Waste Material": "Tyres",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2590",
              "Activity": "Construction",
              "Waste Material": "Wood",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2590",
              "Activity": "Construction",
              "Waste Material": "Wood",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2590",
              "Activity": "Construction",
              "Waste Material": "Wood",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2596",
              "Activity": "Other",
              "Waste Material": "Books",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2596",
              "Activity": "Other",
              "Waste Material": "Books",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2596",
              "Activity": "Other",
              "Waste Material": "Books",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2602",
              "Activity": "Other",
              "Waste Material": "Glass",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2602",
              "Activity": "Other",
              "Waste Material": "Glass",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2602",
              "Activity": "Other",
              "Waste Material": "Glass",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2608",
              "Activity": "Other",
              "Waste Material": "Clothing",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2608",
              "Activity": "Other",
              "Waste Material": "Clothing",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2608",
              "Activity": "Other",
              "Waste Material": "Clothing",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2614",
              "Activity": "Refuse",
              "Waste Material": "Household residual waste",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2614",
              "Activity": "Refuse",
              "Waste Material": "Household residual waste",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2614",
              "Activity": "Refuse",
              "Waste Material": "Household residual waste",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2620",
              "Activity": "Refuse",
              "Waste Material": "Organic: food and drink waste",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2620",
              "Activity": "Refuse",
              "Waste Material": "Organic: food and drink waste",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2620",
              "Activity": "Refuse",
              "Waste Material": "Organic: food and drink waste",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2626",
              "Activity": "Refuse",
              "Waste Material": "Organic: garden waste",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2626",
              "Activity": "Refuse",
              "Waste Material": "Organic: garden waste",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2626",
              "Activity": "Refuse",
              "Waste Material": "Organic: garden waste",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2632",
              "Activity": "Refuse",
              "Waste Material": "Organic: mixed food and garden waste",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2632",
              "Activity": "Refuse",
              "Waste Material": "Organic: mixed food and garden waste",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2632",
              "Activity": "Refuse",
              "Waste Material": "Organic: mixed food and garden waste",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2638",
              "Activity": "Refuse",
              "Waste Material": "Commercial and industrial waste",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2638",
              "Activity": "Refuse",
              "Waste Material": "Commercial and industrial waste",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2638",
              "Activity": "Refuse",
              "Waste Material": "Commercial and industrial waste",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2642",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - fridges and freezers",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2642",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - fridges and freezers",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2642",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - fridges and freezers",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2646",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - large",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2646",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - large",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2646",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - large",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2650",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - mixed",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2650",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - mixed",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2650",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - mixed",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2654",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - small",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2654",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - small",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2654",
              "Activity": "Electrical items",
              "Waste Material": "WEEE - small",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2658",
              "Activity": "Electrical items",
              "Waste Material": "Batteries",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2658",
              "Activity": "Electrical items",
              "Waste Material": "Batteries",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2658",
              "Activity": "Electrical items",
              "Waste Material": "Batteries",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2662",
              "Activity": "Metal",
              "Waste Material": "Metal: aluminium cans and foil (excl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2662",
              "Activity": "Metal",
              "Waste Material": "Metal: aluminium cans and foil (excl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2662",
              "Activity": "Metal",
              "Waste Material": "Metal: aluminium cans and foil (excl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2666",
              "Activity": "Metal",
              "Waste Material": "Metal: mixed cans",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2666",
              "Activity": "Metal",
              "Waste Material": "Metal: mixed cans",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2666",
              "Activity": "Metal",
              "Waste Material": "Metal: mixed cans",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2670",
              "Activity": "Metal",
              "Waste Material": "Metal: scrap metal",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2670",
              "Activity": "Metal",
              "Waste Material": "Metal: scrap metal",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2670",
              "Activity": "Metal",
              "Waste Material": "Metal: scrap metal",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2674",
              "Activity": "Metal",
              "Waste Material": "Metal: steel cans",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2674",
              "Activity": "Metal",
              "Waste Material": "Metal: steel cans",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2674",
              "Activity": "Metal",
              "Waste Material": "Metal: steel cans",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2678",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastics",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2678",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastics",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2678",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastics",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2682",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic film",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2682",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic film",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2682",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic film",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2686",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic rigid",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2686",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic rigid",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2686",
              "Activity": "Plastic",
              "Waste Material": "Plastics: average plastic rigid",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2690",
              "Activity": "Plastic",
              "Waste Material": "Plastics: HDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2690",
              "Activity": "Plastic",
              "Waste Material": "Plastics: HDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2690",
              "Activity": "Plastic",
              "Waste Material": "Plastics: HDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2694",
              "Activity": "Plastic",
              "Waste Material": "Plastics: LDPE and LLDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2694",
              "Activity": "Plastic",
              "Waste Material": "Plastics: LDPE and LLDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2694",
              "Activity": "Plastic",
              "Waste Material": "Plastics: LDPE and LLDPE (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2698",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PET (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2698",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PET (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2698",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PET (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2702",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PP (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2702",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PP (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2702",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PP (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2706",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PS (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2706",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PS (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2706",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PS (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2710",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PVC (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2710",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PVC (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2710",
              "Activity": "Plastic",
              "Waste Material": "Plastics: PVC (incl. forming)",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2715",
              "Activity": "Paper",
              "Waste Material": "Paper and board: board",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2715",
              "Activity": "Paper",
              "Waste Material": "Paper and board: board",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2715",
              "Activity": "Paper",
              "Waste Material": "Paper and board: board",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2720",
              "Activity": "Paper",
              "Waste Material": "Paper and board: mixed",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2720",
              "Activity": "Paper",
              "Waste Material": "Paper and board: mixed",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2720",
              "Activity": "Paper",
              "Waste Material": "Paper and board: mixed",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2725",
              "Activity": "Paper",
              "Waste Material": "Paper and board: paper",
              "Source Description": "",
              "Disposal Method": "Recycled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2725",
              "Activity": "Paper",
              "Waste Material": "Paper and board: paper",
              "Source Description": "",
              "Disposal Method": "Landfilled",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            },
            {
              "Reference": "2725",
              "Activity": "Paper",
              "Waste Material": "Paper and board: paper",
              "Source Description": "",
              "Disposal Method": "Combusted",
              "Unit": "tonnes",
              "Weight": "",
              "Factor": ""
            }
          ]

          ,
          "Flight": [
            {
              "Origin (city or IATA code)": "Delhi",
              "Destination (city or IATA code)": "Mumbai",
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
            },
          ],
          "Business travel - land and sea": [
            {
              "Reference": "1850",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1866",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1882",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1898",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1842",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1858",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1874",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1890",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1836",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1852",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1868",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1884",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1840",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1856",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1872",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1888",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1844",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1860",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1876",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1892",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1838",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1854",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1870",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1886",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1848",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1864",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1880",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1896",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1846",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1862",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1878",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1894",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1743",
              "Vehicle": "Ferry",
              "Type": "Foot passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1744",
              "Vehicle": "Ferry",
              "Type": "Car passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1745",
              "Vehicle": "Ferry",
              "Type": "Average (all passenger)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1900",
              "Vehicle": "Motorbike",
              "Type": "Small",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1902",
              "Vehicle": "Motorbike",
              "Type": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1904",
              "Vehicle": "Motorbike",
              "Type": "Large",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1906",
              "Vehicle": "Motorbike",
              "Type": "Average",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1908",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1909",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1910",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1911",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1912",
              "Vehicle": "Bus",
              "Type": "Local bus (not London)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1913",
              "Vehicle": "Bus",
              "Type": "Local London bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1914",
              "Vehicle": "Bus",
              "Type": "Average local bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1915",
              "Vehicle": "Bus",
              "Type": "Coach",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1916",
              "Vehicle": "Rail",
              "Type": "National rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1917",
              "Vehicle": "Rail",
              "Type": "International rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1918",
              "Vehicle": "Rail",
              "Type": "Light rail and tram",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1919",
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
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1866",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1882",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1898",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Battery Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1842",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1858",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1874",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1890",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "CNG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1836",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1852",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1868",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1884",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Diesel",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1840",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1856",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1872",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1888",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Hybrid",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1844",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1860",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1876",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1892",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "LPG",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1838",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1854",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1870",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1886",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Petrol",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1848",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1864",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1880",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1896",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Plug-in Hybrid Electric Vehicle",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1846",
              "Vehicle": "Cars (by size)",
              "Type": "Small car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1862",
              "Vehicle": "Cars (by size)",
              "Type": "Medium car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1878",
              "Vehicle": "Cars (by size)",
              "Type": "Large car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1894",
              "Vehicle": "Cars (by size)",
              "Type": "Average car",
              "Fuel": "Unknown",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1743",
              "Vehicle": "Ferry",
              "Type": "Foot passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1744",
              "Vehicle": "Ferry",
              "Type": "Car passenger",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1745",
              "Vehicle": "Ferry",
              "Type": "Average (all passenger)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1900",
              "Vehicle": "Motorbike",
              "Type": "Small",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1902",
              "Vehicle": "Motorbike",
              "Type": "Medium",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1904",
              "Vehicle": "Motorbike",
              "Type": "Large",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1906",
              "Vehicle": "Motorbike",
              "Type": "Average",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1908",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1909",
              "Vehicle": "Taxis",
              "Type": "Regular taxi",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1910",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1911",
              "Vehicle": "Taxis",
              "Type": "Black cab",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1912",
              "Vehicle": "Bus",
              "Type": "Local bus (not London)",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1913",
              "Vehicle": "Bus",
              "Type": "Local London bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1914",
              "Vehicle": "Bus",
              "Type": "Average local bus",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1915",
              "Vehicle": "Bus",
              "Type": "Coach",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1916",
              "Vehicle": "Rail",
              "Type": "National rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1917",
              "Vehicle": "Rail",
              "Type": "International rail",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1918",
              "Vehicle": "Rail",
              "Type": "Light rail and tram",
              "Fuel": "",
              "Unit": "passenger.km",
              "Total distance": "",
              "Factor": ""
            },
            {
              "Reference": "1919",
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
              "Factor": "0.84",
              "Meal Type": "1 standard breakfast",
              "Unit": "breakfast",
              "Amount": "",
            },
            {
              "Factor": "2.33",
              "Meal Type": "1 gourmet breakfast",
              "Unit": "breakfast",
              "Amount": "",
            },
            {
              "Factor": "2.02",
              "Meal Type": "1 cold or hot snack",
              "Unit": "hot snack",
              "Amount": "",
            },
            {
              "Factor": "4.7",
              "Meal Type": "1 average meal",
              "Unit": "meal",
              "Amount": "",
            },
            {
              "Factor": "0.2",
              "Meal Type": "Non-alcoholic beverage",
              "Unit": "litre",
              "Amount": "",
            },
            {
              "Factor": "1.87",
              "Meal Type": "Alcoholic beverage",
              "Unit": "litre",
              "Amount": "",
            },
            {
              "Factor": "2.77",
              "Meal Type": "1 hot snack (burger + frites)",
              "Unit": "hot snack",
              "Amount": "",
            },
            {
              "Factor": "1.27",
              "Meal Type": "1 sandwich",
              "Unit": "sandwich",
              "Amount": "",
            },
            {
              "Factor": "1.69",
              "Meal Type": "Meal, vegan",
              "Unit": "meal",
              "Amount": "",
            },
            {
              "Factor": "2.85",
              "Meal Type": "Meal, vegetarian",
              "Unit": "meal",
              "Amount": "",
            },
            {
              "Factor": "6.93",
              "Meal Type": "Meal, with beef",
              "Unit": "meal",
              "Amount": "",
            },
            {
              "Factor": "3.39",
              "Meal Type": "Meal, with chicken",
              "Unit": "meal",
              "Amount": "",
            }
          ],
          "Home Office": [
            {
              "Type of home office": "With cooling",
              "Number of employees": "",
              "Working regime (For full-time)": "",
              "Working from home": "",
              "Number of months": "",
              "Factor": "3.65"
            },
            {
              "Type of home office": "No heating/No cooling",
              "Number of employees": "",
              "Working regime (For full-time)": "",
              "Working from home": "",
              "Number of months": "",
              "Factor": "0.15"
            },
            {
              "Type of home office": "With heating",
              "Number of employees": "",
              "Working regime (For full-time)": "",
              "Working from home": "",
              "Number of months": "",
              "Factor": "5.15"
            }
          ],
          "Water": [
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "Surface",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "Ground",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "Sea",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "Rain",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "Treated",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "668",
              "Type": "Water Supply",
              "Unit": "cubic metres",
              "Source": "3rd Party",
              "Amount": "",
              "Factor": ""
            },

            {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "Surface",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "Ground",
              "Amount": "",
              "Factor": ""
            },
            {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "Sea",
              "Amount": "",
              "Factor": ""
            }, {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "Rain",
              "Amount": "",
              "Factor": ""
            }, {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "Treated",
              "Amount": "",
              "Factor": ""
            }, {
              "Reference": "670",
              "Type": "Water Drainage",
              "Unit": "cubic metres",
              "Source": "3rd Party",
              "Amount": "",
              "Factor": ""
            }
          ],

          "Entity": [
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CFO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "CEO",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Independent Directors",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Executives",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "BOD turnover rate",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Male",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Female",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "50+",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "35 to 50",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "22 to 35",
              "Tenure": "Above 10 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Less than 1 year",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 1- 2 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 2-5 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 5-7 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Between 7-9 years",
              "Count": ""
            },
            {
              "Entity Type": "Compensation ratio",
              "Gender": "Others",
              "Age": "Less than 22",
              "Tenure": "Above 10 years",
              "Count": ""
            }
          ]

          ,
          "Eco. Performance": [
            {
              "Data": "Total turnover",
              "Values": ""
            },
            {
              "Data": "Total Revenue",
              "Values": ""
            },
            {
              "Data": "Direct economic value generated",
              "Values": ""
            },
            {
              "Data": "Direct economic value Distributed",
              "Values": ""
            },
            {
              "Data": "Financial assistance received from governments",
              "Values": ""
            },
            {
              "Data": "Remuneration ratio of BOD vs Employee",
              "Values": ""
            }
          ],
          "Market Presence": [
            {
              "Data": "Entry level wage",
              "Values": ""
            },
            {
              "Data": "Minimum level wage",
              "Values": ""
            },
            {
              "Data": "Ratio of entry to minimum wage",
              "Values": ""
            },
            {
              "Data": "No of presence in national level",
              "Values": ""
            },
            {
              "Data": "No.of offices in International level",
              "Values": ""
            },
            {
              "Data": "currently presence in states",
              "Values": ""
            }
          ],

          "Employment": [
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Employees",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Employee",
              "Category": "Existing - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },



            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires - Disabled",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "New Hires",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Male",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "Female",
              "Age": "Overall",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employment Type": "Temporary Workers",
              "Category": "Existing",
              "Gender": "LGBTQ",
              "Age": "Overall",
              "Count": ""
            }
          ]
          ,
          "Leave": [
            {
              "Type of Leave": "Maternity leave",
              "Duration in Days": "",
              "Head Count": ""
            },
            {
              "Type of Leave": "Paternity leave",
              "Duration in Days": "",
              "Head Count": ""
            },
            {
              "Type of Leave": "Birthday leave",
              "Duration in Days": "",
              "Head Count": ""
            },
            {
              "Type of Leave": "Marriage leave",
              "Duration in Days": "",
              "Head Count": ""
            },
            {
              "Type of Leave": "Accidental leave",
              "Duration in Days": "",
              "Head Count": ""
            },
            {
              "Type of Leave": "Sick leave",
              "Duration in Days": "",
              "Head Count": ""
            }
          ]
          ,
          "Retention": [
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "BOD",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Employees",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Temporary Employee",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Male",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Female",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Less than 1 year",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 1-2 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 2-5 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 5-7 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Between 7-9 years",
              "Age": "Less than 22",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "50+",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "35 to 50",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "22 to 35",
              "Count": ""
            },
            {
              "Employee Type": "Workers",
              "Gender": "Others",
              "Tenure": "Above 10 years",
              "Age": "Less than 22",
              "Count": ""
            }
          ]
          ,
          "OH and S": [
            {
              "Injury Type": "Slips, Trips, and Falls",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Slips, Trips, and Falls",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Slips, Trips, and Falls",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Cuts and Lacerations",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Cuts and Lacerations",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Cuts and Lacerations",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Overexertion Injuries",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Overexertion Injuries",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Overexertion Injuries",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Contact with Objects and Equipment",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Contact with Objects and Equipment",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Contact with Objects and Equipment",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Fires and Explosions",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Fires and Explosions",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Fires and Explosions",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Exposure to Hazardous Materials",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Exposure to Hazardous Materials",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Exposure to Hazardous Materials",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during Business Travel",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during Business Travel",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during Business Travel",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during workplace commute",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during workplace commute",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Accident during workplace commute",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Others",
              "Number of Incidents": "",
              "Gender": "Male",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Others",
              "Number of Incidents": "",
              "Gender": "Female",
              "Count of Persons": ""
            },
            {
              "Injury Type": "Others",
              "Number of Incidents": "",
              "Gender": "Others",
              "Count of Persons": ""
            },
          ]
          ,
          "Training and Edu": [
            {
              "Types of training": "Employee health & safety training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee health & safety training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee health & safety training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee health & safety training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee health & safety training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee Skill Upgradation Training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee Skill Upgradation Training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee Skill Upgradation Training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee Skill Upgradation Training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Employee Skill Upgradation Training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Onboarding and orientation",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Onboarding and orientation",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Onboarding and orientation",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Onboarding and orientation",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Onboarding and orientation",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Technical Training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Technical Training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Technical Training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Technical Training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Technical Training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "corporate training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "corporate training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "corporate training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "corporate training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "corporate training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Anti-corruption Training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Anti-corruption Training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Anti-corruption Training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Anti-corruption Training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Anti-corruption Training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "POSH training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Strategy Implementation",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Strategy Implementation",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Strategy Implementation",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Strategy Implementation",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Strategy Implementation",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Business operation",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Business operation",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Business operation",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Business operation",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Business operation",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Organisation structure",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Organisation structure",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Organisation structure",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Organisation structure",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Organisation structure",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Risk Management training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Risk Management training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Risk Management training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Risk Management training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Risk Management training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Regulatory framework",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Regulatory framework",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Regulatory framework",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Regulatory framework",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Regulatory framework",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cyber security",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cyber security",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cyber security",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cyber security",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cyber security",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Future outlook training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Future outlook training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Future outlook training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Future outlook training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Future outlook training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Leadership connect program",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Leadership connect program",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Leadership connect program",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Leadership connect program",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Leadership connect program",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Corporate governance training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Corporate governance training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Corporate governance training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Corporate governance training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Corporate governance training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Emerging compliance landscape",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Emerging compliance landscape",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Emerging compliance landscape",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Emerging compliance landscape",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Emerging compliance landscape",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "AML (Anti-money laundering)",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "AML (Anti-money laundering)",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "AML (Anti-money laundering)",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "AML (Anti-money laundering)",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "AML (Anti-money laundering)",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "KYC",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "KYC",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "KYC",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "KYC",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "KYC",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Whistle-blower Policy Training",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Whistle-blower Policy Training",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Whistle-blower Policy Training",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Whistle-blower Policy Training",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Whistle-blower Policy Training",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "NRI Product & KYC Documentation",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "NRI Product & KYC Documentation",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "NRI Product & KYC Documentation",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "NRI Product & KYC Documentation",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "NRI Product & KYC Documentation",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Mobile Banking",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Mobile Banking",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Mobile Banking",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Mobile Banking",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Mobile Banking",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Prohibition of Insider Trading",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Prohibition of Insider Trading",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Prohibition of Insider Trading",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Prohibition of Insider Trading",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Prohibition of Insider Trading",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cash Management System",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cash Management System",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cash Management System",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cash Management System",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Cash Management System",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Code of Conduct & Ethics",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Code of Conduct & Ethics",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Code of Conduct & Ethics",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Code of Conduct & Ethics",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Code of Conduct & Ethics",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "CERSAI",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "CERSAI",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "CERSAI",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "CERSAI",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "CERSAI",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Grievance Redressal Mechanism",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Grievance Redressal Mechanism",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Grievance Redressal Mechanism",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Grievance Redressal Mechanism",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Grievance Redressal Mechanism",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Other",

              "Segment": "BOD",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Other",

              "Segment": "Employees",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Other",

              "Segment": "Key management personnel",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Other",

              "Segment": "Workers",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            },
            {
              "Types of training": "Other",

              "Segment": "others",
              "Avg Hours per batch": "",
              "No. of employees": "",
              "Financial investment": "",
            }
          ]
          ,
          "Child Labor": [
            {
              "Supplier Name": "",
              "Risk Level": "High",
              "No. of Incidents reported": ""
            },
            {
              "Supplier Name": "",
              "Risk Level": "Moderate",
              "No. of Incidents reported": ""
            },
            {
              "Supplier Name": "",
              "Risk Level": "Low",
              "No. of Incidents reported": ""
            },
            {
              "Supplier Name": "",
              "Risk Level": "Uncertain",
              "No. of Incidents reported": ""
            }
          ]
          ,
          "Customer Privacy": [
            {
              "Nature of Complaints": "Data Breaches",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Nature of Complaints": "Data Leaks",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Nature of Complaints": "Unauthorized Data Collection or Use",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            },
            {
              "Nature of Complaints": "Difficulties Accessing or Controlling Personal Data",
              "no. of complaint received": "",
              "no. of complaint solved": ""
            }
          ]
          ,
          "Mktg and Labelling": [
            {
              "Incident": "Comparative Advertising",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Consumer Protection",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "False Advertising and Misleading Claims",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Greenwashing",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Health and Wellness Claims",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Labeling Compliance",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Product Liability",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            },
            {
              "Incident": "Trademark and Intellectual Property",
              "No.of non-compliance Incident": "",
              "No. of time regulation violated": ""
            }
          ]
          ,
          "CHS": [
            {
              "Type of Incident": "Product defects or malfunctions",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Safety hazards",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Injuries or illnesses",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Product recalls",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Errors or omissions in service delivery",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Inadequate customer support",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Security incidents",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            },
            {
              "Type of Incident": "Others",
              "No.of non-compliance Incident": "",
              "Customers Impacted": ""
            }
          ]
          ,
          "Social Benefits": [
            {
              "Program name": "",
              "Domain": "Plantation"
            },
            {
              "Program name": "",
              "Domain": "Livlihoods"
            },
            {
              "Program name": "",
              "Domain": "Education"
            },
            {
              "Program name": "",
              "Domain": "Rain water harvesting"
            },
            {
              "Program name": "",
              "Domain": "Renewable energy"
            },
            {
              "Program name": "",
              "Domain": "Training and Awareness"
            },
            {
              "Program name": "",
              "Domain": "Forestry"
            },
            {
              "Program name": "",
              "Domain": "Natural Farming"
            },
            {
              "Program name": "",
              "Domain": "Food Safety"
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
        MessageBox.confirm("Do you want to log out ?", {
          actions: ["Yes", MessageBox.Action.CANCEL],
          emphasizedAction: MessageBox.Action.CANCEL,
          onClose: function (sAction) {
            if (sAction == "Yes") {
              firebase.auth().signOut();
              this.MasterData = undefined;
              this.userData = undefined;
              this.getRouter().navTo("Login")
            }
          },

        })

      },
      formatNumberWithUnit: function (num) {
        if (num && num > 0) {
          num = Math.round((parseFloat(num) + Number.EPSILON) * 100) / 100
        }
        else {
          num = 0;
        }
        if (num >= 1_000_000) {
          return ((num / 1_000_000).toString().split(".")[0]) + 'M'; // For millions
        } else if (num >= 1_000) {
          return (num / 1_000).toString().substr(0, 3) + 'K'; // For thousands
        } else {
          return num; // For numbers less than 1000
        }
      },
      getFilters: function (module) {

        var columns = {
          "Fuel": {
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Bioenergy": {
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Refrigerant and other": {
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Elec heat cooling": {
            "Activity": [],
            "Country-Type": [],
            "Unit": []
          },
          "Owned Vehicles": {
            "Scope": [],
            "Level 1": [],
            "Level 2": [],
            "Level 3": [],
            "Fuel": [],
            "Unit": []
          },
          "Materials": {
            "Activity": [],
            "Waste type": [],
            "Unit": []
          },
          "WTT- fuels": {
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Waste Disposal": {
            "Activity": [],
            "Waste Material": [],
            "Unit": [],
            "Disposal Method": []
          },
          "Flight": {
            "Origin (city or IATA code)": [],
            "Destination (city or IATA code)": [],
            "Direct / Indirect": [],
            "Class": [],
            "Single way / return": []
          },
          "Accommodation": {
            "Country": []
          },
          "Business travel - land and sea": {
            "Vehicle": [],
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Freighting goods": {
            "Vehicle": [],
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Employees commuting": {
            "Vehicle": [],
            "Type": [],
            "Fuel": [],
            "Unit": []
          },
          "Food": {
            "Meal Type": [],
            "Unit": []
          },
          "Home Office": {

          },
          "Water": {
            "Type": [],
            "Unit": []
          },
          "Employment": {
            "Employment Type": [],
            "Category": [],
            "Gender": [],
            "Age": []
          },
          "Leave": {
            "Type of Leave": []
          },
          "Retention": {
            "Employee Type": [],
            "Gender": [],
            "Tenure": [],
            "Age": []
          },
          "OH and S": {
            "Injury Type": [],
            "Gender": []
          },
          "Training and Edu": {
            "Types of training": [],
            "Segment": []
          },
          "Child Labor": {
            "Risk Level": []
          },
          "Customer Privacy": {
            "Nature of Complaints": []
          },
          "Mktg and Labelling": {
            "Incident": []
          },
          "CHS": {
            "Type of Incident": []
          },
          "Social Benefits": {
            "Domain": []
          },
          "Entity": {
            "Entity Type": [],
            "Gender": [],
            "Age": [],
            "Tenure": []
          },
          "Eco. Performance": {
            "Data": []
          },
          "Market Presence": {
            "Data": []
          }
        };
        return columns[module];
      }

    });
  }
);
