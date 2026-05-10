// Department list used across the application
// This is the single source of truth for all departments
export const DEPARTMENT_LIST = [
  'Computer Science',
  'Software Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Other'
];

export const getDepartmentLabel = (dept) => {
  return dept || 'Other';
};

export const isValidDepartment = (dept) => {
  return DEPARTMENT_LIST.includes(dept);
};
