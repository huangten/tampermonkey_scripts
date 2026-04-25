import Dexie from 'dexie';

export class DatabaseService {
    static instance = null;
    db;
    consumerLeaseTtl = 15000;

    constructor() {
        if (DatabaseService.instance) {
            return DatabaseService.instance;
        }

        // 初始化数据库
        this.db = new Dexie(this.getDBName());

        // 定义表结构
        // 语法: '主键, 索引1, 索引2...'
        this.db.version(1).stores({
            chapters: '++id, chapterId, bookId, status, href, chapterName, bookName, volumeName, createTime, updateTime',
            system_infos: '++id, status, lastDownloadTime, consumerPageId, consumerPageLabel, consumerHeartbeat, consumerStartedAt, currentChapterId, currentChapterHref, currentBookName, updateTime'
        });

        DatabaseService.instance = this;
    }

    getDBName() {
        return 'uaa_intro_db';
    }

    async getSystemInfo() {
        let systemInfo = await this.getFirst("system_infos");
        if (!systemInfo) {
            await this.addOne("system_infos", {
                status: 0,
                lastDownloadTime: Date.now(),
                consumerPageId: '',
                consumerPageLabel: '',
                consumerHeartbeat: 0,
                consumerStartedAt: 0,
                currentChapterId: 0,
                currentChapterHref: '',
                currentBookName: '',
                updateTime: Date.now()
            })
        }
        systemInfo = await this.getFirst("system_infos");
        if (systemInfo && typeof systemInfo.consumerPageLabel === 'undefined') {
            await this.updateOne('system_infos', systemInfo.id, {
                consumerPageLabel: '',
                updateTime: Date.now()
            });
            systemInfo = await this.getFirst("system_infos");
        }
        return systemInfo;
    }

    async updateSystemInfoStatus(status) {
        let id = (await this.getSystemInfo()).id;
        await this.updateOne('system_infos', id, {status: status, updateTime: Date.now()});
    }

    async updateSystemInfoLastDownloadTime(lastDownloadTime) {
        let id = (await this.getSystemInfo()).id;
        await this.updateOne('system_infos', id, {lastDownloadTime: lastDownloadTime, updateTime: Date.now()});
    }

    // 将全局下载状态恢复为空闲，供异常后人工点击“继续下载”使用。
    async resetSystemInfoStatus(pageId = '') {
        const systemInfo = await this.getSystemInfo();
        if (pageId && systemInfo.consumerPageId && systemInfo.consumerPageId !== pageId) {
            return false;
        }
        await this.updateOne('system_infos', systemInfo.id, {
            status: 0,
            currentChapterId: 0,
            currentChapterHref: '',
            currentBookName: '',
            updateTime: Date.now()
        });
        return true;
    }

    // 标记全局下载系统进入异常状态，避免 worker 继续自动拉取后续章节。
    async setSystemInfoError(pageId = '') {
        const systemInfo = await this.getSystemInfo();
        if (pageId && systemInfo.consumerPageId && systemInfo.consumerPageId !== pageId) {
            return false;
        }
        await this.updateOne('system_infos', systemInfo.id, {
            status: 2,
            updateTime: Date.now()
        });
        return true;
    }

    // 判断当前 consumer 是否为空、同页或已过期，供抢占和续租统一使用。
    canTakeConsumer(systemInfo, pageId, now = Date.now()) {
        return !systemInfo.consumerPageId
            || systemInfo.consumerPageId === pageId
            || now - (systemInfo.consumerHeartbeat ?? 0) > this.consumerLeaseTtl;
    }

    // 尝试将当前页面设置为唯一消费页；只要租约未过期，其他页面不能接管。
    async tryBecomeConsumer(pageId, pageLabel = '') {
        await this.getSystemInfo();

        return await this.db.transaction('rw', this.db.table('system_infos'), async () => {
            const systemInfo = await this.db.table('system_infos').orderBy('id').first();
            const now = Date.now();
            if (!systemInfo) {
            return {acquired: false, owner: ''};
            }
            if (!this.canTakeConsumer(systemInfo, pageId, now)) {
                return {acquired: false, owner: systemInfo.consumerPageId ?? ''};
            }

            const ownerChanged = systemInfo.consumerPageId !== pageId;
            await this.db.table('system_infos').update(systemInfo.id, {
                consumerPageId: pageId,
                consumerPageLabel: pageLabel,
                consumerHeartbeat: now,
                consumerStartedAt: ownerChanged ? now : (systemInfo.consumerStartedAt ?? now),
                updateTime: now
            });
            return {acquired: true, owner: pageId};
        });
    }

