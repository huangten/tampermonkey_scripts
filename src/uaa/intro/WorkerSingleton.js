export class WorkerSingleton {
    static instance = null;
    handleCallBack() {
    }

    constructor() {
        if (WorkerSingleton.instance) {
            return WorkerSingleton.instance;
        }

        const workerCode = `
  let timer = null;
  let interval = 2000;

  self.onmessage = function(e) {
    const { type, payload } = e.data;

    switch (type) {
      case 'START':
        if (timer === null) {
          timer = setInterval(() => {
            self.postMessage({ type: 'TICK', data: { timestamp: Date.now(), interval } });
          }, interval);
        }
        break;
      case 'STOP':
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
        }
        break;
      case 'SET_INTERVAL':
        interval = payload;
        if (timer !== null) {
          // 如果正在运行，重启定时器以应用新间隔
          clearInterval(timer);
          timer = setInterval(() => {
            self.postMessage({ type: 'TICK', data: { timestamp: Date.now(), interval } });
          }, interval);
        }
        break;
      case 'QUERY_INTERVAL':
        self.postMessage({ type: 'INTERVAL_VAL', data: interval });
        break;
    }
  };
`;
        // 初始化 Worker
        const blob = new Blob([workerCode], {type: 'application/javascript'});
        this.worker = new Worker(URL.createObjectURL(blob));

        // 默认的消息处理
        this.worker.onmessage = (e) => {
            this.handleMessage(e.data).then();
        };

        WorkerSingleton.instance = this;
    }

    // 外部可以覆盖此方法或通过回调处理
    async handleMessage(response) {
        const {type, data} = response;

        switch (type) {
            case 'TICK':
                console.log(`[主线程接收] 心跳检测:`, data);
                await this.handleCallBack();
                break;
            case 'INTERVAL_VAL':
                console.log(`[主线程接收] 当前间隔时间为: ${data}ms`);
                break;
        }
    }

    // --- 接口方法 ---

    start() {
        this.worker.postMessage({type: 'START'});
    }

    stop() {
        this.worker.postMessage({type: 'STOP'});
    }

    updateInterval(ms) {
        this.worker.postMessage({type: 'SET_INTERVAL', payload: ms});
    }

    queryInterval() {
        this.worker.postMessage({type: 'QUERY_INTERVAL'});
    }

    terminate() {
        this.worker.terminate();
        WorkerSingleton.instance = null;
    }
}