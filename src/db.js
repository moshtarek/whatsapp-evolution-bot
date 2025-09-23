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
  const { runMigrations } = await import('./migrate.js');
  await runMigrations();
}

export async function listAuthorizedNumbers() {
  const database = await getDB();
  const result = await database.all('SELECT * FROM authorized_numbers ORDER BY created_at DESC');
  await database.close();
  return result;
}

export async function getAuthorizedNumber(id) {
  const database = await getDB();
  const result = await database.get('SELECT * FROM authorized_numbers WHERE id = ?', id);
  await database.close();
  return result;
}

export async function createAuthorizedNumber({ phone_number, name, active = 1 }) {
  const database = await getDB();
  const result = await database.run(`
    INSERT INTO authorized_numbers (phone_number, name, active, updated_at)
    VALUES (?, ?, ?, datetime('now'))
  `, phone_number, name, active);
  await database.close();
  return { id: result.lastID, phone_number, name, active };
}

export async function updateAuthorizedNumber(id, updates) {
  const fields = [];
  const values = [];
  
  if (updates.phone_number !== undefined) { fields.push('phone_number = ?'); values.push(updates.phone_number); }
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.active !== undefined) { fields.push('active = ?'); values.push(updates.active); }
  
  if (fields.length === 0) return null;
  
  fields.push("updated_at = datetime('now')");
  values.push(id);
  
  const database = await getDB();
  const result = await database.run(`UPDATE authorized_numbers SET ${fields.join(', ')} WHERE id = ?`, ...values);
  const updated = result.changes > 0 ? await database.get('SELECT * FROM authorized_numbers WHERE id = ?', id) : null;
  await database.close();
  return updated;
}

export async function deleteAuthorizedNumber(id) {
  const database = await getDB();
  const result = await database.run('DELETE FROM authorized_numbers WHERE id = ?', id);
  await database.close();
  return result.changes > 0;
}

export async function isAuthorizedNumber(phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  const database = await getDB();
  const result = await database.get('SELECT COUNT(*) as count FROM authorized_numbers WHERE phone_number = ? AND active = 1', cleanNumber);
  await database.close();
  return result.count > 0;
}

async function migrateAuthorizedNumbers() {
  logger.info('Running authorized numbers migration...');
  try {
    const database = await getDB();
    const migrationSQL = fs.readFileSync('./db/migration_authorized_numbers.sql', 'utf8');
    database.exec(migrationSQL);
    await database.close();
    logger.info('Authorized numbers migration completed successfully');
  } catch (err) {
    logger.error('Migration error:', err.message);
    throw err;
  }
}

if (process.argv[2] === 'init') init();
if (process.argv[2] === 'seed') seed();
if (process.argv[2] === 'reset') reset();
if (process.argv[2] === 'migrate') migrate();
if (process.argv[2] === 'migrate-auth') migrateAuthorizedNumbers();
