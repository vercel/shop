"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface ProfileEditFormData {
  firstName: string;
  lastName: string;
}

export interface ProfileEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<ProfileEditFormData>;
  action: (
    prevState: ProfileEditFormState,
    formData: FormData,
  ) => Promise<ProfileEditFormState>;
}

export interface ProfileEditFormState {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

function FormField({
  id,
  label,
  error,
  required,
  ...inputProps
}: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
} & React.ComponentProps<typeof Input>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input id={id} name={id} aria-invalid={!!error} {...inputProps} />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

const initialState: ProfileEditFormState = {
  success: false,
};

export function ProfileEditForm({
  open,
  onOpenChange,
  initialData,
  action,
}: ProfileEditFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Close sheet on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-slot="profile-edit-form"
        className="overflow-y-auto sm:max-w-md"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>Update your profile information.</SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-6 p-4">
          {/* Name fields */}
          <FormField
            id="firstName"
            label="First name"
            required
            placeholder="John"
            defaultValue={initialData?.firstName ?? ""}
            error={state.fieldErrors?.firstName}
          />
          <FormField
            id="lastName"
            label="Last name"
            required
            placeholder="Doe"
            defaultValue={initialData?.lastName ?? ""}
            error={state.fieldErrors?.lastName}
          />

          {/* General error message */}
          {state.error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {state.error}
            </div>
          )}

          <SheetFooter className="mt-2 p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