    // 消费页周期性续租；如果租约已丢失则返回 false，让页面主动停掉 worker。
    async renewConsumerHeartbeat(pageId, pageLabel = '') {
        await this.getSystemInfo();

        return await this.db.transaction('rw', this.db.table('system_infos'), async () => {
            const systemInfo = await this.db.table('system_infos').orderBy('id').first();
            const now = Date.now();
            if (!systemInfo || !this.canTakeConsumer(systemInfo, pageId, now)) {
                return false;
            }

            await this.db.table('system_infos').update(systemInfo.id, {
                consumerPageId: pageId,
                consumerPageLabel: pageLabel || systemInfo.consumerPageLabel || '',
                consumerHeartbeat: now,
                consumerStartedAt: systemInfo.consumerPageId === pageId
                    ? (systemInfo.consumerStartedAt ?? now)
                    : now,
                updateTime: now
            });
            return true;
        });
    }

    // 释放当前页面持有的消费权，便于人工停止后由其他页面重新启动接管。
    async releaseConsumer(pageId) {
        const systemInfo = await this.getSystemInfo();
        if (systemInfo.consumerPageId !== pageId) {
            return false;
        }
        await this.updateOne('system_infos', systemInfo.id, {
            consumerPageId: '',
            consumerPageLabel: '',
            consumerHeartbeat: 0,
            consumerStartedAt: 0,
            updateTime: Date.now()
        });
        return true;
    }

    // 手动清理过期 consumer 残留；仅当租约超时后才会重置系统状态。
    async recoverStaleSystemState() {
        const systemInfo = await this.getSystemInfo();
        const now = Date.now();
        const isStaleConsumer = !!systemInfo.consumerPageId
            && (now - (systemInfo.consumerHeartbeat ?? 0) > this.consumerLeaseTtl);

        if (!isStaleConsumer) {
            return {recovered: false, reason: 'active_consumer'};
        }

        await this.updateOne('system_infos', systemInfo.id, {
            status: 0,
            consumerPageId: '',
            consumerPageLabel: '',
            consumerHeartbeat: 0,
            consumerStartedAt: 0,
            currentChapterId: 0,
            currentChapterHref: '',
            currentBookName: '',
            updateTime: now
        });
        return {recovered: true, reason: 'stale_consumer_cleared'};
    }

    // 添加单个章节任务；以 href 作为去重键，已存在时只刷新章节元信息。
    async addChapterIfAbsent(chapter) {
        if (!chapter?.href) {
            return false;
        }

        const now = Date.now();
        const exist = await this.db.table('chapters')
            .where('href')
            .equals(chapter.href)
            .first();

        if (exist) {
            await this.updateOne('chapters', exist.id, {
                chapterId: chapter.chapterId ?? exist.chapterId,
                bookId: chapter.bookId ?? exist.bookId,
                chapterName: chapter.chapterName ?? exist.chapterName,
                bookName: chapter.bookName ?? exist.bookName,
                volumeName: chapter.volumeName ?? exist.volumeName,
                updateTime: now
            });
            return false;
        }

        await this.addOne('chapters', {
            chapterId: chapter.chapterId ?? chapter.id ?? '',
            bookId: chapter.bookId ?? '',
            status: 0,
            href: chapter.href,
            chapterName: chapter.chapterName ?? chapter.title ?? '',
            bookName: chapter.bookName ?? '',
            volumeName: chapter.volumeName ?? '',
            createTime: now,
            updateTime: now
        });
        return true;
    }

    // 批量添加章节任务，并返回新增和重复数量，方便页面提示。
    async addChaptersIfAbsent(chapters) {
        let added = 0;
        let duplicated = 0;
        for (const chapter of chapters) {
            if (await this.addChapterIfAbsent(chapter)) {
                added++;
            } else {
                duplicated++;
            }
        }
        return {added, duplicated};
    }

    // 抢占下一条待下载章节；只有全局状态为空闲时才会把系统状态切到下载中。
    async claimNextChapterForDownload(pageId) {
        await this.getSystemInfo();

        return await this.db.transaction('rw', this.db.table('system_infos'), this.db.table('chapters'), async () => {
            const systemInfo = await this.db.table('system_infos').orderBy('id').first();
            const now = Date.now();
            if (!systemInfo
                || systemInfo.status !== 0
                || !this.canTakeConsumer(systemInfo, pageId, now)
                || systemInfo.consumerPageId !== pageId) {
                return null;
            }

            const chapter = await this.db.table('chapters')
                .where('status')
                .equals(0)
                .first();

            if (!chapter) {
                return null;
            }

            await this.db.table('system_infos').update(systemInfo.id, {
                status: 1,
                consumerHeartbeat: now,
                currentChapterId: chapter.id,
                currentChapterHref: chapter.href,
                currentBookName: chapter.bookName ?? '',
                updateTime: now
            });

            return chapter;
        });
    }

