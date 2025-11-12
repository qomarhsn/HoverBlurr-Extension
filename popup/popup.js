/**
 * HoverBlurr Popup Script
 * Handles settings UI and user interactions
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// DOM Elements
const elements = {
  enabled: document.getElementById('enabled'),
  blurValue: document.getElementById('blurValue'),
  blurValueDisplay: document.getElementById('blurValueDisplay'),
  minImageSize: document.getElementById('minImageSize'),
  minImageSizeDisplay: document.getElementById('minImageSizeDisplay'),
  currentSite: document.getElementById('currentSite'),
  whitelistBtn: document.getElementById('whitelistBtn'),
  whitelistText: document.getElementById('whitelistText'),
  whitelistContainer: document.getElementById('whitelistContainer'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.getElementById('themeIcon'),
  viewToggleBtn: document.getElementById('viewToggleBtn'),
  viewIcon: document.getElementById('viewIcon'),
  headerTitle: document.getElementById('headerTitle'),
  settingsView: document.getElementById('settingsView'),
  whitelistView: document.getElementById('whitelistView')
};

// Current view state
let currentView = 'settings'; // 'settings' or 'whitelist'

// Current hostname
let currentHostname = '';

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const settings = await browserAPI.storage.sync.get({
      enabled: true,
      blurValue: 20,
      minImageSize: 40,
      theme: 'auto' // auto, light, dark
    });

    // Update UI
    elements.enabled.checked = settings.enabled;
    elements.blurValue.value = settings.blurValue;
    elements.blurValueDisplay.textContent = `${settings.blurValue}%`;
    elements.minImageSize.value = settings.minImageSize;
    elements.minImageSizeDisplay.textContent = `${settings.minImageSize}px`;

    // Apply theme
    applyTheme(settings.theme);

    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Save setting to storage
 */
async function saveSetting(key, value) {
  try {
    await browserAPI.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error('Error saving setting:', error);
  }
}

/**
 * Apply theme to body
 */
function applyTheme(theme) {
  document.body.classList.remove('light-theme', 'dark-theme');
  
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon('light');
  } else if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    updateThemeIcon('dark');
  } else {
    // Auto - follow system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateThemeIcon(prefersDark ? 'dark' : 'light');
  }
}

/**
 * Update theme icon
 */
function updateThemeIcon(currentTheme) {
  const sunPath = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z";
  const moonPath = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
  
  // Clear existing content
  while (elements.themeIcon.firstChild) {
    elements.themeIcon.removeChild(elements.themeIcon.firstChild);
  }
  
  // Create SVG path element
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', currentTheme === 'dark' ? sunPath : moonPath);
  elements.themeIcon.appendChild(path);
}

/**
 * Toggle theme
 */
async function toggleTheme() {
  const settings = await browserAPI.storage.sync.get('theme');
  const currentTheme = settings.theme || 'auto';
  
  let newTheme;
  if (currentTheme === 'auto' || currentTheme === 'light') {
    newTheme = 'dark';
  } else {
    newTheme = 'light';
  }
  
  await saveSetting('theme', newTheme);
  applyTheme(newTheme);
}

/**
 * Get current tab hostname
 */
async function getCurrentHostname() {
  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentHostname = url.hostname;
      elements.currentSite.textContent = currentHostname;
      
      // Update whitelist button
      const settings = await browserAPI.storage.sync.get('whitelist');
      const isWhitelisted = settings.whitelist && settings.whitelist.includes(currentHostname);
      updateWhitelistButton(isWhitelisted);
    }
  } catch (error) {
    console.error('Error getting current hostname:', error);
    elements.currentSite.textContent = 'Unable to detect';
  }
}

/**
 * Update whitelist button state
 */
function updateWhitelistButton(isWhitelisted) {
  if (isWhitelisted) {
    elements.whitelistBtn.classList.add('active');
    elements.whitelistText.textContent = 'Remove from Whitelist';
  } else {
    elements.whitelistBtn.classList.remove('active');
    elements.whitelistText.textContent = 'Whitelist Site';
  }
}


/**
 * Update whitelist display
 */
function updateWhitelistDisplay(whitelist) {
  if (!whitelist || whitelist.length === 0) {
    elements.whitelistContainer.innerHTML = '<p class="empty-state">No whitelisted sites</p>';
    return;
  }

  elements.whitelistContainer.innerHTML = '';
  whitelist.forEach(site => {
    const item = document.createElement('div');
    item.className = 'whitelist-item';
    
    const siteName = document.createElement('span');
    siteName.className = 'whitelist-site';
    siteName.textContent = site;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeSiteFromWhitelist(site));
    
    item.appendChild(siteName);
    item.appendChild(removeBtn);
    elements.whitelistContainer.appendChild(item);
  });
}

