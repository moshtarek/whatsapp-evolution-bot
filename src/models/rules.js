import { getDB } from '../db.js';
import dayjs from 'dayjs';
import { config } from '../config.js';

export async function listRules() {
  const db = await getDB();
  const rows = await db.all('SELECT * FROM rules ORDER BY priority ASC, id ASC');
  await db.close();
  return rows;
}
export async function getRule(id) {
  const db = await getDB();
  const row = await db.get('SELECT * FROM rules WHERE id=?', id);
  await db.close();
  return row;
}
export async function createRule(rule) {
  const db = await getDB();
  const { pattern, match_type, reply, reply_type = 'text', media_url, filename, lang = 'any', active = 1, priority = 100, only_in_business_hours = 0 } = rule;
  const now = dayjs().toISOString();
  
  try {
    const res = await db.run(
      `INSERT INTO rules (pattern, match_type, reply, reply_type, media_url, filename, lang, active, priority, only_in_business_hours, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pattern, match_type, reply, reply_type, media_url, filename, lang, active ? 1 : 0, priority, only_in_business_hours ? 1 : 0, now, now]
    );
    await db.close();
    return { success: true, id: res.lastID };
  } catch (error) {
    await db.close();
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, error: 'القاعدة موجودة مسبقاً (نفس النمط ونوع المطابقة)' };
    }
    throw error;
  }
}
export async function updateRule(id, patch) {
  const db = await getDB();
  const existing = await db.get('SELECT * FROM rules WHERE id=?', id);
  if (!existing) { await db.close(); return null; }
  const updated = { ...existing, ...patch };
  const now = dayjs().toISOString();
  await db.run(
    `UPDATE rules SET pattern=?, match_type=?, reply=?, reply_type=?, media_url=?, filename=?, lang=?, active=?, priority=?, only_in_business_hours=?, updated_at=? WHERE id=?`,
    [updated.pattern, updated.match_type, updated.reply, updated.reply_type, updated.media_url, updated.filename, updated.lang, updated.active ? 1 : 0, updated.priority, updated.only_in_business_hours ? 1 : 0, now, id]
  );
  await db.close();
  return id;
}
export async function deleteRule(id) {
  const db = await getDB();
  await db.run('DELETE FROM rules WHERE id=?', id);
  await db.close();
}
export function isBusinessOpen(now = dayjs()) {
  const isoWeekday = (now.day() + 6) % 7; // 0=Mon..6=Sun
  const dayOk = config.business.workDays.includes(isoWeekday);
  const hour = now.hour();
  const hourOk = hour >= config.business.workStartHour && hour < config.business.workEndHour;
  return dayOk && hourOk;
}
