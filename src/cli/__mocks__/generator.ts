import { jest } from '@jest/globals';

export const createComponent: () => Promise<void> = jest.fn(() =>
  Promise.resolve()
);
