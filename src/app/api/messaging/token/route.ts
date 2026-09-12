import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { isMessagingConfigured } from "~/server/messaging/convex";
import { signMessagingToken } from "~/server/messaging/token";

export const dynamic = "force-dynamic";

/** A short-lived Convex token for the signed-in user, fetched by the messaging client. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  if (!isMessagingConfigured()) {
    return NextResponse.json(
      { error: "Messaging is not configured." },
      { status: 503 },
    );
  }

  const result = await signMessagingToken(session.user);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
