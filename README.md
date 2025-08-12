# 💰 Monthly Expenses Tracker

A modern, accessible expense tracking application built with React, TypeScript, and Tailwind CSS. Track your spending, manage budgets, and gain insights into your financial habits with a beautiful, responsive interface that meets WCAG AA accessibility standards.

## ✨ Features

### 🎯 Core Functionality
- **Expense Tracking**: Add, edit, and delete expenses with categories, notes, and payment methods
- **Monthly Budgets**: Set and monitor monthly spending limits with visual progress indicators
- **Category Management**: Organize expenses with customizable categories and drag-and-drop reordering
- **Multi-Currency Support**: Display amounts in your preferred currency with real-time conversion
- **Data Import/Export**: CSV import/export for backup and migration

### 🎨 User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Themes**: Choose between system, light, or dark themes with proper contrast
- **Real-time Updates**: Changes reflect immediately across the entire application
- **Intuitive Interface**: Material 3-inspired design with smooth animations and transitions

### ♿ Accessibility
- **WCAG AA Compliance**: All UI elements meet accessibility standards (≥4.5:1 contrast ratio)
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Friendly**: Proper ARIA labels and semantic HTML structure
- **High Contrast Mode**: Optimized for users with visual impairments

### 🔧 Advanced Features
- **Currency Conversion**: Automatic exchange rate updates with offline fallback
- **Smart Categories**: Automatic category creation from imported data
- **Budget Analytics**: Visual spending breakdowns and category insights
- **Data Persistence**: Secure local storage with validation and error handling

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development with strict type checking
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Shadcn/ui** - High-quality, accessible UI components

### State Management
- **React Context** - Global state for theme and currency preferences
- **Custom Hooks** - Reusable logic for form management and data persistence

### Data & Storage
- **localStorage** - Client-side data persistence
- **IndexedDB** - Large dataset storage (planned)
- **CSV Processing** - Import/export functionality with validation

### Development Tools
- **Vite** - Fast build tool and development server
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/1tapuffja/expense_tracker.git
   cd expense_tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8081` (or the port shown in terminal)

### Build for Production

```bash
npm run build
npm run preview
```

## 📱 Usage Guide

### Adding Expenses
1. Click the **+** button in the dashboard
2. Fill in expense details (amount, category, date, notes)
3. Click "Add Expense" to save

### Managing Categories
1. Open **Settings** (gear icon)
2. Navigate to **Categories** section
3. Add, edit, or delete categories
4. Drag and drop to reorder categories
5. Click **Save** to persist changes

### Setting Budgets
1. Go to **Settings** → **Monthly Overall Budget**
2. Toggle "Enable monthly budget"
3. Enter your monthly spending limit
4. Save to activate budget tracking

### Changing Currency
1. Open **Settings** → **Currency**
2. Select your preferred display currency
3. View conversion information
4. Save to apply changes globally

### Importing Data
1. **Settings** → **Data Management** → **Import from CSV**
2. Select your CSV file
3. Choose import options (allow duplicates, etc.)
4. Review imported data and new categories

## 🎨 Customization

### Themes
The application supports three theme modes:
- **System**: Automatically follows your OS preference
- **Light**: Clean, bright interface for daytime use
- **Dark**: Easy on the eyes for low-light environments

### Categories
Default categories include:
- Food, Groceries, Transport, Bills
- Entertainment, Health, Shopping, Other

All categories can be customized with:
- Custom names
- Automatic color assignment
- Drag-and-drop reordering

### Currency Support
Supported currencies:
- EUR (Euro) - Base currency
- USD (US Dollar)
- GBP (British Pound)
- JPY (Japanese Yen)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- CNY (Chinese Yuan)

## 🔒 Data Privacy & Security

- **Local Storage**: All data is stored locally on your device
- **No Cloud Sync**: Your financial data never leaves your computer
- **Secure Validation**: Input sanitization and data validation
- **Backup Support**: Export your data to CSV for safekeeping

## 🧪 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Shadcn/ui components
│   └── ...             # Feature components
├── contexts/            # React contexts
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── pages/               # Page components
```

### Key Components
- **Dashboard**: Main expense overview and navigation
- **SettingsScreen**: Application configuration and preferences
- **AddExpenseDialog**: Expense creation interface
- **ExpenseList**: Expense display and management
- **ExpensePieChart**: Visual spending breakdown

### Adding New Features
1. Create components in `src/components/`
2. Add types to `src/types/`
3. Implement utilities in `src/lib/`
4. Update this README with new features

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain WCAG AA accessibility standards
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first styling approach
- **React Team** for the amazing framework
- **Vite** for the lightning-fast build tool

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/1tapuffja/expense_tracker/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Provide your browser and OS information

---

**Happy Expense Tracking! 💸**

*Built with ❤️ using modern web technologies*
