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

type GoogleButtonConfiguration =
  | {
      type: "standard";
      theme: "filled_black";
      size: "large";
      text: "signin_with";
      shape: "pill";
      logo_alignment: "left";
      locale: "en";
      width: number;
    }
  | {
      type: "icon";
      theme: "filled_black";
      size: "large";
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
  const [isWide, setIsWide] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches);
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

    buttonElement.replaceChildren();
    if (!initializedRef.current) {
      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: config.google.clientId,
        callback: handleCredential,
        context: "signin",
        ux_mode: "popup",
      });
    }
    window.google.accounts.id.renderButton(buttonElement, isWide ? {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      locale: "en",
      width: 200,
    } : {
      type: "icon",
      theme: "filled_black",
      size: "large",
    });
  }, [handleCredential, isWide]);

  useEffect(() => {
    if (scriptReady) renderButton();
  }, [renderButton, scriptReady]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = (event: MediaQueryListEvent) => setIsWide(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div data-testid="google-signin-nav" className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/25 ${className}`}>
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("Google sign-in could not be loaded.")}
      />
      <div className="relative flex items-center justify-center">
        <div ref={buttonRef} className={loading ? "invisible" : ""} aria-busy={loading} />
        {loading ? <div className="absolute inset-0 flex items-center justify-center rounded-full bg-mc-ink/90 text-sm font-semibold text-white">…</div> : null}
      </div>
      {error || !config.google.clientId ? <p role="alert" className="absolute right-0 top-full z-40 mt-2 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-full bg-mc-soft px-3 py-2 text-sm font-semibold text-mc-ink shadow-card">{error || "Google sign-in is not configured."}</p> : null}
    </div>
  );
}