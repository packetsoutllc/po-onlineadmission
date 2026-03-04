import { AppState } from '../types';
import { INITIAL_STAFF } from '../constants';

const STORAGE_KEY = 'mediroster_data_v2';

const defaultState: AppState = {
  currentUser: null,
  staff: INITIAL_STAFF,
  schedule: [],
  lastSync: Date.now(),
  unsyncedChanges: 0,
};

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return defaultState;
    }
    const parsed = JSON.parse(serializedState);
    // Migration helper: ensure new fields exist
    return { ...defaultState, ...parsed };
  } catch (err) {
    console.error("Could not load state", err);
    return defaultState;
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Could not save state", err);
  }
};

export const syncWithCloud = async (state: AppState): Promise<AppState> => {
  // Simulate network latency and server confirmation
  return new Promise((resolve) => {
    setTimeout(() => {
      const syncedSchedule = state.schedule.map(s => ({ ...s, synced: true }));
      const newState = {
        ...state,
        schedule: syncedSchedule,
        lastSync: Date.now(),
        unsyncedChanges: 0 // Reset counter
      };
      saveState(newState);
      resolve(newState);
    }, 2000);
  });
};
