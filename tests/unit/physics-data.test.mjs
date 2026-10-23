import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { validatePhysicsData } from '../../scripts/validate-physics-data.mjs';

const fresh = () => JSON.parse(readFileSync(new URL('../../physics-intelligence/assets/physics-intelligence-data.json', import.meta.url), 'utf8'));

describe('Physics Intelligence dataset', () => {
  test('the published dataset is internally consistent', () => {
    assert.deepEqual(validatePhysicsData(fresh()), []);
  });

  test('a changed per-year count is caught', () => {
    const data = fresh();
    const row = data.byYear[5];
    const unit = Object.keys(row.units)[0];
    row.units[unit].count += 1;
    const errors = validatePhysicsData(data);
    assert.ok(errors.some(e => e.includes(`${row.year}: unit counts sum`)));
    assert.ok(errors.some(e => e.includes(`unit ${unit}: combinedCount`)));
  });

  test('a question assigned to two families is caught', () => {
    const data = fresh();
    data.currentFamilies[1].questionReferences.push(data.currentFamilies[0].questionReferences[0]);
    data.currentFamilies[1].recurrenceCount += 1;
    assert.ok(validatePhysicsData(data).some(e => e.includes('appears in both')));
  });

  test('question or answer content is rejected', () => {
    const data = fresh();
    data.currentFamilies[0].answerKey = 'C';
    assert.ok(validatePhysicsData(data).some(e => e.includes('not allowed in the published dataset')));
  });

  test('the dataset may never be reinterpreted as a prediction', () => {
    const data = fresh();
    data.release.predictiveInterpretation = 'allowed';
    assert.ok(validatePhysicsData(data).some(e => e.includes('prohibited')));
  });
});
