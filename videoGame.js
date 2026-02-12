const spec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 1200,
    height: 500,
  
    data: { url: "data/videogames_wide.csv" },
  
    transform: [
      {
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }
        ],
        groupby: ["Platform", "Genre"]
      }
    ],
  
    mark: { type: "circle", opacity: 0.85 },
  
    encoding: {
      x: {
        field: "Platform",
        type: "nominal",
        sort: { field: "Total_Global_Sales", order: "descending" },
        title: null
      },
  
      y: {
        field: "Genre",
        type: "nominal",
        title: null
      },
  
      size: {
        field: "Total_Global_Sales",
        type: "quantitative",
        scale: { range: [50, 2000] },
        legend: null
      },
  
      color: {
        field: "Total_Global_Sales",
        type: "quantitative",
        scale: { scheme: "blues" },
        legend: null
      },
  
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        {
          field: "Total_Global_Sales",
          type: "quantitative",
          format: ".2f",
          title: "Global Sales (Millions)"
        }
      ]
    },
  
    config: {
      view: { stroke: null },
      axis: { labelFontSize: 12 }
    }
  };
  
  
  /* ---------- Render Visualization ---------- */
  
  vegaEmbed("#vis", spec, { actions: false, renderer: "svg" })
    .then(() => {
  
      /* ---------- Drag-to-Scroll ---------- */
  
      const slider = document.querySelector(".vis-scroll");
  
      let isDown = false;
      let startX;
      let scrollLeft;
  
      slider.addEventListener("mousedown", (e) => {
        isDown = true;
        slider.style.cursor = "grabbing";
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
  
      slider.addEventListener("mouseleave", () => {
        isDown = false;
        slider.style.cursor = "grab";
      });
  
      slider.addEventListener("mouseup", () => {
        isDown = false;
        slider.style.cursor = "grab";
      });
  
      slider.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      });
  
    });
  
  
  /* ---------- Calculate Total Global Sales ---------- */
  
  d3.csv("data/videogames_wide.csv").then(data => {
  
    const totalSales = d3.sum(data, d => +d.Global_Sales);
  
    document.getElementById("totalSales").innerText =
      totalSales.toFixed(2) + " M";
  
  });
  const spec2 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  
    width: 1200,
    height: { step: 250 },

    resolve: {
      axis: {
        x: "independent"
      }
    },
  
    data: { url: "data/videogames_wide.csv" },

          transform: [
            { filter: "datum.Year <= 2018" },
            {
              aggregate: [
                { op: "sum", field: "Global_Sales", as: "Total_Global_Sales" }
              ],
              groupby: ["Year", "Genre", "Platform"]
            }
          ],
  
    params: [
      {
        name: "highlight",
        select: {
          type: "point",
          on: "click",
          clear: "click" 
        }
      }
    ],
  
    mark: {
      type: "area"
    },
  
    encoding: {
  
      x: {
        field: "Year",
        type: "ordinal",
        sort: "ascending",
        axis: {
          title: null,
          labelAngle: 0
        }
      },
  
      y: {
        field: "Total_Global_Sales",
        type: "quantitative",
        scale: {
          domain: [0, 200]
        },
        axis: {
          title: null,
          values: [0, 50, 100, 150, 200],
          grid: true
        }
      },
  
      row: {
        field: "Genre",
        title: null,
        type: "nominal",
        header: {
          labelAngle: 0,
          labelFontSize: 12
        }
      },
  
      color: {
        field: "Platform",
        type: "nominal",
        legend: null
      },
  
      opacity: {
        condition: { param: "highlight", value: 1 },
        value: 0.25
      },
  
      tooltip: [
        { field: "Genre", type: "nominal" },
        { field: "Platform", type: "nominal" },
        { field: "Year", type: "ordinal" },
        {
          field: "Total_Global_Sales",
          type: "quantitative",
          format: ".2f",
          title: "Global Sales (Millions)"
        }
      ]
    },
  
    config: {
      view: {
        stroke: null,
        strokeWidth: 0
      },
      axis: {
        labelFontSize: 11
      }
    }
  };
  
  vegaEmbed("#vis2", spec2, { actions: false });
  
  
  /* DRAG SCROLL BOTH DIRECTIONS */
  
  const slider2 = document.querySelector(".vis2-scroll");
  
  let isDown = false;
  let startX, startY, scrollLeft, scrollTop;
  
  slider2.addEventListener("mousedown", (e) => {
    isDown = true;
    slider2.style.cursor = "grabbing";
    startX = e.pageX - slider2.offsetLeft;
    startY = e.pageY - slider2.offsetTop;
    scrollLeft = slider2.scrollLeft;
    scrollTop = slider2.scrollTop;
  });
  
  slider2.addEventListener("mouseup", () => {
    isDown = false;
    slider2.style.cursor = "grab";
  });
  
  slider2.addEventListener("mouseleave", () => {
    isDown = false;
    slider2.style.cursor = "grab";
  });
  
  slider2.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider2.offsetLeft;
    const y = e.pageY - slider2.offsetTop;
    slider2.scrollLeft = scrollLeft - (x - startX);
    slider2.scrollTop = scrollTop - (y - startY);
  });
  
   

