const url = "";
const district_data_url =
  "https://data.gov.sg/api/action/datastore_search?resource_id=580e8e06-3428-496a-8a20-3439187c2174";

let width = 1000,
  height = 600;

let svg = d3.select("svg").attr("width", width).attr("height", height);

const singapore = [103.851959, 1.29027];

// Map and projection
//let projection = d3.geoEquirectangular().center(singapore).scale(500);
let projection = d3.geoOrthographic();
let geopath = d3.geoPath().projection(projection);
let graticule = d3.geoGraticule().step([10, 10]);

// List of cities
var cities = [
  { name: "Singapore", longitude: 103.851959, latitude: 1.29027 },
  { name: "London", longitude: -0.118092, latitude: 51.509865 },
  { name: "Tokyo", longitude: 139.839478, latitude: 35.652832 },
];
let time = Date.now();

// Load GeoJSON data
d3.json(
  "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"
).then((data) => {
  // Draw the map
  svg
    .append("path")
    .datum({ type: "Sphere" })
    .attr("id", "ocean")
    .attr("d", geopath)
    .attr("fill", "url(#oceanGradient)");
  svg
    .append("g")
    .attr("id", "countries")
    .selectAll("path")
    .data(data.features)
    .enter()
    .append("path")
    .attr("d", (d) => geopath(d))
    .attr("fill", "#777")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .on("mouseover", (event, d) => {
      d3.select(".tooltip")
        .text(d.properties.name)
        .style("position", "absolute")
        .style("background", "#fff")
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px");
      d3.select(event.target).attr("class", "country").classed("select", true);
    })
    .on("mouseout", (event, d) => {
      d3.select(".tooltip").text("");
      d3.select(event.target).attr("class", "country").classed("select", false);
    });
  svg
    .append("g")
    .attr("id", "graticules")
    .selectAll("path")
    .data([graticule()])
    .enter()
    .append("path")
    .attr("d", (d) => geopath(d))
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 0.2);
  svg
    .append("g")
    .attr("id", "cities")
    .selectAll("circle")
    .data(cities)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
    .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
    .attr("r", 5)
    .attr("fill", "yellow");
  let time = Date.now();

  d3.timer(function () {
    let angle = (Date.now() - time) * 0.02;
    projection.rotate([angle, 0, 0]);
    svg
      .select("g#countries")
      .selectAll("path")
      .attr("d", geopath.projection(projection));
    svg
      .select("g#graticules")
      .selectAll("path")
      .attr("d", geopath.projection(projection));
    svg
      .select("g#cities")
      .selectAll("circle")
      .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
      .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
      .attr("visibility", (d) => {
        var point = { type: "Point", coordinates: [d.longitude, d.latitude] };
        if (geopath(point) == null) {
          return "hidden";
        } else {
          return "visible";
        }
      });
  });
});
