import Dexie from 'dexie';

export class DatabaseService {
    static instance = null;
    db;

    constructor() {
        if (DatabaseService.instance) {
            return DatabaseService.instance;
        }

        // 初始化数据库
        this.db = new Dexie(this.getDBName());

        // 定义表结构
        // 语法: '主键, 索引1, 索引2...'
        this.db.version(1).stores({
            chapters: '++id,chapterId, bookId, status, href, chapterName, booName, createTime, updateTime',
            system_infos: '++id, status, lastDownloadTime, updateTime'
        });

        DatabaseService.instance = this;
    }

    getDBName() {
        return 'uaa_intro_db';
    }

    async getSystemInfo() {
        let systemInfo = await this.getFirst("system_infos");
        if (!systemInfo) {
            await this.addOne("system_infos", {status: 0, lastDownloadTime: Date.now(), updateTime: Date.now()})
        }
        systemInfo = await this.getFirst("system_infos");
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