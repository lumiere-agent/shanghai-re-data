#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 创建 SQLite 数据库和表结构
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'fangdi.db');

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // 每日成交概况
  db.run(`
    CREATE TABLE IF NOT EXISTS daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      sys_date TEXT,
      today_selled_count INTEGER DEFAULT 0,
      today_selled_area REAL DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      total_area REAL DEFAULT 0,
      commercial_count INTEGER DEFAULT 0,
      commercial_area REAL DEFAULT 0,
      second_hand_count INTEGER DEFAULT 0,
      second_hand_area REAL DEFAULT 0,
      new_house_count INTEGER DEFAULT 0,
      new_house_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 一手房交易统计（按区域）
  db.run(`
    CREATE TABLE IF NOT EXISTS first_hand_transaction (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      sign_num INTEGER DEFAULT 0,
      sign_area REAL DEFAULT 0,
      sign_avg_price REAL DEFAULT 0,
      all_sign_num INTEGER DEFAULT 0,
      all_sign_area REAL DEFAULT 0,
      all_sign_avg_price REAL DEFAULT 0,
      residence_sign_num INTEGER DEFAULT 0,
      residence_sign_area REAL DEFAULT 0,
      residence_sign_avg_price REAL DEFAULT 0,
      commercial_sign_num INTEGER DEFAULT 0,
      commercial_sign_area REAL DEFAULT 0,
      other_sign_num INTEGER DEFAULT 0,
      other_sign_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, zone_id)
    )
  `);

  // 一手房可售统计
  db.run(`
    CREATE TABLE IF NOT EXISTS first_hand_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      residence_leaving_num INTEGER DEFAULT 0,
      residence_leaving_area REAL DEFAULT 0,
      residence_prev_num INTEGER DEFAULT 0,
      commercial_leaving_num INTEGER DEFAULT 0,
      commercial_leaving_area REAL DEFAULT 0,
      office_leaving_num INTEGER DEFAULT 0,
      office_leaving_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, zone_id)
    )
  `);

  // 二手房挂牌出售
  db.run(`
    CREATE TABLE IF NOT EXISTS second_hand_listing_sell (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      zone_type TEXT,
      leaving_num INTEGER DEFAULT 0,
      leaving_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, zone_id)
    )
  `);

  // 二手房挂牌出租
  db.run(`
    CREATE TABLE IF NOT EXISTS second_hand_listing_rent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      leaving_num INTEGER DEFAULT 0,
      leaving_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, zone_id)
    )
  `);

  // 各区成交排名
  db.run(`
    CREATE TABLE IF NOT EXISTS zone_ranking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      zone_id TEXT,
      zone_name TEXT,
      selled_area REAL DEFAULT 0,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, zone_id)
    )
  `);

  // 一手房成交排名（项目）
  db.run(`
    CREATE TABLE IF NOT EXISTS project_ranking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      project_id TEXT,
      project_name TEXT,
      zone_name TEXT,
      selled_count INTEGER DEFAULT 0,
      leaving_count INTEGER DEFAULT 0,
      selled_avg_price REAL,
      fetched_at TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, project_id)
    )
  `);

  // 创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON daily_summary(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_first_hand_date ON first_hand_transaction(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_first_hand_zone ON first_hand_transaction(zone_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_second_hand_date ON second_hand_listing_sell(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_zone_ranking_date ON zone_ranking(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_ranking_date ON project_ranking(date)`);

  console.log('数据库表创建完成:', DB_PATH);
});

db.close();
