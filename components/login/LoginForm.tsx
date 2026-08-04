"use client";

import { useState, FormEvent } from "react";
import Button from "@/components/ui/Button";
import RememberMeCheckbox from "./RememberMeCheckbox";
import ForgotPasswordLink from "./ForgotPasswordLink";
import GoogleLoginButton from "./GoogleLoginButton";
import Divider from "./Divider";
import {
  LoginFormValues,
  LoginFormErrors,
  validateLoginForm,
  isLoginFormValid,
} from "@/lib/loginValidators";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const errors: LoginFormErrors = validateLoginForm(values);
  const formIsValid = isLoginFormValid(values);

  function updateField<K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function markTouched(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function fieldError(field: keyof LoginFormErrors): string | undefined {
    return touched[field] ? errors[field] : undefined;
  }

  async function loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    // Backend integration point:
    // Replace this with a real call to the FastAPI JWT login endpoint, e.g.
    //
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!response.ok) throw new Error("Invalid email or password.");
    // const { accessToken } = await response.json();
    // Store accessToken (e.g. httpOnly cookie set by the server, or secure storage).

    void email;
    void password;
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setAuthError(null);

    if (!formIsValid) return;

    setIsSubmitting(true);
    try {
      await loginWithEmailAndPassword(values.email, values.password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-300">
          Email address
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
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <ForgotPasswordLink />
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={values.password}
            onChange={(e) => updateField("password", e.target.value)}
            onBlur={() => markTouched("password")}
            aria-invalid={Boolean(fieldError("password"))}
            aria-describedby={fieldError("password") ? "password-error" : undefined}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-gray-500 backdrop-blur-xl transition-colors duration-200 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            placeholder="Enter your password"
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
        {fieldError("password") && (
          <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-400">
            {fieldError("password")}
          </p>
        )}
      </div>

      <RememberMeCheckbox
        checked={values.rememberMe}
        onChange={(checked) => updateField("rememberMe", checked)}
      />

      {authError && (
        <p role="alert" className="text-sm text-red-400">
          {authError}
        </p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={!formIsValid || isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      <Divider />

      <GoogleLoginButton />
    </form>
  );
}