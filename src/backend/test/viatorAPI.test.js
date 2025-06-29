import { test } from 'node:test';
import assert from 'assert/strict';
import { readFile } from 'fs/promises';
import vm from 'vm';

let code = await readFile(new URL('../viatorAPI.jsw', import.meta.url), 'utf8');
code = code.replace(/import\s+\{[^}]+\}\s+from\s+'wix-fetch';?\n/, '')
           .replace(/import\s+\{[^}]+\}\s+from\s+'wix-secrets-backend';?\n/, '')
           .replace(/export\s+(async\s+function)/g, '$1')
           .replace(/export\s+function/g, 'function');
code = `let fetch; let getSecret;\nfunction __setTestDependencies({ fetch: f, getSecret: gs } = {}) { if (f) fetch = f; if (gs) getSecret = gs; viatorApiKey = undefined; viatorEnv = undefined; }\n` + code;
code += '\nmodule.exports = { __setTestDependencies, getViatorProductDetails, getModifiedProducts, getBookingsStatus, getExchangeRates, getBulkLocations, createBooking };';
const sandbox = { module: { exports: {} }, exports: {} };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'viatorAPI.jsw' });
const { __setTestDependencies, getViatorProductDetails, getModifiedProducts, getBookingsStatus, getExchangeRates, getBulkLocations, createBooking } = sandbox.module.exports;

function createMocks() {
  const calls = [];
  const mockFetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({}),
      text: async () => '{}' // used by viatorFetch in tests
    };
  };
  const mockGetSecret = async (name) => {
    if (name === 'viatorApiKey') return 'KEY';
    if (name === 'viatorEnv') return 'sandbox';
    return '';
  };
  __setTestDependencies({ fetch: mockFetch, getSecret: mockGetSecret });
  return calls;
}

test('getModifiedProducts uses correct endpoint and headers', async () => {
  const calls = createMocks();
  await getModifiedProducts('2024-01-01T00:00:00Z');
  assert.strictEqual(calls.length, 1);
  const { url, options } = calls[0];
  assert.strictEqual(
    url,
    'https://api.sandbox.viator.com/partner/products/modified-since?modifiedSince=2024-01-01T00%3A00%3A00Z'
  );
  assert.strictEqual(options.headers['exp-api-key'], 'KEY');
  assert.strictEqual(options.headers['Accept-Language'], 'es-PR');
  assert.strictEqual(options.headers['Accept'], 'application/json;version=2.0');
});

test('getBookingsStatus uses correct endpoint and headers', async () => {
  const calls = createMocks();
  await getBookingsStatus('2024-01-02T00:00:00Z');
  const { url, options } = calls[0];
  assert.strictEqual(
    url,
    'https://api.sandbox.viator.com/partner/bookings/status?lastUpdated=2024-01-02T00%3A00%3A00Z'
  );
  assert.strictEqual(options.headers['exp-api-key'], 'KEY');
});

test('getExchangeRates uses correct endpoint', async () => {
  const calls = createMocks();
  await getExchangeRates();
  const { url } = calls[0];
  assert.strictEqual(url, 'https://api.sandbox.viator.com/partner/exchange-rates');
});

test('getBulkLocations uses correct endpoint', async () => {
  const calls = createMocks();
  await getBulkLocations();
  const { url } = calls[0];
  assert.strictEqual(url, 'https://api.sandbox.viator.com/partner/locations/bulk');
});

test('getViatorProductDetails posts to bulk endpoint', async () => {
  const calls = createMocks();
  await getViatorProductDetails(['p1', 'p2']);
  const { url, options } = calls[0];
  assert.strictEqual(url, 'https://api.sandbox.viator.com/partner/products/bulk');
  assert.strictEqual(options.method, 'POST');
  assert.strictEqual(options.headers['exp-api-key'], 'KEY');
  assert.strictEqual(options.headers['Accept-Language'], 'es-PR');
  assert.strictEqual(options.headers['Accept'], 'application/json;version=2.0');
  assert.strictEqual(options.headers['Content-Type'], 'application/json');
  assert.strictEqual(JSON.parse(options.body).productCodes.length, 2);
});

test('createBooking posts to bookings/create', async () => {
  const calls = createMocks();
  await createBooking({ productCode: 'p1', travelDate: '2024-01-01' });
  const { url, options } = calls[0];
  assert.strictEqual(url, 'https://api.sandbox.viator.com/partner/bookings/create');
  assert.strictEqual(options.method, 'POST');
  assert.strictEqual(options.headers['Content-Type'], 'application/json');
  assert.strictEqual(JSON.parse(options.body).productCode, 'p1');
});
