"use client";

import type * as React from "react";

interface NewsletterFormProps {
  ariaLabel: string;
  emailPlaceholder: string;
  signUpLabel: string;
}

export function NewsletterForm({ ariaLabel, emailPlaceholder, signUpLabel }: NewsletterFormProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={ariaLabel}
      className="flex w-full max-w-md mx-auto bg-background rounded-lg overflow-hidden"
    >
      <input
        type="email"
        name="email"
        required
        placeholder={emailPlaceholder}
        className="flex-1 min-w-0 px-4 h-12 text-sm text-foreground bg-background placeholder:text-foreground/40 focus:outline-none"
      />
      <button
        type="submit"
        className="shrink-0 px-5 h-12 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
      >
        {signUpLabel}
      </button>
    </form>
  );
}
