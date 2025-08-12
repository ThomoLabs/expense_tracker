import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';

interface UseAndroidBackButtonOptions {
  onBackPress?: () => boolean | void; // Return true to prevent default handling
  isModalOpen?: boolean;
  onModalClose?: () => void;
}

interface UseAndroidBackButtonReturn {
  handleBackPress: () => void;
  showExitIndicator: boolean;
  hideExitIndicator: () => void;
}

export function useAndroidBackButton({
  onBackPress,
  isModalOpen = false,
  onModalClose
}: UseAndroidBackButtonOptions = {}): UseAndroidBackButtonReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { shouldUseCustomBackButton } = useMobile();
  const lastBackPress = useRef(0);
  const backPressTimeout = useRef<NodeJS.Timeout>();
  const [showExitIndicator, setShowExitIndicator] = useState(false);

  const hideExitIndicator = useCallback(() => {
    setShowExitIndicator(false);
    lastBackPress.current = 0;
    if (backPressTimeout.current) {
      clearTimeout(backPressTimeout.current);
    }
  }, []);

  const handleBackPress = useCallback(() => {
    // Custom back press handler - if it returns true, prevent default handling
    if (onBackPress && onBackPress() === true) {
      return;
    }

    // If modal is open, close it first
    if (isModalOpen && onModalClose) {
      onModalClose();
      return;
    }

    // If not on root route, navigate back
    if (location.pathname !== '/') {
      navigate(-1);
      return;
    }

    // On root/dashboard - implement double-press to exit
    const now = Date.now();
    const timeDiff = now - lastBackPress.current;
    
    if (timeDiff < 1500) {
      // Double press within 1.5s - exit app
      hideExitIndicator();
      
      // Close the app (for PWA/Android)
      if (window.navigator && 'standalone' in window.navigator) {
        // PWA mode - close the app
        window.close();
      } else {
        // Browser mode - go back in history or show exit message
        if (window.history.length > 1) {
          window.history.back();
        } else {
          // No history to go back to, show exit message
          toast({
            title: "Exit App",
            description: "Use your device's home button to exit the app",
            duration: 3000,
          });
        }
      }
    } else {
      // First press - show exit indicator and set timeout
      lastBackPress.current = now;
      setShowExitIndicator(true);
      
      if (backPressTimeout.current) {
        clearTimeout(backPressTimeout.current);
      }
      
      backPressTimeout.current = setTimeout(() => {
        hideExitIndicator();
      }, 1500);
    }
  }, [navigate, location.pathname, isModalOpen, onModalClose, onBackPress, toast, hideExitIndicator]);

  useEffect(() => {
    // Only enable custom back button behavior on mobile devices
    if (!shouldUseCustomBackButton) {
      return;
    }

    // Handle Android back button events
    const handleBackButton = (event: Event) => {
      // Prevent default behavior
      event.preventDefault();
      event.stopPropagation();
      
      // Handle the back button press
      handleBackPress();
    };

    // Handle browser back button
    const handleBrowserBackButton = (event: PopStateEvent) => {
      // Prevent default browser back behavior when we have custom handling
      if (isModalOpen) {
        event.preventDefault();
        handleBackPress();
        return;
      }
    };

    // Handle keyboard events (for testing and some mobile browsers)
    const handleKeyboardEvent = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Backspace') {
        event.preventDefault();
        handleBackPress();
      }
    };

    // Add event listeners for different back button scenarios
    if ('onbeforeunload' in window) {
      // Handle beforeunload for some mobile browsers
      window.addEventListener('beforeunload', handleBackButton);
    }

    // Handle popstate (browser back button)
    window.addEventListener('popstate', handleBrowserBackButton);
    
    // Handle keyboard events
    window.addEventListener('keydown', handleKeyboardEvent);

    // Handle touch events for mobile back gestures (if supported)
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (event: TouchEvent) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      
      const deltaX = touchStartX - touchEndX;
      const deltaY = touchStartY - touchEndY;
      
      // Detect right-to-left swipe (back gesture)
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50 && touchStartX > window.innerWidth * 0.8) {
        handleBackPress();
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    // Cleanup
    return () => {
      if ('onbeforeunload' in window) {
        window.removeEventListener('beforeunload', handleBackButton);
      }
      window.removeEventListener('popstate', handleBrowserBackButton);
      window.removeEventListener('keydown', handleKeyboardEvent);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (backPressTimeout.current) {
        clearTimeout(backPressTimeout.current);
      }
    };
  }, [handleBackPress, isModalOpen, shouldUseCustomBackButton]);

  // Return the handler and indicator state
  return {
    handleBackPress,
    showExitIndicator,
    hideExitIndicator
  };
}
