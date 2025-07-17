// lib/pdfLoader.js
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.cjs";

// Set the workerSrc manually
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

export default pdfjsLib;