/* ========================================
   VISUALIZATION 3: Regional Sales by Platform
   ======================================== */

const spec3 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  
    width: 1200,
    height: { step: 200 },
  
    data: { url: "data/videogames_wide.csv" },

    
  
    transform: [
      // Aggregate sales by platform
      {
        aggregate: [
          { op: "sum", field: "Global_Sales", as: "Global_Sales_Sum" },
          { op: "sum", field: "NA_Sales", as: "NA_Sales_Sum" },
          { op: "sum", field: "EU_Sales", as: "EU_Sales_Sum" },
          { op: "sum", field: "JP_Sales", as: "JP_Sales_Sum" },
          { op: "sum", field: "Other_Sales", as: "Other_Sales_Sum" }
        ],
        groupby: ["Platform"]
      },
      // Fold to create separate rows for each sales type
      {
        fold: [
          "Global_Sales_Sum",
          "JP_Sales_Sum",
          "NA_Sales_Sum",
          "EU_Sales_Sum",
          "Other_Sales_Sum"
        ],
        as: ["Sales_Type", "Sales_Value"]
      },
      // Add readable labels for sales types
      {
        calculate: "datum.Sales_Type === 'Global_Sales_Sum' ? 'Global Sales' : datum.Sales_Type === 'NA_Sales_Sum' ? 'NA Sales' : datum.Sales_Type === 'EU_Sales_Sum' ? 'EU Sales' : datum.Sales_Type === 'JP_Sales_Sum' ? 'JP Sales' : 'Other Sales'",
        as: "Sales_Type_Label"
      }
    ],
  
    resolve: {
        scale: { y: "independent" },
        axis: { x: "independent" }
      },
  
    // Click to highlight
    params: [
      {
        name: "highlight",
        select: {
          type: "point",
          on: "click",
          clear: "click"
        }
      }
    ],
  
    mark: {
      type: "line",
      point: { size: 80 },
      strokeWidth: 3
    },
  
    encoding: {
      x: {
        field: "Platform",
        type: "nominal",
        sort: { field: "Sales_Value", order: "descending" },
        axis: {
          title: null,
          labelAngle: 0
        }
      },
  
      y: {
        field: "Sales_Value",
        type: "quantitative",
        axis: {
          title: null,
          grid: true,
          tickCount: 5
        }
      },
  
      row: {
        field: "Sales_Type",
        title: null,
        type: "nominal",
        sort: ["Global_Sales_Sum", "JP_Sales_Sum", "NA_Sales_Sum", "EU_Sales_Sum", "Other_Sales_Sum"],
        header: {
          labelAngle: 0,
          labelFontSize: 12,
          labelExpr: "datum.label === 'Global_Sales_Sum' ? 'Global Sales' : datum.label === 'NA_Sales_Sum' ? 'NA Sales' : datum.label === 'EU_Sales_Sum' ? 'EU Sales' : datum.label === 'JP_Sales_Sum' ? 'JP Sales' : 'Other Sales'"
        }
      },
  
      color: {
        field: "Sales_Type",
        type: "nominal",
        scale: {
          domain: ["Global_Sales_Sum", "JP_Sales_Sum", "NA_Sales_Sum", "EU_Sales_Sum", "Other_Sales_Sum"],
          range: ["#3f8efc", "#f39c12", "#e74c3c", "#2ecc71", "#9b59b6"]
        },
        legend: null
      },
  
      opacity: {
        condition: { param: "highlight", value: 1 },
        value: 0.3
      },
  
      tooltip: [
        { field: "Platform", type: "nominal", title: "Platform" },
        { field: "Sales_Type_Label", type: "nominal", title: "Sales Type" },
        {
          field: "Sales_Value",
          type: "quantitative",
          format: ".2f",
          title: "Sales (Millions)"
        }
      ]
    },
  
    config: {
      view: {
        stroke: "black",
        strokeWidth: 2
      },
      axis: {
        labelFontSize: 11
      }
    }
  };
  
  // Embed visualization 3
  vegaEmbed("#vis3", spec3, { 
    actions: false
  })
    .then((result) => {
      console.log("Visualization 3 embedded successfully");
    })
    .catch(error => {
      console.error("Error embedding Visualization 3:", error);
    });
  
  
  /* DRAG SCROLL BOTH DIRECTIONS FOR VIS 3 */
  
  const slider3 = document.querySelector(".vis3-scroll");
  
  let isDown3 = false;
  let startX3, startY3, scrollLeft3, scrollTop3;
  
  slider3.addEventListener("mousedown", (e) => {
    isDown3 = true;
    slider3.style.cursor = "grabbing";
    startX3 = e.pageX - slider3.offsetLeft;
    startY3 = e.pageY - slider3.offsetTop;
    scrollLeft3 = slider3.scrollLeft;
    scrollTop3 = slider3.scrollTop;
  });
  
  slider3.addEventListener("mouseup", () => {
    isDown3 = false;
    slider3.style.cursor = "grab";
  });
  
  slider3.addEventListener("mouseleave", () => {
    isDown3 = false;
    slider3.style.cursor = "grab";
  });
  
  slider3.addEventListener("mousemove", (e) => {
    if (!isDown3) return;
    e.preventDefault();
    const x = e.pageX - slider3.offsetLeft;
    const y = e.pageY - slider3.offsetTop;
    slider3.scrollLeft = scrollLeft3 - (x - startX3);
    slider3.scrollTop = scrollTop3 - (y - startY3);
  });
  
  const spec4 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 400,
    height: 400,
    data: { url: "data/videogames_wide.csv" },
    transform: [
      { filter: "datum.Platform === 'PS4'" },
      {
        fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
        as: ["Region", "Sales"]
      },
      {
        aggregate: [{ op: "sum", field: "Sales", as: "Total_Sales" }],
        groupby: ["Region"]
      }
    ],
    mark: { type: "arc", outerRadius: 180 },
    encoding: {
      theta: {
        field: "Total_Sales",
        type: "quantitative"
      },
      color: {
        field: "Region",
        type: "nominal",
        legend: { title: "Region" }
      },
      tooltip: [
        { field: "Region", type: "nominal" },
        { field: "Total_Sales", type: "quantitative", format: ".2f", title: "Total Sales (M)" }
      ]
    },
    config: {
      axis: { labelFontSize: 12, titleFontSize: 14 }
    }
  };
  
  vegaEmbed("#vis4", spec4);

  const spec1 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 800,
    height: 450,
    data: { url: "data/videogames_wide.csv" },
    transform: [
      // 1. Filter for only "Platform" games
      { filter: "datum.Genre === 'Platform'" }
    ],
    mark: "bar",
    encoding: {
      y: {
        field: "Platform",
        type: "nominal",
        sort: "-x", // Places the dominating platform at the top
        title: "Gaming Platform"
      },
      x: {
        field: "Global_Sales",
        type: "quantitative",
        aggregate: "sum",
        title: "Total Global Sales (Millions)"
      },
      color: {
        field: "Platform",
        type: "nominal",
        legend: null, // Legend is redundant with Y-axis labels
        scale: { scheme: "tableau20" }
      },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Global_Sales", type: "quantitative", aggregate: "sum", format: ".2f", title: "Total Sales (M)" }
      ]
    },
    config: {
      axis: { labelFontSize: 12, titleFontSize: 14 }
    }
  };
  
  vegaEmbed("#vis1", spec1);

