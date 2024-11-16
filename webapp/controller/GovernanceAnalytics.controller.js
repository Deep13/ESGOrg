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
        return Controller.extend("ESGOrg.ESGOrg.controller.GovernanceAnalytics", {
            /**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf ESGOrg.ESGOrg.view.GovernanceAnalytics
             */
            onInit: function () {
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter
                    .getRoute("GovernanceAnalytics")
                    .attachPatternMatched(this._handleRouteMatched, this);
            },
            _handleRouteMatched: function () {
                var that = this;
                this.checkgetUserLog().then(user => {
                    var oHBox = this.byId("chartData")
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
                                var branchData = that.analyticsData[branches[0].title].Governance;
                                that.createSampleData(branchData.Overview);
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
                        var branchData = that.analyticsData[branches[0].title].Governance;
                        that.createSampleData(branchData.Overview);
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
                                title: "Age Comparison",
                                labels: ['50+', '35-50', 'Less than 22', "22 to 35"],
                                data: [[0, 0, 0, 0]],
                                datasetLabels: ["Dataset 1"]

                            },
                            {
                                type: "doughnut",
                                title: "Gender ratio",
                                labels: ['Male', 'Female', 'Others'],
                                data: [[0, 0, 0]],
                                datasetLabels: ["Dataset 1"]
                            }, {
                                type: "doughnut",
                                title: "Scope Comparison",
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
                        "KPI": [{
                            header: "BODs",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData["BODs"]),
                            scale: ""
                        },
                        {
                            header: "BODSFemale",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData["BODSFemale"]),
                            scale: ""
                        },
                        {
                            header: "CFO/CEO",
                            subheader: "Kgco2",
                            value: that.formatNumberWithUnit(branchData["CFO/CEO"]),
                            scale: ""
                        },
                        {
                            header: "CFO/CEO-Female",
                            subheader: "Trees Planted",
                            value: that.formatNumberWithUnit(branchData["CFO/CEO-Female"]),
                            scale: ""
                        },
                        {
                            header: "Independent Directors",
                            subheader: "Expenditure",
                            value: that.formatNumberWithUnit(branchData["Independent Directors"]),
                            scale: ""
                        },
                        {
                            header: "Revenue",
                            subheader: "People",
                            value: that.formatNumberWithUnit(branchData["Revenue"]),
                            scale: ""
                        },
                        {
                            header: "Turnover",
                            subheader: "Female:Male",
                            value: that.formatNumberWithUnit(branchData["Turnover"]),
                            scale: ""
                        }],
                        "Charts": [{
                            type: "doughnut",
                            title: "Gender Comparison",
                            labels: Object.keys(branchData.Gender),
                            data: [Object.values(branchData.Gender)],
                            datasetLabels: ["Dataset 1"]

                        },
                        {
                            type: "doughnut",
                            title: "Entity Type Comparison",
                            labels: Object.keys(branchData["EntityType"]),
                            data: [Object.values(branchData["EntityType"])],
                            datasetLabels: ["Dataset 1"]

                        }]
                    }

                    this.sampleData = sampleData;
                    this._generateKPIForSelection(sampleData.KPI);
                    this._generateChartForSelection(sampleData.Charts);

                    // this._onRenderChart("ageChart")

                }
            },
            onBranchChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                if (this.analyticsData) {
                    var branchData = this.analyticsData[title].Governance;
                    this.createSampleData(branchData.Overview);
                }
            },

            _generateKPIForSelection: function (selectedData) {

                // Clear previous KPI and Chart boxes
                var oHBox = this.byId("KPIData")
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