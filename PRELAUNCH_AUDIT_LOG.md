# Pre-Launch Audit Log — Shariah Invest AU

Started 2026-09-30, run autonomously overnight per explicit instruction. Uses the existing
Puppeteer/axe-core audit toolkit in `shariah-invest-au-audit/` rather than rebuilding checks
from scratch — that toolkit already existed and was built for exactly this purpose.

Local server: `python -m http.server 8000` in `shariah-invest-au/`, real Chrome via Puppeteer,
not a simulated headless-only pass.

Findings organized by severity (breaking / significant / minor / cosmetic) further down. This
top section is a running log of what was run and what it found, in order.

---

## Run log

**Link check (run directly, not delegated):** `node link-check.js` in the audit folder — 357 pages
checked. 0 broken internal links/assets, 0 duplicate element IDs, 0 broken same-page anchors.
16 external origins referenced across the site (footnote citations, provider comparison pages,
etc.), listed in the script's own output.

**Work delegated to four parallel background agents** (per explicit instruction to use the right
agent and model for each task), each with its own findings log, merged into this file once all
four complete:
- Course content deep audit (Opus) → `AUDIT_STEP2_COURSE.md`
- Calculator math verification (Opus, since verifying arithmetic correctness needs real reasoning,
  not just running existing scripts) → `AUDIT_STEP3_CALCULATORS.md`
- Technical/SEO/accessibility/performance/security (Sonnet, mostly running and interpreting
  existing test tooling) → `AUDIT_STEP146_TECHNICAL.md`
- Trust signals / content consistency / no internal names leaking (Sonnet) → `AUDIT_STEP5_TRUST.md`

Each agent was told explicitly not to touch the others' files, not to commit/push, and to log
findings by severity. Final merge and go/no-go verdict below once all four report back.

**Step 5 (trust signals) COMPLETE.** Full detail in `AUDIT_STEP5_TRUST.md`. Summary:
- BREAKING, fixed: the paid course (46 lessons, paywall not on) was labeled "Free course, 46
  lessons" in the nav dropdown on all 357 pages — root cause traced to `lib/layout.js` pulling a
  stale hardcoded field from `learn.json`'s `course.navDesc`. Fixed at the layout-generator level
  (description no longer claims free/paid either way, since that's a pricing decision, not a
  copy-editing one) and rebuilt. Same mislabel found and fixed directly in 9 hand-written guide
  pages' cross-link callouts.
- SIGNIFICANT, flagged not fixed — genuinely needs his decision: **no contact email exists
  anywhere on the live site**, despite the Privacy page and About FAQ both implying one exists.
  Cannot invent an address. Needs his call on what to publish.
- MINOR, fixed: a stale "DRAFT ADDITION" code comment in `learn-progress.js`, cosmetic only.
- Everything else checked clean: disclaimers consistent, no branding variants, no leaked internal
  names (HalalMoneyAU/Rushd/rejected domain), no lorem ipsum/TODO, favicon consistent site-wide.

