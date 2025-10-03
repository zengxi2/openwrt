/**
 * 主应用入口文件 - 组合所有解耦模块
 * 条形码扫描器应用程序
 */
import ScanModule from '../../modules/ScanModule.js';
import BarcodeHistoryModule from '../../modules/BarcodeHistoryModule.js';
import AttentionModule from '../../modules/AttentionModule.js';
import UIModule from '../../modules/UIModule.js';

class BarcodeScanner {
    constructor() {
        // 初始化各个模块
        this.scanModule = new ScanModule();
        this.historyModule = new BarcodeHistoryModule();
        this.attentionModule = new AttentionModule();
        this.uiModule = new UIModule();
        
        // 应用状态
        this.isInitialized = false;
    }

    /**
     * 初始化应用程序
     */
    async init() {
        try {
            console.log('正在初始化条形码扫描器...');
            
            // 初始化UI模块
            this.uiModule.init();
            
            // 设置模块间的通信
            this.setupModuleCommunication();
            
            // 设置事件监听
            this.setupEventListeners();
            
            // 初始化UI显示
            this.initializeUI();
            
            this.isInitialized = true;
            console.log('条形码扫描器初始化完成');
            
            this.uiModule.showStatus('应用程序已就绪', 'success', 2000);
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.uiModule.showStatus('初始化失败: ' + error.message, 'error', 5000);
        }
    }

    /**
     * 设置模块间的通信
     */
    setupModuleCommunication() {
        // 历史记录模块观察者
        this.historyModule.addObserver((action, data) => {
            console.log('历史记录更新:', action, data);
            this.uiModule.updateHistory(this.historyModule.getHistory());
        });

        // 注意单号模块观察者
        this.attentionModule.addObserver((action, data) => {
            console.log('注意单号更新:', action, data);
            // 可以在这里添加其他响应逻辑
        });
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 扫描按钮点击事件
        this.uiModule.on('scan', () => {
            this.handleScan();
        });

        // 注意单号文本变化事件
        this.uiModule.on('attentionListSave', (text) => {
            this.attentionModule.updateFromText(text);
        });

        // API地址变化事件
        this.uiModule.on('apiUrlChange', (url) => {
            this.scanModule.setApiUrl(url);
        });

        // 历史记录项点击事件
        this.uiModule.on('historyItemClick', (barcode) => {
            this.handleHistoryItemClick(barcode);
        });
    }

    /**
     * 初始化UI显示
     */
    initializeUI() {
        // 更新历史记录显示
        this.uiModule.updateHistory(this.historyModule.getHistory());
        
        // 更新注意单号显示
        this.uiModule.updateAttentionList(this.attentionModule.getAttentionText());
        
        // 设置API地址
        const apiUrl = this.uiModule.getApiUrl();
        if (apiUrl) {
            this.scanModule.setApiUrl(apiUrl);
        }
    }

    /**
     * 处理扫描操作
     */
    async handleScan() {
        if (!this.isInitialized) {
            this.uiModule.showStatus('应用程序尚未完全初始化', 'warning');
            return;
        }

        if (this.scanModule.getIsScanning()) {
            this.uiModule.showStatus('正在扫描中，请等待...', 'info');
            return;
        }

        try {
            // 更新UI状态
            this.uiModule.updateScanButton(true);
            this.uiModule.showStatus('正在启动扫描...', 'info');
            this.uiModule.vibrate(50); // 触觉反馈

            // 执行扫描
            const result = await this.scanModule.scanAndUpload();
            const barcode = result.barcode;

            console.log('扫描结果:', result);

            // 检查是否为重复条形码
            if (this.historyModule.isDuplicate(barcode)) {
                this.uiModule.showStatus('单号已扫描过', 'warning', 3000);
                this.uiModule.vibrate([100, 50, 100]); // 警告震动
                return;
            }

            // 检查是否需要特别注意
            const needsAttention = this.attentionModule.isAttentionRequired(barcode);
            if (needsAttention) {
                this.uiModule.showStatus('该单号需注意!', 'warning', 5000);
                this.uiModule.vibrate([200, 100, 200, 100, 200]); // 注意震动
            }

            // 添加到历史记录
            const addSuccess = this.historyModule.addBarcode(barcode, {
                uploadResponse: result.response,
                needsAttention: needsAttention
            });

            if (addSuccess) {
                const message = needsAttention ? 
                    `扫描成功: ${barcode} (需注意)` : 
                    `扫描成功: ${barcode}`;
                
                this.uiModule.showStatus(message, 'success', 3000);
                this.uiModule.vibrate(100); // 成功震动
            } else {
                this.uiModule.showStatus('添加到历史记录失败', 'error');
            }

        } catch (error) {
            console.error('扫描失败:', error);
            this.uiModule.showStatus('扫描失败: ' + error.message, 'error', 5000);
            this.uiModule.vibrate([300, 100, 300]); // 错误震动
        } finally {
            // 恢复UI状态
            this.uiModule.updateScanButton(false);
        }
    }

