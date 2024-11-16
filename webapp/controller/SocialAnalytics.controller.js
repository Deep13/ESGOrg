sap.ui.define(
    ["../controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/GenericTile",
        "sap/m/TileContent",
        "sap/m/NumericContent",
        "sap/m/HBox",
        "sap/m/VBox",
        "sap/uxap/ObjectPageSection",
        "sap/uxap/ObjectPageSubSection",
        "sap/ui/core/HTML",
        "sap/m/Select",
        "sap/ui/core/Item",
        "sap/m/Label",],
    function (Controller, JSONModel, GenericTile, TileContent, NumericContent, HBox, VBox, ObjectPageSection, ObjectPageSubSection, HTML, Item, Select, Label) {
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
                    var aCanvas = document.getElementsByTagName("canvas");
                    for (let i = aCanvas.length - 1; i >= 0; i--) {
                        aCanvas[i].remove();
                    }
                    firebase.firestore().collection(user.domain).doc("Master Data").collection("Reporting Cycle").doc("All Cycle").get().then(doc => {
                        var cycle = [];
                        if (doc.exists) {

                            Object.keys(doc.data()).map(val => {
                                var data = doc.data()[val];
                                data.title = val;
                                cycle.push(data);
                            });
                        }
                        else {

                        }

                        var cycleModel = new JSONModel({ results: cycle });

                        that.getView().setModel(cycleModel, "cycleModel");
                        that.byId("cycleId").setSelectedKey(cycle[0].title)
                        firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").doc(cycle[0].title).get().then(doc => {
                            if (doc.exists) {
                                var branches = [];
                                var data = doc.data().data;

                                Object.keys(data).map(val => {
                                    branches.push({ title: val })
                                })
                                var cycleModel = new JSONModel({ results: branches });
                                that.analyticsData = data;
                                var branchData = that.analyticsData[branches[0].title].Social;
                                that.createSampleData(branchData.Overview);
                                that.createSampleDataScope1(branchData["PrivacyOthers"]);
                                // that.createSampleDataScope2(branchData["Scope 2"]);
                                // that.createSampleDataScope3(branchData["Scope 3"]);
                                that.getView().setModel(cycleModel, "branchModel");
                                that.byId("branchId").setSelectedKey(branches[0].title)
                            }
                            else {
                                sap.m.MessageBox.Error("No data found")
                            }


                        });

                        sap.ui.core.BusyIndicator.hide();
                    });
                });

                this._originalData = this._getSampleData(); // Store original data
                this._charts = {};
                // this._renderSections(this._originalData);
            },
            onCycleChange: function (oEvent) {
                var that = this;
                var user = this.userData;
                console.log(oEvent)
                var cycle = oEvent.getParameter("selectedItem").getKey();
                firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").doc(cycle).get().then(doc => {
                    if (doc.exists) {
                        var branches = [];
                        var data = doc.data().data;
                        that.analyticsData = data;
                        Object.keys(data).map(val => {
                            branches.push({ title: val })
                        })
                        var cycleModel = new JSONModel({ results: branches });
                        var branchData = that.analyticsData[branches[0].title].Social;
                        that.createSampleData(branchData.Overview);
                        that.createSampleDataScope1(branchData["PrivacyOthers"]);
                        // that.createSampleDataScope2(branchData["Scope 2"]);
                        // that.createSampleDataScope3(branchData["Scope 3"]);
                        that.getView().setModel(cycleModel, "branchModel");
                        that.byId("branchId").setSelectedKey(branches[0].title)
                    }
                    else {
                        var emptyData = {
                            "KPI": [{
                                header: "Total Emissions",
                                subheader: "Kgco2",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Water",
                                subheader: "Kgco2",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Waste",
                                subheader: "Kgco2",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Biodiversity",
                                subheader: "Trees Planted",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Social Spend",
                                subheader: "Expenditure",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Beneficiaries",
                                subheader: "People",
                                value: 0,
                                scale: ""
                            },
                            {
                                header: "Gender Split",
                                subheader: "Female:Male",
                                value: 0,
                                scale: ""
                            }],
                            "Charts": [{
                                type: "doughnut",
                                title: "Title 1",
                                labels: ['50+', '35-50', 'Less than 22', "22 to 35"],
                                data: [[0, 0, 0, 0]],
                                datasetLabels: ["Dataset 1"]

                            },
                            {
                                type: "doughnut",
                                title: "Title 2",
                                labels: ['Male', 'Female', 'Others'],
                                data: [[0, 0, 0]],
                                datasetLabels: ["Dataset 1"]
                            }, {
                                type: "doughnut",
                                title: "Title 3",
                                labels: ['Scope 1', 'Scope 2', 'Scope 3'],
                                data: [[0, 0, 0]],
                                datasetLabels: ["Dataset 1"]
                            }]
                        }
                        this.sampleData = emptyData;
                        this.analyticsData = undefined
                        this._generateKPIForSelection(emptyData.KPI);
                        this._generateChartForSelection(emptyData.Charts);
                        var cycleModel = new JSONModel({ results: [] });
                        that.getView().setModel(cycleModel, "branchModel");
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
                                labels: Object.keys(branchData.Activities),
                                data: [Object.values(branchData.Activities)],
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
                                header: "Frieghting goods",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["Frieghting goods"]),
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
                                header: "WTT- fuel",
                                subheader: "Kgco2",
                                value: that.formatNumberWithUnit(branchData["WTT- fuel"]),
                                scale: ""
                            },

                            ],
                            "Charts": [{
                                type: "doughnut",
                                title: "Emission split by Source",
                                labels: Object.keys(branchData.Emission),
                                data: [Object.values(branchData.Emission)],
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
            _getSampleData: function () {
                return {
                    "Overview": {
                        "locations": {
                            "Jharkhand": {
                                "2023": {
                                    "KPI": [{
                                        header: "Total Emissions",
                                        subheader: "Kgco2",
                                        value: "234",
                                        scale: "M"
                                    },
                                    {
                                        header: "Water",
                                        subheader: "Kgco2",
                                        value: "206",
                                        scale: "M"
                                    },
                                    {
                                        header: "Waste",
                                        subheader: "Kgco2",
                                        value: "0",
                                        scale: "K"
                                    },
                                    {
                                        header: "Biodiversity",
                                        subheader: "Trees Planted",
                                        value: "60",
                                        scale: ""
                                    },
                                    {
                                        header: "Social Spend",
                                        subheader: "Expenditure",
                                        value: "103",
                                        scale: "K"
                                    },
                                    {
                                        header: "Beneficiaries",
                                        subheader: "People",
                                        value: "103",
                                        scale: "K"
                                    },
                                    {
                                        header: "Gender Split",
                                        subheader: "Female:Male",
                                        value: "1.31",
                                        scale: ""
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Title 1",
                                        labels: ['50+', '35-50', 'Less than 22', "22 to 35"],
                                        data: [[52.6, 36.8, 7.9, 2.6]],
                                        datasetLabels: ["Dataset 1"]

                                    },
                                    {
                                        type: "doughnut",
                                        title: "Title 2",
                                        labels: ['Male', 'Female', 'Others'],
                                        data: [[52.6, 44.7, 2.6]],
                                        datasetLabels: ["Dataset 1"]
                                    }, {
                                        type: "doughnut",
                                        title: "Title 3",
                                        labels: ['Scope 1', 'Scope 2', 'Scope 3'],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Dataset 1"]
                                    }]
                                }
                            }
                        }
                    }
                };
            },
            onBranchChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                if (this.analyticsData) {
                    var branchData = this.analyticsData[title].Social;
                    this.createSampleData(branchData.Overview);
                    this.createSampleDataScope1(branchData["PrivacyOthers"]);
                    // this.createSampleDataScope2(branchData["Scope 2"]);
                    // this.createSampleDataScope3(branchData["Scope 3"]);

                }
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