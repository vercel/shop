import type * as React from "react";

interface StorefrontCanvasProps extends React.ComponentProps<"div"> {
  route: string;
}

export function StorefrontCanvas({ route, ...props }: StorefrontCanvasProps) {
  return <div data-storefront-canvas={route} {...props} />;
}
