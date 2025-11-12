/**
 * HoverBlurr Content Script
 * Applies blur effect to images with customizable settings
 */

(async function () {
  "use strict";

  // Settings cache
  let settings = await Storage.get();
  const hostname = window.location.hostname;

  // Check if current site is whitelisted
  const isWhitelisted = () => settings.whitelist.includes(hostname);

  // Check if extension is enabled and site is not whitelisted
  const shouldApplyBlur = () => settings.enabled && !isWhitelisted();

  /**
   * Check if image meets size criteria
   * Uses DISPLAYED size (how it appears on screen) not natural/file size
   * @param {HTMLImageElement} img - Image element
   * @returns {boolean}
   */
  function meetsImageCriteria(img) {
    // Get displayed dimensions (how big it appears on screen)
    const rect = img.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);

    // Skip if image has no size yet (not rendered)
    if (width === 0 || height === 0) {
      return false;
    }

    // Check minimum size (displayed size, not file size)
    if (
      settings.minImageSize &&
      (width < settings.minImageSize || height < settings.minImageSize)
    ) {
      return false;
    }

    // Check excluded classes
    if (settings.excludeClasses && settings.excludeClasses.length > 0) {
      const classList = Array.from(img.classList);
      for (const excludeClass of settings.excludeClasses) {
        if (
          classList.some((cls) =>
            cls.toLowerCase().includes(excludeClass.toLowerCase())
          )
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Apply blur class to an image
   * @param {HTMLImageElement} img - Image element
   */
  function applyBlurToImage(img) {
    if (!shouldApplyBlur()) {
      img.classList.remove("hoverblurr-blur");
      return;
    }

    // Function to check and apply blur
    const checkAndApply = () => {
      if (meetsImageCriteria(img)) {
        img.classList.add("hoverblurr-blur");
      } else {
        img.classList.remove("hoverblurr-blur");
      }
    };

    // Check immediately (displayed size is available even before image loads)
    checkAndApply();

    // Re-check after image loads (in case size changes)
    if (!img.complete) {
      img.addEventListener("load", checkAndApply, { once: true });
    }
  }

  /**
   * Process all images on the page
   */
  function processImages() {
    const images = document.querySelectorAll("img, image");
    images.forEach((img) => applyBlurToImage(img));
  }

  /**
   * Update CSS variables based on settings
   */
  function updateCSSVariables() {
    // Convert percentage to pixels (1% = 0.5px, 100% = 50px)
    const blurPixels = Math.round((settings.blurValue / 100) * 50);
    document.documentElement.style.setProperty(
      "--hoverblurr-blur-amount",
      `${blurPixels}px`
    );
  }

  /**
   * Remove all blur effects
   */
  function removeAllBlur() {
    const images = document.querySelectorAll(".hoverblurr-blur");
    images.forEach((img) => img.classList.remove("hoverblurr-blur"));
  }

  /**
   * Initialize blur effect
   */
  function init() {
    updateCSSVariables();
    processImages();

    // Always observe DOM changes for dynamically loaded images
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (node.tagName === "IMG" || node.tagName === "IMAGE") {
              applyBlurToImage(node);
            } else if (node.querySelectorAll) {
              // Check for images within added node
              const images = node.querySelectorAll("img, image");
              images.forEach((img) => applyBlurToImage(img));
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Handle settings changes
   */
  Storage.addListener((changes, areaName) => {
    if (areaName === "sync") {
      // Update settings cache
      for (const key in changes) {
        settings[key] = changes[key].newValue;
      }

      // Reapply blur with new settings immediately
      updateCSSVariables();

      // Remove all blur first
      removeAllBlur();

      // Reprocess all images with new settings
      if (shouldApplyBlur()) {
        processImages();
      }
    }
  });

  // Initialize on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Handle keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Alt+B to toggle blur for current site
    if (e.altKey && e.key === "b") {
      e.preventDefault();

      if (isWhitelisted()) {
        // Remove from whitelist
        settings.whitelist = settings.whitelist.filter(
          (site) => site !== hostname
        );
      } else {
        // Add to whitelist
        settings.whitelist.push(hostname);
      }

      Storage.set({ whitelist: settings.whitelist });

      // Show notification
      showNotification(
        isWhitelisted() ? "Site whitelisted" : "Site removed from whitelist"
      );
    }
  });

  /**
   * Show temporary notification
   * @param {string} message - Message to display
   */
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "hoverblurr-notification";
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("hoverblurr-notification-show");
    }, 10);

    setTimeout(() => {
      notification.classList.remove("hoverblurr-notification-show");
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
})();
