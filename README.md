# 上海房地产数据采集

自动采集上海房地产交易中心（[https://www.fangdi.com.cn](https://www.fangdi.com.cn)）每日成交数据。

## 数据存储

- **SQLite 数据库**: `data/fangdi.db`
- **JSON 备份**: `data/re_data_YYYY-MM-DD.json`

## 数据库表结构

### daily_summary - 每日成交概况

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 (YYYY-MM-DD) |
| sys_date | TEXT | 系统日期 |
| today_selled_count | INTEGER | 今日成交套数 |
| today_selled_area | REAL | 今日成交面积 (m²) |
| total_count | INTEGER | 总成交套数 |
| total_area | REAL | 总成交面积 (m²) |
| commercial_count | INTEGER | 商业办公成交套数 |
| commercial_area | REAL | 商业办公成交面积 |
| second_hand_count | INTEGER | 二手住宅成交套数 |
| second_hand_area | REAL | 二手住宅成交面积 |
| new_house_count | INTEGER | 新建商品房成交套数 |
| new_house_area | REAL | 新建商品房成交面积 |
| fetched_at | TEXT | 采集时间 |

### first_hand_transaction - 一手房交易统计

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| zone_id | TEXT | 区域ID |
| zone_name | TEXT | 区域名称 |
| sign_num | INTEGER | 当期签约套数 |
| sign_area | REAL | 当期签约面积 (m²) |
| sign_avg_price | REAL | 当期签约均价 (元/m²) |
| all_sign_num | INTEGER | 累计签约套数 |
| all_sign_area | REAL | 累计签约面积 |
| all_sign_avg_price | REAL | 累计签约均价 |
| residence_sign_num | INTEGER | 住宅签约套数 |
| residence_sign_area | REAL | 住宅签约面积 |
| residence_sign_avg_price | REAL | 住宅签约均价 |
| commercial_sign_num | INTEGER | 商业签约套数 |
| commercial_sign_area | REAL | 商业签约面积 |
| other_sign_num | INTEGER | 其他签约套数 |
| other_sign_area | REAL | 其他签约面积 |

### first_hand_inventory - 一手房可售统计

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| zone_id | TEXT | 区域ID |
| zone_name | TEXT | 区域名称 |
| residence_leaving_num | INTEGER | 住宅当前可售套数 |
| residence_leaving_area | REAL | 住宅当前可售面积 |
| residence_prev_num | INTEGER | 住宅上一周期可售套数 |
| commercial_leaving_num | INTEGER | 商业可售套数 |
| commercial_leaving_area | REAL | 商业可售面积 |
| office_leaving_num | INTEGER | 办公可售套数 |
| office_leaving_area | REAL | 办公可售面积 |

### second_hand_listing_sell - 二手房挂牌出售

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| zone_id | TEXT | 区域ID |
| zone_name | TEXT | 区域名称 |
| zone_type | TEXT | 区域类型 |
| leaving_num | INTEGER | 挂牌套数 |
| leaving_area | REAL | 挂牌面积 (m²) |

### second_hand_listing_rent - 二手房挂牌出租

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| zone_id | TEXT | 区域ID |
| zone_name | TEXT | 区域名称 |
| leaving_num | INTEGER | 挂牌套数 |
| leaving_area | REAL | 挂牌面积 (m²) |

### zone_ranking - 各区成交排名

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| zone_id | TEXT | 区域ID |
| zone_name | TEXT | 区域名称 |
| selled_area | REAL | 成交面积 (m²) |

### project_ranking - 一手房成交排名

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| date | TEXT | 数据日期 |
| project_id | TEXT | 项目ID |
| project_name | TEXT | 项目名称 |
| zone_name | TEXT | 区域名称 |
| selled_count | INTEGER | 成交套数 |
| leaving_count | INTEGER | 可售套数 |
| selled_avg_price | REAL | 成交均价 (元/m²) |

## API 接口

基础 URL: `https://www.fangdi.com.cn`

| 接口 | 说明 |
|------|------|
| `/service/trade/getHouseReview.action` | 每日成交概况 |
| `/service/trade/getFirstTransactionStat.action` | 一手房交易统计 |
| `/service/trade/getFirstvendibilityStat.action` | 一手房可售统计 |
| `/service/trade/getSecondListingSell.action` | 二手房挂牌出售 |
| `/service/trade/getSecondListingRent.action` | 二手房挂牌出租 |
| `/service/trade/getFirstLastMonthRanking.action` | 各区成交排名 |
| `/service/trade/getFirstRecentRanking.action` | 一手房成交排名 |
| `/service/trade/getFirstPriceConstitute.action` | 房价构成 |
| `/service/trade/getFirstResidenceStat.action` | 住宅统计 |

**注意**: API 需要先访问主页建立会话，建议使用 Playwright 版本。

## 安装和使用

### 安装依赖

```bash
npm install
```

### 运行采集脚本

```bash
# 采集当天数据
node scripts/fetch_data.js

# 采集指定日期数据
node scripts/fetch_data.js 2026-04-01
```

### 查看数据库

```bash
sqlite3 data/fangdi.db ".tables"
sqlite3 data/fangdi.db "SELECT * FROM daily_summary;"
sqlite3 data/fangdi.db "SELECT zone_name, selled_area FROM zone_ranking ORDER BY selled_area DESC LIMIT 10;"
```

## 定时任务

### 设置 Cron

```bash
./scripts/setup_cron.sh
```

### 查看 Cron 状态

```bash
crontab -l
```

### 查看日志

```bash
tail -f logs/cron.log
```

## 数据示例

### 每日成交概况 (2026-04-07)

```
数据日期: 2026-04-07
今日成交套数: 0
今日成交面积: 0 m²
总成交套数: 377
总成交面积: 29053.51 m²
新建商品房成交: 94 套 / 11847.92 m²
二手住宅成交: 14 套 / 618.42 m²
```

### 各区成交排名 TOP 5

| 区域 | 成交面积 (m²) |
|------|---------------|
| 浦东新区 | 437,858.81 |
| 闵行区 | 185,766.47 |
| 嘉定区 | 137,617.67 |
| 松江区 | 102,040.74 |
| 青浦区 | 100,889.93 |

## 注意事项

1. 网站有防爬机制，需要先加载主页获取会话 token
2. 脚本使用 Playwright 模拟浏览器访问
3. 每日数据一般在当天 24:00 后更新
4. 成交数据可能为 0（周末或节假日无成交）
5. 数据库文件 `fangdi.db` 在本地生成，不会上传到 GitHub
