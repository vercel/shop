import { RatingStars } from "@/components/ui/rating-stars";

interface TestimonialsItem {
  author: string;
  detail: string;
  quote: string;
  rating: number;
}

interface TestimonialsProps {
  items: TestimonialsItem[];
  ratingLabel: (rating: number) => string;
  title: string;
}

export function Testimonials({ items, ratingLabel, title }: TestimonialsProps) {
  return (
    <div className="grid gap-4" data-slot="testimonials">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <ul className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 scroll-px-5 scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {items.map((item) => (
          <li
            key={item.author}
            className="grid w-[80%] shrink-0 snap-start content-start gap-4 rounded-xl border border-border p-5 lg:w-auto"
          >
            <RatingStars label={ratingLabel(item.rating)} value={item.rating} />
            <p className="text-pretty">{item.quote}</p>
            <p className="text-sm text-muted-foreground">
              {item.author} &middot; {item.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
