export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="card p-8 sm:p-12">
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: April 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">1. About RaceGrid</h2>
            <p>
              RaceGrid is a platform operated by GRUB FORGE LLC that connects athletes with hybrid fitness events
              organized by independent gyms and event organizers. RaceGrid provides tools for event management,
              athlete registration, and results tracking.
            </p>
            <p className="mt-2">
              RaceGrid is not a race organizer. All events listed on the platform are independently operated by
              third-party gym and event partners (&quot;Organizers&quot;).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">2. Payments and Fees</h2>
            <p>
              Registration payments are processed by Stripe, Inc. Funds collected for paid events are transferred
              directly to the event Organizer&apos;s connected Stripe account.
            </p>
            <p className="mt-2">
              <strong className="text-white">Platform fee:</strong> RaceGrid currently charges a platform fee of 0% on
              transactions. This rate is subject to change with 30 days written notice to registered gym accounts.
              Stripe&apos;s standard processing fees apply and are the responsibility of the Organizer.
            </p>
            <p className="mt-2">
              By registering for a paid event, you authorize RaceGrid and Stripe to charge the stated registration
              fee to your payment method.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">3. Refund Policy</h2>
            <p>
              Refunds are at the sole discretion of the event Organizer. RaceGrid does not issue refunds and is not
              responsible for refund decisions. To request a refund, contact the event Organizer directly using the
              contact information provided in the event listing.
            </p>
            <p className="mt-2">
              In the event of a cancellation by the Organizer, please contact them directly. RaceGrid is not
              responsible for refunds resulting from event cancellations, postponements, or changes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">4. Event Cancellations &amp; Changes</h2>
            <p>
              Events may be cancelled, postponed, or modified by Organizers. RaceGrid is not liable for any losses,
              costs, or inconveniences arising from event cancellations or changes. RaceGrid will make reasonable
              efforts to communicate material changes to registered athletes but does not guarantee notification.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">5. User Responsibilities</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>You must be 18 years of age or older to register for events.</li>
              <li>You agree to provide accurate registration information.</li>
              <li>You are responsible for your own physical condition and fitness to participate in any event.</li>
              <li>You agree to comply with all rules and waivers set by event Organizers.</li>
              <li>You agree not to misuse the platform or attempt to circumvent payment processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">6. Assumption of Risk</h2>
            <p>
              Participation in hybrid fitness and racing events involves inherent physical risk. By registering for
              any event through RaceGrid, you acknowledge and accept these risks. RaceGrid, GRUB FORGE LLC, and event
              Organizers are not liable for injuries, accidents, or damages incurred during participation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">7. Gym Accounts</h2>
            <p>
              Gyms and event organizers registering on RaceGrid agree to accurately represent their events, honor
              registrations received through the platform, and comply with all applicable laws regarding event
              management, consumer protection, and data privacy.
            </p>
            <p className="mt-2">
              RaceGrid reserves the right to suspend or terminate accounts that violate these terms, engage in
              fraudulent activity, or receive significant unresolved athlete complaints.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, GRUB FORGE LLC and RaceGrid shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising from your use of the
              platform or participation in any event. Our total liability shall not exceed the registration fee
              paid for the specific event in question.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">9. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be communicated via email to
              registered gym accounts. Continued use of RaceGrid after changes constitutes acceptance of the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">10. Contact</h2>
            <p>
              Questions about these Terms? Contact us at{' '}
              <a href="mailto:support@racegrid.fit" className="text-brand hover:underline">support@racegrid.fit</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
