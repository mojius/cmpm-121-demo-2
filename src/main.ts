import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Drawthingy";
const zero = 0;
const canvasSize = 256;

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const divvy = document.createElement("div");
app.append(divvy);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
ctx.canvas.width = 256;
ctx.canvas.height = 256;
canvas.classList.add("canvas");
divvy.append(canvas);
ctx.fillStyle = "white";
ctx.fillRect(zero, zero, canvasSize, canvasSize);

const drawingChangedEvent: Event = new Event("drawing-changed");

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
app.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
app.append(redoButton);

interface MousePoint {
  x: number;
  y: number;
}

// Make an array of array of mouse points.
let mousePointsArraySquared: MousePoint[][] = [];
let undoRedoStack: MousePoint[][] = [];

canvas.addEventListener("drawing-changed", () => {
  drawToCanvas();
});

// Cursor is pretty much just an arbitrary data structure to store mouse state data.
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  // Setting state and old position
  cursor.active = true;
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  mousePointsArraySquared.push([]);
  undoRedoStack = [];
  canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    const indexOffset = 1;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    const mousePoint: MousePoint = { x: cursor.x, y: cursor.y };
    // store the mouse point
    mousePointsArraySquared[mousePointsArraySquared.length - indexOffset].push(
      mousePoint
    );

    // begin drawing process
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

function drawToCanvas() {
  ctx.clearRect(zero, zero, canvas.width, canvas.height);
  ctx.fillRect(zero, zero, canvas.width, canvas.height);

  if (!mousePointsArraySquared) return;

  // foreach set of points in the mouse array
  for (const points of mousePointsArraySquared) {
    ctx.beginPath();
    const [first, ...rest]: MousePoint[] = points;
    if (first) ctx.moveTo(first.x, first.y);
    for (const { x, y } of rest) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

canvas.addEventListener("mouseup", () => {
  // resetting state
  cursor.active = false;
  // Update the stroke num in the list
});

clearButton.addEventListener("click", () => {
  undoRedoStack = [];
  mousePointsArraySquared = [];
  canvas.dispatchEvent(drawingChangedEvent);
});

undoButton.addEventListener("click", () => {
  if (mousePointsArraySquared.length) {
    const poppedLine = mousePointsArraySquared.pop()!;
    undoRedoStack.push(poppedLine);
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

redoButton.addEventListener("click", () => {
  if (undoRedoStack.length) {
    const pushedLine = undoRedoStack.pop()!;
    mousePointsArraySquared.push(pushedLine);
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

// Try to switch to single arrays of classes to mitigate shitty garbage collection?
// Push and pop
