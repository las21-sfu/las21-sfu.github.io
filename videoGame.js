/* ==========================================================================
   UI ANIMATIONS
   ========================================================================== */

/**
 * IntersectionObserver — adds .visible to .reveal and hr elements
 * when they scroll into view, triggering CSS transitions.
 */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  },
  { threshold: 0.08 }
);

document.querySelectorAll(".reveal, hr").forEach((el) => {
  revealObserver.observe(el);
});

/* ==========================================================================
   INSIGHT CARD TOGGLE
   Uses CSS max-height animation via .open class instead of display:none
   ========================================================================== */

/**
 * Toggle an insight card's body open/closed.
 * @param {number} id - The insight number (1, 2, or 3)
 */
function toggleInsight(id) {
  const text = document.getElementById(`insight-${id}`);
  text.classList.toggle("open");
}

/* ==========================================================================
   DRAG-TO-SCROLL UTILITY
   ========================================================================== */

/**
 * Attach drag-to-scroll behaviour to a scroll container.
 * @param {string} selector  - CSS selector for the scroll container
 * @param {Object} [options]
 * @param {boolean} [options.vertical=false] - Also enable vertical drag-scroll
 */
function attachDragScroll(selector, options = {}) {
  const el = document.querySelector(selector);
  if (!el) return;

  let isDown = false;
  let startX, startY, scrollLeft, scrollTop;

  el.addEventListener("mousedown", (e) => {
    isDown = true;
    el.style.cursor = "grabbing";
    startX = e.pageX - el.offsetLeft;
    startY = e.pageY - el.offsetTop;
    scrollLeft = el.scrollLeft;
    scrollTop = el.scrollTop;
  });

  el.addEventListener("mouseup", () => {
    isDown = false;
    el.style.cursor = "grab";
  });
  el.addEventListener("mouseleave", () => {
    isDown = false;
    el.style.cursor = "grab";
  });

  el.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX);
    if (options.vertical) {
      el.scrollTop = scrollTop - (e.pageY - el.offsetTop - startY);
    }
  });
}

/* Responsive breakpoint */
const isMobile = window.innerWidth < 640;

/* ==========================================================================
   VISUALIZATION 1: Global Sales by Genre and Platform (Bubble Matrix)
   Screen position : 1st
   HTML target     : #vis1
   ========================================================================== */
const spec1 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 1200,
  height: 450,
  data: { url: "data/videogames_wide.csv" },
  transform: [
    {
      aggregate: [
        { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" },
      ],
      groupby: ["Platform", "Genre"],
    },
  ],
  mark: { type: "circle", opacity: 0.85 },
  encoding: {
    x: {
      field: "Platform",
      type: "nominal",
      sort: { field: "Total_Global_Sales", order: "descending" },
      title: null,
    },
    y: { field: "Genre", type: "nominal", title: null },
    size: {
      field: "Total_Global_Sales",
      type: "quantitative",
      scale: { range: [50, 2000] },
      legend: null,
    },
    color: {
      field: "Total_Global_Sales",
      type: "quantitative",
      scale: { scheme: "blues" },
      legend: null,
    },
    tooltip: [
      { field: "Genre", type: "nominal" },
      { field: "Platform", type: "nominal" },
      {
        field: "Total_Global_Sales",
        type: "quantitative",
        format: ".2f",
        title: "Global Sales (Millions)",
      },
    ],
  },
  config: {
    view: { stroke: null },
    axis: { labelFontSize: 12 },
  },
};

vegaEmbed("#vis1", spec1, {
  actions: false,
  renderer: "svg",
  tooltip: new vegaTooltip.Handler().call,
}).then(() => {
  attachDragScroll(".vis1-scroll");

  d3.csv("data/videogames_wide.csv").then((data) => {
    // Filter out rows where Global_Sales is not a valid number (handles malformed CSV rows)
    const validData = data.filter(
      (d) => d.Global_Sales && !isNaN(+d.Global_Sales)
    );
    const totalSales = d3.sum(validData, (d) => +d.Global_Sales);
    document.getElementById("totalSales").innerText =
      totalSales.toFixed(2) + " M";
  });
});

