import { ChatIcon } from "~/app/_components/icons";
import { Card } from "~/app/_components/ui";

const code = "bg-canvas rounded px-1.5 py-0.5 text-xs font-semibold";

/** Shown instead of the inbox until a Convex deployment is connected. */
export function MessagingSetupNotice() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6 sm:p-8">
        <span className="bg-brand-soft text-brand flex size-11 items-center justify-center rounded-xl">
          <ChatIcon className="size-5" />
        </span>
        <h1 className="text-navy mt-4 text-2xl font-extrabold tracking-tight">
          Messaging isn&apos;t connected yet
        </h1>
        <p className="text-muted mt-2 text-sm">
          Messages are stored in Convex, separately from the school database. To
          connect a deployment, run:
        </p>
        <ol className="text-ink mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            <code className={code}>npx convex dev</code> to create or link a
            Convex deployment
          </li>
          <li>
            <code className={code}>npm run messaging:setup</code> to generate
            the sign-in keys
          </li>
          <li>Restart the app.</li>
        </ol>
      </Card>
    </div>
  );
}
