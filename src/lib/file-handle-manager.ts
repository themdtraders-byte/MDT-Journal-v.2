
'use client';

// A simple key-value store using IndexedDB
const idbKeyval = {
  get: <T>(key: IDBValidKey): Promise<T | undefined> => {
    return new Promise((resolve) => {
      const openReq = indexedDB.open('keyval-db', 1);
      openReq.onupgradeneeded = () => {
        openReq.result.createObjectStore('keyval');
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('keyval', 'readonly');
        const store = tx.objectStore('keyval');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result);
        tx.oncomplete = () => db.close();
      };
      openReq.onerror = () => resolve(undefined); // Resolve with undefined on error
    });
  },
  set: (key: IDBValidKey, value: any): Promise<void> => {
    return new Promise((resolve) => {
      const openReq = indexedDB.open('keyval-db', 1);
      openReq.onupgradeneeded = () => {
        openReq.result.createObjectStore('keyval');
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.put(value, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  },
  delete: (key: IDBValidKey): Promise<void> => {
    return new Promise((resolve) => {
       const openReq = indexedDB.open('keyval-db', 1);
      openReq.onupgradeneeded = () => {
        openReq.result.createObjectStore('keyval');
      };
      openReq.onsuccess = () => {
        const db = openReq.result;
        const tx = db.transaction('keyval', 'readwrite');
        const store = tx.objectStore('keyval');
        store.delete(key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  },
};


export const storeHandle = async (journalId: string, handle: FileSystemFileHandle): Promise<void> => {
    await idbKeyval.set(`auto-backup-handle-${journalId}`, handle);
};

export const getHandle = async (journalId: string): Promise<FileSystemFileHandle | null> => {
    if (typeof window === 'undefined' || !window.indexedDB) return null;
    
    const handle = await idbKeyval.get<FileSystemFileHandle>(`auto-backup-handle-${journalId}`);
    if (!handle) return null;

    // Check if we still have permission. If so, return the handle.
    if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
        return handle;
    }
    
    // If permission is not granted, try to request it again.
    // This will prompt the user if permission was 'prompt' or denied previously.
    if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') {
        return handle;
    }

    // If permission is still not granted (e.g., user denied it again), we can't use the handle.
    return null;
};

export const deleteHandle = async (journalId: string): Promise<void> => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    await idbKeyval.delete(`auto-backup-handle-${journalId}`);
};
