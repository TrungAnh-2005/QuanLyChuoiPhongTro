import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterManagedProperties } from './property.rules.js';

const properties = [
  { code: 'CREATED', createdBy: 'Lan' },
  { code: 'MANAGED', managerUsername: 'LAN' },
  { code: 'ASSIGNED' },
  { code: 'OTHER', createdBy: 'Minh' },
];

test('staff see properties they created, manage or are assigned to', () => {
  const visible = filterManagedProperties(properties, { username: 'lan', houseCode: 'ASSIGNED' });
  assert.deepEqual(visible.map(property => property.code), ['CREATED', 'MANAGED', 'ASSIGNED']);
  assert.deepEqual(filterManagedProperties(properties, {}), []);
});

test('test mode sees all supplied properties while normal staff see an empty absent list', () => {
  assert.deepEqual(filterManagedProperties(properties, { isTestMode: true }), properties);
  assert.deepEqual(filterManagedProperties(null, { username: 'lan' }), []);
});
