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

class LineContainer {
  list: MarkerLine[] = [];

  displayAllLines() {
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

  constructor(x: number, y: number) {
    this.lines.push({ x, y });
  }

  // display takes care of all the drawing of the INDIVIDUAL line.
  display(ctx: CanvasRenderingContext2D) {
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
}

// Make an array of array of mouse points.
const mouseLines = new LineContainer();
const undoRedoStack = new LineContainer();

let line: MarkerLine;

canvas.addEventListener("drawing-changed", () => {
  mouseLines.displayAllLines();
});

// Cursor is pretty much just an arbitrary data structure to store mouse state data.
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
  // Setting state and old position
  cursor.active = true;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  line = new MarkerLine(cursor.x, cursor.y);

  mouseLines.list.push(line);
  undoRedoStack.list.length = 0;

  canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    line.drag(cursor.x, cursor.y);

    // begin drawing process
    canvas.dispatchEvent(drawingChangedEvent);
  }
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

// Try to switch to single arrays of classes to mitigate shitty garbage collection?
// Push and pop

// Your dispatchEvent (drawing changed) should just be a function now going through all of the lines.
// You can have a line container for your regular lines, and a line container for your undoRedoStack.

// Inside each line
