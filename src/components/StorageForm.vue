<script lang="ts" setup>
import type { StorageItem } from "../entrypoints/devtools-panel/use-app-store";
import { ref, computed } from "vue";

const props = defineProps<{
  mode?: "add" | "edit";
  item?: StorageItem;
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

const save = () => {
  if (isEditMode.value && props.item) {
    emit("save", props.item);
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
  <div class="mt-4 px-1 pr-4">
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
    <div class="form-control w-full mt-4">
      <label class="label">
        <span class="label-text">Value</span>
      </label>
      <textarea
        class="textarea textarea-bordered w-full h-32"
        :value="isEditMode ? item?.value : localItem.value"
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
