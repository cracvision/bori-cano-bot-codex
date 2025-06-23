import assert from 'assert';
import { readFile } from 'fs/promises';
import vm from 'vm';

const html = await readFile(new URL('../boriChatEN.html', import.meta.url), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/i);
const code = scriptMatch[1] + '\nmodule.exports = { sanitizeHTML, insertSanitizedHTML };';
const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'boriChatEN.html' });
const { sanitizeHTML, insertSanitizedHTML } = sandbox.module.exports;

const container = { innerHTML: '' };

insertSanitizedHTML(container, '<p><a href="https://example.com">link</a></p>');
assert.strictEqual(container.innerHTML, '<p><a href="https://example.com">link</a></p>');

insertSanitizedHTML(container, '<div><strong><a href="http://safe.com">safe</a></strong></div>');
assert.strictEqual(container.innerHTML, '<div><strong><a href="http://safe.com">safe</a></strong></div>');

insertSanitizedHTML(container, '<p><a href="javascript:alert(1)" onclick="evil()">bad</a></p>');
assert.strictEqual(container.innerHTML, '<p><a>bad</a></p>');

insertSanitizedHTML(container, '<div onclick="alert(1)">Hi<script>alert(1)</script></div>');
assert.strictEqual(container.innerHTML, '<div>Hi</div>');

console.log('sanitizeHTML tests passed');
