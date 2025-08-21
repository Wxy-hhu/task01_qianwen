
<template>
  <div class="app-container">
    <!-- 左侧模型选择面板 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">🤖</div>
          <span>AI Chat</span>
        </div>
      </div>

      <!-- 会话列表 -->
      <div class="session-section">
        <div class="section-title" @click="showSessions = !showSessions">
          历史会话 {{ showSessions ? '▲' : '▼' }}
        </div>
        <div class="session-list" v-if="showSessions">
          <div 
            v-for="session in sessions" 
            :key="session.session_id"
            class="session-item"
            :class="{ 'active': session.session_id === currentSessionId }"
            @click="loadSession(session.session_id)"
          >
            <div class="session-info">
              <div class="session-time">{{ session.last_time }}</div>
              <div class="session-preview">{{ session.last_message }}</div>
            </div>
            <button 
              class="delete-session-btn" 
              @click.stop="deleteSession(session.session_id, $event)"
            >×</button>
          </div>
        </div>
      </div>


    </div>

    <!-- 右侧对话区域 -->
    <div class="chat-container">
      <div class="chat-header">
        <div class="chat-title">
          <div class="selected-model-info" id="selectedModelInfo">
            <div class="selected-model-icon">{{ selectedModel?.icon || '🤖' }}</div>
            <span>{{ selectedModel ? selectedModel.name : '智能助手' }}</span>
          </div>
        </div>
        <div class="chat-actions">
          <button 
            class="action-btn" 
            @click="startNewChat" 
            title="新建对话"
          >
            ➕ 新对话
          </button>
          <button 
            class="action-btn clear-history-btn" 
            id="clearHistoryBtn" 
            @click="clearHistory" 
            :disabled="!hasMessages" 
            title="清除历史"
          >
            🗑️ 清除历史
          </button>
        </div>
      </div>


      <div class="chat-messages" id="chatMessages">
        <div class="message assistant">
                    <div class="message-avatar">🤖</div>
                    <div class="message-content-wrapper">
                        👋 欢迎使用基于大模型的图片分析聊天演示！请选择一个AI模型开始对话。
                    </div>
        </div>

          <div 
            v-for="(message, index) in messages" 
            :key="index" 
            class="message"
            :class="{ 'assistant': message.isAssistant, 'user': !message.isAssistant }"
          >
            <div class="message-avatar">{{ message.avatar }}</div>
            <div class="message-content-wrapper">
              <!-- {{ message.content }} -->
              <!-- AI思考指示器，仅在AI消息且处于思考状态时显示 -->
              <AiThinkingIndicator
                v-if="message.isAssistant && message.isThinking"
                ref="thinkingIndicator"
                :assistant-type="currentAssistantType"
                :thinking-messages="thinkingMessages"
              />
              <!-- <MarkdownRenderer :content="message.content " /> -->

              <!-- 消息内容渲染
              <MarkdownRenderer 
                v-if="!message.isThinking || !message.isAssistant"
                :content="message.content" 
              />            

              <img 
                v-if="message.imageUrl" 
                :src="message.imageUrl" 
                class="message-image"
                :alt="message.imageAlt || '用户上传的图片'"
              > -->

              <!-- 文字+图片统一通过Markdown渲染 -->
              <MarkdownRenderer 
                v-if="!message.isThinking || !message.isAssistant"
                :content="formatMessageWithImage(message)"  
              />


            </div>
            
          </div>




      </div>

      <div class="chat-input">
        <div class="input-container">
          <div class="controls-section">
            <div class="custom-select-wrapper" @click.stop="toggleDropdown">
              <div id="customSelect" class="custom-select">
                <div class="custom-select-icon">{{ selectedModel?.icon || '🤖' }}</div>
                <div class="custom-select-text">{{ selectedModel ? selectedModel.name : '选择模型' }}</div>
                <div class="custom-select-arrow">{{ dropdownOpen ? '▲' : '▼' }}</div>
              </div>
              <div 
                id="customSelectDropdown" 
                class="custom-select-dropdown"
                v-if="dropdownOpen"
              >
                <div 
                  v-for="model in models" 
                  :key="model.id"
                  class="dropdown-item"
                  @click.stop="selectModel(model.id)"
                >
                  <div class="dropdown-item-icon">{{ model.icon }}</div>
                  <span>{{ model.name }}</span>
                </div>
              </div>
            </div>
            <div class="image-upload-container">
              <div class="image-upload-btn">
                <span>📷</span>
                <input 
                  type="file" 
                  class="image-upload-input" 
                  id="imageUpload" 
                  accept="image/*" 
                  @change="handleImageUpload"
                >
              </div>
            </div>
          </div>
          <textarea 
            id="messageInput" 
            placeholder="输入您的消息..." 
            v-model="newMessage"
            @keypress="handleKeyPress"
          ></textarea>
          <div class="image-preview" id="imagePreview" v-if="previewImageUrl">
            <img 
              :src="previewImageUrl" 
              class="preview-img"
              alt="预览图片"
            >
            <button class="remove-image" @click="removeImage">×</button>
          </div>
          <!-- <div class="enter-tip">Enter 发送</div> -->
          <div class="send-section">
            <span class="enter-tip">Enter 发送</span>
              <!-- 占位元素，用于推动按钮到最右侧 -->
            <div class="spacer"></div>
            <button 
              class="send-button" 
              id="sendButton" 
              @click="sendMessage"
              :disabled="!canSendMessage"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import MarkdownRenderer from './components/MarkdownRenderer.vue';
