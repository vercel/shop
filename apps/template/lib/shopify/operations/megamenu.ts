import { defaultLocale } from "@/lib/i18n";
import type {
  MegamenuCategory,
  MegamenuData,
  MegamenuItem,
  MegamenuPanel,
} from "../types/megamenu";
import { getMenu } from "./menu";

export async function getMegamenuData(
  locale: string = defaultLocale,
): Promise<MegamenuData> {
  const menu = await getMenu("main-menu", locale);

  if (!menu || menu.items.length === 0) {
    return { items: [] };
  }

  const items: MegamenuItem[] = menu.items.map((topItem) => ({
    id: topItem.id,
    label: topItem.title,
    href: topItem.url,
    panels: topItem.items.map(
      (subItem): MegamenuPanel => ({
        id: subItem.id,
        header: subItem.title,
        href: subItem.url || null,
        categories: subItem.items.map(
          (child): MegamenuCategory => ({
            href: child.url,
            title: child.title,
          }),
        ),
      }),
    ),
  }));

  return { items };
}
