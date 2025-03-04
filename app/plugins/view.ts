import fp from "fastify-plugin";
import view from "@fastify/view";
import { join } from "path";
import handlebars from "handlebars";
import { registerHelpers } from "../templates/helpers";
import { readdirSync } from "fs";

const componentsDir = join(__dirname, "..", "..", "templates", "components");
const componentFiles = readdirSync(componentsDir);
const components: Record<string, string> = {};

componentFiles.forEach((file) => {
  if (file.endsWith(".hbs")) {
    const componentName = file.replace(".hbs", "");
    components[`components/${componentName}`] = `/components/${file}`;
  }
});

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
        "chat/message": "/partials/chat/message.hbs",
        ...components,
      },
    },
  });
});

registerHelpers(handlebars);
