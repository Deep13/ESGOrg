sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel",
        "sap/m/VBox",
        "sap/ui/core/HTML",
        "sap/ui/core/CustomData"],
    function (Controller, JSONModel, VBox, HTML, CustomData) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.SocialAnalytics", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.SocialAnalytics
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("SocialAnalytics")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    var oHBox = this.byId("chartData")
                    oHBox.removeAllItems();
                    var oHBox = this.byId("chartDataScope1")
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
                            sap.ui.core.BusyIndicator.hide();
                            that.getYearWiseData(user, initialSelection)
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
            getYearWiseData: function (user, initialSelection) {
                sap.ui.core.BusyIndicator.show();
                var that = this;
                this.byId("graphFilters").removeAllItems();
                firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").where("year", "==", initialSelection).get().then(querySnapshot => {
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
                        that.createSampleDataScope1(that.consolidatedData(selectedData, "PrivacyOthers"));
                    }
                    else {
                        sap.ui.core.BusyIndicator.hide();
                        sap.m.MessageBox.error("No data found")
                    }
                });
            },
            createSampleData: function (branchData) {
                var that = this;

                if (branchData) {
                    var sampleData = {
                        Overview: {
                            "KPI": [{
                                header: "Headcount",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Headcount"]),
                                scale: ""
                            },
                            {
                                header: "Female:Male",
                                subheader: "Kgco2",
                                value: branchData["Female:Male"],
                                scale: ""
                            },
                            {
                                header: "Total training Hrs",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Total training Hrs"]),
                                scale: ""
                            },
                            {
                                header: "CSR Spend",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["CSR Spend"]),
                                scale: ""
                            },
                            {
                                header: "Attrition",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Attrition"]),
                                scale: ""
                            },
                            {
                                header: "Retention",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Retention"]),
                                scale: ""
                            },
                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Employement Type",
                                labels: Object.keys(branchData.EmployementType),
                                data: [Object.values(branchData.EmployementType)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "doughnut",
                                title: "Gender Split",
                                labels: Object.keys(branchData.Gender),
                                data: [Object.values(branchData.Gender)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "bar",
                                title: "Injury by type",
                                labels: Object.keys(branchData.InjuryType),
                                data: [Object.values(branchData.InjuryType)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "doughnut",
                                title: "Gender Split by injury type",
                                labels: Object.keys(branchData.GenderForInjuries),
                                data: [Object.values(branchData.GenderForInjuries)],
                                datasetLabels: ["Dataset 1"]
                            },

                            {
                                type: "doughnut",
                                title: "Child Labour by Risk Level",
                                labels: Object.keys(branchData.ChildLabor),
                                data: [Object.values(branchData.ChildLabor)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "bar",
                                title: "Child Labour by Supplier Name",
                                labels: Object.keys(branchData.ChildLaborSupplier),
                                data: [Object.values(branchData.ChildLaborSupplier)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "doughnut",
                                title: "Training by Employee segment",
                                labels: Object.keys(branchData.Training),
                                data: [Object.values(branchData.Training)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "bar",
                                title: "Training by Training type",
                                labels: Object.keys(branchData.TrainingType),
                                data: [Object.values(branchData.TrainingType)],
                                datasetLabels: ["Dataset 1"]
                            }]
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

                if (branchData && branchData.Complaints && Object.keys(branchData.Complaints).length > 0) {
                    var sampleData = {
                        Overview: {
                            "Charts": [{
                                type: "bar",
                                title: "Customer Privacy Complaints Received vs. Solved (by complant type)",
                                labels: Object.keys(branchData.Complaints),
                                data: [that.createDataset(branchData.Complaints, "No. of complaints received"), that.createDataset(branchData.Complaints, "No. of complaints solved")],
                                datasetLabels: ["No. of complaints received", "No. of complaints solved"]
                            },
                            {
                                type: "bar",
                                title: "Customer Health & Safety Incidents vs. Customers Impacted ( by incident type)",
                                labels: Object.keys(branchData.CHS),
                                data: [that.createDataset(branchData.CHS, "No. of non-compliance Incidents"), that.createDataset(branchData.CHS, "Customers Impacted")],
                                datasetLabels: ["No. of non-compliance Incidents", "Customers Impacted"]
                            },
                            {
                                type: "bar",
                                title: "Mrktg. & Labelling Incidents Internal vs. Reported (by incident type)",
                                labels: Object.keys(branchData["Mktg and Labelling"]),
                                data: [that.createDataset(branchData["Mktg and Labelling"], "No. of non-compliance Incidents"), that.createDataset(branchData["Mktg and Labelling"], "No. of times regulation violated")],
                                datasetLabels: ["No. of non-compliance Incidents", "No. of times regulation violated"]
                            },
                            {
                                type: "doughnut",
                                title: "Social benefits: Expenditure",
                                labels: Object.keys(branchData.SocialEx),
                                data: [Object.values(branchData.SocialEx)],
                                datasetLabels: ["Dataset 1"]
                            },
                            {
                                type: "doughnut",
                                title: "Social benefits: Benificiaries",
                                labels: Object.keys(branchData.SocialBe),
                                data: [Object.values(branchData.SocialBe)],
                                datasetLabels: ["Dataset 1"]
                            }]
                        }
                    }

                    this.sampleData = sampleData;
                    // this._generateKPIForSelection(sampleData.Overview.KPI, "KPIDataScope1");
                    this._generateChartForSelection(sampleData.Overview.Charts, "chartDataScope1");

                    // this._onRenderChart("ageChart")

                }
            },
            createDataset: function (data, key) {
                var aData = [];
                Object.values(data).map(val => {
                    aData.push(val[key])
                });
                return aData
            },
            applyFilters: function (oEvent) {
                var that = this;
                var filterTitle = oEvent.getSource().data().title;
                var SelectedKey = oEvent.getSource().getSelectedKey();
                if (filterTitle == "years") {
                    that.getYearWiseData(that.userData, SelectedKey)
                }
                else {
                    var filterContainerItems = this.byId("graphFilters").getItems();
                    var filterIndex = oEvent.getSource().data().index;
                    for (var i = filterIndex + 1; i < filterContainerItems.length; i++) {
                        filterContainerItems[i].getItems()[1].setSelectedKey("All");
                    }
                    var branch = "";
                    filterContainerItems.forEach(function (item, index) {
                        if (item.getItems()[1] instanceof sap.m.Select) {
                            var selectedKey = item.getItems()[1].getSelectedKey();
                            if (selectedKey && selectedKey !== "All") {
                                branch += selectedKey + "-"
                            }
                        }
                    });
                    branch = branch.substring(0, branch.length - 1);
                    var selectedData = Object.keys(that.analyticsData).filter(val => val.indexOf(branch) !== -1)
                    that.createSampleData(that.consolidatedData(selectedData, "Overview"));
                    that.createSampleDataScope1(that.consolidatedData(selectedData, "PrivacyOthers"));
                    for (var i = filterIndex + 1; i < filterContainerItems.length; i++) {
                        var title = filterContainerItems[i].getItems()[1].data().title;
                        filterContainerItems[i].getItems()[1].removeAllItems();
                        var data = that[title];
                        data = data.filter(key => key[filterTitle] === SelectedKey)
                        filterContainerItems[i].getItems()[1].addItem(new sap.ui.core.Item({
                            key: "All",
                            text: "All"
                        }))
                        for (var j = 0; j < data.length; j++) {
                            filterContainerItems[i].getItems()[1].addItem(new sap.ui.core.Item({
                                key: data[j].title,
                                text: data[j].title
                            }))
                        }
                        filterContainerItems[i].getItems()[1].setSelectedKey("All");
                    }
                }
            },
            consolidatedData: function (data, module) {
                var that = this;
                if (data.length > 1) {
                    var oData = [];
                    data.forEach(val => {
                        oData.push(that.analyticsData[val].Social);
                    })
                }
                else if (data.length == 1) {
                    return that.analyticsData[data[0]].Social[module]
                }
                else {
                    sap.m.MessageBox.error("No Data record");
                    return {};
                }
                var consolidatedData = "";
                switch (module) {
                    case "Overview": consolidatedData = {
                        "Headcount": 0,
                        "Total training Hrs": 0,
                        "CSR Spend": 0,
                        "Attrition": 0,
                        "Retention": 0,
                    };
                        oData.forEach(val => {
                            consolidatedData["Headcount"] += parseFloat(val[module]["Headcount"]) || 0;
                            consolidatedData["Female:Male"] = consolidatedData["Female:Male"] ? that.consolidateRatios(consolidatedData["Female:Male"], val.Overview["Female:Male"]) : val.Overview["Female:Male"];
                            consolidatedData["Total training Hrs"] += parseFloat(val[module]["Total training Hrs"]) || 0;
                            consolidatedData["CSR Spend"] += parseFloat(val[module]["CSR Spend"]) || 0;
                            consolidatedData["Attrition"] += parseFloat(val[module]["Attrition"]) || 0;
                            consolidatedData["Retention"] += parseFloat(val[module]["Retention"]) || 0;
                            consolidatedData.EmployementType = consolidatedData.EmployementType ? that.sumData(consolidatedData.EmployementType, val[module].EmployementType) : val[module].EmployementType;
                            consolidatedData.Gender = consolidatedData.Gender ? that.sumData(consolidatedData.Gender, val[module].Gender) : val[module].Gender;
                            consolidatedData.InjuryType = consolidatedData.InjuryType ? that.sumData(consolidatedData.InjuryType, val[module].InjuryType) : val[module].InjuryType;
                            consolidatedData.GenderForInjuries = consolidatedData.GenderForInjuries ? that.sumData(consolidatedData.GenderForInjuries, val[module].GenderForInjuries) : val[module].GenderForInjuries;
                            consolidatedData.ChildLabor = consolidatedData.ChildLabor ? that.sumData(consolidatedData.ChildLabor, val[module].ChildLabor) : val[module].ChildLabor;
                            consolidatedData.ChildLaborSupplier = consolidatedData.ChildLaborSupplier ? that.sumData(consolidatedData.ChildLaborSupplier, val[module].ChildLaborSupplier) : val[module].ChildLaborSupplier;
                            consolidatedData.Training = consolidatedData.Training ? that.sumData(consolidatedData.Training, val[module].Training) : val[module].Training;
                            consolidatedData.TrainingType = consolidatedData.TrainingType ? that.sumData(consolidatedData.TrainingType, val[module].TrainingType) : val[module].TrainingType;
                        })
                        break;
                    case "PrivacyOthers": consolidatedData = {
                        Complaints: 0,
                        CHS: 0,
                        "Mktg and Labelling": 0,
                        SocialEx: 0,
                        SocialBe: 0,
                    };
                        oData.forEach(val => {
                            consolidatedData.Complaints = consolidatedData.Complaints ? that.sumData(consolidatedData.Complaints, val[module].Complaints) : val[module].Complaints;
                            consolidatedData.CHS = consolidatedData.CHS ? that.sumData(consolidatedData.CHS, val[module].CHS) : val[module].CHS;
                            consolidatedData["Mktg and Labelling"] = consolidatedData["Mktg and Labelling"] ? that.sumData(consolidatedData["Mktg and Labelling"], val[module]["Mktg and Labelling"]) : val[module]["Mktg and Labelling"];
                            consolidatedData.SocialEx = consolidatedData.SocialEx ? that.sumData(consolidatedData.SocialEx, val[module].SocialEx) : val[module].SocialEx;
                            consolidatedData.SocialBe = consolidatedData.SocialBe ? that.sumData(consolidatedData.SocialBe, val[module].SocialBe) : val[module].SocialBe;
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
                    if (chart.type == "bar") {
                        var sHTMLContent = `<div class="chart-style" style="width:500px"><canvas id="${id}Chart${index}"></canvas></div>`;
                    }
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
                else if (chart.type == "bar") {
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
                        responsive: true,
                        maintainAspectRatio: false, // This keeps the chart responsive but maintains a fixed aspect ratio
                        scales: {
                            x: {
                                ticks: {
                                    callback: function (value) {
                                        // Check label length and truncate if necessary
                                        let label = this.getLabelForValue(value);
                                        return label.length > 10 ? label.substr(0, 10) + '...' : label;
                                    }
                                }
                            }
                        },
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