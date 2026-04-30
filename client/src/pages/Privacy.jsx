export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="card p-8 sm:p-12">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">1. Introduction</h2>
            <p>
              GRUB FORGE LLC (&quot;we,&quot; &quot;us,&quot; or &quot;RaceGrid&quot;) is committed to protecting your privacy. This
              Privacy Policy describes how we collect, use, and share information when you use the RaceGrid
              platform at racegrid.app.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-white font-semibold mb-2">From athletes registering for events:</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Name (first and last)</li>
              <li>Email address</li>
              <li>Team name (if applicable)</li>
              <li>Event registration details (category, division, age group)</li>
              <li>Agreement timestamps for terms and waivers</li>
            </ul>
            <h3 className="text-white font-semibold mb-2">From gym/organizer accounts:</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Email address and password (hashed)</li>
              <li>Gym name and location</li>
              <li>Stripe Connect account information (handled by Stripe)</li>
            </ul>
            <h3 className="text-white font-semibold mb-2">Payment information:</h3>
            <p>
              Payment card details are collected and processed directly by Stripe, Inc. RaceGrid never stores
              your full card number, CVV, or other sensitive payment data. We receive only a transaction
              confirmation and the amount charged.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>To process and confirm your event registration</li>
              <li>To provide event management tools to Organizers</li>
              <li>To display results and leaderboards for events you participate in</li>
              <li>To communicate important updates about events you&apos;ve registered for</li>
              <li>To improve the RaceGrid platform and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">4. Sharing Your Information</h2>
            <p>
              We do not sell your personal information to third parties.
            </p>
            <p className="mt-2">We share information with:</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>
                <strong className="text-white">Event Organizers:</strong> Your registration details (name, category, email)
                are shared with the gym or organizer running the event you registered for.
              </li>
              <li>
                <strong className="text-white">Stripe:</strong> Payment processing is handled by Stripe, Inc. Your
                payment information is subject to{' '}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-dim"
                >
                  Stripe&apos;s Privacy Policy
                </a>.
              </li>
              <li>
                <strong className="text-white">Legal requirements:</strong> We may disclose information when required
                by law or to protect the rights and safety of RaceGrid, users, or the public.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">5. Public Information</h2>
            <p>
              Event results and leaderboards (name, category, finish time) may be publicly displayed on event
              pages. If you do not want your results displayed, contact the event Organizer or reach out to us
              at the email below.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your registration and result data for as long as the associated event exists on the
              platform, and for a reasonable period thereafter for record-keeping purposes. Gym accounts retain
              data for the lifetime of the account. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">7. Security</h2>
            <p>
              We use industry-standard practices to protect your data, including encrypted connections (HTTPS),
              hashed passwords, and access controls. No system is 100% secure; we encourage you to use a
              strong, unique password for your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">8. Your Rights</h2>
            <p>
              You have the right to request access to, correction of, or deletion of your personal information.
              To exercise these rights, contact us at the email below. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">9. Cookies</h2>
            <p>
              RaceGrid uses minimal browser storage (localStorage) to maintain your login session. We do not
              use third-party tracking cookies or advertising trackers.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">10. Contact</h2>
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:support@racegrid.fit" className="text-brand hover:underline">support@racegrid.fit</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
