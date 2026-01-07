/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// Custom plugin to handle WASM files from node_modules
const wasmPlugin = () => ({
  name: 'wasm-loader',
  enforce: 'pre' as const,
  load(id: string) {
    // Handle WASM files by treating them as URL assets
    if (id.endsWith('.wasm')) {
      // Return a module that exports the WASM file as a URL
      return `export default new URL('${id}', import.meta.url).href;`;
    }
  },
  resolveId(id: string, importer?: string) {
    // Handle WASM file resolution
    if (id.endsWith('.wasm')) {
      // If it's an absolute path, return it
      if (path.isAbsolute(id)) {
        return id;
      }
      // If it's a relative import, resolve it relative to the importer
      if (importer && !id.startsWith('.')) {
        // Try to resolve from node_modules
        const resolved = path.resolve(path.dirname(importer), id);
        if (resolved.includes('node_modules')) {
          return resolved;
        }
      }
      return id;
    }
    // Handle imports from @icr/polyseg-wasm that reference WASM files
    if (id.includes('@icr/polyseg-wasm') && id.includes('.wasm')) {
      // Extract the WASM file path
      const wasmFile = id.split('/').pop();
      if (wasmFile) {
        // Return path relative to node_modules
        return path.resolve('node_modules/@icr/polyseg-wasm/dist', wasmFile);
      }
    }
    return null;
  },
});

// https://vite.dev/config/
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react({
      // Disable TypeScript type checking during build to allow build with type errors
      typescript: {
        ignoreBuildErrors: true,
      },
    }),
    tailwindcss(),
    // for dicom-parser (CommonJS support)
    viteCommonjs(),
    // Custom WASM plugin
    wasmPlugin(),
  ],
  // Cornerstone.js optimization
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader', '@icr/polyseg-wasm'],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
    plugins: () => [
      react({
        typescript: {
          ignoreBuildErrors: true,
        },
      }),
    ],
  },
  // WebAssembly support for Cornerstone.js
  assetsInclude: ['**/*.wasm'],
  build: {
    rollupOptions: {
      output: {
        // Handle WASM files as assets
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.wasm')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Increase chunk size warning limit for WASM files
    chunkSizeWarningLimit: 1000,
    // CommonJS options for handling WASM
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  // Resolve configuration for WASM files
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Handle WASM files
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.wasm'],
  },
  define: {
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8080'),
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
