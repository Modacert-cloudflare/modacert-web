"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getGoogleAuthUrl, register } from "../_lib/api";
import { saveAuth } from "../_lib/auth";
import { countries, type CountryDialCode } from "../_lib/countries";
import { AuthDivider, AuthField, AuthHeading, AuthPrimaryButton, AuthShell, GoogleButton } from "../auth-ui";

type SignUpForm = {
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialForm: SignUpForm = {
  firstName: "",
  lastName: "",
  country: "United States",
  countryCode: "+1",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function messageFromError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (!error.response) return "Registration service is not available.";
    const data = error.response.data;
    const msg = data?.error?.message || data?.message || data?.error || error.message;
    return typeof msg === "string" ? msg : JSON.stringify(msg);
  }
  return error instanceof Error ? error.message : "Registration failed.";
}

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignUpForm>(initialForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const submittingRef = useRef(false);

  function updateField(key: keyof SignUpForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCountry(country: CountryDialCode) {
    setForm((current) => ({ ...current, country: country.name, countryCode: country.dialCode }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError("");

    if (form.password.length < 8 || form.password.length > 20) {
      setError("Password must be from 8 to 20 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const response = await register({ ...form });
      if ("accessToken" in response) {
        saveAuth(response.accessToken, response.user, false);
        router.push("/checkout", { transitionTypes: ["nav-forward"] });
      } else {
        router.push("/signin?registered=1", { transitionTypes: ["nav-forward"] });
      }
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
    <AuthShell switchHref="/signin" switchLabel="Sign in">
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-[430px]">
        <AuthHeading title="Create an account" description="Keep your authentication requests in one place." />
        <GoogleButton className="mt-5" onClick={handleGoogleAuth} loading={googleLoading}>
          Continue with Google
        </GoogleButton>
        <AuthDivider />
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField id="first-name" label="First name" value={form.firstName} onChange={(value) => updateField("firstName", value)} autoComplete="given-name" />
          <AuthField id="last-name" label="Last name" value={form.lastName} onChange={(value) => updateField("lastName", value)} autoComplete="family-name" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[0.36fr_1fr]">
          <CountryCodeSelect countryName={form.country} countryCode={form.countryCode} onSelect={updateCountry} />
          <AuthField id="phone" label="Phone number" type="tel" value={form.phone} onChange={(value) => updateField("phone", value)} autoComplete="tel" />
        </div>
        <AuthField id="signup-email" label="Email address" type="email" value={form.email} onChange={(value) => updateField("email", value)} autoComplete="email" />
        <AuthField id="signup-password" label="Create password" type="password" value={form.password} onChange={(value) => updateField("password", value)} autoComplete="new-password" reveal />
        <p className="mt-2 text-xs text-mc-ink/70">Enter from 8 to 20 characters</p>
        <AuthField id="confirm-password" label="Confirm password" type="password" value={form.confirmPassword} onChange={(value) => updateField("confirmPassword", value)} autoComplete="new-password" reveal />
        {error ? <p role="alert" className="mt-4 rounded-lg bg-mc-orange/10 px-4 py-2 text-sm font-semibold text-mc-orange-dark">{error}</p> : null}
        <AuthPrimaryButton loading={loading}>{loading ? "Creating account" : "Sign up"}</AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}

function CountryCodeSelect({ countryName, countryCode, onSelect }: { countryName: string; countryCode: string; onSelect: (country: CountryDialCode) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedCountry =
    countries.find((country) => country.name === countryName && country.dialCode === countryCode) ||
    countries.find((country) => country.iso2 === "US") ||
    countries[0];
  const filteredCountries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return countries;
    return countries.filter((country) => {
      const haystack = `${country.name} ${country.iso2} ${country.dialCode}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  function chooseCountry(country: CountryDialCode) {
    onSelect(country);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative mt-5">
      <span className="block text-sm font-semibold">Country code</span>
      <button
        id="country-code"
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="mt-2 flex min-h-12 w-full items-center gap-2 rounded-lg border border-mc-muted bg-white px-3 text-sm text-mc-ink"
      >
        <Image src={selectedCountry.flag} alt={`${selectedCountry.name} flag`} width={26} height={18} sizes="26px" className="h-[18px] w-[26px] rounded-[3px] object-cover" />
        <span className="min-w-0 flex-1 truncate text-left">{selectedCountry.dialCode}</span>
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-mc-orange text-xs text-white">⌄</span>
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[1rem] bg-white shadow-card">
          <div className="p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder="Search country"
              className="h-10 w-full rounded-full border border-mc-muted px-4 text-sm outline-none focus:border-mc-orange focus:ring-2 focus:ring-mc-orange/20"
            />
          </div>
          <div role="listbox" className="max-h-72 overflow-y-auto p-2 pt-0">
            {filteredCountries.map((country) => (
              <button
                key={`${country.iso2}-${country.dialCode}`}
                type="button"
                role="option"
                aria-selected={country.iso2 === selectedCountry.iso2}
                onClick={() => chooseCountry(country)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-mc-orange/10"
              >
                <Image src={country.flag} alt={`${country.name} flag`} width={26} height={18} sizes="26px" className="h-[18px] w-[26px] rounded-[3px] object-cover" />
                <span className="min-w-0 flex-1 truncate">{country.name}</span>
                <span className="font-bold text-mc-ink">{country.dialCode}</span>
              </button>
            ))}
            {filteredCountries.length === 0 ? <p className="px-3 py-4 text-center text-sm text-mc-ink/55">No country found</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
