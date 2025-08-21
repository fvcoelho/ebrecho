# Partner Order Management E2E Tests

## Overview

This test suite provides comprehensive end-to-end testing for the Partner Order Management features in the eBrecho platform. The tests cover the complete order lifecycle from creation to delivery, including status management, customer communication, and order processing actions.

## Test Structure

### Test File
- **File**: `partner-order-management.spec.ts`
- **Route Tested**: `/pedidos` (Partner Orders Page)
- **Timeout**: 10 seconds (10000ms) as specified
- **Pattern**: Page Object Model with comprehensive test coverage

### Test Configuration

```typescript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  partnerCredentials: {
    email: 'fvcoelho@me.com',
    password: 'senha123'
  },
  timeout: 10000 // 10 seconds as specified
};
```

## Test Data

### Partner Credentials
- **Email**: fvcoelho@me.com
- **Password**: senha123
- **Partner Name**: FABIO VARGAS COELHO
- **Role**: PARTNER_ADMIN

### Order Status Flow
The tests cover the complete order status workflow:
1. **PENDING** → Initial order state
2. **CONFIRMED** → Order confirmed by partner
3. **PROCESSING** → Order being prepared
4. **SHIPPED** → Order shipped with tracking
5. **DELIVERED** → Order delivered to customer
6. **CANCELLED** → Order cancelled (from any previous state)
7. **REFUNDED** → Order refunded after delivery

### Mock Data
- Customer information (João Silva)
- Sample shipping addresses
- Payment method variations (PIX, Credit Card, etc.)
- Product variations with different categories

## Page Object Models

### 1. LoginHelper
Handles partner authentication before each test.

**Methods**:
- `loginAsPartner()`: Logs in using partner credentials

### 2. OrdersListPage
Manages the main orders listing page interactions.

**Key Elements**:
- Header and navigation
- Statistics cards (total, pending, delivered, revenue)
- Search and filter controls
- Orders table
- Pagination controls

**Methods**:
- `goto()`: Navigate to orders page
- `searchOrders(query)`: Search orders by various criteria
- `filterByStatus(status)`: Filter orders by status
- `refreshOrders()`: Refresh the orders list
- `getOrderStats()`: Get current order statistics

### 3. OrderDetailsPage
Handles order detail modal interactions.

**Key Elements**:
- Order information display
- Customer details
- Product information
- Shipping address
- Payment details
- Status management controls

**Methods**:
- `waitForModal()`: Wait for modal to open
- `getOrderDetails()`: Extract order information
- `updateOrderStatus(status)`: Change order status
- `addTrackingNumber(number)`: Add tracking information
- `addOrderNote(note)`: Add internal notes
- `printOrder()`: Print order details
- `contactCustomer()`: Contact customer via WhatsApp/Email

### 4. OrderCancellationHelper
Manages order cancellation workflows.

**Methods**:
- `cancelOrder(id, reason)`: Cancel order with reason
- `verifyOrderCancelled(orderCode)`: Verify cancellation completed

### 5. MockDataHelper
Generates test data for orders.

**Methods**:
- `generateOrderCode()`: Create unique order codes
- `generateTestOrder(status)`: Create mock order data

## Test Suites

### 1. Orders List Page
- **Page Loading**: Verify all elements load correctly
- **Statistics**: Test order statistics display
- **Search**: Test search by customer, order number, product
- **Filtering**: Test status filtering and date ranges
- **Refresh**: Test data refresh functionality

### 2. Order Details View
- **Modal Opening**: Test order details modal
- **Customer Information**: Verify customer data display
- **Product Information**: Test product details and quantities
- **Order Information**: Test order totals and dates

### 3. Order Status Management
- **Status Workflow**: Test complete status transitions
- **Validation Rules**: Test invalid status transitions
- **Tracking Information**: Test tracking code management
- **Notifications**: Test customer notifications

### 4. Order Processing Actions
- **Notes**: Test adding internal notes
- **Customer Contact**: Test WhatsApp and email integration
- **Printing**: Test order printing functionality
- **Shipping Labels**: Test label generation

### 5. Order Cancellation
- **Cancellation Process**: Test order cancellation with reasons
- **Inventory Updates**: Verify product status changes
- **Notifications**: Test cancellation notifications

### 6. Filtering and Pagination
- **Date Range Filtering**: Test date-based filtering
- **Pagination**: Test page navigation
- **Sorting**: Test column sorting
- **Combined Filters**: Test multiple filter combinations

### 7. Integration and Workflow Tests
- **Complete Lifecycle**: Test full order process
- **Data Consistency**: Test data integrity across operations
- **Concurrent Operations**: Test multiple simultaneous actions

### 8. Error Handling and Edge Cases
- **Empty States**: Test no orders scenarios
- **Network Errors**: Test error handling
- **Form Validation**: Test input validation
- **Invalid Operations**: Test error scenarios

## Key Features Tested

### Order Management
- ✅ Order listing with pagination
- ✅ Order search and filtering
- ✅ Order status management
- ✅ Order details viewing
- ✅ Order cancellation
- ✅ Order notes and tracking

