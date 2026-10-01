import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db

export const initDatabase = () => {
  const dbPath = path.join(app.getPath('userData'), 'bilibili.db')
  db = new Database(dbPath)
  // 开启 WAL
  db.pragma('journal_mode = WAL')

  // 建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT NOT NULL,
      event_start_time TEXT NOT NULL,
      event_end_time TEXT NOT NULL,
      event_rules TEXT NOT NULL,
      post_count INTEGER NOT NULL DEFAULT 0,
      view INTEGER NOT NULL DEFAULT 0,
      money INTEGER NOT NULL DEFAULT 0,
      tag TEXT NOT NULL,
      search_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
  console.log('SQLite:', dbPath)
  return db
}

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database has not been initialized')
  }
  return db
}

export const addPlan = (form) => {
  const db = getDatabase()
  db.prepare(
    'INSERT INTO plan (event_name, event_start_time, event_end_time, event_rules, post_count, view, money, tag, search_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    form.event_name,
    form.event_start_time,
    form.event_end_time,
    form.event_rules,
    0,
    0,
    form.money,
    form.tag,
    ''
  )
}

export const updatePlan = (form) => {
  const db = getDatabase()
  db.prepare(
    "UPDATE plan SET event_name = ?, event_start_time = ?, event_end_time = ?, event_rules = ?, money = ?, tag = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(
    form.event_name,
    form.event_start_time,
    form.event_end_time,
    form.event_rules,
    form.money,
    form.tag,
    form.id
  )
}

export const getAllPlans = () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM plan').all()
}

export const deletePlan = (id) => {
  const db = getDatabase()
  db.prepare('DELETE FROM plan WHERE id = ?').run(id)
}
