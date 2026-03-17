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
} from "./profile-section";

import { getTranslations } from "next-intl/server";

export interface ProfileData {
  fullName?: string;
  email?: string;
  avatarInitial?: string;
}

export async function ProfileSectionComposed({
  profile,
  className,
}: {
  profile: ProfileData;
  className?: string;
}) {
  const t = await getTranslations("account");
  return (
    <ProfileSection className={className}>
      <ProfileSectionAvatar initial={profile.avatarInitial} />
      <ProfileSectionContent>
        <ProfileSectionFieldRow>
          <ProfileSectionFieldGroup>
            <ProfileSectionFieldColumn>
              <ProfileSectionField>
                <ProfileSectionFieldLabel>
                  {t("fullName")}
                </ProfileSectionFieldLabel>
                <ProfileSectionFieldValue>
                  {profile.fullName || "—"}
                </ProfileSectionFieldValue>
              </ProfileSectionField>
              <ProfileSectionField>
                <ProfileSectionFieldLabel>
                  {t("emailAddress")}
                </ProfileSectionFieldLabel>
                <ProfileSectionFieldValue>
                  {profile.email || "—"}
                </ProfileSectionFieldValue>
              </ProfileSectionField>
            </ProfileSectionFieldColumn>
          </ProfileSectionFieldGroup>
        </ProfileSectionFieldRow>
      </ProfileSectionContent>
    </ProfileSection>
  );
}
