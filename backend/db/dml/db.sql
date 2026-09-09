create table books
(
    id         integer primary key autoincrement,
    name       text    NOT NULL DEFAULT '',
    author     text    NOT NULL DEFAULT '',
    source     text    NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);


create table catalogs
(
    id         integer primary key autoincrement,
    name       text    not null,
    book_id    integer not null,
    parent_id  integer          default 0,
    sort       integer not null default 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

create table chapters
(
    id         integer primary key autoincrement,
    catalog_id integer not null,
    content    text    NOT NULL DEFAULT '',
    is_chapter integer          default 0,
    source_href        NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);