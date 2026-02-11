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
  
    data: { url: "data/videogames_wide.csv" },

        // Add this resolve block to make the x-axis independent for each row
        resolve: {
            axis: {
              x: "independent"
            }
          },
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
  
  