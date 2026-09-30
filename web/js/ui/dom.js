/**
 * Tiny element factory: h("button", { class: "btn", onclick }, "Label").
 * Props starting with "on" become event listeners; others become attributes
 * (false/null/undefined skip the attribute).
 */
export function h(tag, props = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2), value);
    } else if (value !== false && value != null) {
      element.setAttribute(key, value === true ? "" : String(value));
    }
  }

  element.append(...present(children));
  return element;
}

/** Replaces all children of `container` with `nodes` (null/false skipped). */
export function mount(container, ...nodes) {
  container.replaceChildren(...present(nodes));
}

function present(nodes) {
  return nodes.flat().filter((node) => node != null && node !== false);
}
