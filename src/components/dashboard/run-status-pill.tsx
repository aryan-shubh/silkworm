import { Badge as DrisBadge } from "@/components/dris/badge";

const VARIANT_BY_STATUS = {
  queued:   "daisy",
  running:  "aqua",
  finished: "lime",
  failed:   "cherry",
  crashed:  "amber",
  killed:   "silver",
} as const;

type RunStatus = keyof typeof VARIANT_BY_STATUS;

export function RunStatusPill({ status }: { status: RunStatus }) {
  return (
    <DrisBadge variant={VARIANT_BY_STATUS[status]} size="sm" rounded="default">
      {status}
    </DrisBadge>
  );
}
