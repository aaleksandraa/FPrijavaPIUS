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

  // Input font sizes and touch-action in CSS handle zoom without cancelling
  // touchend events, which can swallow taps on links, buttons and the signature.

  console.log('✅ Safari/iOS fixes applied');
};
