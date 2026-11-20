# Incoming 2.0 password reset

The site lets performers request a password reset or choose a password from an emailed reset or welcome link. Account validation, email delivery, throttling and single-use token checks run on the Incoming API Worker.

## Deploy with Cloudflare Workers Builds

1. In Workers & Pages, create a Worker and connect the GitHub repository `osm-creations/incoming-2.0-password-reset`.
2. Choose the production branch `main`, Worker name `incoming-2-0-password-reset`, and repository root. Leave the build command blank. Use `npx wrangler deploy` as the deploy command.
3. Deploy and open `https://incoming-2-0-password-reset.incoming-osmcreations.workers.dev/`. The reset site requires no secrets. Configure SMTP credentials and the public reset URL on the existing Incoming API Worker. Its public reset endpoints must allow the web site's origin.

A link carries its token in `#token=...`. Opening a link does not use it. The browser removes the fragment from its address bar and retains the token in memory until the user submits a new password or leaves. The password and token are sent only to the Incoming API over HTTPS. If the page is refreshed, reopen the link in the email.

The production API endpoint is set in `public/app.js`. An API hostname change also requires updating the `connect-src` directive in `public/_headers`.
