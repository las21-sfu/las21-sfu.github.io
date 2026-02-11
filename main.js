const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("active");
      }
    });
  },
  {
    threshold: 0.15
  }
);

revealElements.forEach((el) => revealObserver.observe(el));

const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "Video game sales visualization",
  "data": {
    "url": "data/videogames_wide.csv",
    "format": {
      "type": "csv"
    }
  },
  "mark": "bar",
  "encoding": {
    "x": {
      "field": "Platform",
      "type": "nominal",
      "title": "Platform"
    },
    "y": {
      "aggregate": "sum",
      "field": "Global_Sales",
      "type": "quantitative",
      "title": "Global Sales (millions)"
    }
  }
};

vegaEmbed("#vis", spec)
  .catch(console.error);
