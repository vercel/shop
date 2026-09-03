import "server-only";
import { type AnyCustomerAccountDocument, gql } from "@shopify/hydrogen/customer-account";
import { cache } from "react";

import { requireCustomerAccessToken } from "@/lib/auth/server";
import type {
  CustomerAddress,
  CustomerAddressInput,
  CustomerOrder,
  CustomerOrdersPage,
  CustomerProfile,
} from "@/lib/types";

import { customerAccountFetch, type CustomerAccountResultOf } from "../customer-account";
import {
  ADDRESS_FRAGMENT,
  CUSTOMER_PROFILE_FRAGMENT,
  ORDER_FRAGMENT,
  ORDER_SUMMARY_FRAGMENT,
} from "../customer-account-fragments";
import {
  transformCustomerAddress,
  transformCustomerProfile,
  transformOrder,
  transformOrderSummary,
} from "../transforms/customer";

const ORDERS_PER_PAGE = 10;

export interface CustomerUserError {
  code?: string;
  field?: string[] | null;
  message: string;
}

const GET_CUSTOMER_PROFILE_QUERY = gql(
  `#graphql
  query getCustomerProfile {
    customer {
      ...CustomerProfileFields
    }
  }
`,
  [CUSTOMER_PROFILE_FRAGMENT],
);

const GET_CUSTOMER_ORDERS_QUERY = gql(
  `#graphql
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
`,
  [ORDER_SUMMARY_FRAGMENT],
);

const GET_CUSTOMER_ORDER_QUERY = gql(
  `#graphql
  query getCustomerOrder($id: ID!) {
    order(id: $id) {
      ...OrderFields
    }
  }
`,
  [ORDER_FRAGMENT],
);

const GET_CUSTOMER_ADDRESSES_QUERY = gql(
  `#graphql
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
`,
  [ADDRESS_FRAGMENT],
);

const CUSTOMER_ADDRESS_CREATE_MUTATION = gql(`#graphql
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
`);

const CUSTOMER_ADDRESS_UPDATE_MUTATION = gql(`#graphql
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
`);

const CUSTOMER_ADDRESS_DELETE_MUTATION = gql(`#graphql
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
`);

const CUSTOMER_UPDATE_MUTATION = gql(`#graphql
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
`);

type CustomerFetchOptions<Doc extends AnyCustomerAccountDocument> = Omit<
  Parameters<typeof customerAccountFetch<Doc>>[0],
  "accessToken"
> & { returnTo: string };

async function customerFetch<const Doc extends AnyCustomerAccountDocument>({
  returnTo,
  ...options
}: CustomerFetchOptions<Doc>): Promise<CustomerAccountResultOf<Doc>> {
  const accessToken = await requireCustomerAccessToken(returnTo);
  return customerAccountFetch<Doc>({ accessToken, ...options } as never);
}

function toUserErrors(
  errors: Array<{ code?: string | null; field?: string[] | null; message: string }>,
): CustomerUserError[] {
  return errors.map((error) => ({
    code: error.code ?? undefined,
    field: error.field,
    message: error.message,
  }));
}

export const getCustomerProfile = cache(async (): Promise<CustomerProfile | null> => {
  const data = await customerFetch({
    document: GET_CUSTOMER_PROFILE_QUERY,
    operation: "getCustomerProfile",
    returnTo: "/account/profile",
  });

  if (!data.customer) return null;

  return transformCustomerProfile(data.customer);
});

export async function getCustomerOrders(cursor?: {
  after?: string;
  before?: string;
}): Promise<CustomerOrdersPage> {
  const paginateBackward = Boolean(cursor?.before);
  const orderParams = new URLSearchParams();
  if (cursor?.after) orderParams.set("after", cursor.after);
  if (cursor?.before) orderParams.set("before", cursor.before);
  const returnTo = `/account/orders${orderParams.size > 0 ? `?${orderParams}` : ""}`;

  const data = await customerFetch({
    document: GET_CUSTOMER_ORDERS_QUERY,
    operation: "getCustomerOrders",
    returnTo,
    variables: {
      after: cursor?.after,
      before: cursor?.before,
      first: paginateBackward ? undefined : ORDERS_PER_PAGE,
      last: paginateBackward ? ORDERS_PER_PAGE : undefined,
    },
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
    pageInfo: {
      endCursor: orders.pageInfo.endCursor ?? null,
      hasNextPage: orders.pageInfo.hasNextPage,
      hasPreviousPage: orders.pageInfo.hasPreviousPage,
      startCursor: orders.pageInfo.startCursor ?? null,
    },
  };
}

export async function getCustomerOrder(id: string): Promise<CustomerOrder | null> {
  const data = await customerFetch({
    document: GET_CUSTOMER_ORDER_QUERY,
    operation: "getCustomerOrder",
    returnTo: `/account/orders/${encodeURIComponent(id)}`,
    variables: { id },
  });

  if (!data.order) return null;

  return transformOrder(data.order);
}

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const data = await customerFetch({
    document: GET_CUSTOMER_ADDRESSES_QUERY,
    operation: "getCustomerAddresses",
    returnTo: "/account/addresses",
  });

  if (!data.customer) return [];

  const defaultId = data.customer.defaultAddress?.id ?? null;
  const addresses = data.customer.addresses.nodes.map((address) =>
    transformCustomerAddress(address, defaultId),
  );

  return addresses.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

export async function createCustomerAddress(
  address: CustomerAddressInput,
  defaultAddress: boolean,
): Promise<CustomerUserError[]> {
  const data = await customerFetch({
    document: CUSTOMER_ADDRESS_CREATE_MUTATION,
    operation: "customerAddressCreate",
    returnTo: "/account/addresses",
    variables: { address, defaultAddress },
  });

  return toUserErrors(data.customerAddressCreate?.userErrors ?? []);
}

export async function updateCustomerAddress(
  addressId: string,
  address: CustomerAddressInput,
  defaultAddress: boolean,
): Promise<CustomerUserError[]> {
  const data = await customerFetch({
    document: CUSTOMER_ADDRESS_UPDATE_MUTATION,
    operation: "customerAddressUpdate",
    returnTo: "/account/addresses",
    variables: { address, addressId, defaultAddress },
  });

  return toUserErrors(data.customerAddressUpdate?.userErrors ?? []);
}

export async function deleteCustomerAddress(addressId: string): Promise<CustomerUserError[]> {
  const data = await customerFetch({
    document: CUSTOMER_ADDRESS_DELETE_MUTATION,
    operation: "customerAddressDelete",
    returnTo: "/account/addresses",
    variables: { addressId },
  });

  return toUserErrors(data.customerAddressDelete?.userErrors ?? []);
}

export async function updateCustomerProfile(input: {
  firstName: string;
  lastName: string;
}): Promise<CustomerUserError[]> {
  const data = await customerFetch({
    document: CUSTOMER_UPDATE_MUTATION,
    operation: "customerUpdate",
    returnTo: "/account/profile",
    variables: { input },
  });

  return toUserErrors(data.customerUpdate?.userErrors ?? []);
}
