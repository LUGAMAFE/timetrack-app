import { create } from 'zustand';

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  selectedCategoryId: string | null;
  startTime: Date | null;
  setSelectedCategory: (id: string | null) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { startTime: Date | null; endTime: Date; elapsedSeconds: number };
  resetTimer: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  elapsedSeconds: 0,
  selectedCategoryId: null,
  startTime: null,

  setSelectedCategory: (id) => set({ selectedCategoryId: id }),

  startTimer: () => {
    set({ isRunning: true, isPaused: false, elapsedSeconds: 0, startTime: new Date() });
  },

  pauseTimer: () => set({ isPaused: true }),

  resumeTimer: () => set({ isPaused: false }),

  stopTimer: () => {
    const state = get();
    const result = {
      startTime: state.startTime,
      endTime: new Date(),
      elapsedSeconds: state.elapsedSeconds
    };
    set({ isRunning: false, isPaused: false, elapsedSeconds: 0, startTime: null });
    return result;
  },

  resetTimer: () => set({ isRunning: false, isPaused: false, elapsedSeconds: 0, startTime: null }),

  tick: () => {
    const state = get();
    if (state.isRunning && !state.isPaused) {
      set({ elapsedSeconds: state.elapsedSeconds + 1 });
    }
  }
}));
