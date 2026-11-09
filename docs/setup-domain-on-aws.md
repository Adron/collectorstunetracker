# Moving collectorstunetracker.com from Vercel to AWS

The domain is registered with Vercel and uses Vercel's DNS. The goal is **DNS in Route 53, managed by CTT's
Terraform**, and **registration with Route 53 Domains**. These are two separate moves. Do DNS first: it's
instant to reverse and unblocks the build. The registrar transfer can then run in the background over the
following week.

## Target hostnames

| Hostname | Serves | Origin |
|---|---|---|
| `collectorstunetracker.com` | Marketing / product site with a **Log in** button | CloudFront → S3 (`apps/site`, static) |
| `www.collectorstunetracker.com` | 301 → apex | CloudFront Function redirect |
| `app.collectorstunetracker.com` | The logged-in app (PWA), its API (`/api/*`), and images (`/media/*`) | CloudFront → S3 (`apps/web`), API Gateway, S3 renditions |
| `app.dev.collectorstunetracker.com` | Dev environment of the app | Same shape, dev account |
| `dev.collectorstunetracker.com` | Dev marketing site (optional) | |
| MX / TXT (SPF, DKIM, DMARC) | Mail for `admin@` and other addresses | Whatever mail host you choose — **must survive both moves** |

TLS: ACM certificates in **us-east-1** (CloudFront requirement), validated by DNS in Route 53.

## Phase A — move DNS to Route 53 (day 1, reversible)

1. **Inventory** every record in Vercel's DNS for the domain: A/AAAA/CNAME/ALIAS, **MX**, **TXT**
   (SPF, DKIM, DMARC, site verifications), and CAA. Keep a copy in `infra/terraform/envs/prod/dns-import.md`.
2. **Create the hosted zone** with Terraform in the CTT **prod** account (`modules/dns`). Recreate every
   record from the inventory. Mail records come first. The new CTT records (apex, `www`, `app`) can point
   somewhere harmless until the build deploys.
3. **Lower TTLs** on the Vercel side to 300 s, a day ahead if you can.
4. **Delegate a dev subzone** if dev runs in a separate account: create the `dev.collectorstunetracker.com` hosted
   zone in the dev account and add its NS records in the prod zone.
5. **Switch nameservers**: in Vercel's domain settings, replace Vercel's nameservers with the four Route 53
   nameservers from the hosted zone.
6. **Verify** with `dig NS collectorstunetracker.com +short` and `dig MX collectorstunetracker.com +short`, and send a test email to `admin@`.

To roll back, put Vercel's nameservers back.

## Phase B — transfer registration to Route 53 Domains (≈5–7 days, mostly waiting)

1. **Eligibility:** the domain must be more than 60 days past registration or its last transfer (an ICANN rule),
   and not near expiry.
2. **At Vercel:** remove any transfer lock and get the **authorization (EPP) code** from the domain's settings.
   Check Vercel's current docs for the exact "transfer out" steps; their UI changes.
3. **Make sure the registrant contact email works.** Approval emails go there. Point it at an address you
   actually read (e.g. `admin@collectorstunetracker.com` once mail is live).
4. **At AWS:** go to Route 53 → Registered domains → *Transfer in*, enter the domain and auth code, choose
   **"use existing hosted zone"** (the one from Phase A), and set contacts with privacy protection on.
   The transfer includes a one-year renewal at the Route 53 price for `.com`.
5. **Approve** the confirmation emails (from AWS and possibly Vercel) and wait. Vercel may let you approve
   early to speed things up.
6. **Afterwards:** turn on auto-renew and transfer lock. DNSSEC signing in Route 53 is optional; enable it if wanted.
   Import the registered domain into Terraform (`aws_route53domains_registered_domain`) so its nameservers and
   auto-renew setting are tracked in code.

Because DNS already moved in Phase A, the site and email stay up throughout the transfer.

## Things to watch

- **Email is the thing most likely to break.** Copy MX/SPF/DKIM/DMARC exactly before switching nameservers.
- If anything on Vercel (an old deployment or preview) still uses the domain, remove it there after cutover so
  Vercel doesn't try to re-claim it.
- The Substratal app registration (`redirect_uris`, webhook URLs) uses `app.collectorstunetracker.com`. Those must
  resolve to CTT's CloudFront before the webhook subscription in
  [setup-on-substratal.md](setup-on-substratal.md) step 8 can be created.
