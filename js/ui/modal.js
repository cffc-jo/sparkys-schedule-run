// Accessible modal: traps focus, closes on Esc, restores focus to whatever opened it.
const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function createModal(el, { onChange = () => {} } = {}) {
  let opener = null;

  const focusables = () => [...el.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);

  function onKeyDown(e) {
    if (el.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open() {
    if (!el.hidden) return;
    opener = document.activeElement;
    el.hidden = false;
    document.addEventListener('keydown', onKeyDown, true);
    const body = el.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
    (focusables()[0] || el).focus();
    onChange(true);
  }

  function close() {
    if (el.hidden) return;
    el.hidden = true;
    document.removeEventListener('keydown', onKeyDown, true);
    if (opener && document.contains(opener) && opener.offsetParent !== null) opener.focus();
    opener = null;
    onChange(false);
  }

  return {
    open,
    close,
    get isOpen() { return !el.hidden; },
  };
}
