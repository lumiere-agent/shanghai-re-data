#!/usr/bin/env node
/**
 * 上海房地产数据采集脚本
 * 
 * 采集 https://www.fangdi.com.cn 的每日成交数据
 * 数据存储到 SQLite 数据库
 * 
 * 使用方式:
 *   node fetch_data.js [日期YYYY-MM-DD]
 *   node fetch_data.js          # 采集当天数据
 *   node fetch_data.js 2026-04-01 # 采集指定日期数据
 */

const { chromium } = require('playwright');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  baseUrl: 'https://www.fangdi.com.cn',
  dataDir: path.join(__dirname, '..', 'data'),
  dbPath: path.join(__dirname, '..', 'data', 'fangdi.db'),
  date: process.argv[2] || new Date().toISOString().split('T')[0], // 默认当天
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// 初始化数据库
function initDatabase() {
  const db = new sqlite3.Database(CONFIG.dbPath);
  
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
  });
  
  return db;
}

/**
 * 保存每日成交概况
 */
function saveDailySummary(db, date, data, fetchedAt) {
  const hr = data.houseReview || {};
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO daily_summary 
    (date, sys_date, today_selled_count, today_selled_area, total_count, total_area,
     commercial_count, commercial_area, second_hand_count, second_hand_area,
     new_house_count, new_house_area, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    date,
    hr.sysDate || date,
    hr.todayselledcount || 0,
    hr.todayselledarea || 0,
    hr.listHouseReview?.[0]?.count || 0,
    hr.listHouseReview?.[0]?.area || 0,
    hr.listHouseReview2?.[0]?.count || 0,
    hr.listHouseReview2?.[0]?.area || 0,
    hr.listHouseReview3?.[0]?.count || 0,
    hr.listHouseReview3?.[0]?.area || 0,
    hr.listHouseReview4?.[0]?.count || 0,
    hr.listHouseReview4?.[0]?.area || 0,
    fetchedAt
  );
  stmt.finalize();
}

/**
 * 保存一手房交易统计
 */
function saveFirstHandTransaction(db, date, data, fetchedAt) {
  const stats = data.firstTransactionStat?.TransactionStat || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO first_hand_transaction
    (date, zone_id, zone_name, sign_num, sign_area, sign_avg_price,
     all_sign_num, all_sign_area, all_sign_avg_price,
     residence_sign_num, residence_sign_area, residence_sign_avg_price,
     commercial_sign_num, commercial_sign_area,
     other_sign_num, other_sign_area, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(
      date, s.zoneid, s.zonename,
      s.sign_num || 0, s.sign_area || 0, s.sign_avgprice || 0,
      s.all_sign_num || 0, s.all_sign_area || 0, s.all_sign_avgprice || 0,
      s.z_sign_num || 0, s.z_sign_area || 0, s.z_sign_avgprice || 0,
      s.s_sign_num || 0, s.s_sign_area || 0,
      s.q_sign_num || 0, s.q_sign_area || 0,
      fetchedAt
    );
  }
  stmt.finalize();
}

/**
 * 保存一手房可售统计
 */
function saveFirstHandInventory(db, date, data, fetchedAt) {
  const stats = data.firstvendibilityStat?.listFirstvendibility || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO first_hand_inventory
    (date, zone_id, zone_name, residence_leaving_num, residence_leaving_area,
     residence_prev_num, commercial_leaving_num, commercial_leaving_area,
     office_leaving_num, office_leaving_area, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(
      date, s.zoneid, s.zonename,
      s.z_leaving_num || 0, s.z_leaving_area || 0,
      s.z_leaving_num_p || 0,
      s.s_leaving_num || 0, s.s_leaving_area || 0,
      s.b_leaving_num || 0, s.b_leaving_area || 0,
      fetchedAt
    );
  }
  stmt.finalize();
}

/**
 * 保存二手房挂牌出售
 */
function saveSecondHandListingSell(db, date, data, fetchedAt) {
  const stats = data.secondListingSell?.SecondListingSell || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO second_hand_listing_sell
    (date, zone_id, zone_name, zone_type, leaving_num, leaving_area, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(date, s.zoneid, s.zonename, s.zonetype, s.leaving_num || 0, s.leaving_area || 0, fetchedAt);
  }
  stmt.finalize();
}

/**
 * 保存二手房挂牌出租
 */
function saveSecondHandListingRent(db, date, data, fetchedAt) {
  const stats = data.secondListingRent?.SecondListingRent || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO second_hand_listing_rent
    (date, zone_id, zone_name, leaving_num, leaving_area, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(date, s.zoneid, s.zonename, s.leaving_num || 0, s.leaving_area || 0, fetchedAt);
  }
  stmt.finalize();
}

/**
 * 保存各区成交排名
 */
function saveZoneRanking(db, date, data, fetchedAt) {
  const stats = data.firstLastMonthRanking?.FirstLastMonth || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO zone_ranking
    (date, zone_id, zone_name, selled_area, fetched_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(date, s.zoneid, s.zonename, s.selledarea || 0, fetchedAt);
  }
  stmt.finalize();
}

/**
 * 保存一手房成交排名
 */
function saveProjectRanking(db, date, data, fetchedAt) {
  const stats = data.firstRecentRanking?.FirstRecentRanking || [];
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO project_ranking
    (date, project_id, project_name, zone_name, selled_count, leaving_count, selled_avg_price, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const s of stats) {
    stmt.run(date, s.projectid, s.projectname, s.name, s.selled_count || 0, s.leavingcount || 0, s.selled_averageprice, fetchedAt);
  }
  stmt.finalize();
}

/**
 * 使用 Playwright 获取 API 数据
 */
