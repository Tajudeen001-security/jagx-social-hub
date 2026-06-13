## Goal
Ship a coordinated hardening pass on the current Lovable Cloud DB (it travels with the project when you move workspaces — no data is lost). All new schema lives in migrations so it replays cleanly.

## 1. Auth & Signup
- Enable Google + Apple via Lovable Cloud managed social login (single tool call). Keep email/password.
- Expand `profiles` with: `first_name`, `middle_name` (nullable), `last_name`, `date_of_birth`, `sex`, `country`, `country_locked` (bool), `region`, `city`, `address` (nullable), `signup_ip`, `signup_country`, `last_known_country`.
- Rewrite `AuthPage` signup into a 2-step form. On submit, auto-detect country via `https://ipapi.co/json/` (free, no key). Country field is **read-only** when detected IP matches; becomes editable only if a mismatch is detected later (proxy/VPN scenario) — surfaced as a "Verify your location" prompt.
- Age gate: must be 13+ from DOB.
- All these fields editable from `EditProfilePage` except `country` (locked unless VPN flag set).

## 2. Admin trackability
- `AdminPage` Users tab: add a row-expand showing every field (name, DOB, sex, country, region, city, address, signup IP/country, last known country, VPN-suspected flag, account age, coin balance, post count).
- Searchable + filterable by country.

## 3. Share links (post / reel / profile) with rich previews
- Already have `og-post` edge function. Add `og-profile` and `og-reel` equivalents. They return HTML with OpenGraph + Twitter Card tags so WhatsApp/Telegram/X render a card instead of "showing codes".
- Update `vercel.json` to route bot user-agents (`facebookexternalhint`, `Twitterbot`, `WhatsApp`, `Slackbot`, `Discordbot`, `LinkedInBot`, `TelegramBot`) for `/post/:id`, `/reel/:id`, `/user/:id` to the edge functions.
- Add a "Share" sheet on `PostCard`, `ReelCard`, `UserProfilePage` with native share + copy-link.

## 4. Followers / Following lists
- New page `/user/:userId/followers` and `/user/:userId/following` listing profiles, with follow-back buttons.
- "X followers · Y following" on profile becomes tappable.

## 5. Messaging UX
- `DirectMessagePage` + `GroupChatPage`: replace manual scroll-on-send with a `useLayoutEffect` that pins to the latest message on every messages array change AND on page open (so opening a chat lands at the bottom; sending a new one keeps you pinned).
- Add chat **pin**: new column `messages.pinned_at` + pin/unpin action via long-press / kebab menu. Pinned messages show in a sticky banner at the top of the conversation, tap to scroll to original.
- Add per-conversation "Pin chat" to top of `ChatPage` list: new `conversation_pins` table (user_id, peer_id, pinned_at) with RLS.

## 6. Feed freezing
- `Index.tsx`: load posts once on mount; do NOT auto-refresh on tab focus or after creating actions. Add a top "New posts available" pill that appears when realtime detects new posts; tapping it (or pull-to-refresh) reloads. Browser refresh works as today.

## 7. Going Live — easier
- `LivePage`: one-tap "Go Live" with sensible defaults (camera + mic auto-grant prompt, default title "{username}'s live", auto-create stream row). Pre-flight checks (perm denied → clear instructions).

## 8. Ads
- `AdsPage`: streamline the create flow into 3 steps with previews. Add an "Ad slot" picker (after which post count, or feed section).
- Seed 3 promotional house ads (admin-owned, no coin cost) for: **JagX Buddy Connect** itself, **JRI**, and a generic "Your brand here" CTA pointing to a contact email. Marked clearly as `Sponsored`.
- Auto-promote admin profile: ensure admin (`jagwazorld@gmail.com`) profile is included in "Suggested to follow" with a verified + "Founder" badge, ranked first.

## 9. Opt-in AI training
- `profiles.ai_training_consent` (bool, default false).
- Settings toggle in `EditProfilePage` with clear copy: "Allow my messages to help improve JagX AI. Off by default. We never share with third parties."
- New `ai_training_samples` table; trigger on `messages` insert copies content only when sender has consent. RLS: service_role write, no client read.

## 10. API keys – reliability
- `ai-v1-chat` edge function: add usage counter increment (atomic), nicer error envelopes, rate-limit per key (60 req/min, 1000/day), structured JSON errors matching OpenAI shape.
- `DeveloperPage`: show live usage stats. Purchase flow already exists (70 🪙); add a "Test key" button that pings the endpoint and shows response.

## 11. Privacy / security baseline
- Enable Supabase password HIBP check via `configure_auth`.
- Confirm RLS on all new tables.
- Privacy page already exists — append clauses for AI training opt-in, location tracking, and ads.

## Technical details
- Migrations: one big migration adding all new columns/tables/policies; all idempotent (`if not exists`).
- New edge functions: `og-profile`, `og-reel`, `ip-geolocate` (proxy to ipapi to avoid CORS).
- New components: `ShareSheet`, `PinnedMessageBanner`, `NewPostsPill`, `LocationVerifyPrompt`.
- House-ad seeding via `supabase--insert` after admin user_id is confirmed.
- No data migration risk: all changes additive.

## Out of scope (call out)
- Facebook / LinkedIn / iCloud OAuth — not supported on Lovable Cloud (you confirmed Google+Apple only now).
- Training data export — opt-in storage only; export tooling later.
- Exporting current DB to your own Supabase project — not possible from this workspace; data travels with the project automatically when you move workspaces.
