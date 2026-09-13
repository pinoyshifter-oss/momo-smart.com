import { redirect } from "next/navigation";
import { Suspense } from "react";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { homeForRole } from "~/server/auth/home";
import { isMessagingConfigured } from "~/server/messaging/convex";
import { api } from "~/trpc/server";
import { MessagesHub } from "./messages-hub";
import { MessagingProvider } from "./provider";
import { MessagingSetupNotice } from "./setup-notice";

/**
 * Shared body of the student and teacher Messages pages. Contacts come from
 * the school database; conversations stream from Convex on the client.
 */
export async function MessagingPage({ basePath }: { basePath: string }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "SUPERADMIN") {
    redirect(homeForRole(session.user.role));
  }
  if (!isMessagingConfigured() || !env.NEXT_PUBLIC_CONVEX_URL) {
    return <MessagingSetupNotice />;
  }

  const contacts = await api.messaging.contacts();
  const viewer = {
    id: session.user.id,
    name: session.user.name ?? "You",
    role: session.user.role,
  };

  return (
    <MessagingProvider url={env.NEXT_PUBLIC_CONVEX_URL}>
      <Suspense fallback={null}>
        <MessagesHub viewer={viewer} contacts={contacts} basePath={basePath} />
      </Suspense>
    </MessagingProvider>
  );
}
