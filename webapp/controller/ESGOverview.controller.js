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
                                content: new NumericContent({
                                    scale: kpi.scale,
                                    value: kpi.value,
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
                    var sHTMLContent = `<div class="width-250"><canvas id="${sectionKey.replace(/\s/g, '')}${chart.title.replace(/\s/g, '')}Chart"></canvas></div>`;
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