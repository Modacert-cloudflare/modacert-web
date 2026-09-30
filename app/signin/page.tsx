"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getGoogleAuthUrl, login } from "../_lib/api";
import { saveAuth, getStoredEmail, isRemembered } from "../_lib/auth";
import { AuthDivider, AuthField, AuthHeading, AuthPrimaryButton, AuthShell, GoogleButton } from "../auth-ui";

function messageFromError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Authentication service is not available.";
    if (error.response.status === 401) return "Invalid email or password.";
    const data = error.response.data;
    const msg = data?.error?.message || data?.message || data?.error || error.message;
    return typeof msg === "string" ? msg : JSON.stringify(msg);
  }
  return error instanceof Error ? error.message : "Sign in failed.";
}

export default function SignInPage() {
  const router = useRouter();
  const registered = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("registered");
  const [email, setEmail] = useState(() => getStoredEmail() ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => isRemembered());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const submittingRef = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await login(email, password);
      saveAuth(response.accessToken, response.user, remember);
      router.push("/checkout", { transitionTypes: ["nav-forward"] });
    } catch (err) {
      setError(messageFromError(err));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    if (googleLoading) return;
    setGoogleLoading(true);
    setError("");
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(messageFromError(err));
      setGoogleLoading(false);
    }
  }

  return (
    <AuthShell switchHref="/signup" switchLabel="Sign up">
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-[416px]">
        <AuthHeading title="Sign in" description="Access your authentication requests." />
        {registered ? (
          <p className="mt-4 rounded-[0.8rem] bg-mc-orange/10 px-4 py-2 text-sm font-semibold text-mc-orange-dark">
            Account created. Sign in to continue.
          </p>
        ) : null}
        <AuthField id="signin-email" label="Email address" type="email" value={email} onChange={setEmail} autoComplete="email" />
        <AuthField id="signin-password" label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" reveal />
        <div className="mt-3 flex items-center justify-between font-auth text-xs">
          <label className="inline-flex min-h-11 items-center gap-2 text-mc-form-muted">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-5 w-5 rounded border-mc-line accent-mc-orange" />
            Remember me
          </label>
        </div>
        {error ? <p role="alert" className="mt-4 rounded-lg bg-mc-orange/10 px-4 py-2 text-sm font-semibold text-mc-orange-dark">{error}</p> : null}
        <AuthPrimaryButton loading={loading}>{loading ? "Signing in" : "Sign in"}</AuthPrimaryButton>
        <AuthDivider />
        <GoogleButton onClick={handleGoogleAuth} loading={googleLoading} />
      </form>
    </AuthShell>
  );
}