import AiThinkingIndicator from './components/AiThinkingIndicator.vue';

export default {
  components: {
    MarkdownRenderer,
    AiThinkingIndicator  // 新增的组件
  },
  data() {
    return {
      // 从后端获取模型数据
      models: [],
      // 当前选中的模型ID
      selectedModelId: null,
      // 下拉菜单是否展开
      dropdownOpen: false,
      // // 对话消息列表
      // messages: [],
      // // 新消息内容
      // newMessage: '',
      messages: [
        //   isThinking: false,
        //   imageUrl: null,
        //   imageAlt: null
        // }
      ],
      newMessage: '',
      currentAssistantType: 'default',
      thinkingMessages: [
        '正在思考...',
        '整理思路中...',
        '请稍候...'
      ],
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
    
   
    async fetchModels() {
      try {
        // const response = await axios.get('http://localhost:8000/providers'); // 修改为调用 /providers 接口
        // const providers = response.data.providers;
        
        // // 从提供商数据中提取模型信息
        // this.models = [];
        // providers.forEach(provider => {
        //   provider.models.forEach(model => {
        //     this.models.push({
        //       id: model.id || model.name, // 使用模型ID或名称作为唯一标识
        //       name: model.name || model.id,
        //       icon: provider.icon || '🤖',
        //       provider: provider.id,
        //       is_default: provider.is_default || false
        //     });
        //   });
        // });
        
        const response = await axios.get('http://localhost:8000/providers');
        const providers = response.data.providers;

        // 从提供商数据中提取模型信息
        this.models = [];
        providers.forEach(provider => {
          // 检查provider.models是字符串数组还是对象数组
          if (provider.models && Array.isArray(provider.models)) {
            provider.models.forEach(model => {
              // 如果model是字符串（模型名称）
              if (typeof model === 'string') {
                this.models.push({
                  id: model, // 使用模型名称作为ID
                  name: model,
                  icon: provider.icon || '🤖',
                  provider: provider.id,
                  is_default: provider.is_default || false
                });
              } 
              // 如果model是对象
              else if (typeof model === 'object') {
                this.models.push({
                  id: model.id || model.name,
                  name: model.name || model.id,
                  icon: provider.icon || '🤖',
                  provider: provider.id,
                  is_default: provider.is_default || false
                });
              }
            });
          }
        });
        // 如果没有获取到模型，使用默认的后备数据
        if (this.models.length === 0) {
          this.models = [
            { id: 'gpt-3.5', name: 'Deepseek-chat', icon: '🤖', provider: 'openai' },
            { id: 'gpt-4', name: 'Deepseek-reasoner', icon: '🧠', provider: 'openai' },
            { id: 'claude', name: 'Qianwen-VL', icon: '✨', provider: 'anthropic' },
          ];
        }
        
        // 设置默认选中的模型
        if (this.models.length > 0) {
          this.selectedModelId = this.models[0].id;
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
        // 设置默认模型作为后备
        this.models = [
          { id: 'gpt-3.5', name: 'Deepseek-chat', icon: '🤖', provider: 'openai' },
          { id: 'gpt-4', name: 'Deepseek-reasoner', icon: '🧠', provider: 'openai' },
          { id: 'claude', name: 'Qianwen-VL', icon: '✨', provider: 'anthropic' },
        ];
        if (this.models.length > 0) {
          this.selectedModelId = this.models[0].id;
        }
      }
    },
    
    // 获取用户的所有会话
    async fetchSessions() {
      try {
        const response = await axios.get('http://localhost:8000/chat/sessions', {
          params: { user_id: this.userId }
        });
        this.sessions = response.data.sessions;
      } catch (error) {
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
      if (!file) return;
      
      // 检查文件大小（10MB限制）
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过10MB');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('http://localhost:8000/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          this.imageFile = file;
          this.previewImageUrl = `data:${response.data.data.content_type};base64,${response.data.data.base64_data}`;
        }
      } catch (error) {
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
    
    formatMessageWithImage(message) {
      // 1. 基础文字内容（若没有则为空字符串）
      let content = message.content || "";
      // 2. 若存在图片URL，拼接Markdown图片语法（可根据需求调整图片位置，如文字前/后）
      if (message.imageUrl) {
        const imageAlt = message.imageAlt || "消息图片"; // 默认alt文本
        const markdownImage = `\n\n![${imageAlt}](${message.imageUrl})`; // 换行后插入图片
        content += markdownImage;
      }
      return content;
    },
    
    async sendMessage() {
      if (!this.canSendMessage) return;
      
      // 如果是新会话，先创建会话 
      if (!this.currentSessionId) {
        try {
          const response = await axios.post('http://localhost:8000/chat/start', null, {
            params: { user_id: this.userId }
          });
          this.currentSessionId = response.data.session_id;
          // 添加欢迎消息
          this.messages = [{
            isAssistant: true,
            avatar: this.selectedModel?.icon || '🤖',
            content: response.data.welcome_message
          }];
        } catch (error) {
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
    
      // 添加加载指示器
      const loadingMessage = {
        isAssistant: true,
        avatar: this.selectedModel?.icon || '🤖',
        content: '',
        isLoading: true,
        isThinking: true,  //新增AI思考过程
        messageId: Date.now() // 为消息添加唯一标识
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
      
      // 清空图片输入
      this.removeImage()
      
      // 发送消息到后端 - 使用流式处理
      try {
        const response = await fetch('http://localhost:8000/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {          
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 获取可读流
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponseContent = '';
        let loadingMessageIndex = this.messages.findIndex(msg => msg.isLoading);
        
        // 处理流式数据
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 解码并处理数据
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6)); // 移除 "data: " 前缀
                if (data.content) {
                  aiResponseContent += data.content;
                  
                  // 更新加载消息的内容
                  if (loadingMessageIndex !== -1) {
                    this.messages[loadingMessageIndex].isThinking = false; // 在这里关闭思考状态
                    this.messages[loadingMessageIndex].content = aiResponseContent;
                    this.scrollToBottom();
                  }
                }
              } catch (e) {
                console.error('解析流数据失败:', e, line);
              }
            }
          }
        }
        
        // 流结束后，移除加载状态
        if (loadingMessageIndex !== -1) {       
          this.messages[loadingMessageIndex].isLoading = false;
          this.messages[loadingMessageIndex].timestamp = Date.now();          
        }
        
        this.fetchSessions(); // 刷新会话列表
      } catch (error) {
        console.error('发送消息失败:', error);
        // 移除加载消息并显示错误
        const loadingMessageIndex = this.messages.findIndex(msg => msg.isLoading);
        if (loadingMessageIndex !== -1) {
          this.messages.splice(loadingMessageIndex, 1);
        }
        this.messages.push({
          isAssistant: true,
          avatar: this.selectedModel?.icon || '🤖',
          content: '抱歉，出错了: ' + error.message,
          timestamp: Date.now()
        });
      } finally {
        this.previewImageUrl = null;
        this.imageFile = null;
        this.scrollToBottom();
      }
    },

  async startNewChat() {
    try {
      // 调用后端创建会话接口
      const response = await axios.post('http://localhost:8000/chat/start', null, {
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
    } catch (error) {
      console.error('创建新会话失败：', error);
      alert('新建对话失败，请重试！');
    }
  },
  // 新增：获取用户会话列表（用于前端显示历史会话）
  async fetchSessionList() {
    try {
      const response = await axios.get('http://localhost:8000/chat/sessions', {
        params: { user_id: this.userId }
      });
      this.sessionList = response.data.sessions; // 存储会话列表到前端状态
    } catch (error) {
      console.error('获取会话列表失败：', error);
    }
  },

    
    
    // 清除当前会话历史
    async clearHistory() {
      if (!this.currentSessionId) return;
      
      if (confirm('确定要清除当前对话历史吗？')) {
        try {
          await axios.delete(`http://localhost:8000/chat/history/${this.currentSessionId}`, {
            params: { user_id: this.userId }
          });
          
          this.messages = [{
            isAssistant: true,
            avatar: this.selectedModel?.icon || '🤖',
            content: '对话历史已清除'
          }];
          
          this.fetchSessions(); // 刷新会话列表
        } catch (error) {
          console.error('清除历史失败:', error);
          alert('清除历史失败');
        }
      }
    },
    
    // 加载会话历史
    async loadSession(sessionId) {
      try {
        const response = await axios.get('http://localhost:8000/chat/history', {
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
      } catch (error) {
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
          await axios.delete(`http://localhost:8000/chat/session/${sessionId}`, {
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
        } catch (error) {
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
};



</script>




