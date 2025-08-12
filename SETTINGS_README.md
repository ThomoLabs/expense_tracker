# Settings Screen Implementation

## Overview
The Settings screen provides comprehensive configuration options for the Monthly Expenses Tracker app, including currency selection, categories management, budget settings, data import/export, and theme customization.

## Features Implemented

### 1. Currency Selection
- **Dropdown with common currencies**: EUR, USD, GBP, JPY, CAD, AUD, CHF, CNY
- **Live preview**: Shows formatted amount example with selected currency
- **Immediate persistence**: Changes saved automatically
- **Global application**: Currency changes reflect across the entire app

### 2. Categories Management
- **Full CRUD operations**:
  - Create new categories with custom names and colors
  - Edit existing categories (rename, recolor)
  - Delete categories with smart handling
  - Drag & drop reordering with visual feedback
- **Smart deletion**: 
  - If category has expenses, shows merge dialog
  - If no expenses, allows direct deletion
  - Merge functionality updates all related expenses
- **Validation**: Unique names (case-insensitive), non-empty, trimmed
- **Default categories**: Food, Groceries, Transport, Bills, Entertainment, Health, Shopping, Other
- **Color coding**: Each category gets a unique color for visual distinction

### 3. Monthly Budget
- **Toggle control**: Enable/disable budget tracking
- **Currency-aware input**: Amount field with proper validation
- **Progress tracking**: Shows current month usage percentage
- **Visual indicators**: Color-coded progress bar (green < 80%, yellow 80-100%, red > 100%)
- **Smart defaults**: Enables with €1000.00 when first activated

### 4. Data Management (CSV Import/Export)
- **Export functionality**:
  - Generates CSV with headers: date, amount, currency, category, note, payment_method
  - UTF-8 with BOM for Excel compatibility
  - Automatic filename: expenses-YYYYMMDD.csv
  - Downloads all-time expense data
- **Import functionality**:
  - Flexible header parsing (ignores unknown columns)
  - Required columns: date, amount, category
  - Optional columns: currency, note, payment_method
  - Date format: YYYY-MM-DD
  - Duplicate detection with user choice to allow/block
  - Automatic category creation for new categories
  - Comprehensive error handling and validation
  - Progress feedback with import/skip counts

### 5. Theme System
- **Three options**: System (follows OS), Light, Dark
- **Immediate application**: Changes apply instantly
- **Persistent storage**: Theme preference saved across sessions
- **System integration**: Automatically follows OS theme changes
- **Global context**: Theme state managed at app level

## Technical Implementation

### Architecture
- **MVVM pattern**: Clear separation of concerns
- **React hooks**: useState, useEffect for state management
- **Context API**: Global theme management
- **Component composition**: Modular, reusable components

### State Management
- **Local state**: Component-specific state (dialogs, form inputs)
- **Global state**: Theme via React Context
- **Persistence**: DataStore (localStorage) for settings and data
- **Reactive updates**: UI updates automatically when data changes

### Dependencies
- **@dnd-kit**: Drag and drop functionality for category reordering
- **Lucide React**: Icon library for consistent UI
- **Tailwind CSS**: Utility-first styling with dark mode support
- **React Router**: Navigation and routing

### Data Flow
1. **Settings load**: On component mount, load from localStorage
2. **User interaction**: Changes trigger state updates
3. **Persistence**: Settings saved to localStorage immediately
4. **Global updates**: Theme changes applied via context
5. **UI refresh**: Components re-render with new data

## File Structure

```
src/
├── components/
│   ├── SettingsScreen.tsx          # Main settings component
│   └── ui/                         # Reusable UI components
├── contexts/
│   └── ThemeContext.tsx            # Global theme management
├── lib/
│   ├── csv-utils.ts                # CSV import/export utilities
│   ├── storage.ts                   # Data persistence layer
│   └── expense-utils.ts            # Expense formatting utilities
└── types/
    └── expense.ts                  # Type definitions
```

## Usage Examples

### Opening Settings
```tsx
// From Dashboard component
const [showSettings, setShowSettings] = useState(false);

<Button onClick={() => setShowSettings(true)}>
  <Settings className="h-5 w-5" />
</Button>

{showSettings && (
  <SettingsScreen onClose={() => setShowSettings(false)} />
)}
```

### Theme Management
```tsx
// Using theme context
import { useTheme } from '@/contexts/ThemeContext';

const { theme, setTheme, isDark } = useTheme();

// Set theme
setTheme('dark');

// Check current theme
if (isDark) {
  // Apply dark mode styles
}
```

### CSV Operations
```tsx
// Export expenses
import { exportToCSV } from '@/lib/csv-utils';

const csvContent = exportToCSV(expenses);
// Download logic...

// Import expenses
import { createExpenseFromCSVRow } from '@/lib/csv-utils';

const newExpense = createExpenseFromCSVRow(
  csvRow, 
  defaultCurrency, 
  existingExpenses, 
  allowDuplicates
);
```

## Testing

### Test Coverage
- **Component rendering**: All sections display correctly
- **User interactions**: Buttons, inputs, and dialogs work
- **State management**: Settings persist and update properly
- **Error handling**: Invalid inputs and edge cases handled gracefully

### Running Tests
```bash
npm test SettingsScreen.test.tsx
```

## Future Enhancements

### Potential Improvements
1. **Category icons**: Add icon selection for categories
2. **Advanced budget**: Category-specific budgets
3. **Data backup**: Cloud sync and backup options
4. **Custom currencies**: User-defined currency support
5. **Import validation**: More sophisticated CSV validation rules
6. **Bulk operations**: Multi-select category management
7. **Keyboard shortcuts**: Power user navigation
8. **Accessibility**: Screen reader and keyboard navigation improvements

### Performance Optimizations
1. **Virtual scrolling**: For large category lists
2. **Debounced saves**: Reduce localStorage writes
3. **Memoization**: Prevent unnecessary re-renders
4. **Lazy loading**: Load settings sections on demand

## Browser Compatibility

- **Modern browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile support**: Responsive design for mobile devices
- **Progressive enhancement**: Core functionality works without JavaScript
- **Accessibility**: WCAG 2.1 AA compliance

## Security Considerations

- **Input sanitization**: All user inputs validated and sanitized
- **XSS prevention**: No direct DOM manipulation
- **Data validation**: Comprehensive validation before storage
- **Rate limiting**: Prevents abuse of storage operations
- **Secure defaults**: Safe fallback values for all settings
