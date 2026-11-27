// Deploys the gated build in dist/ to Cloudflare. Run after `pnpm build` and
// both privacy gates: this uploads dist/ as it is and never rebuilds it.
// Setup and credentials: docs/publish-pipeline.md.
//
// v2.mjmeyer.dev sits behind the Cloudflare Access application "v2.mjmeyer.dev"
// (5e13e357-83bf-454f-b57c-c3c126a7c716), which lets in only hello@mjmeyer.dev.
// It is managed in the Zero Trust dashboard, not here, so no deploy can change
// or remove it. It protects the hostname, so it covers whatever this serves.
import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Effect from "effect/Effect";

export default Alchemy.Stack(
  "mjmeyer-dev",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    // Assets only: no Worker code runs, and Cloudflare serves dist/ itself.
    // No workers.dev or preview URLs, so the Access-covered hostname is the
    // only way in.
    const site = yield* Cloudflare.Worker("Site", {
      name: "mjmeyer-dev-v2",
      assets: {
        directory: "./dist",
        htmlHandling: "drop-trailing-slash",
        notFoundHandling: "404-page",
      },
      domain: "v2.mjmeyer.dev",
      workersDev: false,
    });

    return { url: site.url };
  })
);
