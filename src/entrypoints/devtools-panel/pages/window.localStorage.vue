<script lang="ts" setup>
import { ref } from "vue";
import { useAppStore, type StorageItem } from "../use-app-store";
import StorageActions from "../../../components/StorageActions.vue";
import StorageTable from "../../../components/StorageTable.vue";
import StorageForm from "../../../components/StorageForm.vue";

const store = useAppStore();
const { localStorageItems, getLocalStorage } = store;

// 添加编辑相关的状态和方法
const editingItem = ref<StorageItem>({
  id: 0,
  key: "",
  value: "",
});

// 添加编辑状态控制
const isEditing = ref(false);
const isAdding = ref(false);

const openEdit = (item: StorageItem) => {
  editingItem.value = { ...item };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = () => {
  const { key, value } = editingItem.value;

  // 修复字符串处理逻辑
  const safeValue = typeof value === "string" ? value : JSON.stringify(value);

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        localStorage.setItem('${key}', '${safeValue}');
        return true;
      } catch (e) {
        console.error('保存失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("保存失败:", isException);
      } else {
        // 刷新数据
        getLocalStorage();
      }
      isEditing.value = false;
    },
  );
};

const deleteItem = (item: StorageItem) => {
  const { key } = item;

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        localStorage.removeItem('${key}');
        return true;
      } catch (e) {
        console.error('删除失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("删除失败:", isException);
      } else {
        // 刷新数据
        getLocalStorage();
      }
    },
  );
};

const clearStorage = () => {
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('清空失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("清空失败:", isException);
      } else {
        // 刷新数据
        getLocalStorage();
      }
    },
  );
};

const addItem = () => {
  isAdding.value = true;
};

const cancelAdd = () => {
  isAdding.value = false;
};

const saveNewItem = (item: StorageItem) => {
  // 由于 localStorage 只能存储字符串，不需要额外的 JSON.stringify
  const safeValue =
    typeof item.value === "string"
      ? `"${item.value}"`
      : JSON.stringify(item.value);

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        localStorage.setItem('${item.key}', ${safeValue});
        return true;
      } catch (e) {
        console.error('保存失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("保存失败:", isException);
      } else {
        // 刷新数据
        getLocalStorage();
        isAdding.value = false;
      }
    },
  );
};
</script>

<template>
  <div class="h-full">
    <StorageActions @add="addItem" @clear="clearStorage" />

    <!-- 添加界面 -->
    <StorageForm
      v-if="isAdding"
      mode="add"
      stringOnly
      type="window"
      @save="saveNewItem"
      @cancel="cancelAdd"
    />

    <!-- 编辑界面 -->
    <StorageForm
      v-else-if="isEditing"
      mode="edit"
      stringOnly
      type="window"
      v-model:item="editingItem"
      @save="saveEdit"
      @cancel="cancelEdit"
    />

    <!-- 表格界面 -->
    <StorageTable
      v-else
      :items="localStorageItems"
      @edit="openEdit"
      @delete="deleteItem"
      storage-type="window"
    />
  </div>
</template>
