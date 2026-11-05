"use client";

import { useState } from "react";
import { EVENT } from "@/lib/config";
import Countdown from "./Countdown";

const KINDS = ["Team application", "Partnership enquiry"];

export default function RegistrationCTA() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const external = Boolean(EVENT.registerUrl);
  const isOpen = Boolean(EVENT.formEndpoint);
  const mailHint = EVENT.contactEmail
    ? ` Email ${EVENT.contactEmail} instead.`
    : " Contact details will be added before applications open.";

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please complete the highlighted fields.");
      return;
    }

    if (!isOpen) {
      setStatus(
        `Applications are not open yet: this form is not connected, so nothing was sent.${mailHint}`
      );
      return;
    }

    setSending(true);
    setStatus("");
    try {
      const res = await fetch(EVENT.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("Received. We will be in touch.");
      form.reset();
    } catch {
      setStatus("Could not send. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="register"
      data-scene
      className="relative flex min-h-[100svh] flex-col justify-between gap-12 px-5 pb-10 pt-28 text-emerald sm:px-10"
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <p className="eyebrow flex items-center gap-3" data-reveal>
          <span className="dot" />
          09 — Registration
        </p>
        <h2 className="display mt-4 text-[clamp(3rem,11.5vw,10rem)]" data-reveal="0.08">
          Your cabin is waiting.
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[1400px]">
        <div
          className={`panel grid gap-10 ${
            external ? "max-w-xl" : "lg:grid-cols-[1fr_minmax(0,520px)] lg:items-start"
          }`}
          data-reveal
        >
          <div>
            <p className="text-xl font-medium sm:text-2xl">{EVENT.subtitle}</p>
            <p className="mt-2 max-w-md text-base opacity-80">
              {EVENT.dateLabel} · {EVENT.location}. Teams of two students. Seats are limited and the
              event is still proposed.
            </p>
            <Countdown className="mt-7" />

            <dl className="mt-7 grid max-w-sm grid-cols-3 gap-4 border-y border-emerald/20 py-4">
              <div>
                <dd className="display text-2xl">20</dd>
                <dt className="eyebrow mt-1 text-[0.6rem] opacity-55">Proposed teams</dt>
              </div>
              <div>
                <dd className="display text-2xl">02</dd>
                <dt className="eyebrow mt-1 text-[0.6rem] opacity-55">Per team</dt>
              </div>
              <div>
                <dd className="display text-2xl">05</dd>
                <dt className="eyebrow mt-1 text-[0.6rem] opacity-55">Finalists</dt>
              </div>
            </dl>

            <a
              href={external ? EVENT.registerUrl : "#register-form"}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="btn btn-dark mt-8"
            >
              {external ? "Register now" : isOpen ? "Reserve your seat" : "Register interest"}
              <span aria-hidden="true">→</span>
            </a>
            <p className="mt-4 text-xs leading-relaxed opacity-60">
              {isOpen
                ? EVENT.status
                : `Applications are not open until a registration service is connected. ${EVENT.status}`}
              {EVENT.contactEmail ? ` Enquiries: ${EVENT.contactEmail}.` : ""}
            </p>
          </div>

          {!external && (
            <form id="register-form" onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="eyebrow">Name</span>
                  <input
                    className="field"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">Email</span>
                  <input
                    className="field"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="eyebrow">Institution</span>
                  <input
                    className="field"
                    name="institution"
                    type="text"
                    autoComplete="organization"
                    required
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">Team name</span>
                  <input className="field" name="team" type="text" required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="eyebrow">Teammate</span>
                  <input className="field" name="teammate" type="text" autoComplete="off" />
                </label>
                <label className="grid gap-1.5">
                  <span className="eyebrow">Teammate email</span>
                  <input className="field" name="teammateEmail" type="email" autoComplete="off" />
                </label>
              </div>

              <label className="grid gap-1.5">
                <span className="eyebrow">Enquiry type</span>
                <select className="field" name="kind" defaultValue={KINDS[0]}>
                  {KINDS.map((kind) => (
                    <option key={kind}>{kind}</option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="eyebrow">Idea or message (optional)</span>
                <textarea className="field" name="message" rows={3} />
              </label>

              <button type="submit" className="btn btn-dark justify-center" disabled={sending}>
                {sending ? "Sending…" : "Send application"}
              </button>
              <p className="min-h-[2.5rem] text-sm leading-snug" role="status" aria-live="polite">
                {status}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