/**
 * Remove site from whitelist
 */
async function removeSiteFromWhitelist(site) {
  try {
    const settings = await browserAPI.storage.sync.get('whitelist');
    const whitelist = settings.whitelist || [];
    const newWhitelist = whitelist.filter(s => s !== site);
    
    await browserAPI.storage.sync.set({ whitelist: newWhitelist });
    updateWhitelistDisplay(newWhitelist);
    
    // Update button if current site was removed
    if (site === currentHostname) {
      updateWhitelistButton(false);
    }
  } catch (error) {
    console.error('Error removing site from whitelist:', error);
  }
}

/**
 * Toggle whitelist for current site
 */
async function toggleWhitelist() {
  if (!currentHostname) return;

  try {
    const settings = await browserAPI.storage.sync.get('whitelist');
    const whitelist = settings.whitelist || [];
    const isWhitelisted = whitelist.includes(currentHostname);

    let newWhitelist;
    if (isWhitelisted) {
      newWhitelist = whitelist.filter(site => site !== currentHostname);
    } else {
      newWhitelist = [...whitelist, currentHostname];
    }

    await browserAPI.storage.sync.set({ whitelist: newWhitelist });
    updateWhitelistButton(!isWhitelisted);
    updateWhitelistDisplay(newWhitelist);
  } catch (error) {
    console.error('Error toggling whitelist:', error);
  }
}

/**
 * Toggle between settings and whitelist view
 */
function toggleView() {
  if (currentView === 'settings') {
    // Switch to whitelist view
    currentView = 'whitelist';
    elements.settingsView.style.display = 'none';
    elements.whitelistView.style.display = 'block';
    elements.headerTitle.textContent = 'Whitelisted Sites';
    
    // Change icon to settings icon
    while (elements.viewIcon.firstChild) {
      elements.viewIcon.removeChild(elements.viewIcon.firstChild);
    }
    const settingsPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    settingsPath.setAttribute('d', 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z');
    const settingsCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    settingsCircle.setAttribute('cx', '12');
    settingsCircle.setAttribute('cy', '12');
    settingsCircle.setAttribute('r', '3');
    elements.viewIcon.appendChild(settingsPath);
    elements.viewIcon.appendChild(settingsCircle);
    elements.viewToggleBtn.title = 'Back to Settings';
    
    // Load whitelist
    browserAPI.storage.sync.get('whitelist').then(settings => {
      updateWhitelistDisplay(settings.whitelist || []);
    });
  } else {
    // Switch to settings view
    currentView = 'settings';
    elements.settingsView.style.display = 'block';
    elements.whitelistView.style.display = 'none';
    elements.headerTitle.textContent = 'HoverBlurr';
    
    // Change icon back to bookmark
    while (elements.viewIcon.firstChild) {
      elements.viewIcon.removeChild(elements.viewIcon.firstChild);
    }
    const bookmarkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bookmarkPath.setAttribute('d', 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20');
    const bookmarkPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    bookmarkPolyline.setAttribute('points', '10 2 10 10 13 7 16 10 16 2');
    elements.viewIcon.appendChild(bookmarkPath);
    elements.viewIcon.appendChild(bookmarkPolyline);
    elements.viewToggleBtn.title = 'Whitelisted Sites';
  }
}


/**
 * Initialize popup
 */
async function init() {
  // Load settings and current hostname
  await loadSettings();
  await getCurrentHostname();

  // Event listeners for settings
  elements.enabled.addEventListener('change', (e) => {
    saveSetting('enabled', e.target.checked);
  });

  elements.blurValue.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    elements.blurValueDisplay.textContent = `${value}%`;
    saveSetting('blurValue', value);
  });

  elements.minImageSize.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    elements.minImageSizeDisplay.textContent = `${value}px`;
    saveSetting('minImageSize', value);
  });

  // Whitelist button
  elements.whitelistBtn.addEventListener('click', toggleWhitelist);

  // Theme toggle button
  elements.themeToggle.addEventListener('click', toggleTheme);

  // View toggle button
  elements.viewToggleBtn.addEventListener('click', toggleView);

  // Listen for storage changes
  browserAPI.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.whitelist && currentView === 'whitelist') {
      updateWhitelistDisplay(changes.whitelist.newValue);
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
