import js from '@eslint/js';
import globals from 'globals';

// js/app.js and js/v5-additions.js are classic scripts that intentionally share
// top-level bindings (state, helpers, render functions). They are linted as one
// program: app.js's declared globals are listed for v5-additions.js.
const APP_GLOBALS = {
  PowerhouseCore: 'readonly', SYL: 'readonly', SUBJECTS: 'readonly', SYLLABUS_PLAN: 'readonly', ERROR_NAMES: 'readonly', ATTEMPT_TYPE_NAMES: 'readonly',
  APP_KEY: 'readonly', RECOVERY_KEY: 'readonly', state: 'writable', $: 'readonly', uid: 'readonly', toast: 'readonly', saveState: 'readonly', refreshAll: 'writable',
  getTopic: 'readonly', allTopics: 'readonly', titleCase: 'readonly', escapeHTML: 'readonly', addDays: 'readonly', dateDiffDays: 'readonly', planProgress: 'readonly',
  priorityTopics: 'readonly', navigate: 'readonly', openAttemptDialog: 'readonly', fillTopicSelect: 'readonly', recoveryCount: 'readonly',
  focusTopicKey: 'writable', focusRecommendedMinutes: 'writable', focusCustomLabel: 'writable', startFocus: 'readonly', exportData: 'readonly',
};

export default [
  { ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**', 'deployments/**'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js', 'physics-intelligence/**/*.js', 'study-tracker/**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.browser } },
    rules: {
      'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  { files: ['js/app.js'], languageOptions: { globals: { PowerhouseCore: 'readonly', linkTrackerSessionToAttempt: 'readonly', buildUnifiedBackup: 'readonly' } } },
  { files: ['js/v5-additions.js'], languageOptions: { globals: APP_GLOBALS } },
  { files: ['js/core.js'], languageOptions: { globals: { globalThis: 'readonly' } } },
  { files: ['sw.js'], languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } } },
  {
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.node } },
  },
  { files: ['tests/e2e/**/*.mjs'], languageOptions: { globals: { ...globals.browser, ...globals.node } } },
];
