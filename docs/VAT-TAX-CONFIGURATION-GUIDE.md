# VAT and Tax Configuration Guide
## Complete Guide for Tax System Customization

This guide provides comprehensive instructions for configuring the Value Added Tax (VAT) and other tax systems in the Platinum Lounge Management System to comply with your local tax regulations.

---

## Table of Contents

1. [Current Tax Configuration](#current-tax-configuration)
2. [Single VAT Rate Configuration](#single-vat-rate-configuration)
3. [Multiple Tax Rates System](#multiple-tax-rates-system)
4. [Tax-Exempt Products](#tax-exempt-products)
5. [Inclusive vs Exclusive Tax](#inclusive-vs-exclusive-tax)
6. [Regional Tax Configurations](#regional-tax-configurations)
7. [Tax Display and Reporting](#tax-display-and-reporting)
8. [Compliance and Documentation](#compliance-and-documentation)
9. [Testing Tax Calculations](#testing-tax-calculations)

---

## 1. Current Tax Configuration

### Current Implementation
The system is currently configured for Cameroon with a VAT rate of 19.25%.

**Files affected:**
- `components/sales/order-form.tsx`
- `components/pos/pos-interface.tsx`
- `components/payments/payment-processing.tsx`

**Current calculation:**
\`\`\`typescript
const tax = subtotal * 0.1925; // 19.25% VAT for Cameroon
\`\`\`

---

## 2. Single VAT Rate Configuration

### Step 1: Create Tax Configuration File
**File**: `lib/tax-config.ts`

\`\`\`typescript
export interface TaxConfig {
  vatRate: number;
  vatName: string;
  vatDisplayName: string;
  vatNumber?: string;
  currency: string;
  includedInPrice: boolean;
  roundingMethod: 'round' | 'floor' | 'ceil';
  decimalPlaces: number;
}

export const TAX_CONFIG: TaxConfig = {
  vatRate: 0.1925,                    // 19.25% - Change this to your rate
  vatName: "VAT",                     // Internal name
  vatDisplayName: "Value Added Tax",   // Display name
  vatNumber: "VAT-REG-123456789",     // Your VAT registration number
  currency: "XAF",                    // Currency code
  includedInPrice: false,             // Whether VAT is included in displayed prices
  roundingMethod: 'round',            // How to round tax calculations
  decimalPlaces: 0                    // Decimal places for currency (0 for XAF)
};

// Tax calculation function
export function calculateTax(subtotal: number): number {
  const tax = subtotal * TAX_CONFIG.vatRate;
  
  switch (TAX_CONFIG.roundingMethod) {
    case 'floor':
      return Math.floor(tax * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces);
    case 'ceil':
      return Math.ceil(tax * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces);
    default:
      return Math.round(tax * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces);
  }
}

// Format tax for display
export function formatTaxDisplay(): string {
  return `${TAX_CONFIG.vatDisplayName} (${(TAX_CONFIG.vatRate * 100).toFixed(2)}%)`;
}

// Get tax breakdown for receipt
export function getTaxBreakdown(subtotal: number) {
  const taxAmount = calculateTax(subtotal);
  const total = subtotal + taxAmount;
  
  return {
    subtotal,
    taxAmount,
    taxRate: TAX_CONFIG.vatRate,
    taxName: TAX_CONFIG.vatDisplayName,
    total
  };
}
\`\`\`

### Step 2: Update Order Form Component
**File**: `components/sales/order-form.tsx`

\`\`\`typescript
import { calculateTax, getTaxBreakdown } from '@/lib/tax-config';

// Replace the existing tax calculation
const calculateTotals = () => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = calculateTax(subtotal);
  const total = subtotal + tax;

  return { subtotal, tax, total };
};
\`\`\`

### Step 3: Update POS Interface
**File**: `components/pos/pos-interface.tsx`

\`\`\`typescript
import { calculateTax, formatTaxDisplay } from '@/lib/tax-config';

// Replace the existing tax calculation
const calculateTotal = () => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = calculateTax(subtotal);
  return { subtotal, tax, total: subtotal + tax };
};

// Update the display
<div className="flex justify-between text-sm">
  <span>{formatTaxDisplay()}:</span>
  <span>{tax.toLocaleString()} XAF</span>
</div>
\`\`\`

### Step 4: Update Payment Processing
**File**: `components/payments/payment-processing.tsx`

\`\`\`typescript
import { TAX_CONFIG, formatTaxDisplay } from '@/lib/tax-config';

// Update the tax display in receipt
<div className="flex justify-between">
  <span>{formatTaxDisplay()}:</span>
  <span>{order.tax.toLocaleString()} XAF</span>
</div>

{/* Add VAT registration number if available */}
{TAX_CONFIG.vatNumber && (
  <div className="text-xs text-gray-500 mt-1">
    VAT Reg: {TAX_CONFIG.vatNumber}
  </div>
)}
\`\`\`

---

## 3. Multiple Tax Rates System

For businesses that need different tax rates for different product categories:

### Enhanced Tax Configuration
**File**: `lib/tax-config.ts`

\`\`\`typescript
export interface CategoryTaxConfig {
  categoryId: string;
  categoryName: string;
  taxRate: number;
  taxName: string;
  exemptFromTax: boolean;
}

export const CATEGORY_TAX_RATES: CategoryTaxConfig[] = [
  {
    categoryId: "food",
    categoryName: "Food",
    taxRate: 0.05,        // 5% for food
    taxName: "Food Tax",
    exemptFromTax: false
  },
  {
    categoryId: "alcohol",
    categoryName: "Alcoholic Beverages",
    taxRate: 0.25,        // 25% for alcohol
    taxName: "Alcohol Tax",
    exemptFromTax: false
  },
  {
    categoryId: "soft_drinks",
    categoryName: "Soft Drinks",
    taxRate: 0.10,        // 10% for soft drinks
    taxName: "Beverage Tax",
    exemptFromTax: false
  },
  {
    categoryId: "services",
    categoryName: "Services",
    taxRate: 0.15,        // 15% for services
    taxName: "Service Tax",
    exemptFromTax: false
  }
];

export const DEFAULT_TAX_RATE = 0.1925; // Default rate for uncategorized items

export function calculateTaxByCategory(subtotal: number, categoryId: string): number {
  const categoryTax = CATEGORY_TAX_RATES.find(cat => cat.categoryId === categoryId);
  
  if (categoryTax?.exemptFromTax) {
    return 0;
  }
  
  const rate = categoryTax?.taxRate || DEFAULT_TAX_RATE;
  return subtotal * rate;
}

export function getTaxBreakdownByCategory(items: OrderItem[]): TaxBreakdown {
  const breakdown: { [key: string]: { subtotal: number; tax: number; rate: number; name: string } } = {};
  let totalSubtotal = 0;
  let totalTax = 0;
  
  items.forEach(item => {
    const categoryTax = CATEGORY_TAX_RATES.find(cat => cat.categoryId === item.categoryId);
    const rate = categoryTax?.taxRate || DEFAULT_TAX_RATE;
    const taxName = categoryTax?.taxName || "VAT";
    
    if (!categoryTax?.exemptFromTax) {
      const itemTax = item.totalPrice * rate;
      
      if (!breakdown[taxName]) {
        breakdown[taxName] = { subtotal: 0, tax: 0, rate, name: taxName };
      }
      
      breakdown[taxName].subtotal += item.totalPrice;
      breakdown[taxName].tax += itemTax;
      totalTax += itemTax;
    }
    
    totalSubtotal += item.totalPrice;
  });
  
  return {
    totalSubtotal,
    totalTax,
    total: totalSubtotal + totalTax,
    breakdown
  };
}
\`\`\`

### Update Order Processing for Multiple Tax Rates
**File**: `components/sales/order-form.tsx`

\`\`\`typescript
import { getTaxBreakdownByCategory } from '@/lib/tax-config';

const calculateTotals = () => {
  const taxBreakdown = getTaxBreakdownByCategory(orderItems);
  
  return {
    subtotal: taxBreakdown.totalSubtotal,
    tax: taxBreakdown.totalTax,
    total: taxBreakdown.total,
    taxBreakdown: taxBreakdown.breakdown
  };
};

// Display multiple tax rates in UI
<div className="space-y-1">
  <div className="flex justify-between">
    <span>Subtotal:</span>
    <span>{subtotal.toLocaleString()} XAF</span>
  </div>
  
  {/* Display each tax category */}
  {Object.entries(taxBreakdown).map(([taxName, details]) => (
    <div key={taxName} className="flex justify-between text-sm">
      <span>{taxName} ({(details.rate * 100).toFixed(1)}%):</span>
      <span>{details.tax.toLocaleString()} XAF</span>
    </div>
  ))}
  
  <div className="flex justify-between font-bold text-lg border-t pt-2">
    <span>Total:</span>
    <span>{total.toLocaleString()} XAF</span>
  </div>
</div>
\`\`\`

---

## 4. Tax-Exempt Products

### Configuration for Tax Exemptions
**File**: `lib/tax-config.ts`

\`\`\`typescript
export const TAX_EXEMPT_CATEGORIES = [
  "medical_supplies",
  "educational_materials", 
  "basic_food_items",
  "children_items"
];

export const TAX_EXEMPT_PRODUCTS = [
  "water",
  "bread", 
  "milk",
  "medicine"
];

export function isProductTaxExempt(productId: string, categoryId: string): boolean {
  return TAX_EXEMPT_CATEGORIES.includes(categoryId) || 
         TAX_EXEMPT_PRODUCTS.includes(productId);
}

export function calculateTaxWithExemptions(items: OrderItem[]): TaxCalculation {
  let taxableAmount = 0;
  let exemptAmount = 0;
  
  items.forEach(item => {
    if (isProductTaxExempt(item.productId, item.categoryId)) {
      exemptAmount += item.totalPrice;
    } else {
      taxableAmount += item.totalPrice;
    }
  });
  
  const tax = calculateTax(taxableAmount);
  
  return {
    subtotal: taxableAmount + exemptAmount,
    taxableAmount,
    exemptAmount,
    tax,
    total: taxableAmount + exemptAmount + tax
  };
}
\`\`\`

---

## 5. Inclusive vs Exclusive Tax

### Tax-Inclusive Pricing Configuration
**File**: `lib/tax-config.ts`

\`\`\`typescript
export const TAX_CONFIG = {
  // ... other config
  includedInPrice: true, // Set to true for tax-inclusive pricing
};

export function calculateInclusiveTax(priceIncludingTax: number): { priceExcludingTax: number; taxAmount: number } {
  const priceExcludingTax = priceIncludingTax / (1 + TAX_CONFIG.vatRate);
  const taxAmount = priceIncludingTax - priceExcludingTax;
  
  return {
    priceExcludingTax: Math.round(priceExcludingTax * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces),
    taxAmount: Math.round(taxAmount * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces)
  };
}

export function calculateExclusiveTax(priceExcludingTax: number): { priceIncludingTax: number; taxAmount: number } {
  const taxAmount = priceExcludingTax * TAX_CONFIG.vatRate;
  const priceIncludingTax = priceExcludingTax + taxAmount;
  
  return {
    priceIncludingTax: Math.round(priceIncludingTax * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces),
    taxAmount: Math.round(taxAmount * Math.pow(10, TAX_CONFIG.decimalPlaces)) / Math.pow(10, TAX_CONFIG.decimalPlaces)
  };
}

export function getOrderTotals(items: OrderItem[]): OrderTotals {
  if (TAX_CONFIG.includedInPrice) {
    // Tax is included in product prices
    let totalIncludingTax = 0;
    let totalTax = 0;
    
    items.forEach(item => {
      totalIncludingTax += item.totalPrice;
      const { taxAmount } = calculateInclusiveTax(item.totalPrice);
      totalTax += taxAmount;
    });
    
    return {
      subtotal: totalIncludingTax - totalTax,
      tax: totalTax,
      total: totalIncludingTax,
      displayNote: "Tax included in prices"
    };
  } else {
    // Tax is added to product prices
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = calculateTax(subtotal);
    
    return {
      subtotal,
      tax,
      total: subtotal + tax,
      displayNote: "Tax added to prices"
    };
  }
}
\`\`\`

### Update Product Display for Tax-Inclusive Pricing
**File**: `components/pos/pos-interface.tsx`

\`\`\`typescript
import { TAX_CONFIG, calculateInclusiveTax } from '@/lib/tax-config';

// Update product card display
<Card className="cursor-pointer hover:shadow-lg transition-shadow">
  <CardContent className="p-3">
    <h3 className="font-medium text-sm mb-1">{product.nameEn}</h3>
    <div className="flex justify-between items-center">
      <div>
        <span className="font-bold text-green-600">
          {product.price.toLocaleString()} XAF
        </span>
        {TAX_CONFIG.includedInPrice && (
          <div className="text-xs text-gray-500">
            (incl. {formatTaxDisplay()})
          </div>
        )}
      </div>
      <Badge variant="outline" className="text-xs">
        Stock: {product.stockQuantity}
      </Badge>
    </div>
  </CardContent>
</Card>
\`\`\`

---

## 6. Regional Tax Configurations

### Cameroon Configuration (Current)
\`\`\`typescript
export const CAMEROON_TAX_CONFIG: TaxConfig = {
  vatRate: 0.1925,
  vatName: "TVA",
  vatDisplayName: "Taxe sur la Valeur Ajoutée",
  vatNumber: "TVA-CM-123456789",
  currency: "XAF",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 0
};
\`\`\`

### Nigeria Configuration
\`\`\`typescript
export const NIGERIA_TAX_CONFIG: TaxConfig = {
  vatRate: 0.075,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-NG-123456789",
  currency: "NGN",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

### Ghana Configuration
\`\`\`typescript
export const GHANA_TAX_CONFIG: TaxConfig = {
  vatRate: 0.125,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-GH-123456789",
  currency: "GHS",
  includedInPrice: true,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

### Kenya Configuration
\`\`\`typescript
export const KENYA_TAX_CONFIG: TaxConfig = {
  vatRate: 0.16,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-KE-123456789",
  currency: "KES",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

### South Africa Configuration
\`\`\`typescript
export const SOUTH_AFRICA_TAX_CONFIG: TaxConfig = {
  vatRate: 0.15,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-ZA-123456789",
  currency: "ZAR",
  includedInPrice: true,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

### European Union Configuration
\`\`\`typescript
export const EU_TAX_CONFIG: TaxConfig = {
  vatRate: 0.20, // Standard rate (varies by country)
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-EU-123456789",
  currency: "EUR",
  includedInPrice: true,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

### United States Configuration
\`\`\`typescript
export const US_TAX_CONFIG: TaxConfig = {
  vatRate: 0.08, // Sales tax (varies by state)
  vatName: "Sales Tax",
  vatDisplayName: "Sales Tax",
  vatNumber: "TAX-US-123456789",
  currency: "USD",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

---

## 7. Tax Display and Reporting

### Enhanced Receipt Tax Display
**File**: `components/payments/payment-processing.tsx`

\`\`\`typescript
import { TAX_CONFIG, getTaxBreakdown } from '@/lib/tax-config';

// Enhanced tax section in receipt
<div className="border-t pt-3 space-y-2">
  <div className="flex justify-between text-sm">
    <span>Subtotal:</span>
    <span>{order.subtotal.toLocaleString()} {TAX_CONFIG.currency}</span>
  </div>
  
  {/* Tax breakdown */}
  {order.taxBreakdown ? (
    // Multiple tax rates
    Object.entries(order.taxBreakdown).map(([taxName, details]) => (
      <div key={taxName} className="flex justify-between text-sm">
        <span>{taxName} ({(details.rate * 100).toFixed(1)}%):</span>
        <span>{details.tax.toLocaleString()} {TAX_CONFIG.currency}</span>
      </div>
    ))
  ) : (
    // Single tax rate
    <div className="flex justify-between text-sm">
      <span>{TAX_CONFIG.vatDisplayName} ({(TAX_CONFIG.vatRate * 100).toFixed(2)}%):</span>
      <span>{order.tax.toLocaleString()} {TAX_CONFIG.currency}</span>
    </div>
  )}
  
  {/* Tax registration number */}
  {TAX_CONFIG.vatNumber && (
    <div className="text-xs text-gray-500">
      Tax Reg: {TAX_CONFIG.vatNumber}
    </div>
  )}
  
  {/* Tax inclusive note */}
  {TAX_CONFIG.includedInPrice && (
    <div className="text-xs text-gray-500 italic">
      * Prices include applicable taxes
    </div>
  )}
  
  <div className="flex justify-between font-bold text-lg border-t pt-2">
    <span>TOTAL:</span>
    <span>{order.total.toLocaleString()} {TAX_CONFIG.currency}</span>
  </div>
</div>
\`\`\`

### Tax Reporting Component
**File**: `components/reports/tax-reports.tsx`

\`\`\`typescript
"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TAX_CONFIG } from '@/lib/tax-config';

interface TaxReport {
  period: string;
  totalSales: number;
  taxableAmount: number;
  exemptAmount: number;
  totalTax: number;
  taxByCategory: { [key: string]: number };
}

export function TaxReports() {
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const generateTaxReport = async () => {
    try {
      const response = await fetch(`/api/reports/tax?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (response.ok) {
        const data = await response.json();
        setTaxReport(data);
      }
    } catch (error) {
      console.error('Error generating tax report:', error);
    }
  };

  const exportTaxReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/reports/tax/export?format=${format}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tax-report-${dateRange.startDate}-to-${dateRange.endDate}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting tax report:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="flex space-x-2 mb-4">
            <Button onClick={generateTaxReport}>Generate Report</Button>
            <Button variant="outline" onClick={() => exportTaxReport('csv')}>Export CSV</Button>
            <Button variant="outline" onClick={() => exportTaxReport('pdf')}>Export PDF</Button>
          </div>

          {taxReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-medium text-blue-800">Total Sales</h3>
                  <p className="text-2xl font-bold text-blue-900">
                    {taxReport.totalSales.toLocaleString()} {TAX_CONFIG.currency}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-medium text-green-800">Taxable Amount</h3>
                  <p className="text-2xl font-bold text-green-900">
                    {taxReport.taxableAmount.toLocaleString()} {TAX_CONFIG.currency}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-medium text-yellow-800">Tax Collected</h3>
                  <p className="text-2xl font-bold text-yellow-900">
                    {taxReport.totalTax.toLocaleString()} {TAX_CONFIG.currency}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium text-gray-800">Exempt Amount</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {taxReport.exemptAmount.toLocaleString()} {TAX_CONFIG.currency}
                  </p>
                </div>
              </div>

              <div className="bg-white border rounded p-4">
                <h3 className="font-medium mb-3">Tax by Category</h3>
                <div className="space-y-2">
                  {Object.entries(taxReport.taxByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between">
                      <span>{category}:</span>
                      <span className="font-medium">{amount.toLocaleString()} {TAX_CONFIG.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
\`\`\`

---

## 8. Compliance and Documentation

### Tax Compliance Checklist

#### ✅ Legal Requirements
- [ ] VAT rate matches current legal requirements
- [ ] VAT registration number is valid and current
- [ ] Tax calculations comply with local rounding rules
- [ ] Receipt format meets legal requirements
- [ ] Tax reporting capabilities meet audit requirements

#### ✅ Documentation Requirements
- [ ] Tax calculation methods are documented
- [ ] VAT registration certificate is available
- [ ] Tax exemption certificates (if applicable)
- [ ] Audit trail for all tax calculations
- [ ] Regular tax report generation and storage

### Tax Audit Trail
**File**: `lib/tax-audit.ts`

\`\`\`typescript
export interface TaxAuditEntry {
  transactionId: string;
  orderId: string;
  timestamp: Date;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxMethod: string;
  exemptions: string[];
  calculationDetails: any;
}

export async function logTaxCalculation(entry: TaxAuditEntry) {
  try {
    await fetch('/api/audit/tax', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
  } catch (error) {
    console.error('Failed to log tax calculation:', error);
  }
}

export function generateTaxAuditReport(startDate: Date, endDate: Date) {
  // Implementation for generating comprehensive tax audit reports
  return fetch(`/api/audit/tax/report?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
}
\`\`\`

---

## 9. Testing Tax Calculations

### Tax Calculation Test Suite
**File**: `tests/tax-calculations.test.ts`

\`\`\`typescript
import { calculateTax, calculateInclusiveTax, calculateExclusiveTax, TAX_CONFIG } from '@/lib/tax-config';

describe('Tax Calculations', () => {
  beforeEach(() => {
    // Reset tax config for testing
    TAX_CONFIG.vatRate = 0.1925;
    TAX_CONFIG.includedInPrice = false;
    TAX_CONFIG.roundingMethod = 'round';
    TAX_CONFIG.decimalPlaces = 0;
  });

  test('calculates exclusive tax correctly', () => {
    const subtotal = 10000; // 10,000 XAF
    const expectedTax = 1925; // 19.25% of 10,000
    const calculatedTax = calculateTax(subtotal);
    
    expect(calculatedTax).toBe(expectedTax);
  });

  test('calculates inclusive tax correctly', () => {
    const priceIncludingTax = 11925; // 11,925 XAF
    const result = calculateInclusiveTax(priceIncludingTax);
    
    expect(result.priceExcludingTax).toBe(10000);
    expect(result.taxAmount).toBe(1925);
  });

  test('handles rounding correctly', () => {
    TAX_CONFIG.roundingMethod = 'floor';
    const subtotal = 10001; // Should result in 1925.1925
    const calculatedTax = calculateTax(subtotal);
    
    expect(calculatedTax).toBe(1925); // Floored
  });

  test('handles zero tax for exempt items', () => {
    const subtotal = 5000;
    const tax = calculateTaxWithExemptions([
      { productId: 'water', categoryId: 'basic_food_items', totalPrice: subtotal }
    ]);
    
    expect(tax.tax).toBe(0);
    expect(tax.exemptAmount).toBe(subtotal);
  });

  test('calculates multiple tax rates correctly', () => {
    const items = [
      { categoryId: 'food', totalPrice: 5000 },
      { categoryId: 'alcohol', totalPrice: 10000 }
    ];
    
    const breakdown = getTaxBreakdownByCategory(items);
    
    expect(breakdown.totalSubtotal).toBe(15000);
    expect(breakdown.totalTax).toBeGreaterThan(0);
  });
});
\`\`\`

### Manual Testing Scenarios

#### Test Case 1: Basic Tax Calculation
- **Input**: Order with subtotal of 10,000 XAF
- **Expected**: Tax of 1,925 XAF, Total of 11,925 XAF
- **Verify**: Receipt shows correct breakdown

#### Test Case 2: Tax-Inclusive Pricing
- **Setup**: Set `includedInPrice: true`
- **Input**: Product priced at 11,925 XAF
- **Expected**: Subtotal of 10,000 XAF, Tax of 1,925 XAF shown separately
- **Verify**: Receipt indicates "Tax included in prices"

#### Test Case 3: Multiple Tax Rates
- **Input**: Order with food (5% tax) and alcohol (25% tax)
- **Expected**: Separate tax lines for each category
- **Verify**: Receipt shows breakdown by tax type

#### Test Case 4: Tax Exemptions
- **Input**: Order with exempt and taxable items
- **Expected**: Tax only applied to taxable items
- **Verify**: Receipt shows exempt amount separately

#### Test Case 5: Rounding Edge Cases
- **Input**: Amounts that result in fractional tax
- **Expected**: Proper rounding according to configuration
- **Verify**: No rounding errors in totals

### Performance Testing
\`\`\`typescript
// Test tax calculation performance
function performanceTest() {
  const startTime = performance.now();
  
  for (let i = 0; i < 10000; i++) {
    calculateTax(Math.random() * 100000);
  }
  
  const endTime = performance.now();
  console.log(`Tax calculation performance: ${endTime - startTime}ms for 10,000 calculations`);
}
\`\`\`

---

## Quick Configuration Examples

### For Different Countries

#### Nigeria (7.5% VAT)
\`\`\`typescript
export const TAX_CONFIG = {
  vatRate: 0.075,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-NG-123456789",
  currency: "NGN",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

#### Ghana (12.5% VAT)
\`\`\`typescript
export const TAX_CONFIG = {
  vatRate: 0.125,
  vatName: "VAT", 
  vatDisplayName: "Value Added Tax",
  vatNumber: "VAT-GH-123456789",
  currency: "GHS",
  includedInPrice: true,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

#### Kenya (16% VAT)
\`\`\`typescript
export const TAX_CONFIG = {
  vatRate: 0.16,
  vatName: "VAT",
  vatDisplayName: "Value Added Tax", 
  vatNumber: "VAT-KE-123456789",
  currency: "KES",
  includedInPrice: false,
  roundingMethod: 'round',
  decimalPlaces: 2
};
\`\`\`

---

This comprehensive guide should help you configure the tax system to meet your specific business and legal requirements. Remember to consult with local tax authorities or accountants to ensure full compliance with your jurisdiction's tax laws.
