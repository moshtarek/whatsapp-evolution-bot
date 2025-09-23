import { getDB } from './db.js';
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
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
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
        console.log(`✅ Migration ${file} already executed`);
        continue;
      }
      
      // تنفيذ migration
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8').trim();
      
      // تخطي الملفات الفارغة أو التعليقات فقط
      if (!sql || sql.startsWith('--') && !sql.includes('CREATE') && !sql.includes('INSERT') && !sql.includes('ALTER')) {
        console.log(`⏭️  Skipping empty migration: ${file}`);
        // تسجيل كمنفذ لتجنب إعادة المحاولة
        await db.run('INSERT INTO migrations (filename) VALUES (?)', file);
        continue;
      }
      
      await db.exec(sql);
      await db.run('INSERT INTO migrations (filename) VALUES (?)', file);
      
      console.log(`✅ Executed migration: ${file}`);
    }
    
    console.log('🎉 All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

export { runMigrations };

// تشغيل مباشر إذا تم استدعاء الملف
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}
