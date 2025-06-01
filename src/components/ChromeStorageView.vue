<script lang="ts" setup>
import { ref, toRaw, computed } from "vue";
import {
  useAppStore,
  type StorageItem,
} from "../entrypoints/devtools-panel/use-app-store";
import StorageActions from "./StorageActions.vue";
import StorageTable from "./StorageTable.vue";
import StorageForm from "./StorageForm.vue";
import { doChromeStorage } from "@/utils/chrome-storage";

const props = defineProps<{
  storageType: "local" | "sync";
}>();

const store = useAppStore();
const items = computed<StorageItem[]>(() =>
  props.storageType === "local"
    ? store.chromeLocalStorageItems.value
    : store.chromeSessionStorageItems.value,
);

// 添加编辑相关的状态和方法
const editingItem = ref<StorageItem>({
  id: 0,
  key: "",
  value: "",
});

// 添加编辑状态控制
const isEditing = ref(false);
const isAdding = ref(false);

const handleEdit = (item: StorageItem) => {
  const rawItem = toRaw(item);
  editingItem.value = rawItem;
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = (item: StorageItem) => {
  // 调用保存chrome存储的方法
  doChromeStorage(
    props.storageType === "local" ? "setLocalStorage" : "setSyncStorage",
    item,
  );
  isEditing.value = false;
};

const handleDelete = (item: StorageItem) => {
  doChromeStorage(
    props.storageType === "local" ? "removeLocalStorage" : "removeSyncStorage",
    { key: item.key },
  );
};

const clearStorage = () => {
  doChromeStorage(
    props.storageType === "local" ? "clearLocalStorage" : "clearSyncStorage",
  );
};

const addItem = () => {
  isAdding.value = true;
};

const cancelAdd = () => {
  isAdding.value = false;
};

const saveNewItem = (item: StorageItem) => {
  doChromeStorage(
    props.storageType === "local" ? "setLocalStorage" : "setSyncStorage",
    item,
  );
  isAdding.value = false;
};
</script>

<template>
  <div class="h-full">
    <StorageActions @add="addItem" @clear="clearStorage" />

    <!-- 添加界面 -->
    <StorageForm
      v-if="isAdding"
      mode="add"
      type="extension"
      @save="saveNewItem"
      @cancel="cancelAdd"
    />

    <!-- 编辑界面 -->
    <StorageForm
      v-else-if="isEditing"
      type="extension"
      mode="edit"
      v-model:item="editingItem"
      @save="saveEdit"
      @cancel="cancelEdit"
    />

    <!-- 表格界面 -->
    <StorageTable
      v-else
      :items="items"
      @edit="handleEdit"
      @delete="handleDelete"
      storage-type="chrome"
    />
  </div>
</template>
