import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsScreen } from './SettingsScreen';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock the dependencies
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/lib/storage', () => ({
  getSettings: jest.fn(() => ({
    currency: 'EUR',
    categories: ['Food', 'Groceries'],
    monthlyBudget: 100000,
  })),
  saveSettings: jest.fn(),
  getExpenses: jest.fn(() => []),
  saveExpenses: jest.fn(),
}));

jest.mock('@/lib/expense-utils', () => ({
  formatCurrency: jest.fn(() => '€1,234.56'),
}));

jest.mock('@/lib/csv-utils', () => ({
  exportToCSV: jest.fn(() => 'csv content'),
  createExpenseFromCSVRow: jest.fn(),
  validateCSVHeaders: jest.fn(() => []),
}));

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
  },
});

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('SettingsScreen', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all sections', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Currency')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Monthly Budget')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('shows close button', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('displays currency options', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    expect(screen.getByText('EUR - Euro')).toBeInTheDocument();
    expect(screen.getByText('USD - US Dollar')).toBeInTheDocument();
  });

  it('shows add category button', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    const addButton = screen.getByRole('button', { name: /add category/i });
    expect(addButton).toBeInTheDocument();
  });

  it('displays export and import buttons', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument();
  });

  it('shows theme options', () => {
    renderWithTheme(<SettingsScreen onClose={mockOnClose} />);
    
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });
});
