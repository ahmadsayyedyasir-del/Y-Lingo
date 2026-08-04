import type { Metadata } from "next";
import SignupContainer from "@/components/signup/SignupContainer";

export const metadata: Metadata = {
  title: "Sign up — Y-Lingo",
  description: "Create your Y-Lingo account and start learning languages with your AI Coach.",
};

export default function SignupPage() {
  return <SignupContainer />;
}