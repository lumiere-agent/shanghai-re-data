#!/bin/bash
# 上海房地产数据采集 - Cron 设置脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== 上海房地产数据采集 Cron 设置 ==="
echo ""
echo "项目路径: $PROJECT_DIR"
echo ""

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"

# 获取当前 crontab
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# 检查是否已经设置过
if echo "$CURRENT_CRONTAB" | grep -q "shanghai-re-data.*fetch_data.js"; then
    echo "Cron 任务已存在，移除旧任务后重新设置..."
    (crontab -l 2>/dev/null | grep -v "shanghai-re-data") | crontab -
fi

# 设置 cron 任务 (每天早上 9:00 执行)
# 先采集数据，再导出 JSON 到 docs/ 目录（GitHub Pages 会自动发布）
CRON_JOB="0 9 * * * cd $PROJECT_DIR && node scripts/fetch_data.js >> logs/cron.log 2>&1 && node scripts/export_json.js >> logs/export.log 2>&1"

echo "添加 cron 任务: $CRON_JOB"
echo "$CRON_JOB" | crontab -

echo ""
echo "✅ Cron 任务设置完成!"
echo ""
echo "当前 crontab:"
crontab -l
echo ""
echo "查看采集日志: tail -f $PROJECT_DIR/logs/cron.log"
echo "查看导出日志: tail -f $PROJECT_DIR/logs/export.log"
