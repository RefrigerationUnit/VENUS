// /js/about-modal.js
import { APP } from './config.js';

function setupAboutModal(){
  const header = document.getElementById('app-header');
  if (!header) return;

  // Find an element in the header whose text equals APP.name (e.g., "VENUS PROJECT")
  const targetText = (APP.name || '').trim().toUpperCase();
  let trigger = null;

  // Scan leaf elements for an exact text match
  const walker = document.createTreeWalker(header, NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.children.length === 0) {
      const t = (n.textContent || '').trim().toUpperCase();
      if (t === targetText) { trigger = n; break; }
    }
  }
  if (!trigger) return; // bail if not found

  // Make it look/behave clickable & accessible
  trigger.classList.add('about-trigger');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.title = 'About this Project';

  // Build the modal once and append to <body>
  const backdrop = document.createElement('div');
  backdrop.className = 'about-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = `
    <div class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="about-title">
      <div class="about-head">
        <h2 id="about-title">About this Project</h2>
        <button class="about-close" aria-label="Close">×</button>
      </div>
      <div class="about-body">
        This platform allows users to search for industrial sites in the US depending on their needs, whether it's to expand their manufacturing capacity to a new plant, a partially built one, or to build a completely new manufacturing plant from scratch.
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const dialog   = backdrop.querySelector('.about-dialog');
  const closeBtn = backdrop.querySelector('.about-close');

  function open(){
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    closeBtn.focus(); // simple focus target
    document.addEventListener('keydown', onKey);
  }
  function close(){
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKey);
    trigger.focus?.({ preventScroll: true });
  }
  function onKey(e){
    if (e.key === 'Escape') close();
  }

  // Open actions
  trigger.addEventListener('click', open);
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });

  // Close actions
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close(); // click outside the dialog
  });
  dialog.addEventListener('click', (e) => e.stopPropagation());
}

document.addEventListener('DOMContentLoaded', setupAboutModal);
