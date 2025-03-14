import type Handlebars from "handlebars";
import { buttonVariants } from "./components/button";
import { twMerge } from "tailwind-merge";

export function registerHelpers(handlebars: typeof Handlebars) {
  handlebars.registerHelper("buttonVariants", buttonVariants);

  // Tailwind merge helper
  handlebars.registerHelper("twMerge", (...args) => {
    // Remove the Handlebars options object from the arguments
    const classes = args.slice(0, -1);
    return twMerge(...classes);
  });

  // Conditional helper that returns valueIfTrue when condition is truthy, otherwise empty string
  handlebars.registerHelper("when", (condition, valueIfTrue) =>
    condition ? valueIfTrue : "",
  );

  handlebars.registerHelper("times", (n, block) => {
    let blocks = "";
    for (let i = 0; i < n; ++i) blocks += block.fn(i);
    return blocks;
  });

  handlebars.registerHelper("multiply", (a, b) => a * b);

  handlebars.registerHelper("add", (a, b) => a + b);

  handlebars.registerHelper("isEven", (value) => value % 2 === 0);

  // Add other helpers here as needed
}
