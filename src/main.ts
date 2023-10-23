import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Drawthingy";
const zero = 0;
const canvasSize = 256;

//
//
// ELEMENTS
//
//

document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d")!;
ctx.canvas.width = 256;
ctx.canvas.height = 256;
canvas.classList.add("canvas");
app.append(canvas);
ctx.fillStyle = "white";
ctx.fillRect(zero, zero, canvasSize, canvasSize);

const thinThickness = 1;
const mediumThickness = 5;
const thickThickness = 10;

let masterThickness = mediumThickness;

const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");
const divvy = document.createElement("div");
const divvy2 = document.createElement("div");
const divvy3 = document.createElement("div");
const divvy4 = document.createElement("div");
app.append(divvy, divvy2, divvy3, divvy4);


const buttonList: Button[] = [
  { name: "clearButton", desc: "clear", func: clearCanvas, div: divvy },
  { name: "undoButton", desc: "undo", func: undoAction, div: divvy },
  { name: "redoButton", desc: "redo", func: redoAction, div: divvy },
  { name: "thinButton", desc: "thin", func: () => setBrush(thinThickness), div: divvy2 },
  { name: "mediumButton", desc: "med", func: () => setBrush(mediumThickness), div: divvy2 },
  { name: "thickButton", desc: "thick", func: () => setBrush(thickThickness), div: divvy2 },
  { name: "fireButton", desc: "🔥", func: () => setBrush("🔥"), div: divvy3 },
  { name: "starButton", desc: "⭐", func: () => setBrush("⭐"), div: divvy3 },
  { name: "zapButton", desc: "⚡", func: () => setBrush("⚡"), div: divvy3 },
  { name: "addButton", desc: "add text/emoji!", func: addButton, div: divvy4 },
  { name: "exportButton", desc: "export image", func: exportToImage, div: divvy4}

];

for (const button of buttonList) {
  const buttonElement = document.createElement("button");
  buttonElement.addEventListener("click", button.func.bind(this));
  buttonElement.innerHTML = button.desc;
  button.div.append(buttonElement);
}

//
//
// CLASSES
//
//

interface Button {
  name: string;
  desc: string;
  func(): void;
  div: HTMLDivElement;
}

abstract class DisplayCommand { 
  abstract display(ctx: CanvasRenderingContext2D): void;
}

class DisplayContainer {
  list: DisplayCommand[] = [];

  displayAll() {
    ctx.fillStyle = "white";
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvas.width, canvas.height);

    for (const lineOrSticker of this.list) {
      lineOrSticker.display(ctx);
    }
  }
}

class LineDisplayCommand extends DisplayCommand {
  lines: { x: number; y: number }[] = [];
  thickness: number;

  constructor(x: number, y: number) {
    super();
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



// class StickerCursorDisplayCommand extends DisplayCommand {

// }

abstract class CursorDisplayCommand extends DisplayCommand{
  x: number;
  y: number;
  active: boolean;

  constructor(x: number, y: number, active: boolean) {
    super();
    this.x = x;
    this.y = y;
    this.active = active;
  }
}

class LineCursorDisplayCommand extends CursorDisplayCommand {
  thickness: number;

  constructor() {
    super(zero, zero, false);
    this.thickness = mediumThickness;
    canvas.classList.remove("hideCursor");
  }

  display(ctx: CanvasRenderingContext2D) {
    this.thickness = masterThickness;
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

class StickerCursorDisplayCommand extends CursorDisplayCommand {
  sticker: string;

  constructor(sticker: string) {
    super(zero, zero, false);
    this.sticker = sticker;
    canvas.classList.add("hideCursor");
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    const fontSize = 30;
    const ratio = 2;
    ctx.font = `${fontSize}px serif`;
    ctx.fillText(this.sticker, this.x - (fontSize / ratio), this.y + (fontSize / ratio));
  }
}

class StickerDisplayCommand extends DisplayCommand {
  sticker: string;
  x: number;
  y: number;

  constructor(sticker: string, x: number, y: number) {
    super();
    this.sticker = sticker;
    this.x = x;
    this.y = y;
  }

  display(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    const fontSize = 30;
    const ratio = 2;
    ctx.font = `${fontSize}px serif`;
    ctx.fillText(this.sticker, this.x - (fontSize / ratio), this.y + (fontSize / ratio));
  }
  
}

//
//
// LOGIC
//
//

// Make an array of array of mouse points.
const linesAndStickers = new DisplayContainer();
const undoRedoStack = new DisplayContainer();


const origin = 0;
let line: LineDisplayCommand = new LineDisplayCommand(origin, origin);
// Cursor is pretty much just an arbitrary data structure to store mouse state data.
let cursor: CursorDisplayCommand = new LineCursorDisplayCommand();

//
//
// EVENTS
//
//

canvas.addEventListener("drawing-changed", () => {
  linesAndStickers.displayAll();
});

canvas.addEventListener("tool-moved", () => {
  linesAndStickers.displayAll();
  cursor.display(ctx);
});

canvas.addEventListener("mouseout", () => {
  linesAndStickers.displayAll();
});

canvas.addEventListener("mousedown", (e) => {
  // Setting state and position
  cursor.active = true;

  if (cursor instanceof StickerCursorDisplayCommand) return;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  line = new LineDisplayCommand(cursor.x, cursor.y);
  line.thickness = masterThickness;

  linesAndStickers.list.push(line);
  undoRedoStack.list.length = 0;

  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && cursor instanceof LineCursorDisplayCommand) {
    line.drag(cursor.x, cursor.y);

    // begin drawing process
    canvas.dispatchEvent(drawingChangedEvent);
  }

  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;

  if (cursor instanceof StickerCursorDisplayCommand) {
    linesAndStickers.list.push(new StickerDisplayCommand(cursor.sticker, cursor.x, cursor.y));
    canvas.dispatchEvent(toolMovedEvent);
  }
  
});

function clearCanvas() {
  linesAndStickers.list.length = 0;
  undoRedoStack.list.length = 0;
  canvas.dispatchEvent(drawingChangedEvent);
}

function undoAction() {
  if (linesAndStickers.list.length) {
    const poppedLine = linesAndStickers.list.pop();
    undoRedoStack.list.push(poppedLine!);
    canvas.dispatchEvent(drawingChangedEvent);
  }
}

function redoAction() {
  if (undoRedoStack.list.length) {
    const pushedLine = undoRedoStack.list.pop()!;
    linesAndStickers.list.push(pushedLine);
    canvas.dispatchEvent(drawingChangedEvent);
  }
}

function setBrush(thicknessOrText: number | string) {
  if (typeof thicknessOrText == "number") {
    masterThickness = thicknessOrText;
    cursor = new LineCursorDisplayCommand();
  } else if (typeof thicknessOrText == "string") {
    cursor = new StickerCursorDisplayCommand(thicknessOrText);
  }

}

function addButton() {
  const textChosen = prompt("Enter a text/emoji value here:", "🤡");
  const buttonElement = document.createElement("button");
  buttonElement.addEventListener("click", () => setBrush(textChosen!));
  buttonElement.innerHTML = textChosen!;
  divvy4.append(buttonElement);
}

function exportToImage () {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const eCtx = exportCanvas.getContext("2d")!;
  const scaleTimesFour = 4;
  eCtx.scale(scaleTimesFour, scaleTimesFour);

  for (const command of linesAndStickers.list) {
    command.display(eCtx);
  }
  const exportDataUrl = exportCanvas.toDataURL("image/png");

  const downloadLink = document.createElement("a");
  downloadLink.href = exportDataUrl;
  downloadLink.download = "drawing.png";
  downloadLink.click();
}