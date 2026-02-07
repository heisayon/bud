const effectiveDate = "February 7, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="glass rounded-3xl p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Bud
        </p>
        <h1 className="mt-3 text-2xl font-semibold md:text-3xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Effective date: {effectiveDate}
        </p>

        <section className="mt-8 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <p>
            Bud respects your privacy. This policy explains what we collect, how
            we use it, and your choices.
          </p>
          <p>
            By using Bud, you agree to this policy. If you do not agree, please
            do not use the service.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Information We Collect
          </h2>
          <p>
            Account information you provide, like your email address and
            authentication details.
          </p>
          <p>
            OAuth tokens and identifiers from connected services (Spotify and
            YouTube). We store refresh tokens to keep your connection active.
          </p>
          <p>
            Playlist requests and generated playlist data used to create and
            manage your playlists.
          </p>
          <p>
            Basic usage data needed to operate and improve the service.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            How We Use Information
          </h2>
          <p>
            To authenticate you, connect your Spotify or YouTube account, and
            create playlists on your behalf.
          </p>
          <p>
            To provide support, improve features, and keep the service secure.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Sharing
          </h2>
          <p>
            We share data only with the third-party services you connect (Spotify
            and YouTube) and infrastructure providers needed to run Bud.
          </p>
          <p>We do not sell your personal information.</p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Data Retention
          </h2>
          <p>
            We retain data for as long as your account is active. You can
            disconnect integrations or request deletion of your data.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Your Choices
          </h2>
          <p>
            You can disconnect Spotify or YouTube at any time from the Bud
            dashboard.
          </p>
          <p>
            To request data deletion, email us at{" "}
            <span className="text-[var(--accent)]">heisayon@gmail.com</span>.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Security
          </h2>
          <p>
            We take reasonable measures to protect your data, but no system is
            100 percent secure.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Changes
          </h2>
          <p>
            We may update this policy. We will post the updated version on this
            page with a new effective date.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-sm leading-6 text-[var(--text)]/90">
          <h2 className="text-base font-semibold text-[var(--text)]">
            Contact
          </h2>
          <p>
            Questions about privacy? Email{" "}
            <span className="text-[var(--accent)]">heisayon@gmail.com</span>.
          </p>
        </section>
      </div>
    </main>
  );
}
