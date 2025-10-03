# 条形码扫码功能模块

这是一个基于 uni-app x 开发的条形码扫描应用程序，实现了高度解耦的模块化架构。

## 功能特性

- ✅ 条形码扫描功能（支持真实扫码和模拟扫码）
- ✅ 自动POST请求上传到服务器
- ✅ FIFO历史记录管理（最多保存10条）
- ✅ 重复条形码检测和提示
- ✅ 特殊单号注意提醒功能
- ✅ 本地数据持久化存储
- ✅ 友好的用户界面交互
- ✅ 高度解耦的模块化架构

## 项目结构

```
barcode-scanner-app/
├── pages/
│   └── index/
│       ├── index.html      # HTML页面文件
│       ├── index.uvue      # uni-app x Vue组件
│       └── index.js        # 主应用逻辑
├── modules/
│   ├── ScanModule.js           # 扫码模块
│   ├── BarcodeHistoryModule.js # 历史记录管理模块
│   ├── AttentionModule.js      # 注意单号管理模块
│   └── UIModule.js             # UI界面模块
├── static/                 # 静态资源
├── App.vue                 # 应用入口
├── manifest.json           # 应用配置
├── pages.json              # 页面配置
└── package.json            # 项目配置
```

## 模块说明

### 1. ScanModule (扫码模块)
- 负责调用扫码API和POST请求
- 支持真实扫码和模拟扫码
- 自动处理网络错误和重试逻辑

### 2. BarcodeHistoryModule (历史记录管理模块)
- 实现FIFO队列管理（最多10条记录）
- 重复条形码检测
- 本地存储持久化
- 观察者模式通知UI更新

### 3. AttentionModule (注意单号管理模块)
- 管理需要特别注意的单号列表
- 支持文本输入和批量导入
- 条形码匹配和提醒功能

### 4. UIModule (UI界面模块)
- 统一的用户界面管理
- 状态消息显示
- 事件处理和用户交互
- 本地设置保存

## 使用方法

### 开发环境

1. 确保已安装 uni-app x 开发环境
2. 进入项目目录
3. 运行开发命令：
   ```bash
   npm run dev:h5      # H5开发
   npm run dev:app     # App开发
   ```

### 生产构建

```bash
npm run build:h5      # H5构建
npm run build:app     # App构建
```

### 基本使用

1. **扫描条形码**
   - 点击"开始扫描"按钮
   - 将条形码对准摄像头扫描
   - 系统自动处理扫描结果

2. **查看历史记录**
   - 最近10条扫描记录自动显示
   - 点击记录可复制条形码到剪贴板

3. **设置注意单号**
   - 在文本框中输入需要注意的单号
   - 每行输入一个单号
   - 扫描到这些单号时会特别提醒

4. **配置API地址**
   - 在设置中修改API服务器地址
   - 支持自定义后端接口

## 开发调试

在开发环境下，应用提供了调试功能：

```javascript
// 控制台调试命令
window.debugBarcode.getStats()        // 获取统计信息
window.debugBarcode.exportData()      // 导出数据
window.debugBarcode.simulateScan()    // 模拟扫描
window.debugBarcode.clearHistory()    // 清空历史
```

## 扩展开发

由于采用了高度解耦的模块化架构，可以轻松扩展功能：

1. **添加新的扫码类型**：扩展 `ScanModule`
2. **增加数据分析功能**：基于 `BarcodeHistoryModule` 开发
3. **自定义提醒规则**：扩展 `AttentionModule`
4. **界面主题定制**：修改 `UIModule` 样式

## 技术栈

- uni-app x
- Vue 3
- JavaScript ES6+
- HTML5/CSS3
- 本地存储 API

## 许可证

MIT License