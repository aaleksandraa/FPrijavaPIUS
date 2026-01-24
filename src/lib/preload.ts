// Preload packages on app start
import { getPackages } from './api';

const CACHE_KEY = 'pius_packages_cache';
const CACHE_TIMESTAMP_KEY = 'pius_packages_cache_timestamp';

export const preloadPackages = async () => {
  try {
    console.log('🚀 Preloading packages...');
    const res = await getPackages();
    
    if (res.data && Array.isArray(res.data)) {
      const piusPackages = res.data.filter((p: any) => {
        const isPius = p.slug.toLowerCase().includes('pius');
        const hasInstallments = p.payment_type === 'installments';
        return hasInstallments && isPius;
      });
      
      if (piusPackages.length > 0) {
        piusPackages.sort((a: any, b: any) => Number(a.price) - Number(b.price));
        
        // Save to cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(piusPackages));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        
        console.log(`✅ Preloaded ${piusPackages.length} packages to cache`);
      }
    }
  } catch (err) {
    console.warn('⚠️ Preload failed (will retry on page load):', err);
  }
};
