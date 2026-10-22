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
      theme: "outline";
      size: "large";
      text: "signin_with";
      shape: "pill";
      logo_alignment: "left";
      locale: "en";
      width: number;
    }
  | {
      type: "icon";
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
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
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
    window.google.accounts.id.renderButton(buttonElement, isDesktop ? {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      logo_alignment: "left",
      locale: "en",
      width: 220,
    } : {
      type: "icon",
      size: "large",
    });
  }, [handleCredential, isDesktop]);

  useEffect(() => {
    if (scriptReady) renderButton();
  }, [renderButton, scriptReady]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div data-testid="google-signin-float" className={`fixed right-4 top-[calc(env(safe-area-inset-top,0px)_+_76px)] z-20 w-11 sm:right-6 lg:right-8 lg:top-[calc(env(safe-area-inset-top,0px)_+_128px)] lg:w-[220px] ${className}`}>
      <Script
        id="google-identity-services"
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => setError("Google sign-in could not be loaded.")}
      />
      <div className="relative flex min-h-11 items-center justify-center lg:block">
        <div className={`scale-110 lg:scale-100 ${loading ? "invisible" : ""}`}>
          <div ref={buttonRef} />
        </div>
        {loading ? <div className="absolute inset-0 flex items-center justify-center rounded-full bg-mc-soft text-sm font-semibold text-mc-ink"><span className="lg:hidden">…</span><span className="hidden lg:inline">Signing in with Google…</span></div> : null}
      </div>
      {error || !config.google.clientId ? <p role="alert" className="absolute right-0 top-full mt-2 w-max max-w-[min(16rem,calc(100vw-2rem))] rounded-full bg-mc-soft/95 px-3 py-2 text-sm font-semibold text-mc-ink shadow-card">{error || "Google sign-in is not configured."}</p> : null}
    </div>
  );
}
