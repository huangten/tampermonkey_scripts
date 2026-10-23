package models

type ChapterContent struct {
	ID         int64  `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	BookName   string `gorm:"index;type:text;column:bookName" json:"bookName"`
	Author     string `gorm:"index;type:text;column:author" json:"author"`
	Title      string `gorm:"index;type:text;column:title" json:"title"`
	Content    string `gorm:"type:blob;column:content" json:"content"`
	CreateTime int64  `gorm:"type:INTEGER;column:createTime" json:"createTime"`
	UpdateTime int64  `gorm:"type:INTEGER;column:updateTime" json:"updateTime"`
}

func (ChapterContent) Table() string {
	return "chapter_contents"
}
