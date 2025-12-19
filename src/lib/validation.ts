export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ProfileFormData {
  full_name: string;
  university: string;
  program: string;
  country: string;
  student_id: string;
  start_year: number;
}

export interface CourseFormData {
  name: string;
  credit_hours: number;
  ia_score: number | null;
  ia_max: number;
  ue_score: number | null;
  ue_max: number;
}

export interface SemesterFormData {
  semester_number: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

export function validateProfile(data: Partial<ProfileFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters';
  } else if (data.full_name.trim().length > 100) {
    errors.full_name = 'Full name must be less than 100 characters';
  }

  if (!data.university || data.university.trim().length < 2) {
    errors.university = 'University is required';
  }

  if (!data.program || data.program.trim().length < 2) {
    errors.program = 'Program is required';
  }

  if (!data.country || data.country.trim().length < 2) {
    errors.country = 'Country is required';
  }

  if (data.student_id && !/^[a-zA-Z0-9/\-_]+$/.test(data.student_id)) {
    errors.student_id = 'Student ID can only contain letters, numbers, and - / _';
  }

  if (data.start_year) {
    const currentYear = new Date().getFullYear();
    if (data.start_year < 1990 || data.start_year > currentYear + 1) {
      errors.start_year = `Start year must be between 1990 and ${currentYear + 1}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateCourse(data: Partial<CourseFormData>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Course name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Course name must be less than 100 characters';
  }

  if (data.credit_hours === undefined || data.credit_hours === null) {
    errors.credit_hours = 'Credit hours is required';
  } else if (data.credit_hours < 1 || data.credit_hours > 10) {
    errors.credit_hours = 'Credit hours must be between 1 and 10';
  } else if (!Number.isInteger(data.credit_hours)) {
    errors.credit_hours = 'Credit hours must be a whole number';
  }

  if (data.ia_max === undefined || data.ia_max === null || data.ia_max <= 0) {
    errors.ia_max = 'IA max marks must be greater than 0';
  }

  if (data.ue_max === undefined || data.ue_max === null || data.ue_max <= 0) {
    errors.ue_max = 'UE max marks must be greater than 0';
  }

  if (data.ia_score !== null && data.ia_score !== undefined) {
    if (data.ia_score < 0) {
      errors.ia_score = 'IA score cannot be negative';
    } else if (data.ia_max && data.ia_score > data.ia_max) {
      errors.ia_score = `IA score cannot exceed ${data.ia_max}`;
    }
  }

  if (data.ue_score !== null && data.ue_score !== undefined) {
    if (data.ue_score < 0) {
      errors.ue_score = 'UE score cannot be negative';
    } else if (data.ue_max && data.ue_score > data.ue_max) {
      errors.ue_score = `UE score cannot exceed ${data.ue_max}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateSemester(
  data: Partial<SemesterFormData>,
  existingSemesterNumbers: number[] = []
): ValidationResult {
  const errors: Record<string, string> = {};

  if (data.semester_number === undefined || data.semester_number === null) {
    errors.semester_number = 'Semester number is required';
  } else if (data.semester_number < 1) {
    errors.semester_number = 'Semester number must be at least 1';
  } else if (data.semester_number > 20) {
    errors.semester_number = 'Semester number cannot exceed 20';
  } else if (existingSemesterNumbers.includes(data.semester_number)) {
    errors.semester_number = `Semester ${data.semester_number} already exists`;
  }

  if (data.name && data.name.trim().length > 50) {
    errors.name = 'Semester name must be less than 50 characters';
  }

  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    if (end < start) {
      errors.end_date = 'End date cannot be before start date';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function sanitizeString(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function parseNumber(value: string | number): number | null {
  if (typeof value === 'number') return isNaN(value) ? null : value;
  if (!value || value.trim() === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

export function parseInteger(value: string | number): number | null {
  if (typeof value === 'number') return isNaN(value) ? null : Math.floor(value);
  if (!value || value.trim() === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}
