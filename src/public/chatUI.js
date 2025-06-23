export function renderMensaje(container, html) {
  if (!container) return;
  const sanitized = html.replace(/<script.*?>.*?<\/script>/gi, '');
  container.innerHTML = sanitized;
}

export function showTypingIndicator(indicator) {
  if (indicator) indicator.style.display = 'block';
}

export function hideTypingIndicator(indicator) {
  if (indicator) indicator.style.display = 'none';
}

export function attachAudioButton(button, callback) {
  if (button) {
    button.addEventListener('click', () => {
      if (callback) callback(button.dataset.text);
    });
  }
}

export function openEmailModal(modal) {
  if (modal) modal.style.display = 'block';
}

export function closeEmailModal(modal) {
  if (modal) modal.style.display = 'none';
}
