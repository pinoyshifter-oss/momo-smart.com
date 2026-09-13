import { type Metadata } from "next";

import { MessagingPage } from "~/app/_components/messaging/messaging-page";

export const metadata: Metadata = { title: "Messages" };

/** Contacts depend on the teacher's current rosters. */
export const dynamic = "force-dynamic";

export default function TeacherMessages() {
  return <MessagingPage basePath="/teacher/messages" />;
}
