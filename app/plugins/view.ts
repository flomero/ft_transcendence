import fp from "fastify-plugin";
import view from "@fastify/view";
import { join } from "path";
import handlebars from "handlebars";
import { registerHelpers } from "../templates/helpers";
import { readdirSync, statSync } from "fs";
import { relative } from "path";

const componentsDir = join(__dirname, "..", "..", "templates", "components");
const components: Record<string, string> = {};

// Helper function to recursively scan directories
function scanComponentsDir(directory: string) {
  const files = readdirSync(directory);
  files.forEach((file) => {
    const fullPath = join(directory, file);
    const isDirectory = statSync(fullPath).isDirectory();

    if (isDirectory) {
      scanComponentsDir(fullPath); // Recursively scan subdirectories
    } else if (file.endsWith(".hbs")) {
      // Get path relative to components directory
      const relativePath = relative(componentsDir, fullPath);
      // Create component name without extension and with forward slashes
      const componentName = relativePath
        .replace(/\.hbs$/, "")
        .replace(/\\/g, "/");
      // Create component path relative to templates directory
      const componentPath = `/components/${relativePath.replace(/\\/g, "/")}`;

      components[`components/${componentName}`] = componentPath;
    }
  });
}

// Start the recursive scan
scanComponentsDir(componentsDir);

/**
 * This plugin adds template rendering support using Handlebars
 *
 * @see https://github.com/fastify/point-of-view
 */
export default fp(async (fastify) => {
  fastify.register(view, {
    engine: {
      handlebars: handlebars,
    },
    root: join(__dirname, "..", "..", "templates"),
    layout: "/layouts/main.hbs",
    viewExt: "hbs",
    options: {
      partials: {
        header: "/partials/header.hbs",
        footer: "/partials/footer.hbs",
        head: "/partials/head.hbs",
        ...components,
      },
    },
  });
});

registerHelpers(handlebars);
