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

## Cloudflare DEV deployment

DEV site: https://modacert-web-dev.firman-lasaman.workers.dev

This separate Worker uses the Cloudflare DEV backend. Existing default deployment commands and production environment files retain their current targets.

### Local build and deploy

Use Node.js 22 and install the locked dependencies with `npm ci`. Export the DEV variables before building: `--env dev` selects Wrangler configuration, while Next.js freezes public variables at build time.

```bash
export NEXT_PUBLIC_API_MODE=proxy
export NEXT_PUBLIC_USER_SERVICE_URL=https://modacert-user-service-dev.firman-lasaman.workers.dev
export NEXT_PUBLIC_PAYMENT_SERVICE_URL=https://modacert-payment-service-dev.firman-lasaman.workers.dev
export NEXT_PUBLIC_PAYMENT_MODE=fake
export NEXT_PUBLIC_PAYPAL_CLIENT_ID=''
export NEXT_PUBLIC_API_TIMEOUT_MS=10000
export NEXT_PUBLIC_API_RETRY_ATTEMPTS=3
export NEXT_PUBLIC_API_RETRY_DELAY_MS=1000
export USER_SERVICE_ORIGIN=https://modacert-user-service-dev.firman-lasaman.workers.dev
export PAYMENT_SERVICE_ORIGIN=https://modacert-payment-service-dev.firman-lasaman.workers.dev
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
