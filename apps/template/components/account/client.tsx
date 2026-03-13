"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  CurrencySelectorComposed,
  LanguageSelectorComposed,
  ProfileEditInline,
  ProfileSection,
  ProfileSectionAvatar,
  ProfileSectionContent,
  ProfileSectionField,
  ProfileSectionFieldColumn,
  ProfileSectionFieldGroup,
  ProfileSectionFieldLabel,
  ProfileSectionFieldRow,
  ProfileSectionFieldValue,
} from "@/components/account";
import { updateProfileAction } from "@/components/account/actions";
import { syncCartLocaleAction } from "@/components/cart/actions";
import {
  getCurrencyCode,
  getEnabledCurrencies,
  getEnabledLocaleOptions,
  getPrimaryLocaleForCurrency,
  localeSwitchingEnabled,
} from "@/lib/i18n";

interface AccountClientProps {
  customer: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  currentLocale: string;
}

export function AccountClient({
  customer,
  currentLocale,
}: AccountClientProps) {
  const router = useRouter();
  const t = useTranslations("account");
  const [, startTransition] = useTransition();
  const [profileEditOpen, setProfileEditOpen] = useState(false);

  const currentCurrency = getCurrencyCode(currentLocale);
  const enabledLanguages = getEnabledLocaleOptions();
  const enabledCurrencies = getEnabledCurrencies();

  const fullName =
    customer.firstName && customer.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer.firstName || customer.lastName || undefined;

  const avatarInitial =
    customer.firstName?.charAt(0) || customer.email?.charAt(0) || "?";

  const handleLanguageChange = (newLocale: string) => {
    if (!localeSwitchingEnabled) return;
    if (newLocale === currentLocale) return;

    startTransition(async () => {
      const result = await syncCartLocaleAction(newLocale);
      if (!result.success) {
        console.error("Failed to sync cart locale:", result.error);
      }

      router.refresh();
    });
  };

  const handleCurrencyChange = (currency: string) => {
    const newLocale = getPrimaryLocaleForCurrency(currency);
    if (newLocale && newLocale !== currentLocale) {
      handleLanguageChange(newLocale);
    }
  };

  return (
    <div className="@container flex flex-col gap-10">
      {!profileEditOpen && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setProfileEditOpen(true)}
            className="flex flex-row items-center gap-2 rounded-[99px] border border-transparent bg-[#e9e9e9] px-3 py-1"
          >
            <span className="text-sm font-semibold text-[#020202]">
              {t("editProfile")}
            </span>
          </button>
        </div>
      )}

      {profileEditOpen ? (
        <ProfileEditInline
          initialData={{
            firstName: customer.firstName ?? "",
            lastName: customer.lastName ?? "",
          }}
          avatarInitial={avatarInitial}
          action={updateProfileAction}
          onCancel={() => setProfileEditOpen(false)}
        />
      ) : (
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
                      {customer.email || "—"}
                    </ProfileSectionFieldValue>
                  </ProfileSectionField>
                </ProfileSectionFieldColumn>
              </ProfileSectionFieldGroup>
            </ProfileSectionFieldRow>
          </ProfileSectionContent>
        </ProfileSection>
      )}

      <div className="flex flex-col gap-4 @sm:flex-row @sm:gap-6">
        <LanguageSelectorComposed
          currentLocale={currentLocale}
          languages={enabledLanguages}
          onSelect={handleLanguageChange}
        />
        <CurrencySelectorComposed
          currentCurrency={currentCurrency}
          currencies={enabledCurrencies}
          onSelect={handleCurrencyChange}
        />
      </div>

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
  );
}
