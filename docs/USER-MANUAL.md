# Platinum Lounge User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Roles and Permissions](#user-roles-and-permissions)
3. [Point of Sale (POS)](#point-of-sale-pos)
4. [Inventory Management](#inventory-management)
5. [Staff Management](#staff-management)
6. [Kitchen Management](#kitchen-management)
7. [Table Management](#table-management)
8. [Reports and Analytics](#reports-and-analytics)
9. [System Settings](#system-settings)

## Getting Started

### First Login

1. Open your web browser and navigate to the application URL
2. Use the default Super Admin credentials:
   - **Username**: admin
   - **Password**: admin123
3. **Important**: Change your password immediately after first login

### Dashboard Overview

After logging in, you'll see the main dashboard with:
- **Navigation Menu**: Access to different modules based on your role
- **Quick Stats**: Key performance indicators
- **Recent Activity**: Latest system activities
- **Language Switcher**: Toggle between English and French

### Changing Your Password

1. Click on your name in the top-right corner
2. Select "Change Password"
3. Enter your current password
4. Enter and confirm your new password
5. Click "Update Password"

## User Roles and Permissions

### Super Admin
**Full system access including:**
- All staff management functions
- System configuration and settings
- Database backups and system monitoring
- All reports and analytics
- User role management

### Manager
**Operational management access:**
- Staff management (view, add, edit)
- Inventory management
- Sales and order management
- Reports and analytics
- Table configuration

### Stock Manager
**Inventory-focused access:**
- Product management
- Stock adjustments
- Supplier management
- Inventory reports
- Low stock alerts

### Cook
**Kitchen operations:**
- Kitchen dashboard
- Order status updates
- Recipe and preparation notes
- Kitchen reports

### Waitress/Waiter
**Customer service functions:**
- POS system
- Order taking
- Table management
- Customer orders
- Basic sales reports

### Cashier
**Transaction processing:**
- POS system
- Payment processing
- Receipt printing
- Daily sales reports
- Cash management

## Point of Sale (POS)

### Accessing the POS System

1. Navigate to **Dashboard > POS** or **Sales > POS**
2. Select your dining mode (Dine In, Takeaway, Delivery)
3. Choose a table (for Dine In orders)

### Taking an Order

1. **Select Products**:
   - Browse categories or use the search function
   - Click on items to add to cart
   - Adjust quantities using +/- buttons

2. **Customize Items**:
   - Click on cart items to add special instructions
   - Modify preparation notes
   - Apply discounts if authorized

3. **Process Payment**:
   - Review order total
   - Select payment method (Cash, Card, Mobile)
   - Enter payment amount
   - Process transaction

4. **Complete Order**:
   - Print receipt
   - Send order to kitchen
   - Update table status

### Managing Orders

#### View Active Orders
- Navigate to **Sales > Orders**
- Filter by status: Pending, Preparing, Ready, Completed
- Search by order number or table

#### Modify Orders
1. Click on an order to view details
2. Add or remove items (if order not yet sent to kitchen)
3. Update special instructions
4. Save changes

#### Split Bills
1. Open the order
2. Click "Split Bill"
3. Assign items to different bills
4. Process payments separately

### Payment Processing

#### Cash Payments
1. Enter cash amount received
2. System calculates change
3. Print receipt
4. Record in cash drawer

#### Card Payments
1. Select card payment method
2. Enter card details or use card reader
3. Process authorization
4. Print receipt

#### Mobile Payments
1. Generate QR code or payment link
2. Customer scans/clicks to pay
3. Confirm payment received
4. Complete transaction

## Inventory Management

### Product Management

#### Adding New Products
1. Navigate to **Inventory > Products**
2. Click "Add Product"
3. Fill in product details:
   - Name (English and French)
   - Category
   - Price
   - Cost
   - SKU/Barcode
   - Description
4. Set stock levels and reorder points
5. Upload product image
6. Save product

#### Managing Categories
1. Go to **Inventory > Categories**
2. Create categories for organization:
   - Appetizers
   - Main Courses
   - Beverages
   - Desserts
3. Assign products to categories

#### Stock Management
1. **View Stock Levels**:
   - Navigate to **Inventory > Products**
   - Check current stock quantities
   - Monitor low stock alerts

2. **Stock Adjustments**:
   - Click on a product
   - Select "Adjust Stock"
   - Choose adjustment type:
     - Received (new stock)
     - Sold (manual sale)
     - Damaged (waste/loss)
     - Correction (count adjustment)
   - Enter quantity and reason
   - Save adjustment

3. **Stock Movements**:
   - View complete stock history
   - Track all adjustments and sales
   - Generate stock movement reports

### Supplier Management

#### Adding Suppliers
1. Navigate to **Inventory > Suppliers**
2. Click "Add Supplier"
3. Enter supplier information:
   - Company name
   - Contact person
   - Phone and email
   - Address
   - Payment terms
4. Save supplier details

#### Managing Purchase Orders
1. Create purchase orders for suppliers
2. Track delivery status
3. Update stock upon receipt
4. Manage supplier payments

### Low Stock Alerts

#### Setting Reorder Points
1. Edit product details
2. Set minimum stock level
3. Set reorder quantity
4. Enable automatic alerts

#### Monitoring Alerts
1. Navigate to **Inventory > Low Stock**
2. View products below reorder point
3. Generate purchase orders
4. Update stock levels

### Import/Export Data

#### Importing Products
1. Navigate to **Inventory > Import**
2. Download CSV template
3. Fill in product data
4. Upload completed file
5. Review and confirm import

#### Exporting Data
1. Go to any inventory list
2. Click "Export" button
3. Choose format (CSV, PDF)
4. Download generated file

## Staff Management

### Adding New Staff

1. Navigate to **Dashboard > Staff**
2. Click "Add Staff Member"
3. Fill in personal information:
   - Full name
   - Email address
   - Phone number
   - Address
4. Set employment details:
   - Role (Super Admin, Manager, Cook, etc.)
   - Department
   - Hire date
   - Salary/wage
5. Create login credentials:
   - Username
   - Temporary password
   - Force password change on first login
6. Save staff member

### Managing Staff Records

#### Editing Staff Information
1. Find staff member in the list
2. Click "Edit" button
3. Update information as needed
4. Save changes

#### Changing Staff Status
1. Open staff member details
2. Click "Change Status"
3. Select new status:
   - Active
   - Inactive
   - Suspended
   - Terminated
4. Add reason for change
5. Confirm status change

#### Resetting Passwords
1. Open staff member details
2. Click "Reset Password"
3. Generate new temporary password
4. Notify staff member of new password
5. Require password change on next login

### Activity Monitoring

#### Login/Logout Tracking
1. Navigate to **Staff > Activity Logs**
2. View login/logout times
3. Monitor work hours
4. Generate attendance reports

#### System Activity Logs
1. Track staff actions in the system
2. Monitor data changes
3. Review security events
4. Generate audit reports

### Staff Reports

#### Performance Reports
1. Navigate to **Reports > Staff**
2. Select date range
3. Choose staff member or department
4. Generate performance metrics:
   - Sales per staff member
   - Order processing times
   - Customer service ratings
   - Attendance records

#### Payroll Reports
1. Generate timesheet reports
2. Calculate hours worked
3. Export for payroll processing
4. Track overtime and breaks

## Kitchen Management

### Kitchen Dashboard

#### Accessing the Kitchen Display
1. Navigate to **Dashboard > Kitchen**
2. View incoming orders in real-time
3. Orders displayed in Kanban-style columns:
   - **New Orders**: Just received
   - **Preparing**: Currently being cooked
   - **Ready**: Completed and ready for service
   - **Served**: Delivered to customer

#### Managing Orders

1. **Accept New Orders**:
   - Review order details
   - Check ingredient availability
   - Click "Start Preparing"
   - Order moves to "Preparing" column

2. **Update Order Status**:
   - Click on order card
   - Update preparation progress
   - Add cooking notes
   - Estimate completion time

3. **Mark Orders Ready**:
   - When cooking is complete
   - Click "Mark Ready"
   - Notify service staff
   - Order moves to "Ready" column

4. **Complete Orders**:
   - When served to customer
   - Click "Mark Served"
   - Order moves to "Served" column

### Kitchen Notifications

#### Sound Alerts
- New order notification sound
- Urgent order alerts
- Order modification notifications

#### Visual Indicators
- Color-coded order priorities
- Time-based urgency indicators
- Special dietary requirement flags

### Recipe Management

#### Adding Recipes
1. Navigate to **Kitchen > Recipes**
2. Click "Add Recipe"
3. Enter recipe details:
   - Dish name
   - Ingredients list
   - Preparation steps
   - Cooking time
   - Serving size
4. Save recipe

#### Recipe Notes
- Add preparation tips
- Include allergen information
- Note dietary restrictions
- Update cooking instructions

## Table Management

### Table Configuration

#### Setting Up Tables
1. Navigate to **Sales > Tables**
2. Click "Add Table"
3. Configure table details:
   - Table number
   - Seating capacity
   - Location/section
   - Table type (Regular, VIP, Outdoor)
4. Save table configuration

#### Visual Table Layout
1. Access **Sales > Table Layout**
2. Drag and drop tables to arrange
3. Resize tables based on capacity
4. Color-code by status:
   - Green: Available
   - Red: Occupied
   - Yellow: Reserved
   - Blue: Needs cleaning

### Managing Reservations

#### Taking Reservations
1. Click on available table
2. Select "Make Reservation"
3. Enter customer details:
   - Name
   - Phone number
   - Party size
   - Date and time
4. Add special requests
5. Confirm reservation

#### Reservation Management
1. View all reservations in calendar view
2. Modify reservation details
3. Cancel or reschedule as needed
4. Send confirmation messages

### Table Operations

#### Seating Customers
1. Select available table
2. Click "Seat Customers"
3. Enter party size
4. Start new order
5. Table status changes to "Occupied"

#### Table Merging
1. Select multiple adjacent tables
2. Click "Merge Tables"
3. Combine for larger parties
4. Orders can be managed together

#### Splitting Tables
1. Select merged table
2. Click "Split Table"
3. Separate orders if needed
4. Return to individual table status

#### Cleaning and Maintenance
1. Mark table as "Needs Cleaning"
2. Assign cleaning tasks
3. Update status when complete
4. Return table to available status

## Reports and Analytics

### Dashboard Analytics

#### Key Performance Indicators (KPIs)
- Daily/weekly/monthly sales
- Average order value
- Customer count
- Top-selling products
- Staff performance metrics

#### Real-time Metrics
- Current sales figures
- Active orders
- Table occupancy
- Kitchen performance

### Sales Reports

#### Generating Sales Reports
1. Navigate to **Reports > Sales**
2. Select date range
3. Choose report type:
   - Daily sales summary
   - Product performance
   - Payment method analysis
   - Hourly sales trends
4. Apply filters as needed
5. Generate report

#### Sales Analytics
- Revenue trends over time
- Peak hours analysis
- Seasonal patterns
- Product profitability
- Customer behavior insights

### Inventory Reports

#### Stock Reports
1. Navigate to **Reports > Inventory**
2. Generate reports for:
   - Current stock levels
   - Stock movements
   - Low stock alerts
   - Supplier performance
   - Cost analysis

#### Inventory Analytics
- Stock turnover rates
- Waste and loss tracking
- Supplier comparison
- Cost optimization opportunities

### Staff Reports

#### Performance Reports
1. Navigate to **Reports > Staff**
2. Generate reports for:
   - Individual performance
   - Department productivity
   - Attendance tracking
   - Sales per employee
   - Customer service metrics

#### Attendance Reports
- Login/logout times
- Hours worked
- Break times
- Overtime tracking
- Absence patterns

### Custom Reports

#### Creating Custom Reports
1. Navigate to **Reports > Custom**
2. Select data sources
3. Choose metrics and dimensions
4. Apply filters and date ranges
5. Save report template
6. Schedule automatic generation

#### Exporting Reports
- PDF format for printing
- CSV format for data analysis
- Email delivery options
- Scheduled report generation

## System Settings

### General Settings

#### Company Information
1. Navigate to **Settings > General**
2. Update company details:
   - Restaurant name
   - Address and contact info
   - Tax information
   - Logo and branding

#### System Configuration
- Time zone settings
- Currency configuration
- Date and time formats
- Default language

### Security Settings

#### Password Policies
1. Navigate to **Settings > Security**
2. Configure password requirements:
   - Minimum length
   - Character requirements
   - Expiration period
   - History restrictions

#### Access Control
- Role-based permissions
- IP address restrictions
- Session timeout settings
- Two-factor authentication

### Backup and Maintenance

#### Database Backups
1. Navigate to **System > Backups**
2. Create manual backups
3. Schedule automatic backups
4. Restore from backup files
5. Monitor backup status

#### System Monitoring
- Performance metrics
- Error logs
- Security events
- System health checks

### Integration Settings

#### Payment Gateways
- Configure payment processors
- Set up merchant accounts
- Test payment connections
- Monitor transaction fees

#### Third-party Services
- Email service configuration
- SMS notification setup
- Accounting software integration
- Loyalty program connections

## Troubleshooting

For common issues and solutions, please refer to the [Troubleshooting Guide](TROUBLESHOOTING.md).

## Support

If you need additional help:
- Check the FAQ section
- Contact system administrator
- Submit support ticket
- Call technical support: +1 (555) 123-4567
