import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/** Loads js/core.js exactly as the browser does (a classic script) and returns PowerhouseCore. */
export function loadCore() {
  const source = readFileSync(new URL('../../js/core.js', import.meta.url), 'utf8');
  const sandbox = { crypto: globalThis.crypto, Intl, Date, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'js/core.js' });
  // Round-trip through JSON-free structuredClone is unnecessary: return the live API.
  return sandbox.PowerhouseCore;
}

/** Deep-compares values created in the VM realm with values from this realm. */
export const plain = value => JSON.parse(JSON.stringify(value));
