/**
 * Storage Abstraction Layer
 * Provides unified API for Chrome and Firefox storage
 */

// Detect browser API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  blurValue: 20,
  minImageSize: 40,
  whitelist: [],
  tempWhitelist: [], // Session-based temporary whitelist (stored in local storage)
  excludeClasses: ['logo', 'icon', 'avatar', 'emoji'],
  theme: 'auto'
};

/**
 * Storage utility class
 */
class Storage {
  /**
   * Get settings from storage
   * @param {string|string[]|null} keys - Key(s) to retrieve, or null for all
   * @returns {Promise<Object>}
   */
  static async get(keys = null) {
    try {
      if (keys === null) {
        const result = await browserAPI.storage.sync.get(DEFAULT_SETTINGS);
        return result;
      }
      
      if (typeof keys === 'string') {
        const result = await browserAPI.storage.sync.get({ [keys]: DEFAULT_SETTINGS[keys] });
        return result[keys];
      }
      
      if (Array.isArray(keys)) {
        const defaults = {};
        keys.forEach(key => {
          if (DEFAULT_SETTINGS.hasOwnProperty(key)) {
            defaults[key] = DEFAULT_SETTINGS[key];
          }
        });
        return await browserAPI.storage.sync.get(defaults);
      }
    } catch (error) {
      console.error('[HoverBlurr] Storage get error:', error);
      return keys === null ? DEFAULT_SETTINGS : (typeof keys === 'string' ? DEFAULT_SETTINGS[keys] : {});
    }
  }

  /**
   * Set settings in storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async set(items) {
    try {
      await browserAPI.storage.sync.set(items);
    } catch (error) {
      console.error('[HoverBlurr] Storage set error:', error);
    }
  }





  /**
   * Listen for storage changes
   * @param {Function} callback - Callback function(changes, areaName)
   */
  static addListener(callback) {
    browserAPI.storage.onChanged.addListener(callback);
  }






}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
