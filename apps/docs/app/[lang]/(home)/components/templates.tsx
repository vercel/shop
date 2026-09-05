import { cn } from "cn";
import Image from "next/image";

interface TemplatesProps {
  data: {
    title: string;
    description: string;
    link: string;
    image: string;
  }[];
  description: string;
  title: string;
}

export const Templates = ({ title, description, data }: TemplatesProps) => (
  <div className="grid gap-12 py-8 sm:py-12">
    <div className="grid max-w-3xl gap-2 text-balance">
      <h2 className="text-heading-20 sm:text-heading-24 md:text-heading-32 lg:text-heading-40">
        {title}
      </h2>
      <p className="text-balance text-copy-18 text-gray-900">{description}</p>
    </div>
    <div className="grid gap-8 md:grid-cols-3">
      {data.map((item) => (
        <a
          className="group flex-col overflow-hidden rounded-lg border bg-background p-4"
          href={item.link}
          key={item.title}
        >
          <h3 className="text-heading-16">{item.title}</h3>
          <p className="line-clamp-2 text-copy-18 text-gray-900">{item.description}</p>
          <Image
            alt={item.title}
            className={cn(
              "mt-8 -mb-12 ml-7 aspect-video -rotate-3 overflow-hidden rounded-md border object-cover object-top",
              "transition-transform duration-300 group-hover:-rotate-1 group-hover:scale-105",
            )}
            height={336}
            src={item.image}
            width={640}
          />
        </a>
      ))}
    </div>
  </div>
);
