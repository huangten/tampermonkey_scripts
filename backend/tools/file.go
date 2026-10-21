package tools

import (
	"errors"
	"os"
)

// FileExists 判断文件或目录是否存在
func FileExists(path string) bool {
	_, err := os.Stat(path)
	if err == nil {
		return true // 文件存在，且没有错误
	}
	if errors.Is(err, os.ErrNotExist) {
		return false // 明确文件不存在
	}
	// 走到这里说明有其他错误（例如：权限不足等），此时通常也认为文件不可用
	return false
}

