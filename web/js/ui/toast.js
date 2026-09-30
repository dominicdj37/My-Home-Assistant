const DISPLAY_MS = 2000;

let hideTimer;

/** Shows a short message at the bottom of the screen. */
export function showToast(message, { error = false } = {}) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.toggle("toast--error", error);
  toast.classList.add("toast--visible");

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toast.classList.remove("toast--visible"), DISPLAY_MS);
}
