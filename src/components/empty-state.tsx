export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}
