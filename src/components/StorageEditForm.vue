<script lang="ts" setup>
import type { StorageItem } from "../entrypoints/devtools-panel/use-app-store";

const props = defineProps<{
  item: StorageItem;
}>();

const emit = defineEmits<{
  (e: "update:item", value: StorageItem): void;
  (e: "save", item: StorageItem): void;
  (e: "cancel"): void;
}>();

const updateItem = (key: keyof StorageItem, value: string) => {
  emit("update:item", {
    ...props.item,
    [key]: value,
  });
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
        :value="item.key"
        @input="(e) => updateItem('key', (e.target as HTMLInputElement).value)"
      />
    </div>
    <div class="form-control w-full mt-4">
      <label class="label">
        <span class="label-text">Value</span>
      </label>
      <textarea
        class="textarea textarea-bordered w-full h-32"
        :value="item.value"
        @input="
          (e) => updateItem('value', (e.target as HTMLTextAreaElement).value)
        "
      ></textarea>
    </div>
    <div class="mt-4 flex gap-2">
      <button class="btn btn-sm" @click="emit('cancel')">取消</button>
      <button class="btn btn-sm btn-primary" @click="emit('save', item)">
        保存
      </button>
    </div>
  </div>
</template>
