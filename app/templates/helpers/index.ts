import Handlebars from "handlebars";
import { buttonVariants } from "./components/button";
import { twMerge } from "tailwind-merge";

export function registerHelpers(handlebars: typeof Handlebars) {
  handlebars.registerHelper("buttonVariants", buttonVariants);

  // Tailwind merge helper
  handlebars.registerHelper("twMerge", function (...args) {
    // Remove the Handlebars options object from the arguments
    const classes = args.slice(0, -1);
    return twMerge(...classes);
  });

  // Conditional helper that returns valueIfTrue when condition is truthy, otherwise empty string
  handlebars.registerHelper("when", function (condition, valueIfTrue) {
    return condition ? valueIfTrue : "";
  });

  // Add other helpers here as needed
}
