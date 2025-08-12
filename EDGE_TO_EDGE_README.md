# Edge-to-Edge Theming & System Bars

This document describes the implementation of edge-to-edge theming and system bar management for the Expense Tracker application, providing a native mobile app experience with proper safe area handling.

## Overview

The application implements edge-to-edge theming that allows content to draw behind system bars (status bar and navigation bar) while maintaining proper readability and safe area spacing. This creates a modern, immersive mobile experience similar to native Android and iOS apps.

## Features

✅ **Edge-to-Edge Layout**: Content extends to screen edges
✅ **Safe Area Support**: Proper spacing around system bars and notches
✅ **System Bar Theming**: Status and navigation bars match app theme
✅ **Mobile Optimized**: Responsive design for all screen sizes
✅ **PWA Support**: Enhanced experience in standalone mode
✅ **Theme Integration**: Seamless light/dark mode switching

## Implementation Details

### 1. CSS Environment Variables

The app uses CSS environment variables for safe area management:

```css
/* Safe area utilities */
.safe-area {
  padding-top: max(env(safe-area-inset-top), 12px);
  padding-bottom: max(env(safe-area-inset-bottom), 12px);
  padding-left: max(env(safe-area-inset-left), 12px);
  padding-right: max(env(safe-area-inset-right), 12px);
}
```

### 2. System Bar Colors

Dynamic system bar theming based on current theme:

```css
:root {
  /* Light theme system bar colors */
  --status-bar-bg: 210 17% 98%;
  --status-bar-icons: 215 25% 27%;
  --nav-bar-bg: 210 17% 98%;
  --nav-bar-icons: 215 25% 27%;
}

:root[data-theme="dark"] {
  /* Dark theme system bar colors */
  --status-bar-bg: 222 47% 11%;
  --status-bar-icons: 210 40% 98%;
  --nav-bar-bg: 222 47% 11%;
  --nav-bar-icons: 210 40% 98%;
}
```

### 3. Mobile Detection & PWA Support

The `useMobile` hook provides device detection:

```typescript
const { isMobile, isAndroid, isIOS, isStandalone } = useMobile();
```

### 4. System Bar Management

The `useSystemBars` hook handles:

- Theme color meta tags
- iOS status bar styling
- PWA capabilities
- Safe area updates
- Orientation change handling

## Usage

### Basic Implementation

```typescript
import { useSystemBarsContext } from '@/contexts/SystemBarsContext';

function MyComponent() {
  const { isEdgeToEdge, isSafeAreasEnabled } = useSystemBarsContext();
  
  return (
    <div className={`${isEdgeToEdge ? 'edge-to-edge' : ''}`}>
      <div className={`content ${isSafeAreasEnabled ? 'safe-area' : ''}`}>
        {/* Your content */}
      </div>
    </div>
  );
}
```

### Safe Area Classes

```css
/* Individual safe area directions */
.safe-area-top { padding-top: max(env(safe-area-inset-top), 12px); }
.safe-area-bottom { padding-bottom: max(env(safe-area-inset-bottom), 12px); }
.safe-area-left { padding-left: max(env(safe-area-inset-left), 12px); }
.safe-area-right { padding-right: max(env(safe-area-inset-right), 12px); }

/* All safe areas */
.safe-area {
  padding: max(env(safe-area-inset-top), 12px) 
           max(env(safe-area-inset-right), 12px) 
           max(env(safe-area-inset-bottom), 12px) 
           max(env(safe-area-inset-left), 12px);
}
```

### System Bar Theming

```typescript
const { setSystemBarTheme, systemBarTheme } = useSystemBarsContext();

// Manually update system bar theme
await setSystemBarTheme();

// Check current theme
console.log('System bar theme:', systemBarTheme); // 'light' | 'dark'
```

## HTML Meta Tags

The app includes comprehensive meta tags for edge-to-edge theming:

```html
<!-- Viewport with safe area support -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />

<!-- Theme color for system bars -->
<meta name="theme-color" content="#f8fafc" />

<!-- iOS specific -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />

<!-- PWA support -->
<meta name="mobile-web-app-capable" content="yes" />
```

