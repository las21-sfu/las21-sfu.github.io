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
  