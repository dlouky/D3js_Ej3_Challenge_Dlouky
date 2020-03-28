import * as d3 from "d3";
import * as topojson from "topojson-client";
const argentinajson = require("./argentina.json"); //https://github.com/deldersveld/topojson/tree/master/countries/argentina
const d3Composite = require("d3-composite-projections");
import { latLongCommunities } from "./communities";
import { initial, final, ResultEntry } from "./stats";

// set the affected color scale
var color = d3
.scaleLinear<number, number>()
.domain([0, 350])
.range([10, 90]);

 const assignCommunityBackgroundColor = (countryName: string, data: ResultEntry[]) => {
  const item = data.find(
    item => item.name === countryName
  );
  if (item) {
    console.log(item.value);
  }
  return item ? 100-color(item.value) : 100;
 };


const calculateRadiusBasedOnAffectedCases = (comunidad: string, data: ResultEntry[]) => {
  const entry = data.find(item => item.name === comunidad);
  const maxAffected = 200/*data.reduce(
    (max, item) => (item.value > max ? item.value : max),
    0
  );*/

  const affectedRadiusScale = d3
  .scaleLinear()
  .domain([0, maxAffected])
  .range([0, 50]); // 50 pixel max radius, we could calculate it relative to width and height
  const radius = entry ? affectedRadiusScale(entry.value) : 0
  return (radius >0 && radius<10 ? 5:radius);
};


const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");

/*const aProjection = d3Composite
  .geoConicConformalSpain()
  // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);*/

const aProjection = d3.geoTransverseMercator()
.center([2.5, -38.5])
.rotate([66, 0])
.scale((800 * 56.5) / 33)
.translate([(1024 / 2), (800 / 2)]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(argentinajson, argentinajson.objects.ARG_adm1);


svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // data loaded from json file
  .attr("d", geoPath as any)
  .style("fill", function(d: any) {
    console.log(d.properties.NAME_1)
    let brigthness = assignCommunityBackgroundColor(d.properties.NAME_1, initial);
    return `hsla(14, 100%, ${brigthness}%, 1)`;
  });

svg
  .selectAll("circle")
  .data(latLongCommunities)
  
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name, initial))
  .attr("cx", d => aProjection([d.long, d.lat])[0])
  .attr("cy", d => aProjection([d.long, d.lat])[1])
  
  /*.merge(svg as any)
  .transition()
  .duration(500)
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name, final))*/
  ;


const updateCircles = (data: ResultEntry[]) => {
  svg.selectAll("circle")
  .data(latLongCommunities)
  /*.merge(svg as any)*/
  .transition()
  .duration(500)
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name, data))
  .attr("cx", d => aProjection([d.long, d.lat])[0])
  .attr("cy", d => aProjection([d.long, d.lat])[1]);
};

const updateMaps = (data: ResultEntry[]) => {
  svg
  .selectAll("path")
  .data(geojson["features"])
  /*.merge(svg as any)*/
  .transition()
  .duration(500)
  // data loaded from json file
  .attr("d", geoPath as any)
  .style("fill", function(d: any) {
    console.log(d.properties.NAME_1)
    let brigthness = assignCommunityBackgroundColor(d.properties.NAME_1, data);
    return `hsla(14, 100%, ${brigthness}%, 1)`;
  });
};


document
.getElementById("initial")
.addEventListener("click", function handleResultsInitial() {
  updateCircles(initial)
  updateMaps(initial);
});

document
.getElementById("final")
.addEventListener("click", function handleResultsFinal() {
  updateCircles(final)
  updateMaps(final);
});