/* ========================================
   VISUALIZATION 4: Geographic Appeal —
   NA Sales (x) vs JP Sales (y), sized by
   Global Sales, colour-coded by game Name
   ======================================== */

   const spec5 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 1200,
    height: 500,
  
    data: { url: "data/videogames_wide.csv" },
  
    /* Aggregate per game title so each dot = one unique Name */
    transform: [
      {
        aggregate: [
          { op: "sum", field: "NA_Sales",     as: "NA_Sales_Sum"     },
          { op: "sum", field: "JP_Sales",     as: "JP_Sales_Sum"     },
          { op: "sum", field: "Global_Sales", as: "Global_Sales_Sum" }
        ],
        groupby: ["Name"]
      }
    ],
  
    /* Click-to-highlight param */
    params: [
      {
        name: "picked",
        select: {
          type: "point",
          on: "click",
          clear: "click"
        }
      }
    ],
  
    mark: {
      type: "point",
      filled: true,
      opacity: 0.85,
      strokeWidth: 1.5
    },
  
    encoding: {
      /* X axis: NA Sales, 0-40 step 5 */
      x: {
        field: "NA_Sales_Sum",
        type: "quantitative",
        title: null,
        scale: { domain: [0, 40] },
        axis: {
          tickCount: 9,
          values: [0, 5, 10, 15, 20, 25, 30, 35, 40],
          grid: true,
          labelFontSize: 11
        }
      },
  
      /* Y axis: JP Sales, 0-10 step 1 */
      y: {
        field: "JP_Sales_Sum",
        type: "quantitative",
        title: null,
        scale: { domain: [0, 10] },
        axis: {
          tickCount: 11,
          values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          grid: true,
          labelFontSize: 11
        }
      },
  
      /* Size: Global Sales */
      size: {
        field: "Global_Sales_Sum",
        type: "quantitative",
        scale: { range: [20, 1200] },
        legend: null
      },
  
      /* Colour: game Name */
      color: {
        field: "Name",
        type: "nominal",
        scale: { scheme: "category20" },
        legend: null
      },
  
      /* Highlight on click — unselected dots fade */
      opacity: {
        condition: { param: "picked", value: 0.9 },
        value: 0.1
      },
  
      /* Tooltip */
      tooltip: [
        { field: "Name",             type: "nominal",      title: "Game"              },
        { field: "NA_Sales_Sum",     type: "quantitative",  title: "NA Sales (M)",     format: ".2f" },
        { field: "JP_Sales_Sum",     type: "quantitative",  title: "JP Sales (M)",     format: ".2f" },
        { field: "Global_Sales_Sum", type: "quantitative",  title: "Global Sales (M)", format: ".2f" }
      ]
    },
  
    config: {
      view: { stroke: null },
      axis: { labelFontSize: 12 }
    }
  };
  
  vegaEmbed("#vis5", spec5, { actions: false, renderer: "svg" });
  
  
  /* Drag-to-scroll for vis4 (both axes) */
  
  const slider4 = document.querySelector(".vis5-scroll");
  
  let isDown4 = false;
  let startX4, startY4, scrollLeft4, scrollTop4;
  
  slider4.addEventListener("mousedown", (e) => {
    isDown4 = true;
    slider4.style.cursor = "grabbing";
    startX4    = e.pageX - slider4.offsetLeft;
    startY4    = e.pageY - slider4.offsetTop;
    scrollLeft4 = slider4.scrollLeft;
    scrollTop4  = slider4.scrollTop;
  });
  
  slider4.addEventListener("mouseup",    () => { isDown4 = false; slider4.style.cursor = "grab"; });
  slider4.addEventListener("mouseleave", () => { isDown4 = false; slider4.style.cursor = "grab"; });
  
  slider4.addEventListener("mousemove", (e) => {
    if (!isDown4) return;
    e.preventDefault();
    slider4.scrollLeft = scrollLeft4 - (e.pageX - slider4.offsetLeft - startX4);
    slider4.scrollTop  = scrollTop4  - (e.pageY - slider4.offsetTop  - startY4);
  });

  const spec7 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 800,
    height: 400,
    data: { url: "data/videogames_wide.csv" },
    transform: [
      // 1. Filter for a subset of modern platforms to keep it readable
      { filter: "datum.Platform === 'PS4' || datum.Platform === 'XOne' || datum.Platform === 'PC' || datum.Platform === 'WiiU'" },
      // 2. Fold the regional sales columns into a single field
      {
        fold: ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"],
        as: ["Region", "Sales"]
      }
    ],
    mark: "bar",
    encoding: {
      y: {
        field: "Region",
        type: "nominal",
        title: "Market Region",
        sort: "-x"
      },
      x: {
        aggregate: "sum",
        field: "Sales",
        type: "quantitative",
        title: "Total Sales (Millions)"
      },
      // 3. Use Color to distinguish platforms
      color: {
        field: "Platform",
        type: "nominal",
        scale: { scheme: "category10" }
      },
      // 4. Use xOffset to create the "Grouped" effect
      xOffset: {
        field: "Platform"
      },
      tooltip: [
        { field: "Platform", type: "nominal" },
        { field: "Region", type: "nominal" },
        { field: "Sales", aggregate: "sum", type: "quantitative", format: ".2f", title: "Total Sales (M)" }
      ]
    },
    config: {
      axis: { labelFontSize: 12, titleFontSize: 14 }
    }
  };
  
  vegaEmbed("#vis7", spec7);

  const spec8 = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    width: 600,
    height: 600,
    data: { url: "data/videogames_wide.csv" },
    transform: [
      // 1. Focus on the Top 25 Global hits to keep the heatmap clean
      { filter: "datum.Global_Sales > 15" },
      // 2. Fold NA, JP, and Global sales into a single categorical axis
      {
        fold: ["NA_Sales", "JP_Sales", "Global_Sales"],
        as: ["SalesRegion", "Amount"]
      }
    ],
    mark: "rect", // This creates the heatmap cells
    encoding: {
      x: {
        field: "SalesRegion",
        type: "nominal",
        title: "Market Comparison",
        sort: ["NA_Sales", "JP_Sales", "Global_Sales"], // Order columns logically
        axis: { labelAngle: 0 }
      },
      y: {
        field: "Name",
        type: "nominal",
        title: "Game Title",
        sort: "-color" // Sort games by their sales intensity
      },
      color: {
        field: "Amount",
        type: "quantitative",
        aggregate: "sum",
        scale: { scheme: "magma" }, // High intensity = brighter color
        title: "Sales (Millions)"
      },
      tooltip: [
        { field: "Name", type: "nominal", title: "Game" },
        { field: "SalesRegion", type: "nominal", title: "Region" },
        { field: "Amount", type: "quantitative", title: "Sales (M)", format: ".2f" }
      ]
    },
    config: {
      axis: { labelFontSize: 11, titleFontSize: 13 },
      view: { stroke: "transparent" }
    }
  };
  
  vegaEmbed("#vis8", spec8);