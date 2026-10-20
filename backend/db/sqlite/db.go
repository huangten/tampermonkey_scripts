package sqlite

import (
	"database/sql"
	"log"
	"os"
	"path"

	_ "modernc.org/sqlite"
)

func NewDB() *sql.DB {
	workDir, err := os.Getwd()
	if err != nil {
		return nil
	}
	db, err := sql.Open("sqlite", path.Join(workDir, "mydatabase.db"))
	if err != nil {
		log.Fatal(err)
	}
	// 实际建立连接并验证数据库可用
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}
	return db
}
