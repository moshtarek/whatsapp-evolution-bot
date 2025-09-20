import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getDB() {
  const db = await open({
    filename: config.db.sqlitePath,
    driver: sqlite3.Database
  });
  return db;
}

async function runSQLFromFile(db, filepath) {
  const sql = fs.readFileSync(filepath, 'utf8');
  await db.exec(sql);
}

async function init() {
  const db = await getDB();
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  await runSQLFromFile(db, schemaPath);
  logger.info('DB schema initialized');
  await db.close();
}

async function seed() {
  const db = await getDB();
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const seedPath = path.join(__dirname, '..', 'db', 'seed.sql');
  await runSQLFromFile(db, schemaPath);
  await runSQLFromFile(db, seedPath);
  logger.info('DB seeded');
  await db.close();
}

async function reset() {
  if (fs.existsSync(config.db.sqlitePath)) {
    fs.rmSync(config.db.sqlitePath);
    logger.warn('Removed existing SQLite file:', config.db.sqlitePath);
  }
  await init();
  await seed();
}

async function migrate() {
  const db = await getDB();
  const migratePath = path.join(__dirname, '..', 'db', 'migrate.sql');
  try {
    await runSQLFromFile(db, migratePath);
    logger.info('DB migrated successfully');
  } catch (err) {
    logger.info('Migration already applied or error:', err.message);
  }
  await db.close();
}

if (process.argv[2] === 'init') init();
if (process.argv[2] === 'seed') seed();
if (process.argv[2] === 'reset') reset();
if (process.argv[2] === 'migrate') migrate();