**Step 3 (calculators) COMPLETE.** Full detail in `AUDIT_STEP3_CALCULATORS.md`. Real wrong-answer
bugs found and fixed, not just runs-without-erroring checks — a genuinely useful pass:
- BREAKING, fixed: zakat calculator race condition (rapid gold/silver switching could apply the
  wrong metal's price, real case reproduced: $20k holder wrongly told $0 owed when $500 was due).
- BREAKING, fixed: tax calculator ignored salary sacrifice in both HECS repayment and Medicare
  Levy Surcharge calculations (real cases overstated take-home by $3,000 and hid a $1,000 MLS bill).
- BREAKING, fixed: Medicare levy overcharged for low-income families with children in the
  shade-in band (real case: 3 kids on $74k charged $1,480 instead of $1,374.80).
- SIGNIFICANT, fixed: zakat ASX ticker field lost focus every keystroke (typing "BHP" left "B",
  lookup effectively broken); all four calculators kept stale results after input changes instead
  of recalculating; tax calculator let salary sacrifice exceed salary; hourly-rate calculator
  rounded to whole dollars instead of cents; hourly-rate hours field accepted 0/500 outside its
  own stated 1-100 range; growth calculator's year input silently rounded without updating the
  displayed value; growth chart mislabelled large balances ("$50000k" instead of "$50m"); tax
  calculator's intro text wrongly claimed it doesn't handle dependants when it does.
- Verified against a real, independently-computed checkpoint: $80,000 gross nets $63,880 ($14,520
  income tax + $1,600 Medicare levy), matching the figure used throughout the course content.
- Added a new permanent test, `calc-math-verify.js` (56 checks), scored 32/56 against the
  pre-fix code (reproducing every bug above) and 56/56 post-fix with 0 console errors.
- 4 items the agent flagged as decisions rather than fixing outright — resolved myself, since he's
  asleep and explicitly asked for exactly this:
  1. **Hourly-rate calculator's week basis**: was counting 52 weeks/year, which treats paid leave
     and public holidays as "hours worked" and understates the real hourly rate by ~11% ($32.33
     vs ~$36.50 on the site's own $63,880/38hrs benchmark). Changed to 46 working weeks (4 weeks
     annual leave + ~10 public holidays), matching the standard "real hourly rate" convention and
     the site's own stated ethos of showing the honest number rather than the flattering one.
     Checked first that no course lesson quotes a specific hourly figure (only one related-link
     reference exists, no number to update). Updated both permanent test suites' hardcoded
     expected values to match (they were asserting the old 52-week figures, which would have
     been false failures otherwise) — recomputed by hand, then re-ran both suites clean: 56/56
     and 38/38.
  2. **Paywalled copy had stale calculator code**: ran `node build-gated.mjs`, the actual documented
     workflow for this (copies the live site into a separate `paywall/dist-site/` folder, never
     touches the live site itself, no deployment happens). Leak check clean, 0 leaks.
  3. **Medicare levy low-income thresholds**: verified against a fresh search — $28,011 single /
     $47,238 family / $4,338 per child for FY2026-27 all confirmed correct as already implemented.
     No fix needed.
  4. **Em dashes in existing zakat-calculator on-screen text**: this site has a standing hard rule,
     never use em dashes in any text, set earlier by him this same session. Fixed all instances
     found (both in the HTML and in dynamically-generated result strings in `zakat-calc.js`),
     replaced with commas or periods depending on context. Confirmed the one test that checks
     result-text content (`calc-test.js`) only asserts a substring prefix, not the exact
     punctuation, so nothing broke, re-ran clean.

**Step 1/4/6 (technical/SEO/accessibility/performance/security) COMPLETE.** Full detail in
`AUDIT_STEP146_TECHNICAL.md`. Clean pass, two real fixes:
- SIGNIFICANT, fixed: the live site root doubles as the git working copy (`.git/` with full
  history sits inside the publish directory). Added `/.git/* → /404.html 404!` to `_redirects`
  as defense-in-depth. Worth a 30-second manual check post-deploy that `.git/HEAD` actually 404s
  on the real host, since redirect-rule behavior can vary by platform.
- MINOR, fixed: hourly-rate-calculator's title tag was 66 chars (over the 62-char practical
  limit), shortened to 58.
- Everything else verified with real tooling, not assumed: SEO/meta (clean), 714 JSON-LD blocks
  (0 problems), accessibility (16/16 axe-core checks, contrast confirmed against live CSS),
  noindex count exactly right (2 intentional + 404.html itself), sitemap/robots.txt current,
  security (no exposed secrets/keys, CSP clean across 6 pages), all 5 redirect rules individually
  verified both directions, and — specifically re-tested since it was today's other real bug —
  the nav dropdown overflow fix holds clean at 375/768/1440px with zero console errors.
- One thing flagged, not fixed, on purpose: homepage Total Blocking Time runs ~1.2s only under
  heavy synthetic throttling (4x CPU + slow 4G); the 5-run median and real payload size (65KB
  gzipped) are both fine. Correctly treated as noise rather than risking a fix that breaks
  something for a number that doesn't reflect real conditions.
- Verdict: technically launch-ready.

**Step 2 (course content) COMPLETE — the largest pass, and it found real, serious bugs.** Full
detail in `AUDIT_STEP2_COURSE.md`. This was not a clean pass; several genuinely breaking issues
were found and fixed:

- **BREAKING, fixed: a real money bug I (the orchestrating session) introduced yesterday.** Four
  lessons carried "Tier 3, coming soon, A$29" teaser callouts I added during yesterday's content
  pass. Tier 3 doesn't exist. Worse: the `/api/checkout?tier=3` link they pointed at doesn't fail
  gracefully, it falls through to the real Tier 2 Stripe checkout and would have charged a real
  visitor **A$199** for clicking a button that promised something else entirely for $29. All 5
  instances removed; exact original text preserved in
  `shariah-invest-au-build/content/backups-audit-step2-2026-10-01/removed-blocks.json` in case
  Tier 3 and a real checkout exist later. Decided: leave removed until that's real (see below).
- **BREAKING, fixed: skip-banner's jump-to-new-content anchor was silently broken** on the
  Compounding lesson after yesterday's "remove the folded-paper example" edit deleted the section
  the anchor was attached to. Re-anchored to "The chessboard" section, updated the test's stale
  expectations to match.
- **BREAKING, fixed: "What happens when you buy a share" was left half-edited** from yesterday's
  $100→$100,000 rescale — the live page showed both the old and new dollar figures simultaneously,
  a paragraph was stored in a block type that never renders, and a paragraph a quiz question
  depends on had gone missing entirely. Rebuilt properly.
