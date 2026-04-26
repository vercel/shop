export function AccountPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
