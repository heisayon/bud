const effectiveDate = "February 7, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="glass rounded-3xl p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Bud
        </p>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Effective date: {effectiveDate}
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <p>
            These terms govern your use of Bud. By using Bud, you agree to these
            terms. If you do not agree, do not use the service.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            The Service
          </h2>
          <p>
            Bud helps you generate playlists and connect to third-party services
            like Spotify and YouTube. Those services have their own terms and
            policies that also apply.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Accounts and Access
          </h2>
          <p>
            You are responsible for maintaining the security of your accounts
            and any connected services.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Acceptable Use
          </h2>
          <p>
            Do not misuse the service, attempt to access unauthorized data, or
            violate the terms of third-party services.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Availability
          </h2>
          <p>
            We may modify or discontinue parts of the service at any time. We
            do not guarantee uninterrupted availability.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Disclaimer
          </h2>
          <p>
            Bud is provided "as is" without warranties of any kind. Use the
            service at your own risk.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Bud is not liable for
            indirect or consequential damages arising from your use of the
            service.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Termination
          </h2>
          <p>
            You may stop using Bud at any time. We may suspend or terminate
            access if we believe the service is being misused.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Changes
          </h2>
          <p>
            We may update these terms. We will post the updated version on this
            page with a new effective date.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Contact
          </h2>
          <p>
            Questions about these terms? Email{" "}
            <span className="text-[var(--accent)]">heisayon@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
