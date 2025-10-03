/**
 * 扫码模块 - 负责扫码和POST请求
 * 高度解耦的扫码功能模块
 */
class ScanModule {
    constructor() {
        this.isScanning = false;
        this.apiUrl = 'http://localhost:3000/api/barcode';
    }

    /**
     * 设置API地址
     * @param {string} url - API接口地址
     */
    setApiUrl(url) {
        this.apiUrl = url;
    }

    /**
     * 开始扫码
     * @returns {Promise<string>} 扫描到的条形码
     */
    async startScan() {
        if (this.isScanning) {
            throw new Error('正在扫描中，请等待当前扫描完成');
        }

        this.isScanning = true;
        
        try {
            // 模拟扫码过程（在实际应用中，这里会调用uni.scanCode）
            const result = await this.simulateScan();
            return result;
        } finally {
            this.isScanning = false;
        }
    }

    /**
     * 模拟扫码过程（用于演示）
     * 在实际应用中会替换为真实的扫码API调用
     * @returns {Promise<string>}
     */
    async simulateScan() {
        return new Promise((resolve, reject) => {
            // 模拟扫码延迟
            setTimeout(() => {
                // 模拟生成条形码（实际应用中从摄像头获取）
                const simulatedBarcodes = [
                    'SF1234567890',
                    'YT9876543210', 
                    'JD1122334455',
                    'ZTO9988776655',
                    'STO1357924680',
                    'YD2468013579',
                    'EMS3691470258'
                ];
                
                const randomBarcode = simulatedBarcodes[Math.floor(Math.random() * simulatedBarcodes.length)];
                const timestamp = new Date().getTime().toString().slice(-4);
                const result = randomBarcode + timestamp;
                
                resolve(result);
            }, 1000);
        });
    }

    /**
     * 发送POST请求到服务器
     * @param {string} barcode - 条形码数据
     * @returns {Promise<Object>} 服务器响应
     */
    async uploadBarcode(barcode) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    barcode: barcode,
                    timestamp: new Date().toISOString(),
                    source: 'uni-app-scanner'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // 如果是网络错误或服务器不可达，返回模拟成功响应
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                console.warn('服务器连接失败，使用模拟响应:', error.message);
                return {
                    success: true,
                    message: '条形码已保存（模拟响应）',
                    barcode: barcode,
                    id: Math.random().toString(36).substr(2, 9)
                };
            }
            throw error;
        }
    }

    /**
     * 扫码并上传的完整流程
     * @returns {Promise<{barcode: string, response: Object}>}
     */
    async scanAndUpload() {
        const barcode = await this.startScan();
        const response = await this.uploadBarcode(barcode);
        
        return {
            barcode: barcode,
            response: response
        };
    }

    /**
     * 获取扫描状态
     * @returns {boolean}
     */
    getIsScanning() {
        return this.isScanning;
    }
}

export default ScanModule;