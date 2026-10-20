// Node runner for the same tests as tests/run.html:  npm test  (or: node tests/run.js)
import { tests } from './tests.js';

let pass = 0;
for (const t of tests) {
  try {
    await t.fn();
    pass++;
    console.log(`  ✔ ${t.name}`);
  } catch (err) {
    console.log(`  ✘ ${t.name}\n      ${err.message}`);
  }
}
console.log(`\n${pass} / ${tests.length} passed`);
process.exit(pass === tests.length ? 0 : 1);
