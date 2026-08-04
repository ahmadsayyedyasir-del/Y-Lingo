export type PasswordStrengthLevel = "weak" | "medium" | "strong" | "very-strong";

export interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

export const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function getPasswordStrength(password: string): {
  score: number;
  level: PasswordStrengthLevel;
  label: string;
} {
  if (!password) {
    return { score: 0, level: "weak", label: "Weak" };
  }

  const passed = passwordRequirements.filter((r) => r.test(password)).length;

  if (passed <= 2) return { score: passed, level: "weak", label: "Weak" };
  if (passed === 3) return { score: passed, level: "medium", label: "Medium" };
  if (passed === 4) return { score: passed, level: "strong", label: "Strong" };
  return { score: passed, level: "very-strong", label: "Very strong" };
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidFullName(fullName: string): boolean {
  return fullName.trim().length >= 2;
}

export function isPasswordValid(password: string): boolean {
  return passwordRequirements.every((r) => r.test(password));
}

export function doPasswordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface SignupFormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreedToTerms?: string;
}

export function validateSignupForm(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = {};

  if (!isValidFullName(values.fullName)) {
    errors.fullName = "Enter your full name.";
  }

  if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isPasswordValid(values.password)) {
    errors.password = "Password doesn't meet all requirements.";
  }

  if (!doPasswordsMatch(values.password, values.confirmPassword)) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.agreedToTerms) {
    errors.agreedToTerms = "You must accept the terms to continue.";
  }

  return errors;
}

export function isSignupFormValid(values: SignupFormValues): boolean {
  const errors = validateSignupForm(values);
  return Object.keys(errors).length === 0;
}