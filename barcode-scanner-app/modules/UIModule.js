/**
 * UI界面模块 - 负责页面布局与交互
 * 高度解耦的用户界面管理模块
 */
class UIModule {
    constructor() {
        this.elements = {};
        this.eventHandlers = {};
        this.statusTimer = null;
    }

    /**
     * 初始化UI模块
     */
    init() {
        this.bindElements();
        this.setupEventListeners();
        this.loadSettings();
    }

    /**
     * 绑定DOM元素
     */
    bindElements() {
        this.elements = {
            scanBtn: document.getElementById('scanBtn'),
            statusMessage: document.getElementById('statusMessage'),
            historyList: document.getElementById('historyList'),
            attentionList: document.getElementById('attentionList'),
            apiUrl: document.getElementById('apiUrl')
        };

        // 检查必要元素是否存在
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                console.warn(`UI元素未找到: ${key}`);
            }
        });
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 扫描按钮点击事件
        if (this.elements.scanBtn) {
            this.elements.scanBtn.addEventListener('click', () => {
                this.triggerEvent('scan');
            });
        }

        // 注意单号文本框变化事件
        if (this.elements.attentionList) {
            this.elements.attentionList.addEventListener('input', (e) => {
                this.triggerEvent('attentionListChange', e.target.value);
            });

            // 防抖处理，避免频繁触发
            let debounceTimer;
            this.elements.attentionList.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.triggerEvent('attentionListSave', e.target.value);
                }, 500);
            });
        }

        // API地址变化事件
        if (this.elements.apiUrl) {
            this.elements.apiUrl.addEventListener('change', (e) => {
                this.triggerEvent('apiUrlChange', e.target.value);
                this.saveSettings();
            });
        }

        // 历史记录点击事件
        if (this.elements.historyList) {
            this.elements.historyList.addEventListener('click', (e) => {
                if (e.target.classList.contains('history-item')) {
                    const barcode = e.target.dataset.barcode;
                    if (barcode) {
                        this.triggerEvent('historyItemClick', barcode);
                    }
                }
            });
        }
    }

    /**
     * 显示状态消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型: success, warning, error, info
     * @param {number} duration - 显示持续时间（毫秒），0表示不自动消失
     */
    showStatus(message, type = 'info', duration = 3000) {
        if (!this.elements.statusMessage) return;

        // 清除之前的定时器
        if (this.statusTimer) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }

        // 移除之前的样式类
        this.elements.statusMessage.className = 'status-message';
        
        // 添加新的样式类
        this.elements.statusMessage.classList.add(`status-${type}`);
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.style.display = 'block';

        // 设置自动消失
        if (duration > 0) {
            this.statusTimer = setTimeout(() => {
                this.hideStatus();
            }, duration);
        }

        // 触发状态改变事件
        this.triggerEvent('statusChange', { message, type, duration });
    }

    /**
     * 隐藏状态消息
     */
    hideStatus() {
        if (this.elements.statusMessage) {
            this.elements.statusMessage.style.display = 'none';
            this.elements.statusMessage.textContent = '';
            this.elements.statusMessage.className = 'status-message';
        }

        if (this.statusTimer) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }
    }

    /**
     * 更新扫描按钮状态
     * @param {boolean} isScanning - 是否正在扫描
     */
    updateScanButton(isScanning) {
        if (!this.elements.scanBtn) return;

        if (isScanning) {
            this.elements.scanBtn.disabled = true;
            this.elements.scanBtn.textContent = '扫描中...';
            this.elements.scanBtn.style.cursor = 'not-allowed';
        } else {
            this.elements.scanBtn.disabled = false;
            this.elements.scanBtn.textContent = '开始扫描';
            this.elements.scanBtn.style.cursor = 'pointer';
        }
    }

    /**
     * 更新历史记录显示
     * @param {Array<Object>} history - 历史记录数组
     */
    updateHistory(history) {
        if (!this.elements.historyList) return;

        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<div class="history-item">暂无扫描记录</div>';
            return;
        }

        // 显示最新的记录在前面
        const reversedHistory = [...history].reverse();
        
        this.elements.historyList.innerHTML = reversedHistory.map(item => 
            `<div class="history-item" data-barcode="${item.barcode}" title="点击复制: ${item.barcode}">
                <div style="font-weight: bold;">${item.barcode}</div>
                <div style="font-size: 12px; color: #666; margin-top: 2px;">${item.addedAt}</div>
            </div>`
        ).join('');
    }

    /**
     * 更新注意单号文本框
     * @param {string} text - 注意单号文本
     */
    updateAttentionList(text) {
        if (this.elements.attentionList && this.elements.attentionList.value !== text) {
            this.elements.attentionList.value = text;
        }
    }

    /**
     * 获取API地址
     * @returns {string}
     */
    getApiUrl() {
        return this.elements.apiUrl ? this.elements.apiUrl.value : '';
    }

    /**
     * 设置API地址
     * @param {string} url - API地址
     */
    setApiUrl(url) {
        if (this.elements.apiUrl) {
            this.elements.apiUrl.value = url;
        }
    }

    /**
     * 获取注意单号文本
     * @returns {string}
     */
    getAttentionText() {
        return this.elements.attentionList ? this.elements.attentionList.value : '';
    }

    /**
     * 添加事件处理器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    /**
     * 移除事件处理器
     * @param {string} event - 事件名称
     * @param {Function} handler - 事件处理函数
     */
    off(event, handler) {
        if (this.eventHandlers[event]) {
            const index = this.eventHandlers[event].indexOf(handler);
            if (index !== -1) {
                this.eventHandlers[event].splice(index, 1);
            }
        }
    }

    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.warn(`事件处理器错误 (${event}):`, error);
                }
            });
        }
    }

    /**
     * 显示确认对话框
     * @param {string} message - 确认消息
     * @returns {boolean}
     */
    showConfirm(message) {
        return confirm(message);
    }

    /**
     * 显示提示对话框
     * @param {string} message - 提示消息
     */
    showAlert(message) {
        alert(message);
    }

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     * @returns {Promise<boolean>}
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 降级处理：使用传统方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'absolute';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            console.warn('复制到剪贴板失败:', error);
            return false;
        }
    }

    /**
     * 保存设置到本地存储
     */
    saveSettings() {
        try {
            const settings = {
                apiUrl: this.getApiUrl()
            };
            localStorage.setItem('uiSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('保存设置失败:', error);
        }
    }

    /**
     * 从本地存储加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('uiSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings.apiUrl) {
                    this.setApiUrl(settings.apiUrl);
                }
            }
        } catch (error) {
            console.warn('加载设置失败:', error);
        }
    }

    /**
     * 添加震动反馈（如果支持）
     * @param {number} duration - 震动时长
     */
    vibrate(duration = 100) {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        // 清除定时器
        if (this.statusTimer) {
            clearTimeout(this.statusTimer);
            this.statusTimer = null;
        }

        // 清除事件处理器
        this.eventHandlers = {};

        // 清除元素引用
        this.elements = {};
    }
}

export default UIModule;