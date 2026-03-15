"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ProfileSection,
  ProfileSectionAvatar,
  ProfileSectionContent,
  ProfileSectionField,
  ProfileSectionFieldColumn,
  ProfileSectionFieldGroup,
  ProfileSectionFieldRow,
} from "./profile-section";

export interface ProfileEditInlineData {
  firstName: string;
  lastName: string;
}

export interface ProfileEditInlineState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface ProfileEditInlineProps {
  initialData?: Partial<ProfileEditInlineData>;
  avatarInitial?: string;
  action: (
    prevState: ProfileEditInlineState,
    formData: FormData,
  ) => Promise<ProfileEditInlineState>;
  onCancel: () => void;
}

const initialState: ProfileEditInlineState = {
  success: false,
};

export function ProfileEditInline({
  initialData,
  avatarInitial,
  action,
  onCancel,
}: ProfileEditInlineProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const t = useTranslations("account");

  // Close on success
  useEffect(() => {
    if (state.success) {
      onCancel();
    }
  }, [state.success, onCancel]);

  return (
    <form action={formAction}>
      <ProfileSection>
        <ProfileSectionAvatar initial={avatarInitial} />
        <ProfileSectionContent>
          <ProfileSectionFieldRow>
            <ProfileSectionFieldGroup>
              <ProfileSectionFieldColumn>
                <ProfileSectionField>
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    {t("firstName")}
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    placeholder={t("firstNamePlaceholder")}
                    defaultValue={initialData?.firstName ?? ""}
                    aria-invalid={!!state.fieldErrors?.firstName}
                  />
                  {state.fieldErrors?.firstName && (
                    <p className="text-destructive text-xs">
                      {state.fieldErrors.firstName}
                    </p>
                  )}
                </ProfileSectionField>
              </ProfileSectionFieldColumn>
              <ProfileSectionFieldColumn>
                <ProfileSectionField>
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    {t("lastName")}
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    placeholder={t("lastNamePlaceholder")}
                    defaultValue={initialData?.lastName ?? ""}
                    aria-invalid={!!state.fieldErrors?.lastName}
                  />
                  {state.fieldErrors?.lastName && (
                    <p className="text-destructive text-xs">
                      {state.fieldErrors.lastName}
                    </p>
                  )}
                </ProfileSectionField>
              </ProfileSectionFieldColumn>
            </ProfileSectionFieldGroup>
          </ProfileSectionFieldRow>

          {state.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {state.error}
            </div>
          )}

          <div className="flex flex-col @xs:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              {t("saveChanges")}
            </Button>
          </div>
        </ProfileSectionContent>
      </ProfileSection>
    </form>
  );
}
