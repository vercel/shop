import { Container } from "@/components/ui/container";
import { TONES, type ToneId } from "@/lib/home/tones";
import { cn } from "@/lib/utils";

interface NewsletterCtaProps {
  buttonLabel: string;
  description: string;
  eyebrow: string;
  finePrint: string;
  placeholder: string;
  title: string;
  tone: ToneId;
}

export function NewsletterCta({
  buttonLabel,
  description,
  eyebrow,
  finePrint,
  placeholder,
  title,
  tone,
}: NewsletterCtaProps) {
  const t = TONES[tone];

  return (
    <section className={cn("py-10 lg:py-20", t.bg, t.fg)}>
      <Container className="px-5 lg:px-10">
        <div className="mx-auto grid max-w-2xl justify-items-center gap-5 text-center">
          <p className={cn("text-xs font-semibold uppercase tracking-[0.2em]", t.subtle)}>
            {eyebrow}
          </p>
          <div className="grid gap-2.5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl">{title}</h2>
            <p className={cn("text-sm md:text-base", t.subtle)}>{description}</p>
          </div>
          <form className="mt-2.5 flex w-full max-w-md flex-col gap-2.5 sm:flex-row">
            <label htmlFor="home-newsletter-email" className="sr-only">
              {placeholder}
            </label>
            <input
              id="home-newsletter-email"
              name="email"
              type="email"
              required
              placeholder={placeholder}
              className={cn(
                "h-12 flex-1 rounded-lg border bg-transparent px-4 text-sm focus:outline-none",
                t.inputBorder,
              )}
            />
            <button
              type="submit"
              className={cn(
                "inline-flex h-12 shrink-0 items-center justify-center rounded-lg px-8 text-sm font-medium transition-colors",
                t.solidButton,
              )}
            >
              {buttonLabel}
            </button>
          </form>
          <p className={cn("text-xs", t.subtle)}>{finePrint}</p>
        </div>
      </Container>
    </section>
  );
}
