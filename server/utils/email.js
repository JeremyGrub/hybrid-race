const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatAmount(cents) {
  if (!cents || cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(2)}`;
}

function buildAthleteDisplay(athletes, teamName, category) {
  const DOUBLES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed'];
  if (teamName && !DOUBLES.includes(category)) return teamName;
  if (!athletes || !athletes.length) return '—';
  return athletes
    .map(a => [a.first_name, a.last_name].filter(Boolean).join(' '))
    .filter(Boolean)
    .join(' & ');
}

function buildEmailHtml({ event, registration, athletes }) {
  const athleteDisplay = buildAthleteDisplay(athletes, registration.team_name, registration.category);
  const amountDisplay = formatAmount(registration.amount_paid);
  const eventUrl = `${APP_URL}/events/${event.id}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Registration Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.12);">

    <!-- Header -->
    <div style="background:#111111;padding:28px 40px;text-align:center;">
      <span style="font-size:26px;font-weight:900;letter-spacing:0.12em;color:#c8ff00;text-transform:uppercase;">RaceGrid</span>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:40px;">

      <!-- Hero -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;width:60px;height:60px;background:#f0ffe0;border-radius:50%;line-height:60px;font-size:28px;margin-bottom:16px;">✓</div>
        <h1 style="margin:0 0 8px;font-size:26px;font-weight:900;color:#111111;text-transform:uppercase;letter-spacing:0.04em;">You&rsquo;re Registered!</h1>
        <p style="margin:0;color:#666666;font-size:15px;">Your spot is confirmed for race day.</p>
      </div>

      <!-- Event details -->
      <div style="background:#f7f7f7;border-radius:10px;padding:24px;margin-bottom:28px;">
        <h2 style="margin:0 0 18px;font-size:17px;font-weight:800;color:#111111;text-transform:uppercase;letter-spacing:0.06em;">${event.event_name}</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:5px 0;color:#888888;width:110px;vertical-align:top;">Date</td>
            <td style="padding:5px 0;color:#111111;font-weight:600;">${formatDate(event.event_date)}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#888888;vertical-align:top;">Location</td>
            <td style="padding:5px 0;color:#111111;font-weight:600;">${event.location}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#888888;vertical-align:top;">Gym</td>
            <td style="padding:5px 0;color:#111111;font-weight:600;">${event.gym_name}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#888888;vertical-align:top;">Category</td>
            <td style="padding:5px 0;color:#111111;font-weight:600;">${registration.category}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#888888;vertical-align:top;">Athlete(s)</td>
            <td style="padding:5px 0;color:#111111;font-weight:600;">${athleteDisplay}</td>
          </tr>
          <tr>
            <td style="padding:5px 0;color:#888888;vertical-align:top;">Amount</td>
            <td style="padding:5px 0;font-weight:700;color:${amountDisplay === 'Free' ? '#16a34a' : '#111111'};">${amountDisplay}</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${eventUrl}"
           style="display:inline-block;background:#c8ff00;color:#111111;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;padding:14px 36px;border-radius:8px;text-decoration:none;">
          View Event Page
        </a>
      </div>

      <p style="margin:0;color:#aaaaaa;font-size:13px;text-align:center;">
        Questions? Reach out to <strong style="color:#888888;">${event.gym_name}</strong> directly.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:18px 40px;text-align:center;">
      <p style="margin:0;color:#aaaaaa;font-size:12px;">
        Powered by <strong style="color:#888888;">RaceGrid</strong> &middot;
        <a href="${APP_URL}" style="color:#aaaaaa;text-decoration:none;">racegrid.fit</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

async function sendConfirmationEmail({ event, registration, athletes }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[email] No RESEND_API_KEY set — skipping confirmation email');
    return;
  }

  const from = process.env.EMAIL_FROM || 'RaceGrid <noreply@racegrid.fit>';
  const to = registration.lead_email;
  const subject = `You're registered for ${event.event_name}!`;
  const html = buildEmailHtml({ event, registration, athletes });

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[email] Resend error:', err);
    } else {
      console.log(`[email] Confirmation sent to ${to}`);
    }
  } catch (e) {
    console.error('[email] Failed to send confirmation:', e.message);
  }
}

module.exports = { sendConfirmationEmail };
