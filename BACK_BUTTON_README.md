# Android Back Button Handling

This document describes the implementation of Android back button handling for the Expense Tracker application.

## Overview

The application implements native Android back button behavior that provides a familiar mobile experience:

1. **Modal/Drawer Priority**: Back button closes open modals first
2. **Navigation**: If no modals are open, navigates back in history
3. **App Exit**: On the dashboard, requires double-press within 1.5 seconds to exit

## Implementation Details

### Core Hook: `useAndroidBackButton`

The main functionality is implemented in the `useAndroidBackButton` custom hook:

```typescript
const { showExitIndicator, hideExitIndicator } = useAndroidBackButton({
  isModalOpen: showAddExpense || showSettings,
  onModalClose: () => {
    if (showAddExpense) setShowAddExpense(false);
    else if (showSettings) setShowSettings(false);
  }
});
```

### Back Button Behavior Flow

1. **Custom Handler Check**: If `onBackPress` returns `true`, prevent default handling
2. **Modal Check**: If any modal is open, close it and return
3. **Navigation Check**: If not on root route, navigate back
4. **Exit Logic**: On dashboard, implement double-press to exit

### Exit Indicator

A visual indicator appears when the user presses back once on the dashboard:

- Shows "Press back again to exit" message
- Automatically disappears after 1.5 seconds
- Can be manually dismissed by clicking the X button

### Mobile Detection

The hook automatically detects mobile devices and only enables custom back button behavior when appropriate:

- Uses `useMobile` hook for device detection
- Supports Android, iOS, and PWA/standalone modes
- Falls back to standard browser behavior on desktop

## Event Handling

### Hardware Back Button
- Intercepts Android hardware back button events
- Prevents default browser behavior when modals are open

### Browser Back Button
- Handles browser back button clicks
- Maintains proper navigation state

### Touch Gestures
- Supports right-to-left swipe gestures as back button alternative
- Detects swipes from the right edge of the screen

### Keyboard Events
- ESC key and Backspace key trigger back button behavior
- Useful for testing and accessibility

## Usage Examples

### Basic Implementation
```typescript
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';

function MyComponent() {
  const { showExitIndicator, hideExitIndicator } = useAndroidBackButton({
    isModalOpen: false,
    onModalClose: () => {}
  });

  return (
    <div>
      {/* Your component content */}
      <ExitIndicator 
        isVisible={showExitIndicator} 
        onClose={hideExitIndicator} 
      />
    </div>
  );
}
```

### With Modal Support
```typescript
function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  
  useAndroidBackButton({
    isModalOpen: showModal,
    onModalClose: () => setShowModal(false)
  });

  return (
    <div>
      {showModal && <MyModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
```

### Custom Back Press Handler
```typescript
useAndroidBackButton({
  onBackPress: () => {
    // Custom logic here
    if (someCondition) {
      return true; // Prevent default handling
    }
    return false; // Allow default handling
  }
});
```

## Testing

### Development Testing
The `BackButtonTest` component provides a testing interface:

- Simulate back button presses
- View exit indicator state
- Test double-press timing

### Mobile Testing
- Use actual Android device back button
- Test in PWA mode
- Verify touch gesture support

### Browser Testing
- Use browser back button
- Test keyboard shortcuts (ESC, Backspace)
- Verify navigation state management

## Configuration

### Timing
- Exit indicator timeout: 1.5 seconds
- Double-press window: 1.5 seconds

### Gesture Sensitivity
- Minimum swipe distance: 50px
- Swipe detection area: Right 20% of screen

### Mobile Detection
- User agent detection
- PWA/standalone detection
- Screen size and orientation changes

## Troubleshooting

### Common Issues

1. **Back button not working**
   - Check if mobile detection is working
   - Verify event listeners are properly attached
   - Check console for errors

2. **Modals not closing**
   - Ensure `isModalOpen` is correctly set
   - Verify `onModalClose` callback is provided
   - Check modal component implementation

3. **Exit indicator not showing**
   - Verify hook return values are used
   - Check `ExitIndicator` component is rendered
   - Ensure proper state management

### Debug Mode
Enable console logging by setting:

```typescript
// In useAndroidBackButton hook
console.log('Back button pressed:', { isModalOpen, location: location.pathname });
```

## Future Enhancements

- [ ] Haptic feedback on mobile devices
- [ ] Customizable timing values
- [ ] Additional gesture support
- [ ] Accessibility improvements
- [ ] Performance optimizations

## Dependencies

- React Router DOM (navigation)
- Custom hooks (useMobile, useToast)
- UI components (ExitIndicator)
- TypeScript for type safety
