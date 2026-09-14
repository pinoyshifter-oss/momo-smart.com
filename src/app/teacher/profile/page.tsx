import { type Metadata } from "next";
import Link from "next/link";

import { CapIcon, LockIcon, UserIcon } from "~/app/_components/icons";
import { api } from "~/trpc/server";
import { Card, CardHeader, EmptyState } from "~/app/_components/ui";
import { PageHeader } from "../_components/page-header";
import { EmailForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile Settings" };
export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const me = await api.user.me();
  const profile = me.teacherProfile;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Your details as students and families see them, and how you sign in."
      />

      {!profile ? (
        <Card>
          <EmptyState>This account has no teacher profile.</EmptyState>
        </Card>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader
              icon={<UserIcon className="size-[18px]" />}
              title="Profile"
              subtitle="Shown on your courses, messages and your students' dashboards."
            />
            <ProfileForm
              initial={{
                title: me.title ?? "",
                name: me.name ?? "",
                subject: profile.subject ?? "",
                phone: profile.phone ?? "",
                officeLocation: profile.officeLocation ?? "",
                bio: profile.bio ?? "",
                photo: profile.photoUrl,
              }}
            />
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader
                icon={<LockIcon className="size-[18px]" />}
                title="Sign-in credentials"
                subtitle="The email and password you sign in with."
              />
              <EmailForm currentEmail={me.email ?? ""} />
              <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
                <div>
                  <p className="text-ink text-sm font-bold">Password</p>
                  <p className="text-muted text-xs">
                    You&apos;ll need your current password to change it.
                  </p>
                </div>
                <Link
                  href="/account/password"
                  className="border-line bg-surface text-ink hover:bg-canvas rounded-lg border px-3 py-2 text-xs font-semibold transition"
                >
                  Change password
                </Link>
              </div>
            </Card>

            <Card>
              <CardHeader
                icon={<CapIcon className="size-[18px]" />}
                title="School"
                subtitle="Managed by your school administrator."
              />
              <dl className="divide-line divide-y px-5">
                <Row
                  label="School"
                  value={
                    profile.organization
                      ? [profile.organization.name, profile.organization.city]
                          .filter(Boolean)
                          .join(", ")
                      : null
                  }
                />
                <Row label="Department" value={profile.department?.name} />
                <Row label="Employee ID" value={profile.employeeNumber} />
                <Row
                  label="Role"
                  value={me.role === "ADMIN" ? "Administrator" : "Teacher"}
                />
              </dl>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-muted text-xs">{label}</dt>
      <dd className="text-ink text-right text-sm font-semibold">
        {value ?? "—"}
      </dd>
    </div>
  );
}
