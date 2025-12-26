export function Badge({ variant, children }) {
  const styles = {
    green: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
    yellow: "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-200",
    red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
    gray: "bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-200",
    purple: "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
        styles[variant] || styles.gray
      }`}
    >
      {children}
    </span>
  );
}

export function SectionCard({ title, subtitle, rightSlot, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function InfoRow({ label, value, emphasize = false }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm text-gray-900 text-right break-words ${
          emphasize ? "font-semibold" : "font-medium"
        }`}
      >
        {value ?? "-"}
      </span>
    </div>
  );
}

export function StatPill({ label, value }) {
  return (
    <div className="rounded-2xl bg-gray-50 ring-1 ring-gray-200 px-4 py-3">
      <p className="text-[11px] text-gray-500 font-semibold tracking-wide uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function renderStatusBadge(superStatus) {
  if (superStatus === "Done") return <Badge variant="green">Done</Badge>;
  if (superStatus === "Pending") return <Badge variant="yellow">Pending</Badge>;
  if (superStatus === "In Progress") return <Badge variant="purple">In Progress</Badge>;
  if (superStatus === "Cancelled") return <Badge variant="red">Cancelled</Badge>;
  return <Badge variant="gray">Unknown</Badge>;
}