/* ==========================================================================
   VISUALIZATION 2: Console "Genre Personalities" (Radial Donuts)
   Screen position : 2nd
   HTML target     : #vis2
   ========================================================================== */

const spec2 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: { url: "data/videogames_wide.csv" },
  transform: [
    { filter: { field: "Platform", oneOf: ["X360", "PS2", "SNES", "DS"] } },
  ],
  facet: {
    field: "Platform",
    type: "nominal",
    columns: isMobile ? 1 : 2,
    title: {
      text: "Global Sales Breakdown by Genre",
      fontSize: 16,
      anchor: "middle",
      offset: 20,
    },
  },
  spec: {
    width: isMobile ? 250 : 220,
    height: isMobile ? 250 : 220,
    mark: { type: "arc", innerRadius: 50, stroke: "#fff" },
    encoding: {
      theta: {
        field: "Global_Sales",
        type: "quantitative",
        aggregate: "sum",
        stack: true,
      },
      color: {
        field: "Genre",
        type: "nominal",
        scale: { scheme: "category20" },
        legend: {
          title: "Game Genre",
          orient: "bottom",
          columns: 4,
          symbolType: "circle",
          offset: 30,
        },
      },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Genre", type: "nominal" },
        {
          field: "Global_Sales",
          aggregate: "sum",
          type: "quantitative",
          format: ".2f",
          title: "Total Genre Sales (M)",
        },
        {
          field: "Publisher",
          aggregate: "distinct",
          type: "quantitative",
          title: "Number of Publishers",
        },
      ],
    },
  },
  config: {
    facet: { spacing: 50 },
    view: { stroke: null },
  },
};

vegaEmbed("#vis2", spec2, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
});

/* ==========================================================================
   VISUALIZATION 3: Regional Sales by Genre & Year — Area Chart
   Screen position : 3rd
   HTML target     : #vis3
   ========================================================================== */
const spec3 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 1200,
  height: { step: 250 },
  resolve: {
    axis: { x: "independent" },
  },
  data: { url: "data/videogames_wide.csv" },
  transform: [
    { filter: "datum.Year <= 2018" },
    {
      aggregate: [
        { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" },
      ],
      groupby: ["Year", "Genre", "Platform"],
    },
  ],

  params: [
    {
      name: "highlight",
      select: {
        type: "point",
        on: "click",
        clear: "click",
      },
    },
  ],
  mark: { type: "area" },
  encoding: {
    x: {
      field: "Year",
      type: "ordinal",
      sort: "ascending",
      axis: { title: null, labelAngle: 0 },
    },
    y: {
      field: "Total_Global_Sales",
      type: "quantitative",
      scale: { domain: [0, 200] },
      axis: {
        title: null,
        values: [0, 50, 100, 150, 200],
        grid: true,
      },
    },
    row: {
      field: "Genre",
      title: null,
      type: "nominal",
      header: { labelAngle: 0, labelFontSize: 12 },
    },
    color: {
      field: "Platform",
      type: "nominal",
      legend: null,
    },
    opacity: {
      condition: { param: "highlight", value: 1 },
      value: 0.25,
    },

    tooltip: [
      { field: "Genre", type: "nominal" },
      { field: "Platform", type: "nominal" },
      { field: "Year", type: "ordinal" },
      {
        field: "Total_Global_Sales",
        type: "quantitative",
        format: ".2f",
        title: "Global Sales (Millions)",
      },
    ],
  },
  config: {
    view: { stroke: null, strokeWidth: 0 },
    axis: { labelFontSize: 11 },
  },
};

vegaEmbed("#vis3", spec3, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
}).then(() => {
  attachDragScroll(".vis3-scroll", { vertical: true });
});
/* ==========================================================================
   VISUALIZATION 4: Regional Market Composition — Grouped Bar
   (PS4 vs XOne vs PC vs WiiU)
   Screen position : 4th
   HTML target     : #vis4
   ========================================================================== */

