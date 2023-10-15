import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "My game";



document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);
app.append(document.createElement("h2").textContent = "hello hello! :3");