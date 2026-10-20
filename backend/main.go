package main

import (
	"backend/db/sqlite"
	"database/sql"
	"fmt"
	"log"
	"math/rand"

	"github.com/google/uuid"
)

func main() {

	db := sqlite.NewDB()

	defer func(db *sql.DB) {
		err := db.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(db)

	// 创建表
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			age INTEGER NOT NULL
		)
	`)
	if err != nil {
		log.Fatal(err)
	}

	uuidName, err := uuid.NewV7()
	if err != nil {
	}
	// 插入数据
	result, err := db.Exec(
		"INSERT INTO users (name, age) VALUES (?, ?)",
		uuidName, rand.Intn(20) + +20,
	)
	if err != nil {
		log.Fatal(err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("新增 ID:", id)

	// 查询单条数据
	var name string
	var age int

	err = db.QueryRow(
		"SELECT name, age FROM users WHERE id = ?",
		id,
	).Scan(&name, &age)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Printf("用户: %s, 年龄: %d\n", name, age)

	// 查询多条数据
	rows, err := db.Query("SELECT id, name, age FROM users")
	if err != nil {
		log.Fatal(err)
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			log.Fatal(err)
		}
	}(rows)

	for rows.Next() {
		var id int64
		var name string
		var age int

		if err := rows.Scan(&id, &name, &age); err != nil {
			log.Fatal(err)
		}

		fmt.Printf("%d %s %d\n", id, name, age)
	}

	if err := rows.Err(); err != nil {
		log.Fatal(err)
	}
}
