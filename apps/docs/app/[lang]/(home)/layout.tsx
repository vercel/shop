import { GeistdocsHomeLayout } from "@vercel/geistdocs/home-layout";

import { config } from "@/lib/geistdocs/config";
import { source } from "@/lib/geistdocs/source";

const Layout = async ({ children, params }: LayoutProps<"/[lang]">) => {
  const { lang } = await params;

  return (
    <GeistdocsHomeLayout config={config} tree={source.pageTree[lang]}>
      <div className="shop-home pt-0 pb-32 font-sans">{children}</div>
    </GeistdocsHomeLayout>
  );
};

export default Layout;
