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
    // Created before the first deploy so nothing was ever served unprotected;
    // applicationId takes that application over and keeps its aud.
    const access = yield* Cloudflare.Access.Application("V2Access", {
      applicationId: "5e13e357-83bf-454f-b57c-c3c126a7c716",
      type: "self_hosted",
      name: hostname,
      domain: hostname,
      sessionDuration: "24h",
      allowedIdps: ["4104f926-60db-4e96-aa92-588116e15c37"], // one-time PIN
      autoRedirectToIdentity: true,
      policies: [
        {
          name: "MJ only",
          decision: "allow",
          include: [{ email: "hello@mjmeyer.dev" }],
        },
      ],
    });

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
      domain: hostname,
      workersDev: false,
    });

    return { url: site.url, accessAud: access.aud };
  })
);
