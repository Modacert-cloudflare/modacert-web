"use client";

import axios from "axios";
import { FormEvent, useRef, useState } from "react";
import { ArrowRight, FileCheck2, KeyRound, LockKeyhole } from "lucide-react";
import { retrieveCertificate } from "../_lib/api";

function messageFromError(error: unknown) {
  if (!axios.isAxiosError(error)) return "Certificate service is unavailable. Try again later.";
  if (!error.response) return "Certificate service is unavailable. Try again later.";
  if (error.response.status === 404) return "This certificate UUID does not belong to your account. Check the UUID, then try again.";
  if (error.response.status === 409) return "Your certificate is not ready yet. Try again after your review is complete.";
  if (error.response.status === 429) return "Too many attempts. Wait one minute, then try again.";
  return "Certificate service is unavailable. Try again later.";
}

export function CertificateLookup({ initialUuid = "" }: { initialUuid?: string }) {
  const [uuid, setUuid] = useState(initialUuid);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");
    setDownloadUrl("");
    try {
      const result = await retrieveCertificate({ uuid: uuid.trim() });
      setDownloadUrl(result.downloadUrl);
    } catch (requestError) {
      setError(messageFromError(requestError));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  function resetResult() {
    setError("");
    setDownloadUrl("");
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={loading} className="mt-8">
      <label htmlFor="certificate-uuid" className="block text-sm font-semibold">
        Certificate UUID
      </label>
      <div className="relative mt-2">
        <KeyRound aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mc-brown-soft" />
        <input
          id="certificate-uuid"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={36}
          pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}"
          required
          value={uuid}
          onChange={(event) => { setUuid(event.target.value); resetResult(); }}
          aria-describedby="certificate-uuid-help"
          className="checkout-field min-h-13 w-full px-12 font-mono text-base placeholder:text-mc-form-muted placeholder:opacity-100"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
      </div>
      <p id="certificate-uuid-help" className="mt-2 text-sm leading-6 text-mc-form-muted">
        Find this UUID in your ModaCert confirmation email.
      </p>

      {error ? <p role="alert" className="mt-5 rounded-lg bg-mc-orange/10 px-4 py-3 text-sm font-semibold leading-6 text-mc-orange-dark">{error}</p> : null}

      {downloadUrl ? (
        <div role="status" className="mt-5 rounded-lg bg-success/10 p-4 text-success-foreground">
          <div className="flex items-start gap-3">
            <FileCheck2 aria-hidden="true" className="mt-0.5 h-5 w-5 flex-none" />
            <div>
              <p className="font-semibold">Certificate found</p>
              <p className="mt-1 text-sm leading-6">Private access expires in 10 minutes.</p>
            </div>
          </div>
          <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-mc-ink px-5 text-sm font-semibold text-white hover:bg-mc-brown">
            Open certificate PDF
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      ) : (
        <button type="submit" disabled={loading} className="checkout-primary mt-6 inline-flex min-h-13 w-full items-center justify-center gap-2 px-5 text-sm">
          {loading ? "Checking certificate…" : "Get certificate"}
          {!loading ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : null}
        </button>
      )}

      <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-mc-form-muted">
        <LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none text-mc-brown" />
        Your signed-in account and certificate UUID must belong to the same submission.
      </p>
    </form>
  );
}
