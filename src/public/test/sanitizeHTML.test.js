import assert from 'assert';
import { readFile } from 'fs/promises';
import vm from 'vm';

const html = await readFile(new URL('../boriChatEN.html', import.meta.url), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
const code = scriptMatch[1] + '\nmodule.exports = { sanitizeHTML };';
const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'boriChatEN.html' });
const { sanitizeHTML } = sandbox.module.exports;

// Safe link should remain intact
assert.strictEqual(
  sanitizeHTML('<p><a href="https://example.com">link</a></p>'),
  '<p><a href="https://example.com">link</a></p>'
);

// Nested anchor should be preserved
assert.strictEqual(
  sanitizeHTML('<div><strong><a href="http://safe.com">safe</a></strong></div>'),
  '<div><strong><a href="http://safe.com">safe</a></strong></div>'
);

// Malicious href should have attribute stripped
assert.strictEqual(
  sanitizeHTML('<p><a href="javascript:alert(1)">bad</a></p>'),
  '<p><a>bad</a></p>'
);

console.log('sanitizeHTML tests passed');
