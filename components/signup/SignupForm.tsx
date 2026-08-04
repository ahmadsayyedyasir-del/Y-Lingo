"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import PasswordStrength from "./PasswordStrength";
import TermsCheckbox from "./TermsCheckbox";
import GoogleSignupButton from "./GoogleSignupButton";
import Divider from "./Divider";
import {
  SignupFormValues,
  SignupFormErrors,
  validateSignupForm,
  isSignupFormValid,
} from "@/lib/validators";

const initialValues: SignupFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

export default function SignupForm() {
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors: SignupFormErrors = validateSignupForm(values);
  const formIsValid = isSignupFormValid(values);

  function updateField<K extends keyof SignupFormValues>(field: K, value: SignupFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: keyof SignupFormErrors): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      agreedToTerms: true,
    });

    if (!formIsValid) return;

    setIsSubmitting(true);
    // Backend integration point: replace with the real signup API call.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-gray-300">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          value={values.fullName}
          onChange={(e) => updateField("fullName", e.target.value)}
          onBlur={() => markTouched("fullName")}
          aria-invalid={Boolean(fieldError("fullName"))}
          aria-describedby={fieldError("fullName") ? "fullName-error" : undefined}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          placeholder="Jane Doe"
        />
        {fieldError("fullName") && (
          <p id="fullName-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {fieldError("fullName")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          onBlur={() => markTouched("email")}
          aria-invalid={Boolean(fieldError("email"))}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          placeholder="you@example.com"
        />
        {fieldError("email") && (
          <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {fieldError("email")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => markTouched("password")}
            aria-invalid={Boolean(fieldError("password"))}
            aria-describedby="password-requirements"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Create a password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-400 hover:text-gray-200 focus:text-blue-400 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div id="password-requirements">
          <PasswordStrength password={values.password} />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-300">
          Confirm password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            onBlur={() => markTouched("confirmPassword")}
            aria-invalid={Boolean(fieldError("confirmPassword"))}
            aria-describedby={fieldError("confirmPassword") ? "confirmPassword-error" : undefined}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Re-enter your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-gray-400 hover:text-gray-200 focus:text-blue-400 focus:outline-none"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {fieldError("confirmPassword") && (
          <p id="confirmPassword-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {fieldError("confirmPassword")}
          </p>
        )}
      </div>

      <TermsCheckbox
        checked={values.agreedToTerms}
        onChange={(checked) => {
          updateField("agreedToTerms", checked);
          markTouched("agreedToTerms");
        }}
        error={fieldError("agreedToTerms")}
      />

      <Button type="submit" variant="primary" className="w-full" disabled={!formIsValid || isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <Divider />

      <GoogleSignupButton />
    </form>
  );
}