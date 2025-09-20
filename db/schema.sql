CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL,           -- EXACT | STARTS_WITH | CONTAINS | REGEX
  reply TEXT NOT NULL,
  reply_type TEXT DEFAULT 'text',     -- text | image | document
  media_url TEXT,                     -- URL للصورة أو الملف
  filename TEXT,                      -- اسم الملف (للمستندات)
  lang TEXT DEFAULT 'any',            -- any | ar | en
  active INTEGER DEFAULT 1,           -- 1=on, 0=off
  priority INTEGER DEFAULT 100,       -- smaller = higher priority
  only_in_business_hours INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rules_active_priority ON rules(active, priority);
CREATE INDEX IF NOT EXISTS idx_rules_matchtype ON rules(match_type);
CREATE INDEX IF NOT EXISTS idx_rules_lang ON rules(lang);
