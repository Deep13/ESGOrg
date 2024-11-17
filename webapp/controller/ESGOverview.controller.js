sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel",
        "sap/m/VBox",
        "sap/ui/core/HTML",
        "sap/ui/core/CustomData"],
    function (Controller, JSONModel, VBox, HTML, CustomData) {
        "use strict";
        return Controller.extend("ESGOrg.ESGOrg.controller.ESGOverview", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.ESGOverview
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("ESGOverview")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    var oHBox = this.byId("chartData")
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
                                    that.createSampleData(that.consolidatedData(selectedData));
                                }
                                else {
                                    sap.ui.core.BusyIndicator.hide();
                                    sap.m.MessageBox.error("No data found")
                                }
                            });
                        }
                        else {
                            sap.ui.core.BusyIndicator.hide();
                            sap.m.MessageBox.error("No data found")
                        }


                    });
                });

                this._charts = {};
                // this._renderSections(this._originalData);
            },
            createSampleData: function (branchData) {
                var that = this;

                if (Object.keys(branchData).length > 0) {
                    var sampleData = {
                        "KPI": [{
                            header: "Total Emissions",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData.TotalEmissions),
                            scale: ""
                        },
                        {
                            header: "Water",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData.Water),
                            scale: ""
                        },
                        {
                            header: "Waste",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData.Waste),
                            scale: ""
                        },
                        {
                            header: "Biodiversity",
                            subheader: "Trees Planted",
                            value: that.formatNumberWithUnit(branchData.Biodiversity),
                            scale: ""
                        },
                        {
                            header: "Social Spend",
                            subheader: "Expenditure",
                            value: that.formatNumberWithUnit(branchData.SocialSpend),
                            scale: ""
                        },
                        {
                            header: "Beneficiaries",
                            subheader: "People",
                            value: that.formatNumberWithUnit(branchData.Beneficiaries),
                            scale: ""
                        },
                        {
                            header: "Gender Split",
                            subheader: "Female:Male",
                            value: branchData.GenderSplit,
                            scale: ""
                        }],
                        "Charts": [{
                            type: "doughnut",
                            title: "Age Comparison",
                            labels: ['50+', '35-50', 'Less than 22', "22 to 35"],
                            data: [[branchData.AgeCount['50+'], branchData.AgeCount['35 to 50'], branchData.AgeCount['Less than 22'], branchData.AgeCount['22 to 35']]],
                            datasetLabels: ["Dataset 1"]
                        },
                        {
                            type: "doughnut",
                            title: "Gender ratio",
                            labels: ['Male', 'Female', 'Others'],
                            data: [[branchData.GenderCount["Male"], branchData.GenderCount["Female"], branchData.GenderCount["Others"]]],
                            datasetLabels: ["Dataset 1"]
                        }, {
                            type: "doughnut",
                            title: "Scope comparison",
                            labels: ['Scope 1', 'Scope 2', 'Scope 3'],
                            data: [[branchData.Scope["Scope 1"], branchData.Scope["Scope 2"], branchData.Scope["Scope 3"]]],
                            datasetLabels: ["Dataset 1"]
                        }]
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.KPI);
                    this._generateChartForSelection(sampleData.Charts);

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
                that.createSampleData(that.consolidatedData(selectedData));
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
            consolidatedData: function (data) {
                var that = this;
                if (data.length > 1) {
                    var oData = [];
                    data.forEach(val => {
                        oData.push(that.analyticsData[val]);
                    })
                }
                else {
                    return that.analyticsData[data[0]].Overview
                }

                var consolidatedData = {
                    TotalEmissions: 0,
                    Water: 0,
                    Waste: 0,
                    Biodiversity: 0,
                    SocialSpend: 0,
                    Beneficiaries: 0,
                    GenderSplit: 0
                };
                oData.forEach(val => {
                    consolidatedData.TotalEmissions += parseFloat(val.Overview.TotalEmissions) || 0;
                    consolidatedData.Water += parseFloat(val.Overview.Water) || 0;
                    consolidatedData.Waste += parseFloat(val.Overview.Waste) || 0;
                    consolidatedData.Biodiversity += parseFloat(val.Overview.Biodiversity) || 0;
                    consolidatedData.SocialSpend += parseFloat(val.Overview.SocialSpend) || 0;
                    consolidatedData.Beneficiaries += parseFloat(val.Overview.Beneficiaries) || 0;
                    consolidatedData.GenderSplit = consolidatedData.GenderSplit ? that.consolidateRatios(consolidatedData.GenderSplit, val.Overview.GenderSplit) : val.Overview.GenderSplit;
                    consolidatedData.Scope = consolidatedData.Scope ? that.consolidatePercentage(consolidatedData.Scope, val.Overview.Scope) : val.Overview.Scope;
                    consolidatedData.AgeCount = consolidatedData.AgeCount ? that.sumData(consolidatedData.AgeCount, val.Overview.AgeCount) : val.Overview.AgeCount;
                    consolidatedData.GenderCount = consolidatedData.GenderCount ? that.sumData(consolidatedData.GenderCount, val.Overview.GenderCount) : val.Overview.GenderCount;
                })

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
            _generateKPIForSelection: function (selectedData) {

                // Clear previous KPI and Chart boxes
                var oHBox = this.byId("KPIData")
                oHBox.removeAllItems();


                selectedData.map(function (kpi) {
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
            _generateChartForSelection: function (selectedData) {

                // Clear previous KPI and Chart boxes
                var oHBox = this.byId("chartData")
                oHBox.removeAllItems();
                // var aChartItems = selectedData.Charts.map(function (chart) {
                selectedData.map(function (chart, index) {
                    var sHTMLContent = `<div class="chart-style" style="width:350px"><canvas id="Chart${index}"></canvas></div>`;
                    oHBox.addItem(new HTML({
                        content: sHTMLContent,
                        afterRendering: this._onRenderChart.bind(this, chart, `Chart${index}`)
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