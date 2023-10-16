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

interface MousePoints{
    x: number
    y: number
}

// Make an array of array of mouse points.
const mousePointsArraySquared: MousePoints[][] = [];
let undoRedoStack: MousePoints[][] = [];

// Cursor is pretty much just an arbitrary data structure to store mouse state data.
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
    // Setting state and old position
    cursor.active = true;
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;

    mousePointsArraySquared.push([]);
    canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("mousemove", (e) => {
if (cursor.active) {
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
    const mousePoint: MousePoints = { x: cursor.x, y: cursor.y };
    // store the mouse point
    mousePointsArraySquared[mousePointsArraySquared.length - 1].push(mousePoint);

    // begin drawing process
    dispatchEvent(drawingChangedEvent);

}
});

function drawToCanvas() {
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvas.width, canvas.height);

    const one = 1;
    console.log(mousePointsArraySquared);

    // foreach set of points in the mouse array
    for (let i = zero; i < mousePointsArraySquared.length; i++) {
        for (let j = zero; j < mousePointsArraySquared[i].length; j++) {
            if (j == zero) {
                ctx.moveTo(mousePointsArraySquared[i][j].x, mousePointsArraySquared[i][j].y);
            } else if (j == mousePointsArraySquared[i].length - one) {
                ctx.lineTo(mousePointsArraySquared[i][j].x, mousePointsArraySquared[i][j].y);
                ctx.stroke();
            } else {
                ctx.lineTo(mousePointsArraySquared[i][j].x, mousePointsArraySquared[i][j].y);
            }
        }
    }
    // iterate through and draw them all
}

canvas.addEventListener("mouseup", () => {
    // resetting state
    cursor.active = false;
    // Update the stroke num in the list

    console.log(mousePointsArraySquared);
    canvas.dispatchEvent(drawingChangedEvent);
});


clearButton.addEventListener("click", () => {
    ctx.clearRect(zero, zero, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvasSize, canvasSize);
    undoRedoStack = [];
    mousePointsArraySquared.length = 0;
});

undoButton.addEventListener("click", () => {
    if (mousePointsArraySquared.length > zero) {
        undoRedoStack.push(mousePointsArraySquared.pop()!); 
        canvas.dispatchEvent(drawingChangedEvent);
        console.log(mousePointsArraySquared);
    }

});

redoButton.addEventListener("click", () => {
    if (undoRedoStack.length > zero) {
        mousePointsArraySquared.push(undoRedoStack.pop()!);
        canvas.dispatchEvent(drawingChangedEvent);
        console.log(mousePointsArraySquared);
    }
});

canvas.addEventListener("drawing-changed", () => {
    drawToCanvas();
});

