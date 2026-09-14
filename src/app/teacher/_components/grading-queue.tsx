import { sectionLabel } from "~/app/_components/format";
import { CheckCircleIcon, ChevronDownIcon } from "~/app/_components/icons";
import {
  Avatar,
  Card,
  EmptyState,
  GhostButton,
  Pill,
} from "~/app/_components/ui";

type QueueItem = {
  id: string;
  student: {
    id: string;
    user: { name: string | null; image: string | null };
  };
  assignment: {
    title: string;
    section: { code: string; course: { code: string } };
    rubric: { type: string } | null;
  };
};

export function GradingQueue({
  items,
  total,
}: {
  items: QueueItem[];
  total: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="text-ink flex items-center gap-2.5 text-[17px] font-bold">
          Grading Queue
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {total}
          </span>
        </h2>
        <GhostButton className="min-w-32 justify-between font-medium">
          All Sections
          <ChevronDownIcon className="size-3.5" />
        </GhostButton>
      </div>

      {items.length === 0 ? (
        <EmptyState>Nothing waiting — the queue is clear.</EmptyState>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-canvas text-ink border-line border-y text-[11px] font-bold tracking-wider uppercase">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-4 py-3">Assignment</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-line divide-y">
                {items.map((item) => {
                  const { rubric, section } = item.assignment;

                  return (
                    <tr key={item.id} className="hover:bg-canvas/60 transition">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={item.student.user.name}
                            src={item.student.user.image}
                            size="sm"
                          />
                          <p className="text-ink text-sm font-semibold whitespace-nowrap">
                            {item.student.user.name}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-brand min-w-[140px] text-sm leading-snug font-semibold">
                          {item.assignment.title}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <Pill tone="blue">
                          {sectionLabel(section.course.code, section.code)}
                        </Pill>
                      </td>

                      <td className="px-4 py-3.5">
                        {rubric ? (
                          rubric.type === "STANDARD" ? (
                            <Pill tone="green">
                              <CheckCircleIcon className="size-3.5" />
                              Rubric Ready
                            </Pill>
                          ) : (
                            <Pill tone="amber">Manual Scale</Pill>
                          )
                        ) : (
                          <Pill tone="slate">No Rubric</Pill>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          className="bg-navy hover:bg-navy-deep rounded-lg px-4 py-2 text-xs font-semibold text-white transition"
                        >
                          Grade
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="border-line flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
            <p className="text-muted text-xs">
              Showing {items.length} of {total}
            </p>
            <div className="flex items-center gap-2">
              <GhostButton>Previous</GhostButton>
              <button
                type="button"
                className="bg-navy hover:bg-navy-deep rounded-lg px-3 py-2 text-xs font-semibold text-white transition"
              >
                Next Page
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
