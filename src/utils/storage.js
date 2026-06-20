// storage.js
const STORAGE_KEY = 'carboniq_data';

export const saveUserData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getUserData = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearUserData = () => {
  localStorage.removeItem(STORAGE_KEY);
};
