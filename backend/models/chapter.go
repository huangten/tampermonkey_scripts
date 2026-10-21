package models

import "encoding/json"

type Chapter struct {
	ID          int64          `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	ChapterId   int64          `gorm:"type:INTEGER;column:chapterId" json:"chapterId"`
	BookId      FlexibleString `gorm:"type:text;column:bookId" json:"bookId"`
	Status      int            `gorm:"type:INTEGER;column:status" json:"status"`
	Href        string         `gorm:"index;type:text;column:href" json:"href"`
	ChapterName string         `gorm:"index;type:text;column:chapterName" json:"chapterName"`
	BookName    string         `gorm:"type:text;column:bookName" json:"bookName"`
	VolumeName  string         `gorm:"type:text;column:volumeName" json:"volumeName"`
	CreateTime  int64          `gorm:"type:INTEGER;column:createTime" json:"createTime"`
	UpdateTime  int64          `gorm:"type:INTEGER;column:updateTime" json:"updateTime"`
}

func (Chapter) TableName() string {
	return "chapters"
}

// FlexibleString 1. 定义一个自定义字符串类型
type FlexibleString string

// UnmarshalJSON 2. 实现 UnmarshalJSON 接口，使其既能接收 JSON 里的数字，也能接收字符串
func (fs *FlexibleString) UnmarshalJSON(data []byte) error {
	// 如果是带双引号的字符串
	if data[0] == '"' {
		var s string
		if err := json.Unmarshal(data, &s); err != nil {
			return err
		}
		*fs = FlexibleString(s)
		return nil
	}
	// 如果是纯数字或其他类型，直接原样转为字符串
	*fs = FlexibleString(string(data))
	return nil
}
