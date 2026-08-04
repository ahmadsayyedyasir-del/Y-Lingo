export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidLoginPassword(password: string): boolean {
  return password.length >= 8;
}

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (!isValidLoginPassword(values.password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

export function isLoginFormValid(values: LoginFormValues): boolean {
  const errors = validateLoginForm(values);
  return Object.keys(errors).length === 0;
}