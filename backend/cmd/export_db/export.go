package main

import (
	"backend/db/sqlite"
	"backend/models"
	"context"
	"encoding/json"
	"log"
	"os"
	"time"

	"gorm.io/gorm"
)

func main() {
	db := sqlite.NewGormDB()
	ctx := context.Background()

	var chapters []models.Chapter
	chapters, err := gorm.G[models.Chapter](db).Find(ctx)
	if err != nil {
		log.Panic(err)
	}

	now := time.Now()
	currentTime := now.Format("20060102_150405")
	// 创建或打开文件
	file, err := os.Create("chapters_" + currentTime + "_export.json")
	if err != nil {
		panic(err)
	}
	defer func(file *os.File) {
		err := file.Close()
		if err != nil {

		}
	}(file)

	// 创建 Encoder 并设置缩进
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")

	// 流式写入文件
	if err := encoder.Encode(chapters); err != nil {
		panic(err)
	}
}
