<script lang="ts" setup>
import { ref } from "vue";
import { useAppStore, type StorageItem } from "../use-app-store";
import StorageActions from "../../../components/StorageActions.vue";
import StorageTable from "../../../components/StorageTable.vue";
import StorageForm from "../../../components/StorageForm.vue";

const store = useAppStore();
const { sessionStorageItems, getSessionStorage } = store;

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
  // 保存编辑后的值
  const { key, value } = editingItem.value;
  const safeValue = JSON.stringify(value);

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        sessionStorage.setItem('${key}', ${safeValue});
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
        getSessionStorage();
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
        sessionStorage.removeItem('${key}');
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
        getSessionStorage();
      }
    },
  );
};

const clearStorage = () => {
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        sessionStorage.clear();
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
        getSessionStorage();
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
  const safeValue = JSON.stringify(item.value);
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        sessionStorage.setItem('${item.key}', ${safeValue});
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
        getSessionStorage();
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
      @save="saveNewItem"
      @cancel="cancelAdd"
    />

    <!-- 编辑界面 -->
    <StorageForm
      v-else-if="isEditing"
      mode="edit"
      v-model:item="editingItem"
      @save="saveEdit"
      @cancel="cancelEdit"
    />

    <!-- 表格界面 -->
    <StorageTable
      v-else
      :items="sessionStorageItems"
      @edit="openEdit"
      @delete="deleteItem"
      storage-type="window"
    />
  </div>
</template>
