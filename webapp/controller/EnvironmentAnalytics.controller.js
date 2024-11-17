sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel",
        "sap/m/VBox",
        "sap/ui/core/HTML",
        "sap/ui/core/CustomData"],
    function (Controller, JSONModel, VBox, HTML, CustomData) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.EnvironmentAnalytics", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.EnvironmentAnalytics
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("EnvironmentAnalytics")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    var oHBox = this.byId("chartData")
                    oHBox.removeAllItems();
                    var oHBox = this.byId("chartDataScope1")
                    oHBox.removeAllItems();
                    var oHBox = this.byId("chartDataScope2")
                    oHBox.removeAllItems();
                    var oHBox = this.byId("chartDataScope3")
                    oHBox.removeAllItems();
                    this.byId("graphFilters").removeAllItems();
                    var aCanvas = document.getElementsByTagName("canvas");
                    for (let i = aCanvas.length - 1; i >= 0; i--) {
                        aCanvas[i].remove();
                    }
                    firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").doc("All Cycle").get().then(doc => {
                        var cycle = [];
                        if (doc.exists) {
                            that.months = [];
                            that.years = [];
                            var cycledata = doc.data();
                            const initialKeys = Object.keys(cycledata);
                            initialKeys.forEach((key) => {
                                const [months, years] = key.split("-");


                                if (years && !that.years.some(item => item.title === years)) {
                                    that.years.push({ title: years });
                                }
                                if (months && !that.months.some(item => item.title === months)) {
                                    that.months.push({ title: months, years });
                                }
                            });
                            var initialSelection = that.years[0].title;
                            if (that.years.indexOf(new Date().getFullYear()) !== -1) {
                                initialSelection = new Date().getFullYear()
                            }
                            Object.keys(doc.data()).map(val => {
                                var data = doc.data()[val];
                                data.title = val;
                                cycle.push(data);
                            });
                            firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").where("year", "==", initialSelection).get().then(querySnapshot => {
                                sap.ui.core.BusyIndicator.hide();
                                var aClubData = {};
                                querySnapshot.forEach(function (doc) {
                                    var monthYear = doc.id;
                                    var yearMonth = monthYear.split("-")[1] + "-" + monthYear.split("-")[0]
                                    var data = doc.data();
                                    if (data.data) {
                                        Object.keys(data.data).map(val => {
                                            aClubData[yearMonth + "-" + val] = data.data[val];
                                        })
                                    }


                                });
                                if (Object.keys(aClubData).length > 0) {

                                    sap.ui.core.BusyIndicator.hide();
                                    that.analyticsData = aClubData;
                                    that.years = [];
                                    that.months = [];
                                    that.countries = [];
                                    that.states = [];
                                    that.districts = [];
                                    that.blocks = [];
                                    var initialDataKeys = Object.keys(aClubData);
                                    initialDataKeys.forEach((key) => {
                                        const [years, months, countries, states, districts, blocks] = key.split("-");

                                        if (years && !that.years.some(item => item.title === years)) {
                                            that.years.push({ title: years });
                                        }
                                        if (months && !that.months.some(item => item.title === months && item.years === years)) {
                                            that.months.push({ title: months, years });
                                        }
                                        if (countries && !that.countries.some(item => item.title === countries && item.months === months)) {
                                            that.countries.push({ title: countries, months });
                                        }
                                        if (states && !that.states.some(item => item.title === states && item.countries === countries)) {
                                            that.states.push({ title: states, countries });
                                        }
                                        if (districts && !that.districts.some(item => item.title === districts && item.states === states)) {
                                            that.districts.push({ title: districts, states });
                                        }
                                        if (blocks && !that.blocks.some(item => item.title === blocks && item.districts === districts)) {
                                            that.blocks.push({ title: blocks, districts });
                                        }
                                    });
                                    var oFilters = {
                                        years: that.years,
                                        months: that.months.filter(key => key.years === initialSelection),
                                        countries: [],
                                        states: [],
                                        districts: [],
                                        blocks: [],
                                    }
                                    Object.keys(oFilters).map((val, index) => {
                                        var vbox = new sap.m.VBox();
                                        var label = new sap.m.Label({
                                            text: that.capitalizeFirstLetter(val)
                                        });
                                        var oDataTemplate = new CustomData({ key: "title", value: val });
                                        var oDataTemplate1 = new CustomData({ key: "index", value: index });
                                        var select = new sap.m.Select({
                                            items: val === "years" ? [...oFilters[val].map(function (value) {
                                                return new sap.ui.core.Item({
                                                    key: value.title,
                                                    text: value.title
                                                });
                                            })
                                            ] : [
                                                new sap.ui.core.Item({
                                                    key: "All",
                                                    text: "All"
                                                }),
                                                ...oFilters[val].map(function (value) {
                                                    return new sap.ui.core.Item({
                                                        key: value.title,
                                                        text: value.title
                                                    });
                                                })
                                            ],
                                            // enabled: false,
                                            maxWidth: "100px",
                                            change: function (oEvent) {
                                                that.applyFilters(oEvent);
                                            } // On change, apply the filters to the table
                                        });
                                        select.addCustomData(oDataTemplate);
                                        select.addCustomData(oDataTemplate1);
                                        select.addStyleClass("sapUiSmallMarginEnd");
                                        if (val === "years") {
                                            select.setSelectedKey(initialSelection);
                                        }
                                        vbox.addItem(label);
                                        vbox.addItem(select);
                                        that.byId("graphFilters").addItem(vbox);
                                    });
                                    var branch = "";
                                    var filterContainerItems = that.byId("graphFilters").getItems();
                                    filterContainerItems.forEach(function (item, index) {
                                        if (item instanceof sap.m.Select) {
                                            var selectedKey = item.getSelectedKey();
                                            if (selectedKey && selectedKey !== "All") {
                                                branch += selectedKey + "-"
                                            }
                                        }
                                    });
                                    branch = branch.substring(0, branch.length - 1);
                                    var selectedData = Object.keys(that.analyticsData).filter(val => val.indexOf(branch) !== -1)
                                    that.createSampleData(that.consolidatedData(selectedData, "Overview"));
                                    that.createSampleDataScope1(that.consolidatedData(selectedData, "Scope 1"));
                                    that.createSampleDataScope2(that.consolidatedData(selectedData, "Scope 2"));
                                    that.createSampleDataScope3(that.consolidatedData(selectedData, "Scope 3"));
                                }
                                else {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.Error("No data found")
                                }


                            });
                        }
                        else {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error("No data found")
                        }
                    });
                });

                // this._originalData = this._getSampleData(); // Store original data
                this._charts = {};
                // this._renderSections(this._originalData);
            },
            createSampleData: function (branchData) {
                var that = this;

                if (branchData) {
                    var sampleData = {
                        Overview: {
                            "KPI": [{
                                header: "Total Emissions",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.TotalEmissions),
                                scale: ""
                            },
                            {
                                header: "Scope 1",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 1"]),
                                scale: ""
                            },
                            {
                                header: "Scope 2",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 2"]),
                                scale: ""
                            },
                            {
                                header: "Scope 3",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 3"]),
                                scale: ""
                            },
                            {
                                header: "Water",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Water),
                                scale: ""
                            },
                            {
                                header: "Water Stress",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Water Stress"]),
                                scale: ""
                            },
                            {
                                header: "Waste",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Waste),
                                scale: ""
                            },
                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Scope Emission comparison",
                                labels: ['Scope 1', 'Scope 2', 'Scope 3'],
                                data: [[branchData["Scope 1"], branchData["Scope 2"], branchData["Scope 3"]]],
                                datasetLabels: ["Dataset 1"]
                            },
                                // {
                                //     type: "line",
                                //     title: "Scope wise Emission by Year",
                                //     labels: ['2024', '2025'],
                                //     data: [[50, 30], [40, 10], [30, 20]],
                                //     datasetLabels: ["Scope1", "Scope 2", "Scope 3"]
                                // }
                            ]
                        }
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.Overview.KPI, "KPIData");
                    this._generateChartForSelection(sampleData.Overview.Charts, "chartData");

                    // this._onRenderChart("ageChart")

                }
            },
            createSampleDataScope1: function (branchData) {
                var that = this;

                if (branchData) {
                    var sampleData = {
                        Overview: {
                            "KPI": [{
                                header: "Scope 1",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 1"]),
                                scale: ""
                            },
                            {
                                header: "Bioenergy",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Bioenergy),
                                scale: ""
                            },
                            {
                                header: "Fuels",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Fuels),
                                scale: ""
                            },
                            {
                                header: "Owned Vehicles",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Owned Vehicles"]),
                                scale: ""
                            },
                            {
                                header: "Refrigerant",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Refrigerant),
                                scale: ""
                            },

                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Scope Emission split by source",
                                labels: Object.keys(branchData.Emission),
                                data: [Object.values(branchData.Emission)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "doughnut",
                                title: "Bioenergy Emission split",
                                labels: Object.keys(branchData.BioenergySplit),
                                data: [Object.values(branchData.BioenergySplit)],
                                datasetLabels: ["Dataset 1"]
                            }]
                        }
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.Overview.KPI, "KPIDataScope1");
                    this._generateChartForSelection(sampleData.Overview.Charts, "chartDataScope1");

                    // this._onRenderChart("ageChart")

                }
            },
            createSampleDataScope2: function (branchData) {
                var that = this;

                if (branchData) {
                    var sampleData = {
                        Overview: {
                            "KPI": [{
                                header: "Scope 2",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 2"]),
                                scale: ""
                            },
                            {
                                header: "District Cooling",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["District Cooling"]),
                                scale: ""
                            },
                            {
                                header: "Electricity",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData.Electricity),
                                scale: ""
                            },
                            {
                                header: "Heat and steam",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Heat and steam"]),
                                scale: ""
                            },
                            {
                                header: "Electricity - Backup",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Electricity - Backup"]),
                                scale: ""
                            },
                            {
                                header: "Owned Vehicles",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Owned Vehicles"]),
                                scale: ""
                            },

                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Emission split by Activity",
                                labels: ["District Cooling", "Electricity", "Heat and steam", "Electricity - Backup", "Owned Vehicles"],
                                data: [[branchData["District Cooling"], branchData.Electricity, branchData["Heat and steam"], branchData["Electricity - Backup"], branchData["Owned Vehicles"]]],
                                datasetLabels: ["Dataset 1"]
                            }]
                        }
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.Overview.KPI, "KPIDataScope2");
                    this._generateChartForSelection(sampleData.Overview.Charts, "chartDataScope2");

                    // this._onRenderChart("ageChart")

                }
            },
            createSampleDataScope3: function (branchData) {
                var that = this;

                if (branchData) {
                    var sampleData = {
                        Overview: {
                            "KPI": [{
                                header: "Scope 3",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Scope 3"]),
                                scale: ""
                            },
                            {
                                header: "Business travel - land and sea",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Business travel - land and sea"]),
                                scale: ""
                            },
                            {
                                header: "Employees commuting",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Employees commuting"]),
                                scale: ""
                            },
                            {
                                header: "Flight",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Flight"]),
                                scale: ""
                            },
                            {
                                header: "Freighting goods",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Freighting goods"]),
                                scale: ""
                            },
                            {
                                header: "Materials",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Materials"]),
                                scale: ""
                            },
                            {
                                header: "Waste Disposal",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Waste Disposal"]),
                                scale: ""
                            },
                            {
                                header: "WTT- fuels",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["WTT- fuels"]),
                                scale: ""
                            },

                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Emission split by Source",
                                labels: ["Business travel - land and sea",
                                    "Employees commuting",
                                    "Flight",
                                    "Freighting goods",
                                    "Materials",
                                    "Waste Disposal",
                                    "WTT- fuels"],
                                data: [[branchData["Business travel - land and sea"],
                                branchData["Employees commuting"],
                                branchData["Flight"],
                                branchData["Freighting goods"],
                                branchData["Materials"],
                                branchData["Waste Disposal"],
                                branchData["WTT- fuels"]]],
                                datasetLabels: ["Dataset 1"]
                            }]
                        }
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.Overview.KPI, "KPIDataScope3");
                    this._generateChartForSelection(sampleData.Overview.Charts, "chartDataScope3");

                    // this._onRenderChart("ageChart")

                }
            },
            applyFilters: function (oEvent) {
                var that = this;
                var filterTitle = oEvent.getSource().data().title;
                var SelectedKey = oEvent.getSource().getSelectedKey();
                var filterContainerItems = this.byId("graphFilters").getItems();

                var filterIndex = oEvent.getSource().data().index;
                for (var i = filterIndex + 1; i < filterContainerItems.length; i++) {
                    filterContainerItems[i].setSelectedKey("All");
                }
                var branch = "";
                filterContainerItems.forEach(function (item, index) {
                    if (item instanceof sap.m.Select) {
                        var selectedKey = item.getSelectedKey();
                        if (selectedKey && selectedKey !== "All") {
                            branch += selectedKey + "-"
                        }
                    }
                });
                branch = branch.substring(0, branch.length - 1);
                var selectedData = Object.keys(that.analyticsData).filter(val => val.indexOf(branch) !== -1)
                that.createSampleData(that.consolidatedData(selectedData, "Overview"));
                that.createSampleDataScope1(that.consolidatedData(selectedData, "Scope 1"));
                that.createSampleDataScope2(that.consolidatedData(selectedData, "Scope 2"));
                that.createSampleDataScope3(that.consolidatedData(selectedData, "Scope 3"));
                for (var i = filterIndex + 1; i < filterContainerItems.length; i++) {
                    var title = filterContainerItems[i].data().title;
                    filterContainerItems[i].removeAllItems();
                    var data = that[title];
                    data = data.filter(key => key[filterTitle] === SelectedKey)
                    filterContainerItems[i].addItem(new sap.ui.core.Item({
                        key: "All",
                        text: "All"
                    }))
                    for (var j = 0; j < data.length; j++) {
                        filterContainerItems[i].addItem(new sap.ui.core.Item({
                            key: data[j].title,
                            text: data[j].title
                        }))
                    }
                    filterContainerItems[i].setSelectedKey("All");
                }
            },
            consolidatedData: function (data, module) {
                var that = this;
                if (data.length > 1) {
                    var oData = [];
                    data.forEach(val => {
                        oData.push(that.analyticsData[val].Environment);
                    })
                }
                else {
                    return that.analyticsData[data[0]].Environment[module]
                }
                var consolidatedData = "";
                switch (module) {
                    case "Overview": consolidatedData = {
                        TotalEmissions: 0,
                        "Scope 1": 0,
                        "Scope 2": 0,
                        "Scope 3": 0,
                        Water: 0,
                        "Water Stress": 0,
                        Waste: 0
                    };
                        oData.forEach(val => {
                            consolidatedData.TotalEmissions += parseFloat(val[module].TotalEmissions) || 0;
                            consolidatedData["Scope 1"] += parseFloat(val[module]["Scope 1"]) || 0;
                            consolidatedData["Scope 2"] += parseFloat(val[module]["Scope 2"]) || 0;
                            consolidatedData["Scope 3"] += parseFloat(val[module]["Scope 3"]) || 0;
                            consolidatedData.Water += parseFloat(val[module].Water) || 0;
                            consolidatedData["Water Stress"] += parseFloat(val[module]["Water Stress"]) || 0;
                            consolidatedData.Waste += parseFloat(val[module].Waste) || 0;
                            consolidatedData.Scope = consolidatedData.Scope ? that.sumData(consolidatedData.Scope, val[module].Scope) : val[module].Scope;
                        })
                        break;
                    case "Scope 1": consolidatedData = {
                        "Scope 1": 0,
                        Bioenergy: 0,
                        Fuels: 0,
                        "Owned Vehicles": 0,
                        Refrigerant: 0,
                    };
                        oData.forEach(val => {
                            consolidatedData["Scope 1"] += parseFloat(val[module]["Scope 1"]) || 0;
                            consolidatedData.Bioenergy += parseFloat(val[module].Bioenergy) || 0;
                            consolidatedData.Fuels += parseFloat(val[module].Fuels) || 0;
                            consolidatedData["Owned Vehicles"] += parseFloat(val[module]["Owned Vehicles"]) || 0;
                            consolidatedData.Refrigerant += parseFloat(val[module].Refrigerant) || 0;
                            consolidatedData.Emission = consolidatedData.Emission ? that.sumData(consolidatedData.Emission, val[module].Emission) : val[module].Emission;
                            consolidatedData.BioenergySplit = consolidatedData.BioenergySplit ? that.sumData(consolidatedData.BioenergySplit, val[module].BioenergySplit) : val[module].BioenergySplit;
                        })
                        break;
                    case "Scope 2": consolidatedData = {
                        "Scope 2": 0,
                        "District Cooling": 0,
                        Electricity: 0,
                        "Heat and steam": 0,
                        "Electricity - Backup": 0,
                        "Owned Vehicles": 0,
                    };
                        oData.forEach(val => {
                            consolidatedData["Scope 2"] += parseFloat(val[module]["Scope 2"]) || 0;
                            consolidatedData["District Cooling"] += parseFloat(val[module]["District Cooling"]) || 0;
                            consolidatedData.Electricity += parseFloat(val[module].Electricity) || 0;
                            consolidatedData["Heat and steam"] += parseFloat(val[module]["Heat and steam"]) || 0;
                            consolidatedData["Electricity - Backup"] += parseFloat(val[module]["Electricity - Backup"]) || 0;
                            consolidatedData["Owned Vehicles"] = parseFloat(val[module]["Owned Vehicles"]) || 0;
                            consolidatedData.Activities = consolidatedData.Activities ? that.sumData(consolidatedData.Activities, val[module].Activities) : val[module].Activities;
                        })
                        break;
                    case "Scope 3": consolidatedData = {
                        "Scope 3": 0,
                        "Business travel - land and sea": 0,
                        "Employees commuting": 0,
                        "Flight": 0,
                        "Freighting goods": 0,
                        "Materials": 0,
                        "Waste Disposal": 0,
                        "WTT- fuels": 0
                    };
                        oData.forEach(val => {
                            consolidatedData["Scope 3"] += parseFloat(val[module]["Scope 3"]) || 0;
                            consolidatedData["Business travel - land and sea"] += parseFloat(val[module]["Business travel - land and sea"]) || 0;
                            consolidatedData["Employees commuting"] += parseFloat(val[module]["Employees commuting"]) || 0;
                            consolidatedData["Flight"] += parseFloat(val[module]["Flight"]) || 0;
                            consolidatedData["Freighting goods"] += parseFloat(val[module]["Freighting goods"]) || 0;
                            consolidatedData["Materials"] = parseFloat(val[module]["Materials"]) || 0;
                            consolidatedData["Waste Disposal"] = parseFloat(val[module]["Waste Disposal"]) || 0;
                            consolidatedData["WTT- fuels"] = parseFloat(val[module]["WTT- fuels"]) || 0;
                            consolidatedData.Emission = consolidatedData.Emission ? that.sumData(consolidatedData.Emission, val[module].Emission) : val[module].Emission;
                        })
                        break;

                }

                return consolidatedData;
            },

            sumData: function (obj1, obj2) {
                let result = {};

                // If obj1 is null or empty, return obj2
                if (!obj1 || Object.keys(obj1).length === 0) {
                    return { ...obj2 };
                }

                // If obj2 is null or empty, return obj1
                if (!obj2 || Object.keys(obj2).length === 0) {
                    return { ...obj1 };
                }

                // Iterate through the keys of both objects and sum the values
                for (let key in obj1) {
                    if (obj1.hasOwnProperty(key)) {
                        // Add the value from obj1
                        result[key] = obj1[key];
                    }
                }

                for (let key in obj2) {
                    if (obj2.hasOwnProperty(key)) {
                        // Sum the values if the key exists in both objects; otherwise, take the value from obj2
                        result[key] = result[key] ? result[key] + obj2[key] : obj2[key];
                    }
                }

                return result;
            },
            consolidatePercentage: function (data1, data2) {
                // Calculate total sum for each data set
                var total1 = data1["Scope 1"] + data1["Scope 2"] + data1["Scope 3"];
                var total2 = data2["Scope 1"] + data2["Scope 2"] + data2["Scope 3"];

                // Calculate the consolidated percentages as weighted averages
                var consolidatedScope1 = (
                    (data1["Scope 1"] * total1 + data2["Scope 1"] * total2) /
                    (total1 + total2)
                ).toFixed(2);

                var consolidatedScope2 = (
                    (data1["Scope 2"] * total1 + data2["Scope 2"] * total2) /
                    (total1 + total2)
                ).toFixed(2);

                var consolidatedScope3 = (
                    (data1["Scope 3"] * total1 + data2["Scope 3"] * total2) /
                    (total1 + total2)
                ).toFixed(2);

                // Return the consolidated data as a JavaScript object
                return {
                    ["Scope 1"]: parseFloat(consolidatedScope1),
                    ["Scope 2"]: parseFloat(consolidatedScope2),
                    ["Scope 3"]: parseFloat(consolidatedScope3)
                };
            },
            consolidateRatios: function (ratio1, ratio2) {
                // Function to validate and parse the ratio input
                function parseRatio(ratio) {
                    if (!ratio || typeof ratio !== "string" || !ratio.includes(":")) {
                        return [0, 1]; // Return a default ratio of 0:1 for invalid input
                    }
                    return ratio.split(":").map(Number);
                }

                // Parse and validate both ratios
                let [a, b] = parseRatio(ratio1);
                let [c, d] = parseRatio(ratio2);

                // Handle cases where the denominator is zero to avoid division issues
                if (b === 0) b = 1;
                if (d === 0) d = 1;

                // Convert both ratios to have a common denominator
                // let commonDenominator = b * d;
                let numerator1 = a + c;
                let numerator2 = b + d;

                // Add the numerators
                let combinedNumerator = numerator1 + numerator2;

                // The combined ratio is the sum of numerators over the common denominator
                return `${numerator1}:${numerator2}`;
            },
            _generateKPIForSelection: function (selectedData, id) {

                // Clear previous KPI and Chart boxes
                var oHBox = this.byId(id)
                oHBox.removeAllItems();


                selectedData.map(function (kpi) {
                    // oHBox.addItem(new GenericTile({
                    //     header: kpi.header,
                    //     subheader: kpi.subheader,
                    //     frameType: "OneByHalf",
                    //     pressEnabled: false,
                    //     tileContent: [
                    //         new TileContent({
                    //             unit: kpi.subheader,
                    //             content: new NumericContent({
                    //                 scale: kpi.scale,
                    //                 value: kpi.value,
                    //                 withMargin: false
                    //             })
                    //         })
                    //     ]
                    // }).addStyleClass("sapUiTinyMarginBeginEnd sapUiTinyMarginTop tileLayout")
                    // )
                    oHBox.addItem(new VBox({
                        items: [new sap.m.Title({
                            text: kpi.header,
                            level: "H4",
                            titleStyle: "H4"
                        }),
                        new sap.m.Title({
                            text: kpi.value,
                            level: "H2",
                            titleStyle: "H2"
                        })]
                    }).addStyleClass("sapUiTinyMarginBeginEnd sapUiTinyMarginTop tileLayout kpi-style")).addStyleClass("sapUiTinyMarginBeginEnd sapUiTinyMarginTop tileLayout")
                });


            },
            _generateChartForSelection: function (selectedData, id) {

                // Clear previous KPI and Chart boxes
                var oHBox = this.byId(id)
                oHBox.removeAllItems();
                // var aChartItems = selectedData.Charts.map(function (chart) {
                selectedData.map(function (chart, index) {
                    var sHTMLContent = `<div class="chart-style" style="width:350px"><canvas id="${id}Chart${index}"></canvas></div>`;
                    oHBox.addItem(new HTML({
                        content: sHTMLContent,
                        afterRendering: this._onRenderChart.bind(this, chart, `${id}Chart${index}`)
                    }));
                }.bind(this));



            },

            _onRenderChart: function (data, canvasId,) {
                var ctx = document.getElementById(canvasId).getContext("2d");
                var colors = ["#1977d3", "#b81d1c", "#ffb300", "#378f3c", "#5c6cc0", "#a9358b", "#1181b6", "#f5521d", "#9e9d24", "#8f24aa", "#ad1557"]
                // Check if there's an existing chart instance for this canvas, and destroy it if it exists
                if (this._charts && this._charts[canvasId]) {
                    this._charts[canvasId].destroy();
                }
                var chart = data
                // Create the new chart and store the instance in the _charts object
                var datasets = [];
                if (chart.type == "line") {
                    chart.data.map((val, index) => {
                        datasets.push({
                            label: chart.datasetLabels[index],
                            data: val,
                            borderColor: colors[index],
                            backgroundColor: [colors[index]]
                        })
                    });
                }
                else {

                    chart.data.map((val, index) => {
                        datasets.push({
                            data: val,
                            backgroundColor: colors.splice(0, val.length)
                        })
                    });
                }

                this._charts[canvasId] = new Chart(ctx, {
                    type: chart.type,
                    data: {
                        labels: chart.labels,
                        datasets: datasets
                    },
                    options: {

                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: chart.title
                            },
                        },
                        interaction: {
                            mode: 'nearest',
                            axis: 'x',
                            intersect: false
                        },
                    }
                });
            },

        });
    }
);