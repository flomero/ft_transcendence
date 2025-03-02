import fp from 'fastify-plugin'
import view from '@fastify/view'
import { join } from 'path'
import handlebars from 'handlebars'

/**
 * This plugin adds template rendering support using Handlebars
 * 
 * @see https://github.com/fastify/point-of-view
 */
export default fp(async (fastify) => {
    fastify.register(view, {
        engine: {
            handlebars: handlebars
        },
        root: join(__dirname, "..", "..", "views"),
        layout: 'layouts/main.hbs',
        viewExt: 'hbs',
        options: {
            partials: {
                header: 'partials/header.hbs',
                footer: 'partials/footer.hbs'
            }
        }
    })
})