const STATUS_BADGE: Record<string, string> = {
  pending:     "bg-yellow-100 text-yellow-800",
  resubmitted: "bg-blue-100 text-blue-800",
  approved:    "bg-green-100 text-green-800",
  returned:    "bg-orange-100 text-orange-800",
  rejected:    "bg-red-100 text-red-800",
};

const STATUS_LABEL: Record<string, string> = {
  pending:     "Pending",
  resubmitted: "Resubmitted",
  approved:    "Approved",
  returned:    "Returned",
  rejected:    "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export { STATUS_BADGE, STATUS_LABEL };
