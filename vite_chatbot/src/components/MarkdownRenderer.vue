<!-- components/MarkdownRenderer.vue -->
<template>
  <div class="markdown-container">
    <div 
      ref="markdownElement" 
      class="markdown-content" 
      v-html="safeHtml"
    />
  </div>
</template>

<script>
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // 选择你喜欢的主题

// 配置 marked 使用 highlight.js 进行代码高亮
marked.setOptions({
  breaks: true, // 换行转换为 <br>
  gfm: true,    // 启用 GitHub Flavored Markdown
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, code).value;
      } catch (err) {
        console.warn(`代码高亮错误 (语言: ${lang}):`, err);
      }
    }
    
    // 如果没有指定语言或语言不支持，尝试自动检测
    try {
      return hljs.highlightAuto(code).value;
    } catch (err) {
      console.warn('自动代码高亮错误:', err);
      return code; // 出错时返回原始代码
    }
  }
});

// 可选：注册常用的语言（减少包大小）
// import javascript from 'highlight.js/lib/languages/javascript';
// import python from 'highlight.js/lib/languages/python';
// import java from 'highlight.js/lib/languages/java';
// import css from 'highlight.js/lib/languages/css';
// import html from 'highlight.js/lib/languages/xml';
// hljs.registerLanguage('javascript', javascript);
// hljs.registerLanguage('python', python);
// hljs.registerLanguage('java', java);
// hljs.registerLanguage('css', css);
// hljs.registerLanguage('html', html);

export default {
  name: 'MarkdownRenderer',
  props: {
    content: {
      type: String,
      default: ''
    },
    streaming: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    safeHtml() {
      const rawHtml = marked(this.content);
      return DOMPurify.sanitize(rawHtml);
    }
  },
  watch: {
    content() {
      // 内容更新时重新高亮代码
      this.$nextTick(() => {
        this.highlightCodeBlocks();
        this.scrollToBottom();
      });
    }
  },
  mounted() {
    this.highlightCodeBlocks();
    this.scrollToBottom();
  },
  methods: {
    // 手动高亮所有代码块（确保动态添加的代码也能高亮）
    highlightCodeBlocks() {
      if (this.$refs.markdownElement) {
        const codeBlocks = this.$refs.markdownElement.querySelectorAll('pre code');
        codeBlocks.forEach((block) => {
          // 如果已经被 highlight.js 处理过，跳过
          if (!block.classList.contains('hljs')) {
            hljs.highlightElement(block);
          }
        });
      }
    },
    
    scrollToBottom() {
      if (this.$refs.markdownElement && this.streaming) {
        const element = this.$refs.markdownElement;
        element.scrollTop = element.scrollHeight;
      }
    }
  }
}
</script>

<style scoped>
.markdown-container {
  margin: 10px 0; /* 上下各留10px间距，与其他元素区分开 */
  padding: 0 8px; /* 左右各留8px内边距，避免内容贴容器边缘 */
  /* max-height: 400px;
  overflow-y: auto; */
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(img) {
    /* 1. 统一固定宽度（所有图片都用这个宽度） */
  width: 300px; 
  /* 2. 高度自动计算（按原图比例适配宽度，避免变形） */
  height: auto; 
  /* 3. 辅助样式：水平居中+间距+美化 */
  display: block;        /* 块级元素才能水平居中 */
  margin: 16px auto;     /* 上下间距16px，左右自动（居中） */
  max-width: 100%;       /* 兼容小屏幕：宽度不超过父容器（防止溢出） */
  border-radius: 8px;    /* 圆角（可选，美化） */
}


/* Markdown 内容样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 1em 0 0.5em 0;
  font-weight: bold;
}

.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(code:not(.hljs)) {
  background-color: #f4f4f4;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #ed0520;
}

.markdown-content :deep(pre) {
  background-color: #f8f9fa;
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1em 0;
  border: 1px solid #e9ecef;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
  border-radius: 0;
}

/* 代码高亮相关样式 */
.markdown-content :deep(.hljs) {
  font-family: 'Fira Code', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 0.9em;
  line-height: 1.5;
}

.markdown-content :deep(.hljs::-webkit-scrollbar) {
  height: 6px;
}

.markdown-content :deep(.hljs::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

.markdown-content :deep(.hljs::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
}

.markdown-content :deep(.hljs::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #ddd;
  margin: 1em 0;
  padding-left: 1em;
  color: #666;
  background-color: #f9f9f9;
  padding: 1em;
  border-radius: 4px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  font-size: 0.9em;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #ddd;
  padding: 0.75em;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: #f5f5f5;
  font-weight: bold;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: #f9f9f9;
}

</style>