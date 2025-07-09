# Receipt Customization Guide
## Detailed Instructions for Receipt Component Modification

This guide provides step-by-step instructions for customizing the receipt component to match your business requirements, including layout, content, and printing specifications.

---

## Table of Contents

1. [Receipt Component Overview](#receipt-component-overview)
2. [Basic Business Information](#basic-business-information)
3. [Receipt Layout Customization](#receipt-layout-customization)
4. [Tax and Pricing Display](#tax-and-pricing-display)
5. [Payment Method Display](#payment-method-display)
6. [Print Styling and Formatting](#print-styling-and-formatting)
7. [Multi-language Receipt Support](#multi-language-receipt-support)
8. [Advanced Customizations](#advanced-customizations)
9. [Testing and Validation](#testing-and-validation)

---

## 1. Receipt Component Overview

### Main Receipt Component Location
**File**: `components/payments/payment-processing.tsx`
**Lines**: Approximately 250-350 (Receipt Dialog section)

### Key Sections of the Receipt:
1. **Header** - Business information and branding
2. **Transaction Details** - Order number, date, payment method
3. **Items List** - Products purchased with quantities and prices
4. **Totals** - Subtotal, tax, and final total
5. **Footer** - Thank you message and additional information

---

## 2. Basic Business Information

### Current Header Section
\`\`\`typescript
<div className="text-center border-b pb-4">
  <h3 className="font-bold text-lg">Platinum Lounge</h3>
  <p className="text-sm text-gray-600">Payment Receipt</p>
  <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
</div>
\`\`\`

### Customized Header with Full Business Information
\`\`\`typescript
<div className="text-center border-b pb-4">
  {/* Business Logo (optional) */}
  <div className="mb-2">
    <img 
      src="/logo.png" 
      alt="Business Logo" 
      className="h-12 w-12 mx-auto"
    />
  </div>
  
  {/* Business Name */}
  <h3 className="font-bold text-lg">YOUR BUSINESS NAME</h3>
  
  {/* Business Address */}
  <p className="text-xs text-gray-600">123 Business Street</p>
  <p className="text-xs text-gray-600">City Name, Postal Code</p>
  <p className="text-xs text-gray-600">Country Name</p>
  
  {/* Contact Information */}
  <p className="text-xs text-gray-600 mt-1">
    Tel: +237-XXX-XXX-XXX | Email: info@yourbusiness.com
  </p>
  
  {/* VAT Registration (if applicable) */}
  <p className="text-xs text-gray-500">VAT Reg: VAT-123456789</p>
  
  {/* Receipt Title and Date */}
  <div className="mt-2 pt-2 border-t border-gray-200">
    <p className="text-sm font-medium">PAYMENT RECEIPT</p>
    <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
  </div>
</div>
\`\`\`

### Dynamic Business Information (Recommended)
Create a configuration file for easy updates:

**File**: `lib/business-info.ts`
\`\`\`typescript
export const BUSINESS_INFO = {
  name: "Your Business Name",
  address: {
    street: "123 Business Street",
    city: "City Name",
    postalCode: "12345",
    country: "Country Name"
  },
  contact: {
    phone: "+237-XXX-XXX-XXX",
    email: "info@yourbusiness.com",
    website: "www.yourbusiness.com"
  },
  registration: {
    vatNumber: "VAT-123456789",
    businessNumber: "BN-987654321"
  },
  social: {
    facebook: "@yourbusiness",
    instagram: "@yourbusiness"
  }
};
\`\`\`

Then use it in the receipt:
\`\`\`typescript
import { BUSINESS_INFO } from '@/lib/business-info';

// In the receipt component
<div className="text-center border-b pb-4">
  <h3 className="font-bold text-lg">{BUSINESS_INFO.name}</h3>
  <p className="text-xs text-gray-600">{BUSINESS_INFO.address.street}</p>
  <p className="text-xs text-gray-600">
    {BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.postalCode}
  </p>
  <p className="text-xs text-gray-600">{BUSINESS_INFO.address.country}</p>
  <p className="text-xs text-gray-600 mt-1">
    Tel: {BUSINESS_INFO.contact.phone} | Email: {BUSINESS_INFO.contact.email}
  </p>
  {BUSINESS_INFO.registration.vatNumber && (
    <p className="text-xs text-gray-500">
      VAT Reg: {BUSINESS_INFO.registration.vatNumber}
    </p>
  )}
</div>
\`\`\`

---

## 3. Receipt Layout Customization

### Current Transaction Details Section
\`\`\`typescript
<div className="space-y-2 text-sm">
  <div className="flex justify-between">
    <span>Receipt #:</span>
    <span className="font-medium">{receipt._id}</span>
  </div>
  <div className="flex justify-between">
    <span>Order #:</span>
    <span className="font-medium">{order.orderNumber}</span>
  </div>
  // ... more details
</div>
\`\`\`

### Enhanced Transaction Details
\`\`\`typescript
<div className="space-y-2 text-sm border-b pb-3 mb-3">
  {/* Receipt and Order Numbers */}
  <div className="flex justify-between">
    <span>Receipt #:</span>
    <span className="font-medium">{receipt._id?.slice(-8).toUpperCase()}</span>
  </div>
  <div className="flex justify-between">
    <span>Order #:</span>
    <span className="font-medium">{order.orderNumber}</span>
  </div>
  
  {/* Date and Time */}
  <div className="flex justify-between">
    <span>Date:</span>
    <span className="font-medium">{new Date().toLocaleDateString()}</span>
  </div>
  <div className="flex justify-between">
    <span>Time:</span>
    <span className="font-medium">{new Date().toLocaleTimeString()}</span>
  </div>
  
  {/* Table and Service Information */}
  <div className="flex justify-between">
    <span>Table:</span>
    <span className="font-medium">
      {order.type === "DINE_IN" ? `Table ${order.tableNumber}` : order.type}
    </span>
  </div>
  
  {/* Customer Information (if available) */}
  {order.customerName && (
    <div className="flex justify-between">
      <span>Customer:</span>
      <span className="font-medium">{order.customerName}</span>
    </div>
  )}
  
  {/* Staff Information */}
  <div className="flex justify-between">
    <span>Served by:</span>
    <span className="font-medium">{order.waiterName || 'Staff'}</span>
  </div>
  
  {/* Payment Method */}
  <div className="flex justify-between">
    <span>Payment:</span>
    <span className="font-medium">{getPaymentMethodLabel(receipt.method)}</span>
  </div>
  
  {/* Reference Number (if applicable) */}
  {receipt.reference && (
    <div className="flex justify-between">
      <span>Reference:</span>
      <span className="font-medium text-xs">{receipt.reference}</span>
    </div>
  )}
</div>
\`\`\`

### Items List Customization
\`\`\`typescript
{/* Order Items Section */}
<div className="border-b pb-3 mb-3">
  <h4 className="font-medium text-sm mb-2">ITEMS PURCHASED</h4>
  <div className="space-y-1">
    {order.items.map((item, index) => (
      <div key={index} className="flex justify-between text-xs">
        <div className="flex-1">
          <div className="font-medium">{item.productName}</div>
          <div className="text-gray-500">
            {item.quantity} x {item.unitPrice.toLocaleString()} XAF
          </div>
          {item.notes && (
            <div className="text-gray-400 italic text-xs">
              Note: {item.notes}
            </div>
          )}
        </div>
        <div className="font-medium">
          {item.totalPrice.toLocaleString()} XAF
        </div>
      </div>
    ))}
  </div>
</div>
\`\`\`

---

## 4. Tax and Pricing Display

### Current Totals Section
\`\`\`typescript
<div className="border-t pt-4 space-y-2">
  <div className="flex justify-between font-bold">
    <span>Order Total:</span>
    <span>{order.total.toLocaleString()} XAF</span>
  </div>
  // ... more totals
</div>
\`\`\`

### Enhanced Totals with Tax Breakdown
\`\`\`typescript
<div className="border-t pt-3 space-y-2">
  {/* Subtotal */}
  <div className="flex justify-between text-sm">
    <span>Subtotal:</span>
    <span>{order.subtotal.toLocaleString()} XAF</span>
  </div>
  
  {/* Discount (if applicable) */}
  {order.discount > 0 && (
    <div className="flex justify-between text-sm text-green-600">
      <span>Discount:</span>
      <span>-{order.discount.toLocaleString()} XAF</span>
    </div>
  )}
  
  {/* Tax Breakdown */}
  <div className="flex justify-between text-sm">
    <span>VAT (19.25%):</span>
    <span>{order.tax.toLocaleString()} XAF</span>
  </div>
  
  {/* Service Charge (if applicable) */}
  {order.serviceCharge && (
    <div className="flex justify-between text-sm">
      <span>Service Charge:</span>
      <span>{order.serviceCharge.toLocaleString()} XAF</span>
    </div>
  )}
  
  {/* Final Total */}
  <div className="flex justify-between font-bold text-lg border-t pt-2">
    <span>TOTAL:</span>
    <span>{order.total.toLocaleString()} XAF</span>
  </div>
  
  {/* Payment Information */}
  <div className="text-sm text-gray-600 mt-2">
    <div className="flex justify-between">
      <span>Amount Paid:</span>
      <span>{receipt.amount.toLocaleString()} XAF</span>
    </div>
    
    {/* Change (for cash payments) */}
    {receipt.method === 'CASH' && receipt.amount > order.total && (
      <div className="flex justify-between font-medium">
        <span>Change:</span>
        <span>{(receipt.amount - order.total).toLocaleString()} XAF</span>
      </div>
    )}
  </div>
</div>
\`\`\`

---

## 5. Payment Method Display

### Payment Method Labels
\`\`\`typescript
const getPaymentMethodLabel = (method: string): string => {
  const labels = {
    'CASH': 'Cash',
    'CARD': 'Credit/Debit Card',
    'MOBILE_MONEY': 'Mobile Money',
    'ORANGE_MONEY': 'Orange Money',
    'MTN_MOMO': 'MTN Mobile Money',
    'BANK_TRANSFER': 'Bank Transfer',
    'CONTACTLESS': 'Contactless Payment'
  };
  return labels[method] || method;
};

const getPaymentMethodIcon = (method: string) => {
  const icons = {
    'CASH': '💵',
    'CARD': '💳',
    'MOBILE_MONEY': '📱',
    'ORANGE_MONEY': '🟠',
    'MTN_MOMO': '🟡',
    'BANK_TRANSFER': '🏦',
    'CONTACTLESS': '📲'
  };
  return icons[method] || '💳';
};
\`\`\`

### Enhanced Payment Display
\`\`\`typescript
<div className="flex justify-between items-center">
  <span>Payment Method:</span>
  <div className="flex items-center space-x-1">
    <span>{getPaymentMethodIcon(receipt.method)}</span>
    <span className="font-medium">{getPaymentMethodLabel(receipt.method)}</span>
  </div>
</div>
\`\`\`

---

## 6. Print Styling and Formatting

### Receipt Print Styles
**File**: `app/globals.css`

Add these styles for optimal printing:

\`\`\`css
/* Receipt Print Styles */
@media print {
  /* Hide everything except receipt */
  body * {
    visibility: hidden;
  }
  
  .receipt-content, .receipt-content * {
    visibility: visible;
  }
  
  .receipt-content {
    position: absolute;
    left: 0;
    top: 0;
    width: 80mm; /* Standard thermal printer width */
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.3;
    color: black;
    background: white;
  }
  
  /* Header styling */
  .receipt-header {
    text-align: center;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px dashed black;
  }
  
  .receipt-header h3 {
    font-size: 16px;
    font-weight: bold;
    margin: 0 0 5px 0;
  }
  
  /* Items styling */
  .receipt-items {
    margin: 10px 0;
  }
  
  .receipt-item {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 11px;
  }
  
  .receipt-item-name {
    flex: 1;
    padding-right: 5px;
  }
  
  .receipt-item-price {
    text-align: right;
    min-width: 60px;
  }
  
  /* Totals styling */
  .receipt-totals {
    border-top: 1px dashed black;
    padding-top: 5px;
    margin-top: 10px;
  }
  
  .receipt-total-line {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
  }
  
  .receipt-final-total {
    font-weight: bold;
    font-size: 14px;
    border-top: 1px solid black;
    padding-top: 3px;
    margin-top: 5px;
  }
  
  /* Footer styling */
  .receipt-footer {
    text-align: center;
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px dashed black;
    font-size: 10px;
  }
  
  /* Hide buttons and non-essential elements */
  button, .no-print {
    display: none !important;
  }
}

/* Screen styles for receipt preview */
.receipt-content {
  max-width: 300px;
  margin: 0 auto;
  font-family: 'Courier New', monospace;
  background: white;
  padding: 20px;
  border: 1px solid #ddd;
}
\`\`\`

### Thermal Printer Specific Styling
\`\`\`css
/* For 58mm thermal printers */
@media print {
  .receipt-content {
    width: 58mm;
    font-size: 10px;
  }
}

/* For 80mm thermal printers */
@media print {
  .receipt-content {
    width: 80mm;
    font-size: 12px;
  }
}
\`\`\`

---

## 7. Multi-language Receipt Support

### Language-Aware Receipt Component
\`\`\`typescript
import { useLanguage } from '@/contexts/language-context';

export function ReceiptContent({ order, receipt }: ReceiptProps) {
  const { t, language } = useLanguage();
  
  return (
    <div className="receipt-content">
      {/* Header in selected language */}
      <div className="receipt-header">
        <h3>{BUSINESS_INFO.name}</h3>
        <p>{t('paymentReceipt')}</p>
        <p>{new Date().toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
      </div>
      
      {/* Transaction details */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span>{t('receiptNumber')}:</span>
          <span>{receipt._id?.slice(-8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('orderNumber')}:</span>
          <span>{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('table')}:</span>
          <span>{order.tableNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('servedBy')}:</span>
          <span>{order.waiterName}</span>
        </div>
      </div>
      
      {/* Items with language support */}
      <div className="receipt-items">
        <h4>{t('itemsPurchased')}</h4>
        {order.items.map((item, index) => (
          <div key={index} className="receipt-item">
            <div className="receipt-item-name">
              {language === 'fr' ? item.productNameFr : item.productName}
              <div className="text-xs text-gray-500">
                {item.quantity} x {item.unitPrice.toLocaleString()} XAF
              </div>
            </div>
            <div className="receipt-item-price">
              {item.totalPrice.toLocaleString()} XAF
            </div>
          </div>
        ))}
      </div>
      
      {/* Totals in selected language */}
      <div className="receipt-totals">
        <div className="receipt-total-line">
          <span>{t('subtotal')}:</span>
          <span>{order.subtotal.toLocaleString()} XAF</span>
        </div>
        <div className="receipt-total-line">
          <span>{t('tax')} (19.25%):</span>
          <span>{order.tax.toLocaleString()} XAF</span>
        </div>
        <div className="receipt-total-line receipt-final-total">
          <span>{t('total')}:</span>
          <span>{order.total.toLocaleString()} XAF</span>
        </div>
      </div>
    </div>
  );
}
\`\`\`

### Add Receipt-Specific Translations
**File**: `lib/i18n.ts`

\`\`\`typescript
// Add to translations object
export const translations = {
  en: {
    // ... existing translations
    paymentReceipt: "Payment Receipt",
    receiptNumber: "Receipt #",
    orderNumber: "Order #",
    itemsPurchased: "Items Purchased",
    servedBy: "Served by",
    thankYouMessage: "Thank you for your business!",
    visitAgain: "Visit us again soon",
    followUs: "Follow us",
  },
  fr: {
    // ... existing translations
    paymentReceipt: "Reçu de Paiement",
    receiptNumber: "Reçu #",
    orderNumber: "Commande #",
    itemsPurchased: "Articles Achetés",
    servedBy: "Servi par",
    thankYouMessage: "Merci pour votre visite!",
    visitAgain: "Revenez nous voir bientôt",
    followUs: "Suivez-nous",
  }
};
\`\`\`

---

## 8. Advanced Customizations

### QR Code Integration
Add QR codes for digital receipts or feedback:

\`\`\`typescript
import QRCode from 'qrcode.react';

// In receipt component
<div className="receipt-footer">
  <p>{t('thankYouMessage')}</p>
  
  {/* QR Code for feedback or digital receipt */}
  <div className="mt-3">
    <QRCode 
      value={`https://yourbusiness.com/receipt/${receipt._id}`}
      size={60}
      className="mx-auto"
    />
    <p className="text-xs mt-1">Scan for digital receipt</p>
  </div>
</div>
\`\`\`

### Loyalty Program Integration
\`\`\`typescript
{/* Loyalty points section */}
{customer?.loyaltyPoints && (
  <div className="border-t pt-2 mt-2">
    <div className="flex justify-between text-sm">
      <span>Points Earned:</span>
      <span>+{Math.floor(order.total / 100)} pts</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Total Points:</span>
      <span>{customer.loyaltyPoints + Math.floor(order.total / 100)} pts</span>
    </div>
  </div>
)}
\`\`\`

### Promotional Messages
\`\`\`typescript
{/* Promotional section */}
<div className="receipt-footer">
  <p>{t('thankYouMessage')}</p>
  
  {/* Happy hour promotion */}
  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
    <p className="text-xs font-medium">🍹 Happy Hour: 5-7 PM</p>
    <p className="text-xs">50% off all cocktails!</p>
  </div>
  
  {/* WiFi information */}
  <div className="mt-2">
    <p className="text-xs">📶 WiFi: {BUSINESS_INFO.wifi?.name}</p>
    <p className="text-xs">Password: {BUSINESS_INFO.wifi?.password}</p>
  </div>
  
  {/* Social media */}
  <div className="mt-2">
    <p className="text-xs">{t('followUs')}: {BUSINESS_INFO.social.instagram}</p>
  </div>
</div>
\`\`\`

---

## 9. Testing and Validation

### Receipt Testing Checklist

#### ✅ Visual Testing
- [ ] Receipt displays correctly on screen
- [ ] All business information is accurate
- [ ] Items list shows correct products and prices
- [ ] Totals calculate correctly
- [ ] Tax information is displayed properly
- [ ] Payment method shows correctly

#### ✅ Print Testing
- [ ] Receipt prints at correct width (58mm or 80mm)
- [ ] Text is readable and properly sized
- [ ] No text cutoff or formatting issues
- [ ] Print quality is acceptable
- [ ] Thermal printer compatibility verified

#### ✅ Language Testing
- [ ] Receipt displays correctly in English
- [ ] Receipt displays correctly in French
- [ ] Language switching works properly
- [ ] All translations are accurate
- [ ] Date/time formats are localized

#### ✅ Data Validation
- [ ] Order information is accurate
- [ ] Payment details are correct
- [ ] Customer information displays when available
- [ ] Staff information shows correctly
- [ ] Transaction IDs are unique and valid

### Test Receipt Generation
Create a test function to generate sample receipts:

\`\`\`typescript
// Test receipt data
const testReceiptData = {
  order: {
    orderNumber: "ORD-001",
    tableNumber: "5",
    customerName: "John Doe",
    waiterName: "Jane Smith",
    items: [
      {
        productName: "Grilled Chicken",
        productNameFr: "Poulet Grillé",
        quantity: 2,
        unitPrice: 5000,
        totalPrice: 10000,
        notes: "Well done"
      },
      {
        productName: "Red Wine",
        productNameFr: "Vin Rouge",
        quantity: 1,
        unitPrice: 8000,
        totalPrice: 8000
      }
    ],
    subtotal: 18000,
    tax: 3465,
    total: 21465,
    type: "DINE_IN"
  },
  receipt: {
    _id: "REC123456789",
    amount: 21465,
    method: "CASH",
    reference: "",
    processedBy: "Cashier 1"
  }
};
\`\`\`

### Print Test Function
\`\`\`typescript
const testPrint = () => {
  // Create a test receipt window
  const printWindow = window.open('', '_blank');
  printWindow?.document.write(`
    <html>
      <head>
        <title>Test Receipt</title>
        <style>
          ${/* Include your receipt CSS styles here */}
        </style>
      </head>
      <body>
        ${/* Include your receipt HTML here */}
      </body>
    </html>
  `);
  printWindow?.document.close();
  printWindow?.print();
};
\`\`\`

---

## Troubleshooting Common Issues

### Issue: Receipt Not Printing
**Solutions:**
1. Check printer connection and drivers
2. Verify print CSS media queries
3. Test with different browsers
4. Check thermal printer paper width settings

### Issue: Text Cutoff on Receipt
**Solutions:**
1. Adjust CSS width settings for your printer
2. Reduce font sizes if necessary
3. Check line-height and spacing
4. Test with actual printer paper width

### Issue: Incorrect Tax Calculations
**Solutions:**
1. Verify VAT rate in configuration
2. Check rounding settings
3. Validate tax calculation logic
4. Test with various order amounts

### Issue: Missing Translations
**Solutions:**
1. Add missing keys to translation files
2. Check language context implementation
3. Verify translation key usage
4. Test language switching functionality

---

This comprehensive guide should help you customize the receipt component to match your business needs perfectly. Remember to test thoroughly after making any changes, especially with your actual thermal printer setup.
