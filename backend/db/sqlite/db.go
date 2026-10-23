package sqlite

import (
	"backend/db/sqllog"
	"database/sql"
	"log"
	"os"
	"path"
	"path/filepath"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	_ "modernc.org/sqlite"
)

var DBName = "mydatabase.db"

// getAbsoluteDBPath 获取统一的数据库绝对路径，避免由于工作目录切换导致找不到数据库
func getAbsoluteDBPath() string {
	workDir, err := os.Getwd()
	if err != nil {
		log.Panicf("无法获取当前工作目录: %v", err)
	}
	return filepath.Join(workDir, DBName)
}

func NewDB() *sql.DB {
	workDir := getAbsoluteDBPath()
	db, err := sql.Open("sqlite", path.Join(workDir, DBName))
	if err != nil {
		log.Panic(err)
	}
	// 实际建立连接并验证数据库可用
	if err := db.Ping(); err != nil {
		log.Panic(err)
	}
	return db
}

func NewGormDB() *gorm.DB {
	// 核心改动：利用 gorm.Open 传入显式配置，强制声明底层驱动名为 "sqlite"
	// 这样可以彻底斩断 gorm.io/driver/sqlite 对 CGO 驱动 的默认依赖
	dialector := sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        getAbsoluteDBPath(),
	}
	db, err := gorm.Open(dialector, &gorm.Config{
		Logger: sqllog.New(500 * time.Millisecond),
	})
	if err != nil {
		log.Panic(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		log.Panic(err)
	}
	err = sqlDB.Ping()
	if err != nil {
		log.Panic(err)
	}
	return db
}

func NewTestGormDB() *gorm.DB {
	workDir, _ := os.Getwd()
	// 核心改动：利用 gorm.Open 传入显式配置，强制声明底层驱动名为 "sqlite"
	// 这样可以彻底斩断 gorm.io/driver/sqlite 对 CGO 驱动 的默认依赖
	dialector := sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        filepath.Join(workDir, "chapter_content.db"),
	}
	db, _ := gorm.Open(dialector, &gorm.Config{
		Logger: sqllog.New(500 * time.Millisecond),
	})
	sqlDB, _ := db.DB()
	_ = sqlDB.Ping()
	return db
}
