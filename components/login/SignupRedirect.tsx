import Link from "next/link";

export default function SignupRedirect() {
  return (
    <p className="text-center text-sm text-gray-400">
      Don&apos;t have an account?{" "}
      <Link
        href="/signup"
        className="font-medium text-blue-400 underline-offset-2 hover:underline focus:underline"
      >
        Create Account
      </Link>
    </p>
  );
}