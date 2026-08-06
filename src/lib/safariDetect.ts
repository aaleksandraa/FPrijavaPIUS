// Safari detection and fixes
export const isSafari = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const getSafariVersion = (): number | null => {
  const ua = navigator.userAgent;
  const match = ua.match(/Version\/(\d+)/);
  return match ? parseInt(match[1]) : null;
};

export const applySafariFixes = () => {
  if (!isSafari() && !isIOS()) return;

  console.log('🍎 Safari/iOS detected - applying fixes...');

  // Fix 1: Viewport height fix for iOS
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);

  // Fix 2: Prevent zoom on input focus (already handled in meta viewport)
  // Maximum scale is set in index.html

  // Fix 3: Disable zoom on double tap (only when explicitly non-passive)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  // Fix 5: localStorage fallback
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ localStorage available');
  } catch (e) {
    console.warn('⚠️ localStorage not available, using memory storage');
    // Already handled in index.html
  }

  console.log('✅ Safari/iOS fixes applied');
};
