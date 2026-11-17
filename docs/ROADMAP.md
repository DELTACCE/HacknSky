# HacknSky: what is missing, and the phone-performance plan

## 1. Is the lag because the models are made from maths instead of .glb files?
Mostly no. Once built, procedural geometry is the same triangles on the GPU as a loaded .glb; a .glb is not faster to draw.
What a .glb pipeline gives you is different:
- **Load time**: no generating the world on the phone's CPU (this is why the loader takes a while).
- **Compression**: Draco/meshopt shrink downloads; KTX2 textures use far less GPU memory.
- **Baked lighting**: shadows and ambient occlusion are painted into vertex colours or textures offline, so the phone does less per pixel.
- **LOD and merged meshes**: made once in Blender, not guessed at runtime.
What actually costs frames on a phone is per-pixel work (resolution, lit toon shading, transparent overdraw from mist and 3D text, water shaders), the number of draw calls, and JavaScript running every frame. I could not profile on a real phone from here, so the order of the fixes below is based on likely causes, not measurements. Profile first on a real device (Chrome remote debugging → Performance, or `renderer.info`).

## 2. Phone-performance plan
Done in this version
- Pixel budget (about 0.8 MP) instead of a fixed ratio; edge smoothing on; never below a sharp floor.
- No dynamic point light, no shadows, no backdrop blur on phones; fewer trees, grass, flowers, mist.
- Resize guard (the address bar sliding no longer rebuilds the canvas while scrolling).
- Caption textures are smaller on phones and built one per frame, not all at once on a chapter change.
- Quality ladder that removes effects before pixels, final tier at 30 fps; Graphics: Low; Plain page mode.
- Real loader (streamed engine download, fonts, shader pre-compile).
Next, in order of expected payoff
1. **Serve a real lite version to weak phones by default** (2D/CSS parallax or a short looping video of the valley, with the same content). The most reliable fix for a 4 GB phone.
2. Profile on 2–3 real phones; record draw calls, triangles, frame time per chapter.
3. **Bake**: export the world once to a compressed .glb (meshopt + KTX2) with baked AO, load that instead of generating it.
4. Replace per-pixel lit toon material with a custom unlit shader with baked colour + a 3-step ramp from a texture.
5. Billboard impostors / fewer, merged tree meshes; stop drawing the forest far from the camera path.
6. Render the captions into one atlas instead of two textures per word.
7. Pause rendering when the scene is static; render the water at half resolution.
8. Service worker to cache three.js, fonts and the shell on repeat visits.

## 3. What a professional hackathon website has (and where this site stands)
Legend: [x] present, [~] partial, [ ] missing

**Information**
- [~] What / when / where (dates and venue are "proposed")
- [ ] Full schedule (day plan with times)
- [ ] Tracks with problem statements, judging criteria and datasets/APIs
- [ ] Prizes and what winners get (awards "still being planned")
- [ ] Eligibility, team size, ID/college requirements, fees (free or paid)
- [ ] Rules, IP ownership, code of conduct, safety and emergency contacts
- [ ] Judges, mentors, speakers
- [ ] Sponsors and partners (logos, tiers), "become a sponsor" pack
- [ ] FAQ (accommodation, travel, food, what to bring, refunds, what if dates change)
- [ ] Venue, travel and stay: map link, directions, nearest rail/air, local transport
- [ ] Past editions / gallery / testimonials, press kit
- [ ] Organisers and contact (email, phone/WhatsApp, Instagram/LinkedIn)

**Registration and conversion**
- [~] Registration interest form (not connected to a backend yet)
- [ ] Real registration flow: team creation/joining, confirmation email, waitlist, ticket/QR
- [ ] Spam protection (honeypot/Turnstile), rate limiting, data-protection notice and consent
- [ ] Admin: export of registrations, email broadcast, check-in on the day
- [ ] Deadline messaging and a visible "registrations open/closed" state

**Trust and legal**
- [ ] Privacy policy, terms, how data is stored and who sees it
- [ ] Clear statement of what is confirmed vs proposed (partly done)

**Technical quality**
- [~] SEO: title/description/Open Graph/JSON-LD added; needs real domain, per-section URLs
- [ ] Analytics (privacy-friendly) with funnel: visit → briefing opened → registered
- [ ] Self-hosted fonts and three.js (script provided), HTTP caching headers (provided), CDN
- [ ] Error monitoring, uptime check, form-failure alerts
- [~] Accessibility: reduced-motion respected, plain-page mode exists; still needs keyboard path through the 3D tracks, full contrast audit, screen-reader labels on 3D controls
- [ ] Performance budget (LCP under 2.5 s on mid-range phone over 4G, under ~1.5 MB first load excluding three.js) and a Lighthouse check in CI
- [ ] Tests (smoke test that the page loads, form posts) and a deploy pipeline
- [ ] Multi-language if the audience needs it

**Communication**
- [ ] Community channel link (Discord/WhatsApp), newsletter/updates, calendar (.ics) download, share buttons

## 4. Biggest wins for this specific site, in order
1. Connect registration (set `CONFIG.registerUrl` or `formEndpoint`) and decide what happens after sign-up.
2. Add schedule, rules, prizes, FAQ, venue/travel, contact: the pages people actually look for.
3. Ship the lite/default experience for phones; keep the 3D valley as the "full experience".
4. Replace the placeholder domain, add analytics, self-host fonts/three.js.
5. Accessibility pass (keyboard route through chapters and totems).


## Status update
Done: info pages (schedule, prizes, rules, FAQ, venue, team, sponsors, contact, past), register page and form, privacy/terms/code of conduct drafts, calendar and share, optional analytics and perf events, a11y basics (skip link, focus trap, inert, live regions), smoke test, link check, CI, Lighthouse budgets, Apps Script receiver, font self-host script.
Not verified here: 3D rendering and real-phone speed (no WebGL or phones in the build sandbox), the Apps Script backend, Lighthouse scores, CI run.
Not done on purpose: translations (i18n), real content for people, sponsors and prizes (see CONTENT-TODO.md).
