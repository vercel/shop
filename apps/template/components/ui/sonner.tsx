"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      duration={5000}
      expand
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      position="bottom-right"
      richColors
      visibleToasts={4}
      toastOptions={{
        classNames: {
          actionButton: "cursor-pointer",
          cancelButton: "cursor-pointer",
          closeButton: "cursor-pointer",
          toast: "font-sans",
        },
      }}
      {...props}
    />
  );
}
