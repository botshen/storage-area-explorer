<script lang="ts" setup>
import type { StorageItem } from "../entrypoints/devtools-panel/use-app-store";
import { ref, computed } from "vue";
import JsonEdit from "./JsonEdit.vue";

const props = defineProps<{
  mode?: "add" | "edit";
  item?: StorageItem;
  stringOnly?: boolean;
  type?: "window" | "extension";
}>();

const emit = defineEmits<{
  (e: "update:item", value: StorageItem): void;
  (e: "save", item: StorageItem): void;
  (e: "cancel"): void;
}>();

const localItem = ref<StorageItem>(
  props.item || {
    id: Date.now(),
    key: "",
    value: "",
  },
);

// 处理编辑模式的状态同步
const isEditMode = computed(() => props.mode === "edit");

// 在编辑模式下，当props.item变化时更新本地状态
// 但是在添加模式下使用本地状态
if (isEditMode.value && props.item) {
  localItem.value = { ...props.item };
}

// 更新编辑模式下的item
const updateItem = (key: keyof StorageItem, value: string) => {
  if (isEditMode.value) {
    emit("update:item", {
      ...props.item!,
      [key]: value,
    });
  } else {
    localItem.value = {
      ...localItem.value,
      [key]: value,
    };
  }
};

// 处理JSON编辑器确认事件
const handleJsonConfirm = (value: any) => {
  console.log("value", value);
  // 将格式化后的JSON值更新到item中
  // updateItem('value', typeof value === 'string' ? value : JSON.stringify(value));
};

// 添加一个计算属性来格式化 value
const formattedValue = computed(() => {
  const value = isEditMode.value ? props.item?.value : localItem.value.value;
  console.log("value", value);
  // 如果是 stringOnly 模式，则直接返回原始值
  if (props.stringOnly) {
    return value;
  }

  // 直接返回原始值，不再进行格式化
  return value;
});

const save = () => {
  if (isEditMode.value && props.item) {
    console.log("localItem.value", localItem.value);
    emit("save", localItem.value);
  } else {
    if (!localItem.value.key) {
      return;
    }
    emit("save", localItem.value);
    // 重置表单
    localItem.value = {
      id: Date.now(),
      key: "",
      value: "",
    };
  }
};
</script>

<template>
  <div class="mt-4 px-1 pr-4 h-full flex flex-col gap-2 pb-4">
    <div class="form-control w-full">
      <label class="label">
        <span class="label-text">Key</span>
      </label>
      <input
        type="text"
        class="input input-bordered w-full"
        :value="isEditMode ? item?.key : localItem.key"
        @input="
          (e: Event) => updateItem('key', (e.target as HTMLInputElement).value)
        "
        placeholder="Enter key"
      />
    </div>
    <div class="form-control w-full flex-1">
      <label class="label">
        <span class="label-text">Value</span>
      </label>

      <JsonEdit
        v-if="type === 'extension'"
        :value="formattedValue"
        @update:value="updateItem('value', $event)"
        @confirm="handleJsonConfirm"
      />
      <textarea
        v-else
        class="textarea textarea-bordered w-full h-full"
        :value="
          typeof formattedValue === 'string'
            ? formattedValue
            : String(formattedValue)
        "
        @input="
          (e: Event) =>
            updateItem('value', (e.target as HTMLTextAreaElement).value)
        "
        placeholder="Enter value"
      ></textarea>
    </div>
    <div class="mt-4 flex gap-2">
      <button class="btn btn-sm" @click="emit('cancel')">取消</button>
      <button
        class="btn btn-sm btn-primary"
        @click="save"
        :disabled="isEditMode ? false : !localItem.key"
      >
        {{ isEditMode ? "保存" : "添加" }}
      </button>
    </div>
  </div>
</template>
