import { getDB } from '../db.js';

export async function getAISettings() {
  const db = await getDB();
  const settings = await db.get('SELECT * FROM ai_settings WHERE id = 1');
  return settings || {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    apiKey: '',
    maxTokens: 1500,
    temperature: 0.7
  };
}

export async function updateAISettings(settings) {
  const db = await getDB();
  await db.run(`
    INSERT OR REPLACE INTO ai_settings (id, provider, model, apiKey, maxTokens, temperature, updatedAt)
    VALUES (1, ?, ?, ?, ?, ?, datetime('now'))
  `, [settings.provider, settings.model, settings.apiKey, settings.maxTokens, settings.temperature]);
}
