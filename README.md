This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# modacert-web

## Checkout payment modes

Copy `.env.example` to `.env.local` for local fake checkout, then run `npm run dev`. The example uses the DEV gateway through the same-origin API proxy. Local configuration is currently set to fake.

| `NEXT_PUBLIC_PAYMENT_MODE` | Checkout | Required payment backend |
|---|---|---|
| `production` | PayPal with a live client ID | `PAYMENT_MODE=paypal`, live credentials, `PAYPAL_BASE_URL=https://api-m.paypal.com` |
| `sandbox` | PayPal with a sandbox client ID | `PAYMENT_MODE=paypal`, sandbox credentials, `PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com` |
| `fake` | One click on **Test Pay**, no charge | `PAYMENT_MODE=fake`; no PayPal credentials |

Fake payment uses the existing create-order and capture endpoints. The backend records a completed payment and queues `payment.completed` for processing. Checkout advances to Success only when capture returns `status: "COMPLETED"` and `queued: true`; failures remain at Payment. Login, brand selection, and uploads still use the backend.

For production or sandbox, set `NEXT_PUBLIC_PAYPAL_CLIENT_ID` to the matching public client ID and configure both service URLs for that environment. In proxy mode, also set `USER_SERVICE_ORIGIN` and `PAYMENT_SERVICE_ORIGIN`. Keep `PAYPAL_CLIENT_SECRET` only in the payment backend. Selecting a frontend mode does not reconfigure the backend; the DEV gateway is configured for fake payments.

An omitted mode defaults to `production`. Legacy `paypal` retains the existing PayPal checkout behavior; all other values are rejected. Restart local development after env changes and rebuild before deployment: `NEXT_PUBLIC_*` values are frozen into the browser bundle at build time. `.env.local` also overrides `.env.production` during local builds; use explicit matching build variables for a production or sandbox build.

Run the payment regression check with `npm run test:payment`.

## Cloudflare DEV deployment

DEV site: https://modacert-web-dev.firman-lasaman.workers.dev

This separate Worker uses the Cloudflare DEV backend. Existing default deployment commands and production environment files retain their current targets.

### Local build and deploy

Use Node.js 22 and install the locked dependencies with `npm ci`. `build:dev` sets the browser bundle to direct API calls against the DEV gateway with fake payments. `--env dev` selects the matching Wrangler configuration.

```bash
npm run build:dev
npm run deploy:dev
```

The same non-secret runtime values are stored in `wrangler.jsonc` under `env.dev.vars`. Run the build before `deploy:dev`, which deploys the existing build output.

### GitHub automatic deployment

Connect `Modacert-cloudflare/modacert-web` to Worker `modacert-web-dev` using Cloudflare Workers Builds:

| Setting | Value |
|---|---|
| Branch | `main` |
| Root directory | `.` |
| Build command | `npm run build:dev` |
| Deploy command | `npm run deploy:dev` |
| Other branch builds | Disabled |
| Build variable `NODE_VERSION` | `22` |

Add every value from `env.dev.vars` to **Build variables and secrets** as a non-secret build variable. Runtime variables alone do not configure the browser bundle. Keep deploy credentials in Cloudflare, outside source control.

### Checks and rollback

Run lint, TypeScript checks, and the DEV build. Verify the site and same-origin API proxy after each deployment. This environment uses deployment smoke checks; a complete authentication workflow is a separate check.

To restore a previously verified DEV version:

```bash
./node_modules/.bin/wrangler deployments list --env dev
./node_modules/.bin/wrangler rollback VERSION_ID --env dev
```

Rollback affects the DEV Worker code and configuration, not backend data. Check Workers Builds logs for failed builds and Worker logs for runtime failures.
