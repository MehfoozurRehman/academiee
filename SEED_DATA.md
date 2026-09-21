# Seeding Sample Data

The app includes a built-in seeding feature to quickly populate your academy with sample data for testing and development.

## What Gets Created

When you seed data, the system creates:

- **4 Courses**: Mathematics, English, Physics, Chemistry
- **12 Batches**: 3 batches per course
- **5 Teachers**: With names and phone numbers
- **12 Students**: Distributed across batches with:
  - Full names and father names
  - Phone numbers
  - Monthly fee: PKR 5,000 each
- **12 Fees**: For the current month with mixed payment statuses:
  - 3 Paid fees (with payment methods and dates)
  - 3 Partially paid fees
  - 3 Due fees
  - 3 Overdue fees

## How to Use

### Option 1: Via the App UI

1. **Open the app** and sign in to your academy
2. **Navigate to More tab** (bottom navigation)
3. **Scroll to "Tools" section**
4. **Tap "Seed Sample Data"**
5. **Click "Create Sample Data"** button
6. Wait for the confirmation alert showing how many items were created

### Option 2: Direct URL Navigation

1. **Sign in to the app** at http://localhost:8081
2. **Navigate directly to** http://localhost:8081/seed
3. **Click "Create Sample Data"**

## What to Test

After seeding, you can test:

### Fees Page
- ✅ View all fees with different statuses (Paid, Partial, Due, Overdue)
- ✅ Click unpaid fees to record additional payments
- ✅ Click paid fees to reverse/refund payments
- ✅ Filter by payment status
- ✅ See collected and outstanding amounts

### Students Page
- ✅ View all 12 students
- ✅ View student details and their fees
- ✅ Delete students and verify fees are also deleted

### Courses, Batches, Teachers
- ✅ View all created courses and batches
- ✅ View all teachers

## Resetting Data

To reset and start fresh:

1. Delete your current academy from settings
2. Create a new academy
3. Run seed data again

Or manually delete individual records from the Recycle Bin.

## Notes

- Seeds are created for the **current month**
- All amounts are in **PKR** (Pakistani Rupees)
- Students are created as **active** status
- Fees have realistic distribution of payment statuses for testing
