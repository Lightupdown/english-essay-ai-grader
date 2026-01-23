
import { EssayRecord } from '../types';

const STORAGE_KEY = 'essay_history';

export const getEssays = (): EssayRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

export const saveEssay = (essay: EssayRecord): void => {
  const history = getEssays();
  const index = history.findIndex(h => h.id === essay.id);
  if (index > -1) {
    history[index] = essay;
  } else {
    history.unshift(essay);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
};

export const updateEssay = (id: string, updates: Partial<EssayRecord>): void => {
  const history = getEssays();
  const index = history.findIndex(h => h.id === id);
  if (index > -1) {
    history[index] = { ...history[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
};

export const deleteEssay = (id: string): void => {
  const history = getEssays().filter(h => h.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const clearAll = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getEssay = (id: string): EssayRecord | undefined => {
  return getEssays().find(h => h.id === id);
};
