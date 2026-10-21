package models

type Chapter struct {
	ID          uint   `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	ChapterId   string `gorm:"type:text;column:chapterId" json:"chapterId"`
	BookId      string `gorm:"type:text;column:bookId" json:"bookId"`
	Status      int    `gorm:"type:INTEGER;column:status" json:"status"`
	Href        string `gorm:"type:text;column:href" json:"href"`
	ChapterName string `gorm:"type:text;column:chapterName" json:"chapterName"`
	BookName    string `gorm:"type:text;column:bookName" json:"bookName"`
	VolumeName  string `gorm:"type:text;column:volumeName" json:"volumeName"`
	CreateTime  int64  `gorm:"type:INTEGER;column:createTime" json:"createTime"`
	UpdateTime  int64  `gorm:"type:INTEGER;column:updateTime" json:"updateTime"`
}
