# What the organisers must supply
Everything below is a placeholder in `data/event.json` / `js/config.js`. Edit, then run `node scripts/build-pages.mjs`.
- [ ] Final dates, venue, travel and stay details
- [ ] Registration fee, deadline, `registration.status` (soon/open/waitlist/closed)
- [ ] Prize amounts and special awards
- [ ] Judges, mentors, faculty, organisers (names, roles)
- [ ] Sponsors and logos
- [ ] Contact email / social links (`contactEmail`, `contact`)
- [ ] Real domain: `siteUrl` in config.js and event.json, then rebuild (sitemap, canonical, OG)
- [ ] Review privacy, terms, code of conduct and rules with the institution (drafts only)
- [ ] Deploy `backend/google-apps-script.gs` and set `formEndpoint`; set `analyticsEndpoint` if wanted
- [ ] Run `npm run fonts` so fonts are self-hosted, then link `css/fonts.css` and drop the Google Fonts links
