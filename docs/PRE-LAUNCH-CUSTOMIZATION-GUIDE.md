# Pre-Launch Customization Guide
## Platinum Lounge Management System

This guide covers essential customizations that need to be made before launching the system in production. These modifications allow you to adapt the system to your specific business requirements, local regulations, and branding needs.

---

## Table of Contents

1. [Receipt Component Customization](#receipt-component-customization)
2. [Value Added Tax (VAT) Configuration](#value-added-tax-vat-configuration)
3. [Business Information Setup](#business-information-setup)
4. [Currency and Pricing Configuration](#currency-and-pricing-configuration)
5. [Payment Methods Configuration](#payment-methods-configuration)
6. [User Roles and Permissions](#user-roles-and-permissions)
7. [Floor and Table Configuration](#floor-and-table-configuration)
8. [Default Categories and Products](#default-categories-and-products)
9. [Language and Localization](#language-and-localization)
10. [System Branding and Styling](#system-branding-and-styling)
11. [Notification Settings](#notification-settings)
12. [Backup and Security Configuration](#backup-and-security-configuration)

---

## 1. Receipt Component Customization

### Location
- **File**: `components/payments/payment-processing.tsx`
- **Receipt Dialog Section**: Lines 200-300 (approximately)

### Business Information Customization

\`\`\`typescript
// Find this section in the receipt dialog
<div className="text-center border-b pb-4">
  <h3 className="font-bold text-lg">Platinum Lounge</h3>
  <p className="text-sm text-gray-600">Payment Receipt</p>
  <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
</div>
\`\`\`

**Customize to:**

\`\`\`typescript
<div className="text-center border-b pb-4">
  <h3 className="font-bold text-lg">YOUR BUSINESS NAME</h3>
  <p className="text-xs text-gray-500">Your Business Address</p>
  <p className="text-xs text-gray-500">City, Country</p>
  <p className="text-xs text-gray-500">Phone: +237-XXX-XXX-XXX</p>
  <p className="text-xs text-gray-500">Email: info@yourbusiness.com</p>
  <hr className="my-2" />
  <p className="text-sm text-gray-600">Payment Receipt</p>
  <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
</div>
\`\`\`

### Receipt Footer Customization

Add after the payment details section:

\`\`\`typescript
<div className="border-t pt-4 text-center text-xs text-gray-500">
  <p>Thank you for your business!</p>
  <p>Visit us again soon</p>
  <p>Follow us: @yourbusiness</p>
  <p>WiFi: YourWiFiName | Password: YourPassword</p>
</div>
\`\`\`

### Receipt Size and Print Styling

**File**: `app/globals.css`

Add these print styles:

\`\`\`css
@media print {
  .receipt-content {
    width: 80mm; /* Thermal printer width */
    font-size: 12px;
    line-height: 1.2;
  }
  
  .receipt-header {
    text-align: center;
    margin-bottom: 10px;
  }
  
  .receipt-item {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
  }
  
  .receipt-total {
    border-top: 1px dashed #000;
    padding-top: 5px;
    font-weight: bold;
  }
}
\`\`\`

---

## 2. Value Added Tax (VAT) Configuration

### Current VAT Setting
**File**: `components/sales/order-form.tsx` (Line ~180)
**File**: `components/pos/pos-interface.tsx` (Line ~220)

\`\`\`typescript
// Current setting (19.25% for Cameroon)
const tax = subtotal * 0.1925
\`\`\`

### Customization Options

#### Option 1: Fixed VAT Rate
\`\`\`typescript
// Change the VAT rate to your country's rate
const VAT_RATE = 0.15; // 15% VAT
const tax = subtotal * VAT_RATE;
\`\`\`

#### Option 2: Configurable VAT System
Create a configuration file:

**File**: `lib/tax-config.ts`

\`\`\`typescript
export interface TaxConfig {
  vatRate: number;
  vatName: string;
  vatNumber?: string;
  exemptCategories?: string[];
  includedInPrice: boolean;
}

export const TAX_CONFIG: TaxConfig = {
  vatRate: 0.1925, // 19.25%
  vatName: "VAT",
  vatNumber: "VAT-REG-123456789", // Your VAT registration number
  exemptCategories: [], // Categories exempt from VAT
  includedInPrice: false // Whether VAT is included in displayed prices
};

export function calculateTax(subtotal: number, categoryId?: string): number {
  if (TAX_CONFIG.exemptCategories?.includes(categoryId || '')) {
    return 0;
  }
  return subtotal * TAX_CONFIG.vatRate;
}

export function formatTaxDisplay(): string {
  return `${TAX_CONFIG.vatName} (${(TAX_CONFIG.vatRate * 100).toFixed(2)}%)`;
}
\`\`\`

#### Option 3: Multiple Tax Rates
For businesses with different tax rates for different products:

\`\`\`typescript
export const TAX_RATES = {
  FOOD: 0.05,      // 5% for food
  ALCOHOL: 0.20,   // 20% for alcohol
  SERVICES: 0.15,  // 15% for services
  DEFAULT: 0.1925  // Default rate
};

export function calculateTaxByCategory(subtotal: number, category: string): number {
  const rate = TAX_RATES[category as keyof typeof TAX_RATES] || TAX_RATES.DEFAULT;
  return subtotal * rate;
}
\`\`\`

### Update Receipt to Show VAT Details

In `components/payments/payment-processing.tsx`:

\`\`\`typescript
// Add VAT registration number to receipt
<div className="flex justify-between">
  <span>VAT ({(TAX_CONFIG.vatRate * 100).toFixed(2)}%):</span>
  <span>{tax.toLocaleString()} XAF</span>
</div>
{TAX_CONFIG.vatNumber && (
  <div className="text-xs text-gray-500">
    VAT Reg: {TAX_CONFIG.vatNumber}
  </div>
)}
\`\`\`

---

## 3. Business Information Setup

### Environment Variables
**File**: `.env.local`

Add these business-specific variables:

\`\`\`env
# Business Information
BUSINESS_NAME="Your Business Name"
BUSINESS_ADDRESS="Your Business Address"
BUSINESS_CITY="Your City"
BUSINESS_COUNTRY="Your Country"
BUSINESS_PHONE="+237-XXX-XXX-XXX"
BUSINESS_EMAIL="info@yourbusiness.com"
BUSINESS_WEBSITE="www.yourbusiness.com"
BUSINESS_VAT_NUMBER="VAT-REG-123456789"

# Social Media
BUSINESS_FACEBOOK="@yourbusiness"
BUSINESS_INSTAGRAM="@yourbusiness"
BUSINESS_TWITTER="@yourbusiness"

# WiFi Information (for receipts)
WIFI_NAME="YourWiFiName"
WIFI_PASSWORD="YourWiFiPassword"
\`\`\`

### Business Configuration Component
**File**: `lib/business-config.ts`

\`\`\`typescript
export const BUSINESS_CONFIG = {
  name: process.env.BUSINESS_NAME || "Platinum Lounge",
  address: process.env.BUSINESS_ADDRESS || "",
  city: process.env.BUSINESS_CITY || "",
  country: process.env.BUSINESS_COUNTRY || "",
  phone: process.env.BUSINESS_PHONE || "",
  email: process.env.BUSINESS_EMAIL || "",
  website: process.env.BUSINESS_WEBSITE || "",
  vatNumber: process.env.BUSINESS_VAT_NUMBER || "",
  social: {
    facebook: process.env.BUSINESS_FACEBOOK || "",
    instagram: process.env.BUSINESS_INSTAGRAM || "",
    twitter: process.env.BUSINESS_TWITTER || "",
  },
  wifi: {
    name: process.env.WIFI_NAME || "",
    password: process.env.WIFI_PASSWORD || "",
  }
};
\`\`\`

---

## 4. Currency and Pricing Configuration

### Current Currency Setting
The system is set to XAF (Central African CFA Franc). To change:

**File**: `lib/currency-config.ts`

\`\`\`typescript
export const CURRENCY_CONFIG = {
  code: "XAF",
  symbol: "XAF",
  name: "Central African CFA Franc",
  decimals: 0, // XAF doesn't use decimals
  thousandsSeparator: ",",
  decimalSeparator: ".",
  symbolPosition: "after" // "before" or "after"
};

export function formatCurrency(amount: number): string {
  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: CURRENCY_CONFIG.decimals,
    maximumFractionDigits: CURRENCY_CONFIG.decimals
  });
  
  return CURRENCY_CONFIG.symbolPosition === "before" 
    ? `${CURRENCY_CONFIG.symbol} ${formatted}`
    : `${formatted} ${CURRENCY_CONFIG.symbol}`;
}
\`\`\`

### For Other Currencies

#### USD Configuration:
\`\`\`typescript
export const CURRENCY_CONFIG = {
  code: "USD",
  symbol: "$",
  name: "US Dollar",
  decimals: 2,
  thousandsSeparator: ",",
  decimalSeparator: ".",
  symbolPosition: "before"
};
\`\`\`

#### EUR Configuration:
\`\`\`typescript
export const CURRENCY_CONFIG = {
  code: "EUR",
  symbol: "€",
  name: "Euro",
  decimals: 2,
  thousandsSeparator: ".",
  decimalSeparator: ",",
  symbolPosition: "after"
};
\`\`\`

---

## 5. Payment Methods Configuration

### Current Payment Methods
**File**: `components/payments/payment-processing.tsx`

\`\`\`typescript
// Current payment methods
const paymentMethods = [
  { value: "CASH", label: "Cash", icon: DollarSign },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building }
];
\`\`\`

### Customization for Different Regions

#### For Cameroon (Current):
\`\`\`typescript
const paymentMethods = [
  { value: "CASH", label: "Cash", icon: DollarSign },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "ORANGE_MONEY", label: "Orange Money", icon: Smartphone },
  { value: "MTN_MOMO", label: "MTN Mobile Money", icon: Smartphone },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building }
];
\`\`\`

#### For Other African Countries:
\`\`\`typescript
const paymentMethods = [
  { value: "CASH", label: "Cash", icon: DollarSign },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "MPESA", label: "M-Pesa", icon: Smartphone },
  { value: "AIRTEL_MONEY", label: "Airtel Money", icon: Smartphone },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building }
];
\`\`\`

#### For Western Countries:
\`\`\`typescript
const paymentMethods = [
  { value: "CASH", label: "Cash", icon: DollarSign },
  { value: "CARD", label: "Credit/Debit Card", icon: CreditCard },
  { value: "CONTACTLESS", label: "Contactless", icon: Smartphone },
  { value: "APPLE_PAY", label: "Apple Pay", icon: Smartphone },
  { value: "GOOGLE_PAY", label: "Google Pay", icon: Smartphone }
];
\`\`\`

---

## 6. User Roles and Permissions

### Current Roles
**File**: `lib/auth.ts`

\`\`\`typescript
export const USER_ROLES = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager", 
  WAITRESS: "Waitress",
  STOCK_MANAGER: "Stock Manager",
  CASHIER: "Cashier",
  COOK: "Cook"
};
\`\`\`

### Adding Custom Roles

\`\`\`typescript
export const USER_ROLES = {
  SUPER_ADMIN: "Super Admin",
  MANAGER: "Manager",
  ASSISTANT_MANAGER: "Assistant Manager", // New role
  WAITRESS: "Waitress",
  HEAD_WAITER: "Head Waiter", // New role
  STOCK_MANAGER: "Stock Manager",
  CASHIER: "Cashier",
  HEAD_CASHIER: "Head Cashier", // New role
  COOK: "Cook",
  HEAD_CHEF: "Head Chef", // New role
  BARTENDER: "Bartender", // New role
  SECURITY: "Security" // New role
};
\`\`\`

### Role Permissions Configuration

**File**: `lib/permissions.ts`

\`\`\`typescript
export const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: [
    "all_access"
  ],
  [USER_ROLES.MANAGER]: [
    "staff_management",
    "inventory_management", 
    "sales_management",
    "reports_access",
    "table_management",
    "payment_processing"
  ],
  [USER_ROLES.ASSISTANT_MANAGER]: [
    "inventory_management",
    "sales_management", 
    "reports_access",
    "table_management"
  ],
  [USER_ROLES.WAITRESS]: [
    "pos_access",
    "table_management_basic"
  ],
  [USER_ROLES.HEAD_WAITER]: [
    "pos_access",
    "table_management",
    "staff_coordination"
  ],
  // ... add more roles as needed
};
\`\`\`

---

## 7. Floor and Table Configuration

### Default Floors
**File**: `lib/floor-config.ts`

\`\`\`typescript
export const DEFAULT_FLOORS = [
  { id: "lounge", name: "Lounge", nameEn: "Lounge", nameFr: "Salon" },
  { id: "club", name: "Club", nameEn: "Club", nameFr: "Club" },
  { id: "bar", name: "Bar", nameEn: "Bar", nameFr: "Bar" },
  { id: "terrace", name: "Terrace", nameEn: "Terrace", nameFr: "Terrasse" }
];
\`\`\`

### Customization for Your Venue

\`\`\`typescript
export const DEFAULT_FLOORS = [
  { id: "ground", name: "Ground Floor", nameEn: "Ground Floor", nameFr: "Rez-de-chaussée" },
  { id: "first", name: "First Floor", nameEn: "First Floor", nameFr: "Premier étage" },
  { id: "vip", name: "VIP Section", nameEn: "VIP Section", nameFr: "Section VIP" },
  { id: "outdoor", name: "Outdoor", nameEn: "Outdoor", nameFr: "Extérieur" },
  { id: "private", name: "Private Rooms", nameEn: "Private Rooms", nameFr: "Salles privées" }
];
\`\`\`

### Table Naming Convention

**File**: `components/sales/table-management.tsx`

\`\`\`typescript
// Current naming: "Table 1", "Table 2", etc.
// Customize to your preference:

const generateTableName = (floor: string, number: number) => {
  const prefixes = {
    lounge: "L",
    club: "C", 
    bar: "B",
    terrace: "T",
    vip: "VIP"
  };
  
  return `${prefixes[floor] || "T"}${number.toString().padStart(2, '0')}`;
  // Results in: L01, L02, C01, C02, B01, B02, etc.
};
\`\`\`

---

## 8. Default Categories and Products

### Default Categories
**File**: Database initialization script or admin setup

\`\`\`typescript
export const DEFAULT_CATEGORIES = [
  {
    name: "Food",
    nameEn: "Food", 
    nameFr: "Nourriture",
    icon: "utensils"
  },
  {
    name: "Whiskey",
    nameEn: "Whiskey",
    nameFr: "Whisky", 
    icon: "wine"
  },
  {
    name: "Wine", 
    nameEn: "Wine",
    nameFr: "Vin",
    icon: "grape"
  },
  {
    name: "Beer",
    nameEn: "Beer",
    nameFr: "Bière",
    icon: "beer"
  },
  {
    name: "Soft Drinks",
    nameEn: "Soft Drinks", 
    nameFr: "Boissons non alcoolisées",
    icon: "coffee"
  }
];
\`\`\`

### Customization for Your Business

\`\`\`typescript
export const DEFAULT_CATEGORIES = [
  {
    name: "Appetizers",
    nameEn: "Appetizers",
    nameFr: "Entrées", 
    icon: "utensils"
  },
  {
    name: "Main Course",
    nameEn: "Main Course",
    nameFr: "Plat principal",
    icon: "utensils"
  },
  {
    name: "Desserts",
    nameEn: "Desserts", 
    nameFr: "Desserts",
    icon: "cake"
  },
  {
    name: "Cocktails",
    nameEn: "Cocktails",
    nameFr: "Cocktails",
    icon: "martini"
  },
  {
    name: "Premium Spirits",
    nameEn: "Premium Spirits",
    nameFr: "Spiritueux premium", 
    icon: "wine"
  },
  {
    name: "Non-Alcoholic",
    nameEn: "Non-Alcoholic",
    nameFr: "Sans alcool",
    icon: "coffee"
  }
];
\`\`\`

---

## 9. Language and Localization

### Adding New Languages

**File**: `lib/i18n.ts`

To add Spanish support:

\`\`\`typescript
export const translations = {
  en: { /* existing English translations */ },
  fr: { /* existing French translations */ },
  es: {
    // Authentication
    login: "Iniciar sesión",
    username: "Nombre de usuario", 
    password: "Contraseña",
    // ... add all translations
  }
};

export type Language = "en" | "fr" | "es";
\`\`\`

### Regional Customization

For different French-speaking regions:

\`\`\`typescript
// Cameroon French
pointOfSale: "Point de vente",
mobileMoney: "Mobile Money",

// France French  
pointOfSale: "Point de vente",
mobileMoney: "Paiement mobile",

// Canadian French
pointOfSale: "Point de vente", 
mobileMoney: "Argent mobile",
\`\`\`

---

## 10. System Branding and Styling

### Logo and Branding
**File**: `public/logo.png` (Add your logo)
**File**: `components/header.tsx`

\`\`\`typescript
// Replace the default header
<div className="flex items-center space-x-3">
  <img 
    src="/logo.png" 
    alt="Your Business Logo"
    className="h-8 w-8"
  />
  <h1 className="text-xl font-bold">Your Business Name</h1>
</div>
\`\`\`

### Color Scheme Customization
**File**: `tailwind.config.ts`

\`\`\`typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#your-color-50',
          100: '#your-color-100',
          // ... define your brand colors
          900: '#your-color-900',
        },
        secondary: {
          // ... your secondary colors
        }
      }
    }
  }
}
\`\`\`

### Custom CSS Variables
**File**: `app/globals.css`

\`\`\`css
:root {
  --brand-primary: #your-primary-color;
  --brand-secondary: #your-secondary-color;
  --brand-accent: #your-accent-color;
  --brand-background: #your-background-color;
}

.brand-button {
  background-color: var(--brand-primary);
  color: white;
}

.brand-header {
  background-color: var(--brand-secondary);
}
\`\`\`

---

## 11. Notification Settings

### Sound Notifications
**File**: `public/sounds/`

Replace default notification sounds:
- `notification-sound.mp3` - New order notification
- `order-ready.mp3` - Order ready notification  
- `payment-success.mp3` - Payment success sound

### Notification Configuration
**File**: `lib/notification-config.ts`

\`\`\`typescript
export const NOTIFICATION_CONFIG = {
  sounds: {
    newOrder: "/sounds/new-order.mp3",
    orderReady: "/sounds/order-ready.mp3", 
    paymentSuccess: "/sounds/payment-success.mp3",
    lowStock: "/sounds/alert.mp3"
  },
  volume: 0.7, // 0.0 to 1.0
  enabled: true,
  showToasts: true,
  autoHide: 5000 // milliseconds
};
\`\`\`

---

## 12. Backup and Security Configuration

### Backup Configuration
**File**: `.env.local`

\`\`\`env
# Backup Configuration
BACKUP_DIR="/path/to/backup/directory"
BACKUP_SCHEDULE="0 2 * * *" # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"
\`\`\`

### Security Settings
**File**: `lib/security-config.ts`

\`\`\`typescript
export const SECURITY_CONFIG = {
  sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumber: true,
  passwordRequireUppercase: true,
  auditLogRetention: 365, // days
  encryptSensitiveData: true
};
\`\`\`

---

## Pre-Launch Checklist

Before launching your system, ensure you have:

### ✅ Business Information
- [ ] Updated business name, address, and contact information
- [ ] Added your logo and branding
- [ ] Configured VAT rate and tax settings
- [ ] Set up payment methods for your region

### ✅ System Configuration  
- [ ] Configured floors and table layout
- [ ] Set up default product categories
- [ ] Customized user roles and permissions
- [ ] Configured currency and pricing

### ✅ Localization
- [ ] Verified all translations are accurate
- [ ] Set appropriate default language
- [ ] Tested language switching functionality

### ✅ Security & Backup
- [ ] Changed default admin credentials
- [ ] Configured backup directory and schedule
- [ ] Set up encryption keys
- [ ] Tested backup and restore procedures

### ✅ Receipt Customization
- [ ] Updated receipt header with business information
- [ ] Added footer with thank you message and contact info
- [ ] Tested receipt printing on your printer
- [ ] Verified VAT information is displayed correctly

### ✅ Testing
- [ ] Tested all user roles and permissions
- [ ] Verified payment processing with all methods
- [ ] Tested kitchen workflow and notifications
- [ ] Confirmed inventory management works correctly
- [ ] Validated reporting and analytics

---

## Support and Maintenance

After customization, remember to:

1. **Document your changes** - Keep a record of all customizations made
2. **Test thoroughly** - Test all functionality after making changes
3. **Train your staff** - Ensure all users understand the customized system
4. **Regular backups** - Verify backup system is working correctly
5. **Monitor performance** - Keep an eye on system performance after launch

For technical support or additional customizations, refer to the main documentation or contact your system administrator.