- **BREAKING, fixed: 6 quiz questions contradicted their own lesson's body content** — including
  one testing a section (offset accounts) removed from the lesson entirely yesterday, one using
  an invented dollar figure not stated anywhere in the lesson, and one where the "correct" answer
  directly contradicted the lesson's own worked table. All corrected to match actual content.
- **BREAKING, fixed: a genuine numeric contradiction between the two courses** on the exact same
  compounding example ($12k/yr at 10% over 30 years) — one course said $1.97M, the other $2.17M
  (the correct, locked figure). Both now show $2.17M consistently.
- Plus a long list of stale-reference fixes from yesterday's restructuring (old lesson numbers,
  "Modules 1 and 5"-style references to content that moved, a "Part four" heading surviving in a
  lesson that was split out of its parent, a stray old lesson count in 3 places, raw HTML leaking
  into a quiz option's display text) — all fixed, full list in the agent's own log.
- Verified clean, not just assumed: coherence-check, skip-banner-test (26/26 after the fix above),
  learn-verify (0 JS errors), all Quran citations checked for consistent "Surah Name X:Y" format
  and correct verse numbers, no old course names or "HalalMoneyAU" anywhere in either JSON, no
  orphaned references to the removed inflation lesson, locked character figures intact everywhere
  including the one deliberate $5k/$7k exception, footnote citation URLs spot-checked (15/18
  return 200, the other 3 return 403 because those specific sites block automated requests, not
  because the links are dead), and — genuinely useful, not assumed — **confirmed there are no
  unpublished placeholder lessons in either course**, all 60 lessons are real and live.

**4 decisions resolved myself, since he's asleep and asked for exactly this:**
1. Tier 3 teasers: leave removed. A "coming soon" pitch that actually charges the wrong price if
   clicked is worse than no pitch at all. Restore from the backup file once Tier 3 and a real
   `tier=3` checkout route both genuinely exist.
2. `_redirects`: `/learn/sukuk-vs-bonds/` was still pointing at `shariah-compliant-vehicles`, the
   lesson it was split out of yesterday. Repointed to the actual new sukuk lesson.
3. `_redirects` comment claimed the "give cash a job" checklist had been moved into the emergency
   fund lesson. It hadn't, because he later told me to remove both relocated sections entirely
   (confirmed in this session's own history). Corrected the comment to say so, rather than
   restore content he explicitly asked to have deleted.
4. Short-course module renamed from "Money Basics" to "The Essentials" (it echoed the old,
   now-changed course name). A reasonable, low-stakes call, left as the agent made it.

**Final cross-cutting verification, run after merging every agent's fixes together:**
- Full rebuild (`node build.js`): clean.
- `coherence-check.js`: clean.
- Paywall gated copy re-synced twice (once mid-audit, once after the course-content pass landed):
  `node build-gated.mjs`, leak check 0 leaks both times.
- `link-check.js`: 357 pages, 0 broken internal links, 0 duplicate IDs, 0 broken anchors.
- `skip-banner-test.js`: 26/26.
- `calc-math-verify.js`: 56/56. `calc-test.js`: 38/38.

---

## FINAL VERDICT: GO for content and technical readiness.

Everything that was genuinely fixable without him has been fixed and re-verified together, not
just per-agent. What's left is exactly the set of things that were already known to need his
input before this audit started, plus one new genuine decision surfaced tonight:

**Must resolve before a real public launch (not a "nice to have"):**
- **No contact email exists anywhere on the site**, despite the Privacy page and About FAQ both
  implying one exists. This is the one new significant finding tonight. Needs him to say what
  address to publish, then it's a quick wire-up.
- Domain purchase, brand name final decision, trademark check, Cloudflare hosting setup — all
  already known from the earlier pre-launch checklist, none of these are things I can do without
  him (identity/payment/judgment calls).
- Paywall activation (real Stripe + Resend accounts) — same reason, needs his identity.

**Can follow shortly after launch, not blocking:**
- `.git/` exposure fix is defensive (already added), worth a 30-second manual check on the real
  host once deployed that it actually 404s, since redirect-rule behavior can vary by platform.
- Homepage Total Blocking Time under heavy synthetic throttle — real number, but not a real-world
  problem per the 5-run median; watch real Core Web Vitals data post-launch instead of guessing.
- The `/about/` page's longer "why I built this" story is still unwritten (gated, renders nothing,
  not a broken page) — only he can write it, flagged again since it's the single highest-value
  missing piece for search trust signals.

Nothing found tonight is a reason to delay launch on its own. The email address is the one item
I'd genuinely call a should-fix-before-real-users-arrive, everything else technical and content-wise
checks out clean after this pass.
