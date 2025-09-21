CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL,
  reply TEXT NOT NULL,
  reply_type TEXT DEFAULT 'text',
  media_url TEXT,
  filename TEXT,
  lang TEXT DEFAULT 'any',
  active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 100,
  only_in_business_hours INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE(pattern, match_type)
);

CREATE TABLE IF NOT EXISTS authorized_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rules_active_priority ON rules(active, priority);
CREATE INDEX IF NOT EXISTS idx_rules_matchtype ON rules(match_type);
CREATE INDEX IF NOT EXISTS idx_rules_lang ON rules(lang);
CREATE INDEX IF NOT EXISTS idx_authorized_numbers_phone ON authorized_numbers(phone_number, active);
