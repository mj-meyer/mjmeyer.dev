// Deploys the gated build in dist/ to Cloudflare. Run after `pnpm build` and
// both privacy gates: this uploads dist/ as it is and never rebuilds it.
// Setup and credentials: docs/publish-pipeline.md.
import * as Alchemy from "alchemy";
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Effect from "effect/Effect";

const hostname = "v2.mjmeyer.dev";

export default Alchemy.Stack(
  "mjmeyer-dev",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    // Only MJ, by one-time PIN to this address, until the apex moves here.
    const access = yield* Cloudflare.Access.Application("V2Access", {
      type: "self_hosted",
      name: hostname,
      domain: hostname,
      sessionDuration: "24h",
      policies: [
        {
          decision: "allow",
          include: [{ email: "hello@mjmeyer.dev" }],
        },
      ],
    });

    // Assets only: no Worker code runs, and Cloudflare serves dist/ itself.
    const site = yield* Cloudflare.Worker("Site", {
      assets: {
        directory: "./dist",
        htmlHandling: "drop-trailing-slash",
        notFoundHandling: "404-page",
      },
      domain: hostname,
      workersDev: false,
      access,
    });

    return { url: site.url, accessAud: access.aud };
  })
);
