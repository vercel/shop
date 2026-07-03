import "server-only";

// Server-only entry for the Next app. The client implementation lives in
// ./storefront.core (Next-free) so eve agent tools can import it without the
// `server-only` guard, which eve's standalone runtime rejects.
export { storefront } from "./storefront.core";
