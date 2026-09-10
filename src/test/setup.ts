import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Unmount between tests so a dialog left open by one test cannot be found by
// the next, and clear module mocks so fetch stubs do not leak across files.
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
