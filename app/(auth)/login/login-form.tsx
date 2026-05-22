"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="border-navy/20 focus:border-maroon focus:ring-maroon/20 rounded-md border px-3 py-2 outline-none focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-navy font-medium">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="border-navy/20 focus:border-maroon focus:ring-maroon/20 rounded-md border px-3 py-2 outline-none focus:ring-2"
        />
      </label>

      {state.error ? (
        <p role="alert" className="text-maroon text-sm">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="bg-maroon hover:bg-maroon-dark mt-2 rounded-md px-4 py-2 font-medium text-white transition disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