async function fetchWithPlaywright() {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });
  
  const page = await context.newPage();
  
  // 先访问主页建立会话
  console.log('正在访问主页建立会话...');
  await page.goto(`${CONFIG.baseUrl}/trade/trade.html`, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  await page.waitForTimeout(2000);
  
  const results = {
    date: CONFIG.date,
    fetchedAt: new Date().toISOString(),
    data: {}
  };

  // API 列表
  const apis = [
    { name: 'houseReview', path: '/service/trade/getHouseReview.action' },
    { name: 'firstTransactionStat', path: '/service/trade/getFirstTransactionStat.action' },
    { name: 'firstvendibilityStat', path: '/service/trade/getFirstvendibilityStat.action' },
    { name: 'secondListingSell', path: '/service/trade/getSecondListingSell.action' },
    { name: 'secondListingRent', path: '/service/trade/getSecondListingRent.action' },
    { name: 'firstLastMonthRanking', path: '/service/trade/getFirstLastMonthRanking.action' },
    { name: 'firstRecentRanking', path: '/service/trade/getFirstRecentRanking.action' },
    { name: 'firstPriceConstitute', path: '/service/trade/getFirstPriceConstitute.action' },
    { name: 'firstResidenceStat', path: '/service/trade/getFirstResidenceStat.action' }
  ];

  for (const api of apis) {
    try {
      console.log(`  -> 获取 ${api.name}...`);
      const response = await page.request.get(`${CONFIG.baseUrl}${api.path}`);
      const text = await response.text();
      
      if (response.status() === 200 && text.trim().startsWith('{')) {
        results.data[api.name] = JSON.parse(text);
        console.log(`     成功`);
      } else {
        results.data[api.name] = { error: `HTTP ${response.status()}`, detail: text.substring(0, 200) };
        console.log(`     失败: HTTP ${response.status()}`);
      }
    } catch (e) {
      results.data[api.name] = { error: e.message };
      console.log(`     失败: ${e.message}`);
    }
  }

  await browser.close();
  return results;
}

/**
 * 保存数据到数据库
 */
function saveToDatabase(data) {
  const db = initDatabase();
  const fetchedAt = data.fetchedAt;
  
  // 保存每日成交概况
  if (data.data.houseReview && !data.data.houseReview.error) {
    saveDailySummary(db, data.date, data.data, fetchedAt);
  }
  
  // 保存一手房交易统计
  if (data.data.firstTransactionStat && !data.data.firstTransactionStat.error) {
    saveFirstHandTransaction(db, data.date, data.data, fetchedAt);
  }
  
  // 保存一手房可售统计
  if (data.data.firstvendibilityStat && !data.data.firstvendibilityStat.error) {
    saveFirstHandInventory(db, data.date, data.data, fetchedAt);
  }
  
  // 保存二手房挂牌出售
  if (data.data.secondListingSell && !data.data.secondListingSell.error) {
    saveSecondHandListingSell(db, data.date, data.data, fetchedAt);
  }
  
  // 保存二手房挂牌出租
  if (data.data.secondListingRent && !data.data.secondListingRent.error) {
    saveSecondHandListingRent(db, data.date, data.data, fetchedAt);
  }
  
  // 保存各区成交排名
  if (data.data.firstLastMonthRanking && !data.data.firstLastMonthRanking.error) {
    saveZoneRanking(db, data.date, data.data, fetchedAt);
  }
  
  // 保存一手房成交排名
  if (data.data.firstRecentRanking && !data.data.firstRecentRanking.error) {
    saveProjectRanking(db, data.date, data.data, fetchedAt);
  }
  
  db.close();
  console.log('数据已保存到数据库:', CONFIG.dbPath);
}

/**
 * 保存 JSON 备份
 */
function saveJsonBackup(data) {
  const filename = `re_data_${data.date}.json`;
  const filepath = path.join(CONFIG.dataDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  console.log('JSON 备份已保存:', filepath);
}

/**
 * 打印数据摘要
 */
function printSummary(data) {
  if (data.data.houseReview && !data.data.houseReview.error) {
    const hr = data.data.houseReview;
    console.log('\n=== 数据摘要 ===');
    console.log(`数据日期: ${hr.sysDate}`);
    console.log(`今日成交套数: ${hr.todayselledcount}`);
    console.log(`今日成交面积: ${hr.todayselledarea} m²`);
    console.log(`总成交套数: ${hr.listHouseReview?.[0]?.count || 0}`);
    console.log(`总成交面积: ${hr.listHouseReview?.[0]?.area || 0} m²`);
    console.log(`新建商品房成交: ${hr.listHouseReview4?.[0]?.count || 0} 套 / ${hr.listHouseReview4?.[0]?.area || 0} m²`);
    console.log(`二手住宅成交: ${hr.listHouseReview3?.[0]?.count || 0} 套 / ${hr.listHouseReview3?.[0]?.area || 0} m²`);
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log(`[${new Date().toISOString()}] 开始采集 ${CONFIG.date} 的数据...\n`);
    
    const data = await fetchWithPlaywright();
    
    // 保存到数据库
    saveToDatabase(data);
    
    // 保存 JSON 备份
    saveJsonBackup(data);
    
    // 打印摘要
    printSummary(data);
    
    const successCount = Object.keys(data.data).filter(k => !data.data[k].error).length;
    const totalCount = Object.keys(data.data).length;
    
    console.log(`\n采集完成!`);
    console.log(`日期: ${data.date}`);
    console.log(`成功获取 ${successCount}/${totalCount} 个 API`);
    
  } catch (e) {
    console.error(`采集失败: ${e.message}`);
    process.exit(1);
  }
}

main();
