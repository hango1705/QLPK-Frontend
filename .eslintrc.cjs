module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended', // <-- THÊM DÒNG NÀY
    'plugin:react/jsx-runtime', // <-- THÊM DÒNG NÀY cho React 17+
    // 'plugin:react-hooks/recommended',    // <-- XÓA HOẶC GHI CHÚ DÒNG NÀY
    'prettier',
  ],
  settings: {
    react: {
      version: 'detect', // Tự động phát hiện phiên bản React
    },
  },
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // Tắt các quy tắc không cần thiết cho Vite + React 17+
    'react/react-in-jsx-scope': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
