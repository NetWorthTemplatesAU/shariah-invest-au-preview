# Audit Step 2: Course content (both courses)

Date: 2026-10-01 (overnight, autonomous)
Scope: `shariah-invest-au-build/content/learn.json` (Complete Financial Literacy, 46 lessons) and `learn-basics.json` (Financial Basics, 14 lessons), the live `/learn/` and `/learn-basics/` pages generated from them, and the course test scripts.

## Final state

- `node content/coherence-check.js`: **clean**
- `node shariah-invest-au-audit/skip-banner-test.js`: **26/26** (was failing, see B1). One run out of about seven showed 25/26 with no failing line printed, then passed on every rerun: a timing flake in the test, not a site bug.
- `node shariah-invest-au-audit/learn-verify.js`: passes, 0 JS errors
- `node build.js` run after every edit. The live HTML matches the JSON.
- Backup of both JSON files taken before the bulk edits: `shariah-invest-au-build/content/backups-audit-step2-2026-10-01/` (taken after two small edits, B1 and M9). `removed-blocks.json` in the same folder holds the exact text of every block I deleted, so any deletion can be restored in one paste.
- Reading time (`minutes`) recomputed for every full-course lesson I edited (visible words / 129.5, rounded). See the note under C4 for the short course.

Every one of the 60 lessons was read in full, including the quizzes, by dumping each lesson to plain text.

---

## BREAKING (wrong or broken, and would embarrass the site or mislead a reader)

**B1. The skip banner lost its "Jump to what's new" target on a mapped lesson** (`learn.json`, `compounding-why-your-brain-cant-feel-it`)
The skip-banner test failed and then crashed. Today's rewrite deleted the "The folded paper" section, and with it the `id="beyond-the-basics"` anchor. Three other mapped lessons also lost their anchors: `the-cost-of-financial-illiteracy`, `the-emergency-fund` and `savings-rate-vs-return-rate`. Those three now contain their short-course version almost word for word (35/35, 30/32 and 51/53 sentences shared), so no section counts as new, and the banner correctly falls back to "Skip ahead" with no jump link.
*Fixed:* Put the anchor back on "The chessboard", which is now the first section of the compounding lesson that the short course does not cover. Updated two stale expectations in `skip-banner-test.js`: the banner copy now names "The chessboard", and the three lessons with no anchor must offer Skip with no jump link. 26/26 now pass.

**B2. The share lesson was half-edited and showed two contradictory examples** (`learn.json`, `what-happens-when-you-buy-a-share`)
The live page showed both "a lawnmowing business is worth $100 ... each share $1" and "worth $100,000 ... each share $1,000", plus the old "$10 that stayed in the business" paragraph. The new $20,000-profit dividend paragraph had been saved into a `table` block's `html` field, which the generator ignores, so it never appeared. The "Both trace back to the same place" paragraph had been dropped, although quiz Q3 depends on it.
*Fixed:* Rebuilt the section in order: the $100,000 business, "You buy one share for $1,000", the four-item list, the dividend paragraph, the retained-profit paragraph, the table, then "Both trace back". I also toned down "it has doubled in value to $200,000", because keeping $10,000 of profit does not double a $100,000 business. It now says "worth more than $100,000", which matches quiz Q2.

**B3. A quiz answer contradicted the lesson's own table** (`learn.json`, `savings-rate-vs-return-rate`, Q2)
The marked answer was "About three years" and the explanation said "Zaid only overtakes in year four". The lesson's table, and the sentence under it, show Amina ahead in all 5 years. I checked the arithmetic: Zaid only overtakes in year 6.
*Fixed:* The correct option is now "All five years of the comparison", and the explanation matches the short course's correct version. The lesson summary also claimed "the full comparison at 5, 10 and 30 years". The lesson only runs 5, so I corrected the summary too.

**B4. A quiz answer used a figure that exists nowhere and was false** (`learn.json`, `good-debt-vs-bad-debt`, Q3)
The question itself says the car costs "about $7,430 a year". The marked answer said "$11,772 a year, is larger than his entire investing programme", which is wrong twice: the figure does not exist in the course, and $7,430 is less than his $10,000.
*Fixed:* The answer now reads "at about $7,430 a year, is most of what he could otherwise be investing", which is the lesson body's own wording.

