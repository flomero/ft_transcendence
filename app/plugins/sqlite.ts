import sqlite3 from 'sqlite3'
import fp from 'fastify-plugin'
import { open, Database } from 'sqlite'
import path from 'path'

/**
 * This plugins adds sqlite3 support
 * @see https://www.npmjs.com/package/sqlite3
 * @see https://www.npmjs.com/package/sqlite
**/

declare module 'fastify' {
  interface FastifyInstance {
    sqlite: Database;
  }
}

export default fp(async (fastify) => {
  const dbPath = path.resolve(__dirname, '../../database/db.sqlite');
  console.log('dbPath', dbPath);
  const db: Database = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  fastify.decorate('sqlite', db);

  fastify.addHook('onReady', async function () {
    db.migrate({
      migrationsPath: '../app/services/database/migrations'
    });
  });
})
