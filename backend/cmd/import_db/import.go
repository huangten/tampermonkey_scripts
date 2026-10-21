package main

import (
	"backend/db/sqlite"
	"backend/models"
	"backend/tools"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func main() {
	db := sqlite.NewGormDB()
	ctx := context.Background()
	err := db.AutoMigrate(&models.Chapter{})
	if err != nil {
		return
	}
	jsonName := "chapters_20261021_144736.json"
	if !tools.FileExists(jsonName) {
		log.Panic("file not exists")
	}

	jsonFile, err := os.Open(jsonName)
	if err != nil {
		log.Panic(err)
	}
	defer func(jsonFile *os.File) {
		err := jsonFile.Close()
		if err != nil {

		}
	}(jsonFile)

	decoder := json.NewDecoder(jsonFile)
	// 跳过最外层的左中括号 `[`
	if _, err := decoder.Token(); err != nil {
		return
	}

	batchSize := 1000 // 凑满 1000 条处理后的数据再批量写入
	buffer := make([]models.Chapter, 0, batchSize)
	totalCount := 0

	// 4. 核心循环：边读边处理
	for decoder.More() {
		var src models.Chapter
		// 读出原始的一条 JSON 数据（此时全是字符串，绝对不会报 unmarshal 错误）
		if err := decoder.Decode(&src); err != nil {
			fmt.Printf("解析 JSON 失败: %v\n", err)
			return
		}

		// 💡 调用处理函数转换数据
		processedData, err := processData(&src)
		if err != nil {
			fmt.Printf("数据处理失败，跳过该条: %v\n", err)
			continue
		}

		// 将处理好的结构体放入缓存
		buffer = append(buffer, *processedData)
		totalCount++

		// 满 1000 条打包写入
		if len(buffer) >= batchSize {
			err := db.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "id"}}, // 依据主键判断冲突
				DoNothing: true,                          // 冲突的跳过，不冲突的正常创建
			}).Create(&buffer).Error
			if err != nil {
				fmt.Println(err)
			}
			buffer = buffer[:0] // 复用内存
			fmt.Printf("已处理并导入 %d 条数据...\n", totalCount)
		}
	}

	// 5. 处理最后一批剩余数据
	if len(buffer) > 0 {
		err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id"}}, // 依据主键判断冲突
			DoNothing: true,                          // 冲突的跳过，不冲突的正常创建
		}).Create(&buffer).Error
		if err != nil {
			fmt.Println(err)
		}
	}

	fmt.Printf("🎉 %d 万条数据清洗、处理并导入成功！总计：%d 条。\n", totalCount, totalCount)

	firstChapter, err := gorm.G[models.Chapter](db).First(ctx)
	if err != nil {
		log.Panic(err)
	}

	fmt.Printf("%#v\n", firstChapter)

}

// 3. 数据处理函数：在这里编写你的业务处理逻辑
func processData(source *models.Chapter) (*models.Chapter, error) {
	if strings.Contains(source.ChapterName, "\n") || strings.Contains(source.ChapterName, "\r") {
		chapterNames := strings.Split(source.ChapterName, "\n")
		if len(chapterNames) > 1 {
			source.ChapterName = strings.TrimSpace(chapterNames[0])
		}
	}

	return source, nil
}
