import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

// Kit sequence IDs for renewal reminders
const KIT_SEQUENCES = {
  trainer_renewal: '2702351',    // 4-email sequence: 30/15/7/1 days before expiry
  facilitator_renewal: '2701298', // 4-email sequence: 30/15/7/1 days before expiry
};

// Stripe product IDs mapped to renewal type
const PRODUCT_RENEWAL_MAP: Record<string, keyof typeof KIT_SEQUENCES> = {
  'Live and Grieve™ Trainer Certification — Annual Renewal': 'trainer_renewal',
  'Live and Grieve™ Facilitator Certification — Annual Renewal': 'facilitator_renewal',
};

async function enrollInKitSequence(
  email: string,
  firstName: string,
  sequenceId: string,
): Promise<void> {
  const res = await fetch(
    `https://api.convertkit.com/v3/sequences/${sequenceId}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_secret: process.env.KIT_API_SECRET,
        email,
        first_name: firstName,
      }),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    console.error(`[stripe-webhook] Kit enroll failed for ${email}:`, err);
    throw new Error(`Kit enroll failed: ${err}`);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'misconfigured' }, { status: 500 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const rawBody = await req.text();

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Get customer email and name
  const email = session.customer_details?.email?.toLowerCase().trim();
  const firstName = session.customer_details?.name?.split(' ')[0] ?? '';

  if (!email) {
    console.error('[stripe-webhook] no email on session', session.id);
    return NextResponse.json({ error: 'no email' }, { status: 400 });
  }

  // Retrieve line items to identify product
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price.product'],
  });

  let enrolledSequence: string | null = null;

  for (const item of lineItems.data) {
    const product = item.price?.product as Stripe.Product | undefined;
    const productName = product?.name ?? '';
    const renewalType = PRODUCT_RENEWAL_MAP[productName];

    if (renewalType) {
      const sequenceId = KIT_SEQUENCES[renewalType];
      try {
        await enrollInKitSequence(email, firstName, sequenceId);
        enrolledSequence = sequenceId;
        console.log(
          `[stripe-webhook] enrolled ${email} in ${renewalType} sequence ${sequenceId}`,
        );
      } catch (err) {
        console.error('[stripe-webhook] enrollment error:', err);
        // Don't fail the webhook — Stripe will retry on 500
        return NextResponse.json(
          { error: 'kit enrollment failed' },
          { status: 500 },
        );
      }
      break;
    }
  }

  if (!enrolledSequence) {
    // Not a renewal product — ignore
    return NextResponse.json({ ok: true, action: 'ignored' });
  }

  return NextResponse.json({ ok: true, action: 'enrolled', sequenceId: enrolledSequence });
}
