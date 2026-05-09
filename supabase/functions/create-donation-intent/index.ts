import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const stripePublishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY")!;
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2026-03-25.dahlia" });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Find or create a Stripe Customer on the connected account for this donor
async function findOrCreateConnectedCustomer(
  stripeAccountId: string,
  userId: string,
  email?: string
): Promise<string> {
  // Search by metadata on the connected account
  const existing = await stripe.customers.list(
    { limit: 1, email: email || undefined },
    { stripeAccount: stripeAccountId }
  );

  // Verify it's actually the same user via metadata
  for (const customer of existing.data) {
    if (customer.metadata?.user_id === userId) {
      return customer.id;
    }
  }

  // Create a new customer on the connected account
  const customer = await stripe.customers.create(
    {
      email: email || undefined,
      metadata: { user_id: userId },
    },
    { stripeAccount: stripeAccountId }
  );

  return customer.id;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // Parse and validate request body
  let body: {
    mosque_id?: string;
    amount?: number;
    currency?: string;
    user_id?: string;
    email?: string;
    project_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { mosque_id, amount, currency = "usd", user_id, email, project_id } = body;

  if (!mosque_id) {
    return jsonResponse({ error: "mosque_id is required" }, 400);
  }
  if (!amount || typeof amount !== "number" || amount < 100) {
    return jsonResponse({ error: "amount must be at least 100 (cents)" }, 400);
  }

  // Look up the mosque and verify it can accept payments
  const { data: mosque, error: mosqueError } = await supabase
    .from("mosques")
    .select("stripe_account_id, stripe_charges_enabled, name")
    .eq("id", mosque_id)
    .single();

  if (mosqueError || !mosque) {
    return jsonResponse({ error: "Mosque not found" }, 404);
  }

  if (!mosque.stripe_account_id || !mosque.stripe_charges_enabled) {
    return jsonResponse(
      { error: "This mosque is not set up to accept donations yet" },
      400
    );
  }

  try {
    // Create or find customer on the connected account
    let customerId: string | undefined;

    if (user_id) {
      customerId = await findOrCreateConnectedCustomer(
        mosque.stripe_account_id,
        user_id,
        email
      );
    }

    // Create PaymentIntent directly on the connected account (direct charge)
    // No application_fee_amount — mosque keeps 100%
    // No transfer_data — charge is on the connected account itself
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency,
        ...(customerId ? { customer: customerId } : {}),
        metadata: {
          type: "donation",
          mosque_id,
          user_id: user_id || "anonymous",
          project: project_id || "general_fund",
        },
        automatic_payment_methods: { enabled: true },
      },
      { stripeAccount: mosque.stripe_account_id }
    );

    // Create ephemeral key for mobile PaymentSheet (requires a customer)
    let ephemeralKey: string | undefined;
    if (customerId) {
      const key = await stripe.ephemeralKeys.create(
        { customer: customerId },
        {
          stripeAccount: mosque.stripe_account_id,
          apiVersion: "2026-03-25.dahlia",
        }
      );
      ephemeralKey = key.secret;
    }

    return jsonResponse({
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey || null,
      customerId: customerId || null,
      publishableKey: stripePublishableKey,
      stripeAccountId: mosque.stripe_account_id,
    });
  } catch (err) {
    console.error("Failed to create donation intent:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
});
