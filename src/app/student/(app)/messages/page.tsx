import { type Metadata } from "next";

import { MessagingPage } from "~/app/_components/messaging/messaging-page";

export const metadata: Metadata = { title: "Messages" };

/** Contacts depend on the student's current enrollments. */
export const dynamic = "force-dynamic";

export default function StudentMessages() {
  return <MessagingPage basePath="/student/messages" />;
}
