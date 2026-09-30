// Inline SVG icons (stroke-based, 24×24). Static markup only — never pass
// user data through here.
const PATHS = {
  power: '<path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/>',
  bolt: '<path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8"/><path d="M18.5 14.2a6.5 6.5 0 0 1 3 5.8"/>',
  logout: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l-5-5 5-5"/><path d="M5 12h11"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.5 12.5a9.5 9.5 0 0 1 13 0"/><path d="M8.7 16a5 5 0 0 1 6.6 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  alert: '<path d="M12 8v5"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/><path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  google: '<path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1a6 6 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" fill="#34A853" stroke="none"/><path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z" fill="#FBBC05" stroke="none"/><path d="M12 6c1.5 0 2.8.5 3.9 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6A6 6 0 0 1 12 6z" fill="#EA4335" stroke="none"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};

/** Returns an <svg> element for `name`, sized by CSS (1em by default). */
export function icon(name, className = "icon") {
  const template = document.createElement("template");
  template.innerHTML =
    `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] ?? ""}</svg>`;
  return template.content.firstElementChild;
}

/** Animated fan illustration: blades spin at the speed set by --spin-duration. */
export function fanGraphic() {
  const template = document.createElement("template");
  template.innerHTML = `
    <div class="fan-graphic" aria-hidden="true">
      <div class="fan-graphic__glow"></div>
      <svg class="fan-graphic__ring" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="56" fill="none" stroke="url(#fanRing)" stroke-width="1.5" stroke-dasharray="3 6"/>
        <defs>
          <linearGradient id="fanRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#8b7bff"/><stop offset="1" stop-color="#22d3ee"/>
          </linearGradient>
          <linearGradient id="fanBlade" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#b9adff"/><stop offset="1" stop-color="#5eead4"/>
          </linearGradient>
        </defs>
      </svg>
      <svg class="fan-graphic__blades" viewBox="-60 -60 120 120">
        <g fill="url(#fanBlade)" opacity="0.92">
          <path d="M0-9C-4-26-14-42-30-47c10 12 14 26 18 38z"/>
          <path d="M0-9C-4-26-14-42-30-47c10 12 14 26 18 38z" transform="rotate(120)"/>
          <path d="M0-9C-4-26-14-42-30-47c10 12 14 26 18 38z" transform="rotate(240)"/>
        </g>
        <circle r="10" fill="#0b0f1a" stroke="url(#fanBlade)" stroke-width="2"/>
        <circle r="3" fill="#e0dcff"/>
      </svg>
    </div>`;
  return template.content.firstElementChild;
}
