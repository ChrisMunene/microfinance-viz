// Bar chart configurations: data keys and chart titles
var configs = [
  { key: "ownrent", title: "Own or Rent" },
  { key: "electricity", title: "Electricity" },
  { key: "latrine", title: "Latrine" },
  { key: "hohreligion", title: "Religion" }
];

// Initialize variables to save the charts later
var barcharts = [];
var areachart;

// Date parser to convert strings to date objects
var parseDate = d3.timeParse("%Y-%m-%d");

// (1) Load CSV data
// 	(2) Convert strings to date objects
// 	(3) Create new bar chart objects
// 	(4) Create new are chart object

d3.csv("data/household_characteristics.csv", function(data) {
  data.forEach(d => {
    d.survey = parseDate(d.survey);
  });

  barcharts = configs.map((config, index) => {
    // Create dividers for charts
    if (index > 0 && index < configs.length) {
      const div = document.getElementById("bar-chart");
      const hr = document.createElement("hr");
      div.appendChild(hr);
    }

    return new BarChart("bar-chart", data, config);
  });

  areachart = new AreaChart("area-chart", data);
});

// React to 'brushed' event and update all bar charts
function brushed() {
  // Get the extent of the current brush
  var selectionRange = d3.brushSelection(d3.select(".brush").node());

  // Update barcharts
  barcharts.forEach(barchart => {
    barchart.selectionChanged(selectionRange.map(areachart.x.invert));
  });
}
