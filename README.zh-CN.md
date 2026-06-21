# Chatting

一个桌面风格的 AI 对话网页应用。支持 **8 家 AI 提供商**，界面简洁清爽，同时提供深色和浅色主题。

前后端分离架构：前端（HTML/CSS/JS）+ 后端（Python/Flask）。

## 支持的提供商

| 提供商                | API 类型            | 模型                                        |
| --------------------- | ------------------- | ------------------------------------------- |
| Anthropic (Claude)    | Anthropic Messages  | Claude Sonnet 4, Opus 4, 3.5 Sonnet, Haiku |
| OpenAI (GPT)          | OpenAI 兼容         | GPT-4o, GPT-4o Mini, GPT-4 Turbo           |
| DeepSeek              | OpenAI 兼容         | DeepSeek Chat, DeepSeek Coder               |
| GLM（智谱）           | OpenAI 兼容         | GLM-4, GLM-4 Plus, GLM-4 Air, GLM-4 Flash  |
| MiniMax               | OpenAI 兼容         | MiniMax Text-01, Abab6.5s, Abab5.5s        |
| 豆包（字节跳动）      | OpenAI 兼容         | Doubao Pro 32K/128K, Doubao Lite 32K/128K  |
| 通义千问（阿里）      | OpenAI 兼容         | Qwen Max/Plus/Turbo, Qwen2.5 系列           |
| Gemini（Google）      | Gemini API          | Gemini 2.5 Flash/Pro, 2.0 Flash             |

## 功能特性

- **双模式**：对话模式和代码模式，各自配有定制化的系统提示词
- **多提供商**：在 8 家 AI 提供商之间无缝切换
- **流式响应**：逐 token 实时输出
- **双主题**：深色/浅色模式切换，偏好设置持久保存
- **扁平 UI**：干净简约的设计风格
- **手绘图标**：全界面使用 SVG 线条风格图标
- **代码块**：语法高亮，一键复制
- **设置持久化**：API 密钥和偏好设置本地保存
- **快捷键**：Enter 发送，Shift+Enter 换行，Escape 停止

## 项目架构

```
chatting/
├── backend/
│   ├── app.py              # Flask API 服务（代理 8 家 LLM 提供商）
│   └── requirements.txt    # Python 依赖
├── frontend/
│   ├── index.html          # 主 HTML 结构
│   ├── css/
│   │   └── style.css       # 深色/浅色主题扁平化样式
│   └── js/
│       └── app.js          # 应用逻辑与状态管理
└── README.md
```

**关注点分离：**
- 后端负责所有与 LLM 提供商的 API 通信
- 前端负责 UI 渲染和用户交互
- 前后端通过 REST API 通信
- 后端可同时托管前端静态文件，方便部署

## 快速开始

### 环境要求

- Python 3.8+
- pip（Python 包管理工具）
- 现代浏览器

### 1. 安装后端

```bash
cd backend
pip install -r requirements.txt
python app.py
```

服务启动后访问 `http://localhost:5001`。后端同时承载 API 和前端静态文件。

### 2. 打开应用

在浏览器中访问 **http://localhost:5001**。

### 3. 配置

1. 点击侧边栏的 **设置** 按钮
2. 选择 **API 提供商**（如 Anthropic、OpenAI、DeepSeek 等）
3. 选择 **模型**
4. 输入你的 **API Key**
5. 点击 **保存并验证**
6. 连接成功后，开始对话吧！

### （可选）单独运行前端

```bash
cd frontend
python -m http.server 8080
# 然后打开 http://localhost:8080
```

如果单独启动前端，请确保 `frontend/js/app.js` 中的 `API_BASE` 指向运行中的后端地址（默认：`http://localhost:5001`）。

## API 接口

| 接口路径            | 方法   | 说明                      |
| ------------------- | ------ | ------------------------- |
| `/api/health`       | GET    | 健康检查                  |
| `/api/providers`    | GET    | 获取所有支持的提供商       |
| `/api/models`       | POST   | 获取指定提供商的模型列表   |
| `/api/verify-key`   | POST   | 验证 API Key 是否有效     |
| `/api/chat`         | POST   | 发送消息（支持流式/非流式）|

### 对话请求格式

```json
{
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "api_key": "sk-ant-...",
    "messages": [
        {"role": "user", "content": "你好！"}
    ],
    "system": "可选的系统提示词",
    "stream": true
}
```

### 对话响应（流式模式）

响应采用 Server-Sent Events 格式，字段统一标准化：

```
data: {"type": "text", "content": "你好"}
data: {"type": "text", "content": "！有什么我可"}
data: {"type": "text", "content": "以帮你的吗？"}
data: {"type": "done"}
```

## 配置

通过 `PORT` 环境变量修改后端端口：

```bash
PORT=8080 python app.py
```

## 截图

> *截图待补充。欢迎贡献！*

## 技术栈

**前端**
- 原生 JavaScript（ES6+）
- CSS 自定义属性实现主题切换
- SVG 图标
- 无需框架或构建工具

**后端**
- Python 3 + Flask
- Requests 库处理 HTTP 请求
- Flask-CORS 支持跨域

## 免责声明

本软件是面向第三方 AI API 服务的客户端界面，本身不托管、不存储、不生成任何 AI 模型。

用户需自行负责：

- 遵守所使用的 AI 提供商（Anthropic、OpenAI、DeepSeek、智谱、MiniMax、字节跳动、阿里、Google 等）的服务条款
- 因使用自身 API Key 产生的所有 API 调用费用
- 向第三方 AI 服务发送及接收的内容
- 确保使用本软件的行为符合相关法律法规

作者及贡献者不对任何滥用本软件或违反第三方服务条款的行为承担责任。

## 致谢

本项目由作者与 AI 编程助手协作完成：

- **人类作者**：[@Junhao Cheng](https://github.com/chengjunhao0328) — 负责项目规划、架构设计、功能定义、代码审查及集成测试。
- **AI 助手（DeepSeek-V4-Flash）**：提供代码生成、实现建议及开发过程中的问题排查。
- **AI 工具（Claude Code）**：辅助代码编辑、文件管理和开发流程。

所有代码和设计决策均由人类作者最终审核确认。

## 开源协议

MIT 协议。详见 [LICENSE](LICENSE) 文件。
