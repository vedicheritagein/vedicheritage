import { defineConfig } from 'vitest/config';

/**
 * Test configuration, kept separate from vite.config.ts on purpose.
 *
 * vitest bundles its own copy of vite, and its plugin types do not line up with
 * the vite 8 this project builds with - putting a `test` block next to
 * `plugins: [react(), tailwindcss()]` makes `tsc -b` fail on the mismatch. A
 * separate file avoids that entirely: vitest reads this one in preference to
 * vite.config.ts, and no app plugin is needed to run the suite.
 */
export default defineConfig({
  // The app's JSX is compiled by @vitejs/plugin-react during a build. Here
  // esbuild does it, and it needs telling which runtime to use - test files are
  // excluded from tsconfig.app.json, so it cannot read `jsx` from there.
  esbuild: { jsx: 'automatic' },
  test: {
    // The checkout form handles money, so it is tested against a real DOM
    // rather than by rendering to a string.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      // Scoped to the code that handles money and talks to the API. The
      // marketing sections are static markup; measuring them would only dilute
      // the number that matters. Extensions are explicit because a bare
      // 'Checkout*' matches no file and silently reports nothing.
      include: [
        'src/lib/**/*.ts',
        'src/components/Checkout*.tsx',
        'src/components/ContactFallbackDialog.tsx'
      ],
      exclude: ['**/*.test.{ts,tsx}'],
      reporter: ['text', 'html']
    }
  }
});
