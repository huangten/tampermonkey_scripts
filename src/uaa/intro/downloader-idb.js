/*************************************************
 * downloader-idb.js
 *************************************************/

const DB_NAME = 'chapter_downloader_db';
const DB_VERSION = 1;
const PAGE_ID = crypto.randomUUID();
const LOCK_TTL = 15000;
const META_KEY = "meta-key";

/* ========== utils ========== */

export const sleep = ms => new Promise(r => setTimeout(r, ms));

function reqToPromise(req) {
    return new Promise((res, rej) => {
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
    });
}

/* ========== IndexedDB ========== */

async function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = e => {
            const db = e.target.result;

            if (!db.objectStoreNames.contains('download_queue')) {
                const store = db.createObjectStore('download_queue', {keyPath: 'key'});
                store.createIndex('status', 'status');
            }

            if (!db.objectStoreNames.contains('meta')) {
                db.createObjectStore('meta', {keyPath: 'key'});
            }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

/* ========== Queue API（多页面写入） ========== */

export async function enqueueTask(task, uniqueKey = t => t?.href) {
    const db = await openDB();
    const key = uniqueKey(task);
    if (!key) return false;

    const tx = db.transaction('download_queue', 'readwrite');
    const store = tx.objectStore('download_queue');

    const exist = await reqToPromise(store.get(key));
    if (exist) return false;

    store.put({
        key,
        task,
        status: 'pending',
        owner: null,
        heartbeat: null,
        retry: 0,
        updatedAt: Date.now()
    });

    return true;
}

/* ========== 全局锁（单消费者） ========== */

export async function tryAcquireLock() {
    const db = await openDB();
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');

    const lock = await reqToPromise(store.get('lock'));
    const now = Date.now();

    if (!lock || now - lock.heartbeat > LOCK_TTL) {
        store.put({
            key: 'lock',
            owner: PAGE_ID,
            heartbeat: now
        });
        return true;
    }

    return lock.owner === PAGE_ID;
}

export async function heartbeatLock() {
    const db = await openDB();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({
        key: 'lock',
        owner: PAGE_ID,
        heartbeat: Date.now()
    });
}

/* ========== 风控暂停 ========== */

export async function pauseAll(reason = 'risk-control') {
    const db = await openDB();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({
        key: 'pause',
        value: true,
        reason
    });
}

export async function resumeAll() {
    const db = await openDB();
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({
        key: 'pause',
        value: false
    });
}

export async function isPaused() {
    const db = await openDB();
    const tx = db.transaction('meta', 'readonly');
    const r = await reqToPromise(tx.objectStore('meta').get('pause'));
    return r?.value === true;
}

/* ========== Consumer（只调度） ========== */

async function claimOneTask() {
    const db = await openDB();
    const tx = db.transaction('download_queue', 'readwrite');
    const store = tx.objectStore('download_queue');
    const index = store.index('status');

    const cursor = await reqToPromise(index.openCursor('pending'));
    if (!cursor) return null;

    const record = cursor.value;
    record.status = 'claimed';
    record.owner = PAGE_ID;
    record.updatedAt = Date.now();

    cursor.update(record);
    return record;
}

/* ========== Executor（长任务执行器） ========== */

export class TaskExecutor {
    constructor(downloadHandler) {
        this.downloadHandler = downloadHandler;
        this.running = false;
    }

    async run(record) {
        if (this.running) return;
        this.running = true;

        const controller = new AbortController();
        const {signal} = controller;

        const heartbeatTimer = setInterval(() => {
            this._heartbeat(record.key);
        }, 3000);

        const pauseWatcher = setInterval(async () => {
            if (await isPaused()) {
                controller.abort();
            }
        }, 1000);

        try {
            await this._markRunning(record);

            await this.downloadHandler(record.task, signal);

            clearInterval(heartbeatTimer);
            clearInterval(pauseWatcher);

            await this._markDone(record.key);

        } catch (e) {
            clearInterval(heartbeatTimer);
            clearInterval(pauseWatcher);

            if (signal.aborted) {
                await this._rollback(record.key);
            } else {
                await this._markFailed(record.key);
            }
        } finally {
            this.running = false;
        }
    }

    async _heartbeat(key) {
        const db = await openDB();
        const tx = db.transaction('download_queue', 'readwrite');
        const store = tx.objectStore('download_queue');

        const r = await reqToPromise(store.get(key));
        if (r && r.status === 'running') {
            r.heartbeat = Date.now();
            store.put(r);
        }
    }

    async _markRunning(record) {
        const db = await openDB();
        const tx = db.transaction('download_queue', 'readwrite');
        record.status = 'running';
        record.heartbeat = Date.now();
        tx.objectStore('download_queue').put(record);
    }

    async _rollback(key) {
        const db = await openDB();
        const tx = db.transaction('download_queue', 'readwrite');
        const r = await reqToPromise(tx.objectStore('queue').get(key));
        if (!r) return;

        r.status = 'pending';
        r.owner = null;
        r.heartbeat = null;
        tx.objectStore('download_queue').put(r);
    }

    async _markDone(key) {
        const db = await openDB();
        const tx = db.transaction('download_queue', 'readwrite');
        const r = await reqToPromise(tx.objectStore('download_queue').get(key));
        if (!r) return;

        r.status = 'done';
        r.owner = null;
        tx.objectStore('download_queue').put(r);
    }

    async _markFailed(key) {
        const db = await openDB();
        const tx = db.transaction('download_queue', 'readwrite');
        const r = await reqToPromise(tx.objectStore('download_queue').get(key));
        if (!r) return;

        r.status = 'failed';
        r.retry++;
        r.owner = null;
        tx.objectStore('download_queue').put(r);
    }
}

/* ========== 主消费循环（入口） ========== */

export async function startConsumer(downloadHandler) {
    if (!(await tryAcquireLock())) return;

    setInterval(heartbeatLock, 3000);

    const executor = new TaskExecutor(downloadHandler);

    while (true) {
        if (await isPaused()) {
            await sleep(1000);
            continue;
        }

        const task = await claimOneTask();
        if (!task) {
            await sleep(500);
            continue;
        }

        executor.run(task);
        await sleep(100);
    }
}