**B5. Tier 3 "coming soon" sales copy, with a checkout link that would charge the A$199 price** (`learn.json`: 2 callouts in `where-your-money-actually-goes`, 1 in `zakat-fundamentals`, and a heading plus paragraph in `recap-and-whats-next`)
Four published lessons sold a "Tier 3, coming soon" product at A$29: video walkthroughs for NAB/CBA/Westpac/ANZ, a statement-upload tool and personalised zakat guidance. `paywall-config.json` marks Tier 3 as "NOT YET ACTIVE. No Tier 3 content exists yet." The "Learn more" links go to `/api/checkout?tier=3`. In `paywall/src/stripe.js`, `offerFromParam` maps anything except `discount` to `standard`. So once the paywall functions are deployed, a reader who clicks "Learn more" on an A$29 offer lands in the **A$199 Tier 2 Stripe checkout**. On the current static build the link 404s. These blocks were added on 2026-09-30 (they are not in the 09-29 backups).
*Fixed (removed), and **flagged for him**:* All 5 blocks removed. The exact original text is in `backups-audit-step2-2026-10-01/removed-blocks.json`. If he wants the teasers back before Tier 3 exists, two things are needed first: a real Tier 3 checkout route (for example a `tier=3` offer in `stripe.js`, or a waitlist link instead of checkout), and his decision on whether to promise specific deliverables that are not built yet. Those are his business calls.

**B6. The short course pointed readers to a "45-lesson" full course** (`learn-basics.json`, `what-this-short-course-covers`, Q2)
*Fixed:* Now reads 46. My first text search used "45 lesson" and missed the hyphenated form. A final sweep of the live HTML found two more: the "Go deeper" related link on `what-this-short-course-covers` and on `recap-and-what-next` both said "The full 45-lesson course". *Fixed:* Both now say 46, and the site is rebuilt. The sweep now finds no 45, 47 or 48 lesson count anywhere, hyphenated or not.

**B7. A quiz option showed raw HTML tags to readers** (`learn.json`, `the-cost-of-waiting-one-more-year`, Q1)
Quiz options render as text, so the correct option appeared literally as `<strong>$87,247</strong>`. It was also the only option with markup, which gave the answer away.
*Fixed:* Plain `$87,247`. I scanned every quiz string in both courses for markup: no others.

