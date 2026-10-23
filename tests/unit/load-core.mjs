// js/core.js is a classic browser script that attaches PowerhouseCore to the global
// object. Importing it as a module runs the same code in Node, so coverage tools
// measure exactly the file the browser executes.
await import('../../js/core.js');

/** Returns the PowerhouseCore API exactly as the browser sees it. */
export function loadCore() {
  return globalThis.PowerhouseCore;
}

/** Converts values to plain JSON data for deep comparisons. */
export const plain = value => JSON.parse(JSON.stringify(value));