    /**
     * 处理历史记录项点击
     * @param {string} barcode - 条形码
     */
    async handleHistoryItemClick(barcode) {
        try {
            const success = await this.uiModule.copyToClipboard(barcode);
            if (success) {
                this.uiModule.showStatus(`已复制: ${barcode}`, 'info', 2000);
            } else {
                this.uiModule.showStatus('复制失败', 'error', 2000);
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.uiModule.showStatus('复制失败', 'error', 2000);
        }
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        if (this.uiModule.showConfirm('确定要清空所有扫描历史吗？')) {
            this.historyModule.clearHistory();
            this.uiModule.showStatus('历史记录已清空', 'info', 2000);
        }
    }

    /**
     * 清空注意单号列表
     */
    clearAttentionList() {
        if (this.uiModule.showConfirm('确定要清空所有注意单号吗？')) {
            this.attentionModule.clearAttentionList();
            this.uiModule.updateAttentionList('');
            this.uiModule.showStatus('注意单号列表已清空', 'info', 2000);
        }
    }

    /**
     * 获取应用统计信息
     * @returns {Object}
     */
    getStats() {
        return {
            history: this.historyModule.getStats(),
            attention: this.attentionModule.getStats(),
            isScanning: this.scanModule.getIsScanning(),
            isInitialized: this.isInitialized
        };
    }

    /**
     * 导出数据
     * @returns {Object}
     */
    exportData() {
        return {
            history: this.historyModule.getHistory(),
            attentionList: this.attentionModule.getAttentionList(),
            exportTime: new Date().toISOString()
        };
    }

    /**
     * 导入数据
     * @param {Object} data - 导入的数据
     */
    importData(data) {
        try {
            if (data.history && Array.isArray(data.history)) {
                // 清空当前历史记录并导入新数据
                this.historyModule.clearHistory();
                data.history.forEach(item => {
                    if (item.barcode) {
                        this.historyModule.addBarcode(item.barcode, item);
                    }
                });
            }

            if (data.attentionList && Array.isArray(data.attentionList)) {
                this.attentionModule.updateFromText(data.attentionList.join('\n'));
                this.uiModule.updateAttentionList(this.attentionModule.getAttentionText());
            }

            this.uiModule.showStatus('数据导入成功', 'success', 3000);

        } catch (error) {
            console.error('导入数据失败:', error);
            this.uiModule.showStatus('导入数据失败: ' + error.message, 'error', 5000);
        }
    }

    /**
     * 销毁应用程序
     */
    destroy() {
        console.log('正在销毁条形码扫描器...');
        
        // 清理各个模块
        if (this.uiModule) {
            this.uiModule.destroy();
        }

        // 清理引用
        this.scanModule = null;
        this.historyModule = null;
        this.attentionModule = null;
        this.uiModule = null;
        
        this.isInitialized = false;
        
        console.log('条形码扫描器已销毁');
    }
}

// 应用程序启动
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM已加载，启动应用程序...');
    
    // 创建应用实例
    window.barcodeScanner = new BarcodeScanner();
    
    // 初始化应用
    await window.barcodeScanner.init();
    
    // 开发模式下的调试功能
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('开发模式已启用');
        
        // 全局调试函数
        window.debugBarcode = {
            getStats: () => window.barcodeScanner.getStats(),
            exportData: () => window.barcodeScanner.exportData(),
            importData: (data) => window.barcodeScanner.importData(data),
            clearHistory: () => window.barcodeScanner.clearHistory(),
            clearAttention: () => window.barcodeScanner.clearAttentionList(),
            // 模拟扫描（开发测试用）
            simulateScan: async (barcode) => {
                if (barcode) {
                    // 手动触发扫描结果处理
                    const scanModule = window.barcodeScanner.scanModule;
                    const originalScan = scanModule.startScan;
                    scanModule.startScan = async () => barcode;
                    await window.barcodeScanner.handleScan();
                    scanModule.startScan = originalScan;
                } else {
                    await window.barcodeScanner.handleScan();
                }
            }
        };
        
        console.log('调试功能已就绪，使用 window.debugBarcode 访问调试功能');
    }
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('应用程序错误:', event.error);
    if (window.barcodeScanner && window.barcodeScanner.uiModule) {
        window.barcodeScanner.uiModule.showStatus('应用程序出现错误，请刷新页面', 'error', 10000);
    }
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.barcodeScanner) {
        window.barcodeScanner.destroy();
    }
});