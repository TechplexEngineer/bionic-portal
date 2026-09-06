# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

# Resources Used

- https://www.geekytidbits.com/sveltekit-with-drizzle-and-cloudflare-d1/

## Email sign-in

Login uses single-use email links that expire after 15 minutes. Set the server secret
`BREVO_API_KEY` in the runtime environment (Cloudflare secret in production; `.env`
for local development). Configure `Team 4909 No Reply <no-reply@team4909.org>` as an
approved sender in Brevo. The integration uses Brevo's transactional email API:
https://developers.brevo.com/docs/send-a-transactional-email

Links use the origin of the login request and open a confirmation page before
creating a session, so a mail scanner opening the URL does not use up the link.
Resends have a 60-second cooldown; issuing a replacement invalidates the previous
link. Missing API keys and delivery failures return an error without logging links
or bypassing email verification. Existing accounts retain their roles; newly
verified addresses receive the `user` role. Existing `magic_codes` storage holds
only token hashes, so no database migration is needed. Previously issued numeric
codes are no longer accepted.
