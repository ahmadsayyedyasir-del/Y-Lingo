import type { Metadata } from "next";
import LoginContainer from "@/components/login/LoginContainer";

export const metadata: Metadata = {
  title: "Sign in — Y-Lingo",
  description: "Sign in to your Y-Lingo account and continue your AI language learning journey.",
};

export default function LoginPage() {
  return <LoginContainer />;
}