### Customer Communication
- ✅ Email customer functionality
- ✅ WhatsApp integration
- ✅ Status update notifications
- ✅ Customer information display

### Inventory Integration
- ✅ Product status updates on order changes
- ✅ Inventory restoration on cancellation
- ✅ Product availability tracking

### Business Intelligence
- ✅ Order statistics and metrics
- ✅ Revenue tracking
- ✅ Status distribution
- ✅ Performance indicators

### User Experience
- ✅ Responsive design testing
- ✅ Loading states and feedback
- ✅ Error handling and recovery
- ✅ Form validation and UX

## Data Testids

The tests use data-testid attributes for reliable element selection:

### Page Elements
- `orders-page-title`: Main page heading
- `orders-page-description`: Page description
- `refresh-orders-button`: Refresh button
- `orders-table`: Main orders table
- `no-orders-message`: Empty state message

### Statistics Cards
- `total-orders-card`: Total orders card
- `pending-orders-card`: Pending orders card
- `delivered-orders-card`: Delivered orders card
- `revenue-card`: Revenue card

### Search and Filters
- `orders-search-input`: Search input field
- `orders-status-filter`: Status filter dropdown
- `apply-filters-button`: Apply filters button

### Order Rows and Actions
- `order-row-{orderNumber}`: Individual order rows
- `order-status-{status}`: Status badges
- `view-order-{orderNumber}`: View order button
- `edit-order-{orderNumber}`: Edit order button

### Modals and Forms
- `order-details-modal`: Order details modal
- `order-edit-modal`: Order edit modal
- `order-status-select`: Status selection dropdown
- `tracking-code-input`: Tracking code input
- `order-note-textarea`: Notes textarea
- `cancel-order-button`: Cancel order button

## Running the Tests

### Prerequisites
1. Next.js development server running on localhost:3000
2. API server running with partner data
3. Test partner account configured
4. Products and orders data available

### Execution Commands

```bash
# Run all partner order management tests
npx playwright test partner-order-management.spec.ts

# Run with UI mode for debugging
npx playwright test partner-order-management.spec.ts --ui

# Run specific test suite
npx playwright test partner-order-management.spec.ts --grep "Order Status Management"

# Run with headed browser
npx playwright test partner-order-management.spec.ts --headed

# Generate test report
npx playwright test partner-order-management.spec.ts --reporter=html
```

### Debugging Commands

```bash
# Run with debug mode
npx playwright test partner-order-management.spec.ts --debug

# Record test for debugging
npx playwright codegen localhost:3000/pedidos

# View test traces
npx playwright show-trace test-results/trace.zip
```

## Test Data Requirements

### Database Setup
For comprehensive testing, ensure the following data exists:

1. **Partner Account**:
   - Email: fvcoelho@me.com
   - Name: FABIO VARGAS COELHO
   - Role: PARTNER_ADMIN
   - Active partner setup

2. **Products**:
   - Multiple products with different statuses
   - Various categories and price ranges
   - Some with images and complete details

3. **Orders**:
   - Orders in different statuses
   - Orders from different time periods
   - Orders with various payment methods
   - Orders with customer information

4. **Customers**:
   - Customer accounts with valid email addresses
   - Customers with phone numbers for WhatsApp testing
   - Various shipping addresses

### Environment Variables

```env
# Next.js Application
NEXT_PUBLIC_API_URL="http://localhost:3001/api"

# API Configuration
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
```

## Expected Outcomes

### Success Criteria
- All tests pass consistently
- No memory leaks or performance issues
- Screenshots capture key test steps
- Error handling works as expected
- User flows complete end-to-end

### Performance Targets
- Page load times under 3 seconds
- API responses under 1 second
- Modal opening under 500ms
- Form submissions under 2 seconds

### Coverage Goals
- 100% of order management features
- 100% of status transition workflows
- 95% of error scenarios
- 90% of edge cases

## Troubleshooting

### Common Issues

1. **Login Failures**:
   - Verify partner credentials are correct
   - Check API server is running
   - Confirm database has partner data

2. **Element Not Found**:
   - Verify data-testid attributes are present
   - Check page load timing
   - Confirm element selectors match UI

3. **API Timeouts**:
   - Increase test timeouts if needed
   - Check API server performance
   - Verify database connectivity

4. **Data Inconsistencies**:
   - Reset test data between runs
   - Check for database transaction issues
   - Verify optimistic updates work correctly

### Debug Strategies

1. **Add Screenshots**: Use `page.screenshot()` at failure points
2. **Console Logging**: Add detailed logging for state changes
3. **Step-by-Step**: Break complex tests into smaller parts
4. **Wait Strategies**: Use proper waits for async operations
5. **Mock Data**: Create consistent test data for reproducible results

## Maintenance

### Regular Updates Needed
- Update selectors when UI changes
- Modify test data when business rules change
- Update status workflows for new features
- Refresh mock data for realistic testing

### Performance Monitoring
- Track test execution times
- Monitor memory usage during tests
- Check for flaky test patterns
- Analyze failure rates and causes

This comprehensive test suite ensures the Partner Order Management system works reliably and provides a great user experience for partners managing their eBrecho orders.