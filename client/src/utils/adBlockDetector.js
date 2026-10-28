/**
 * Lightweight AdBlocker Detection Utility
 * Detects if the client browser has an active ad blocker (uBlock, AdBlock, Brave Shields)
 * before attempting to inject third-party ad scripts, preventing loud ERR_BLOCKED_BY_ADBLOCKER console errors.
 */

export function checkIsAdBlockActive() {
  if (typeof document === 'undefined' || !document.body) return false;

  try {
    const bait = document.createElement('div');
    bait.className = 'ad-banner adsbox doubleclick ad-placement pub_300x250';
    bait.style.cssText = 'position: absolute; top: -9999px; left: -9999px; width: 1px; height: 1px; pointer-events: none;';
    document.body.appendChild(bait);
    const isBlocked = bait.offsetHeight === 0 || bait.clientHeight === 0 || window.getComputedStyle(bait).display === 'none';
    document.body.removeChild(bait);
    return isBlocked;
  } catch {
    return false;
  }
}
