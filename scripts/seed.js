// Seed script - creates one demo event with ~50 racers and times
// Run with: node scripts/seed.js

const BASE = 'http://localhost:3001/api';
const PIN = '1234';

const FIRST_NAMES_M = ['James','Liam','Noah','Oliver','Ethan','Mason','Logan','Lucas','Jackson','Aiden','Carter','Owen','Ryan','Hunter','Caleb','Nolan','Blake','Dylan','Cole','Finn'];
const FIRST_NAMES_F = ['Emma','Olivia','Ava','Sophia','Isabella','Mia','Charlotte','Amelia','Harper','Evelyn','Abigail','Emily','Ella','Taylor','Avery','Scarlett','Grace','Chloe','Riley','Zoey'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Allen','Clark'];
const TEAM_NAMES = ['Iron Wolves','Peak Force','Grid Runners','Apex Duo','Storm Pair','Volt Squad','Rush Team','Blaze Crew','Forge & Fire','Carbon Pair','Echo Unit','Delta Push','Nitro Twins','Titan Pair','Surge & Grind'];

const AGE_GROUPS = ['Open','Open','Open','Open','Pro','40-49','40-49','50-59','60-69'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const out = [];
  const copy = [...arr];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i,1)[0]);
  }
  return out;
}

// Generate a realistic finish time in seconds (45min - 2hr range)
function randomTime(minSecs = 2700, maxSecs = 7200) {
  return minSecs + Math.floor(Math.random() * (maxSecs - minSecs));
}

function secsToStr(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

async function post(path, body, pin) {
  const headers = { 'Content-Type': 'application/json' };
  if (pin) headers['X-Event-Pin'] = String(pin);
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`POST ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function put(path, body, pin) {
  const headers = { 'Content-Type': 'application/json' };
  if (pin) headers['X-Event-Pin'] = String(pin);
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(`PUT ${path} failed: ${JSON.stringify(data)}`);
  return data;
}

async function seed() {
  console.log('🌱 Seeding demo event...\n');

  // 1. Create event
  const event = await post('/events', {
    event_name: 'RaceGrid Open 2026',
    gym_name: 'Iron Athletics',
    location: 'Austin, TX',
    event_date: '2026-05-17',
    event_type: JSON.stringify(['Solo Men','Solo Women','Doubles Men','Doubles Women','Doubles Mixed','Relay']),
    description: 'Our flagship annual hybrid fitness sim race. All categories open. Come race for the podium.',
    pin: PIN,
  });
  console.log(`✅ Event created: "${event.event_name}" (ID: ${event.id})`);

  // 2. Build racer list
  const racers = [];

  // Solo Men - 12 racers
  const maleNames = pickN(FIRST_NAMES_M, 12);
  const maleLast  = Array.from({length:12}, () => pick(LAST_NAMES));
  for (let i = 0; i < 12; i++) {
    racers.push({ first_name: maleNames[i], last_name: maleLast[i], category: 'Solo Men', age_group: pick(AGE_GROUPS), bib_number: String(100 + i + 1) });
  }

  // Solo Women - 10 racers
  const femaleNames = pickN(FIRST_NAMES_F, 10);
  const femaleLast  = Array.from({length:10}, () => pick(LAST_NAMES));
  for (let i = 0; i < 10; i++) {
    racers.push({ first_name: femaleNames[i], last_name: femaleLast[i], category: 'Solo Women', age_group: pick(AGE_GROUPS), bib_number: String(200 + i + 1) });
  }

  // Doubles Men - 6 teams
  for (let i = 0; i < 6; i++) {
    racers.push({ team_name: TEAM_NAMES[i] + ' (M)', category: 'Doubles Men', age_group: pick(AGE_GROUPS), bib_number: String(300 + i + 1) });
  }

  // Doubles Women - 5 teams
  for (let i = 0; i < 5; i++) {
    racers.push({ team_name: TEAM_NAMES[6 + i] + ' (F)', category: 'Doubles Women', age_group: pick(AGE_GROUPS), bib_number: String(400 + i + 1) });
  }

  // Doubles Mixed - 7 teams
  for (let i = 0; i < 7; i++) {
    racers.push({ team_name: TEAM_NAMES[(i + 3) % TEAM_NAMES.length] + ' (MX)', category: 'Doubles Mixed', age_group: pick(AGE_GROUPS), bib_number: String(500 + i + 1) });
  }

  // Relay - 5 teams
  for (let i = 0; i < 5; i++) {
    racers.push({ team_name: 'Relay ' + TEAM_NAMES[(i + 8) % TEAM_NAMES.length], category: 'Relay', age_group: 'Open', bib_number: String(600 + i + 1) });
  }

  // DNF placeholders (2)
  racers.push({ first_name: 'Alex', last_name: 'Turner', category: 'Solo Men', age_group: 'Open', bib_number: '199', _dnf: true });
  racers.push({ first_name: 'Jordan', last_name: 'Reed', category: 'Solo Women', age_group: 'Open', bib_number: '299', _dnf: true });

  // 3. Add racers
  console.log(`\n👥 Adding ${racers.length} racers...`);
  const added = [];
  for (const r of racers) {
    const { _dnf, ...body } = r;
    const racer = await post(`/events/${event.id}/racers`, body, PIN);
    added.push({ ...racer, _dnf });
    process.stdout.write('.');
  }
  console.log(' done');

  // 4. Enter times
  // Solo men: 55-90 min. Solo women: 58-95 min. Doubles: 50-85 min. Relay: 45-75 min.
  const timeRanges = {
    'Solo Men':      [3300, 5400],
    'Solo Women':    [3480, 5700],
    'Doubles Men':   [3000, 5100],
    'Doubles Women': [3180, 5400],
    'Doubles Mixed': [3090, 5250],
    'Relay':         [2700, 4500],
  };

  console.log('\n⏱  Entering finish times...');
  for (const racer of added) {
    if (racer._dnf) {
      await put(`/racers/${racer.id}/result`, { dnf: true }, PIN);
      process.stdout.write('x');
    } else {
      const [min, max] = timeRanges[racer.category] || [3300, 5400];
      const secs = randomTime(min, max);
      await put(`/racers/${racer.id}/result`, { finish_time: secsToStr(secs) }, PIN);
      process.stdout.write('.');
    }
  }
  console.log(' done');

  console.log(`\n🎉 Seed complete!`);
  console.log(`   Event ID : ${event.id}`);
  console.log(`   PIN      : ${PIN}`);
  console.log(`   View     : http://localhost:5173/events/${event.id}`);
  console.log(`   Manage   : http://localhost:5173/events/${event.id}/manage`);
}

seed().catch(e => { console.error('\n❌', e.message); process.exit(1); });
