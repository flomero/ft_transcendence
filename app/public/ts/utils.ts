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
