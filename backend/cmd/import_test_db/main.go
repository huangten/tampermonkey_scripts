package main

import (
	"backend/tools"
	"bufio"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

// 读取单个 TXT 文件，按行解析为数组
func readTxt(path string) ([]string, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer func(file *os.File) {
		_ = file.Close()
	}(file)

	var lines []string
	reader := bufio.NewReader(file)

	for {
		line, err := reader.ReadString('\n')

		// 去掉行尾换行符和首尾空白
		line = strings.TrimSpace(line)
		if line != "" {
			lines = append(lines, line)
		}

		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}
	}

	return lines, nil
}

// 遍历目录下所有 TXT 文件
func readTxtDir(dir string) error {
	return filepath.WalkDir(dir, func(
		path string,
		entry os.DirEntry,
		err error,
	) error {
		if err != nil {
			return err
		}

		// 只处理 TXT 文件，不区分扩展名大小写
		if !strings.EqualFold(filepath.Ext(entry.Name()), ".txt") {
			return nil
		}

		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		splitter := "============================================="
		contents := strings.Split(string(data), splitter)

		skipLines := []string{"author:", "book name:", "title:", "text:"}

		for _, content := range contents {
			//fmt.Println(i)
			lineContents := strings.Split(content, "\n")
			lines := make([]string, 0)
			// 去掉第一行和空行
			for _, lineContent := range lineContents {
				//fmt.Printf("lineContent: %s\n", lineContent)
				if strings.TrimSpace(lineContent) == "" || slices.Contains(skipLines, lineContent) {
					continue
				}
				lines = append(lines, lineContent)
			}

			fmt.Printf("lines: %s\n", strings.Join(lines, "="))
		}

		//fmt.Println(contents[0], len(contents))
		return nil
	})
}

func main() {
	//db := sqlite.NewTestGormDB()
	//ctx := context.Background()
	//db.AutoMigrate(&models.ChapterContent{})

	dirs := []string{
		`D:\MyDevEnv\Projects\uaaVipNovelColectArchive01\book_text`,
		`D:\MyDevEnv\Projects\uaaVipNovelColectArchive02\book_text`,
	}

	for _, dir := range dirs {
		if !tools.DirExists(dir) {
			continue
		}
		if err := readTxtDir(dir); err != nil {
			fmt.Printf("遍历目录失败：%v\n", err)
		}
	}

}
