/**
 * 注意单号文本框及匹配提示模块
 * 高度解耦的特殊单号管理模块
 */
class AttentionModule {
    constructor() {
        this.attentionList = this.loadAttentionList();
        this.observers = [];
    }

    /**
     * 从本地存储加载注意单号列表
     * @returns {Array<string>}
     */
    loadAttentionList() {
        try {
            const saved = localStorage.getItem('attentionList');
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed.filter(item => 
                    typeof item === 'string' && item.trim().length > 0
                ) : [];
            }
        } catch (error) {
            console.warn('加载注意单号列表失败:', error);
        }
        return [];
    }

    /**
     * 保存注意单号列表到本地存储
     */
    saveAttentionList() {
        try {
            localStorage.setItem('attentionList', JSON.stringify(this.attentionList));
        } catch (error) {
            console.warn('保存注意单号列表失败:', error);
        }
    }

    /**
     * 从文本内容更新注意单号列表
     * @param {string} text - 文本内容，每行一个单号
     */
    updateFromText(text) {
        const lines = text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        // 去重处理
        const uniqueLines = [...new Set(lines)];
        
        const oldList = [...this.attentionList];
        this.attentionList = uniqueLines;
        this.saveAttentionList();
        
        // 通知观察者
        this.notifyObservers('update', {
            oldList: oldList,
            newList: this.attentionList
        });
    }

    /**
     * 获取注意单号列表
     * @returns {Array<string>}
     */
    getAttentionList() {
        return [...this.attentionList]; // 返回副本
    }

    /**
     * 获取注意单号的文本格式
     * @returns {string}
     */
    getAttentionText() {
        return this.attentionList.join('\n');
    }

    /**
     * 检查条形码是否需要注意
     * @param {string} barcode - 条形码
     * @returns {boolean}
     */
    isAttentionRequired(barcode) {
        return this.attentionList.includes(barcode);
    }

    /**
     * 添加单个注意单号
     * @param {string} barcode - 条形码
     * @returns {boolean} 是否成功添加（false表示已存在）
     */
    addAttentionBarcode(barcode) {
        const trimmedBarcode = barcode.trim();
        if (trimmedBarcode.length === 0) {
            return false;
        }
        
        if (this.attentionList.includes(trimmedBarcode)) {
            return false; // 已存在
        }
        
        this.attentionList.push(trimmedBarcode);
        this.saveAttentionList();
        
        this.notifyObservers('add', trimmedBarcode);
        return true;
    }

    /**
     * 移除单个注意单号
     * @param {string} barcode - 条形码
     * @returns {boolean} 是否成功移除
     */
    removeAttentionBarcode(barcode) {
        const index = this.attentionList.indexOf(barcode);
        if (index !== -1) {
            this.attentionList.splice(index, 1);
            this.saveAttentionList();
            
            this.notifyObservers('remove', barcode);
            return true;
        }
        return false;
    }

    /**
     * 清空注意单号列表
     */
    clearAttentionList() {
        const oldList = [...this.attentionList];
        this.attentionList = [];
        this.saveAttentionList();
        
        this.notifyObservers('clear', oldList);
    }

    /**
     * 搜索注意单号
     * @param {string} query - 搜索关键词
     * @returns {Array<string>}
     */
    searchAttentionList(query) {
        if (!query.trim()) {
            return this.getAttentionList();
        }
        
        const lowerQuery = query.toLowerCase();
        return this.attentionList.filter(barcode => 
            barcode.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 获取注意单号统计信息
     * @returns {Object}
     */
    getStats() {
        return {
            total: this.attentionList.length,
            list: this.getAttentionList()
        };
    }

    /**
     * 验证条形码格式
     * @param {string} barcode - 条形码
     * @returns {Object} 验证结果
     */
    validateBarcode(barcode) {
        const trimmed = barcode.trim();
        
        if (trimmed.length === 0) {
            return {
                valid: false,
                message: '条形码不能为空'
            };
        }
        
        if (trimmed.length < 3) {
            return {
                valid: false,
                message: '条形码长度过短'
            };
        }
        
        if (trimmed.length > 50) {
            return {
                valid: false,
                message: '条形码长度过长'
            };
        }
        
        // 检查是否包含特殊字符（可根据实际需求调整）
        const validPattern = /^[A-Za-z0-9\-_]+$/;
        if (!validPattern.test(trimmed)) {
            return {
                valid: false,
                message: '条形码包含非法字符'
            };
        }
        
        return {
            valid: true,
            message: '条形码格式正确'
        };
    }

    /**
     * 批量导入注意单号
     * @param {Array<string>} barcodes - 条形码数组
     * @returns {Object} 导入结果
     */
    batchImport(barcodes) {
        const results = {
            success: [],
            duplicates: [],
            invalid: [],
            total: barcodes.length
        };
        
        barcodes.forEach(barcode => {
            const validation = this.validateBarcode(barcode);
            
            if (!validation.valid) {
                results.invalid.push({
                    barcode: barcode,
                    reason: validation.message
                });
                return;
            }
            
            const trimmed = barcode.trim();
            if (this.attentionList.includes(trimmed)) {
                results.duplicates.push(trimmed);
            } else {
                this.attentionList.push(trimmed);
                results.success.push(trimmed);
            }
        });
        
        if (results.success.length > 0) {
            this.saveAttentionList();
            this.notifyObservers('batchImport', results);
        }
        
        return results;
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
}

export default AttentionModule;