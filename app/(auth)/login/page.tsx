import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · Trinity Heights ERP",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-2xl font-semibold">Trinity Heights</h1>
        <p className="text-muted mt-1 text-sm">
          School ERP — staff &amp; parents
        </p>
      </header>
      <LoginForm />
    </div>
  );
}