**B8. Two quizzes tested content the lessons no longer contain** (the same pattern as today's checklist bug)
- `understanding-what-you-owe`: the summary listed "offset accounts" and Q4 asked how an offset account works. The offset section had been cut. The Q2 explanation cited the Prelec and Simester MIT study, also cut, and body text still said "not just a lab", which referred to that study. *Fixed:* Q4 is replaced with a question on the comparison rate, which the body does teach. The Q2 explanation and the "lab" sentence now rest only on the buy now pay later data that remains. "Offset accounts" is removed from the summary.
- `is-it-riba-judging-everyday-products`: the summary, the dek ("the two that are not settled"), the intro ("how an offset balance is subtracted") and Q2 (the offset "prior question") all referred to offset material that does not exist anywhere in the course. *Fixed:* Q2 is replaced with a question on the credit card annual fee versus interest distinction, which the body covers. The summary, dek and intro now match the body, which has one disputed product (buy now pay later).
- `choosing-a-compliant-option`: Q3's answer was "check the insurance you would lose before switching", but the "Before you switch" checklist had no insurance item. *Fixed:* Added the insurance item to the checklist. That is the right fix because it is genuinely important advice, and `how-super-actually-works` already makes the same point.

**B9. A short-course quiz contradicted its lesson** (`learn-basics.json`, `your-fire-number`, Q2)
The marked answer said a straight 25x is *conservative* because super only has to be bridged. In this lesson the 25x total already *includes* super, and the body says the super lock-up is an extra problem: $942,516 accessible has to last from 52 to 60.
*Fixed:* Q2 now asks why Amina cannot spend her combined total at 52, with the answer taken from the body.

**B10. Two lessons gave different answers for the same inputs** (`the-cost-of-financial-illiteracy` in the full course and `the-cost-of-not-knowing` in the short course)
The Early/Late Starter example ($12,000 a year at 10%) gave $3.34M and $1.97M, which is end-of-year compounding. Every other figure in both courses, including the locked Amina 30-year figure of **$2,171,321**, uses start-of-year compounding. So a reader saw "30 years of $12,000 at 10%" as $1.97M in one lesson and $2.17M in the next, in both courses.
*Fixed:* Now $3.67M and $2.17M, in the list, the table and the quiz explanation. I checked "about 70% more": 3.67/2.17 = 1.69, so the claim still holds.

## SIGNIFICANT (real inconsistency, mostly stale cross-references from today's restructure)

- **S1. Stale "Lesson 9" in the full course** (`the-cost-of-financial-illiteracy`, body and quiz explanation). That is short-course numbering. Lesson 9 of the full course is the emergency fund. *Fixed:* Now links to the ETF lesson, which has the fee table. The ETF lesson's "which is where the cost of financial illiteracy got its number" also no longer made sense and now reads "the fee cost ... warned about". The short course's "Lesson 9" and "Lesson 7" are correct for that course and were left alone.
- **S2. Stale "Lesson 4.4"** (`pay-rises-and-disposable-income`). Negotiating is now Module 5. *Fixed:* Now a named link.
- **S3. Stale module numbers** (`money-as-an-amanah`: "Modules 2 through 4 and 6 onward are general financial literacy", but 2 and 6 are the Islamic modules. `property-tax-perks-are-a-bonus`: "Modules 1 and 5", which means Start Here and Earning. Module 9 summary: "Applying Modules 6 and 7", which should be 7 and 8). *Fixed:* All three.
- **S4. The ordering now lives in the new lesson, but links still pointed elsewhere** (`the-emergency-fund`: "The full ordering is covered in the next lesson", which linked to good-debt, is not the next lesson, and no longer has the ordering. `the-cost-of-waiting-one-more-year`: "orderings ... the consumer debt lesson set out"). *Fixed:* Both now point to `our-financial-steps-to-freedom`.
- **S5. The good-debt list grew, but the text still described the old list** (`good-debt-vs-bad-debt`): "why those two extra items belong", "the single item on the good-debt list". A paragraph cut left "Then the second cost lands" with no first cost. *Fixed:* All three passages reworded to fit the three-item list, and the first cost restated in one sentence.
- **S6. The new lesson had no quiz** (`our-financial-steps-to-freedom`). Every other lesson has 2 to 4 questions. *Fixed:* Added 3 questions taken strictly from the lesson body.
- **S7. Leftovers from the sukuk split** (`shariah-compliant-vehicles` intro: "one lesson rather than four ... then the asset class that ... largely does not exist here". `sukuk-and-the-missing-half-of-the-portfolio` opened with an h2 "Part four: ..." and had only 1 quiz question). *Fixed:* The vehicles intro now says three parts and links to the sukuk lesson. The "Part four" heading is removed. The sukuk lesson now has 3 questions (added: why bonds are out, and what ASX access looks like).
- **S8. "The previous lesson" meant a lesson that is no longer previous** (`lump-sum-vs-drip-feeding-in`, 3 places: "the previous lesson explained ... they sell" and "the timing decision from the previous lesson", both meant time-in-the-market). *Fixed:* All three.
- **S9. Wrong "next lesson"** (`why-the-business-itself-matters`: "The next lesson on screening mechanics returns to this", but the next lesson is about buying a share). *Fixed:* Now links to the vehicles lesson.
- **S10. A retired figure resurfaced in a quiz** (`recap-and-whats-next`, Q3: "one of them not believing a 15% marketing claim"). Zaid's 15% marketed fund was removed in the 2026-09-25 revision. The checker's regex only catches "marketed 15%", so it missed this. *Fixed:* The option now uses the lesson body's own words.
- **S11. The FIRE lesson cited the wrong source for the spending figures** (`your-fire-number-for-real-this-time`: "From the savings rate lesson:" introduced $53,880 / $51,880). That lesson uses the documented $5,000/$7,000 exception, so the pointer invited confusion. *Fixed:* Now points to `where-your-money-actually-goes`, which is where those figures come from.
- **S12. Two readings of Zaid and Amina** (`meet-zaid-and-amina`: "Savings rate vs return rate is where the two of them are run side by side over 5, 10 and 30 years"). It runs 5 years. *Fixed:* Now says so, and points to the FIRE lesson for the full trajectories.
- **S13. The cost-of-waiting arithmetic** (`the-cost-of-waiting-one-more-year`). It said "contributing at the end of each year", but the table ($904,717) is start-of-year. The year-30 breakdown ($81,747 + $5,000) did not add up to $87,247. *Fixed:* "Start of each year", and the breakdown is now $81,747 + $5,500, which does add up.
- **S14. Same paragraph twice** (`what-makes-wealth-tayyib`): a `p` block and a `crosslink` box with near-identical text, one after the other. *Fixed:* Removed the duplicate crosslink.
- **S15. Other stale module summaries.** Module 13 still listed "inflation", which was removed with the inflation lesson. Module 4 did not mention the new ordering lesson. *Fixed:* Both.
- **S16. `learn.json` `course.navDesc` said "Free course, 46 lessons"** about the paid course. It is not currently read by any code, because `lib/layout.js` deliberately ignores it, but it is a latent trap. *Fixed:* Now "46 lessons".
- **S17. `/learn/sukuk-vs-bonds/` still 301s to `shariah-compliant-vehicles`** (live `_redirects`). Sukuk now has its own lesson, so the redirect should point to `/learn/sukuk-and-the-missing-half-of-the-portfolio/`. **Flagged, not changed.** `_redirects` is outside content files, and it already has uncommitted edits from another step. One-line change for whoever owns that file.
- **S18. The `_redirects` comment says the "give cash a job" checklist from the removed inflation lesson "moved to the-emergency-fund".** It is not there: the emergency fund lesson was rewritten today to mirror the short course. Not user-facing. **Flagged:** restoring that checklist is his editorial call.

## MINOR (polish)

- **M1. Quran citations made consistent** (`what-riba-actually-is`, `zakat-fundamentals`): all now use the pattern "Surah [Name] X:Y": Surah Al-Baqarah 2:275, Surah Al-Baqarah 2:278-279, Surah Al-Ma'idah 5:90, Surah At-Tawbah 9:60. The chapter and verse numbers are all correct for what they cite: trade vs riba, "give up outstanding interest", gambling, and the eight zakat categories. The quoted translations of 2:275 and 2:278-279 were already in `<em>`, and "halalan tayyiba" in the tayyib lesson is italic too. No fix was needed there.
- **M2. Wrong quiz pointer** (`what-riba-actually-is`, Q4) credited "the earning and spending module" with the 0% finance argument. It is in the consumer debt lesson. *Fixed.*
- **M3. Wrong framing:** `risk-return-and-time-horizon` said "Savings rate vs return rate opens with exactly that" (a get-rich-quick pitch). That lesson no longer opens that way. *Fixed.*
- **M4. Wrong scope:** `leverage-real-estates-real-edge` described a 20-year comparison as a "thirty-year assumption". *Fixed.*
- **M5. "Why this lesson is here rather than somewhere near the end"** (`markets-fall-thats-normal`), in the second-last module. *Fixed.*
- **M6. Recap dek "Thirteen modules in one page"** in a 14-module course. The recap line "the first real lesson" is also now accurate. *Fixed.*
- **M7. Inflation arithmetic** (`money-as-an-amanah`, Q1 explanation): $10,000 at 3.8% for 10 years buys about $6,890 of goods, not $6,800. *Fixed:* now $6,900.
- **M8. Milk price contradiction:** `pay-rises-and-disposable-income` said milk was $3.10, but `money-as-an-amanah` says the same bottle costs $3.55 today. *Fixed:* $3.55 to $3.68 at 3.8%.
- **M9. Short-course module title "Money Basics"** rendered in every short-course breadcrumb as "Financial Basics > Money Basics", which echoes the retired course name. *Fixed:* The module is now "The Essentials", and no live page contains "Money Basics" any more. If he prefers another name, it is one field (`learn-basics.json` `modules[0].title`).
- **M10. The value-investing lesson's closing section sat above a whole extra section** ("The sentence to carry out of this module" and "The next module applies..." came before the CFD/futures section). *Fixed:* Moved the closing to the end.
- **M11. What-this-course-covers banner description** promised a jump to "what is new" in all twelve mapped lessons. Only nine have a new section now. *Fixed:* Wording adjusted.
- **M12. Stale header comment in `coherence-check.js`** ("45 lessons"). *Fixed:* 46. The actual check already asserted 46.
- **M13. Footnotes.** 17 in the full course and 2 in the short course, all rendering correctly: numbered superscripts, a Notes section on every page that has references, and no raw `<fn>` leaking into HTML. I requested all 18 unique citation URLs: 15 return 200. clark.com, afca.org.au and spglobal.com return 403, which is bot-blocking on those hosts, not dead links. No action needed.
- **M14. Uncited statistics, flagged only:** SPIVA 89% over 15 years and "nearly 78%" in H1 2026 (`etfs-why-boring-beats-clever`, both courses). The Hartford 8.4%/2.1% figures are cited. The 2026-27 concessional cap of $32,500 is uncited. The Coles milk prices are uncited. I did not change any of them. They are worth a footnote in a later sourcing pass.

## COSMETIC

- **C1. Sentence-case fixes** where a linked lesson name started a sentence in lowercase (`money-as-an-amanah`, `the-cost-of-waiting-one-more-year`, `markets-fall-thats-normal`, `risk-return-and-time-horizon`). A doubled word "lesson ... lesson" was also removed in the cost-of-waiting lesson. *Fixed.*
- **C2. A garbled sentence in both courses** (`every-purchase-is-traded-time`): "1,454 hours hits differently than $47,000, and not by accident, the exact gap between..." *Fixed:* reordered.
- **C3. The short-course `diversification` lesson** repeated its opening sentence and its "that is the whole idea" line one paragraph apart. *Fixed:* Removed the repeat.
- **C4. Reading-time note, short course.** Short-course `minutes` follow their own convention, not words / 129.5. Recomputing them breaks the checker's "about 60 minutes" assertion, because at 129.5 wpm the total would be about 72. For the short-course lessons I edited (a number change, a quiz, a sentence reorder, and removing 2 duplicated paragraphs), I kept the existing minutes, and the total stays 64. Full-course minutes were recomputed and changed where the edits moved them: tayyib 8 to 7, understanding-what-you-owe 12 to 11, zakat-fundamentals 10 to 9, recap 9 to 8, where-your-money-actually-goes 9 to 8, FIRE 19 to 20.
- **C5. The skip-banner test flaked once** (25/26 with no failure printed) and then passed on six consecutive reruns. Probably the 1.5-second smooth-scroll wait. Not changed.

## Already fine, no action

- **Lesson counts:** "46 lessons" and "14 lessons" are consistent across the JSON, the nav, and all 358 and 357 page mentions. After B6, no "45", "47" or "48" lesson count remains, spaced or hyphenated, in either JSON, the glossary or any live HTML/JS/JSON file.
- **Old course names:** "Halal Money, From Zero", "Money Basics, in an Hour" and "HalalMoney" appear nowhere in either JSON or any live HTML/JS/JSON/XML file. (The "Money Basics" module title is covered in M9.)
- **Removed lesson `inflation-the-quiet-tax-on-cash`:** zero references in any lesson, and the 301 to `risk-return-and-time-horizon` is present.
- **Placeholder lessons:** there are **none**. Every lesson in both files is `"status": "published"`, and no module is `planned`. The "Tier 2 expansion" in the brief is the paywall over the full course (`PAYWALL=1`), not a set of placeholder lessons. The 2 noindexed placeholder pages the build reports are blog posts, not lessons. No lorem ipsum, TODO, TBD, FIXME or "[insert" anywhere. The only "coming soon" text was the Tier 3 copy (B5).
- **Locked character figures** were checked by hand against every table I read: $80,000 / $63,880; Amina $12,000, Zaid $10,000 at 10%; the Amina trajectory $80,587 / $210,374 / $419,397 / $756,030 / $2,171,321; the FIRE numbers; super $824,756; the bridge table; the savings-rate tables; the leverage repayment of $2,964; the depreciation table; the delay table. All correct. The $5,000/$7,000 exception in `savings-rate-vs-return-rate` was left intact, as instructed.

## Decisions needed from him

1. **Tier 3 teasers (B5):** leave them out until Tier 3 exists (current state), or restore them from `removed-blocks.json` once a working `tier=3` checkout or waitlist route exists.
2. **`_redirects` (S17):** point `/learn/sukuk-vs-bonds/` at the new sukuk lesson. It is a one-line change, but I left it because it is outside this step's scope.
3. **"Give cash a job" checklist (S18):** restore it into the emergency fund lesson, or accept that it was dropped and fix the `_redirects` comment.
4. **Short-course module title (M9):** keep "The Essentials" or pick another name.

## Is the course content launch-ready?

**Yes, now, and it was not before this pass.** Going in, both courses had reader-facing faults that would have hurt credibility on a finance-education site:
- a lesson showing two contradictory worked examples, with its key paragraph missing;
- quiz answers that contradicted their own lessons' tables, or tested sections that had been deleted;
- two lessons giving different answers to the same compounding sum;
- a raw HTML tag inside a quiz answer;
- a "45-lesson" pointer;
- a skip banner that could not find its target;
- and, most seriously, A$29 "coming soon" offers whose checkout link would have sent a buyer to the A$199 checkout.

All of that is fixed and verified: the rebuilt pages checked, the coherence check clean, the skip-banner test 26/26, and learn-verify passing. What remains is either outside content files (the one `_redirects` line) or an editorial or business decision that does not block launch (the Tier 3 teasers, the dropped checklist, the module name, and a few uncited statistics worth footnoting later). Every lesson in both courses was read in full for this verdict. No known factual, numerical or structural error remains in the published course content.
