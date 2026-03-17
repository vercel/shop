import { FileQuestionIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default async function NotFoundError() {
  const t = await getTranslations("common");

  return (
    <Container className="flex flex-col items-center justify-center py-16 text-center lg:py-24">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted p-4">
          <FileQuestionIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="mb-2 text-2xl font-medium lg:text-3xl">{t("notFound")}</h1>
      <p className="mb-8 max-w-md text-muted-foreground">{t("notFoundDesc")}</p>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </Container>
  );
}
