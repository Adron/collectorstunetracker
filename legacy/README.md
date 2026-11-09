# legacy/

Reference-only material from before the re-platform. Nothing here is built or deployed.

- `database/` — the former [`collectorstunetracker_db`](https://github.com/Adron/collectorstunetracker_db) repo,
  imported with full history via `git subtree`. Superseded by [docs/spec/03](../docs/spec/03-domain-and-data-model.md).
  ⚠️ Its seed data contains a placeholder plaintext password and its docker-compose a hard-coded DB password —
  dev placeholders only; never reuse.

Planned for removal once the new schema ships (see [docs/spec/05](../docs/spec/05-build-plan.md), step C8).
