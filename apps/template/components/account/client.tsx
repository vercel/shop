"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ReactNode } from "react";
import { ProfileEditInline } from "@/components/account/profile-edit-inline";
import { updateProfileAction } from "@/components/account/actions";

interface ProfileEditToggleProps {
  initialData: {
    firstName: string;
    lastName: string;
  };
  avatarInitial: string;
  children: ReactNode;
}

export function ProfileEditToggle({
  initialData,
  avatarInitial,
  children,
}: ProfileEditToggleProps) {
  const t = useTranslations("account");
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ProfileEditInline
        initialData={initialData}
        avatarInitial={avatarInitial}
        action={updateProfileAction}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex flex-row items-center gap-2 rounded-[99px] border border-transparent bg-[#e9e9e9] px-3 py-1"
        >
          <span className="text-sm font-semibold text-[#020202]">
            {t("editProfile")}
          </span>
        </button>
      </div>
      {children}
    </>
  );
}
