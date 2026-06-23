import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveUserData, getUserData, clearUserData } from '../storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('saveUserData / getUserData', () => {
    it('saves and retrieves data correctly', () => {
      const data = { latestResult: { total: 500 }, inputs: { diet: 'vegan' } };
      saveUserData(data);
      expect(getUserData()).toEqual(data);
    });

    it('returns null when no data exists', () => {
      expect(getUserData()).toBeNull();
    });

    it('overwrites existing data on second save', () => {
      saveUserData({ total: 100 });
      saveUserData({ total: 200 });
      expect(getUserData()).toEqual({ total: 200 });
    });

    it('preserves nested objects', () => {
      const data = {
        latestResult: { total: 800, breakdown: { transport: 300, food: 200, energy: 250, shopping: 50 } },
        actions: { stats: { totalPoints: 30, totalCo2Saved: 8 } }
      };
      saveUserData(data);
      expect(getUserData()).toEqual(data);
    });
  });

  describe('getUserData — error handling', () => {
    it('returns null for corrupted JSON without throwing', () => {
      localStorage.setItem('carboniq_data', '{not valid json}}');
      expect(() => getUserData()).not.toThrow();
      expect(getUserData()).toBeNull();
    });

    it('returns null when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      expect(() => getUserData()).not.toThrow();
      expect(getUserData()).toBeNull();
    });
  });

  describe('clearUserData', () => {
    it('removes stored data', () => {
      saveUserData({ total: 500 });
      clearUserData();
      expect(getUserData()).toBeNull();
    });

    it('does not throw when called on empty storage', () => {
      expect(() => clearUserData()).not.toThrow();
    });
  });

  describe('saveUserData — error handling', () => {
    it('does not throw when localStorage.setItem fails', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => saveUserData({ total: 100 })).not.toThrow();
    });
  });
});
