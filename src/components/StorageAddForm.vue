<script lang="ts" setup>
import type { StorageItem } from "../entrypoints/devtools-panel/use-app-store";
import { ref } from "vue";

const emit = defineEmits<{
  (e: "save", item: StorageItem): void;
  (e: "cancel"): void;
}>();

const newItem = ref<StorageItem>({
  id: Date.now(),
  key: "",
  value: "",
});

const save = () => {
  if (!newItem.value.key) {
    return;
  }
  emit("save", newItem.value);
  // 重置表单
  newItem.value = {
    id: Date.now(),
    key: "",
    value: "",
  };
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
        v-model="newItem.key"
        placeholder="Enter key"
      />
    </div>
    <div class="form-control w-full mt-4">
      <label class="label">
        <span class="label-text">Value</span>
      </label>
      <textarea
        class="textarea textarea-bordered w-full h-32"
        v-model="newItem.value"
        placeholder="Enter value"
      ></textarea>
    </div>
    <div class="mt-4 flex gap-2">
      <button class="btn btn-sm" @click="emit('cancel')">取消</button>
      <button
        class="btn btn-sm btn-primary"
        @click="save"
        :disabled="!newItem.key"
      >
        添加
      </button>
    </div>
  </div>
</template>
