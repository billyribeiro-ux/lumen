# Security Policy

Lumen takes security seriously. This document outlines how to report vulnerabilities and the commitments the project makes to users regarding supported versions, disclosure, and remediation.

---

## Supported Versions

Security fixes are provided for the following versions of Lumen:

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | :white_check_mark: |

As Lumen is currently in pre-release (`0.x`), only the latest minor release receives security fixes. Once `1.0.0` ships, a formal LTS policy will be published.

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, report them privately using one of the following channels:

### Preferred: GitHub Private Vulnerability Reporting

1. Go to the [Security Advisories](https://github.com/billyribeiro-ux/lumen/security/advisories/new) page.
2. Click **Report a vulnerability**.
3. Fill out the form with as much detail as possible.

### Alternative: Email

Send an email to **security@lumen.so** with:

- A clear description of the vulnerability
- Steps to reproduce
- Affected version(s)
- Impact assessment
- Any proposed mitigation or patch

Please encrypt sensitive reports using the project's PGP key (available at `https://lumen.so/.well-known/security-pgp.asc` once launched).

---

## What to Expect

After you submit a report, you can expect the following timeline:

| Stage                    | Target SLA          |
| ------------------------ | ------------------- |
| Initial acknowledgement  | Within **48 hours** |
| Triage and severity assessment | Within **5 business days** |
| Fix development          | Within **30 days** for high/critical severity |
| Public disclosure        | After a patch is released and users have had time to upgrade (typically 14–30 days) |

You will receive:

- Acknowledgement of the report.
- Regular updates on triage and fix progress.
- Notification when a fix is released.
- Credit in the advisory and release notes (unless you request anonymity).

---

## Scope

The following are considered **in scope** for security reports:

- Vulnerabilities in the Lumen web application source code (`src/`, `drizzle/`, `src-tauri/`).
- Authentication, authorization, and session management flaws.
- Injection vulnerabilities (SQL, XSS, CSRF, command injection, etc.).
- Privilege escalation within the RBAC system.
- Data exposure in logs, error messages, or API responses.
- Billing and subscription tampering.
- Insecure configuration defaults in published releases.

The following are considered **out of scope**:

- Vulnerabilities in third-party dependencies without a direct exploit path in Lumen (report these upstream).
- Social engineering attacks against Lumen users or maintainers.
- Physical attacks or attacks requiring prior compromise of a user's device.
- Denial-of-service attacks that require excessive traffic volume.
- Issues in self-hosted deployments resulting from misconfiguration by the operator.
- Security issues in pre-release branches, development snapshots, or deprecated versions.
- Automated scanner output without a demonstrable exploit.

---

## Responsible Disclosure Guidelines

We ask that security researchers:

- Give us reasonable time to investigate and patch before public disclosure.
- Make a good-faith effort to avoid privacy violations, data destruction, service disruption, or degradation during research.
- Do not exploit the vulnerability beyond what is necessary to demonstrate the issue.
- Do not access, modify, or delete data belonging to other users.
- Comply with all applicable laws.

Researchers who follow these guidelines will not face legal action from the Lumen project for their research activities.

---

## Security Best Practices for Users

If you self-host or contribute to Lumen:

- Never commit `.env` files or secrets to version control.
- Rotate API keys (Stripe, Resend, Anthropic, database credentials) regularly.
- Keep dependencies up to date via `pnpm update` and Dependabot alerts.
- Review GitHub Security Advisories for this project regularly.
- Use strong, unique passwords and enable 2FA on all connected accounts (GitHub, Neon, Stripe, Resend).
- For production deployments, enable Neon's IP allowlist and Stripe Radar rules.

---

## Cryptography & Secrets

- All session tokens are signed with a server-side secret (`BETTER_AUTH_SECRET`) generated via `openssl rand -base64 32`.
- Passwords (when used) are hashed via Better Auth's default Argon2id configuration.
- Stripe webhook payloads are verified using `STRIPE_WEBHOOK_SECRET` before processing.
- Tauri desktop app updates are signed with an Ed25519 key pair (`TAURI_SIGNING_PRIVATE_KEY`).
- Database connections require TLS (`sslmode=require`).

---

## Hall of Fame

Security researchers who have responsibly disclosed vulnerabilities in Lumen will be credited here.

_No disclosures yet._

---

## Contact

- GitHub Security Advisories: https://github.com/billyribeiro-ux/lumen/security/advisories/new
- Email: security@lumen.so
- Maintainer: [@billyribeiro-ux](https://github.com/billyribeiro-ux)

Thank you for helping keep Lumen and its users safe.
