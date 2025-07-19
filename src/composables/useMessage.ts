import { ref, readonly } from 'vue';

// 定义消息对象的接口
export interface Message {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
  duration: number;
}

// 使用 ref 创建一个响应式的消息数组
const messages = ref<Message[]>([]);

// 显示消息的函数
const showMessage = (
  text: string,
  type: 'info' | 'success' | 'error' = 'info',
  duration = 3000
) => {
  const id = Date.now() + Math.random();
  messages.value.push({ id, text, type, duration });

  // 在指定时间后自动移除消息
  setTimeout(() => {
    removeMessage(id);
  }, duration);
};

// 移除消息的函数
const removeMessage = (id: number) => {
  const index = messages.value.findIndex(m => m.id === id);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
};

// 导出一个可组合函数
export function useMessage() {
  return {
    messages: readonly(messages), // 只暴露只读版本给UI组件
    showMessage
  };
}