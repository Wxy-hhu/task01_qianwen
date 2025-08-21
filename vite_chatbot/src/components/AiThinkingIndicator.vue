<template>
  <div class="ai-thinking-indicator">
    <div class="thinking-spinner" :class="indicatorClass"></div>
    <div class="thinking-message">
      {{ currentThinkingMessage }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'AiThinkingIndicator',
  props: {
    // 助手类型，用于定制不同的指示器样式
    assistantType: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['default', 'technical', 'creative', 'analytical'].includes(value);
      }
    },
    // 思考时显示的消息列表
    thinkingMessages: {
      type: Array,
      default: () => [
        '正在思考...',
        '整理思路中...',
        '请稍候...',
        '正在分析您的问题...',
        '正在生成回复...'
      ]
    }
  },
  data() {
    return {
      messageIndex: 0,
      messageInterval: null
    };
  },
  computed: {
    // 当前显示的思考消息
    currentThinkingMessage() {
      return this.thinkingMessages[this.messageIndex];
    },
    // 根据助手类型返回不同的样式类
    indicatorClass() {
      const baseClass = 'spinner';
      switch (this.assistantType) {
        case 'technical':
          return `${baseClass} technical`;
        case 'creative':
          return `${baseClass} creative`;
        case 'analytical':
          return `${baseClass} analytical`;
        default:
          return baseClass;
      }
    }
  },
  mounted() {
    // 启动消息轮换
    this.startMessageRotation();
  },
  beforeUnmount() {
    // 清除定时器
    if (this.messageInterval) {
      clearInterval(this.messageInterval);
    }
  },
  methods: {
    // 定时轮换思考消息
    startMessageRotation() {
      this.messageInterval = setInterval(() => {
        this.messageIndex = (this.messageIndex + 1) % this.thinkingMessages.length;
      }, 2000); // 每2秒切换一次消息
    }
  }
};
</script>

<style scoped>
.ai-thinking-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  /* background-color: #f5f7fa; */
  color: #4a5568;
  font-size: 14px;
}

.thinking-message {
  line-height: 1.5;
}

/* 加载指示器样式 */
.thinking-spinner {
  width: 20px;
  height: 20px;
}

.spinner {
  border: 2px solid rgba(74, 85, 104, 0.1);
  border-left-color: #4a5568;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 不同助手类型的指示器颜色 */
.spinner.technical {
  border-left-color: #3182ce; /* 技术型 - 蓝色 */
}

.spinner.creative {
  border-left-color: #805ad5; /* 创意型 - 紫色 */
}

.spinner.analytical {
  border-left-color: #38b2ac; /* 分析型 - 青绿色 */
}

/* 旋转动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
