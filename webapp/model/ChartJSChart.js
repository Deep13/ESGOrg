sap.ui.define([
    "sap/ui/core/Control"
], function (Control) {
    "use strict";

    return Control.extend("Billing.Billing.model.ChartJSChart", {
        metadata: {
            properties: {
                "chartData": { type: "object", defaultValue: null },
                "width": { type: "sap.ui.core.CSSSize", defaultValue: "100%" },
                "height": { type: "sap.ui.core.CSSSize", defaultValue: "100%" }
            }
        },

        renderer: function (oRm, oControl) {
            oRm.write("<canvas");
            oRm.writeControlData(oControl);
            oRm.addStyle("width", oControl.getWidth());
            oRm.addStyle("height", oControl.getHeight());
            oRm.writeStyles();
            oRm.write("></canvas>");
        },

        onAfterRendering: function () {
            this._drawChart();
        },

        _drawChart: function () {
            var data = this.getChartData();
            if (!data) {
                return;
            }

            var ctx = this.getDomRef().getContext("2d");
            var myChart = new Chart(ctx, data);
            myChart.resize(600, 600);
        }
    });
});
