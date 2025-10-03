/**
 * 条形码数组管理模块 - 负责FIFO逻辑及去重提示
 * 高度解耦的历史记录管理模块
 */
class BarcodeHistoryModule {
    constructor(maxSize = 10) {
        this.maxSize = maxSize;
        this.history = this.loadHistory();
        this.observers = [];
    }

    /**
     * 从本地存储加载历史记录
     * @returns {Array<Object>}
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('barcodeHistory');
            if (saved) {
                const parsed = JSON.parse(saved);
                // 确保历史记录格式正确
                return parsed.filter(item => 
                    item && 
                    typeof item.barcode === 'string' && 
                    item.timestamp
                ).slice(0, this.maxSize);
            }
        } catch (error) {
            console.warn('加载历史记录失败:', error);
        }
        return [];
    }

    /**
     * 保存历史记录到本地存储
     */
    saveHistory() {
        try {
            localStorage.setItem('barcodeHistory', JSON.stringify(this.history));
        } catch (error) {
            console.warn('保存历史记录失败:', error);
        }
    }

    /**
     * 检查条形码是否已存在
     * @param {string} barcode - 条形码
     * @returns {boolean}
     */
    isDuplicate(barcode) {
        return this.history.some(item => item.barcode === barcode);
    }

    /**
     * 添加条形码到历史记录
     * @param {string} barcode - 条形码
     * @param {Object} metadata - 额外的元数据
     * @returns {boolean} 是否成功添加（false表示重复）
     */
    addBarcode(barcode, metadata = {}) {
        if (this.isDuplicate(barcode)) {
            return false; // 重复的条形码
        }

        const newItem = {
            barcode: barcode,
            timestamp: new Date().toISOString(),
            addedAt: new Date().toLocaleString('zh-CN'),
            ...metadata
        };

        // FIFO: 如果达到最大长度，移除最老的记录
        if (this.history.length >= this.maxSize) {
            this.history.shift(); // 移除第一个（最老的）
        }

        // 添加新记录到末尾
        this.history.push(newItem);
        
        // 保存到本地存储
        this.saveHistory();
        
        // 通知观察者
        this.notifyObservers('add', newItem);
        
        return true;
    }

    /**
     * 获取历史记录列表
     * @returns {Array<Object>}
     */
    getHistory() {
        return [...this.history]; // 返回副本，防止外部修改
    }

    /**
     * 获取最近的条形码
     * @param {number} count - 获取数量
     * @returns {Array<Object>}
     */
    getRecentBarcodes(count = 5) {
        return this.history.slice(-count).reverse(); // 最新的在前
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        const oldHistory = [...this.history];
        this.history = [];
        this.saveHistory();
        this.notifyObservers('clear', oldHistory);
    }

    /**
     * 删除指定的条形码记录
     * @param {string} barcode - 要删除的条形码
     * @returns {boolean} 是否删除成功
     */
    removeBarcode(barcode) {
        const index = this.history.findIndex(item => item.barcode === barcode);
        if (index !== -1) {
            const removedItem = this.history.splice(index, 1)[0];
            this.saveHistory();
            this.notifyObservers('remove', removedItem);
            return true;
        }
        return false;
    }

    /**
     * 获取历史记录统计信息
     * @returns {Object}
     */
    getStats() {
        return {
            total: this.history.length,
            maxSize: this.maxSize,
            oldestTimestamp: this.history.length > 0 ? this.history[0].timestamp : null,
            newestTimestamp: this.history.length > 0 ? this.history[this.history.length - 1].timestamp : null
        };
    }

    /**
     * 添加观察者
     * @param {Function} observer - 观察者函数
     */
    addObserver(observer) {
        this.observers.push(observer);
    }

    /**
     * 移除观察者
     * @param {Function} observer - 观察者函数
     */
    removeObserver(observer) {
        const index = this.observers.indexOf(observer);
        if (index !== -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * 通知所有观察者
     * @param {string} action - 动作类型
     * @param {*} data - 数据
     */
    notifyObservers(action, data) {
        this.observers.forEach(observer => {
            try {
                observer(action, data, this.getStats());
            } catch (error) {
                console.warn('观察者通知失败:', error);
            }
        });
    }

    /**
     * 搜索历史记录
     * @param {string} query - 搜索关键词
     * @returns {Array<Object>}
     */
    searchHistory(query) {
        if (!query.trim()) {
            return this.getHistory();
        }
        
        const lowerQuery = query.toLowerCase();
        return this.history.filter(item => 
            item.barcode.toLowerCase().includes(lowerQuery)
        );
    }
}

export default BarcodeHistoryModule;