const spec4 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 800,
  height: 400,
  data: { url: "data/videogames_wide.csv" },
  transform: [
    {
      filter:
        "datum.Platform === 'PS4' || datum.Platform === 'XOne' || datum.Platform === 'PC' || datum.Platform === 'WiiU'",
    },
    {
      fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
      as: ["Region", "Sales"],
    },
  ],
  mark: "bar",
  encoding: {
    y: {
      field: "Region",
      type: "nominal",
      title: "Market Region",
      sort: "-x",
    },
    x: {
      aggregate: "sum",
      field: "Sales",
      type: "quantitative",
      title: "Total Sales (Millions)",
    },
    color: {
      field: "Platform",
      type: "nominal",
      scale: { scheme: "category10" },
    },
    xOffset: { field: "Platform" },
    tooltip: [
      { field: "Platform", type: "nominal" },
      { field: "Region", type: "nominal" },
      {
        field: "Sales",
        aggregate: "sum",
        type: "quantitative",
        format: ".2f",
        title: "Total Sales (M)",
      },
    ],
  },
  config: { axis: { labelFontSize: 12, titleFontSize: 14 } },
};

vegaEmbed("#vis4", spec4, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
});

/* ==========================================================================
   VISUALIZATION 5: Regional Sales by Platform — Multi-row Line Chart
   Screen position : 5th
   HTML target     : #vis5
   ========================================================================== */

const spec5 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 1200,
  height: { step: 200 },
  data: { url: "data/videogames_wide.csv" },
  transform: [
    {
      aggregate: [
        { op: "sum", field: "Global_Sales", as: "Global_Sales_Sum" },
        { op: "sum", field: "NA_Sales", as: "NA_Sales_Sum" },
        { op: "sum", field: "EU_Sales", as: "EU_Sales_Sum" },
        { op: "sum", field: "JP_Sales", as: "JP_Sales_Sum" },
        { op: "sum", field: "Other_Sales", as: "Other_Sales_Sum" },
      ],
      groupby: ["Platform"],
    },
    {
      fold: [
        "Global_Sales_Sum",
        "JP_Sales_Sum",
        "NA_Sales_Sum",
        "EU_Sales_Sum",
        "Other_Sales_Sum",
      ],
      as: ["Sales_Type", "Sales_Value"],
    },
    {
      calculate:
        "datum.Sales_Type === 'Global_Sales_Sum' ? 'Global Sales' : datum.Sales_Type === 'NA_Sales_Sum' ? 'NA Sales' : datum.Sales_Type === 'EU_Sales_Sum' ? 'EU Sales' : datum.Sales_Type === 'JP_Sales_Sum' ? 'JP Sales' : 'Other Sales'",
      as: "Sales_Type_Label",
    },
  ],
  resolve: {
    scale: { y: "independent" },
    axis: { x: "independent" },
  },
  params: [
    {
      name: "highlight",
      select: { type: "point", on: "click", clear: "click" },
    },
  ],
  mark: { type: "line", point: { size: 80 }, strokeWidth: 3 },
  encoding: {
    x: {
      field: "Platform",
      type: "nominal",
      sort: { field: "Sales_Value", order: "descending" },
      axis: { title: null, labelAngle: 0 },
    },
    y: {
      field: "Sales_Value",
      type: "quantitative",
      axis: { title: null, grid: true, tickCount: 5 },
    },
    row: {
      field: "Sales_Type",
      title: null,
      type: "nominal",
      sort: [
        "Global_Sales_Sum",
        "JP_Sales_Sum",
        "NA_Sales_Sum",
        "EU_Sales_Sum",
        "Other_Sales_Sum",
      ],
      header: {
        labelAngle: 0,
        labelFontSize: 12,
        labelExpr:
          "datum.label === 'Global_Sales_Sum' ? 'Global Sales' : datum.label === 'NA_Sales_Sum' ? 'NA Sales' : datum.label === 'EU_Sales_Sum' ? 'EU Sales' : datum.label === 'JP_Sales_Sum' ? 'JP Sales' : 'Other Sales'",
      },
    },
    color: {
      field: "Sales_Type",
      type: "nominal",
      scale: {
        domain: [
          "Global_Sales_Sum",
          "JP_Sales_Sum",
          "NA_Sales_Sum",
          "EU_Sales_Sum",
          "Other_Sales_Sum",
        ],
        range: ["#3f8efc", "#f39c12", "#e74c3c", "#2ecc71", "#9b59b6"],
      },
      legend: null,
    },
    opacity: {
      condition: { param: "highlight", value: 1 },
      value: 0.3,
    },
    tooltip: [
      { field: "Platform", type: "nominal" },
      { field: "Sales_Type_Label", type: "nominal", title: "Sales Type" },
      {
        field: "Sales_Value",
        type: "quantitative",
        format: ".2f",
        title: "Sales (Millions)",
      },
    ],
  },
  config: {
    view: { stroke: "black", strokeWidth: 2 },
    axis: { labelFontSize: 11 },
  },
};

