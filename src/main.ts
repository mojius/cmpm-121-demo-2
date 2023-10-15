import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Drawthingy";
const zero = 0;
const canvasSize = 256;


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