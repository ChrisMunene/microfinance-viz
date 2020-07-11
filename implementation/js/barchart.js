/*
 * BarChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the bar charts
 * @param _data						-- the dataset 'household characteristics'
 * @param _config					-- variable from the dataset (e.g. 'electricity') and title for each bar chart
 */

BarChart = function(_parentElement, _data, _config) {
  this.parentElement = _parentElement;
  this.data = _data;
  this.config = _config;
  this.displayData = _data;

  this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, axes)
 */

BarChart.prototype.initVis = function() {
  var vis = this;

  // Init SVG
  vis.margin = { top: 40, right: 50, bottom: 10, left: 100 };

  vis.width = 400 - vis.margin.left - vis.margin.right;
  vis.height = 140 - vis.margin.top - vis.margin.bottom;

  vis.transition = 1000;

  vis.svg = d3
    .select("#bar-chart")
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    );

  // Scales
  vis.y = d3
    .scaleBand()
    .rangeRound([0, vis.height])
    .paddingInner(0.2);

  vis.x = d3.scaleLinear().range([0, vis.width]);

  vis.yAxis = d3.axisLeft().scale(vis.y);

  vis.yAxisGroup = vis.svg.append("g").attr("class", "y-axis axis");

  // Add label
  vis.svg_label = vis.svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -20)
    .attr("x", -40)
    .text(vis.config.title);

  // (Filter, aggregate, modify data)
  vis.wrangleData(vis.data);
};

/*
 * Data wrangling
 */

BarChart.prototype.wrangleData = function(data) {
  var vis = this;

  // (1) Group data by key variable (e.g. 'electricity') and count leaves
  // (2) Sort column descending
  vis.displayData = d3
    .nest()
    .key(d => d[vis.config.key])
    .rollup(leaves => leaves.length)
    .entries(data);

  vis.displayData.sort((a, b) => b.value - a.value);

  // Update the visualization
  vis.updateVis();
};

/*
 * The drawing function - should use the D3 update sequence (enter, update, exit)
 */

BarChart.prototype.updateVis = function() {
  var vis = this;

  // (1) Update domains
  // (2) Draw rectangles
  // (3) Draw labels
  vis.x.domain([0, d3.max(vis.displayData, d => d.value)]);

  vis.y.domain(
    vis.displayData.map(function(d) {
      return d.key;
    })
  );

  // Data-join
  const rect = vis.svg.selectAll("rect").data(vis.displayData);
  const bar_label = vis.svg.selectAll("text.bar-label").data(vis.displayData);

  // Enter (initialize the newly added elements)
  rect
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("fill", "rgb(4, 129, 71)")

    // Enter and Update (set the dynamic properties of the elements)
    .merge(rect)
    .transition()
    .duration(200)
    .attr("x", 5)
    .attr("y", function(d) {
      return vis.y(d.key);
    })
    .attr("width", d => vis.x(d.value))
    .attr("height", function(d) {
      return vis.y.bandwidth();
    });

  // Enter and Update - Bar labels
  bar_label
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("class", "bar-label")
    .merge(bar_label)
    .transition()
    .duration(200)
    .attr("y", d => vis.y(d.key) + vis.y.bandwidth() / 2)
    .attr("x", d => vis.x(d.value) + 30)
    .text(d => d.value);

  // Exit
  rect.exit().remove();
  bar_label.exit().remove();

  // Update axis by calling the axis function
  vis.svg
    .select(".y-axis")
    .transition()
    .duration(200)
    .call(vis.yAxis);
};

/*
 * Filter data when the user changes the selection
 * Example for brushRegion: 07/16/2016 to 07/28/2016
 */

BarChart.prototype.selectionChanged = function(brushRegion) {
  var vis = this;

  // Filter data accordingly without changing the original data
  const selection = vis.data.filter(
    d => d.survey >= brushRegion[0] && d.survey <= brushRegion[1]
  );

  // Update the visualization
  vis.wrangleData(selection);
};
