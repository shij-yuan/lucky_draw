-- Lucky Draw Database Schema

-- Prize history table
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prize_name TEXT NOT NULL,
  prize_color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prize configuration table
CREATE TABLE IF NOT EXISTS prizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default prizes
INSERT INTO prizes (name, sort_order) VALUES 
  ('一等奖', 1),
  ('二等奖', 2),
  ('三等奖', 3),
  ('幸运奖', 4),
  ('参与奖', 5),
  ('再来一次', 6);

