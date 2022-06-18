const district_data_url =
  "https://data.gov.sg/api/action/datastore_search?resource_id=580e8e06-3428-496a-8a20-3439187c2174";

let width = 1000,
  height = 600;

const singapore = [103.851959, 1.29027];

let svg = d3
  .select("svg")
  .attr("class", "map")
  .attr("width", width)
  .attr("height", height);

let time = Date.now();
(async () => {
  let sgmap = await d3.json("sgmap.json");
  console.log(sgmap);

  let pop_data = await d3.csv("population2021.csv");

  let projection = d3
    .geoMercator()
    .center(singapore)
    .fitExtent(
      [
        [20, 20],
        [980, 580],
      ],
      sgmap
    );

  let geopath = d3.geoPath().projection(projection);

  let clean_pop_data = pop_data.map((pop) => {
    return {
      Subzone: pop.Subzone,
      "Planning Area": pop["Planning Area"],
      Population: isNaN(pop.Population) ? 0 : parseInt(pop.Population),
    };
  });
  console.log(clean_pop_data);
  let pop_num = pop_data.map((pop) => {
    return isNaN(pop.Population) ? 0 : parseInt(pop.Population);
  });
  let max_pop = Math.max(...pop_num);
  console.log(max_pop);

  let pop_col_scale = d3.scaleLinear().domain([0, max_pop]).range([0, 1]);

  svg
    .append("g")
    .attr("id", "districts")
    .selectAll("path")
    .data(sgmap.features)
    .enter()
    .append("path")
    .attr("d", geopath)
    .attr("fill", (data) => {
      const area = clean_pop_data.find(
        (pop) =>
          pop["Subzone"].toLowerCase() === data.properties["Name"].toLowerCase()
      );
      if (area == undefined) {
        console.log(data.properties["Name"].toLowerCase());
      }
      return area == undefined
        ? "black"
        : d3.interpolateGnBu(pop_col_scale(area.Population));
      //return "black";
      //return d3.interpolateGnBu(pop_col_scale(area.Population));
    })
    .on("mouseover", (event, data) => {
      const area = clean_pop_data.find(
        (pop) =>
          pop["Subzone"].toLowerCase() === data.properties["Name"].toLowerCase()
      );
      d3.select(event.target).attr("class", "district").classed("select", true);

      d3.select(".tooltip")
        .html(
          `Sub-District: ${data.properties[
            "Name"
          ].toLowerCase()}<br/>Population: ${
            area == undefined ? 0 : area.Population
          }`
        )
        .style("position", "absolute")
        .style("left", width * (70 / 100))
        .style("top", height * (80 / 100))
        .style("visibility", "visible");
    })
    .on("mouseout", (event, data) => {
      d3.select(event.target)
        .attr("class", "district")
        .classed("select", false);

      d3.select(".tooltip").style("visibility", "hidden");
    });
})();
