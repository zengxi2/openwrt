/**
 * 演示服务器 - 用于测试条形码POST请求
 * 简单的Node.js Express服务器
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'barcodes.json');

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取数据失败:', error);
        return [];
    }
}

// 写入数据
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('写入数据失败:', error);
        return false;
    }
}

// 接收条形码POST请求
app.post('/api/barcode', (req, res) => {
    const { barcode, timestamp, source } = req.body;
    
    console.log('收到条形码:', {
        barcode,
        timestamp,
        source,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    
    // 验证数据
    if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({
            success: false,
            message: '无效的条形码数据'
        });
    }
    
    // 读取现有数据
    const data = readData();
    
    // 检查是否已存在
    const exists = data.some(item => item.barcode === barcode);
    
    // 创建新记录
    const newRecord = {
        id: Date.now().toString(),
        barcode: barcode,
        timestamp: timestamp || new Date().toISOString(),
        source: source || 'unknown',
        receivedAt: new Date().toISOString(),
        ip: req.ip,
        duplicate: exists
    };
    
    // 添加到数据中
    data.push(newRecord);
    
    // 保持最新1000条记录
    if (data.length > 1000) {
        data.splice(0, data.length - 1000);
    }
    
    // 保存数据
    const saveSuccess = writeData(data);
    
    if (saveSuccess) {
        res.json({
            success: true,
            message: exists ? '条形码已存在但仍保存' : '条形码保存成功',
            id: newRecord.id,
            barcode: barcode,
            duplicate: exists,
            total: data.length
        });
    } else {
        res.status(500).json({
            success: false,
            message: '保存条形码失败'
        });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`条形码演示服务器已启动，端口: ${PORT}`);
    console.log(`API地址: http://localhost:${PORT}/api/barcode`);
});