const express = require('express');
const { getDb } = require('../db/database');
const { gymAuth } = require('../middleware/gymAuth');
const { sendConfirmationEmail } = require('../utils/email');

const router = express.Router();

const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const DOUBLES_CATEGORIES = ['Doubles Men', 'Doubles Women', 'Doubles Mixed'];
const ATHLETE_COUNT = { 'Doubles Men': 2, 'Doubles Women': 2, 'Doubles Mixed': 2, 'Relay': 4 };

function isDoubles(cat) { return DOUBLES_CATEGORIES.includes(cat); }
function isTeam(cat) { return DOUBLES_CATEGORIES.includes(cat) || cat === 'Relay'; }
function athleteCount(cat) { return ATHLETE_COUNT[cat] || 1; }

function createRacersFromRegistration(db, registration, event) {
  const athletes = JSON.parse(registration.athletes);
  const insertRacer = db.prepare(`
    INSERT INTO racers (event_id, first_name, last_name, team_name, category, division, age_group)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  if (isDoubles(registration.category)) {
    const names = athletes.slice(0, 2)
      .map(a => [a.first_name, a.last_name].filter(Boolean).join(' '))
      .filter(Boolean);
    const combinedName = names.join(' & ') || 'Unknown Team';
    insertRacer.run(
      event.id, null, null, combinedName,
      registration.category,
      registration.division || null,
      registration.age_group || null
    );
  } else if (registration.category === 'Relay') {
    for (const athlete of athletes) {
      insertRacer.run(
        event.id,
        athlete.first_name || null,
        athlete.last_name || null,
        registration.team_name || null,
        registration.category,
        registration.division || null,
        registration.age_group || null
      );
    }
  } else {
    const athlete = athletes[0] || {};
    insertRacer.run(
      event.id,
      athlete.first_name || null,
      athlete.last_name || null,
      null,
      registration.category,
      registration.division || null,
      registration.age_group || null
    );
  }
}

// POST /api/events/:id/checkout
router.post('/events/:id/checkout', async (req, res) => {
  const eventId = req.params.id;
  const db = getDb();

  const event = db.prepare(`
    SELECT e.*, g.stripe_account_id, g.stripe_onboarding_complete, g.gym_name as gym_display_name
    FROM events e
    LEFT JOIN gyms g ON g.id = e.gym_id
    WHERE e.id = ? AND e.is_active = 1
  `).get(eventId);

  if (!event) return res.status(404).json({ error: 'Event not found' });

  const {
    category, division, age_group, team_name,
    athletes, lead_email, waiver_agreed, waiver_name, terms_agreed,
    member_code,
  } = req.body;

  if (!category) return res.status(400).json({ error: 'Category is required' });
  if (!lead_email) return res.status(400).json({ error: 'Lead email is required' });
  if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
    return res.status(400).json({ error: 'At least one athlete is required' });
  }
  if (!terms_agreed) return res.status(400).json({ error: 'You must agree to the Terms of Service' });
  if (event.waiver_path && !waiver_agreed) {
    return res.status(400).json({ error: 'You must agree to the event waiver' });
  }
  if (event.waiver_path && (!waiver_name || !waiver_name.trim())) {
    return res.status(400).json({ error: 'Please type your full name to sign the waiver' });
  }

  // Validate member code server-side and determine unit price
  let unitPrice = event.price;
  let memberCodeApplied = false;
  if (member_code && event.member_code && event.member_price !== null) {
    if (event.member_code.trim().toLowerCase() === member_code.trim().toLowerCase()) {
      unitPrice = event.member_price;
      memberCodeApplied = true;
    }
  }

  const now = new Date().toISOString();

  if (!unitPrice || unitPrice === 0) {
    // Free event: create registration + racers directly
    const regResult = db.prepare(`
      INSERT INTO registrations (event_id, status, category, division, age_group, team_name, athletes, lead_email,
        amount_paid, waiver_agreed, waiver_agreed_at, waiver_name, terms_agreed, terms_agreed_at)
      VALUES (?, 'paid', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, ?)
    `).run(
      eventId, category, division || null, age_group || null, team_name || null,
      JSON.stringify(athletes), lead_email,
      waiver_agreed ? 1 : 0,
      waiver_agreed ? now : null,
      waiver_name ? waiver_name.trim() : null,
      now
    );

    const registration = db.prepare('SELECT * FROM registrations WHERE id = ?')
      .get(Number(regResult.lastInsertRowid));

    createRacersFromRegistration(db, registration, event);

    // Send confirmation email (fire and forget)
    const parsedAthletes = JSON.parse(registration.athletes);
    sendConfirmationEmail({ event, registration, athletes: parsedAthletes })
      .catch(e => console.error('[email] Error:', e.message));

    return res.json({ success: true, free: true, registration_id: registration.id });
  }

  // Paid event: create pending registration + Stripe Checkout session
  const regResult = db.prepare(`
    INSERT INTO registrations (event_id, status, category, division, age_group, team_name, athletes, lead_email,
      waiver_agreed, waiver_agreed_at, waiver_name, terms_agreed, terms_agreed_at)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    eventId, category, division || null, age_group || null, team_name || null,
    JSON.stringify(athletes), lead_email,
    waiver_agreed ? 1 : 0,
    waiver_agreed ? now : null,
    waiver_name ? waiver_name.trim() : null,
    now
  );

  const registrationId = Number(regResult.lastInsertRowid);

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    const count = athleteCount(category);
    const priceLabel = `$${(unitPrice / 100).toFixed(2)}/person${memberCodeApplied ? ' (member)' : ''}`;

    const sessionParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: unitPrice,
          product_data: {
            name: `${event.event_name} Registration`,
            description: count > 1 ? `${count} athletes × ${priceLabel}` : memberCodeApplied ? 'Member pricing applied' : undefined,
          },
        },
        quantity: count,
      }],
      allow_promotion_codes: true,
      success_url: `${APP_URL}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/events/${eventId}`,
      metadata: {
        registration_id: String(registrationId),
        event_id: String(eventId),
      },
      customer_email: lead_email,
    };

    if (event.stripe_account_id && event.stripe_onboarding_complete) {
      sessionParams.payment_intent_data = {
        application_fee_amount: 0,
        transfer_data: { destination: event.stripe_account_id },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    db.prepare('UPDATE registrations SET stripe_session_id = ? WHERE id = ?')
      .run(session.id, registrationId);

    return res.json({ url: session.url });
  } catch(e) {
    console.error('Stripe checkout error:', e.message);
    db.prepare('DELETE FROM registrations WHERE id = ?').run(registrationId);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/webhooks/stripe  (raw body, registered in index.js)
router.post('/webhooks/stripe', async (req, res) => {
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch(e) {
    console.error('Webhook signature error:', e.message);
    return res.status(400).json({ error: `Webhook error: ${e.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const registrationId = session.metadata?.registration_id;

    const db = getDb();
    let registration;

    if (registrationId) {
      registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registrationId);
    }
    if (!registration) {
      registration = db.prepare('SELECT * FROM registrations WHERE stripe_session_id = ?').get(session.id);
    }

    if (registration && registration.status !== 'paid') {
      const amountPaid = session.amount_total || 0;
      db.prepare(
        "UPDATE registrations SET status = 'paid', amount_paid = ? WHERE id = ?"
      ).run(amountPaid, registration.id);

      const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(registration.event_id);
      if (ev) {
        const updatedReg = db.prepare('SELECT * FROM registrations WHERE id = ?').get(registration.id);
        createRacersFromRegistration(db, updatedReg, ev);

        // Send confirmation email after paid registration
        const parsedAthletes = JSON.parse(updatedReg.athletes);
        const regWithAmount = { ...updatedReg, amount_paid: amountPaid };
        sendConfirmationEmail({ event: ev, registration: regWithAmount, athletes: parsedAthletes })
          .catch(e => console.error('[email] Error:', e.message));
      }
    }
  }

  res.json({ received: true });
});

// GET /api/registration/confirmation — fetch details for success page
router.get('/registration/confirmation', (req, res) => {
  const { session_id, reg } = req.query;
  if (!session_id && !reg) return res.status(400).json({ error: 'Missing session_id or reg' });

  const db = getDb();
  let registration;

  if (session_id) {
    registration = db.prepare('SELECT * FROM registrations WHERE stripe_session_id = ?').get(session_id);
  } else {
    registration = db.prepare("SELECT * FROM registrations WHERE id = ? AND status = 'paid'").get(reg);
  }

  if (!registration) return res.status(404).json({ error: 'Registration not found' });

  const event = db.prepare(`
    SELECT id, event_name, event_date, location, gym_name, event_type, price
    FROM events WHERE id = ?
  `).get(registration.event_id);

  if (!event) return res.status(404).json({ error: 'Event not found' });

  res.json({
    registration: {
      id: registration.id,
      category: registration.category,
      division: registration.division,
      age_group: registration.age_group,
      team_name: registration.team_name,
      lead_email: registration.lead_email,
      amount_paid: registration.amount_paid,
      athletes: (() => { try { return JSON.parse(registration.athletes); } catch { return []; } })(),
    },
    event,
  });
});

// GET /api/events/:id/registrations (gym auth, gym must own event)
router.get('/events/:id/registrations', gymAuth, (req, res) => {
  const db = getDb();
  const event = db.prepare('SELECT id, gym_id FROM events WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.gym_id !== req.gym.id) return res.status(403).json({ error: 'Access denied' });

  const registrations = db.prepare(`
    SELECT * FROM registrations WHERE event_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  const parsed = registrations.map(r => ({
    ...r,
    athletes: (() => { try { return JSON.parse(r.athletes); } catch { return []; } })(),
  }));

  res.json(parsed);
});

module.exports = router;
