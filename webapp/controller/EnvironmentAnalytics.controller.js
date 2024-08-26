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
                this.checkgetUserLog().then(user => {

                });

                this._originalData = this._getSampleData(); // Store original data
                this._charts = {};
                this._renderSections(this._originalData);
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
                                        header: "Scope 1",
                                        subheader: "Kgco2",
                                        value: "206",
                                        scale: "M"
                                    },
                                    {
                                        header: "Scope 2",
                                        subheader: "Kgco2",
                                        value: "33",
                                        scale: "K"
                                    },
                                    {
                                        header: "Scope 3",
                                        subheader: "Kgco2",
                                        value: "28",
                                        scale: "M"
                                    },
                                    {
                                        header: "Water",
                                        subheader: "Kgco2",
                                        value: "2",
                                        scale: "K"
                                    },
                                    {
                                        header: "Water Stress",
                                        subheader: "Litres",
                                        value: "3",
                                        scale: "K"
                                    },
                                    {
                                        header: "Waste",
                                        subheader: "Kgco2",
                                        value: "0",
                                        scale: "K"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Emissions split by Scope",
                                        labels: ["Scope1", "Scope 2", "Scope 3"],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Dataset 1"]

                                    },
                                    {
                                        type: "line",
                                        title: "Scope wise emissions by Year",
                                        labels: ["0", "2024", "2025"],
                                        data: [[null, 50, 156.2], [null, 3.31, null], [null, 28.2, 16.9]],
                                        datasetLabels: ["Scope 1", "Scope 2", "Scope 3"]
                                    }]
                                }
                            },
                            "US": {
                                "2023": {
                                    "KPI": [{
                                        header: "Total Emissions",
                                        subheader: "Kgco2",
                                        value: "234",
                                        scale: "M"
                                    },
                                    {
                                        header: "Scope 1",
                                        subheader: "Kgco2",
                                        value: "206",
                                        scale: "M"
                                    },
                                    {
                                        header: "Scope 2",
                                        subheader: "Kgco2",
                                        value: "33",
                                        scale: "K"
                                    },
                                    {
                                        header: "Scope 3",
                                        subheader: "Kgco2",
                                        value: "28",
                                        scale: "M"
                                    },
                                    {
                                        header: "Water",
                                        subheader: "Kgco2",
                                        value: "2",
                                        scale: "K"
                                    },
                                    {
                                        header: "Water Stress",
                                        subheader: "Litres",
                                        value: "3",
                                        scale: "K"
                                    },
                                    {
                                        header: "Waste",
                                        subheader: "Kgco2",
                                        value: "0",
                                        scale: "K"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Emissions split by Scope",
                                        labels: ["Scope1", "Scope 2", "Scope 3"],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Scope 1"]

                                    },
                                    {
                                        type: "line",
                                        title: "Scope wise emissions by Year",
                                        labels: ["0", "2024", "2025"],
                                        data: [[null, 50, 156.2], [null, 3.31, null], [null, 28.2, 16.9]],
                                        datasetLabels: ["Scope 1", "Scope 2", "Scope 3"]
                                    },

                                    {
                                        type: "doughnut",
                                        title: "Emissions split by Scope2",
                                        labels: ["Scope1", "Scope 2", "Scope 3"],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Dataset 1"]

                                    },
                                    {
                                        type: "line",
                                        title: "Scope wise emissions by Year2",
                                        labels: ["0", "2024", "2025"],
                                        data: [[null, 50, 156.2], [null, 3.31, null], [null, 28.2, 16.9]],
                                        datasetLabels: ["Scope 1", "Scope 2", "Scope 3"]
                                    }]
                                }
                            }
                        }
                    },
                    "Scope 1": {
                        "locations": {
                            "Jharkhand": {
                                "2023": {
                                    "KPI": [{
                                        header: "Scope 1",
                                        subheader: "Kgco2",
                                        value: "206",
                                        scale: "M"
                                    },
                                    {
                                        header: "Bioenergy",
                                        subheader: "Kgco2",
                                        value: "2",
                                        scale: "M"
                                    },
                                    {
                                        header: "Fuels",
                                        subheader: "Kgco2",
                                        value: "37",
                                        scale: "M"
                                    },
                                    {
                                        header: "Owned Vehicles",
                                        subheader: "Kgco2",
                                        value: "0.01",
                                        scale: "M"
                                    },
                                    {
                                        header: "Refrigerant",
                                        subheader: "Kgco2",
                                        value: "167",
                                        scale: "M"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Scope 1 Emissions split by Source",
                                        labels: ["Refrigerant & Other", "Fuels", "Bioenergy", "Owned Vehicles"],
                                        data: [[81.3, 17.8, 0.9]],
                                        datasetLabels: ["Dataset 1"]

                                    },
                                    {
                                        type: "doughnut",
                                        title: "Bioenergy Emissions split",
                                        labels: ["Kyoto protocol - standard", "Other perfluorinated gases", "Solid fuels", "Montreal protocol - standard", "Fluorinated ethers", "Liquid fuels", "Kyoto protocol-blends", "Other refrigerants", "Biomass", "Montreal protocol - blends"],
                                        data: [[44.4, 16.8, 12.1, 7.4, 7.4, 5.7, 3.6, 1.1, 0.9, 0.6]],
                                        datasetLabels: ["Dataset 1"]

                                    }]
                                },
                                "2024": {
                                    "KPI": [{
                                        header: "Total Emissions",
                                        subheader: "Kgco2",
                                        value: "140",
                                        scale: "M"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Emissions split by Scope",
                                        labels: ["Scope1", "Scope 2", "Scope 3"],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Scope 1"]

                                    }]
                                }
                            }
                        }
                    },
                    "Scope 2": {
                        "locations": {
                            "Jharkhand": {
                                "2023": {
                                    "KPI": [{
                                        header: "Scope 2",
                                        subheader: "Kgco2",
                                        value: "0.0331",
                                        scale: "M"
                                    },
                                    {
                                        header: "District cooling",
                                        subheader: "Kgco2",
                                        value: "0.01",
                                        scale: "M"
                                    },
                                    {
                                        header: "Electricity.",
                                        subheader: "Kgco2",
                                        value: "0.0249",
                                        scale: "M"
                                    },
                                    {
                                        header: "Heat and steam",
                                        subheader: "Kgco2",
                                        value: "0.01",
                                        scale: "M"
                                    },
                                    {
                                        header: "Owned Vehicles",
                                        subheader: "Kgco2",
                                        value: "0.872",
                                        scale: "M"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Scope 2 Emissions split by Activities",
                                        labels: ["Electricity", "District cooling", "Electricity - Backup", "Heat and steam", "Passenger vehicles"],
                                        data: [[58.8, 32.2, 6.3, 2.4, 0.2]],
                                        datasetLabels: ["Dataset 1"]

                                    }]
                                },
                                "2024": {
                                    "KPI": [{
                                        header: "Total Emissions",
                                        subheader: "Kgco2",
                                        value: "140",
                                        scale: "M"
                                    }],
                                    "Charts": [{
                                        type: "doughnut",
                                        title: "Emissions split by Scope",
                                        labels: ["Scope1", "Scope 2", "Scope 3"],
                                        data: [[88, 0, 12]],
                                        datasetLabels: ["Scope 1"]

                                    }]
                                }
                            }
                        }
                    }
                };
            },

            _renderSections: function (data) {
                var oObjectPageLayout = this.byId("objectPageLayout");
                oObjectPageLayout.removeAllSections(); // Clear any existing sections

                // Loop through each key in the data to create sections and subsections
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var sectionData = data[key];

                        // Create a new ObjectPageSection
                        var oSection = new ObjectPageSection({
                            title: key,
                            subSections: [
                                this._createSubSection(sectionData, key)
                            ]
                        });

                        oObjectPageLayout.addSection(oSection);
                    }
                }
            },
            _onLocationChange: function (oEvent) {
                var oLocationSelect = oEvent.getSource();  // The Location Select control
                var oPeriodSelect = oLocationSelect.data("relatedPeriodSelect");  // The associated Period Select control
                var location = oLocationSelect.getSelectedKey();
                var sectionKey = oLocationSelect.data("sectionKey");
                var sectionData = this._originalData[sectionKey];

                // Update the period select items based on the selected location
                oPeriodSelect.destroyItems();  // Remove existing items

                Object.keys(sectionData.locations[location]).forEach(function (period) {
                    oPeriodSelect.addItem(new sap.ui.core.Item({ key: period, text: period }));
                });

                // Set the default selected period
                oPeriodSelect.setSelectedKey(Object.keys(sectionData.locations[location])[0]);

                // Trigger content update
                this._generateContentForSelection(oPeriodSelect.getParent().getParent(), sectionData, location, oPeriodSelect.getSelectedKey(), sectionKey);
            },

            _createSubSection: function (sectionData, sectionKey) {
                var oLocationSelect = new sap.m.Select({
                    items: Object.keys(sectionData.locations).map(function (loc) {
                        return new sap.ui.core.Item({ key: loc, text: loc });
                    }),
                    selectedKey: Object.keys(sectionData.locations)[0],  // Default selection
                    change: this._onLocationChange.bind(this)  // Event handler for location change
                }).data("sectionKey", sectionKey);  // Store the sectionKey as custom data

                var initialLocation = oLocationSelect.getSelectedKey();
                var oPeriodSelect = new sap.m.Select({
                    items: Object.keys(sectionData.locations[initialLocation]).map(function (period) {
                        return new sap.ui.core.Item({ key: period, text: period });
                    }),
                    selectedKey: Object.keys(sectionData.locations[initialLocation])[0],  // Default selection
                    change: this._onFilterChange.bind(this)  // Event handler for period change
                }).data("sectionKey", sectionKey);  // Store the sectionKey as custom data

                // Store references to both selects for easier access
                oLocationSelect.data("relatedPeriodSelect", oPeriodSelect);

                // Create an HBox to contain the Select controls and labels
                var oFilterBox = new sap.m.HBox({
                    items: [  // Label for Location
                        oLocationSelect,  // Location Select control 
                        oPeriodSelect  // Period Select control
                    ],
                    justifyContent: "End",
                    alignItems: "Center"
                });

                var oVBox = new sap.m.VBox({
                    items: [oFilterBox]
                });

                // Generate initial content based on the default location and period
                this._generateContentForSelection(oVBox, sectionData, initialLocation, oPeriodSelect.getSelectedKey(), sectionKey);

                return new sap.uxap.ObjectPageSubSection({
                    title: sectionKey,
                    blocks: [oVBox]
                });
            }
            ,



            _generateContentForSelection: function (oVBox, sectionData, location, period, sectionKey) {
                var oFilterBox = oVBox.getItems()[0]; // Save the filter box
                // Clear previous KPI and Chart boxes

                oVBox.removeAllItems();

                // Add the filter box back
                oVBox.addItem(oFilterBox);

                var selectedData = sectionData.locations[location][period];

                var aKPIItems = selectedData.KPI.map(function (kpi) {
                    return new GenericTile({
                        header: kpi.header,
                        subheader: kpi.subheader,
                        frameType: "OneByHalf",
                        pressEnabled: false,
                        tileContent: [
                            new TileContent({
                                unit: kpi.subheader,
                                footer: "Current Quarter",
                                content: new NumericContent({
                                    scale: kpi.scale,
                                    value: kpi.value,
                                    valueColor: "Error",
                                    withMargin: false
                                })
                            })
                        ]
                    }).addStyleClass("sapUiTinyMarginBeginEnd sapUiTinyMarginTop tileLayout");
                });

                var oKPIBox = new HBox({
                    items: aKPIItems
                });
                oKPIBox.addStyleClass("sapUiSmallMarginBottom");
                var aChartItems = selectedData.Charts.map(function (chart) {
                    var sHTMLContent = `<div class="width-400"><canvas id="${sectionKey.replace(/\s/g, '')}${chart.title.replace(/\s/g, '')}Chart"></canvas></div>`;
                    return new HTML({
                        content: sHTMLContent,
                        afterRendering: this._onRenderChart.bind(this, chart, sectionKey)
                    })
                }.bind(this));

                var oChartBox = new HBox({
                    alignItems: "Center",
                    justifyContent: "Start",
                    wrap: "Wrap",
                    items: aChartItems
                }).addStyleClass("flex-one");;

                oVBox.addItem(oKPIBox);
                oVBox.addItem(oChartBox);
            },

            _onFilterChange: function (oEvent) {
                var oSource = oEvent.getSource();  // Get the source of the event (the Select control)
                var oVBox = oSource.getParent().getParent();  // Get the VBox that contains the filters and content
                var oFilterBox = oVBox.getItems()[0];
                var oLocationSelect = oFilterBox.getItems()[0];
                var oPeriodSelect = oFilterBox.getItems()[1];

                var location = oLocationSelect.getSelectedKey();
                var period = oPeriodSelect.getSelectedKey();

                // Retrieve the section key stored in custom data
                var sectionKey = oSource.data("sectionKey");

                var sectionData = this._originalData[sectionKey];

                this._generateContentForSelection(oVBox, sectionData, location, period, sectionKey);
            }
            ,

            _onRenderChart: function (chart, sectionKey) {
                var canvasId = sectionKey.replace(/\s/g, '') + chart.title.replace(/\s/g, '') + "Chart";
                var ctx = document.getElementById(canvasId).getContext("2d");
                var colors = ["#1977d3", "#b81d1c", "#ffb300", "#378f3c", "#5c6cc0", "#a9358b", "#1181b6", "#f5521d", "#9e9d24", "#8f24aa", "#ad1557"]
                // Check if there's an existing chart instance for this canvas, and destroy it if it exists
                if (this._charts[canvasId]) {
                    this._charts[canvasId].destroy();
                }

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
                                position: 'right'
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

            onpressBack: function (oEvent) {
                this.oRouter.navTo("Main");
            },
            onLogOut: function () {
                this.logOut();
            },

        });
    }
);