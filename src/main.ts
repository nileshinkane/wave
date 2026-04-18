import "./app/app.css";
import { startWaveApp } from "./app/startWaveApp";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found.");
}

startWaveApp(app);
