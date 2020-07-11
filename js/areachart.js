/*
 * AreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the area chart
 * @param _data						-- the dataset 'household characteristics'
 */

AreaChart = function(_parentElement, _data) {
  this.parentElement = _parentElement;
  this.data = _data;
  this.displayData = [];

  this.initVis();
};

/*
 * Initialize visualization (static content; e.g. SVG area, axes, brush component)
 */

AreaChart.prototype.initVis = function() {
  var vis = this;

  vis.margin = { top: 40, right: 0, bottom: 20, left: 40 };

  (vis.width = 500 - vis.margin.left - vis.margin.right),
    (vis.height = 400 - vis.margin.top - vis.margin.bottom);

  // SVG drawing area
  vis.svg = d3
    .select("#" + vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
    .append("g")
    .attr(
      "transform",
      "translate(" + vis.margin.left + "," + vis.margin.top + ")"
    );

  // Scales and axes
  vis.x = d3.scaleTime().range([0, vis.width]);

  vis.y = d3.scaleLinear().range([vis.height, 0]);

  vis.xAxis = d3
    .axisBottom()
    .scale(vis.x)
    .ticks(5);

  vis.yAxis = d3.axisLeft().scale(vis.y);

  vis.svg
    .append("g")
    .attr("class", "x-axis axis")
    .attr("transform", "translate(0," + vis.height + ")");

  vis.svg.append("g").attr("class", "y-axis axis");

  // Area generator
  vis.area = d3
    .area()
    .curve(d3.curveCardinal)
    .x(d => vis.x(d.key))
    .y0(vis.height)
    .y1(d => vis.y(d.value));

  // Y-axis label
  vis.label = vis.svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", -10)
    .attr("x", 0)
    .text("Surveys");

  // (Filter, aggregate, modify data)
  vis.wrangleData();
};

/*
 * Data wrangling
 */

AreaChart.prototype.wrangleData = function() {
  var vis = this;

  // (1) Group data by date and count survey results for each day
  // (2) Sort data by day

  vis.displayData = d3
    .nest()
    .key(d => d.survey)
    .rollup(leaves => leaves.length)
    .entries(vis.data);

  vis.displayData.forEach(d => {
    d.key = new Date(d.key);
  });

  vis.displayData.sort((a, b) => b.key - a.key);

  // Update the visualization
  vis.updateVis();
};

/*
 * The drawing function
 */

AreaChart.prototype.updateVis = function() {
  var vis = this;

  // Update domain
  vis.y.domain([0, d3.max(vis.displayData, d => d.value)]);

  vis.x.domain(
    d3.extent(vis.displayData, function(d) {
      return d.key;
    })
  );

  // Draw the area
  var svg_area = vis.svg
    .selectAll(".area")
    .data([vis.displayData], d => d.value);

  svg_area
    .enter()
    .append("path")
    .attr("class", "area")
    .merge(svg_area)
    .style("fill", "rgb(4, 129, 71)")
    .attr("d", vis.area);

  // Exit
  svg_area.exit().remove();

  // Initialize brush component
  vis.brush = d3
    .brushX()
    .extent([[0, 0], [vis.width, vis.height]])
    .on("brush", brushed);

  // Append brush component
  vis.svg
    .append("g")
    .attr("class", "x brush")
    .call(vis.brush);

  // Update axes
  vis.svg.select(".x-axis").call(vis.xAxis);
  vis.svg.select(".y-axis").call(vis.yAxis);
};