vegaEmbed("#vis5", spec5, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
}).then(() => {
  attachDragScroll(".vis5-scroll", { vertical: true });
});

/* ==========================================================================
   VISUALIZATION 6: Proportional Market Dependency — Heatmap
   Screen position : 6th
   HTML target     : #vis6
   ========================================================================== */

const spec6 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 700,
  height: 400,
  data: { url: "data/videogames_wide.csv" },
  transform: [
    {
      filter: {
        field: "Platform",
        oneOf: ["X360", "PS3", "Wii", "DS", "PC", "XOne", "PS4", "3DS"],
      },
    },
    {
      fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
      as: ["Region", "Sales"],
    },
    {
      joinaggregate: [{ op: "sum", field: "Sales", as: "TotalPlatformSales" }],
      groupby: ["Platform"],
    },
    {
      calculate: "datum.Sales / datum.TotalPlatformSales",
      as: "PercentOfGlobal",
    },

    /* 👇 ADD THIS HERE */
    {
      aggregate: [{ op: "sum", field: "PercentOfGlobal", as: "SumPercent" }],
      groupby: ["Platform", "Region"],
    },
  ],

  mark: "rect",
  encoding: {
    x: {
      field: "Region",
      type: "nominal",
      title: "Market Region",
      sort: ["NA_Sales", "EU_Sales", "Other_Sales", "JP_Sales"],
    },
    y: { field: "Platform", type: "nominal", title: "Gaming Platform" },
    color: {
      field: "SumPercent",
      type: "quantitative",
      scale: { scheme: "bluepurple" },
      title: "% of Total Revenue",
    },

    tooltip: [
      { field: "Platform", type: "nominal" },
      { field: "Region", type: "nominal" },
      {
        field: "SumPercent",
        type: "quantitative",
        format: ".1%",
        title: "Market Dependency",
      },
    ],
  },
  config: {
    view: { stroke: "transparent" },
    axis: { labelAngle: 0 },
  },
};

vegaEmbed("#vis6", spec6, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
});

/* ==========================================================================
   VISUALIZATION 7: East-West "Symmetry" Plot
   Screen position : 7th
   HTML target     : #vis7
   ========================================================================== */

const spec7 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 700,
  height: 500,
  data: { url: "data/videogames_wide.csv" },
  transform: [{ filter: "datum.Year > 2000" }],
  mark: { type: "point", filled: true, size: 200, opacity: 0.7 },
  encoding: {
    x: {
      field: "NA_Sales",
      type: "quantitative",
      aggregate: "sum",
      title: "North American Market Power (Millions)",
    },
    y: {
      field: "JP_Sales",
      type: "quantitative",
      aggregate: "sum",
      title: "Japanese Market Power (Millions)",
    },
    color: {
      field: "Platform",
      type: "nominal",
      scale: { scheme: "category20" },
    },
    shape: { field: "Platform", type: "nominal" },
    tooltip: [
      { field: "Platform", type: "nominal" },
      {
        field: "NA_Sales",
        aggregate: "sum",
        type: "quantitative",
        title: "Total NA Sales (M)",
      },
      {
        field: "JP_Sales",
        aggregate: "sum",
        type: "quantitative",
        title: "Total JP Sales (M)",
      },
    ],
  },
};

vegaEmbed("#vis7", spec7, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
});

