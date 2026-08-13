import { initBotId } from "botid/client/core";

// Register the public form routes that should be protected by Vercel BotID.
// initBotId runs before hydration (see Next.js instrumentation-client docs) and
// arms the invisible attestation the browser attaches to these requests, which
// the matching checkBotId() call on the server then verifies.
//
// "basic" keeps us on BotID Basic (free, no dashboard setup) rather than Deep
// Analysis, which requires a paid Vercel plan.
initBotId({
  protect: [
    {
      path: "/api/waitlist",
      method: "POST",
      advancedOptions: { checkLevel: "basic" },
    },
  ],
});
