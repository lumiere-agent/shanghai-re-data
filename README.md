# 上海房地产数据采集

自动采集上海房地产交易中心（[https://www.fangdi.com.cn](https://www.fangdi.com.cn)）每日成交数据。

## 数据说明

### 每日成交概况 (houseReview)

| 字段 | 类型 | 说明 |
|------|------|------|
| `sysDate` | string | 数据日期 (YYYY-MM-DD) |
| `todayselledcount` | int | 今日成交套数 |
| `todayselledarea` | double | 今日成交面积 (m²) |
| `listHouseReview` | array | 总成交数据 [{count, area}] |
| `listHouseReview2` | array | 商业办公类成交 [{count, area}] |
| `listHouseReview3` | array | 二手住宅成交 [{count, area}] |
| `listHouseReview4` | array | 新建商品房成交 [{count, area}] |
| `listHouseReview5` | array | 其他类型成交 [6项数据] |
| `listHouseReview6` | array | 详细分类数据 [{dcount,darea,pcount,parea,ecount,earea}] |

### 一手房交易统计 (firstTransactionStat)

按区域统计的一手房交易数据。

| 字段 | 类型 | 说明 |
|------|------|------|
| `zoneid` | string | 区域ID |
| `zonename` | string | 区域名称 (如"浦东新区"、"黄浦区") |
| `sign_num` | int | 当期签约套数 |
| `sign_area` | double | 当期签约面积 (m²) |
| `sign_avgprice` | double | 当期签约均价 (元/m²) |
| `all_sign_num` | int | 累计签约套数 |
| `all_sign_area` | double | 累计签约面积 (m²) |
| `all_sign_avgprice` | double | 累计签约均价 (元/m²) |
| `z_sign_num` | int | 住宅签约套数 |
| `z_sign_area` | double | 住宅签约面积 |
| `z_sign_avgprice` | double | 住宅签约均价 |
| `s_sign_num` | int | 商业签约套数 |
| `s_sign_area` | double | 商业签约面积 |
| `q_sign_num` | int | 其他签约套数 |

### 一手房可售统计 (firstvendibilityStat)

| 字段 | 类型 | 说明 |
|------|------|------|
| `zoneid` | string | 区域ID |
| `zonename` | string | 区域名称 |
| `z_leaving_num` | int | 住宅当前可售套数 |
| `z_leaving_area` | double | 住宅当前可售面积 (m²) |
| `z_leaving_num_p` | int | 住宅上一周期可售套数 |
| `s_leaving_num` | int | 商业可售套数 |
| `s_leaving_area` | double | 商业可售面积 |
| `b_leaving_num` | int | 办公可售套数 |
| `b_leaving_area` | double | 办公可售面积 |

### 二手房挂牌出售 (secondListingSell)

| 字段 | 类型 | 说明 |
|------|------|------|
| `zoneid` | string | 区域ID |
| `zonename` | string | 区域名称 |
| `leaving_num` | int | 挂牌套数 |
| `leaving_area` | double | 挂牌面积 (m²) |
| `zonetype` | string | 区域类型 |

### 二手房挂牌出租 (secondListingRent)

| 字段 | 类型 | 说明 |
|------|------|------|
| `zoneid` | string | 区域ID |
| `zonename` | string | 区域名称 |
| `leaving_num` | int | 挂牌套数 |
| `leaving_area` | double | 挂牌面积 (m²) |

### 各区成交排名 (firstLastMonthRanking)

| 字段 | 类型 | 说明 |
|------|------|------|
| `zoneid` | string | 区域ID |
| `zonename` | string | 区域名称 |
| `selledarea` | double | 成交面积 (m²) |

### 一手房成交排名 (firstRecentRanking)

| 字段 | 类型 | 说明 |
|------|------|------|
| `projectid` | string | 项目ID |
| `projectname` | string | 项目名称 |
| `name` | string | 区域名称 |
| `selled_count` | int | 成交套数 |
| `leavingcount` | int | 可售套数 |
| `selled_averageprice` | double | 成交均价 (可能为null) |

### 房价构成 (firstPriceConstitute)

| 字段 | 类型 | 说明 |
|------|------|------|
| `classifycode` | string | 分类代码 (8/9/10 代表不同价格区间) |
| `selledcount` | int | 成交套数 |
| `selledarea` | double | 成交面积 |
| `selledpercent` | double | 成交比例 |

### 住宅统计 (firstResidenceStat)

同 `firstTransactionStat`，按住宅类型细分。

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

## 使用方法

### 安装依赖

```bash
npm install playwright
npx playwright install chromium
```

### 运行采集脚本

```bash
# 采集当天数据
node scripts/fetch_data.js

# 采集指定日期数据
node scripts/fetch_data.js 2026-04-01
```

### 查看数据

数据保存在 `data/re_data_YYYY-MM-DD.json`，每次采集覆盖 `data/latest.json`。

## 定时任务设置

### 每日自动采集

使用 cron 设置每天早上 9 点自动采集：

```bash
# 编辑 crontab
crontab -e
```

添加以下行：

```cron
0 9 * * * cd /home/node/.openclaw/workspace-teamleader/shanghai-re-data && node scripts/fetch_data.js >> logs/cron.log 2>&1
```

### 创建日志目录

```bash
mkdir -p /home/node/.openclaw/workspace-teamleader/shanghai-re-data/logs
```

### 查看定时任务

```bash
crontab -l
```

### 日志位置

- 控制台输出: `logs/cron.log`
- 数据文件: `data/re_data_YYYY-MM-DD.json`

## 数据文件格式

```json
{
  "date": "2026-04-07",
  "fetchedAt": "2026-04-08T03:10:55.042Z",
  "data": {
    "houseReview": { ... },
    "firstTransactionStat": { ... },
    ...
  }
}
```

## 注意事项

1. 网站有防爬机制，需要先加载主页获取会话 token
2. 脚本使用 Playwright 模拟浏览器访问
3. 每日数据一般在当天 24:00 后更新
4. 成交数据可能为 0（周末或节假日无成交）
