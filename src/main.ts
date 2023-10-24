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

const thinThickness = 3;
const mediumThickness = 6.5;
const thickThickness = 12;

let masterThickness = mediumThickness;
let masterRotation = 0;
const masterFontSize = 30;
let masterLineColor = getRandomColor();

const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");
const divvy = document.createElement("div");
const divvy2 = document.createElement("div");
const divvy3 = document.createElement("div");
const divvy4 = document.createElement("div");
const divvy5 = document.createElement("div");
app.append(divvy, divvy2, divvy3, divvy4, divvy5);

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
  { name: "exportButton", desc: "export image", func: exportToImage, div: divvy4 }

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

abstract class Command {
  abstract display(ctx: CanvasRenderingContext2D): void;
}

class DisplayContainer {
  list: Command[] = [];

  displayAll() {
    ctx.fillStyle = "white";
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvas.width, canvas.height);

    for (const lineOrSticker of this.list) {
      lineOrSticker.display(ctx);
    }
  }
}

class LineCommand extends Command {
  lines: { x: number; y: number }[] = [];
  thickness: number;
  color: string;

  constructor(x: number, y: number, color: string) {
    super();
    this.lines.push({ x, y });
    this.thickness = mediumThickness;
    this.color = color;
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
    ctx.strokeStyle = this.color;
    ctx.lineCap = "round";
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



// class StickerCursorCommand extends Command {

// }

abstract class CursorCommand extends Command {
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

class LineCursorCommand extends CursorCommand {
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
    ctx.fillStyle = masterLineColor;
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

canvas.addEventListener("wheel", (e) => {

  masterRotation += e.deltaY;
  canvas.dispatchEvent(toolMovedEvent);
});

class StickerCursorCommand extends CursorCommand {
  sticker: string;
  rotation: number;

  constructor(sticker: string) {
    super(zero, zero, false);
    this.sticker = sticker;
    canvas.classList.add("hideCursor");
    this.rotation = 0;
  }

  display(ctx: CanvasRenderingContext2D) {
    // This one is set immediately to the master rotation.
    ctx.fillStyle = "black";
    const ratio = 2;
    const degreesToRadiansDenominator = 180;
    ctx.save();
    ctx.translate(this.x + (masterFontSize / ratio), this.y + (masterFontSize / ratio));
    ctx.rotate((masterRotation * Math.PI) / degreesToRadiansDenominator);
    ctx.font = `${masterFontSize}px monospace`;
    ctx.fillText(this.sticker, zero - (masterFontSize / ratio), zero + (masterFontSize / ratio));
    ctx.restore();
  }
}

class StickerCommand extends Command {
  sticker: string;
  x: number;
  y: number;
  rotation: number;

  constructor(sticker: string, x: number, y: number) {
    super();
    this.sticker = sticker;
    this.x = x;
    this.y = y;
    this.rotation = 0;
  }

  display(ctx: CanvasRenderingContext2D) {
    // This one draws from its own font size, pre-set to the master.
    ctx.fillStyle = "black";
    const ratio = 2;
    const degreesToRadiansDenominator = 180;
    ctx.save();
    ctx.translate(this.x + (masterFontSize / ratio), this.y + (masterFontSize / ratio));
    ctx.rotate((this.rotation * Math.PI) / degreesToRadiansDenominator);
    ctx.font = `${masterFontSize}px monospace`;
    ctx.fillText(this.sticker, zero - (masterFontSize / ratio), zero + (masterFontSize / ratio));
    ctx.restore();
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
let line: LineCommand = new LineCommand(origin, origin, "black");
// Cursor is pretty much just an arbitrary data structure to store mouse state data.
let cursor: CursorCommand = new LineCursorCommand();

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

  if (cursor instanceof StickerCursorCommand) return;

  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  line = new LineCommand(cursor.x, cursor.y, masterLineColor);
  line.thickness = masterThickness;
  line.color = masterLineColor;

  linesAndStickers.list.push(line);
  undoRedoStack.list.length = 0;

  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mousemove", (e) => {
  cursor.x = e.offsetX;
  cursor.y = e.offsetY;

  if (cursor.active && cursor instanceof LineCursorCommand) {
    line.drag(cursor.x, cursor.y);

    // begin drawing process
    canvas.dispatchEvent(drawingChangedEvent);
  }

  canvas.dispatchEvent(toolMovedEvent);
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;

  if (cursor instanceof StickerCursorCommand) {
    const sticker = new StickerCommand(cursor.sticker, cursor.x, cursor.y);
    sticker.rotation = masterRotation;
    linesAndStickers.list.push(sticker);

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
    masterLineColor = getRandomColor();
    cursor = new LineCursorCommand();
  } else if (typeof thicknessOrText == "string") {
    cursor = new StickerCursorCommand(thicknessOrText);
  }

}

function addButton() {
  const textChosen = prompt("Enter a text/emoji value here:", "🤡");
  const buttonElement = document.createElement("button");
  buttonElement.addEventListener("click", () => setBrush(textChosen!));
  buttonElement.innerHTML = textChosen!;
  divvy5.append(buttonElement);
  cursor = new StickerCursorCommand(textChosen!);
}

function exportToImage() {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  const eCtx = exportCanvas.getContext("2d")!;
  const scaleTimesFour = 4;
  eCtx.scale(scaleTimesFour, scaleTimesFour);

  eCtx.fillStyle = "white";
  eCtx.fillRect(zero, zero, canvasSize, canvasSize);


  for (const command of linesAndStickers.list) {
    command.display(eCtx);
  }
  const exportDataUrl = exportCanvas.toDataURL("image/png");

  const downloadLink = document.createElement("a");
  downloadLink.href = exportDataUrl;
  downloadLink.download = "drawing.png";
  downloadLink.click();
}

function getRandomColor(): string {
  const possibleRGBCombinations = 16777215;
  const toHex = 16;
  return "#" + Math.floor(Math.random() * possibleRGBCombinations).toString(toHex);
}