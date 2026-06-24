export function AccountPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium tracking-display">{title}</h1>
      {description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
  );
}