/* ==========================================================================
   VISUALIZATION 8: Geographic Appeal — NA vs JP Scatterplot
   Screen position : 8th
   HTML target     : #vis8
   ========================================================================== */

const spec8 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 1200,
  height: 500,
  data: { url: "data/videogames_wide.csv" },
  transform: [
    {
      aggregate: [
        { op: "sum", field: "NA_Sales", as: "NA_Sales_Sum" },
        { op: "sum", field: "JP_Sales", as: "JP_Sales_Sum" },
        { op: "sum", field: "Global_Sales", as: "Global_Sales_Sum" },
      ],
      groupby: ["Name"],
    },
  ],
  params: [
    { name: "picked", select: { type: "point", on: "click", clear: "click" } },
  ],
  mark: { type: "point", filled: true, opacity: 0.85, strokeWidth: 1.5 },
  encoding: {
    x: {
      field: "NA_Sales_Sum",
      type: "quantitative",
      title: null,
      scale: { domain: [0, 45] },
      axis: {
        tickCount: 10,
        values: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45],
        grid: true,
        labelFontSize: 11,
      },
    },
    y: {
      field: "JP_Sales_Sum",
      type: "quantitative",
      title: null,
      scale: { domain: [0, 11] },
      axis: {
        tickCount: 11,
        values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        grid: true,
        labelFontSize: 11,
      },
    },
    size: {
      field: "Global_Sales_Sum",
      type: "quantitative",
      scale: { range: [20, 1200] },
      legend: null,
    },
    color: {
      field: "Name",
      type: "nominal",
      scale: { scheme: "category20" },
      legend: null,
    },
    opacity: {
      condition: { param: "picked", value: 0.9 },
      value: 0.1,
    },
    tooltip: [
      { field: "Name", type: "nominal", title: "Game" },
      {
        field: "NA_Sales_Sum",
        type: "quantitative",
        title: "NA Sales (M)",
        format: ".2f",
      },
      {
        field: "JP_Sales_Sum",
        type: "quantitative",
        title: "JP Sales (M)",
        format: ".2f",
      },
      {
        field: "Global_Sales_Sum",
        type: "quantitative",
        title: "Global Sales (M)",
        format: ".2f",
      },
    ],
  },
  config: {
    view: { stroke: null },
    axis: { labelFontSize: 12 },
  },
};

vegaEmbed("#vis8", spec8, {
  actions: false,
  renderer: "svg",
  tooltip: new vegaTooltip.Handler().call,
}).then(() => {
  attachDragScroll(".vis8-scroll", { vertical: true });
});

/* ==========================================================================
   VISUALIZATION 9: Regional Divergence Heatmap
   Screen position : 9th
   HTML target     : #vis9
   ========================================================================== */

const spec9 = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  width: 600,
  height: 600,
  data: { url: "data/videogames_wide.csv" },
  transform: [
    { filter: "datum.Global_Sales > 15" },
    {
      fold: ["NA_Sales", "JP_Sales", "Global_Sales"],
      as: ["SalesRegion", "Amount"],
    },
  ],
  mark: "rect",
  encoding: {
    x: {
      field: "SalesRegion",
      type: "nominal",
      title: "Market Comparison",
      sort: ["NA_Sales", "JP_Sales", "Global_Sales"],
      axis: { labelAngle: 0 },
    },
    y: {
      field: "Name",
      type: "nominal",
      title: "Game Title",
      sort: "-color",
    },
    color: {
      field: "Amount",
      type: "quantitative",
      aggregate: "sum",
      scale: { scheme: "magma" },
      title: "Sales (Millions)",
    },
    tooltip: [
      { field: "Name", type: "nominal", title: "Game" },
      { field: "SalesRegion", type: "nominal", title: "Region" },
      {
        field: "Amount",
        type: "quantitative",
        title: "Sales (M)",
        format: ".2f",
      },
    ],
  },
  config: {
    axis: { labelFontSize: 11, titleFontSize: 13 },
    view: { stroke: "transparent" },
  },
};

vegaEmbed("#vis9", spec9, {
  actions: false,
  tooltip: new vegaTooltip.Handler().call,
});
