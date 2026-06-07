import "server-only";
import { requireSession } from "@/lib/auth/server";
import type {
  CustomerAddress,
  CustomerAddressInput,
  CustomerOrder,
  CustomerOrdersPage,
  CustomerProfile,
} from "@/lib/types";

import { customerAccountFetch } from "../fetch";
import {
  type ShopifyCustomerAddress,
  type ShopifyCustomerProfile,
  type ShopifyOrder,
  type ShopifyOrderSummary,
  transformCustomerAddress,
  transformCustomerProfile,
  transformOrder,
  transformOrderSummary,
} from "../transforms/customer";

export const ORDERS_PER_PAGE = 10;

export interface CustomerUserError {
  code?: string;
  field?: string[] | null;
  message: string;
}

const ADDRESS_FRAGMENT = `
  fragment AddressFields on CustomerAddress {
    address1
    address2
    city
    company
    firstName
    formatted
    id
    lastName
    phoneNumber
    territoryCode
    zip
    zoneCode
  }
`;

const ORDER_SUMMARY_FRAGMENT = `
  fragment OrderSummaryFields on Order {
    financialStatus
    fulfillmentStatus
    id
    name
    number
    processedAt
    totalPrice {
      amount
      currencyCode
    }
  }
`;

const GET_CUSTOMER_PROFILE_QUERY = `
  query getCustomerProfile {
    customer {
      emailAddress {
        emailAddress
      }
      firstName
      lastName
    }
  }
`;

const GET_CUSTOMER_ORDERS_QUERY = `
  ${ORDER_SUMMARY_FRAGMENT}
  query getCustomerOrders($after: String, $before: String, $first: Int, $last: Int) {
    customer {
      orders(after: $after, before: $before, first: $first, last: $last, reverse: true, sortKey: PROCESSED_AT) {
        nodes {
          ...OrderSummaryFields
        }
        pageInfo {
          endCursor
          hasNextPage
          hasPreviousPage
          startCursor
        }
      }
    }
  }
`;

const GET_CUSTOMER_ORDER_QUERY = `
  ${ADDRESS_FRAGMENT}
  ${ORDER_SUMMARY_FRAGMENT}
  query getCustomerOrder($id: ID!) {
    order(id: $id) {
      ...OrderSummaryFields
      lineItems(first: 50) {
        nodes {
          image {
            altText
            height
            url
            width
          }
          quantity
          title
          totalPrice {
            amount
            currencyCode
          }
          variantTitle
        }
      }
      shippingAddress {
        ...AddressFields
      }
      statusPageUrl
      subtotal {
        amount
        currencyCode
      }
      totalShipping {
        amount
        currencyCode
      }
      totalTax {
        amount
        currencyCode
      }
    }
  }
`;

const GET_CUSTOMER_ADDRESSES_QUERY = `
  ${ADDRESS_FRAGMENT}
  query getCustomerAddresses {
    customer {
      addresses(first: 30) {
        nodes {
          ...AddressFields
        }
      }
      defaultAddress {
        id
      }
    }
  }
`;

const CUSTOMER_ADDRESS_CREATE_MUTATION = `
  mutation customerAddressCreate($address: CustomerAddressInput!, $defaultAddress: Boolean) {
    customerAddressCreate(address: $address, defaultAddress: $defaultAddress) {
      customerAddress {
        id
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_ADDRESS_UPDATE_MUTATION = `
  mutation customerAddressUpdate($address: CustomerAddressInput, $addressId: ID!, $defaultAddress: Boolean) {
    customerAddressUpdate(address: $address, addressId: $addressId, defaultAddress: $defaultAddress) {
      customerAddress {
        id
      }
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_ADDRESS_DELETE_MUTATION = `
  mutation customerAddressDelete($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        code
        field
        message
      }
    }
  }
`;

const CUSTOMER_UPDATE_MUTATION = `
  mutation customerUpdate($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        firstName
        lastName
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function customerFetch<T>(
  operation: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const { accessToken } = await requireSession();
  return customerAccountFetch<T>({ accessToken, operation, query, variables });
}

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const data = await customerFetch<{ customer: ShopifyCustomerProfile | null }>(
    "getCustomerProfile",
    GET_CUSTOMER_PROFILE_QUERY,
  );

  if (!data.customer) return null;

  return transformCustomerProfile(data.customer);
}

export async function getCustomerOrders(cursor?: {
  after?: string;
  before?: string;
}): Promise<CustomerOrdersPage> {
  const paginateBackward = Boolean(cursor?.before);

  const data = await customerFetch<{
    customer: {
      orders: {
        nodes: ShopifyOrderSummary[];
        pageInfo: {
          endCursor: string | null;
          hasNextPage: boolean;
          hasPreviousPage: boolean;
          startCursor: string | null;
        };
      };
    } | null;
  }>("getCustomerOrders", GET_CUSTOMER_ORDERS_QUERY, {
    after: cursor?.after,
    before: cursor?.before,
    first: paginateBackward ? undefined : ORDERS_PER_PAGE,
    last: paginateBackward ? ORDERS_PER_PAGE : undefined,
  });

  const orders = data.customer?.orders;
  if (!orders) {
    return {
      orders: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
      },
    };
  }

  return {
    orders: orders.nodes.map(transformOrderSummary),
    pageInfo: orders.pageInfo,
  };
}

export async function getCustomerOrder(id: string): Promise<CustomerOrder | null> {
  const data = await customerFetch<{ order: ShopifyOrder | null }>(
    "getCustomerOrder",
    GET_CUSTOMER_ORDER_QUERY,
    { id },
  );

  if (!data.order) return null;

  return transformOrder(data.order);
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const data = await customerFetch<{
    customer: {
      addresses: { nodes: ShopifyCustomerAddress[] };
      defaultAddress: { id: string } | null;
    } | null;
  }>("getCustomerAddresses", GET_CUSTOMER_ADDRESSES_QUERY);

  if (!data.customer) return [];

  const defaultId = data.customer.defaultAddress?.id ?? null;
  const addresses = data.customer.addresses.nodes.map((address) =>
    transformCustomerAddress(address, defaultId),
  );

  // Surface the default address first; it's the one customers act on most.
  return addresses.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export async function createCustomerAddress(
  address: CustomerAddressInput,
  defaultAddress: boolean,
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerAddressCreate: { userErrors: CustomerUserError[] };
  }>("customerAddressCreate", CUSTOMER_ADDRESS_CREATE_MUTATION, {
    address,
    defaultAddress,
  });

  return data.customerAddressCreate.userErrors;
}

export async function updateCustomerAddress(
  addressId: string,
  address: CustomerAddressInput,
  defaultAddress: boolean,
): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerAddressUpdate: { userErrors: CustomerUserError[] };
  }>("customerAddressUpdate", CUSTOMER_ADDRESS_UPDATE_MUTATION, {
    address,
    addressId,
    defaultAddress,
  });

  return data.customerAddressUpdate.userErrors;
}

export async function deleteCustomerAddress(addressId: string): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerAddressDelete: { userErrors: CustomerUserError[] };
  }>("customerAddressDelete", CUSTOMER_ADDRESS_DELETE_MUTATION, { addressId });

  return data.customerAddressDelete.userErrors;
}

export async function updateCustomerProfile(input: {
  firstName: string;
  lastName: string;
}): Promise<CustomerUserError[]> {
  const data = await customerFetch<{
    customerUpdate: { userErrors: CustomerUserError[] };
  }>("customerUpdate", CUSTOMER_UPDATE_MUTATION, { input });

  return data.customerUpdate.userErrors;
}
