import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db

const createPlanTable = (db) => {
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
}

const createManuscriptTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS manuscript (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bvid TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      tag TEXT NOT NULL,
      view INTEGER NOT NULL DEFAULT 0,
      post_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
}

const createHotActivitiesTable = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hot_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      start_time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)
}

export const initDatabase = () => {
  const dbPath = path.join(app.getPath('userData'), 'bilibili.db')
  db = new Database(dbPath)
  // 开启 WAL
  db.pragma('journal_mode = WAL')

  // 建表
  createPlanTable(db)
  createManuscriptTable(db)
  createHotActivitiesTable(db)
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
    form.post_count,
    0,
    form.money,
    form.tag,
    ''
  )
}

export const updatePlan = (form) => {
  const db = getDatabase()
  db.prepare(
    "UPDATE plan SET event_name = ?, event_start_time = ?, event_end_time = ?, event_rules = ?, post_count = ?, view = ?, money = ?, tag = ?, search_time = ?, updated_at = datetime('now', 'localtime') WHERE id = ?"
  ).run(
    form.event_name,
    form.event_start_time,
    form.event_end_time,
    form.event_rules,
    form.post_count,
    form.view,
    form.money,
    form.tag,
    form.search_time,
    form.id
  )
}

export const getPlan = (tag) => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM plan WHERE tag LIKE ?').get(`%${tag}%`)
}

export const getAllPlans = () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM plan').all()
}

export const deletePlan = (id) => {
  const db = getDatabase()
  db.prepare('DELETE FROM plan WHERE id = ?').run(id)
}

export const addManuscript = (item) => {
  const db = getDatabase()
  db.prepare(
    'INSERT OR IGNORE INTO manuscript (bvid, title, tag, view, post_time) VALUES (?, ?, ?, ?, ?)'
  ).run(item.bvid, item.title, item.tag, item.view, item.post_time)
}

export const updateManuscript = (item) => {
  const db = getDatabase()
  const result = db
    .prepare(
      "UPDATE manuscript SET title = ?, tag = ?, view = ?, post_time = ?, updated_at = datetime('now', 'localtime') WHERE bvid = ?"
    )
    .run(item.title, item.tag, item.view, item.post_time, item.bvid)

  if (result.changes === 0) {
    return false
  }
  return true
}

export const getAllManuscript = () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM manuscript').all()
}

export const getViewLessOneHundred = () => {
  const db = getDatabase()
  return db
    .prepare(
      "SELECT * FROM manuscript WHERE view < 100 AND post_time < datetime('now', 'localtime', '-180 days')"
    )
    .all()
}

export const addHotActivities = (item) => {
  const db = getDatabase()
  db.prepare('INSERT OR IGNORE INTO hot_activities (name, url, start_time) VALUES (?, ?, ?)').run(
    item.name,
    item.url,
    item.start_time
  )
}

export const getAllHotActivities = () => {
  const db = getDatabase()
  return db.prepare('SELECT * FROM hot_activities').all()
}
