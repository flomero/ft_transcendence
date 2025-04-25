export const hideById = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.hidden = true;
  }
};
export const showById = (id) => {
  const element = document.getElementById(id);
  if (element) {
    element.hidden = false;
  }
};
export function changeClasses(element, classesToRemove, classesToAdd) {
  if (!element) return;
  for (const cls of classesToRemove) element.classList.remove(cls);
  for (const cls of classesToAdd) element.classList.add(cls);
}
export function toggleClasses(element, classes) {
  if (!element) return;
  for (const cls of classes) element.classList.toggle(cls);
}
export const innerTextById = (id, text) => {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = text;
  }
};
export const valueById = (id, text) => {
  const element = document.getElementById(id);
  if (element && element instanceof HTMLInputElement) {
    element.value = text;
  }
};
export const focusById = (id, atEnd) => {
  const element = document.getElementById(id);
  if (element && element instanceof HTMLElement) {
    element.focus();
  }
};
//# sourceMappingURL=utils.js.map
