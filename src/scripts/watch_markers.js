import chokidar from "chokidar";
import { buildMarkers } from "./extract_markers.js";

console.log("Watching markers.xlsx...");

chokidar
    .watch("data/markers.xlsx")
    .on("change", () => {
        console.log("Spreadsheet changed");
        buildMarkers();
    });