    // 标记章节下载成功，同时释放全局下载状态并记录最后一次正常下载时间。
    async markChapterDownloaded(id, pageId, lastDownloadTime = Date.now()) {
        await this.db.transaction('rw', this.db.table('system_infos'), this.db.table('chapters'), async () => {
            await this.db.table('chapters').update(id, {
                status: 1,
                updateTime: lastDownloadTime
            });

            const systemInfo = await this.db.table('system_infos').orderBy('id').first();
            if (systemInfo && systemInfo.consumerPageId === pageId) {
                await this.db.table('system_infos').update(systemInfo.id, {
                    status: 0,
                    lastDownloadTime,
                    consumerHeartbeat: lastDownloadTime,
                    currentChapterId: 0,
                    currentChapterHref: '',
                    currentBookName: '',
                    updateTime: lastDownloadTime
                });
            }
        });
    }

    // 下载流程捕获到异常时调用，将系统停在需要人工处理的状态。
    async markDownloadError(pageId = '') {
        return await this.setSystemInfoError(pageId);
    }

    // 清除尚未下载的排队章节，保留已经下载成功的历史记录。
    async deletePendingChapters() {
        return await this.db.table('chapters')
            .where('status')
            .equals(0)
            .delete();
    }

    // 清除已经下载完成的章节记录，只保留仍待下载的任务。
    async deleteDownloadedChapters() {
        return await this.db.table('chapters')
            .where('status')
            .equals(1)
            .delete();
    }

    // 统计待下载和已下载数量，用于页面进度条显示。
    async getChapterStats() {
        const pending = await this.db.table('chapters')
            .where('status')
            .equals(0)
            .count();
        const downloaded = await this.db.table('chapters')
            .where('status')
            .equals(1)
            .count();
        return {
            pending,
            downloaded,
            total: pending + downloaded
        };
    }

    // 调试面板读取指定表数据。
    async getDebugRows(tableName) {
        if (!this.db.tables.map(table => table.name).includes(tableName)) {
            return [];
        }
        return await this.db.table(tableName).toArray();
    }

    // 调试面板批量删除指定表数据。
    async deleteDebugRows(tableName, ids) {
        if (!Array.isArray(ids) || ids.length === 0) {
            return 0;
        }
        await this.db.table(tableName).bulkDelete(ids);
        return ids.length;
    }

    // --- 增 (Create) ---
    async addOne(tableName, data) {
        return await this.db.table(tableName).add(data);
    }

    async addBulk(tableName, dataArray) {
        return this.db.table(tableName).bulkAdd(dataArray);
    }

    // --- 删 (Delete) ---
    async deleteOne(tableName, id) {
        return await this.db.table(tableName).delete(id);
    }

    async deleteBulk(tableName, idArray) {
        return this.db.table(tableName).bulkDelete(idArray);
    }

    // --- 改 (Update) ---
    async updateOne(tableName, id, changes) {
        // changes 为包含更新字段的对象，如 { name: 'New Name' }
        return await this.db.table(tableName).update(id, changes);
    }

    // --- 查 (Read) ---
    // 检查单条数据是否存在 (基于主键)
    async exists(tableName, id) {
        const item = await this.db.table(tableName).get(id);
        return !!item;
    }

    // 批量检查数据是否存在 (返回存在的 ID 数组)
    async existsBulk(tableName, idArray) {
        const items = await this.db.table(tableName)
            .where(':id').anyOf(idArray)
            .toArray();
        return items.map(item => item.id);
    }

    async getFirst(tableName) {
        return this.db.table(tableName).orderBy('id').first();
    }

    // 获取单条数据
    async getOne(tableName, id) {
        return await this.db.table(tableName).get(id);
    }

    // 分页查询
    async getPaged(tableName, pageNum = 1, pageSize = 10) {
        const offset = (pageNum - 1) * pageSize;
        return await this.db.table(tableName)
            .offset(offset)
            .limit(pageSize)
            .toArray();
    }
}

// 导出单例
// const dbService = new DatabaseService();
// Object.freeze(dbService);
// export default dbService;
