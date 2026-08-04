import Link from "next/link";

export default function LoginRedirect() {
  return (
    <p className="text-center text-sm text-gray-400">
      Already have an account?{" "}
      <Link
        href="/login"
        className="font-medium text-blue-400 underline-offset-2 hover:underline focus:underline"
      >
        Sign In
      </Link>
    </p>
  );
}