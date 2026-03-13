import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AccountPageHeader } from "@/components/account/page-header";
import {
  ProfileSection,
  ProfileSectionAvatar,
  ProfileSectionContent,
  ProfileSectionField,
  ProfileSectionFieldColumn,
  ProfileSectionFieldGroup,
  ProfileSectionFieldLabel,
  ProfileSectionFieldRow,
  ProfileSectionFieldValue,
} from "@/components/account/profile-section";
import { ProfileEditToggle } from "@/components/account/client";
import { AccountProfilePageSkeleton } from "@/components/account/profile-page-skeleton";
import { requireCustomerSession } from "@/lib/auth/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("profile") };
}

export default function AccountProfilePage() {
  return (
    <Suspense fallback={<AccountProfilePageSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  const [t, session] = await Promise.all([
    getTranslations("account"),
    requireCustomerSession(),
  ]);

  const fullName =
    session.firstName && session.lastName
      ? `${session.firstName} ${session.lastName}`
      : session.firstName || session.lastName || undefined;

  const avatarInitial =
    session.firstName?.charAt(0) || session.email?.charAt(0) || "?";

  return (
    <div className="flex flex-col gap-8">
      <AccountPageHeader
        breadcrumbs={[{ label: t("settings") }, { label: t("profile") }]}
        title={t("profile")}
      />

      <div className="@container flex flex-col gap-10">
        <ProfileEditToggle
          initialData={{
            firstName: session.firstName ?? "",
            lastName: session.lastName ?? "",
          }}
          avatarInitial={avatarInitial}
        >
          <ProfileSection>
            <ProfileSectionAvatar initial={avatarInitial} />
            <ProfileSectionContent>
              <ProfileSectionFieldRow>
                <ProfileSectionFieldGroup>
                  <ProfileSectionFieldColumn>
                    <ProfileSectionField>
                      <ProfileSectionFieldLabel>
                        {t("fullName")}
                      </ProfileSectionFieldLabel>
                      <ProfileSectionFieldValue>
                        {fullName || "—"}
                      </ProfileSectionFieldValue>
                    </ProfileSectionField>
                    <ProfileSectionField>
                      <ProfileSectionFieldLabel>
                        {t("emailAddress")}
                      </ProfileSectionFieldLabel>
                      <ProfileSectionFieldValue>
                        {session.email || "—"}
                      </ProfileSectionFieldValue>
                    </ProfileSectionField>
                  </ProfileSectionFieldColumn>
                </ProfileSectionFieldGroup>
              </ProfileSectionFieldRow>
            </ProfileSectionContent>
          </ProfileSection>
        </ProfileEditToggle>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium text-[#2c2c2c]">
            {t("dangerZone")}
          </h2>
          <div className="flex flex-col gap-4 rounded-xl border border-[#c8c8c8] bg-white px-8 py-5">
            <div className="flex flex-col gap-6">
              <div className="relative">
                <button
                  type="button"
                  className="flex flex-row items-center justify-between gap-4 rounded-md border border-transparent bg-[#ececec] py-3 pr-3 pl-4 text-left sm:gap-10 sm:pl-6"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                    <span className="text-sm font-semibold text-[#010101]">
                      {t("deleteAccount")}
                    </span>
                    <span className="text-sm font-normal text-[#010101] opacity-50">
                      {t("cannotBeUndone")}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
