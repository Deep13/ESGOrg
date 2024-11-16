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
        "sap/ui/core/CustomData",
        "sap/m/Label",],
    function (Controller, JSONModel, GenericTile, TileContent, NumericContent, HBox, VBox, ObjectPageSection, ObjectPageSubSection, HTML, Item, Select, CustomData, Label) {
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
                            // var initital = Object.keys(data)[0];
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
                            // var oFilters = {
                            //     years: that.years,
                            //     months: that.months.filter(key => key.years === initialSelection)
                            // }

                            // Object.keys(oFilters).map((val, index) => {
                            //     var oDataTemplate = new CustomData({ key: "title", value: val });
                            //     var oDataTemplate1 = new CustomData({ key: "index", value: index });
                            //     // var select = new sap.m.Select({
                            //     //     items: val == "years" ? [...oFilters[val].map(function (value) {
                            //     //         return new sap.ui.core.Item({
                            //     //             key: value.title,
                            //     //             text: value.title
                            //     //         });
                            //     //     })
                            //     //     ] : [new sap.ui.core.Item({
                            //     //         key: "All",
                            //     //         text: "All"
                            //     //     }), ...oFilters[val].map(function (value) {
                            //     //         return new sap.ui.core.Item({
                            //     //             key: value.title,
                            //     //             text: value.title
                            //     //         });
                            //     //     })
                            //     //     ],
                            //     //     // enabled: false,
                            //     //     maxWidth: "100px",
                            //     //     change: function (oEvent) {
                            //     //         that.applyCycleFilters(oEvent);
                            //     //     } // On change, apply the filters to the table
                            //     // });
                            //     select.addCustomData(oDataTemplate);
                            //     select.addCustomData(oDataTemplate1);
                            //     select.addStyleClass("sapUiSmallMarginEnd")
                            //     select.setSelectedKey(initialSelection)
                            //     that.byId("graphCycleFilters").addItem(select);
                            // })
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
                            that.analyticsData = aClubData;
                            that.years = [];
                            that.months = [];
                            that.countries = [];
                            that.states = [];
                            that.districts = [];
                            that.blocks = [];
                            // var initital = Object.keys(data)[0];
                            var initialDataKeys = Object.keys(aClubData);
                            // aClubData.map(val => {
                            //     initialDataKeys = [...initialDataKeys, ...Object.keys(val.data)]
                            // })

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

                                that.byId("graphFilters").addItem(select);
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






                            // if (doc.exists) {
                            //     var data = doc.data().data;
                            //     that.countries = [];
                            //     that.states = [];
                            //     that.districts = [];
                            //     that.blocks = [];
                            //     var initital = Object.keys(data)[0];
                            //     const initialDataKeys = Object.keys(data);

                            //     initialDataKeys.forEach((key) => {
                            //         const [countries, states, districts, blocks] = key.split("-");

                            //         if (countries && !that.countries.some(item => item.title === countries)) {
                            //             that.countries.push({ title: countries });
                            //         }
                            //         if (states && !that.states.some(item => item.title === states)) {
                            //             that.states.push({ title: states, countries });
                            //         }
                            //         if (districts && !that.districts.some(item => item.title === districts)) {
                            //             that.districts.push({ title: districts, states });
                            //         }
                            //         if (blocks && !that.blocks.some(item => item.title === blocks)) {
                            //             that.blocks.push({ title: blocks, districts });
                            //         }
                            //     });
                            //     var oFilters = {
                            //         countries: that.countries,
                            //         states: [],
                            //         districts: [],
                            //         blocks: [],
                            //     }
                            //     Object.keys(oFilters).map((val, index) => {
                            //         var oDataTemplate = new CustomData({ key: "title", value: val });
                            //         var oDataTemplate1 = new CustomData({ key: "index", value: index });
                            //         var select = new sap.m.Select({
                            //             items: [
                            //                 new sap.ui.core.Item({
                            //                     key: "All",
                            //                     text: "All"
                            //                 }),
                            //                 ...oFilters[val].map(function (value) {
                            //                     return new sap.ui.core.Item({
                            //                         key: value.title,
                            //                         text: value.title
                            //                     });
                            //                 })
                            //             ],
                            //             // enabled: false,
                            //             maxWidth: "100px",
                            //             change: function (oEvent) {
                            //                 that.applyFilters(oEvent);
                            //             } // On change, apply the filters to the table
                            //         });
                            //         select.addCustomData(oDataTemplate);
                            //         select.addCustomData(oDataTemplate1);
                            //         select.addStyleClass("sapUiSmallMarginEnd")
                            //         that.byId("graphFilters").addItem(select);
                            //     })

                            //     var branches = [];

                            //     Object.keys(data).map(val => {
                            //         branches.push({ title: val })
                            //     })
                            //     var cycleModel = new JSONModel({ results: branches });


                            //     that.analyticsData = data;

                            //     var branchData = that.analyticsData[initital].Overview;
                            //     that.createSampleData(branchData);
                            //     // var countryModel = new JSONModel({ results: that.countries });
                            //     // that.getView().setModel(countryModel, "countryModel");
                            //     // var states = this.states.filter(state => state.country === that.countries[0].title);
                            //     // var stateModel = new JSONModel({ results: states });
                            //     // that.getView().setModel(stateModel, "stateModel");
                            //     // var districtModel = new JSONModel({ results: [] });
                            //     // that.getView().setModel(districtModel, "districtModel");
                            //     // var blockModel = new JSONModel({ results: [] });
                            //     // that.getView().setModel(blockModel, "blockModel");
                            //     that.getView().setModel(cycleModel, "branchModel");
                            //     that.byId("branchId").setSelectedKey(branches[0].title)
                            //     // that.setData(that.countries[0].title, "countryId")
                            // }
                            // else {
                            //     sap.m.MessageBox.error("No data found")
                            // }


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
                console.log(oEvent);
                this.byId("graphFilters")?.removeAllItems();
                var cycle = oEvent.getParameter("selectedItem").getKey();
                firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").doc(cycle).get().then(doc => {
                    if (doc.exists) {
                        var data = doc.data().data;
                        that.countries = [];
                        that.states = [];
                        that.districts = [];
                        that.blocks = [];
                        var initital = Object.keys(data)[0];
                        const initialDataKeys = Object.keys(data);

                        initialDataKeys.forEach((key) => {
                            const [countries, states, districts, blocks] = key.split("-");

                            if (countries && !that.countries.some(item => item.title === countries)) {
                                that.countries.push({ title: countries });
                            }
                            if (states && !that.states.some(item => item.title === states)) {
                                that.states.push({ title: states, countries });
                            }
                            if (districts && !that.districts.some(item => item.title === districts)) {
                                that.districts.push({ title: districts, states });
                            }
                            if (blocks && !that.blocks.some(item => item.title === blocks)) {
                                that.blocks.push({ title: blocks, districts });
                            }
                        });

                        var branches = [];
                        var oFilters = {
                            countries: that.countries,
                            states: [],
                            districts: [],
                            blocks: [],
                        }
                        Object.keys(oFilters).map((val, index) => {
                            var oDataTemplate = new CustomData({ key: "title", value: val });
                            var oDataTemplate1 = new CustomData({ key: "index", value: index });
                            var select = new sap.m.Select({
                                items: [
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
                            select.addStyleClass("sapUiSmallMarginEnd")
                            that.byId("graphFilters").addItem(select);
                        })
                        Object.keys(data).map(val => {
                            branches.push({ title: val })
                        })
                        var cycleModel = new JSONModel({ results: branches });
                        that.analyticsData = data;

                        var branchData = that.analyticsData[initital].Overview;
                        that.createSampleData(branchData);
                        // var countryModel = new JSONModel({ results: that.countries });
                        // that.getView().setModel(countryModel, "countryModel");
                        // var states = this.states.filter(state => state.country === that.countries[0].title);
                        // var stateModel = new JSONModel({ results: states });
                        // that.getView().setModel(stateModel, "stateModel");
                        // var districtModel = new JSONModel({ results: [] });
                        // that.getView().setModel(districtModel, "districtModel");
                        // var blockModel = new JSONModel({ results: [] });
                        // that.getView().setModel(blockModel, "blockModel");
                        that.getView().setModel(cycleModel, "branchModel");
                        that.byId("branchId").setSelectedKey(branches[0].title);

                        // that.setData(that.countries[0].title, "countryId")
                    }
                    else {
                        sap.m.MessageBox.error("No data found");
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
            onMonthChange: function (oEvent) {
                var that = this;
                var user = this.userData;
                var title = oEvent.getParameter("selectedItem").getBindingContext("monthModel").getObject();
                var id = oEvent.getSource().getId().split("--")[1];
                firebase.firestore().collection(user.domain).doc("AnalyticsData").collection("Reporting Cycle").doc(title.title + "-" + title.year).get().then(doc => {
                    if (doc.exists) {
                        var data = doc.data().data;
                        that.countries = [];
                        that.states = [];
                        that.districts = [];
                        that.blocks = [];
                        // var initital = Object.keys(data)[0];
                        const initialDataKeys = Object.keys(data);

                        initialDataKeys.forEach((key) => {
                            const [country, state, district, block] = key.split("-");

                            if (country && !that.countries.some(item => item.title === country)) {
                                that.countries.push({ title: country });
                            }
                            if (state && !that.states.some(item => item.title === state)) {
                                that.states.push({ title: state, country });
                            }
                            if (district && !that.districts.some(item => item.title === district)) {
                                that.districts.push({ title: district, state });
                            }
                            if (block && !that.blocks.some(item => item.title === block)) {
                                that.blocks.push({ title: block, district });
                            }
                        });


                        that.analyticsData = data;

                        var branchData = that.analyticsData[initital].Overview;
                        that.createSampleData(branchData);
                        // var countryModel = new JSONModel({ results: that.countries });
                        // that.getView().setModel(countryModel, "countryModel");
                        // var states = this.states.filter(state => state.country === that.countries[0].title);
                        // var stateModel = new JSONModel({ results: states });
                        // that.getView().setModel(stateModel, "stateModel");
                        // var districtModel = new JSONModel({ results: [] });
                        // that.getView().setModel(districtModel, "districtModel");
                        // var blockModel = new JSONModel({ results: [] });
                        // that.getView().setModel(blockModel, "blockModel");
                        // that.byId("branchId").setSelectedKey(branches[0].title)
                        // that.setData(that.countries[0].title, "countryId")
                    }
                    else {
                        sap.m.MessageBox.error("No data found");
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
                        // that.createSampleData(branchData);
                    }


                });
            },
            // onBranchChange: function (oEvent) {
            //     var title = oEvent.getParameter("selectedItem").getKey();
            //     var id = oEvent.getSource().getId().split("--")[1];
            //     this.setData(title, id)
            // },
            onBranchChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                if (this.analyticsData) {
                    var branchData = this.analyticsData[title].Overview;
                    this.createSampleData(branchData);

                }
            },
            applyCycleFilters: function (oEvent) {
                var that = this;
                var filterTitle = oEvent.getSource().data().title;
                var SelectedKey = oEvent.getSource().getSelectedKey();
                var filterContainerItems = this.byId("graphCycleFilters").getItems();

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
                // var selectedData = Object.keys(that.analyticsData).filter(val => val.indexOf(branch) !== -1)
                // that.createSampleData(that.consolidatedData(selectedData));
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
            onStateChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                var id = oEvent.getSource().getId().split("--")[1];
                var district = this.districts.filter(district => district.state === title);
                this.byId("districtId").getModel("districtModel").setData({ "results": district });
                this.byId("blockId").getModel("blockModel").setData({ "results": [] });
                this.setData(title, id);
            },
            onDistrictChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                var id = oEvent.getSource().getId().split("--")[1];
                var block = this.blocks.filter(block => block.district === title);
                this.byId("blockId").getModel("blockModel").setData({ "results": block });
                this.setData(title, id);
            },
            onBlockChange: function (oEvent) {
                var title = oEvent.getParameter("selectedItem").getKey();
                var id = oEvent.getSource().getId().split("--")[1];
                this.setData(title, id);
            },
            setData: function (title, id) {

                switch (id) {
                    case "countryId": {
                        this.createSampleData(this.filterByCountry(this.analyticsData, title));
                        break;
                    }
                    case "stateId": {
                        this.createSampleData(this.filterByState(this.analyticsData, title)); break;
                    }
                    case "districtId": {
                        this.createSampleData(this.filterByDistrict(this.analyticsData, title)); break;
                    }
                    case "blockId": {
                        this.createSampleData(this.filterByBlock(this.analyticsData, title)); break;
                    }
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
                    consolidatedData.TotalEmissions += val.Overview.TotalEmissions;
                    consolidatedData.Water += val.Overview.Water;
                    consolidatedData.Waste += val.Overview.Waste;
                    consolidatedData.Biodiversity += val.Overview.Biodiversity;
                    consolidatedData.SocialSpend += val.Overview.SocialSpend;
                    consolidatedData.Beneficiaries += val.Overview.Beneficiaries;
                    consolidatedData.GenderSplit = consolidatedData.GenderSplit ? that.consolidateRatios(consolidatedData.GenderSplit, val.Overview.GenderSplit) : val.Overview.GenderSplit;
                    consolidatedData.Scope = consolidatedData.Scope ? that.consolidatePercentage(consolidatedData.Scope, val.Overview.Scope) : val.Overview.Scope;
                    consolidatedData.AgeCount = consolidatedData.AgeCount ? that.sumData(consolidatedData.AgeCount, val.Overview.AgeCount) : val.Overview.AgeCount;
                    consolidatedData.GenderCount = consolidatedData.GenderCount ? that.sumData(consolidatedData.GenderCount, val.Overview.GenderCount) : val.Overview.GenderCount;
                })

                return consolidatedData;
            },

            // Function to filter by state
            filterByState: function (data, state) {
                var that = this;
                var oData = Object.keys(data).filter(key => key.includes(`-${state}-`))
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
                    consolidatedData.TotalEmissions += data[val].Overview.TotalEmissions;
                    consolidatedData.Water += data[val].Overview.Water;
                    consolidatedData.Waste += data[val].Overview.Waste;
                    consolidatedData.Biodiversity += data[val].Overview.Biodiversity;
                    consolidatedData.SocialSpend += data[val].Overview.SocialSpend;
                    consolidatedData.Beneficiaries += data[val].Overview.Beneficiaries;
                    consolidatedData.GenderSplit = consolidatedData.GenderSplit ? that.consolidateRatios(consolidatedData.GenderSplit, data[val].Overview.GenderSplit) : data[val].Overview.GenderSplit;
                    consolidatedData.Scope = consolidatedData.Scope ? that.consolidatePercentage(consolidatedData.Scope, data[val].Overview.Scope) : data[val].Overview.Scope;
                    consolidatedData.AgeCount = consolidatedData.AgeCount ? that.sumData(consolidatedData.AgeCount, data[val].Overview.AgeCount) : data[val].Overview.AgeCount;
                    consolidatedData.GenderCount = consolidatedData.GenderCount ? that.sumData(consolidatedData.GenderCount, data[val].Overview.GenderCount) : data[val].Overview.GenderCount;
                })

                return consolidatedData;
            },

            // Function to filter by district
            filterByDistrict: function (data, district) {
                var that = this;
                var oData = Object.keys(data).filter(key => key.includes(`-${district}-`))
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
                    consolidatedData.TotalEmissions += data[val].Overview.TotalEmissions;
                    consolidatedData.Water += data[val].Overview.Water;
                    consolidatedData.Waste += data[val].Overview.Waste;
                    consolidatedData.Biodiversity += data[val].Overview.Biodiversity;
                    consolidatedData.SocialSpend += data[val].Overview.SocialSpend;
                    consolidatedData.Beneficiaries += data[val].Overview.Beneficiaries;
                    consolidatedData.GenderSplit = consolidatedData.GenderSplit ? that.consolidateRatios(consolidatedData.GenderSplit, data[val].Overview.GenderSplit) : data[val].Overview.GenderSplit;
                    consolidatedData.Scope = consolidatedData.Scope ? that.consolidatePercentage(consolidatedData.Scope, data[val].Overview.Scope) : data[val].Overview.Scope;
                    consolidatedData.AgeCount = consolidatedData.AgeCount ? that.sumData(consolidatedData.AgeCount, data[val].Overview.AgeCount) : data[val].Overview.AgeCount;
                    consolidatedData.GenderCount = consolidatedData.GenderCount ? that.sumData(consolidatedData.GenderCount, data[val].Overview.GenderCount) : data[val].Overview.GenderCount;
                })

                return consolidatedData;
            },

            // Function to filter by block
            filterByBlock: function (data, block) {
                var that = this;
                var oData = Object.keys(data).filter(key => key.endsWith(`-${block}`))
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
                    consolidatedData.TotalEmissions += data[val].Overview.TotalEmissions;
                    consolidatedData.Water += data[val].Overview.Water;
                    consolidatedData.Waste += data[val].Overview.Waste;
                    consolidatedData.Biodiversity += data[val].Overview.Biodiversity;
                    consolidatedData.SocialSpend += data[val].Overview.SocialSpend;
                    consolidatedData.Beneficiaries += data[val].Overview.Beneficiaries;
                    consolidatedData.GenderSplit = consolidatedData.GenderSplit ? that.consolidateRatios(consolidatedData.GenderSplit, data[val].Overview.GenderSplit) : data[val].Overview.GenderSplit;
                    consolidatedData.Scope = consolidatedData.Scope ? that.consolidatePercentage(consolidatedData.Scope, data[val].Overview.Scope) : data[val].Overview.Scope;
                    consolidatedData.AgeCount = consolidatedData.AgeCount ? that.sumData(consolidatedData.AgeCount, data[val].Overview.AgeCount) : data[val].Overview.AgeCount;
                    consolidatedData.GenderCount = consolidatedData.GenderCount ? that.sumData(consolidatedData.GenderCount, data[val].Overview.GenderCount) : data[val].Overview.GenderCount;
                })

                return consolidatedData;
            },
            sumData: function (obj1, obj2) {
                let result = {};

                // Iterate through the keys of the first object
                for (let key in obj1) {
                    if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
                        // Sum the values from both objects and store in the result
                        result[key] = obj1[key] + obj2[key];
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