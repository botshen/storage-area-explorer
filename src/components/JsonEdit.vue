<script lang="ts" setup>
import { createJSONEditor } from "vanilla-jsoneditor";
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps<{
  value?: any;
}>();

const emit = defineEmits<{
  (e: "update:value", value: any): void;
}>();

const jsonEditorContainer = ref<HTMLDivElement>();
const responseEditor = ref<any>(null);
const forceType = ref<"auto" | "string" | "number">("auto");

// 处理值的转换
const processValue = (text: string) => {
  if (forceType.value === "string") {
    return text;
  } else if (forceType.value === "number") {
    if (text.trim() === "") {
      return text;
    }
    const num = Number(text);
    return isNaN(num) ? text : num;
  } else {
    // auto模式：尝试解析JSON
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
};

// 格式化显示值
const formatDisplayValue = (value: any): string => {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

onMounted(() => {
  if (jsonEditorContainer.value) {
    responseEditor.value = createJSONEditor({
      target: jsonEditorContainer.value,
      props: {
        mode: "text",
        showEditor: true,
        readOnly: false,
        content: {
          text: formatDisplayValue(props.value) || "",
          json: undefined,
        },
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
        indentation: 2,
        tabSize: 2,
        escapeControlCharacters: false,
        escapeUnicodeCharacters: false,
        validator: null,
        onChange: (updatedContent: any) => {
          if (updatedContent.text !== undefined) {
            const processedValue = processValue(updatedContent.text);
            emit("update:value", processedValue);
          }
        },
      },
    });
  }
});

// 监听props.value变化，更新编辑器内容（仅在初始化时更新，避免编辑时被格式化）
let isInitialized = false;
watch(
  () => props.value,
  (newValue) => {
    if (responseEditor.value && !isInitialized) {
      const displayValue = formatDisplayValue(newValue);
      responseEditor.value.update({
        text: displayValue,
        json: undefined,
      });
      isInitialized = true;
    }
  },
  { deep: true, immediate: true },
);

// 监听forceType变化，重新处理当前值（不更新编辑器显示，只处理数据）
watch(forceType, () => {
  if (responseEditor.value) {
    const currentText = responseEditor.value.get().text;
    if (currentText !== undefined) {
      const processedValue = processValue(currentText);
      emit("update:value", processedValue);
    }
  }
});

// 组件卸载时清理
onUnmounted(() => {
  if (responseEditor.value) {
    responseEditor.value.destroy();
  }
});
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <div class="flex items-center gap-2 mb-1">
      <span class="text-sm font-medium">值类型:</span>
      <select v-model="forceType" class="select select-sm select-bordered">
        <option value="auto">自动 (JSON)</option>
        <option value="string">强制字符串</option>
        <option value="number">强制数字</option>
      </select>
    </div>

    <div
      ref="jsonEditorContainer"
      class="w-full !max-h-[350px] jse-theme-light overflow-auto"
    ></div>

    <div class="flex justify-end gap-2">
      <div class="text-sm text-gray-500">
        <span v-if="forceType === 'number'">将强制作为数字处理</span>
        <span v-else-if="forceType === 'string'">将强制作为字符串处理</span>
        <span v-else>尝试解析为JSON，支持对象、数组、数字、字符串等</span>
      </div>
    </div>
  </div>
</template>
