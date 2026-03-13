export type MegamenuCategory = {
  href: string;
  title: string;
};

export type MegamenuPanel = {
  id: string;
  header: string;
  href: string | null;
  categories: MegamenuCategory[];
};

export type MegamenuItem = {
  id: string;
  label: string;
  href: string | null;
  panels: MegamenuPanel[];
};

export type MegamenuData = {
  items: MegamenuItem[];
};
