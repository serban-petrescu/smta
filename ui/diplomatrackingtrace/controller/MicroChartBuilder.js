sap.ui.define([
	"sap/suite/ui/microchart/AreaMicroChart",
	"sap/suite/ui/microchart/AreaMicroChartItem",
	"sap/suite/ui/microchart/AreaMicroChartLabel",
	"sap/suite/ui/microchart/AreaMicroChartPoint",
	"sap/ui/core/format/NumberFormat"
], function(AreaMicroChart, AreaMicroChartItem, AreaMicroChartLabel, AreaMicroChartPoint, NumberFormat) {
	
	var oFloatFormat = NumberFormat.getIntegerInstance({groupingEnabled: false, maxFractionDigits: 3});	
	
	return {
		buildChart: function(oContext, nMinValue, nMaxValue) {
			var nMin = oContext.getProperty("lowerBound") !== null ? Math.min(nMinValue, parseFloat(oContext.getProperty("lowerBound"))) : nMinValue,
				nMax = oContext.getProperty("upperBound") !== null ? Math.max(nMaxValue, parseFloat(oContext.getProperty("upperBound"))) : nMaxValue,
				nDelta = nMax - nMin,
				oChart = new AreaMicroChart({
					width:	"100%",
					height:	"6rem",
					minYValue: nMin - nDelta / 5,
					maxYValue: nMax + nDelta / 5,
					minXValue: 0,
					maxXValue: 100,
					firstXLabel: new AreaMicroChartLabel({label: oFloatFormat.format(nMin - nDelta / 5) + " " + oContext.getProperty("Measure/unit")}),
					firstYLabel: new AreaMicroChartLabel({label: oFloatFormat.format(nMax + nDelta / 5) + " " + oContext.getProperty("Measure/unit")}),
					chart: new AreaMicroChartItem({
						points: [
							new AreaMicroChartPoint({x: 0,		y: {path: "view>/data/limits/4/" + oContext.getProperty("measure")}}),
							new AreaMicroChartPoint({x: 25, 	y: {path: "view>/data/limits/3/" + oContext.getProperty("measure")}}),
							new AreaMicroChartPoint({x: 50, 	y: {path: "view>/data/limits/2/" + oContext.getProperty("measure")}}),
							new AreaMicroChartPoint({x: 75, 	y: {path: "view>/data/limits/1/" + oContext.getProperty("measure")}}),
							new AreaMicroChartPoint({x: 100,	y: {path: "view>/data/limits/0/" + oContext.getProperty("measure")}})
						]
					})
				});
				
			if (oContext.getProperty("lowerBound") !== null) {
				nMin = parseFloat(oContext.getProperty("lowerBound"));
				oChart.setMinThreshold(new AreaMicroChartItem({
					color: "Error",
					points: [new AreaMicroChartPoint({x: 0, y: nMin}), new AreaMicroChartPoint({x: 100, y: nMin})]
				}));
				oChart.setInnerMinThreshold(new AreaMicroChartItem({
					color: "Good",
					points: [new AreaMicroChartPoint({x: 0, y: nMin + nDelta / 5}), new AreaMicroChartPoint({x: 100, y: nMin + nDelta / 5})]
				}));
			}
			
			if (oContext.getProperty("upperBound") !== null) {
				nMax = parseFloat(oContext.getProperty("upperBound"));
				oChart.setMaxThreshold(new AreaMicroChartItem({
					color: "Error",
					points: [new AreaMicroChartPoint({x: 0, y: nMax}), new AreaMicroChartPoint({x: 100, y: nMax})]
				}));
				oChart.setInnerMaxThreshold(new AreaMicroChartItem({
					color: "Good",
					points: [new AreaMicroChartPoint({x: 0, y: nMax - nDelta / 5}), new AreaMicroChartPoint({x: 100, y: nMax - nDelta / 5})]
				}));
			}
			return oChart;
		}
	};
});