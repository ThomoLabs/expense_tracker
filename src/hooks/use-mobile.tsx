import { useState, useEffect } from 'react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if running as PWA/standalone app
      const standalone = window.navigator && 'standalone' in window.navigator && (window.navigator as any).standalone;
      setIsStandalone(!!standalone);

      // Check user agent for mobile detection
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Android detection
      const android = /android/i.test(userAgent);
      setIsAndroid(android);
      
      // iOS detection
      const ios = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(ios);
      
      // General mobile detection
      const mobile = android || ios || /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    
    // Re-check on resize (orientation change)
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return {
    isMobile,
    isAndroid,
    isIOS,
    isStandalone,
    // Helper for back button behavior
    shouldUseCustomBackButton: isMobile || isStandalone
  };
}
