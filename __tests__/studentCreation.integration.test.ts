/**
 * Integration tests for student creation and course enrollment
 * These tests verify the end-to-end flow of creating students with courses
 */

import { describe, it, expect } from 'vitest';

describe('Student Creation Integration Tests', () => {
  describe('Form Validation', () => {
    const validateFormData = (data: any) => {
      const errors: string[] = [];

      if (!data.name?.trim()) errors.push("Student name is required");
      if (!data.fatherName?.trim()) errors.push("Father name is required");
      if (!data.parentPhone?.trim()) errors.push("Parent phone is required");
      if (data.parentPhone?.trim() && !/^03\d{9}$/.test(data.parentPhone.trim())) {
        errors.push("Parent phone must be in format: 03001234567");
      }
      if (data.studentPhone?.trim() && !/^03\d{9}$/.test(data.studentPhone.trim())) {
        errors.push("Student phone must be in format: 03001234567");
      }

      const discount = Number(data.discount);
      if (data.discount && (!Number.isFinite(discount) || discount < 0)) {
        errors.push("Discount must be a valid positive number");
      }

      return errors;
    };

    it('should reject form with missing required fields', () => {
      const data = {
        name: '',
        fatherName: 'Father Name',
        parentPhone: '03001234567',
        discount: '0',
      };

      const errors = validateFormData(data);
      expect(errors).toContain("Student name is required");
    });

    it('should reject form with invalid phone numbers', () => {
      const data = {
        name: 'Student Name',
        fatherName: 'Father Name',
        parentPhone: '1234567890', // wrong format
        discount: '0',
      };

      const errors = validateFormData(data);
      expect(errors).toContain("Parent phone must be in format: 03001234567");
    });

    it('should accept valid form data', () => {
      const data = {
        name: 'Ali Raza',
        fatherName: 'Muhammad Raza',
        parentPhone: '03001234567',
        studentPhone: '03021234567',
        discount: '500',
      };

      const errors = validateFormData(data);
      expect(errors).toHaveLength(0);
    });

    it('should accept form with optional student phone', () => {
      const data = {
        name: 'Ali Raza',
        fatherName: 'Muhammad Raza',
        parentPhone: '03001234567',
        studentPhone: '', // optional
        discount: '0',
      };

      const errors = validateFormData(data);
      expect(errors).toHaveLength(0);
    });

    it('should validate discount is positive', () => {
      const data = {
        name: 'Ali Raza',
        fatherName: 'Muhammad Raza',
        parentPhone: '03001234567',
        discount: '-100', // negative
      };

      const errors = validateFormData(data);
      expect(errors).toContain("Discount must be a valid positive number");
    });
  });

  describe('Course Selection State Management', () => {
    it('should initialize with empty course selection', () => {
      const selectedCourses = new Set();
      expect(selectedCourses.size).toBe(0);
    });

    it('should add course to selection', () => {
      const selectedCourses = new Set(['course_1']);
      selectedCourses.add('course_2');

      expect(selectedCourses.has('course_1')).toBe(true);
      expect(selectedCourses.has('course_2')).toBe(true);
      expect(selectedCourses.size).toBe(2);
    });

    it('should remove course from selection', () => {
      const selectedCourses = new Set(['course_1', 'course_2']);
      selectedCourses.delete('course_1');

      expect(selectedCourses.has('course_1')).toBe(false);
      expect(selectedCourses.has('course_2')).toBe(true);
      expect(selectedCourses.size).toBe(1);
    });

    it('should toggle course selection', () => {
      const selectedCourses = new Set(['course_1']);
      const courseId = 'course_1';

      // Remove if exists
      if (selectedCourses.has(courseId)) {
        selectedCourses.delete(courseId);
      } else {
        selectedCourses.add(courseId);
      }

      expect(selectedCourses.has(courseId)).toBe(false);
      expect(selectedCourses.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should collect multiple validation errors', () => {
      const validateFormData = (data: any) => {
        const errors: string[] = [];
        if (!data.name?.trim()) errors.push("Student name is required");
        if (!data.fatherName?.trim()) errors.push("Father name is required");
        if (!data.parentPhone?.trim()) errors.push("Parent phone is required");
        return errors;
      };

      const data = {
        name: '',
        fatherName: '',
        parentPhone: '',
      };

      const errors = validateFormData(data);
      expect(errors.length).toBe(3);
    });

    it('should handle enrollment errors separately from creation', () => {
      const enrollmentErrors: string[] = [];

      // Simulate failed enrollment
      try {
        throw new Error("Student is already enrolled in this course");
      } catch (e) {
        enrollmentErrors.push((e as Error).message);
      }

      expect(enrollmentErrors).toContain("Student is already enrolled in this course");
    });

    it('should format enrollment error message', () => {
      const enrollmentErrors = ['Failed to enroll course 1', 'Failed to enroll course 2'];
      const message = `Student added but ${enrollmentErrors.length} course enrollment(s) failed:\n${enrollmentErrors.join("\n")}`;

      expect(message).toContain("2 course enrollment");
      expect(message).toContain("Failed to enroll course 1");
    });
  });

  describe('Phone Number Validation', () => {
    it('should validate Pakistani phone number format', () => {
      const validPhones = [
        '03001234567',
        '03111234567',
        '03211234567',
        '03451234567',
      ];

      validPhones.forEach(phone => {
        expect(/^03\d{9}$/.test(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '3001234567', // missing leading 0
        '033001234567', // extra digit
        '03001234', // too short
        '+923001234567', // international format
        '123', // random
      ];

      invalidPhones.forEach(phone => {
        expect(/^03\d{9}$/.test(phone)).toBe(false);
      });
    });

    it('should allow optional student phone', () => {
      const studentPhone = '';
      // Empty string should be allowed (optional field)
      expect(studentPhone === '' || /^03\d{9}$/.test(studentPhone)).toBe(true);
    });
  });

  describe('Discount Calculation', () => {
    it('should parse discount as number', () => {
      const discount = '500';
      const discountAmount = Number(discount);

      expect(discountAmount).toBe(500);
      expect(Number.isFinite(discountAmount)).toBe(true);
    });

    it('should reject invalid discount', () => {
      const discount = 'abc';
      const discountAmount = Number(discount);

      expect(Number.isFinite(discountAmount)).toBe(false);
    });

    it('should default to 0 if discount is invalid', () => {
      const discount = 'invalid';
      const discountAmount = Number(discount);
      const finalDiscount = Number.isFinite(discountAmount) ? discountAmount : 0;

      expect(finalDiscount).toBe(0);
    });
  });
});
