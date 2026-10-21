package sqllog

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"gorm.io/gorm/logger"
)

type SlowLogger struct {
	logger.Interface
	threshold time.Duration
}

func New(threshold time.Duration) *SlowLogger {
	base := logger.New(
		log.New(os.Stdout, "", log.LstdFlags),
		logger.Config{
			SlowThreshold: threshold,
			LogLevel:      logger.Silent,
			Colorful:      false,
		},
	)

	return &SlowLogger{
		Interface: base,
		threshold: threshold,
	}
}

func (l *SlowLogger) LogMode(level logger.LogLevel) logger.Interface {
	// 保持底层 Logger 的接口行为。
	return &SlowLogger{
		Interface: l.Interface.LogMode(level),
		threshold: l.threshold,
	}
}

func (l *SlowLogger) Trace(
	ctx context.Context,
	begin time.Time,
	fc func() (string, int64),
	err error,
) {
	elapsed := time.Since(begin)

	if err == nil && elapsed < l.threshold {
		return
	}

	// 仅在慢查询或错误时获取 SQL。
	sql, rows := fc()

	// 只提取 SQL 类型和表名，不输出完整语句。
	summary := summarizeSQL(sql)

	log.Printf(
		"[SQL] type=%s elapsed=%s rows=%d err=%v",
		summary,
		elapsed.Round(time.Millisecond),
		rows,
		err,
	)
}

func summarizeSQL(sql string) string {
	fields := strings.Fields(sql)
	if len(fields) == 0 {
		return "UNKNOWN"
	}

	// 最基础的摘要：提取 INSERT / UPDATE / DELETE / SELECT。
	return strings.ToUpper(fields[0])
}

// 初始化示例：
// db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
//     Logger: sqllog.New(500 * time.Millisecond),
// })
