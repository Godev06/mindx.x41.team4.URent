/**
 * Singleton runtime secrets store.
 * This module is bundled ONCE by ESBuild and shared across all code.
 * Set values in worker.ts initApp(), read values anywhere via this module.
 */
export const runtimeSecrets = {
  jwtSecret: '',
  jwtExpiresIn: '1d',
  firebaseApiKey: '',
};
