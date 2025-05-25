// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo'],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  globals: {
    setTimeout: 'readonly',
    clearTimeout: 'readonly',
    setInterval: 'readonly',
    clearInterval: 'readonly',
  },
  rules: {
    // Uyarıları hata olmaktan çıkar
    'no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
