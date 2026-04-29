import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";

import { NewsletterForm } from "./newsletter-section-client";

export async function NewsletterSection() {
  const t = await getTranslations("newsletter");

  return (
    <section>
      <Container>
        <div className="my-10 md:my-16 bg-link text-link-foreground px-5 py-10 md:px-10 md:py-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl mx-auto">
            {t("heading")}
          </h2>
          <p className="mt-2.5 text-sm md:text-base max-w-xl mx-auto">{t("description")}</p>
          <div className="mt-5">
            <NewsletterForm
              ariaLabel={t("ariaLabel")}
              emailPlaceholder={t("emailPlaceholder")}
              signUpLabel={t("signUp")}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
