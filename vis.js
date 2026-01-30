console.log("script.js loaded");

const svg = document.getElementById("bubbleChart");

// Dog walking data
const dogWalks = [
  { time: 10, distance: 500 },
  { time: 20, distance: 1200 },
  { time: 30, distance: 2000 },
  { time: 45, distance: 2000 },
];

const width = 600;
const height = 400;
const padding = 50;

const maxTime = Math.max(...dogWalks.map(d => d.time));
const maxDistance = Math.max(...dogWalks.map(d => d.distance));

// Scale functions
function scaleX(time) {
  return padding + (time / maxTime) * (width - padding * 2);
}

function scaleY(distance) {
  return height - padding - (distance / maxDistance) * (height - padding * 2);
}

function scaleRadius(time) {
  return 6 + time * 0.4; // happiness
}

// marrks
dogWalks.forEach(walk => {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  circle.setAttribute("cx", scaleX(walk.time));
  circle.setAttribute("cy", scaleY(walk.distance));
  circle.setAttribute("r", scaleRadius(walk.time));
  circle.setAttribute("fill", "blue");
  circle.setAttribute("opacity", "0.7");

  svg.appendChild(circle);
});

const tickCount = 5;

// X-axis ticks (time)
for (let i = 0; i <= tickCount; i++) {
  const value = (maxTime / tickCount) * i;
  const x = scaleX(value);

  // Tick line
  const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tick.setAttribute("x1", x);
  tick.setAttribute("y1", 350);
  tick.setAttribute("x2", x);
  tick.setAttribute("y2", 355);
  tick.setAttribute("stroke", "black");

  // Tick label
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", x);
  label.setAttribute("y", 370);
  label.setAttribute("font-size", "10");
  label.setAttribute("text-anchor", "middle");
  label.textContent = Math.round(value);

  svg.appendChild(tick);
  svg.appendChild(label);
}

// Y-axis ticks (distance)
for (let i = 0; i <= tickCount; i++) {
  const value = (maxDistance / tickCount) * i;
  const y = scaleY(value);

  // Tick line
  const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
  tick.setAttribute("x1", 45);
  tick.setAttribute("y1", y);
  tick.setAttribute("x2", 50);
  tick.setAttribute("y2", y);
  tick.setAttribute("stroke", "black");

  // Tick label
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", 40);
  label.setAttribute("y", y + 3);
  label.setAttribute("font-size", "10");
  label.setAttribute("text-anchor", "end");
  label.textContent = Math.round(value);

  svg.appendChild(tick);
  svg.appendChild(label);
}

// --- DOG ART VISUALIZATION ---

const dogSvg = document.getElementById("dogArt");

// helper function
function createCircle(cx, cy, r, color) {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  c.setAttribute("cx", cx);
  c.setAttribute("cy", cy);
  c.setAttribute("r", r);
  c.setAttribute("fill", color);
  dogSvg.appendChild(c);
}

// body
createCircle(200, 170, 70, "#c49a6c");

// head
createCircle(200, 100, 50, "#c49a6c");

// ears
createCircle(160, 80, 25, "#8b5a2b");
createCircle(240, 80, 25, "#8b5a2b");

// eyes
createCircle(185, 95, 5, "black");
createCircle(215, 95, 5, "black");

// nose
createCircle(200, 115, 6, "black");

// tail
const tail = document.createElementNS("http://www.w3.org/2000/svg", "rect");
tail.setAttribute("x", 265);
tail.setAttribute("y", 150);
tail.setAttribute("width", 40);
tail.setAttribute("height", 10);
tail.setAttribute("fill", "#8b5a2b");
dogSvg.appendChild(tail);
