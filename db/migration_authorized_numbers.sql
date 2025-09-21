-- Migration: Add authorized_numbers table
-- This will preserve existing rules data

CREATE TABLE IF NOT EXISTS authorized_numbers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT,
  active INTEGER DEFAULT 1,           -- 1=on, 0=off
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_authorized_numbers_phone ON authorized_numbers(phone_number, active);

-- Insert authorized numbers
INSERT OR IGNORE INTO authorized_numbers (phone_number, name, active) VALUES
('966569096200', 'المالك الأساسي', 1),
('966582147460', 'رقم مصرح 1', 1),
('966548060769', 'رقم مصرح 2', 1),
('966599045697', 'رقم مصرح 3', 1),
('966500891589', 'رقم مصرح 4', 1),
('4915237975618', 'رقم مصرح 5', 1),
('966546493834', 'رقم مصرح 6', 1);
