"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import axios from "axios";
import { loginWithGoogle } from "./_lib/api";
import { consumeAuthReturnPath, saveAuth } from "./_lib/auth";
import { config } from "./_lib/config";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfiguration = {
  type: "standard";
  theme: "outline";
  size: "large";
  text: "signin_with";
  shape: "pill";
  logo_alignment: "left";
  locale: "en";
  width: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (configuration: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            context: "signin";
            ux_mode: "popup";
          }) => void;
          renderButton: (element: HTMLElement, configuration: GoogleButtonConfiguration) => void;
        };
      };
    };
  }
}

function messageFromError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Google sign-in is not available right now.";
    const data = error.response.data;
    const message = data?.error?.message || data?.message || data?.error;
    return typeof message === "string" ? message : "Google sign-in failed.";
  }
  return error instanceof Error ? error.message : "Google sign-in failed.";
}

export function GoogleSignInButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const submittingRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential || submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const auth = await loginWithGoogle(response.credential);
      saveAuth(auth.accessToken, auth.user, false);
      router.replace(consumeAuthReturnPath(), { transitionTypes: ["nav-forward"] });
    } catch (authError) {
      setError(messageFromError(authError));
      submittingRef.current = false;
      setLoading(false);
    }
  }, [router]);

  const renderButton = useCallback(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) return;
    if (!config.google.clientId || !window.google) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const width = Math.max(240, Math.min(400, Math.floor(buttonElement.getBoundingClientRect().width)));
    buttonElement.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: config.google.clientId,
      callback: handleCredential,
      context: "signin",
      ux_mode: "popup",
    });
    window.google.accounts.id.renderButton(buttonElement, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      locale: "en",
      width,
    });
  }, [handleCredential]);

  useEffect(() => {
    if (scriptReady) renderButton();
  }, [renderButton, scriptReady]);

  return (
    <div className={`w-full sm:w-[300px] ${className}`}>
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("Google sign-in could not be loaded.")}
      />
      <div className="relative min-h-11">
        <div ref={buttonRef} className={loading ? "invisible" : ""} />
        {loading ? <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-mc-ink">Signing in with Google…</div> : null}
      </div>
      {error || !config.google.clientId ? <p role="alert" className="mt-2 text-sm font-semibold text-white">{error || "Google sign-in is not configured."}</p> : null}
    </div>
  );
}
