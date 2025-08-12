import { useEffect, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useMobile } from '@/hooks/use-mobile';

interface UseSystemBarsOptions {
  enableEdgeToEdge?: boolean;
  enableSafeAreas?: boolean;
}

export function useSystemBars(options: UseSystemBarsOptions = {}) {
  const { enableEdgeToEdge = true, enableSafeAreas = true } = options;
  const { theme, isDark } = useTheme();
  const { isMobile, isStandalone } = useMobile();

  // Set system bar theme based on current theme
  const setSystemBarTheme = useCallback(async () => {
    if (!isMobile && !isStandalone) return;

    try {
      // Set viewport meta tag for proper mobile viewport handling
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 
          'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no'
        );
      }

      // Set theme color meta tag for system bars
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', 
          isDark ? '#0f1419' : '#f8fafc'
        );
      } else {
        // Create theme-color meta tag if it doesn't exist
        const newThemeColorMeta = document.createElement('meta');
        newThemeColorMeta.name = 'theme-color';
        newThemeColorMeta.content = isDark ? '#0f1419' : '#f8fafc';
        document.head.appendChild(newThemeColorMeta);
      }

      // Set apple-mobile-web-app-status-bar-style for iOS
      const appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (appleStatusBarMeta) {
        appleStatusBarMeta.setAttribute('content', isDark ? 'black-translucent' : 'default');
      } else {
        const newAppleStatusBarMeta = document.createElement('meta');
        newAppleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
        newAppleStatusBarMeta.content = isDark ? 'black-translucent' : 'default';
        document.head.appendChild(newAppleStatusBarMeta);
      }

      // Set apple-mobile-web-app-capable for PWA
      const appleWebAppMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
      if (appleWebAppMeta) {
        appleWebAppMeta.setAttribute('content', 'yes');
      } else {
        const newAppleWebAppMeta = document.createElement('meta');
        newAppleWebAppMeta.name = 'apple-mobile-web-app-capable';
        newAppleWebAppMeta.content = 'yes';
        document.head.appendChild(newAppleWebAppMeta);
      }

      // Update CSS custom properties for system bar colors
      const root = document.documentElement;
      if (isDark) {
        root.style.setProperty('--status-bar-bg', '222 47% 11%');
        root.style.setProperty('--status-bar-icons', '210 40% 98%');
        root.style.setProperty('--nav-bar-bg', '222 47% 11%');
        root.style.setProperty('--nav-bar-icons', '210 40% 98%');
      } else {
        root.style.setProperty('--status-bar-bg', '210 17% 98%');
        root.style.setProperty('--status-bar-icons', '215 25% 27%');
        root.style.setProperty('--nav-bar-bg', '210 17% 98%');
        root.style.setProperty('--nav-bar-icons', '215 25% 27%');
      }

      // Add CSS classes for edge-to-edge theming
      if (enableEdgeToEdge) {
        document.body.classList.add('edge-to-edge');
        document.documentElement.classList.add('edge-to-edge');
      }

      // Add CSS classes for safe areas
      if (enableSafeAreas) {
        document.body.classList.add('safe-areas-enabled');
      }

    } catch (error) {
      console.warn('Failed to set system bar theme:', error);
    }
  }, [isDark, isMobile, isStandalone, enableEdgeToEdge, enableSafeAreas]);

  // Update system bar theme when theme changes
  useEffect(() => {
    setSystemBarTheme();
  }, [setSystemBarTheme, theme]);

  // Handle orientation changes and resize events
  useEffect(() => {
    if (!isMobile && !isStandalone) return;

    const handleOrientationChange = () => {
      // Re-apply system bar theme on orientation change
      setTimeout(setSystemBarTheme, 100);
    };

    const handleResize = () => {
      // Update safe areas on resize
      if (enableSafeAreas) {
        const root = document.documentElement;
        const safeAreaTop = getComputedStyle(root).getPropertyValue('--safe-area-inset-top');
        const safeAreaBottom = getComputedStyle(root).getPropertyValue('--safe-area-inset-bottom');
        
        if (safeAreaTop || safeAreaBottom) {
          root.style.setProperty('--safe-area-inset-top', safeAreaTop);
          root.style.setProperty('--safe-area-inset-bottom', safeAreaBottom);
        }
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, isStandalone, enableSafeAreas, setSystemBarTheme]);

  // Initialize system bars on mount
  useEffect(() => {
    setSystemBarTheme();
  }, [setSystemBarTheme]);

  return {
    setSystemBarTheme,
    isEdgeToEdge: enableEdgeToEdge,
    isSafeAreasEnabled: enableSafeAreas,
    systemBarTheme: isDark ? 'dark' : 'light'
  };
}
