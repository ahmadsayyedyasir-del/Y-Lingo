import Link from "next/link";

export default function ForgotPasswordLink() {
  return (
    <Link
      href="/forgot-password"
      className="text-sm font-medium text-blue-400 underline-offset-2 hover:underline focus:underline"
    >
      Forgot password?
    </Link>
  );
}