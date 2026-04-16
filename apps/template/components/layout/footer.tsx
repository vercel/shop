import { siteConfig } from "@/lib/config";

import { SocialLinks } from "./social-links";

export function Footer({ locale }: { locale: string }) {
  const { socialLinks } = siteConfig;

  return (
    <footer>
      <div className="mx-auto px-4 pt-12 pb-22 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-5">
            &copy; Vercel Shop. All rights reserved.
          </p>
          {socialLinks.length > 0 && <SocialLinks links={socialLinks} />}
        </div>
      </div>
    </footer>
  );
}
