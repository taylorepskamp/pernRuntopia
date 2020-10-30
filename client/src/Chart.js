/* Imports */
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_dataviz from "@amcharts/amcharts4/themes/dataviz";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import React from 'react';
import './App.css';
import moment from 'moment';

/* Chart code */
// Themes begin
am4core.useTheme(am4themes_dataviz);
am4core.useTheme(am4themes_animated);
// Themes end

class Chart extends React.Component{
componentDidMount(){

let chart = am4core.create("chartdiv", am4charts.XYChart);
chart.data = this.props.data

let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
dateAxis.renderer.grid.template.location = 0;
dateAxis.renderer.minGridDistance = 60;

let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
valueAxis.tooltip.disabled = true;

// only for the legend
let iconSeries = chart.series.push(new am4charts.ColumnSeries())

iconSeries.strokeOpacity = 0;

iconSeries.name = "Events";
iconSeries.dataFields.dateX = "date";
iconSeries.dataFields.valueY = "v";

let series = chart.series.push(new am4charts.LineSeries());
series.dataFields.dateX = "date";
series.dataFields.openValueY = "high";
series.dataFields.valueY = "low";

series.sequencedInterpolation = true;

series.name = "Highs";
series.stroke = am4core.color("#FFFFFF");
series.fill = am4core.color("#FFFFFF");
series.fillOpacity = .5;
series.strokeOpacity = .5;


let series2 = chart.series.push(new am4charts.LineSeries());
series2.dataFields.dateX = "date";
series2.dataFields.valueY = "high";
series2.sequencedInterpolation = true;
series2.stroke = am4core.color("#FFFFFF");
series2.strokeOpacity = .5;
series2.name = "Lows";

let series3 = chart.series.push(new am4charts.LineSeries());
series3.dataFields.dateX = "date";
series3.dataFields.valueY = "effort";
series3.sequencedInterpolation = true;
series3.strokeOpacity = 0.0;
series3.name = "Efforts";
series3.propertyFields.fill = "lineColor";


series3.tooltipHTML = 
`
<center><strong>Weekly Effort: {valueY} </strong></center>
<hr />
<center><strong>{message1}</strong></center>
<center><strong>{message2}</strong></center>
<hr />
`;

series3.tooltip.label.interactionsEnabled = true;
series3.tooltip.pointerOrientation = "vertical";
series3.tooltip.getFillFromObject = true;
series3.tooltip.getStrokeFromObject = false;


let bullet = series3.bullets.push(new am4charts.CircleBullet())
//bullet.fill = new am4core.InterfaceColorSet().getFor("background");
bullet.fillOpacity = .2;
bullet.strokeWidth = 3;
bullet.circle.radius = 6;
bullet.stroke = am4core.color("#444444");
bullet.fill = am4core.color("#FFFFFF");




chart.cursor = new am4charts.XYCursor();
chart.cursor.xAxis = dateAxis;
chart.scrollbarX = new am4core.Scrollbar();

// create ranges
let negativeRange;

// create ranges
chart.events.on("datavalidated", function() {
  series.dataItems.each(function(s1DataItem) {
    let s1PreviousDataItem;
    let s2PreviousDataItem;

    let s2DataItem = series2.dataItems.getIndex(s1DataItem.index);

    if (s1DataItem.index > 0) {
      s1PreviousDataItem = series.dataItems.getIndex(s1DataItem.index - 1);
      s2PreviousDataItem = series2.dataItems.getIndex(s1DataItem.index - 1);
    }

    let startTime = am4core.time.round(new Date(s1DataItem.dateX.getTime()), dateAxis.baseInterval.timeUnit, dateAxis.baseInterval.count).getTime();

    // end if last
    if (s1DataItem.index === series.dataItems.length - 1) {
      if (negativeRange) {
        negativeRange.endDate = new Date(s1DataItem.dateX.getTime() + dateAxis.baseDuration / 2);
        negativeRange = undefined;
      }
    }
  })

  dateAxis.zoomToDates(
    moment().add(-16,'W').format('YYYY-MM-DD'),
    moment().format('YYYY-MM-DD')
  );
})
    }
componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
  }

render(){

return(
    <div>
        <div id="chartdiv"></div>
    </div>
    
)
}
}

export default Chart;