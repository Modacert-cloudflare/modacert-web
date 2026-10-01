"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { exchangeGoogleCode } from "../../../_lib/api";
import { saveAuth } from "../../../_lib/auth";
import { AuthHeading, AuthShell } from "../../../auth-ui";

function messageFromError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Google authentication service is not available.";
    const data = error.response.data;
    const msg = data?.error?.message || data?.message || data?.error || error.message;
    return typeof msg === "string" ? msg : JSON.stringify(msg);
  }
  return error instanceof Error ? error.message : "Google sign in failed.";
}

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef(false);
  const googleError = searchParams.get("error");
  const code = searchParams.get("code");
  const initialError = googleError || (!code ? "No Google authorization code provided." : "");
  const [error, setError] = useState(initialError);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    if (initialError || !code) return;

    exchangeGoogleCode(code)
      .then((response) => {
        saveAuth(response.accessToken, response.user, false);
        router.replace("/checkout", { transitionTypes: ["nav-forward"] });
      })
      .catch((err) => setError(messageFromError(err)));
  }, [code, initialError, router]);

  return (
    <AuthShell switchHref="/signin" switchLabel="Sign in">
      <div className="relative z-10 w-full max-w-[416px]">
        <AuthHeading title="Google" description="Completing sign in" />
        {error ? (
          <>
            <p className="mt-5 rounded-[0.8rem] bg-mc-orange/10 px-4 py-2 text-sm font-semibold text-mc-orange-dark">{error}</p>
            <Link href="/signin" transitionTypes={["nav-back"]} className="mt-5 inline-flex min-h-12 items-center rounded-lg bg-mc-orange px-6 text-sm font-semibold text-white">
              Back to sign in
            </Link>
          </>
        ) : (
          <p className="mt-5 rounded-[0.8rem] bg-mc-orange/10 px-4 py-2 text-sm font-semibold text-mc-orange-dark">Please wait while we sign you in.</p>
        )}
      </div>
    </AuthShell>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <GoogleCallbackContent />
    </Suspense>
  );
}
