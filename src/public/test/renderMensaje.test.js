import assert from 'assert';
import { JSDOM } from 'jsdom';
import {
  renderMensaje,
  showTypingIndicator,
  hideTypingIndicator,
  attachAudioButton,
  openEmailModal,
  closeEmailModal,
} from '../chatUI.js';

const dom = new JSDOM(`<!DOCTYPE html><body>
<div id="container"></div>
<a id="link"></a>
<div id="typing" style="display:none"></div>
<button id="audio" data-text="hola"></button>
<div id="modal" style="display:none"></div>
</body>`);

const { document } = dom.window;

global.window = dom.window;

describe('chat UI', () => {
  it('renderMensaje sanitizes script tags and keeps links', () => {
    const container = document.getElementById('container');
    renderMensaje(container, '<p>hi</p><script>alert(1)</script><a href="/test">link</a>');
    assert.strictEqual(container.querySelectorAll('script').length, 0);
    const a = container.querySelector('a');
    assert.ok(a);
    assert.strictEqual(a.getAttribute('href'), '/test');
  });

  it('typing indicator toggles', () => {
    const t = document.getElementById('typing');
    showTypingIndicator(t);
    assert.strictEqual(t.style.display, 'block');
    hideTypingIndicator(t);
    assert.strictEqual(t.style.display, 'none');
  });

  it('audio button triggers callback with text', () => {
    const btn = document.getElementById('audio');
    let called = '';
    attachAudioButton(btn, text => {
      called = text;
    });
    btn.click();
    assert.strictEqual(called, 'hola');
  });

  it('email modal toggles visibility', () => {
    const m = document.getElementById('modal');
    openEmailModal(m);
    assert.strictEqual(m.style.display, 'block');
    closeEmailModal(m);
    assert.strictEqual(m.style.display, 'none');
  });
});

console.log('Public UI tests passed');
