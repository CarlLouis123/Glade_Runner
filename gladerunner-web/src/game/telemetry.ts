let lastAction = 'boot';

export const setLastAction = (action: string): void => {
  lastAction = action;
};

export const getLastAction = (): string => lastAction;
