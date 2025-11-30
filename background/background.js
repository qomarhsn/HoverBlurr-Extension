/**
 * HoverBlurr Background Service Worker
 * Handles extension lifecycle and commands
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Initialize extension on install
 */
browserAPI.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[HoverBlurr] Extension installed');
    
    // Set default settings
    browserAPI.storage.sync.set({
      enabled: true,
      blurValue: 20,
      minImageSize: 40,
      whitelist: [],
      excludeClasses: ['logo', 'icon', 'avatar', 'emoji'],
      theme: 'auto'
    });

    // Clear temporary whitelist (session-based)
    browserAPI.storage.local.remove('tempWhitelist');

    // Open welcome page (optional)
  } else if (details.reason === 'update') {
    console.log('[HoverBlurr] Extension updated to version', browserAPI.runtime.getManifest().version);
    // Clear temporary whitelist on update (ensures clean state)
    browserAPI.storage.local.remove('tempWhitelist');
  }
});

/**
 * Listen for keyboard commands
 */
browserAPI.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-blur') {
    // Get current tab
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      // Get current whitelist
      const settings = await browserAPI.storage.sync.get('whitelist');
      const whitelist = settings.whitelist || [];

      // Toggle whitelist
      let newWhitelist;
      if (whitelist.includes(hostname)) {
        newWhitelist = whitelist.filter(site => site !== hostname);
      } else {
        newWhitelist = [...whitelist, hostname];
      }

      // Save new whitelist
      await browserAPI.storage.sync.set({ whitelist: newWhitelist });

      // Show notification
      const isWhitelisted = newWhitelist.includes(hostname);
      showNotification(
        isWhitelisted ? 'Site Whitelisted' : 'Site Removed from Whitelist',
        `${hostname} ${isWhitelisted ? 'will not be blurred' : 'will be blurred'}`
      );
    } catch (error) {
      console.error('[HoverBlurr] Error toggling blur:', error);
    }
  } else if (command === 'toggle-temp-whitelist') {
    // Get current tab
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      // Get current temporary whitelist
      const result = await browserAPI.storage.local.get({ tempWhitelist: [] });
      const tempWhitelist = result.tempWhitelist || [];

      // Toggle temporary whitelist
      let newTempWhitelist;
      if (tempWhitelist.includes(hostname)) {
        newTempWhitelist = tempWhitelist.filter(site => site !== hostname);
      } else {
        newTempWhitelist = [...tempWhitelist, hostname];
      }

      // Save new temporary whitelist
      await browserAPI.storage.local.set({ tempWhitelist: newTempWhitelist });

      // Show notification
      const isTempWhitelisted = newTempWhitelist.includes(hostname);
      showNotification(
        isTempWhitelisted ? 'Site Temporarily Whitelisted' : 'Site Removed from Temporary Whitelist',
        `${hostname} ${isTempWhitelisted ? 'will not be blurred until browser closes' : 'will be blurred'}`
      );
    } catch (error) {
      console.error('[HoverBlurr] Error toggling temporary whitelist:', error);
    }
  }
});

/**
 * Show notification
 */
function showNotification(title, message) {
  if (browserAPI.notifications) {
    browserAPI.notifications.create({
      type: 'basic',
      iconUrl: browserAPI.runtime.getURL('icons/icon-128.png'),
      title: title,
      message: message
    });
  }
}

/**
 * Handle messages from content scripts
 */
browserAPI.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSettings') {
    browserAPI.storage.sync.get(null).then(settings => {
      sendResponse(settings);
    });
    return true; // Keep message channel open for async response
  }
});

/**
 * Update badge based on enabled state
 */
browserAPI.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync' && changes.enabled) {
    updateBadge(changes.enabled.newValue);
  }
});

/**
 * Update extension badge
 */
function updateBadge(enabled) {
  if (browserAPI.action && browserAPI.action.setBadgeText) {
    browserAPI.action.setBadgeText({
      text: enabled ? '' : 'OFF'
    });
    browserAPI.action.setBadgeBackgroundColor({
      color: '#ef4444'
    });
  }
}

// Initialize badge on startup
browserAPI.storage.sync.get('enabled').then(settings => {
  updateBadge(settings.enabled !== false);
});

console.log('[HoverBlurr] Background service worker initialized');
