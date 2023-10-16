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

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

ctx.fillStyle = "white";
ctx.fillRect(zero, zero, canvasSize, canvasSize);


// Cursor is pretty much just an arbitrary data structure to store mouse state data.
const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (e) => {
// Setting state and old position
cursor.active = true;
cursor.x = e.offsetX;
cursor.y = e.offsetY;
});

canvas.addEventListener("mousemove", (e) => {
if (cursor.active) {
    ctx.beginPath();
    // moveTo() starts the origin of a new subpath
    ctx.moveTo(cursor.x, cursor.y);
    // lineTo() takes the old position as a starting point and draws a line to the new position.
    ctx.lineTo(e.offsetX, e.offsetY);
    // stroke() fills that li'l line path we just made with virtual ink.
    ctx.stroke();
    cursor.x = e.offsetX;
    cursor.y = e.offsetY;
}
});

canvas.addEventListener("mouseup", () => {
// resetting state
cursor.active = false;
});



// Clears the rendering context.
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillRect(zero, zero, canvasSize, canvasSize);
});