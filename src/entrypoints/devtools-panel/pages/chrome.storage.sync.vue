<script lang="ts" setup>
import { ref } from "vue";
import { useAppStore, type StorageItem } from "../use-app-store";
import StorageActions from "../../../components/StorageActions.vue";
import StorageTable from "../../../components/StorageTable.vue";
import StorageForm from "../../../components/StorageForm.vue";
import { doChromeStorage } from "@/utils/chrome-storage";

const store = useAppStore();
const { chromeSessionStorageItems } = store;

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
  editingItem.value = { ...item };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = () => {
  // 调用保存chrome存储的方法
  doChromeStorage("setSyncStorage", editingItem.value);
  isEditing.value = false;
};

const handleDelete = (item: StorageItem) => {
  doChromeStorage("removeSyncStorage", { key: item.key });
};

const clearStorage = () => {
  doChromeStorage("clearSyncStorage");
};

const addItem = () => {
  isAdding.value = true;
};

const cancelAdd = () => {
  isAdding.value = false;
};

const saveNewItem = (item: StorageItem) => {
  doChromeStorage("setSyncStorage", item);
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
      :items="chromeSessionStorageItems"
      @edit="handleEdit"
      @delete="handleDelete"
      storage-type="chrome"
    />
  </div>
</template>
