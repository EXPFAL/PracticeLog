export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS practice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  advisor TEXT,
  direction_tags TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS material (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('file', 'url', 'github')),
  path_or_url TEXT NOT NULL,
  extracted_text TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  one_line_explain TEXT,
  importance TEXT CHECK(importance IN ('必问', '加分', '了解')),
  status TEXT DEFAULT '未学' CHECK(status IN ('未学', '学习中', '已掌握')),
  resource TEXT,
  note TEXT,
  order_index INTEGER DEFAULT 0,
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  what_done TEXT,
  problems TEXT,
  solutions TEXT,
  reflection TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_archive (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  practice_id INTEGER NOT NULL REFERENCES practice(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  local_path TEXT,
  tech_stack TEXT,
  role TEXT,
  summary TEXT,
  real_involvement TEXT,
  problems_solved TEXT,
  lessons TEXT,
  unknowns TEXT,
  interview_script TEXT,
  ai_generated INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`
