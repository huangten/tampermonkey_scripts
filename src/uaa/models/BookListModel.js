export class BookListModel {
    constructor(doc = document, location = document.location) {
        this.doc = doc;
        this.location = location;
    }

    getBookTree() {
        const menus = [];
        const links = this.doc.querySelectorAll(".cover_box > a");
        for (let index = 0; index < links.length; index++) {
            menus.push(this.createBookNode(links[index], index));
        }
        return menus;
    }

    getBookTreeWithCheckedIds(checkedIds = []) {
        const checkedIdSet = new Set(checkedIds.map(id => String(id)));
        return this.getBookTree().map(book => ({
            ...book,
            checked: checkedIdSet.has(String(book.id))
        }));
    }

    applySelection(type, checkedIds = []) {
        const all = this.getBookTreeWithCheckedIds(checkedIds);

        switch (type) {
            case "全选":
                all.forEach(book => {
                    book.checked = true;
                });
                break;
            case "1-12":
                this.toggleRange(all, 0, 12);
                break;
            case "13-24":
                this.toggleRange(all, 12, 24);
                break;
            case "25-36":
                this.toggleRange(all, 24, 36);
                break;
            case "37-49":
                this.toggleRange(all, 36, 49);
                break;
        }

        return all;
    }

    toggleBook(clickedBook, checkedIds = []) {
        const all = this.getBookTreeWithCheckedIds(checkedIds);
        return all.map(book => {
            if (String(book.id) !== String(clickedBook.id)) {
                return book;
            }
            return {
                ...book,
                checked: !clickedBook.checked
            };
        });
    }

    createBookNode(link, index) {
        const coverImg = link.getElementsByTagName('img')[0];
        return {
            id: this.getBookId(link.href, index),
            title: link.title,
            href: link.href,
            spread: true,
            field: "",
            checked: false,
            cover_href: coverImg ? coverImg.src : ''
        };
    }

    getBookId(href, index) {
        try {
            const params = new URL(href, this.location.href).searchParams;
            return params.get('id') ?? href ?? String(index);
        } catch (e) {
            return String(index);
        }
    }

    toggleRange(books, start, end) {
        for (let i = 0; i < books.length; i++) {
            if (i >= start && i < end) {
                books[i].checked = !books[i].checked;
            }
        }
    }
}
