<<<<<<< HEAD
# FastAPI AI聊天应用演示项目

一个基于FastAPI和多AI提供商的智能聊天应用，支持连续多轮对话、流式响应、图片理解等功能。

## 🌟 主要特性

### 核心功能
- **多轮对话**: 支持连续的上下文对话，保持对话历史
- **流式响应**: 实时流式输出，提供更好的用户体验
- **会话管理**: 完整的会话创建、查看、删除功能
- **图片理解**: 支持图片上传和AI视觉理解功能
- **多角色支持**: 内置智能助手、AI老师、编程专家等角色

### AI提供商支持
- **DeepSeek**: DeepSeek系列模型
- **通义千问**: 阿里云通义千问模型
- **兼容OpenAI API**: 支持其他兼容OpenAI API的服务

### 技术特性
- **数据持久化**: 支持Redis存储，自动降级到内存存储
- **配置灵活**: 支持环境变量和配置文件
- **日志系统**: 完整的日志记录和错误追踪
- **响应式设计**: 现代化的Web界面
- **API文档**: 自动生成的FastAPI文档

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Redis (可选，不配置时使用内存存储)

### 安装依赖
```bash
pip install -r requirements.txt
```

### 配置环境变量
复制环境变量模板：
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的AI提供商API密钥：
```env
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# DeepSeek配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# 豆包配置
DOUBAO_API_KEY=your_doubao_api_key

# Kimi配置
KIMI_API_KEY=your_kimi_api_key

# 通义千问配置
QIANWEN_API_KEY=your_qianwen_api_key

# Redis配置（可选）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 应用配置
DEFAULT_AI_PROVIDER=openai
DEBUG=true
LOG_LEVEL=INFO
```

### 启动应用
```bash
# 方式1：直接启动
python main.py

# 方式2：使用启动脚本
python start_server.py

# 方式3：使用uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

访问 http://localhost:8000 开始使用聊天应用。

## 📁 项目结构

```
fastapi-ai-chat-demo/
├── main.py                 # 主应用文件
├── config.py              # 配置管理
├── start_server.py        # 启动脚本
├── requirements.txt       # 依赖包列表
├── .env.example          # 环境变量模板
├── ai_providers/         # AI提供商模块
│   ├── __init__.py
│   ├── base.py          # 基础类定义
│   ├── factory.py       # 提供商工厂
│   ├── openai_provider.py
│   ├── deepseek_provider.py
│   ├── doubao_provider.py
│   ├── kimi_provider.py
│   ├── qianwen_provider.py
│   └── openai_compatible_provider.py
├── static/              # 静态文件
│   ├── index.html      # 聊天界面
│   ├── css/
│   └── js/
├── docs/               # 项目文档
└── logs/              # 日志文件目录
```

## 🔧 API接口

### 聊天相关
- `POST /chat/start` - 开始新的聊天会话
- `POST /chat/stream` - 流式聊天接口
- `GET /chat/history` - 获取聊天历史
- `GET /chat/sessions` - 获取用户会话列表
- `DELETE /chat/session/{session_id}` - 删除聊天会话
- `DELETE /chat/history/{session_id}` - 清除对话历史

### 配置相关
- `GET /roles` - 获取可用的AI角色列表
- `GET /providers` - 获取可用的AI提供商列表

### 文件上传
- `POST /upload/image` - 图片上传接口

### 其他
- `GET /` - 重定向到聊天界面
- `GET /api` - API信息

详细的API文档可访问：http://localhost:8000/docs

## 🎯 使用说明

### 基本聊天
1. 访问应用首页
2. 点击"开始新对话"创建会话
3. 输入消息开始聊天
4. 支持实时流式响应

### 切换AI提供商
- 在聊天界面可以选择不同的AI提供商
- 支持在对话中动态切换模型
- 每个提供商支持多个模型选择

### 图片理解
1. 点击图片上传按钮
2. 选择图片文件（支持jpg、png等格式）
3. 发送消息，AI将分析图片内容

### 会话管理
- 查看历史会话列表
- 删除不需要的会话
- 清除会话对话历史

## ⚙️ 配置说明

### AI提供商配置
每个AI提供商都需要相应的API密钥，在 `.env` 文件中配置：

```env
# 设置默认提供商
DEFAULT_AI_PROVIDER=openai

# 各提供商的API密钥
OPENAI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
# ... 其他提供商
```

### Redis配置
Redis用于持久化存储对话历史，如果不配置Redis，应用会自动使用内存存储：

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
```

### 应用配置
```env
# 调试模式
DEBUG=true

# 日志级别
LOG_LEVEL=INFO

# 会话过期时间（秒）
CONVERSATION_EXPIRE_TIME=86400
SESSION_EXPIRE_TIME=604800

# 最大历史消息数
MAX_HISTORY_MESSAGES=20
```

## 🔍 日志和监控

应用提供完整的日志记录功能：
- 控制台输出：实时查看应用状态
- 文件日志：保存在 `logs/` 目录下
- 日志级别：支持DEBUG、INFO、WARNING、ERROR

日志内容包括：
- API请求和响应
- AI提供商调用情况
- 错误和异常信息
- 会话管理操作

## 🛠️ 开发指南

### 添加新的AI提供商
1. 在 `ai_providers/` 目录下创建新的提供商文件
2. 继承 `BaseAIProvider` 类
3. 实现必要的方法
4. 在 `factory.py` 中注册新提供商

## 🔗 相关链接

- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [OpenAI API文档](https://platform.openai.com/docs)
- [Redis官方文档](https://redis.io/documentation)

---

如果你觉得这个项目有用，请给它一个⭐️！
=======
# task01_qianwen
fastapi,python,qianwen
>>>>>>> 2e2332de2fb85802988066fc9e83a55cb7c4bb07
