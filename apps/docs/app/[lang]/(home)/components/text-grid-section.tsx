interface TextGridSectionProps {
  data: {
    id: string;
    title: string;
    description: string;
  }[];
}

export const TextGridSection = ({ data }: TextGridSectionProps) => (
  <div className="grid gap-8 py-8 sm:py-12 md:grid-cols-3">
    {data.map((item) => (
      <div key={item.id}>
        <h3 className="mb-2 text-heading-20 dark:text-white">{item.title}</h3>
        <p className="text-copy-18 text-gray-900">{item.description}</p>
      </div>
    ))}
  </div>
);
