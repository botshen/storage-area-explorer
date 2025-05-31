<script lang="ts" setup>
import { createJSONEditor } from "vanilla-jsoneditor";
import { ref, onMounted, watch, onUnmounted } from "vue";

const props = defineProps<{
  value: any;
  autoFormat?: boolean;
}>();

const emit = defineEmits<{
  (e: "confirm", value: any): void;
}>();

const jsonEditorContainer = ref<HTMLDivElement>();
const responseEditor = ref<any>(null);
const internalValue = ref(props.value);

// 将任何值转换为文本
const valueToText = (val: any) => {
  if (typeof val === "string") {
    return val;
  }
  return JSON.stringify(val, null, 2);
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
          text: valueToText(props.value),
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
          console.log("updatedContent", updatedContent);
          if (updatedContent.text !== undefined) {
            internalValue.value = updatedContent.text;
          }
        },
      },
    });
  }
});

// 初始化时设置内部值，之后不再监听外部变化
internalValue.value = props.value;

// 确认按钮处理函数
const confirmEdit = () => {
  try {
    // 尝试解析JSON
    const parsed = JSON.parse(internalValue.value);
    emit("confirm", parsed);
  } catch (e) {
    // 如果不是有效的JSON，则返回原始文本
    emit("confirm", internalValue.value);
  }
};

// 组件卸载时清理
onUnmounted(() => {
  if (responseEditor.value) {
    responseEditor.value.destroy();
  }
});
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <div
      ref="jsonEditorContainer"
      class="w-full !max-h-[350px] jse-theme-light"
    ></div>
    <div class="flex justify-end">
      <button class="btn btn-sm btn-primary" @click="confirmEdit">确认</button>
    </div>
  </div>
</template>
