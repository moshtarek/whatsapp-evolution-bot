import { getDB } from '../src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    const db = await getDB();
    
    // إنشاء جدول migrations إذا لم يكن موجوداً
    await db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at TEXT DEFAULT (datetime('now'))
      )
    `);
    
    // قراءة ملفات migrations
    const migrationsDir = path.join(__dirname, 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found');
      return;
    }
    
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      // التحقق من تنفيذ migration سابقاً
      const existing = await db.get('SELECT * FROM migrations WHERE filename = ?', file);
      if (existing) {
        console.log(`Migration ${file} already executed`);
        continue;
      }
      
      // تنفيذ migration
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      
      await db.exec(sql);
      await db.run('INSERT INTO migrations (filename) VALUES (?)', file);
      
      console.log(`✅ Executed migration: ${file}`);
    }
    
    console.log('All migrations completed');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
