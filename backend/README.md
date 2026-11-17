# Backend (optional)
`google-apps-script.gs` stores registrations in a Google Sheet. It is a starting point and has not been run against a live deployment: deploy it, submit a test entry, and check the sheet and the confirmation email. Then set `formEndpoint` in `js/config.js`. Without it the form falls back to `mailto:` using `contactEmail`.
