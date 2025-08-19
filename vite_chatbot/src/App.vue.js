import axios from 'axios';
export default (await import('vue')).defineComponent({
    data() {
        return {
            // 从后端获取模型数据
            models: [],
            // 当前选中的模型ID
            selectedModelId: null,
            // 下拉菜单是否展开
            dropdownOpen: false,
            // 对话消息列表
            messages: [],
            // 新消息内容
            newMessage: '',
            // 预览图片URL
            previewImageUrl: null,
            // 图片文件
            imageFile: null,
            // 用户ID（从localStorage获取或生成）
            userId: '',
            // 当前会话ID
            currentSessionId: '',
            // 是否正在加载
            isLoading: false,
            // 所有会话列表
            sessions: [],
            // 是否显示会话列表
            showSessions: false
        };
    },
    computed: {
        // 当前选中的模型
        selectedModel() {
            return this.models.find(model => model.id === this.selectedModelId);
        },
        // 是否有消息
        hasMessages() {
            // 排除初始欢迎消息
            return this.messages.length > 1;
        },
        // 是否可以发送消息
        canSendMessage() {
            return !!this.selectedModelId && (this.newMessage.trim() !== '' || this.previewImageUrl);
        }
    },
    created() {
        this.initializeUser();
        this.fetchModels();
        this.fetchSessions();
    },
    methods: {
        // 初始化用户
        initializeUser() {
            // 从localStorage获取用户ID，如果没有则生成一个
            let userId = localStorage.getItem('userId');
            if (!userId) {
                userId = 'user_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('userId', userId);
            }
            this.userId = userId;
        },
        // 从后端获取模型列表
        async fetchModels() {
            try {
                const response = await axios.get('/roles');
                this.models = response.data.roles.map(role => ({
                    id: role.key,
                    name: role.name,
                    icon: role.icon || '🤖',
                    provider: role.provider || 'default'
                }));
                // 设置默认选中的模型
                if (this.models.length > 0) {
                    this.selectedModelId = this.models[0].id;
                }
            }
            catch (error) {
                console.error('获取模型列表失败:', error);
                // 设置默认模型作为后备
                this.models = [
                    { id: 'gpt-3.5', name: 'Deepseek-chat', icon: '🤖' },
                    { id: 'gpt-4', name: 'Deepseek-reasoner', icon: '🧠' },
                    { id: 'claude', name: 'Qianwen-VL', icon: '✨' },
                ];
            }
        },
        // 获取用户的所有会话
        async fetchSessions() {
            try {
                const response = await axios.get('/chat/sessions', {
                    params: { user_id: this.userId }
                });
                this.sessions = response.data.sessions;
            }
            catch (error) {
                console.error('获取会话列表失败:', error);
            }
        },
        // 选择模型
        selectModel(modelId) {
            this.selectedModelId = modelId;
            this.dropdownOpen = false;
        },
        // 切换下拉菜单
        toggleDropdown() {
            this.dropdownOpen = !this.dropdownOpen;
        },
        // 处理图片上传
        async handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file)
                return;
            // 检查文件大小（10MB限制）
            if (file.size > 10 * 1024 * 1024) {
                alert('图片大小不能超过10MB');
                return;
            }
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await axios.post('/upload/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (response.data.success) {
                    this.imageFile = file;
                    this.previewImageUrl = `data:${response.data.data.content_type};base64,${response.data.data.base64_data}`;
                }
            }
            catch (error) {
                console.error('图片上传失败:', error);
                alert('图片上传失败');
            }
            // 重置input，以便可以再次选择相同的文件
            event.target.value = '';
        },
        // 移除图片
        removeImage() {
            this.previewImageUrl = null;
            this.imageFile = null;
        },
        // 处理按键事件
        handleKeyPress(event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey) {
                event.preventDefault();
                this.sendMessage();
            }
        },
        // 发送消息
        async sendMessage() {
            if (!this.canSendMessage)
                return;
            // 如果是新会话，先创建会话
            if (!this.currentSessionId) {
                try {
                    const response = await axios.post('/chat/start', null, {
                        params: { user_id: this.userId }
                    });
                    this.currentSessionId = response.data.session_id;
                    // 添加欢迎消息
                    this.messages = [{
                            isAssistant: true,
                            avatar: this.selectedModel?.icon || '🤖',
                            content: response.data.welcome_message
                        }];
                }
                catch (error) {
                    console.error('创建会话失败:', error);
                    return;
                }
            }
            // 添加用户消息
            const userMessage = {
                isAssistant: false,
                avatar: '👤',
                content: this.newMessage.trim(),
                timestamp: Date.now()
            };
            // 如果有图片，添加图片URL
            if (this.previewImageUrl) {
                userMessage.imageUrl = this.previewImageUrl;
                userMessage.imageAlt = '用户上传的图片';
            }
            this.messages.push(userMessage);
            // 清空输入
            this.newMessage = '';
            const imageInput = document.getElementById('imageUpload');
            if (imageInput)
                imageInput.value = '';
            // 添加加载指示器
            const loadingMessage = {
                isAssistant: true,
                avatar: this.selectedModel?.icon || '🤖',
                content: '正在思考...',
                isLoading: true
            };
            this.messages.push(loadingMessage);
            this.scrollToBottom();
            // 准备请求数据
            const requestData = {
                user_id: this.userId,
                session_id: this.currentSessionId,
                message: userMessage.content,
                role: this.selectedModelId,
                provider: this.selectedModel?.provider || 'default'
            };
            // 如果有图片
            if (this.imageFile) {
                requestData.image_data = this.previewImageUrl.split(',')[1];
                requestData.image_type = this.previewImageUrl.split(';')[0].split(':')[1];
            }
            // 发送消息到后端
            try {
                const response = await axios.post('/chat/stream', requestData);
                // 移除加载消息
                this.messages = this.messages.filter(msg => !msg.isLoading);
                // 添加AI回复
                const aiResponse = {
                    isAssistant: true,
                    avatar: this.selectedModel?.icon || '🤖',
                    content: response.data, // 假设返回的是完整文本
                    timestamp: Date.now()
                };
                this.messages.push(aiResponse);
                this.fetchSessions(); // 刷新会话列表
            }
            catch (error) {
                console.error('发送消息失败:', error);
                // 移除加载消息并显示错误
                this.messages = this.messages.filter(msg => !msg.isLoading);
                this.messages.push({
                    isAssistant: true,
                    avatar: this.selectedModel?.icon || '🤖',
                    content: '抱歉，出错了: ' + error.message
                });
            }
            finally {
                this.previewImageUrl = null;
                this.imageFile = null;
                this.scrollToBottom();
            }
        },
        async startNewChat() {
            try {
                // 调用后端创建会话接口
                const response = await axios.post('/chat/start', null, {
                    params: { user_id: this.userId } // 传递user_id作为Query参数
                });
                const { session_id: newSessionId, welcome_message: welcomeMsg } = response.data;
                // 1. 存储当前会话ID（后续发送消息需用）
                this.currentSessionId = newSessionId;
                // 2. 更新前端消息列表（显示欢迎消息）
                this.messages = [
                    {
                        isAssistant: true,
                        avatar: this.selectedModel?.icon || '🤖',
                        content: welcomeMsg
                    }
                ];
                // 3. 刷新会话列表（可选，如前端显示会话列表）
                await this.fetchSessionList();
            }
            catch (error) {
                console.error('创建新会话失败：', error);
                alert('新建对话失败，请重试！');
            }
        },
        // 新增：获取用户会话列表（用于前端显示历史会话）
        async fetchSessionList() {
            try {
                const response = await axios.get('/chat/sessions', {
                    params: { user_id: this.userId }
                });
                this.sessionList = response.data.sessions; // 存储会话列表到前端状态
            }
            catch (error) {
                console.error('获取会话列表失败：', error);
            }
        },
        // 清除当前会话历史
        async clearHistory() {
            if (!this.currentSessionId)
                return;
            if (confirm('确定要清除当前对话历史吗？')) {
                try {
                    await axios.delete(`/chat/history/${this.currentSessionId}`, {
                        params: { user_id: this.userId }
                    });
                    this.messages = [{
                            isAssistant: true,
                            avatar: this.selectedModel?.icon || '🤖',
                            content: '对话历史已清除'
                        }];
                    this.fetchSessions(); // 刷新会话列表
                }
                catch (error) {
                    console.error('清除历史失败:', error);
                    alert('清除历史失败');
                }
            }
        },
        // 加载会话历史
        async loadSession(sessionId) {
            try {
                const response = await axios.get('/chat/history', {
                    params: {
                        user_id: this.userId,
                        session_id: sessionId
                    }
                });
                this.currentSessionId = sessionId;
                this.messages = response.data.messages.map(msg => ({
                    isAssistant: msg.role === 'assistant',
                    avatar: msg.role === 'assistant' ? this.selectedModel?.icon || '🤖' : '👤',
                    content: msg.content,
                    timestamp: msg.timestamp
                }));
            }
            catch (error) {
                console.error('加载会话失败:', error);
                this.messages = [{
                        isAssistant: true,
                        avatar: this.selectedModel?.icon || '🤖',
                        content: '加载会话失败'
                    }];
            }
        },
        // 删除会话
        async deleteSession(sessionId, event) {
            event.stopPropagation();
            if (confirm('确定要删除此会话吗？')) {
                try {
                    await axios.delete(`/chat/session/${sessionId}`, {
                        params: { user_id: this.userId }
                    });
                    // 如果删除的是当前会话，重置当前会话
                    if (sessionId === this.currentSessionId) {
                        this.currentSessionId = '';
                        this.messages = [{
                                isAssistant: true,
                                avatar: this.selectedModel?.icon || '🤖',
                                content: '请选择或创建新会话'
                            }];
                    }
                    this.fetchSessions(); // 刷新会话列表
                }
                catch (error) {
                    console.error('删除会话失败:', error);
                    alert('删除会话失败');
                }
            }
        },
        // 滚动到最新消息
        scrollToBottom() {
            this.$nextTick(() => {
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            });
        }
    },
    watch: {
        // 当消息列表变化时滚动到底部
        messages() {
            this.scrollToBottom();
        }
    }
});
const __VLS_ctx = {};
let __VLS_elements;
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "app-container" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "sidebar" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "sidebar-header" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "logo" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "logo-icon" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "session-section" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showSessions = !__VLS_ctx.showSessions;
            // @ts-ignore
            [showSessions, showSessions,];
        } },
    ...{ class: "section-title" },
});
(__VLS_ctx.showSessions ? '▲' : '▼');
// @ts-ignore
[showSessions,];
if (__VLS_ctx.showSessions) {
    // @ts-ignore
    [showSessions,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "session-list" },
    });
    for (const [session] of __VLS_getVForSourceType((__VLS_ctx.sessions))) {
        // @ts-ignore
        [sessions,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showSessions))
                        return;
                    __VLS_ctx.loadSession(session.session_id);
                    // @ts-ignore
                    [loadSession,];
                } },
            key: (session.session_id),
            ...{ class: "session-item" },
            ...{ class: ({ 'active': session.session_id === __VLS_ctx.currentSessionId }) },
        });
        // @ts-ignore
        [currentSessionId,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "session-info" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "session-time" },
        });
        (session.last_time);
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "session-preview" },
        });
        (session.last_message);
        __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showSessions))
                        return;
                    __VLS_ctx.deleteSession(session.session_id, $event);
                    // @ts-ignore
                    [deleteSession,];
                } },
            ...{ class: "delete-session-btn" },
        });
    }
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "assistant-section" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "section-title" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "assistant-list" },
});
for (const [model] of __VLS_getVForSourceType((__VLS_ctx.models))) {
    // @ts-ignore
    [models,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectModel(model.id);
                // @ts-ignore
                [selectModel,];
            } },
        key: (model.id),
        ...{ class: "assistant-item" },
        ...{ class: ({ 'selected': __VLS_ctx.selectedModelId === model.id }) },
    });
    // @ts-ignore
    [selectedModelId,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "assistant-icon" },
    });
    (model.icon);
    __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
    (model.name);
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-container" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-header" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-title" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "selected-model-info" },
    id: "selectedModelInfo",
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "selected-model-icon" },
});
(__VLS_ctx.selectedModel?.icon || '🤖');
// @ts-ignore
[selectedModel,];
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
(__VLS_ctx.selectedModel ? __VLS_ctx.selectedModel.name : '智能助手');
// @ts-ignore
[selectedModel, selectedModel,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-actions" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.startNewChat) },
    ...{ class: "action-btn" },
    title: "新建对话",
});
// @ts-ignore
[startNewChat,];
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.clearHistory) },
    ...{ class: "action-btn clear-history-btn" },
    id: "clearHistoryBtn",
    disabled: (!__VLS_ctx.hasMessages),
    title: "清除历史",
});
// @ts-ignore
[clearHistory, hasMessages,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-messages" },
    id: "chatMessages",
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "message assistant" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "message-avatar" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "message-content-wrapper" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-messages" },
    id: "chatMessages",
});
for (const [message, index] of __VLS_getVForSourceType((__VLS_ctx.messages))) {
    // @ts-ignore
    [messages,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        key: (index),
        ...{ class: "message" },
        ...{ class: ({ 'assistant': message.isAssistant, 'user': !message.isAssistant }) },
    });
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "message-avatar" },
    });
    (message.avatar);
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "message-content-wrapper" },
    });
    (message.content);
    if (message.imageUrl) {
        __VLS_asFunctionalElement(__VLS_elements.img, __VLS_elements.img)({
            src: (message.imageUrl),
            ...{ class: "message-image" },
            alt: (message.imageAlt || '用户上传的图片'),
        });
    }
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "chat-input" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "input-container" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "controls-section" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ onClick: (__VLS_ctx.toggleDropdown) },
    ...{ class: "custom-select-wrapper" },
});
// @ts-ignore
[toggleDropdown,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    id: "customSelect",
    ...{ class: "custom-select" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "custom-select-icon" },
});
(__VLS_ctx.selectedModel?.icon || '🤖');
// @ts-ignore
[selectedModel,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "custom-select-text" },
});
(__VLS_ctx.selectedModel ? __VLS_ctx.selectedModel.name : '选择模型');
// @ts-ignore
[selectedModel, selectedModel,];
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "custom-select-arrow" },
});
(__VLS_ctx.dropdownOpen ? '▲' : '▼');
// @ts-ignore
[dropdownOpen,];
if (__VLS_ctx.dropdownOpen) {
    // @ts-ignore
    [dropdownOpen,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        id: "customSelectDropdown",
        ...{ class: "custom-select-dropdown" },
    });
    for (const [model] of __VLS_getVForSourceType((__VLS_ctx.models))) {
        // @ts-ignore
        [models,];
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.dropdownOpen))
                        return;
                    __VLS_ctx.selectModel(model.id);
                    // @ts-ignore
                    [selectModel,];
                } },
            key: (model.id),
            ...{ class: "dropdown-item" },
        });
        __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
            ...{ class: "dropdown-item-icon" },
        });
        (model.icon);
        __VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
        (model.name);
    }
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "image-upload-container" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "image-upload-btn" },
});
__VLS_asFunctionalElement(__VLS_elements.span, __VLS_elements.span)({});
__VLS_asFunctionalElement(__VLS_elements.input, __VLS_elements.input)({
    ...{ onChange: (__VLS_ctx.handleImageUpload) },
    type: "file",
    ...{ class: "image-upload-input" },
    id: "imageUpload",
    accept: "image/*",
});
// @ts-ignore
[handleImageUpload,];
__VLS_asFunctionalElement(__VLS_elements.textarea, __VLS_elements.textarea)({
    ...{ onKeypress: (__VLS_ctx.handleKeyPress) },
    id: "messageInput",
    placeholder: "输入您的消息...",
    value: (__VLS_ctx.newMessage),
});
// @ts-ignore
[handleKeyPress, newMessage,];
if (__VLS_ctx.previewImageUrl) {
    // @ts-ignore
    [previewImageUrl,];
    __VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
        ...{ class: "image-preview" },
        id: "imagePreview",
    });
    __VLS_asFunctionalElement(__VLS_elements.img, __VLS_elements.img)({
        src: (__VLS_ctx.previewImageUrl),
        ...{ class: "preview-img" },
        alt: "预览图片",
    });
    // @ts-ignore
    [previewImageUrl,];
    __VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
        ...{ onClick: (__VLS_ctx.removeImage) },
        ...{ class: "remove-image" },
    });
    // @ts-ignore
    [removeImage,];
}
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "enter-tip" },
});
__VLS_asFunctionalElement(__VLS_elements.div, __VLS_elements.div)({
    ...{ class: "send-section" },
});
__VLS_asFunctionalElement(__VLS_elements.button, __VLS_elements.button)({
    ...{ onClick: (__VLS_ctx.sendMessage) },
    ...{ class: "send-button" },
    id: "sendButton",
    disabled: (!__VLS_ctx.canSendMessage),
});
// @ts-ignore
[sendMessage, canSendMessage,];
/** @type {__VLS_StyleScopedClasses['app-container']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-header']} */ ;
/** @type {__VLS_StyleScopedClasses['logo']} */ ;
/** @type {__VLS_StyleScopedClasses['logo-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['session-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['session-list']} */ ;
/** @type {__VLS_StyleScopedClasses['session-item']} */ ;
/** @type {__VLS_StyleScopedClasses['active']} */ ;
/** @type {__VLS_StyleScopedClasses['session-info']} */ ;
/** @type {__VLS_StyleScopedClasses['session-time']} */ ;
/** @type {__VLS_StyleScopedClasses['session-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['delete-session-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant-section']} */ ;
/** @type {__VLS_StyleScopedClasses['section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant-list']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant-item']} */ ;
/** @type {__VLS_StyleScopedClasses['selected']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-header']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-title']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-model-info']} */ ;
/** @type {__VLS_StyleScopedClasses['selected-model-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['action-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['clear-history-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-messages']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant']} */ ;
/** @type {__VLS_StyleScopedClasses['message-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-messages']} */ ;
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['assistant']} */ ;
/** @type {__VLS_StyleScopedClasses['user']} */ ;
/** @type {__VLS_StyleScopedClasses['message-avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['message-content-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['message-image']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-input']} */ ;
/** @type {__VLS_StyleScopedClasses['input-container']} */ ;
/** @type {__VLS_StyleScopedClasses['controls-section']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select-text']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select-arrow']} */ ;
/** @type {__VLS_StyleScopedClasses['custom-select-dropdown']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item']} */ ;
/** @type {__VLS_StyleScopedClasses['dropdown-item-icon']} */ ;
/** @type {__VLS_StyleScopedClasses['image-upload-container']} */ ;
/** @type {__VLS_StyleScopedClasses['image-upload-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['image-upload-input']} */ ;
/** @type {__VLS_StyleScopedClasses['image-preview']} */ ;
/** @type {__VLS_StyleScopedClasses['preview-img']} */ ;
/** @type {__VLS_StyleScopedClasses['remove-image']} */ ;
/** @type {__VLS_StyleScopedClasses['enter-tip']} */ ;
/** @type {__VLS_StyleScopedClasses['send-section']} */ ;
/** @type {__VLS_StyleScopedClasses['send-button']} */ ;
var __VLS_dollars;
let __VLS_self;
