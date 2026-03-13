declare module "vaul" {
  import * as React from "react";

  export interface DrawerRootProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    shouldScaleBackground?: boolean;
    direction?: "top" | "bottom" | "left" | "right";
    dismissible?: boolean;
    children?: React.ReactNode;
  }

  export interface DrawerContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }

  export interface DrawerOverlayProps
    extends React.HTMLAttributes<HTMLDivElement> {}

  export interface DrawerTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }

  export interface DrawerCloseProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
  }

  export interface DrawerPortalProps {
    children?: React.ReactNode;
  }

  export interface DrawerTitleProps
    extends React.HTMLAttributes<HTMLHeadingElement> {}

  export interface DrawerDescriptionProps
    extends React.HTMLAttributes<HTMLParagraphElement> {}

  export namespace Drawer {
    export const Root: React.FC<DrawerRootProps>;
    export const Trigger: React.ForwardRefExoticComponent<
      DrawerTriggerProps & React.RefAttributes<HTMLButtonElement>
    >;
    export const Portal: React.FC<DrawerPortalProps>;
    export const Overlay: React.ForwardRefExoticComponent<
      DrawerOverlayProps & React.RefAttributes<HTMLDivElement>
    >;
    export const Content: React.ForwardRefExoticComponent<
      DrawerContentProps & React.RefAttributes<HTMLDivElement>
    >;
    export const Close: React.ForwardRefExoticComponent<
      DrawerCloseProps & React.RefAttributes<HTMLButtonElement>
    >;
    export const Title: React.ForwardRefExoticComponent<
      DrawerTitleProps & React.RefAttributes<HTMLHeadingElement>
    >;
    export const Description: React.ForwardRefExoticComponent<
      DrawerDescriptionProps & React.RefAttributes<HTMLParagraphElement>
    >;
  }
}
