/*
  Real Hourly Rate calculator.

  Reuses the tax engine in tax-calc.js directly (computeBreakdown/splitPackage) rather
  than reimplementing brackets/Medicare/LITO here — tax-calc.js must be loaded on this
  page before this file. In gross mode we call it with hasHecs=false, hasCover=true (no
  HECS, no Medicare Levy Surcharge) and no family/sacrifice complications, since this
  calculator is a simple "what's my real rate" tool, not a full return.
*/

// Big-ticket items only — a week of take-home pay or more. Deliberately excludes daily
// items like coffee or takeaway (see the lesson this supports: pricing those in hours
// "is a route to misery"). AUD figures, sourced 2026, see PRICE_SOURCES below.
const HOURLY_ITEMS = [
  { label: 'Used car', amount: 18000 },
  { label: 'Laptop + phone bundle', amount: 2200 },
  { label: 'Gaming setup (PC, monitor, peripherals)', amount: 1500 },
  { label: 'Home entertainment system (TV + soundbar)', amount: 1550 },
  { label: 'Designer handbag (entry-level)', amount: 2090 },
  { label: 'Engagement ring', amount: 6842 },
  { label: 'A year of private school fees', amount: 27500 },
  { label: 'New car / SUV', amount: 45000 },
  { label: 'Overseas holiday for two (2 weeks)', amount: 14600 },
  { label: 'Kitchen renovation (mid-range)', amount: 35000 },
  { label: 'Australian wedding', amount: 38252 },
  { label: '20% deposit on a median Australian home', amount: 182500 },
];

const FREQ_WEEKS = { yearly: 1, monthly: 1, fortnightly: 1, weekly: 1 };
// Multiplier to get from one pay period to an annual figure.
const TO_ANNUAL = { yearly: 1, monthly: 12, fortnightly: 26, weekly: 52 };

function formatAUD(n){
  const v = Number(n);
  if(!isFinite(v)) return '$0';
  return (v < 0 ? '-$' : '$') + Math.abs(Math.round(v)).toLocaleString('en-AU');
}

function readPositive(id, fallback){
  const el = document.getElementById(id);
  if(!el) return fallback;
  const v = parseFloat(el.value);
  return (isFinite(v) && v > 0) ? v : fallback;
}

function updateModeVisibility(){
  const mode = document.getElementById('hrMode').value;
  document.getElementById('hrGrossField').hidden = mode !== 'gross';
  document.getElementById('hrNetField').hidden = mode !== 'net';
  document.querySelector('label[for="hrIncome"]').textContent =
    mode === 'gross' ? 'Gross pay (before tax)' : 'Net pay (take-home, after tax)';
}

function annualiseHours(hoursPerWeek){
  return hoursPerWeek * 52;
}

function calculateHourlyRate(){
  const mode = document.getElementById('hrMode').value; // 'gross' | 'net'
  const freq = document.getElementById('hrFreq').value;  // 'yearly' | 'monthly' | 'fortnightly' | 'weekly'
  const rawPay = readPositive('hrIncome', 0);
  const hoursPerWeek = readPositive('hrHours', 38);

  const annualInput = rawPay * TO_ANNUAL[freq];

  let annualNet, taxAmt = 0, medicareAmt = 0;
  if(mode === 'gross'){
    // No HECS, private cover assumed (skips MLS), no spouse/children, no salary sacrifice —
    // this tool is a quick "what's my real rate" estimate, not a full tax return. Anyone
    // needing those factors modelled should use the full Tax Calculator.
    const { salaryForTax } = splitPackage(annualInput, 'on-top');
    const breakdown = computeBreakdown(salaryForTax, false, true, false, 0, 0);
    annualNet = breakdown.net;
    taxAmt = breakdown.taxAfterLito;
    medicareAmt = breakdown.medicareAmt;
  } else {
    annualNet = annualInput;
  }

  const annualHours = annualiseHours(hoursPerWeek);
  const hourlyRate = annualHours > 0 ? annualNet / annualHours : 0;

  renderResult({ mode, annualInput, annualNet, taxAmt, medicareAmt, hoursPerWeek, annualHours, hourlyRate });
}

function renderResult(r){
  document.getElementById('hrResult').hidden = false;

  document.getElementById('hrHeadlineRate').textContent = formatAUD(r.hourlyRate) + '/hour';
  document.getElementById('hrHeadlineSub').textContent =
    `Based on ${formatAUD(r.annualNet)} take-home a year, over ${r.hoursPerWeek} hours a week (${r.annualHours.toLocaleString('en-AU')} hours a year).`;

  const rows = [];
  if(r.mode === 'gross'){
    rows.push(['Gross pay (annualised)', formatAUD(r.annualInput)]);
    rows.push(['Income tax + Medicare levy', '−' + formatAUD(r.taxAmt + r.medicareAmt)]);
  }
  rows.push(['Take-home pay (annual)', formatAUD(r.annualNet)]);
  rows.push(['Hours worked per year', r.annualHours.toLocaleString('en-AU') + ' hours']);
  rows.push(['Real hourly rate', formatAUD(r.hourlyRate) + '/hour']);
  document.querySelector('#hrBreakdownTable tbody').innerHTML = rows.map(([k,v]) =>
    `<tr><td>${k}</td><td class="mono-cell">${v}</td></tr>`
  ).join('');

  const itemRows = HOURLY_ITEMS
    .map(item => ({ ...item, hours: r.hourlyRate > 0 ? item.amount / r.hourlyRate : 0 }))
    .sort((a,b) => a.amount - b.amount);

  document.querySelector('#hrItemsTable tbody').innerHTML = itemRows.map(item => {
    const hours = item.hours;
    const weeks = r.hoursPerWeek > 0 ? hours / r.hoursPerWeek : 0;
    const years = weeks / 52;
    const yearsStr = years >= 1 ? years.toFixed(1) + ' yrs' : (weeks).toFixed(1) + ' wks';
    return `<tr><td>${item.label}</td><td class="mono-cell">${formatAUD(item.amount)}</td>` +
      `<td class="mono-cell">${Math.round(hours).toLocaleString('en-AU')}</td>` +
      `<td class="mono-cell">${weeks.toFixed(1)}</td>` +
      `<td class="mono-cell">${yearsStr}</td></tr>`;
  }).join('');

  document.getElementById('hrResult').scrollIntoView({behavior:'smooth', block:'nearest'});
}

document.getElementById('hrMode').addEventListener('change', updateModeVisibility);
document.getElementById('hrCalcBtn').addEventListener('click', calculateHourlyRate);
updateModeVisibility();
