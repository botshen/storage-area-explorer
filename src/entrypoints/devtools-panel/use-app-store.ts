export interface StorageItem {
  id: number;
  key: string;
  value: string;
}

const items = ref<StorageItem[]>([]);

const getLocalStorage = () => {
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key);
        }
      }
      return storage;
    })()`,
    (result, isException) => {
      if (isException) {
        console.error("Error fetching localStorage:", isException);
        return;
      }

      const storageItems: StorageItem[] = Object.entries(
        result as Record<string, string>,
      ).map(([key, value], index) => ({
        id: index + 1,
        key,
        value: value || "",
      }));
      console.log("storageItems", storageItems);
      items.value = storageItems;
    },
  );
};

export const useAppStore = () => {
  return {
    getLocalStorage,
    items,
  };
};
