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

  const clean_pop_data = pop_data.map((pop) => {
    return {
      Subzone: pop.Subzone,
      "Planning Area": pop["Planning Area"],
      Population: isNaN(pop.Population) ? 0 : parseInt(pop.Population),
    };
  });

  const planning_area_pop = [];
  const subzone_pop = [];

  for (let i in clean_pop_data) {
    let planning_area = planning_area_pop.find(
      (area) => area.Name == clean_pop_data[i]["Planning Area"]
    );

    let new_planning_area;
    if (planning_area == undefined) {
      planning_area = {
        Name: clean_pop_data[i]["Planning Area"],
        Population: clean_pop_data[i]["Population"],
      };

      planning_area_pop.push(planning_area);
    } else {
      new_planning_area = {
        ...planning_area,
        Population: planning_area.Population + clean_pop_data[i]["Population"],
      };

      planning_area_pop[planning_area_pop.indexOf(planning_area)] =
        new_planning_area;
    }
    if (
      clean_pop_data[i]["Planning Area"] == "Tengah" ||
      clean_pop_data[i]["Planning Area"] == "Western Water Catchment"
    ) {
      if (new_planning_area == undefined) {
        subzone_pop.push(planning_area);
      } else {
        subzone_pop[subzone_pop.indexOf(planning_area)] = new_planning_area;
      }
    }

    let subzone = {};
    if (clean_pop_data[i]["Subzone"].includes("Lakeside")) {
      subzone = subzone_pop.find((zone) => zone.Name.includes("Lakeside"));

      if (subzone == undefined) {
        subzone = {
          Name: "Lakeside",
          Population: clean_pop_data[i]["Population"],
        };
        subzone_pop.push(subzone);
      } else {
        new_subzone = {
          ...subzone,
          Population: subzone.Population + clean_pop_data[i]["Population"],
        };
        subzone_pop[subzone_pop.indexOf(subzone)] = new_subzone;
      }
    } else {
      subzone = {
        Name: clean_pop_data[i]["Subzone"],
        Population: clean_pop_data[i]["Population"],
      };
      subzone_pop.push(subzone);
    }
  }
  console.log(planning_area_pop);
  console.log(subzone_pop);

  const area_to_viz = subzone_pop;
  let pop_num = area_to_viz.map((pop) => {
    return isNaN(pop.Population) ? 0 : parseInt(pop.Population);
  });
  let max_pop = Math.max(...pop_num);
  console.log(max_pop);

  let pop_col_scale = d3.scaleLinear().domain([0, max_pop]).range([0, 1]);

  // Legend dimensions
  const legend_dim = {
    x: (width / 5) * 3,
    y: height - 70,
    height: 20,
    width: width / 3,
  };

  let legend_scale = d3
    .scaleLinear()
    .domain([0, max_pop])
    .range([0, legend_dim.width]);

  // Map svg
  // Fill by planning area population
  svg
    .append("g")
    .attr("id", "districts")
    .selectAll("path")
    .data(sgmap.features)
    .enter()
    .append("path")
    .attr("d", geopath)
    .attr("fill", (data) => {
      const area = area_to_viz.find(
        (pop) =>
          pop["Name"].toLowerCase() === data.properties["Name"].toLowerCase()
      );
      if (area == undefined) {
        console.log(data);
      }
      return area == undefined
        ? "black"
        : d3.interpolateGnBu(pop_col_scale(area.Population));
      //return "black";
      //return d3.interpolateGnBu(pop_col_scale(area.Population));
    })
    .on("mouseover", (event, data) => {
      const area = area_to_viz.find(
        (pop) =>
          pop["Name"].toLowerCase() === data.properties["Name"].toLowerCase()
      );
      d3.select(event.target).attr("class", "district").classed("select", true);

      d3.select(".tooltip")
        .html(
          `District: ${data.properties["Planning Area Name"].toLowerCase()}
          <br/>Sub-District: ${data.properties[
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

  // Legend
  const chart_defs = svg.append("defs");
  const lg = chart_defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", 0)
    .attr("y1", 0.5)
    .attr("x2", 1)
    .attr("y2", 0.5);

  let offset = 0;

  for (let i = 0; i <= 10; i++) {
    lg.append("stop")
      .attr("offset", `${offset}%`)
      .attr("stop-color", d3.interpolateGnBu(i * 0.1));
    offset += 10;
  }

  svg
    .append("rect")
    .attr("x", legend_dim.x)
    .attr("y", legend_dim.y)
    .attr("width", legend_dim.width)
    .attr("height", legend_dim.height)
    .attr("fill", "url(#legend-gradient)");

  svg
    .append("g")
    .attr("class", "x-axis")
    .attr(
      "transform",
      `translate(${legend_dim.x}, ${legend_dim.y + legend_dim.height})`
    )
    .call(d3.axisBottom(legend_scale))
    .selectAll("text")
    .attr("transform", "rotate(45)")
    .style("text-anchor", "start");
})();
