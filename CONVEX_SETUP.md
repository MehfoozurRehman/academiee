# Academy OS - Convex Database Setup Guide

## Database Schema Overview

The Convex database is configured for a **multi-tenant Academy Management System** where each academy owner can sign up, create their own academy, and manage:

- **Students** - Track enrollment, attendance, fees
- **Teachers** - Manage staff information and salaries
- **Batches** - Organize classes with capacity tracking
- **Courses** - Course catalog management
- **Fees** - Fee collection and payment tracking
- **Attendance** - Daily attendance records
- **Expenses** - Academy operational expenses
- **WhatsApp Logs** - Communication tracking (optional)
- **Users** - Authentication for academy owners

## Project Structure

```
/convex
├── schema.ts          # Database schema definition
├── auth.ts            # Authentication functions (signup, login)
├── academies.ts       # Academy management (create, update, stats)
├── students.ts        # Student CRUD operations
├── teachers.ts        # Teacher CRUD operations
├── batches.ts         # Batch/Class CRUD operations
├── courses.ts         # Course CRUD operations
├── fees.ts            # Fee tracking and payments
├── attendance.ts      # Attendance management
├── expenses.ts        # Expense tracking
└── _generated/        # Auto-generated Convex SDK (don't edit)
```

## Installation Steps

### 1. Install Dependencies
```bash
cd /Users/devscot/Documents/github/academiee
pnpm add convex
```

### 2. Initialize Convex Project
```bash
npx convex init
```

Follow the prompts to:
- Create a Convex account (if you don't have one)
- Create a new project
- Choose your deployment region

### 3. Deploy Schema to Convex
```bash
npx convex deploy
```

## API Functions Reference

### Authentication (`auth.ts`)
- `signup(email, password, name, phone)` - Register new academy owner
- `login(email, password)` - Authenticate user
- `getCurrentUser(userId)` - Get user profile

### Academy Management (`academies.ts`)
- `createAcademy(userId, details)` - Create new academy
- `getAcademy(userId)` - Get academy details
- `updateAcademy(academyId, updates)` - Update settings
- `getAcademyStats(academyId)` - Get dashboard statistics

### Students (`students.ts`)
- `createStudent(academyId, batchId, details)` - Add student
- `getStudents(academyId, filters)` - List students
- `getStudent(studentId)` - Get student details
- `updateStudent(studentId, updates)` - Update student info
- `deleteStudent(studentId)` - Remove student

### Teachers (`teachers.ts`)
- `createTeacher(academyId, details)` - Add teacher
- `getTeachers(academyId, status)` - List teachers
- `getTeacher(teacherId)` - Get teacher details
- `updateTeacher(teacherId, updates)` - Update teacher info
- `deleteTeacher(teacherId)` - Remove teacher

### Batches (`batches.ts`)
- `createBatch(academyId, courseId, teacherId, details)` - Create class batch
- `getBatches(academyId, status)` - List batches
- `getBatch(batchId)` - Get batch details
- `updateBatch(batchId, updates)` - Update batch
- `deleteBatch(batchId)` - Delete batch

### Courses (`courses.ts`)
- `createCourse(academyId, details)` - Add course
- `getCourses(academyId, status)` - List courses
- `getCourse(courseId)` - Get course details
- `updateCourse(courseId, updates)` - Update course
- `deleteCourse(courseId)` - Delete course

### Fees (`fees.ts`)
- `createFee(academyId, studentId, details)` - Create fee record
- `recordPayment(feeId, amountPaid, method)` - Record payment
- `getStudentFees(studentId, status)` - Get student fee history
- `getAcademyFees(academyId, filters)` - Get all fees
- `getMonthlyFeeSummary(academyId, month)` - Fee statistics

### Attendance (`attendance.ts`)
- `recordAttendance(academyId, studentId, batchId, date, status)` - Mark attendance
- `getStudentAttendance(studentId, dates)` - Get student attendance
- `getBatchAttendance(batchId, date)` - Get batch attendance for date
- `getStudentAttendanceStats(studentId)` - Attendance summary
- `updateAttendance(attendanceId, status)` - Modify attendance

### Expenses (`expenses.ts`)
- `createExpense(academyId, details)` - Record expense
- `getExpenses(academyId, filters)` - List expenses
- `getExpensesSummary(academyId, dates)` - Expense statistics
- `updateExpense(expenseId, updates)` - Update expense
- `deleteExpense(expenseId)` - Delete expense

## Using Convex in React Native / Expo

### Install Convex React Hooks
```bash
pnpm add convex react
```

### Setup Convex Provider in App
```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CONVEX_URL } from "@env";

const convex = new ConvexReactClient(CONVEX_URL);

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <YourAppContent />
    </ConvexProvider>
  );
}
```

### Use Convex in Components
```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function LoginScreen() {
  const login = useMutation(api.auth.login);

  const handleLogin = async (email: string, password: string) => {
    const user = await login({ email, password });
    // Navigate to dashboard
  };

  return (
    // Your UI here
  );
}
```

## Important Notes

⚠️ **Security Considerations:**
- Hash passwords in production (use bcrypt)
- Use JWT tokens for session management
- Implement proper access control (users can only see their academy data)
- Never expose Convex credentials in client code
- Use environment variables for sensitive data

📝 **Database Queries:**
- All queries are indexed for performance
- Indexes are created on commonly filtered fields
- Use pagination for large datasets
- Query costs depend on document size and index usage

💰 **Convex Pricing:**
- Free tier: 1M monthly document reads/writes
- Paid plans: Pay per read/write operations
- Monitor usage in Convex dashboard

## Next Steps

1. Configure environment variables:
   ```bash
   # .env.local
   CONVEX_DEPLOYMENT=<your-deployment-id>
   CONVEX_URL=<your-convex-url>
   ```

2. Test API functions in Convex dashboard

3. Connect React Native/Expo frontend with ConvexProvider

4. Implement authentication flow in mobile app

## Troubleshooting

**Issue: Schema deployment fails**
- Check if `.env` has correct `CONVEX_DEPLOYMENT`
- Run `npx convex dev` first to sync locally

**Issue: Queries return empty results**
- Verify academy/user IDs are correct
- Check index names in schema
- Ensure data exists in Convex dashboard

**Issue: Mutations fail with "unauthorized"**
- Implement proper access control in mutations
- Verify user has access to academy data
- Check if IDs are valid Convex IDs (v.id("table"))

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex React Hooks](https://docs.convex.dev/client/react)
- [Convex Security](https://docs.convex.dev/using/database-queries)
