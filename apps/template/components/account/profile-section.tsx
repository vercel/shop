import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Root container for profile section
 */
function ProfileSection({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section"
      className={cn(
        "@container flex flex-col @md:flex-row gap-6 @md:gap-12",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Profile avatar - circular placeholder
 */
function ProfileSectionAvatar({
  className,
  initial,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { initial?: string }) {
  return (
    <div
      data-slot="profile-section-avatar"
      className={cn(
        "flex size-[100px] shrink-0 items-center justify-center self-center @md:self-start rounded-full border-2 border-[#e9e9e9] bg-[#f5f5f5] text-2xl font-medium text-[#797979]",
        className,
      )}
      {...props}
    >
      {initial?.toUpperCase()}
    </div>
  );
}

/**
 * Container for profile fields
 */
function ProfileSectionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section-content"
      className={cn("flex flex-col gap-6 @md:gap-10", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Container for a row of profile fields
 */
function ProfileSectionFieldRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section-field-row"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Container for a group of fields (two column layout)
 */
function ProfileSectionFieldGroup({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section-field-group"
      className={cn("flex flex-col @sm:flex-row gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Column within a field group
 */
function ProfileSectionFieldColumn({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section-field-column"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Individual profile field with label and value
 */
function ProfileSectionField({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="profile-section-field"
      className={cn("flex flex-col gap-2 p-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Field label
 */
function ProfileSectionFieldLabel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="profile-section-field-label"
      className={cn("text-sm font-normal text-[#2c2c2c]", className)}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Field value
 */
function ProfileSectionFieldValue({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="profile-section-field-value"
      className={cn("text-lg font-medium text-[#010101]", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export {
  ProfileSection,
  ProfileSectionAvatar,
  ProfileSectionContent,
  ProfileSectionFieldRow,
  ProfileSectionFieldGroup,
  ProfileSectionFieldColumn,
  ProfileSectionField,
  ProfileSectionFieldLabel,
  ProfileSectionFieldValue,
};
