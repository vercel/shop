import { siteConfig } from "@/lib/config";

import { SocialLinks } from "./social-links";

export function Footer({ locale }: { locale: string }) {
  const { socialLinks } = siteConfig;

  return (
    <footer>
      <div className="mx-auto px-5 pt-10 pb-22 lg:px-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <p className="text-sm text-muted-foreground leading-5">
            &copy; Vercel Shop. All rights reserved.
          </p>
          {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
        </div>
      </div>
    </footer>
  );
}
