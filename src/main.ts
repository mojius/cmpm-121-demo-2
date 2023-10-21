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

const thinThickness = 1;
const mediumThickness = 5;
const thickThickness = 10;

let masterThickness = mediumThickness;

const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
app.append(undoButton);

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
app.append(redoButton);

const divvy2 = document.createElement("div");
app.append(divvy2);

const thinButton = document.createElement("button");
thinButton.innerHTML = "thin";
divvy2.append(thinButton);

const mediumButton = document.createElement("button");
mediumButton.innerHTML = "medium";
divvy2.append(mediumButton);

const thickButton = document.createElement("button");
thickButton.innerHTML = "thick";
divvy2.append(thickButton);

const divvy3 = document.createElement("div");
app.append(divvy3);

class LineContainer {
  list: MarkerLine[] = [];

  displayAllLines() {
    ctx.fillStyle = "white";
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvas.width, canvas.height);

    for (const aLine of mouseLines.list) {
      aLine.display(ctx);
    }
  }
}

// MarkerLine is our command class.
class MarkerLine {
  lines: { x: number; y: number }[] = [];
  thickness: number;

  constructor(x: number, y: number) {
    this.lines.push({ x, y });
    this.thickness = mediumThickness;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = this.thickness;
    ctx.beginPath();
    const [first, ...rest]: {
      x: number;
      y: number;
    }[] = this.lines;
    if (first) ctx.moveTo(first.x, first.y);
    for (const { x, y } of rest) {
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // When drag is called, you push to your line and call a drawingChanged event.
  drag(x: number, y: number) {
    this.lines.push({ x, y });
    canvas.dispatchEvent(drawingChangedEvent);
  }

  setThickness() {
    this.thickness = masterThickness;
  }
}

class CursorData {
  active: boolean;
  thickness: number;
  x: number;
  y: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.active = false;
    this.thickness = mediumThickness;
  }

  display(ctx: CanvasRenderingContext2D) {
    cursor.thickness = masterThickness;
    const circleStart = 0;
    const circleEnd = 360;
    const reductionRatio = 2;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(
      this.x,
      this.y,
      this.thickness / reductionRatio,
      circleStart,
      circleEnd
    );
    ctx.fill();
  }
}

// Make an array of array of mouse points.
const mouseLines = new LineContainer();
const undoRedoStack = new LineContainer();

const origin = 0;
let line: MarkerLine = new MarkerLine(origin, origin);
// Cursor is pretty much just an arbitrary data structure to store mouse state data.
const cursor = new CursorData();

canvas.addEventListener("drawing-changed", () => {
  mouseLines.displayAllLines();
});

canvas.addEventListener("tool-moved", () => {
  mouseLines.displayAllLines();
  cursor.display(ctx);
});

canvas.addEventListener("mouseout", () => {
  mouseLines.displayAllLines();
});

canvas.addEventListener("mousedown", (e) => {
  // Setting state and old position
  cursor.active = true;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  line = new MarkerLine(cursor.x, cursor.y);
  line.thickness = masterThickness;

  mouseLines.list.push(line);
  undoRedoStack.list.length = 0;

  canvas.dispatchEvent(toolMovedEvent);

  canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active) {
    line.drag(cursor.x, cursor.y);

    // begin drawing process
    canvas.dispatchEvent(drawingChangedEvent);
  }

  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mouseup", () => {
  // resetting state
  cursor.active = false;
});

clearButton.addEventListener("click", () => {
  mouseLines.list.length = 0;
  undoRedoStack.list.length = 0;
  canvas.dispatchEvent(drawingChangedEvent);
});

undoButton.addEventListener("click", () => {
  if (mouseLines.list.length) {
    const poppedLine = mouseLines.list.pop();
    undoRedoStack.list.push(poppedLine!);
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

redoButton.addEventListener("click", () => {
  if (undoRedoStack.list.length) {
    const pushedLine = undoRedoStack.list.pop()!;
    mouseLines.list.push(pushedLine);
    canvas.dispatchEvent(drawingChangedEvent);
  }
});

thinButton.addEventListener("click", () => {
  if (line) {
    masterThickness = thinThickness;
  }
});

mediumButton.addEventListener("click", () => {
  if (line) {
    masterThickness = mediumThickness;
  }
});

thickButton.addEventListener("click", () => {
  if (line) {
    masterThickness = thickThickness;
  }
});

// Try to switch to single arrays of classes to mitigate shitty garbage collection?
// Push and pop

// Your dispatchEvent (drawing changed) should just be a function now going through all of the lines.
// You can have a line container for your regular lines, and a line container for your undoRedoStack.

// Inside each line