## PWA Manifest

The `manifest.json` includes edge-to-edge support:

```json
{
  "display": "standalone",
  "edge_to_edge": true,
  "safe_area": true,
  "theme_color": "#f8fafc",
  "background_color": "#f8fafc"
}
```

## CSS Architecture

### Theme Tokens

All colors are defined as CSS custom properties with HSL values:

```css
:root {
  --background: 210 17% 98%;
  --foreground: 215 25% 27%;
  --status-bar-bg: 210 17% 98%;
  --status-bar-icons: 215 25% 27%;
}
```

### Responsive Design

Mobile-first approach with progressive enhancement:

```css
/* Base styles */
.edge-to-edge {
  position: relative;
  overflow-x: hidden;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .edge-to-edge .safe-area {
    padding-top: max(env(safe-area-inset-top), 8px);
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
  }
}

/* PWA optimizations */
@media (display-mode: standalone) {
  .edge-to-edge .safe-area {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

## Browser Support

### CSS Environment Variables

- ✅ Chrome 69+
- ✅ Firefox 65+
- ✅ Safari 11.1+
- ✅ Edge 79+

### Safe Area Support

- ✅ iOS Safari 11.1+
- ✅ Chrome Mobile 69+
- ✅ Samsung Internet 8.2+
- ✅ Firefox Mobile 65+

### PWA Features

- ✅ Chrome/Edge (Android)
- ✅ Safari (iOS)
- ✅ Samsung Internet
- ⚠️ Firefox (limited support)

## Testing

### Development Testing

1. **Chrome DevTools**:
   - Toggle device toolbar
   - Test different device sizes
   - Verify safe area insets

2. **Responsive Design Mode**:
   - Check edge-to-edge layout
   - Verify system bar theming
   - Test orientation changes

### Mobile Testing

1. **Android**:
   - Install as PWA
   - Test with different system bar styles
   - Verify safe area handling

2. **iOS**:
   - Add to home screen
   - Test with notch devices
   - Verify status bar styling

### PWA Testing

1. **Installation**:
   - Add to home screen
   - Verify standalone mode
   - Check edge-to-edge layout

2. **Offline**:
   - Test without internet
   - Verify safe area persistence
   - Check theme switching

## Troubleshooting

### Common Issues

1. **Safe areas not working**
   - Check CSS environment variable support
   - Verify viewport meta tag
   - Test on actual mobile device

2. **System bars not themed**
   - Check meta tag presence
   - Verify theme color values
   - Test in PWA mode

3. **Content cut off**
   - Check safe area padding
   - Verify edge-to-edge classes
   - Test different screen sizes

### Debug Mode

Enable console logging:

```typescript
// In useSystemBars hook
console.log('System bars:', { isMobile, isStandalone, isDark });
console.log('Safe areas:', { 
  top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top'),
  bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')
});
```

## Performance Considerations

### CSS Variables

- Use HSL values for better performance
- Minimize CSS custom property updates
- Leverage CSS transitions for smooth theme changes

### Safe Area Updates

- Debounce resize/orientation events
- Cache safe area values when possible
- Use CSS transitions for smooth updates

### Mobile Optimization

- Minimize JavaScript execution
- Use CSS transforms for animations
- Leverage hardware acceleration

## Future Enhancements

- [ ] Haptic feedback integration
- [ ] Dynamic system bar color adaptation
- [ ] Advanced gesture support
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Cross-platform consistency

## Dependencies

- React 18+
- TypeScript 4.9+
- CSS Environment Variables
- PWA Manifest
- Mobile Detection
- Theme Context

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| CSS Env Vars | 69+ | 65+ | 11.1+ | 79+ |
| Safe Areas | 69+ | 65+ | 11.1+ | 79+ |
| PWA | 67+ | 58+ | 11.1+ | 79+ |
| Edge-to-Edge | 69+ | 65+ | 11.1+ | 79+ |

---

**Note**: This implementation provides a modern, native-like mobile experience while maintaining compatibility with desktop browsers and older mobile devices.
