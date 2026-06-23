// storage.js
const STORAGE_KEY = 'carboniq_data';

export const saveUserData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage:', e);
  }
};

export const getUserData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    // Corrupted data — return null so the app degrades gracefully
    return null;
  }
};

export const clearUserData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
