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

  handlebars.registerHelper("wheneq", (a, b, valueIfTrue) =>
    a === b ? valueIfTrue : "",
  );

  handlebars.registerHelper(
    "ifeq",
    function (
      this: unknown,
      a: string,
      b: string,
      options: Handlebars.HelperOptions,
    ) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
  );

  handlebars.registerHelper("times", (n, block) => {
    let blocks = "";
    for (let i = 0; i < n; ++i) blocks += block.fn(i);
    return blocks;
  });

  handlebars.registerHelper("multiply", (a, b) => a * b);

  handlebars.registerHelper("add", (a, b) => a + b);

  handlebars.registerHelper("isEven", (value) => value % 2 === 0);

  handlebars.registerHelper("not", (value) => !value);

  handlebars.registerHelper("eq", (a, b) => a === b);

  handlebars.registerHelper("hrGameModeName", (value) =>
    !value
      ? value
      : String(value)
          .split(/(?=[A-Z])/)
          .join(" ")
          .replace(/^\w/, (c) => c.toUpperCase()),
  );

  handlebars.registerHelper("inc", (value) => Number.parseInt(value, 10) + 1);

  handlebars.registerHelper(
    "formatDate",
    (date: Date | string, dateFormat: string) => {
      if (!date) return "";

      const event = new Date(date);
      const options = {
        hourCycle: "h12",
        dayPeriod: "long",
        day: "numeric",
        month: "long",
        hour: "numeric",
        timeZone: "Europe/Berlin",
      } as Intl.DateTimeFormatOptions;

      return event.toLocaleString("en-EN", options);
    },
  );

  handlebars.registerHelper("length", (value) => {
    if (Array.isArray(value) || typeof value === "string") {
      return value.length;
    }
    return 0;
  });

  handlebars.registerHelper("dec", (value) => {
    if (typeof value === "number") {
      return value - 1;
    }
    return value;
  });

  handlebars.registerHelper("lt", (a, b) => {
    return a < b;
  });

  handlebars.registerHelper("json", (v) => JSON.stringify(v));

  handlebars.registerHelper("concat", (...args) => {
    const strings = args.slice(0, -1).map(String);
    return strings.join("");
  });

  handlebars.registerHelper("get", (obj, path, prop) => {
    if (!obj) return "";
    if (Array.isArray(obj) && path !== undefined) {
      const item = obj[parseInt(path, 10)];
      return prop ? item?.[prop] : item;
    }
    return obj[path];
  });

  // Add other helpers here as needed
}
