var margin = {top: 50, right: 0, bottom: 100, left: 500},
  width = 1000 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

/*
* value accessor - returns the value to encode for a given data object.
* scale - maps value to a visual display encoding, such as a pixel position.
* map function - maps from data value to display value
* axis - sets up axis
*/

// setup x
var xValue = function(d) { return d.duracao;}, // data -> value
  x = d3.scaleLinear().range([0, width]), // value -> display
  xMap = function(d) { return x(xValue(d));}, // data -> display
  xAxis = d3.axisBottom(x);

// setup y
var yValue = function(d) { return d["foi"];}, // data -> value
  y = d3.scaleLinear().range([height, 0]), // value -> display
  yMap = function(d) { return y(yValue(d));}, // data -> display
  yAxis = d3.axisLeft(y);

// setup fill color
var cValue = function(d) { return d.Manufacturer;},
  color = d3.scaleOrdinal(d3.schemeCategory10);

// add the graph canvas to the body of the webpage
var svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// load data
d3.csv("data.csv", function(error, data) {

// change string (from CSV) into number format
data.forEach(function(d) {
  d.duracao = +d.duracao;
  d["foi"] = +d["foi"];
  console.log(d);
});

// don't want dots overlapping axis, so add in buffer to data domain
x.domain([d3.min(data, xValue), d3.max(data, xValue)]);
y.domain([d3.min(data, yValue), d3.max(data, yValue)+1]);

var lg = calcLinear(data, "duracao", "foi", d3.min(data, xValue), d3.min(data, yValue));

svg.append("line")
        .attr("class", "regression")
        .attr("x1", x(lg.ptA.x))
        .attr("y1", y(lg.ptA.y))
        .attr("x2", x(lg.ptB.x))
        .attr("y2", y(lg.ptB.y));


// x-axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
  .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("duracao");

// y-axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("foi");

// draw dots
svg.selectAll(".dot")
    .data(data)
  .enter().append("circle")
    .attr("class", "dot")
    .attr("r", 3.5)
    .attr("cx", xMap)
    .attr("cy", yMap)
    .style("fill", function(d) { return color(cValue(d));})
    .on("mouseover", function(d) {
        tooltip.transition()
             .duration(200)
             .style("opacity", .9);
        tooltip.html(d["foi"] + "<br/> (" + xValue(d)
        + ", " + yValue(d) + ")")
             .style("left", (d3.event.pageX + 5) + "px")
             .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        tooltip.transition()
             .duration(500)
             .style("opacity", 0);
    });

// draw legend
var legend = svg.selectAll(".legend")
    .data(color.domain())
  .enter().append("g")
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });


// draw legend text
legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return d;})
});

function calcLinear(data, x, y, minX, minY){
  /////////
  //SLOPE//
  /////////

  // Let n = the number of data points
  var n = data.length;

  var pts = [];
  data.forEach(function(d,i){
    var obj = {};
    obj.x = d[x];
    obj.y = d[y];
    obj.mult = obj.x*obj.y;
    pts.push(obj);
  });

  // Let a equal n times the summation of all x-values multiplied by their corresponding y-values
  // Let b equal the sum of all x-values times the sum of all y-values
  // Let c equal n times the sum of all squared x-values
  // Let d equal the squared sum of all x-values
  var sum = 0;
  var xSum = 0;
  var ySum = 0;
  var sumSq = 0;
  pts.forEach(function(pt){
    sum = sum + pt.mult;
    xSum = xSum + pt.x;
    ySum = ySum + pt.y;
    sumSq = sumSq + (pt.x * pt.x);
  });
  var a = sum * n;
  var b = xSum * ySum;
  var c = sumSq * n;
  var d = xSum * xSum;

  // Plug the values that you calculated for a, b, c, and d into the following equation to calculate the slope
  //  m = (a - b) / (c - d)
  var m = (a - b) / (c - d);

  /////////////
  //INTERCEPT//
  /////////////

  // Let e equal the sum of all y-values
  var e = ySum;

  // Let f equal the slope times the sum of all x-values
  var f = m * xSum;

  // Plug the values you have calculated for e and f into the following equation for the y-intercept
  // y-intercept = b = (e - f) / n = (14.5 - 10.5) / 3 = 1.3
  var b = (e - f) / n;

  // return an object of two points
  // each point is an object with an x and y coordinate
  return {
    ptA : {
      x: minX,
      y: m * minX + b
    },
    ptB : {
      y: minY,
      x: (minY - b) / m
    }
  }

}
