import fp from "fastify-plugin";
import view from "@fastify/view";
import handlebars from "handlebars";
import { registerHelpers } from "../templates/helpers";
import { readdirSync, statSync } from "node:fs";
import { relative, join } from "node:path";

const templatesDir = join(__dirname, "..", "..", "templates");
const partials: Record<string, string> = {};

function scanTemplatesDir(directory: string) {
  const files = readdirSync(directory);
  for (const file of files) {
    const fullPath = join(directory, file);
    const isDirectory = statSync(fullPath).isDirectory();

    if (isDirectory) {
      scanTemplatesDir(fullPath);
    } else if (file.endsWith(".hbs")) {
      if (fullPath.includes("/layouts/")) {
        continue;
      }

      const relativePath = relative(templatesDir, fullPath);
      const partialName = relativePath
        .replace(/\.hbs$/, "")
        .replace(/\\/g, "/");
      const partialPath = `/${relativePath.replace(/\\/g, "/")}`;

      partials[partialName] = partialPath;
    }
  }
}

scanTemplatesDir(templatesDir);

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
    root: templatesDir,
    viewExt: "hbs",
    options: {
      useDataVariables: true,
      partials: {
        ...partials,
      },
    },
  });
});

registerHelpers(handlebars);
