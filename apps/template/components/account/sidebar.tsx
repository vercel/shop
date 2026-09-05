import { SidebarClient } from "./sidebar-client";

const ACCOUNT = {
  addAddress: "Add address",
  addressCity: "City",
  addressCompany: "Company",
  addressCountry: "Country code",
  addressCountryPlaceholder: "e.g. US",
  addresses: "Addresses",
  addressesDescription: "Manage your saved addresses",
  addressFirstName: "First name",
  addressLastName: "Last name",
  addressLine1: "Address",
  addressLine2: "Apartment, suite, etc.",
  addressPhone: "Phone",
  addressZip: "ZIP / Postal code",
  addressZone: "State / Province code",
  addressZonePlaceholder: "e.g. CA",
  cancel: "Cancel",
  defaultAddress: "Default",
  delete: "Delete",
  deleteAddressConfirm: "This address will be permanently removed from your account.",
  deleteAddressTitle: "Delete address?",
  edit: "Edit",
  editAddress: "Edit address",
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  name: "Name",
  newerOrders: "Newer",
  noAddresses: "You have no saved addresses yet.",
  noOrders: "You have no orders yet.",
  olderOrders: "Older",
  orders: "Orders",
  ordersDescription: "View your order history",
  profile: "Profile",
  profileDescription: "Your account information",
  profileUpdated: "Profile updated",
  save: "Save",
  setAsDefault: "Set as default address",
  shipping: "Shipping",
  shippingAddress: "Shipping address",
  signOut: "Sign out",
  subtotal: "Subtotal",
  tax: "Tax",
  total: "Total",
  viewOrderStatus: "View order status",
};

const ACCOUNT_LINKS = [
  { href: "/account/profile", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
] as const;

export function AccountSidebar() {
  const links = ACCOUNT_LINKS.map((link) => ({
    href: link.href,
    label: ACCOUNT[link.key],
  }));
  return <SidebarClient links={links} />;
}
