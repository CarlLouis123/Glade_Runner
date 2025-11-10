export const save = (key: string, value: unknown): void => {
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save state', error);
  }
};

export const load = <T>(key: string, fallback: T): T => {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) {
      return fallback;
    }
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error('Failed to load state', error);
    return fallback;
  }
};
