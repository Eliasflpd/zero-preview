// Script injected into every generated app for visual editing
// Communicates with Zero Preview parent via postMessage

export const PREVIEW_EDIT_SCRIPT = `
<script>
(function() {
  let editMode = false;
  let highlighted = null;

  window.addEventListener('message', function(e) {
    if (e.data?.type === 'ENABLE_EDIT_MODE') editMode = true;
    if (e.data?.type === 'DISABLE_EDIT_MODE') {
      editMode = false;
      if (highlighted) { highlighted.style.outline = ''; highlighted = null; }
    }
  });

  document.addEventListener('mouseover', function(e) {
    if (!editMode) return;
    if (highlighted) highlighted.style.outline = '';
    highlighted = e.target;
    highlighted.style.outline = '2px solid #3B82F6';
    highlighted.style.outlineOffset = '2px';
    e.stopPropagation();
  }, true);

  document.addEventListener('click', function(e) {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    const rect = el.getBoundingClientRect();

    window.parent.postMessage({
      type: 'ELEMENT_CLICKED',
      data: {
        tagName: el.tagName,
        text: el.textContent?.slice(0, 200) || '',
        className: el.className || '',
        id: el.id || '',
        style: el.style.cssText || '',
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        path: getElementPath(el),
      }
    }, '*');
  }, true);

  function getElementPath(el) {
    const parts = [];
    while (el && el !== document.body) {
      let selector = el.tagName.toLowerCase();
      if (el.id) selector += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        selector += '.' + el.className.split(' ').slice(0, 2).join('.');
      }
      parts.unshift(selector);
      el = el.parentElement;
    }
    return parts.join(' > ');
  }
})();
</script>`;
