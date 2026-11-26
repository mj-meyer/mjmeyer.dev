# Publish pipeline

A push to the vault rebuilds the site with its published notes:

1. notes-backup's `Notify site` workflow sends a `notes-updated` dispatch to this repository.
2. `.github/workflows/publish.yml` checks out this site, the vault, and garden-processor side by side.
3. garden-processor writes the vault's `publish: true` Stream notes to `src/content/stream`.
4. `scripts/privacy-gate.mjs` checks that output against the vault, then `pnpm build` builds the site, and the gate checks `dist` too.
5. The build deploys to Vercel production, once `PUBLISH_ENABLED` is set.

Pushes to `main` and manual runs (Actions → Publish → Run workflow) do the same.

Processed notes are never committed. This repository is public, so committing them would publish them; `src/content/stream/` is gitignored, and each run builds them into the deploy instead. Vercel's own Git builds of `main` are off (`vercel.json`), because they cannot see the vault. Branch previews still build, without vault notes.

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

## Setup

In **mjmeyer.dev** → Settings → Secrets and variables → Actions:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `NOTES_READ_TOKEN` | Fine-grained token with **Contents: Read** on `mj-meyer/notes-backup` and `mj-meyer/garden-processor` |
| Secret | `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| Secret | `VERCEL_ORG_ID` | `orgId` from `.vercel/project.json` after `vercel link` |
| Secret | `VERCEL_PROJECT_ID` | `projectId` from the same file |
| Variable | `GARDEN_PROCESSOR_REF` | Processor branch to run, such as `feat/vault-conventions`; defaults to `main` |
| Variable | `PUBLISH_ENABLED` | `true` to deploy; anything else builds and gates without deploying |

In **notes-backup**:

1. Copy `docs/notes-backup/notify-site.yml` to `.github/workflows/notify-site.yml`.
2. Add the secret `SITE_DISPATCH_TOKEN`: a fine-grained token with **Contents: Read and write** on `mj-meyer/mjmeyer.dev`, which GitHub requires to send a repository dispatch.

Run Actions → Publish → Run workflow with deploy unchecked once to see a gated build before setting `PUBLISH_ENABLED`.
