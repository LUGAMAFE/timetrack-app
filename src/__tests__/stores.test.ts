import { useAuthStore } from '../stores/authStore';
import { useTimerStore } from '../stores/timerStore';
import { useThemeStore } from '../stores/themeStore';

describe('Timer Store', () => {
  beforeEach(() => {
    useTimerStore.setState({ isRunning: false, isPaused: false, elapsedSeconds: 0, selectedCategoryId: null, startTime: null });
  });

  it('should start timer', () => {
    useTimerStore.getState().startTimer();
    expect(useTimerStore.getState().isRunning).toBe(true);
    expect(useTimerStore.getState().startTime).not.toBeNull();
  });

  it('should pause and resume timer', () => {
    useTimerStore.getState().startTimer();
    useTimerStore.getState().pauseTimer();
    expect(useTimerStore.getState().isPaused).toBe(true);
    useTimerStore.getState().resumeTimer();
    expect(useTimerStore.getState().isPaused).toBe(false);
  });

  it('should stop timer and return data', () => {
    useTimerStore.getState().startTimer();
    useTimerStore.getState().tick();
    const result = useTimerStore.getState().stopTimer();
    expect(result.startTime).not.toBeNull();
    expect(useTimerStore.getState().isRunning).toBe(false);
  });

  it('should tick elapsed seconds', () => {
    useTimerStore.getState().startTimer();
    useTimerStore.getState().tick();
    expect(useTimerStore.getState().elapsedSeconds).toBe(1);
  });
});

describe('Theme Store', () => {
  it('should toggle dark mode', async () => {
    const initial = useThemeStore.getState().isDarkMode;
    await useThemeStore.getState().toggleDarkMode();
    expect(useThemeStore.getState().isDarkMode).toBe(!initial);
  });
});
