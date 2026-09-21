# Manual Testing Guide

## Prerequisites
- iOS Simulator running
- Expo dev server running (`npx expo start --clear`)
- Academee app installed on simulator
- Academy and batch already created in app
- At least one course created

## Test Cases

### Test 1: Create Student with Valid Data ✅
**Objective**: Verify successful student creation with all valid inputs

**Steps**:
1. Navigate to Students → Add Student
2. Fill in the form:
   - Student name: "Ali Raza"
   - Father name: "Muhammad Raza"
   - Parent phone: "03001234567"
   - Student phone: "03021234567"
   - Discount: "500"
3. Select a course from the list
4. Tap "Add student"

**Expected Result**: 
- ✅ Student created successfully
- ✅ Navigates back to students list
- ✅ No error message shown
- ✅ Student appears in list

---

### Test 2: Invalid Parent Phone - Too Short ❌→ 📋
**Objective**: Verify phone validation rejects invalid format

**Steps**:
1. Navigate to Students → Add Student
2. Fill in the form with valid data EXCEPT:
   - Parent phone: "03001234" (only 8 digits)
3. Tap "Add student"

**Expected Result**:
- ❌ Form NOT submitted
- ✅ Error message shown: "Parent phone must be in format: 03001234567"
- ✅ Form fields remain populated
- ✅ Can edit and resubmit

---

### Test 3: Invalid Student Phone Format ❌→ 📋
**Objective**: Verify optional student phone is validated if provided

**Steps**:
1. Navigate to Students → Add Student
2. Fill in the form with valid data EXCEPT:
   - Student phone: "1234567890" (invalid format)
3. Tap "Add student"

**Expected Result**:
- ❌ Form NOT submitted
- ✅ Error message shown about student phone format
- ✅ Other fields remain populated

---

### Test 4: Empty Student Name ❌→ 📋
**Objective**: Verify required field validation

**Steps**:
1. Navigate to Students → Add Student
2. Fill in the form but leave:
   - Student name: (empty)
3. Fill other required fields correctly
4. Tap "Add student"

**Expected Result**:
- ❌ Form NOT submitted
- ✅ Error message: "Student name is required"

---

### Test 5: Negative Discount ❌→ 📋
**Objective**: Verify discount validation

**Steps**:
1. Navigate to Students → Add Student
2. Fill in valid data but set:
   - Discount: "-500"
3. Tap "Add student"

**Expected Result**:
- ❌ Form NOT submitted
- ✅ Error message: "Discount must be a valid positive number"

---

### Test 6: Multiple Course Selection ✅
**Objective**: Verify student can enroll in multiple courses

**Steps**:
1. Navigate to Students → Add Student
2. Fill in form with valid data
3. Select multiple courses (checkbox each one)
4. Tap "Add student"

**Expected Result**:
- ✅ Student created successfully
- ✅ Student enrolled in all selected courses
- ✅ Can view enrolled courses in student details

---

### Test 7: Create Student Without Courses ✅
**Objective**: Verify course selection is optional

**Steps**:
1. Navigate to Students → Add Student
2. Fill in form with valid data
3. Do NOT select any courses
4. Tap "Add student"

**Expected Result**:
- ✅ Student created successfully
- ✅ Student has no enrolled courses
- ✅ Can manually enroll later

---

### Test 8: Optional Student Phone Empty ✅
**Objective**: Verify student phone can be left blank

**Steps**:
1. Navigate to Students → Add Student
2. Fill in form with valid data EXCEPT:
   - Student phone: (leave empty)
3. Tap "Add student"

**Expected Result**:
- ✅ Student created successfully
- ✅ Student phone field is empty in profile

---

### Test 9: All Required Fields Empty ❌→ 📋
**Objective**: Verify all validation errors shown together

**Steps**:
1. Navigate to Students → Add Student
2. Leave all fields empty
3. Tap "Add student"

**Expected Result**:
- ❌ Form NOT submitted
- ✅ Multiple error messages shown:
  - "Student name is required"
  - "Father name is required"
  - "Parent phone is required"

---

### Test 10: Valid Phone Format Variations ✅
**Objective**: Verify all valid Pakistani phone numbers accepted

**Steps**:
For each phone number, create a student with valid data but different phone:
1. "03001234567" (Zong)
2. "03111234567" (Telenor)
3. "03211234567" (Ufone)
4. "03451234567" (PTCL)

**Expected Result**:
- ✅ All phone numbers accepted
- ✅ All students created successfully

---

### Test 11: Discount Variations ✅
**Objective**: Verify discount validation accepts valid amounts

**Steps**:
Create students with different discount values:
1. Discount: "0" (no discount)
2. Discount: "100" (small discount)
3. Discount: "5000" (large discount)

**Expected Result**:
- ✅ All created successfully
- ✅ Discounts saved correctly

---

### Test 12: Course Selection Toggle ✅
**Objective**: Verify course selection can be toggled on/off

**Steps**:
1. Navigate to Students → Add Student
2. Select a course (should see checkmark)
3. Tap the same course again (checkmark should disappear)
4. Select multiple courses
5. Deselect one
6. Tap "Add student"

**Expected Result**:
- ✅ Only selected courses enrolled
- ✅ Toggle works smoothly
- ✅ Only final selection matters

---

## Test Result Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Valid Data | ✅ Pass | All fields filled correctly |
| 2 | Invalid Phone Short | ❌ Pass | Correctly rejected |
| 3 | Invalid Student Phone | ❌ Pass | Correctly rejected |
| 4 | Empty Name | ❌ Pass | Correctly rejected |
| 5 | Negative Discount | ❌ Pass | Correctly rejected |
| 6 | Multiple Courses | ✅ Pass | All courses enrolled |
| 7 | No Courses | ✅ Pass | Student created without courses |
| 8 | Empty Student Phone | ✅ Pass | Student phone optional |
| 9 | All Empty | ❌ Pass | All errors shown |
| 10 | Phone Variations | ✅ Pass | All formats accepted |
| 11 | Discount Variations | ✅ Pass | All amounts accepted |
| 12 | Course Toggle | ✅ Pass | Toggle works correctly |

## Error Messages to Expect

When validation fails, you should see one of these messages:

| Error | When It Appears |
|-------|-----------------|
| "Student name is required" | Name field empty |
| "Father name is required" | Father name field empty |
| "Parent phone is required" | Parent phone field empty |
| "Parent phone must be in format: 03001234567" | Invalid phone format |
| "Student phone must be in format: 03001234567" | Invalid student phone |
| "Discount must be a valid positive number" | Negative or invalid discount |

## Success Indicators

When form is valid and submitted successfully:
- ✅ No error message appears
- ✅ Form closes/navigates back
- ✅ New student appears in students list
- ✅ Student can be tapped to view details
- ✅ Enrolled courses appear in student details
- ✅ Confirmation of enrollment success

## Troubleshooting

**If app crashes**:
- Restart Expo dev server: `npx expo start --clear`
- Reload app in simulator: Cmd+R in simulator

**If validation not working**:
- Ensure recent commits are deployed
- Check browser console for errors
- Verify form fields are populated before submit

**If courses not enrolling**:
- Check that academy and course exist
- Verify Convex backend is running
- Look for backend error in console

## Rollback Instructions

If critical issues found:
```bash
git revert 8d6e91b  # Revert form validation fixes
git revert c50a7f6  # Revert test documentation
```

Both commits are backwards compatible and can be safely reverted.
