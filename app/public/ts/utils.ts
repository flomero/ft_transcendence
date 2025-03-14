export const hideById = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.hidden = true;
  }
};

export const showById = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.hidden = false;
  }
};

export function changeClasses(
  element: HTMLElement | null,
  classesToRemove: string[],
  classesToAdd: string[],
): void {
  if (!element) return;

  for (const cls of classesToRemove) element.classList.remove(cls);
  for (const cls of classesToAdd) element.classList.add(cls);
}

export function toggleClasses(
  element: HTMLElement | null,
  classes: string[],
): void {
  if (!element) return;

  for (const cls of classes) element.classList.toggle(cls);
}

export const innerTextById = (id: string, text: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.innerText = text;
  }
};

export const valueById = (id: string, text: string) => {
  const element = document.getElementById(id);
  if (element && element instanceof HTMLInputElement) {
    element.value = text;
  }
};

export const focusById = (id: string, atEnd?: boolean) => {
  const element = document.getElementById(id);
  if (element && element instanceof HTMLElement) {
    element.focus();
  }
};
