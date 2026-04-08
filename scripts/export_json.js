#!/usr/bin/env node
/**
 * 导出数据到 JSON 文件 (用于 GitHub Pages)
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'fangdi.db');
const OUTPUT_DIR = path.join(__dirname, '..', 'docs');

if (!fs.existsSync(DB_PATH)) {
  console.error('数据库文件不存在:', DB_PATH);
  console.error('请先运行: node scripts/fetch_data.js');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function exportData() {
  console.log('开始导出数据...\n');
  
  // 1. 每日成交概况
  const dailySummary = await queryAll(`
    SELECT * FROM daily_summary ORDER BY date DESC LIMIT 30
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'daily_summary.json'),
    JSON.stringify(dailySummary, null, 2)
  );
  console.log('✓ daily_summary.json');
  
  // 2. 各区成交排名 (最新)
  const zoneRanking = await queryAll(`
    SELECT * FROM zone_ranking 
    WHERE date = (SELECT MAX(date) FROM zone_ranking)
    ORDER BY selled_area DESC
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'zone_ranking.json'),
    JSON.stringify(zoneRanking, null, 2)
  );
  console.log('✓ zone_ranking.json');
  
  // 3. 一手房交易统计 (按区域, 最新)
  const firstHandTransaction = await queryAll(`
    SELECT * FROM first_hand_transaction
    WHERE date = (SELECT MAX(date) FROM first_hand_transaction)
    ORDER BY all_sign_num DESC
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'first_hand_transaction.json'),
    JSON.stringify(firstHandTransaction, null, 2)
  );
  console.log('✓ first_hand_transaction.json');
  
  // 4. 一手房可售统计
  const firstHandInventory = await queryAll(`
    SELECT * FROM first_hand_inventory
    WHERE date = (SELECT MAX(date) FROM first_hand_inventory)
    ORDER BY residence_leaving_num DESC
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'first_hand_inventory.json'),
    JSON.stringify(firstHandInventory, null, 2)
  );
  console.log('✓ first_hand_inventory.json');
  
  // 5. 二手房挂牌
  const secondHandSell = await queryAll(`
    SELECT * FROM second_hand_listing_sell
    WHERE date = (SELECT MAX(date) FROM second_hand_listing_sell)
    ORDER BY leaving_num DESC
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'second_hand_sell.json'),
    JSON.stringify(secondHandSell, null, 2)
  );
  console.log('✓ second_hand_sell.json');
  
  // 6. 一手房成交排名
  const projectRanking = await queryAll(`
    SELECT * FROM project_ranking
    WHERE date = (SELECT MAX(date) FROM project_ranking)
    ORDER BY selled_count DESC
    LIMIT 20
  `);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'project_ranking.json'),
    JSON.stringify(projectRanking, null, 2)
  );
  console.log('✓ project_ranking.json');
  
  // 7. 生成索引文件
  const index = {
    lastUpdated: new Date().toISOString(),
    dataFiles: [
      'daily_summary.json',
      'zone_ranking.json',
      'first_hand_transaction.json',
      'first_hand_inventory.json',
      'second_hand_sell.json',
      'project_ranking.json'
    ]
  };
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'index.json'),
    JSON.stringify(index, null, 2)
  );
  console.log('✓ index.json');
  
  console.log('\n导出完成! 文件位于:', OUTPUT_DIR);
}

exportData().then(() => {
  db.close();
}).catch(err => {
  console.error('导出失败:', err);
  process.exit(1);
});
