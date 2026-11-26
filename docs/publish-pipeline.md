# Publish pipeline

A push to the vault rebuilds the site with its published notes:

1. notes-backup's `Notify site` workflow sends a `notes-updated` dispatch to this repository.
2. `.github/workflows/publish.yml` checks out this site, the vault, and garden-processor side by side.
3. garden-processor writes the vault's `publish: true` Stream notes to `src/content/stream`.
4. `scripts/privacy-gate.mjs` checks that output against the vault, then `pnpm build` builds the site, and the gate checks `dist` too.
5. Alchemy uploads that gated `dist` to Cloudflare at `v2.mjmeyer.dev`, behind Cloudflare Access, once `PUBLISH_ENABLED` is set. It never rebuilds the site.

Pushes to `main` and manual runs (Actions → Publish → Run workflow) do the same.

Processed notes are never committed. This repository is public, so committing them would publish them; `src/content/stream/` is gitignored, and each run builds them into the deploy instead. Vercel's own Git builds of `main` stay off (`vercel.json`), because they cannot see the vault, so the Vercel site at `mjmeyer.dev` keeps its last deploy until the apex moves.

## Privacy gates

1. **garden-processor** emits only notes with `publish: true` outside its ignored folders, and only allowlisted front matter.
2. **The privacy gate** re-derives which vault notes are public, without the processor's code. It fails the run when:
   - a processed note has no `publish: true` vault note with its slug,
   - a processed note lacks `publish: true` or emits a private field (`internal`, `sourceDoc`, `accessed`, `depth`, `coverage`, `gaps`),
   - a processed note contains an HTML comment,
   - an asset is not embedded by a processed note, or
   - any processed note or built page shares three or more 8-word passages with a private note. Passages that a public note or a file already committed to this repository also contains are not counted, so quotes and existing Garden pages pass.
3. **Astro's schema** requires `publish: true` on every collection.

Actions logs of this repository are public, so the run hides the processor's log and the gate names private notes only by a hash of their vault path. To see paths, run the gate locally:

```sh
pnpm content:sync
node scripts/privacy-gate.mjs --vault ../repos/notes-backup --reveal
pnpm build && node scripts/privacy-gate.mjs --vault ../repos/notes-backup --dist dist --reveal
```

## Cloudflare

`alchemy.run.ts` declares the deploy, stage `v2`:

- **V2Access**: the Cloudflare Access application on `v2.mjmeyer.dev` that lets in only `hello@mjmeyer.dev`, by a one-time PIN. It was created before anything was served there; `applicationId` takes it over.
- **Site**: the assets-only Worker `mjmeyer-dev-v2` serving `dist` on `v2.mjmeyer.dev`, with no `workers.dev` or preview URLs. No Worker code runs. Paths drop their trailing slash, as `vercel.json` did, and unknown paths get `404.html`.

Both already exist: the first v2 deploy was made through the Cloudflare API, so the workflow passes `--adopt` and Alchemy takes them over instead of creating copies. Alchemy keeps its state in a state-store Worker on the account (`Cloudflare.state()`). CI fails rather than create it, so bootstrap it once, with the credentials below, by `CI=true pnpm exec alchemy state bootstrap`.

To deploy by hand, after the gates pass on a fresh `dist`:

```sh
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... pnpm exec alchemy deploy --stage v2 --adopt
```

### API token

Cloudflare → My Profile (or Manage Account) → API Tokens → Create Token → Custom token:

| Scope | Permission |
| --- | --- |
| Account | Workers Scripts: Edit |
| Account | Secrets Store: Edit (Alchemy's state store) |
| Account | Access: Apps and Policies: Edit |
| Account | Account Settings: Read |
| Zone `mjmeyer.dev` | Zone: Read |
| Zone `mjmeyer.dev` | DNS: Read |

Access needs Zero Trust on the account (Zero Trust → choose a team name, Free plan). One-time PIN login is on by default.

## Setup

In **mjmeyer.dev** → Settings → Secrets and variables → Actions:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `NOTES_READ_TOKEN` | Fine-grained token with **Contents: Read** on `mj-meyer/notes-backup` and `mj-meyer/garden-processor` |
| Secret | `CLOUDFLARE_API_TOKEN` | The token above |
| Secret | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Account home → Account ID |
| Variable | `GARDEN_PROCESSOR_REF` | Processor branch to run; defaults to `main`. See below |
| Variable | `PUBLISH_ENABLED` | `true` to deploy; anything else builds and gates without deploying |

### Which garden-processor ref

The workflow runs either processor: with a `bun.lock` it runs `bun run src/main.ts`, otherwise `pnpm install`, `pnpm build`, and `node dist/main.js`. Both gave byte-identical processed notes and built site on the vault at f63fd71.

| What is merged into garden-processor `main` | `GARDEN_PROCESSOR_REF` |
| --- | --- |
| Nothing yet | `feat/vault-conventions` (Bun), or `ratstack/15-format-everything` (Node, the top of the rat-stack PRs) |
| Only PR #1 | Unset (`main`, Bun) |
| PR #1 and the whole rat-stack stack, #2 to #16 | Unset (`main`, Node) |

Leave it unset only once PR #1 is merged: today's `main` predates the vault's conventions. A ref in the middle of the rat-stack stack is untested.

In **notes-backup**:

1. Copy `docs/notes-backup/notify-site.yml` to `.github/workflows/notify-site.yml`.
2. Add the secret `SITE_DISPATCH_TOKEN`: a fine-grained token with **Contents: Read and write** on `mj-meyer/mjmeyer.dev`, which GitHub requires to send a repository dispatch.

Run Actions → Publish → Run workflow with deploy unchecked once to see a gated build before setting `PUBLISH_ENABLED`.
