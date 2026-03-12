import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function runApp() {
  // Configuration and State Variables
  const config = {
    width: 900,
    height: 700,
    margin: { top: 20, right: 40, bottom: 150, left: 80 },
    duration: 750,
    dataPath: "../datasets/gapminder_full.csv",
    excludeCountry: "Kuwait",
    svgSelector: "#visContainer",
    playButtonSelector: "#play",
    pauseButtonSelector: "#pause",
    resetButtonSelector: "#reset",
    yearSliderSelector: "#yearSlider",
    yearDisplaySelector: "#yearDisplay",
    scaleSelectSelector: "#scaleSelect",
    legendSpacingX: 150,
    legendSpacingY: 25,
    legendSize: 15,
  };

  let svg, xAxisGroup, yAxisGroup, yearLabel;
  let xScale, yScale, radiusScale, colorScale;
  let dataset, years, continents;
  let tooltip;
  let isPlaying = false;
  let currentYearIndex = 0;
  let timer;
  let xScaleType = "log";
  let userCircles = [];
  const MAX_USER_CIRCLES = 10;
  const PIN_PALETTE = [
    "#e63946",
    "#f4a261",
    "#2a9d8f",
    "#457b9d",
    "#e9c46a",
    "#8338ec",
    "#fb5607",
    "#06d6a0",
    "#ef476f",
    "#118ab2",
  ];
  let pinColorIndex = 0;

  // Prepare Visualization
  async function prepareVis() {
    dataset = await d3.csv(config.dataPath, d3.autoType);
    dataset = dataset.filter((d) => d.country !== config.excludeCountry);

    // Extract unique years and continents
    years = Array.from(new Set(dataset.map((d) => d.year))).sort(
      (a, b) => a - b
    );
    continents = Array.from(new Set(dataset.map((d) => d.continent))).sort();

    // Define SVG dimensions
    const { width, height, margin } = config;

    svg = d3
      .select(config.svgSelector)
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .classed("svg-content-responsive", true);

    // Compute the padding for scales
    const xExtent = d3.extent(dataset, (d) => d.gdp_cap);
    const yExtent = d3.extent(dataset, (d) => d.life_exp);

    const xDomainLinear = [0, xExtent[1] * 1.05];
    const xDomainLog = [xExtent[0] / 1.05, xExtent[1] * 1.05];
    const yDomain = [yExtent[0] - 5, yExtent[1] + 5];

    // Initialize scales
    xScale =
      xScaleType === "linear"
        ? d3.scaleLinear().range([margin.left, width - margin.right])
        : d3.scaleLog().range([margin.left, width - margin.right]);

    yScale = d3
      .scaleLinear()
      .range([height - margin.bottom, margin.top])
      .domain(yDomain);

    radiusScale = d3
      .scaleSqrt()
      .range([4, 40])
      .domain(d3.extent(dataset, (d) => d.population));

    colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(continents);

    // Initialize axes
    xAxisGroup = svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`);

    yAxisGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    // Axis Labels
    svg
      .append("text")
      .attr("class", "xLabel")
      .attr("x", width / 2)
      .attr("y", height - margin.bottom + 40)
      .attr("text-anchor", "middle")
      .text("GDP per Capita");

    svg
      .append("text")
      .attr("class", "yLabel")
      .attr("x", -height / 2)
      .attr("y", margin.left - 60)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .text("Life Expectancy");

    // Year Label
    yearLabel = svg
      .append("text")
      .attr("class", "yearLabel")
      .attr("x", width - margin.right)
      .attr("y", height - margin.bottom + 110)
      .attr("text-anchor", "end")
      .attr("fill", "#ccc")
      .attr("opacity", 0.7)
      .text(years[0]);

    // Legend
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${margin.left}, ${height - margin.bottom + 70})`
      );

    // Arrange legend items in multiple rows if necessary
    continents.forEach((continent, i) => {
      const legendRow = legend
        .append("g")
        .attr(
          "transform",
          `translate(${(i % 5) * config.legendSpacingX}, ${
            Math.floor(i / 5) * config.legendSpacingY
          })`
        );

      legendRow
        .append("rect")
        .attr("width", config.legendSize)
        .attr("height", config.legendSize)
        .attr("fill", colorScale(continent));

      legendRow
        .append("text")
        .attr("x", config.legendSize + 5)
        .attr("y", config.legendSize / 2)
        .attr("dy", "0.35em")
        .text(continent)
        .attr("fill", "#333");
    });

    // Initialize Tooltip
    tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("visibility", "hidden");

    // Store domains
    config.xDomainLinear = xDomainLinear;
    config.xDomainLog = xDomainLog;
    config.yDomain = yDomain;

    // Transparent rect to capture clicks on the chart area
    svg
      .append("rect")
      .attr("class", "click-capture")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "none")
      .style("pointer-events", "all")
      .on("click", function (event) {
        const [mx, my] = d3.pointer(event, svg.node());
        const color = PIN_PALETTE[pinColorIndex % PIN_PALETTE.length];
        pinColorIndex++;

        // Flash warning if at max, remove oldest
        if (userCircles.length >= MAX_USER_CIRCLES) {
          flashMaxWarning();
          userCircles.shift();
        }

        userCircles.push({ x: mx, y: my, id: Date.now(), color });
        spawnRipple(mx, my, color);
        renderUserCircles();
      })
      .on("contextmenu", function (event) {
        // Right-click anywhere clears the most recent pin
        event.preventDefault();
        if (userCircles.length > 0) {
          userCircles.pop();
          renderUserCircles();
        }
      });
  }

  // Spawn a ripple animation at click point
  function spawnRipple(x, y, color) {
    const ripple = svg
      .append("circle")
      .attr("class", "pin-ripple")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 8)
      .attr("fill", "none")
      .attr("stroke", color)
      .attr("stroke-width", 2.5)
      .attr("opacity", 0.9)
      .style("pointer-events", "none");

    ripple
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr("r", 40)
      .attr("stroke-width", 0.5)
      .attr("opacity", 0)
      .remove();
  }

  // Flash a warning text when max pins reached
  function flashMaxWarning() {
    const { width, height, margin } = config;
    const warn = svg
      .append("text")
      .attr("class", "pin-warning")
      .attr("x", (margin.left + width - margin.right) / 2)
      .attr("y", margin.top + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "#e63946")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("opacity", 1)
      .style("pointer-events", "none")
      .text("Max 10 pins — oldest removed");

    warn.transition().delay(1200).duration(500).attr("opacity", 0).remove();
  }

  // Render user-added pin circles with crosshairs and value labels
  function renderUserCircles() {
    // ── layer management ──────────────────────────────────────────────
    const userGroup = svg.selectAll("g.user-circles-layer").data([null]);
    const layer = userGroup
      .enter()
      .append("g")
      .attr("class", "user-circles-layer")
      .merge(userGroup);
    layer.raise();

    // ── crosshair guide lines ─────────────────────────────────────────
    const { margin, width, height } = config;
    const hLines = layer
      .selectAll("line.pin-hline")
      .data(userCircles, (d) => d.id);
    hLines
      .enter()
      .append("line")
      .attr("class", "pin-hline")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-width", 1)
      .attr("opacity", 0)
      .merge(hLines)
      .attr("x1", margin.left)
      .attr("y1", (d) => d.y)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y)
      .attr("stroke", (d) => d.color)
      .transition()
      .duration(300)
      .attr("opacity", 0.5);
    hLines.exit().transition().duration(200).attr("opacity", 0).remove();

    const vLines = layer
      .selectAll("line.pin-vline")
      .data(userCircles, (d) => d.id);
    vLines
      .enter()
      .append("line")
      .attr("class", "pin-vline")
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-width", 1)
      .attr("opacity", 0)
      .merge(vLines)
      .attr("x1", (d) => d.x)
      .attr("y1", (d) => d.y)
      .attr("x2", (d) => d.x)
      .attr("y2", height - margin.bottom)
      .attr("stroke", (d) => d.color)
      .transition()
      .duration(300)
      .attr("opacity", 0.5);
    vLines.exit().transition().duration(200).attr("opacity", 0).remove();

    // ── axis value labels ─────────────────────────────────────────────
    // Y-axis label (life expectancy at pin)
    const yLabels = layer
      .selectAll("text.pin-ylabel")
      .data(userCircles, (d) => d.id);
    yLabels
      .enter()
      .append("text")
      .attr("class", "pin-ylabel")
      .attr("x", margin.left - 4)
      .attr("text-anchor", "end")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("opacity", 0)
      .style("pointer-events", "none")
      .merge(yLabels)
      .attr("y", (d) => d.y + 4)
      .attr("fill", (d) => d.color)
      .text((d) => d3.format(".1f")(yScale.invert(d.y)))
      .transition()
      .duration(300)
      .attr("opacity", 1);
    yLabels.exit().transition().duration(200).attr("opacity", 0).remove();

    // X-axis label (GDP at pin)
    const xLabels = layer
      .selectAll("text.pin-xlabel")
      .data(userCircles, (d) => d.id);
    xLabels
      .enter()
      .append("text")
      .attr("class", "pin-xlabel")
      .attr("y", height - margin.bottom + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("opacity", 0)
      .style("pointer-events", "none")
      .merge(xLabels)
      .attr("x", (d) => d.x)
      .attr("fill", (d) => d.color)
      .text((d) => "$" + d3.format(",.0f")(xScale.invert(d.x)))
      .transition()
      .duration(300)
      .attr("opacity", 1);
    xLabels.exit().transition().duration(200).attr("opacity", 0).remove();

    // ── pin circles ───────────────────────────────────────────────────
    const pins = layer
      .selectAll("circle.user-pin")
      .data(userCircles, (d) => d.id);

    const pinEnter = pins
      .enter()
      .append("circle")
      .attr("class", "user-pin")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 0)
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("opacity", 0.95)
      .style("pointer-events", "all")
      .style("cursor", "pointer")
      .on("click", function (event, d) {
        // Click a pin to remove it
        event.stopPropagation();
        userCircles = userCircles.filter((c) => c.id !== d.id);
        renderUserCircles();
      })
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(150).attr("r", 13);
        tooltip.style("visibility", "visible").html(
          `<strong>📍 Pin</strong><br/>
          GDP per Capita: <strong>$${d3.format(",.0f")(
            xScale.invert(d.x)
          )}</strong><br/>
          Life Expectancy: <strong>${d3.format(".1f")(
            yScale.invert(d.y)
          )} yrs</strong><br/>
          <em style="font-size:0.8em; color:#aaa">Click pin to remove</em>`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(150).attr("r", 9);
        tooltip.style("visibility", "hidden");
      });

    pinEnter
      .merge(pins)
      .attr("fill", (d) => d.color)
      .transition()
      .duration(300)
      .attr("r", 9);

    // ── pin number labels (inside circle) ────────────────────────────
    const pinNums = layer
      .selectAll("text.pin-num")
      .data(userCircles, (d) => d.id);
    pinNums
      .enter()
      .append("text")
      .attr("class", "pin-num")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .attr("opacity", 0)
      .style("pointer-events", "none")
      .merge(pinNums)
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .text((d, i) => i + 1)
      .transition()
      .duration(300)
      .attr("opacity", 1);
    pinNums.exit().transition().duration(200).attr("opacity", 0).remove();

    pins.exit().transition().duration(200).attr("r", 0).remove();

    updateUserCircleCount();
  }

  // Show a count badge + hint text
  function updateUserCircleCount() {
    const { margin } = config;
    svg.selectAll("text.user-circle-count").remove();
    const label =
      userCircles.length === 0
        ? "Click chart to drop pins • Right-click to undo"
        : ` ${userCircles.length} / ${MAX_USER_CIRCLES} pins  •  click a pin to remove it`;
    svg
      .append("text")
      .attr("class", "user-circle-count")
      .attr("x", margin.left + 4)
      .attr("y", margin.top + 16)
      .attr("fill", userCircles.length >= MAX_USER_CIRCLES ? "#e63946" : "#888")
      .attr("font-size", "11px")
      .attr("font-style", "italic")
      .style("pointer-events", "none")
      .text(label);
  }

  // Draw or Update Visualization for a Given Year
  function drawVis(year) {
    const yearData = dataset.filter((d) => d.year === year);

    // Update Year Label
    yearLabel.text(year);

    // Update scales
    xScale.domain(
      xScaleType === "linear" ? config.xDomainLinear : config.xDomainLog
    );

    // Update Axes
    xAxisGroup
      .transition()
      .duration(config.duration)
      .call(
        xScaleType === "linear"
          ? d3.axisBottom(xScale)
          : d3.axisBottom(xScale).ticks(10, ".0s")
      );

    const circles = svg
      .selectAll("circle.data-circle")
      .data(yearData, (d) => d.country);

    // Enter Selection
    circles
      .enter()
      .append("circle")
      .attr("class", "data-circle")
      .attr("cx", (d) => xScale(d.gdp_cap))
      .attr("cy", (d) => yScale(d.life_exp))
      .attr("r", 0)
      .attr("fill", (d) => colorScale(d.continent))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip.style("visibility", "visible").html(
          `<strong>${d.country}</strong><br/>
            Continent: ${d.continent}<br/>
            GDP per Capita: $${d3.format(",.0f")(d.gdp_cap)}<br/>
            Life Expectancy: ${d3.format(".1f")(d.life_exp)} years<br/>
            Population: ${d3.format(",.0f")(d.population)}`
        );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", event.pageY - 10 + "px")
          .style("left", event.pageX + 10 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      })
      .transition()
      .duration(config.duration)
      .attr("r", (d) => radiusScale(d.population));

    circles
      .transition()
      .duration(config.duration)
      .attr("cx", (d) => xScale(d.gdp_cap))
      .attr("cy", (d) => yScale(d.life_exp))
      .attr("r", (d) => radiusScale(d.population))
      .attr("fill", (d) => colorScale(d.continent));

    circles.exit().transition().duration(config.duration).attr("r", 0).remove();

    svg.selectAll("rect.click-capture").raise();
    svg.selectAll("g.user-circles-layer").raise();
    svg.selectAll("text.user-circle-count").raise();
  }

  function playAnimation() {
    if (isPlaying) return;
    isPlaying = true;
    document.querySelector(config.playButtonSelector).disabled = true;
    document.querySelector(config.pauseButtonSelector).disabled = false;
    document.querySelector(config.resetButtonSelector).disabled = false;
    timer = setInterval(() => {
      if (currentYearIndex >= years.length - 1) {
        pauseAnimation();
        return;
      }
      currentYearIndex++;
      const year = years[currentYearIndex];
      updateYear(year);
    }, config.duration);
  }

  function pauseAnimation() {
    isPlaying = false;
    document.querySelector(config.playButtonSelector).disabled = false;
    document.querySelector(config.pauseButtonSelector).disabled = true;
    clearInterval(timer);
  }

  function resetAnimation() {
    pauseAnimation();
    currentYearIndex = 0;
    updateYear(years[currentYearIndex]);
    document.querySelector(config.resetButtonSelector).disabled = true;
  }

  function updateYear(year) {
    const slider = document.querySelector(config.yearSliderSelector);
    const yearDisplay = document.querySelector(config.yearDisplaySelector);
    slider.value = year;
    yearDisplay.textContent = year;
    currentYearIndex = years.indexOf(year);
    drawVis(year);
  }

  // Initialize the Visualization
  await prepareVis();

  // Initialize the slider
  const yearSlider = document.querySelector(config.yearSliderSelector);
  yearSlider.min = years[0];
  yearSlider.max = years[years.length - 1];
  yearSlider.step = 5;
  yearSlider.value = years[0];

  document.querySelector(config.yearDisplaySelector).textContent = years[0];

  const scaleSelect = document.querySelector(config.scaleSelectSelector);
  scaleSelect.value = "log";

  // Initial Draw
  drawVis(years[0]);
  renderUserCircles();

  // Event Listeners
  document
    .querySelector(config.playButtonSelector)
    .addEventListener("click", playAnimation);
  document
    .querySelector(config.pauseButtonSelector)
    .addEventListener("click", pauseAnimation);
  document
    .querySelector(config.resetButtonSelector)
    .addEventListener("click", resetAnimation);

  document
    .querySelector(config.yearSliderSelector)
    .addEventListener("input", function () {
      const year = +this.value;
      updateYear(year);
    });

  document
    .querySelector(config.scaleSelectSelector)
    .addEventListener("change", function () {
      xScaleType = this.value;
      xScale =
        xScaleType === "linear"
          ? d3
              .scaleLinear()
              .range([config.margin.left, config.width - config.margin.right])
          : d3
              .scaleLog()
              .range([config.margin.left, config.width - config.margin.right]);
      updateYear(years[currentYearIndex]);
    });

  // Initially disable pause and reset buttons
  document.querySelector(config.pauseButtonSelector).disabled = true;
  document.querySelector(config.resetButtonSelector).disabled = true;
})();
