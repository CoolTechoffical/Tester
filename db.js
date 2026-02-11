const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'data', 'holidays.db');

function openDb() {
  return new sqlite3.Database(DB_PATH);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDb(seedData = []) {
  const db = openDb();

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'super_admin',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      district TEXT NOT NULL,
      subDistrict TEXT NOT NULL,
      scope TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      payload_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  );

  const adminCount = await get(db, 'SELECT COUNT(*) as count FROM admins');
  if (adminCount.count === 0) {
    await run(
      db,
      'INSERT INTO admins (username, password, display_name, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin123', 'Kerala Portal Admin', 'super_admin']
    );
  }

  const existing = await get(db, 'SELECT COUNT(*) as count FROM holidays');
  if (existing.count === 0 && seedData.length > 0) {
    for (const item of seedData) {
      await run(
        db,
        'INSERT INTO holidays (date, title, category, district, subDistrict, scope, description, image, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          item.date,
          item.title,
          item.category,
          item.district,
          item.subDistrict,
          item.scope,
          item.description,
          item.image,
          'seed'
        ]
      );
    }
  }

  return db;
}

module.exports = {
  initDb,
  all,
  get,
  run
};
