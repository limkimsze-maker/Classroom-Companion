/* Bundled on the main thread so ink-on may access the DOM canvas.
   Model inference remains inside the isolated worker. */
import { preprocessStrokes, isStrokeMeaningful } from 'ink-on/core';
globalThis.WhiteboardCoMERPreprocess = Object.freeze({ preprocessStrokes, isStrokeMeaningful });
