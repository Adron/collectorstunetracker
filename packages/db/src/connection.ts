/**
 * pg treats sslmode=prefer|require|verify-ca as verify-full today, warns on every connection, and will switch
 * them to weaker libpq semantics in pg v9. Neon's injected URLs say sslmode=require, so spell out verify-full:
 * same behavior as now, no warning, and no silent downgrade on the next pg upgrade.
 * URLs without sslmode (local Postgres, CI) are left alone.
 */
export function withVerifiedSsl(url: string): string {
  return url.replace(/([?&]sslmode=)(prefer|require|verify-ca)(?=&|$)/, "$1verify-full");
}
