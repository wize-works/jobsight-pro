# 💰 JobSight Pricing Strategy

Our pricing model is designed to:
- Be affordable for small teams while scaling with usage
- Remove barriers to try the product (freemium/low-commitment)
- Monetize real project volume and active users
- Support premium upsells for power users and larger firms

---

## 🎯 Pricing Goals

| Objective                        | Strategy                                |
|----------------------------------|-----------------------------------------|
| Drive early adoption             | Free tier for micro-firms or solo trades |
| Convert early teams to paid plans| Usage-based billing with low base price |
| Grow MRR with customer scale     | Add-on fees per project or user         |
| Keep churn low                   | Value-focused features, sticky workflows|
| Enable enterprise expansion      | Premium tiers with integrations, support|

---

## 🧪 Proposed Pricing Tiers (v1)

| Tier        | Monthly Price | Included                                     |
|-------------|----------------|----------------------------------------------|
| **Free**    | $0             | 1 project · 2 users · basic features         |
| **Pro**     | $49 base + $10/project or $15/user | Unlimited logs, photos, AI assistant |
| **Growth**  | $199           | Unlimited projects & users · AI assistant · Invoicing tools |
| **Enterprise** | Custom pricing | SSO · API access · Dedicated support · Setup help |

> Billing is monthly (with discount for annual prepay) via Stripe. Projects auto-archive after 30 days if unpaid on Free.

---

## 📦 What’s Monetized?

| Feature/Resource     | Billing Trigger |
|----------------------|-----------------|
| Active projects      | $10/project/month (Pro) |
| Additional users     | $15/user/month (Pro) |
| AI Assistant access  | Included in Pro and up |
| File storage         | Soft limit (e.g. 2GB free, then $5 per 10GB block) |
| Invoice exports      | Included Pro+ |
| Voice-to-text logs   | Fair use; optional metered AI pricing later |

---

## 🧲 Freemium Strategy

- **Free Plan** acts as top-of-funnel lead magnet
- Automatically upsell when limits are hit:
  - “Add 3rd user” → prompt upgrade
  - “More than 1 active project” → prompt upgrade
- Maintain full mobile & AI experience on Free to showcase value
- Time-gated access to Pro features (e.g. “Try Pro for 7 days”)

---

## 🪜 Upsell Opportunities

- Add-on: SMS alerts to crew leads ($5/month per team)
- Add-on: Permit tracking module ($10/month)
- Add-on: Custom templates/forms ($15/month)
- Add-on: Offline media sync expansion (larger file quotas)

---

## 🧾 Invoicing Model (Customer-Facing)

- Billing via Stripe (monthly or annual)
- Email receipt + dashboard view
- Auto-reminders for failed payments
- Admin can add/remove users/projects dynamically

---

## 🔐 Long-Term Retention Hooks

| Feature                      | Stickiness Benefit                         |
|------------------------------|--------------------------------------------|
| Daily logs & project history | Valuable data — hard to migrate away       |
| AI summaries & reports       | Saves hours weekly                         |
| Crew collaboration / alerts  | Replaces multiple tools (text, email, etc) |
| Invoices tied to logged work | Makes accounting seamless                  |

---

## 📈 MRR Growth Projection (Example Path)

| Month | Users | ARPU | MRR  |
|-------|-------|------|------|
| 1     | 15    | $40  | $600 |
| 2     | 35    | $55  | $1,925 |
| 4     | 80    | $75  | $6,000 |
| 6     | 120   | $90  | $10,800 |

