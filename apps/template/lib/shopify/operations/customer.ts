import type {
  Address,
  AddressInput,
  Connection,
  Customer,
  CustomerMutationResult,
  CustomerUpdateInput,
  Fulfillment,
  GetOrdersOptions,
  Money,
  Order,
  OrderLineItem,
} from "../types/customer";

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const DEBUG = process.env.DEBUG_SHOPIFY === "true";

// Cache the discovered API endpoint
let cachedApiEndpoint: string | null = null;

async function discoverCustomerApiEndpoint(): Promise<string> {
  if (cachedApiEndpoint) {
    return cachedApiEndpoint;
  }

  if (!SHOPIFY_STORE_DOMAIN) {
    throw new Error("SHOPIFY_STORE_DOMAIN environment variable is not set");
  }

  const discoveryUrl = `https://${SHOPIFY_STORE_DOMAIN}/.well-known/customer-account-api`;

  if (DEBUG) {
    console.log(`[customer-api] Discovering API endpoint from ${discoveryUrl}`);
  }

  let response: Response;
  try {
    response = await fetch(discoveryUrl);
  } catch (error) {
    throw new CustomerApiNotFoundError(
      `Failed to fetch Customer Account API discovery endpoint: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[customer-api] Discovery endpoint returned ${response.status} ${response.statusText}`,
    );
    console.error(`[customer-api]   url: ${discoveryUrl}`);
    logResponseBodyMetadata(
      "error",
      errorBody,
      response.headers.get("content-type"),
    );
    throw new CustomerApiNotFoundError(
      `Failed to discover Customer Account API endpoint (${response.status}). ` +
        `Make sure Customer Account API is enabled in Shopify Admin → Settings → Customer accounts`,
    );
  }

  const text = await response.text();

  let config: { graphql_api?: string };
  try {
    config = JSON.parse(text) as { graphql_api?: string };
  } catch {
    console.error(
      `[customer-api] Discovery returned invalid JSON from ${discoveryUrl}`,
    );
    logResponseBodyMetadata(
      "error",
      text,
      response.headers.get("content-type"),
    );
    throw new CustomerApiNotFoundError(
      "Customer Account API discovery returned invalid JSON. " +
        "Make sure Customer Account API is enabled for this store.",
    );
  }

  if (!config.graphql_api) {
    console.error(
      `[customer-api] Discovery response missing graphql_api field`,
    );
    console.error(
      `[customer-api]   response keys: ${Object.keys(config).join(", ") || "(none)"}`,
    );
    throw new CustomerApiNotFoundError(
      "Customer Account API discovery returned no graphql_api endpoint. " +
        "Make sure Customer Account API is enabled for this store.",
    );
  }

  cachedApiEndpoint = config.graphql_api;

  if (DEBUG) {
    console.log(`[customer-api] Discovered endpoint: ${cachedApiEndpoint}`);
  }

  return cachedApiEndpoint;
}

interface CustomerApiFetchResult<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
  }>;
}

function summarizeVariableValue(value: unknown, depth = 0): string {
  if (value === null) return "null";

  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "undefined":
      return "undefined";
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "array(0)";
        if (depth >= 1) return `array(${value.length})`;
        return `array(${value.length})<${summarizeVariableValue(value[0], depth + 1)}>`;
      }

      const entries = Object.entries(value);
      if (entries.length === 0) return "object";
      if (depth >= 1) {
        return `object(${entries.map(([key]) => key).join(",")})`;
      }

      return `object(${entries
        .map(
          ([key, nestedValue]) =>
            `${key}:${summarizeVariableValue(nestedValue, depth + 1)}`,
        )
        .join(",")})`;
    }
    default:
      return typeof value;
  }
}

function formatVariablesSummary(
  variables?: Record<string, unknown>,
): string | null {
  if (!variables || Object.keys(variables).length === 0) {
    return null;
  }

  return Object.entries(variables)
    .map(([key, value]) => `${key}=${summarizeVariableValue(value)}`)
    .join(", ");
}

function logVariablesSummary(
  level: "log" | "error",
  variables?: Record<string, unknown>,
): void {
  const summary = formatVariablesSummary(variables);
  if (!summary) return;

  console[level](`[customer-api]   variables: ${summary}`);
}

function logResponseBodyMetadata(
  level: "error" | "log",
  responseText: string,
  contentType: string | null,
): void {
  console[level](
    `[customer-api]   response metadata: content-type=${contentType ?? "unknown"}, size=${responseText.length} chars`,
  );
}

async function customerApiFetch<T>({
  accessToken,
  operation,
  query,
  variables,
}: {
  accessToken: string;
  operation: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const endpoint = await discoverCustomerApiEndpoint();
  const start = performance.now();

  if (DEBUG) {
    console.log(`[customer-api] ▶ ${operation}`);
    console.log(`[customer-api]   endpoint: ${endpoint}`);
    console.log(`[customer-api]   token: present`);
    logVariablesSummary("log", variables);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables, operationName: operation }),
  });

  const duration = performance.now() - start;

  if (!response.ok) {
    // Always log errors regardless of DEBUG flag
    const errorBody = await response.text();
    console.error(
      `[customer-api] ✗ ${operation} failed (${response.status}) in ${duration.toFixed(0)}ms`,
    );
    console.error(`[customer-api]   endpoint: ${endpoint}`);
    console.error(
      `[customer-api]   status: ${response.status} ${response.statusText}`,
    );
    logResponseBodyMetadata(
      "error",
      errorBody,
      response.headers.get("content-type"),
    );
    logVariablesSummary("error", variables);

    if (response.status === 401) {
      throw new CustomerApiUnauthorizedError(
        "Customer access token is invalid or expired",
      );
    }
    if (response.status === 404) {
      throw new CustomerApiNotFoundError("Customer API endpoint not found");
    }
    throw new Error(
      `Customer API error: ${response.status} ${response.statusText} - ${errorBody.slice(0, 200)}`,
    );
  }

  // Check content-type to ensure we're getting JSON back
  const contentType = response.headers.get("content-type");
  const isJsonResponse =
    contentType?.includes("application/json") ||
    contentType?.includes("application/graphql-response+json");
  if (!isJsonResponse) {
    const text = await response.text();
    console.error(
      `[customer-api] ✗ ${operation} returned non-JSON (${contentType}) in ${duration.toFixed(0)}ms`,
    );
    logResponseBodyMetadata("error", text, contentType);
    throw new CustomerApiNotFoundError(
      `Customer API returned non-JSON response (${contentType})`,
    );
  }

  const json: CustomerApiFetchResult<T> = await response.json();

  if (json.errors && json.errors.length > 0) {
    console.error(
      `[customer-api] ✗ ${operation} GraphQL errors in ${duration.toFixed(0)}ms`,
    );
    console.error(
      `[customer-api]   errors: ${JSON.stringify(json.errors, null, 2)}`,
    );
    logVariablesSummary("error", variables);
    throw new Error(
      `Customer API GraphQL errors: ${JSON.stringify(json.errors)}`,
    );
  }

  if (!json.data) {
    console.error(
      `[customer-api] ✗ ${operation} returned no data in ${duration.toFixed(0)}ms`,
    );
    console.error(
      `[customer-api]   response keys: ${Object.keys(json).join(", ") || "(none)"}`,
    );
    throw new Error("Customer API returned no data");
  }

  if (DEBUG) {
    console.log(
      `[customer-api] ✓ ${operation} completed in ${duration.toFixed(0)}ms`,
    );
  }

  return json.data;
}

export class CustomerApiUnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerApiUnauthorizedError";
  }
}

export class CustomerApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerApiNotFoundError";
  }
}

const MONEY_FRAGMENT = `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

const ADDRESS_FRAGMENT = `
  fragment AddressFields on CustomerAddress {
    id
    firstName
    lastName
    company
    address1
    address2
    city
    province
    country
    zip
    formatted
    phoneNumber
    zoneCode
    territoryCode
  }
`;

// Note: Does NOT include MONEY_FRAGMENT - parent query must include it
const ORDER_LINE_ITEM_FRAGMENT = `
  fragment OrderLineItemFields on LineItem {
    id
    name
    presentmentTitle
    quantity
    currentTotalPrice {
      ...MoneyFields
    }
    image {
      url
      altText
      width
      height
    }
  }
`;

// Note: Does NOT include MONEY_FRAGMENT - parent query must include it
const FULFILLMENT_FRAGMENT = `
  fragment FulfillmentFields on Fulfillment {
    trackingInformation {
      company
      number
      url
    }
    estimatedDeliveryAt
    status
    latestShipmentStatus
    fulfillmentLineItems(first: 50) {
      nodes {
        lineItem {
          id
        }
        quantity
      }
    }
  }
`;

// Single MONEY_FRAGMENT inclusion to avoid "fragment name must be unique" error
const ORDER_FRAGMENT = `
  ${MONEY_FRAGMENT}
  ${ORDER_LINE_ITEM_FRAGMENT}
  ${FULFILLMENT_FRAGMENT}
  fragment OrderFields on Order {
    id
    name
    number
    processedAt
    fulfillmentStatus
    financialStatus
    cancelledAt
    cancelReason
    totalPrice {
      ...MoneyFields
    }
    subtotal {
      ...MoneyFields
    }
    totalShipping {
      ...MoneyFields
    }
    totalTax {
      ...MoneyFields
    }
    currencyCode
    lineItems(first: 50) {
      nodes {
        ...OrderLineItemFields
      }
    }
    shippingAddress {
      id
      firstName
      lastName
      company
      address1
      address2
      city
      province
      country
      zip
      formatted
      phoneNumber
      zoneCode
      territoryCode
    }
    fulfillments(first: 20) {
      nodes {
        ...FulfillmentFields
      }
    }
    statusPageUrl
  }
`;

const GET_CUSTOMER_QUERY = `
  ${ADDRESS_FRAGMENT}
  query getCustomer {
    customer {
      id
      emailAddress {
        emailAddress
      }
      firstName
      lastName
      phoneNumber {
        phoneNumber
      }
      createdAt
      defaultAddress {
        ...AddressFields
      }
      numberOfOrders
    }
  }
`;

interface GetCustomerResponse {
  customer: {
    id: string;
    emailAddress: { emailAddress: string } | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber: { phoneNumber: string } | null;
    createdAt: string;
    defaultAddress: ShopifyCustomerAddress | null;
    numberOfOrders: number;
  } | null;
}

interface ShopifyCustomerAddress {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zoneCode: string | null;
  country: string | null;
  territoryCode: string | null;
  zip: string | null;
  phoneNumber: string | null;
  formatted: string[];
}

function transformAddress(
  addr: ShopifyCustomerAddress,
  isDefault = false,
): Address {
  return {
    id: addr.id,
    firstName: addr.firstName ?? undefined,
    lastName: addr.lastName ?? undefined,
    company: addr.company ?? undefined,
    address1: addr.address1 ?? undefined,
    address2: addr.address2 ?? undefined,
    city: addr.city ?? undefined,
    province: addr.province ?? undefined,
    provinceCode: addr.zoneCode ?? undefined,
    country: addr.country ?? undefined,
    countryCode: addr.territoryCode ?? undefined,
    zip: addr.zip ?? undefined,
    phone: addr.phoneNumber ?? undefined,
    formatted: addr.formatted,
    isDefault,
  };
}

/**
 * Get the authenticated customer's profile data
 */
export async function getCustomer(
  accessToken: string,
): Promise<Customer | null> {
  try {
    const data = await customerApiFetch<GetCustomerResponse>({
      accessToken,
      operation: "getCustomer",
      query: GET_CUSTOMER_QUERY,
    });

    if (!data.customer) {
      return null;
    }

    const c = data.customer;
    return {
      id: c.id,
      email: c.emailAddress?.emailAddress ?? "",
      firstName: c.firstName ?? undefined,
      lastName: c.lastName ?? undefined,
      phone: c.phoneNumber?.phoneNumber ?? undefined,
      createdAt: c.createdAt,
      defaultAddress: c.defaultAddress
        ? transformAddress(c.defaultAddress, true)
        : undefined,
      numberOfOrders: c.numberOfOrders,
    };
  } catch (error) {
    if (error instanceof CustomerApiUnauthorizedError) {
      console.error(
        `[customer-api] getCustomer caught unauthorized error: ${error.message}`,
      );
      return null;
    }
    throw error;
  }
}

const GET_ORDERS_QUERY = `
  ${ORDER_FRAGMENT}
  query getOrders($first: Int!, $after: String, $sortKey: OrderSortKeys, $reverse: Boolean) {
    customer {
      orders(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            ...OrderFields
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

interface ShopifyOrder {
  id: string;
  name: string;
  number: number;
  processedAt: string;
  fulfillmentStatus: string;
  financialStatus: string;
  cancelledAt: string | null;
  cancelReason: string | null;
  totalPrice: { amount: string; currencyCode: string };
  subtotal: { amount: string; currencyCode: string } | null;
  totalShipping: { amount: string; currencyCode: string };
  totalTax: { amount: string; currencyCode: string } | null;
  currencyCode: string;
  lineItems: {
    nodes: Array<{
      id: string;
      name: string;
      presentmentTitle: string | null;
      quantity: number;
      currentTotalPrice: { amount: string; currencyCode: string } | null;
      image: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    }>;
  };
  shippingAddress: ShopifyCustomerAddress | null;
  fulfillments: {
    nodes: Array<{
      trackingInformation: Array<{
        company: string | null;
        number: string | null;
        url: string | null;
      }>;
      estimatedDeliveryAt: string | null;
      status: string;
      latestShipmentStatus: string | null;
      fulfillmentLineItems: {
        nodes: Array<{ lineItem: { id: string }; quantity: number }>;
      };
    }>;
  };
  statusPageUrl: string;
}

interface GetOrdersResponse {
  customer: {
    orders: {
      edges: Array<{ node: ShopifyOrder; cursor: string }>;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
        endCursor: string | null;
      };
    };
  } | null;
}

function transformMoney(m: { amount: string; currencyCode: string }): Money {
  return { amount: m.amount, currencyCode: m.currencyCode };
}

function transformOrder(o: ShopifyOrder): Order {
  // Default money value for missing prices
  const zeroMoney = { amount: "0", currencyCode: o.currencyCode };

  return {
    id: o.id,
    name: o.name,
    orderNumber: o.number,
    processedAt: o.processedAt,
    fulfillmentStatus: o.fulfillmentStatus as Order["fulfillmentStatus"],
    financialStatus: o.financialStatus as Order["financialStatus"],
    cancelledAt: o.cancelledAt ?? undefined,
    cancelReason: o.cancelReason ?? undefined,
    totalPrice: transformMoney(o.totalPrice),
    subtotalPrice: o.subtotal ? transformMoney(o.subtotal) : undefined,
    totalShippingPrice: transformMoney(o.totalShipping),
    totalTax: o.totalTax ? transformMoney(o.totalTax) : undefined,
    totalDiscounts: undefined, // Not available in Customer Account API
    currencyCode: o.currencyCode,
    lineItems: o.lineItems.nodes.map(
      (li): OrderLineItem => ({
        id: li.id,
        title: li.name,
        variantTitle: li.presentmentTitle ?? undefined,
        quantity: li.quantity,
        originalTotalPrice: li.currentTotalPrice
          ? transformMoney(li.currentTotalPrice)
          : transformMoney(zeroMoney),
        discountedTotalPrice: li.currentTotalPrice
          ? transformMoney(li.currentTotalPrice)
          : transformMoney(zeroMoney),
        image: li.image
          ? {
              url: li.image.url,
              altText: li.image.altText ?? undefined,
              width: li.image.width ?? undefined,
              height: li.image.height ?? undefined,
            }
          : undefined,
      }),
    ),
    shippingAddress: o.shippingAddress
      ? transformAddress(o.shippingAddress)
      : undefined,
    billingAddress: undefined, // Not available in Customer Account API orders query
    fulfillments: o.fulfillments.nodes.map(
      (f): Fulfillment => ({
        trackingCompany: f.trackingInformation[0]?.company ?? undefined,
        trackingNumber: f.trackingInformation[0]?.number ?? undefined,
        trackingUrl: f.trackingInformation[0]?.url ?? undefined,
        deliveredAt: undefined, // Not available in Customer API
        estimatedDeliveryAt: f.estimatedDeliveryAt ?? undefined,
        // inTransitAt not available in Customer Account API
        inTransitAt: undefined,
        status: f.status as Fulfillment["status"],
        fulfillmentLineItems: f.fulfillmentLineItems.nodes.map((fli) => ({
          lineItemId: fli.lineItem.id,
          quantity: fli.quantity,
        })),
      }),
    ),
    statusPageUrl: o.statusPageUrl,
  };
}

/**
 * Get the authenticated customer's orders with pagination
 */
export async function getOrders(
  accessToken: string,
  options: GetOrdersOptions = {},
): Promise<{ orders: Order[]; pageInfo: Connection<Order>["pageInfo"] }> {
  const {
    first = 10,
    after,
    sortKey = "PROCESSED_AT",
    reverse = true,
  } = options;

  try {
    const data = await customerApiFetch<GetOrdersResponse>({
      accessToken,
      operation: "getOrders",
      query: GET_ORDERS_QUERY,
      variables: { first, after, sortKey, reverse },
    });

    if (!data.customer) {
      return {
        orders: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      };
    }

    const orders = data.customer.orders.edges.map((edge) =>
      transformOrder(edge.node),
    );
    const pageInfo = {
      hasNextPage: data.customer.orders.pageInfo.hasNextPage,
      hasPreviousPage: data.customer.orders.pageInfo.hasPreviousPage,
      startCursor: data.customer.orders.pageInfo.startCursor ?? undefined,
      endCursor: data.customer.orders.pageInfo.endCursor ?? undefined,
    };

    return { orders, pageInfo };
  } catch (error) {
    if (
      error instanceof CustomerApiUnauthorizedError ||
      error instanceof CustomerApiNotFoundError
    ) {
      console.error(
        `[customer-api] getOrders caught ${error.name}: ${error.message}`,
      );
      return {
        orders: [],
        pageInfo: { hasNextPage: false, hasPreviousPage: false },
      };
    }
    throw error;
  }
}

const GET_ORDER_QUERY = `
  ${ORDER_FRAGMENT}
  query getOrder($orderId: ID!) {
    order(id: $orderId) {
      ...OrderFields
    }
  }
`;

interface GetOrderResponse {
  order: ShopifyOrder | null;
}

/**
 * Get a single order by ID
 */
export async function getOrder(
  accessToken: string,
  orderId: string,
): Promise<Order | null> {
  try {
    const data = await customerApiFetch<GetOrderResponse>({
      accessToken,
      operation: "getOrder",
      query: GET_ORDER_QUERY,
      variables: { orderId },
    });

    if (!data.order) {
      return null;
    }

    return transformOrder(data.order);
  } catch (error) {
    if (
      error instanceof CustomerApiUnauthorizedError ||
      error instanceof CustomerApiNotFoundError
    ) {
      console.error(
        `[customer-api] getOrder caught ${error.name}: ${error.message}`,
      );
      return null;
    }
    throw error;
  }
}

const GET_ADDRESSES_QUERY = `
  ${ADDRESS_FRAGMENT}
  query getAddresses {
    customer {
      addresses(first: 50) {
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

interface GetAddressesResponse {
  customer: {
    addresses: {
      nodes: ShopifyCustomerAddress[];
    };
    defaultAddress: { id: string } | null;
  } | null;
}

/**
 * Get all addresses for the authenticated customer
 */
export async function getAddresses(accessToken: string): Promise<Address[]> {
  try {
    const data = await customerApiFetch<GetAddressesResponse>({
      accessToken,
      operation: "getAddresses",
      query: GET_ADDRESSES_QUERY,
    });

    if (!data.customer) {
      return [];
    }

    const defaultAddressId = data.customer.defaultAddress?.id;
    return data.customer.addresses.nodes.map((addr) =>
      transformAddress(addr, addr.id === defaultAddressId),
    );
  } catch (error) {
    if (
      error instanceof CustomerApiUnauthorizedError ||
      error instanceof CustomerApiNotFoundError
    ) {
      console.error(
        `[customer-api] getAddresses caught ${error.name}: ${error.message}`,
      );
      return [];
    }
    throw error;
  }
}

const UPDATE_CUSTOMER_MUTATION = `
  mutation updateCustomer($input: CustomerUpdateInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        firstName
        lastName
        phoneNumber {
          phoneNumber
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface UpdateCustomerResponse {
  customerUpdate: {
    customer: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phoneNumber: { phoneNumber: string } | null;
    } | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
      code: string | null;
    }>;
  };
}

/**
 * Update the authenticated customer's profile
 */
export async function updateCustomer(
  accessToken: string,
  input: CustomerUpdateInput,
): Promise<
  CustomerMutationResult<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>
> {
  const data = await customerApiFetch<UpdateCustomerResponse>({
    accessToken,
    operation: "updateCustomer",
    query: UPDATE_CUSTOMER_MUTATION,
    variables: { input },
  });

  const { customer, userErrors } = data.customerUpdate;

  if (userErrors.length > 0) {
    return {
      errors: userErrors.map((e) => ({
        field: e.field ?? undefined,
        message: e.message,
        code: e.code ?? undefined,
      })),
    };
  }

  return {
    data: customer
      ? {
          firstName: customer.firstName ?? undefined,
          lastName: customer.lastName ?? undefined,
          phone: customer.phoneNumber?.phoneNumber ?? undefined,
        }
      : undefined,
  };
}

const CREATE_ADDRESS_MUTATION = `
  ${ADDRESS_FRAGMENT}
  mutation createAddress($address: CustomerAddressInput!) {
    customerAddressCreate(address: $address) {
      customerAddress {
        ...AddressFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface CreateAddressResponse {
  customerAddressCreate: {
    customerAddress: ShopifyCustomerAddress | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
      code: string | null;
    }>;
  };
}

/**
 * Create a new address for the authenticated customer
 */
export async function createAddress(
  accessToken: string,
  address: AddressInput,
): Promise<CustomerMutationResult<Address>> {
  const data = await customerApiFetch<CreateAddressResponse>({
    accessToken,
    operation: "createAddress",
    query: CREATE_ADDRESS_MUTATION,
    variables: { address },
  });

  const { customerAddress, userErrors } = data.customerAddressCreate;

  if (userErrors.length > 0) {
    return {
      errors: userErrors.map((e) => ({
        field: e.field ?? undefined,
        message: e.message,
        code: e.code ?? undefined,
      })),
    };
  }

  return {
    data: customerAddress ? transformAddress(customerAddress) : undefined,
  };
}

const UPDATE_ADDRESS_MUTATION = `
  ${ADDRESS_FRAGMENT}
  mutation updateAddress($addressId: ID!, $address: CustomerAddressInput!) {
    customerAddressUpdate(addressId: $addressId, address: $address) {
      customerAddress {
        ...AddressFields
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface UpdateAddressResponse {
  customerAddressUpdate: {
    customerAddress: ShopifyCustomerAddress | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
      code: string | null;
    }>;
  };
}

/**
 * Update an existing address
 */
export async function updateAddress(
  accessToken: string,
  addressId: string,
  address: AddressInput,
): Promise<CustomerMutationResult<Address>> {
  const data = await customerApiFetch<UpdateAddressResponse>({
    accessToken,
    operation: "updateAddress",
    query: UPDATE_ADDRESS_MUTATION,
    variables: { addressId, address },
  });

  const { customerAddress, userErrors } = data.customerAddressUpdate;

  if (userErrors.length > 0) {
    return {
      errors: userErrors.map((e) => ({
        field: e.field ?? undefined,
        message: e.message,
        code: e.code ?? undefined,
      })),
    };
  }

  return {
    data: customerAddress ? transformAddress(customerAddress) : undefined,
  };
}

const DELETE_ADDRESS_MUTATION = `
  mutation deleteAddress($addressId: ID!) {
    customerAddressDelete(addressId: $addressId) {
      deletedAddressId
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface DeleteAddressResponse {
  customerAddressDelete: {
    deletedAddressId: string | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
      code: string | null;
    }>;
  };
}

/**
 * Delete an address
 */
export async function deleteAddress(
  accessToken: string,
  addressId: string,
): Promise<CustomerMutationResult<{ deletedAddressId: string }>> {
  const data = await customerApiFetch<DeleteAddressResponse>({
    accessToken,
    operation: "deleteAddress",
    query: DELETE_ADDRESS_MUTATION,
    variables: { addressId },
  });

  const { deletedAddressId, userErrors } = data.customerAddressDelete;

  if (userErrors.length > 0) {
    return {
      errors: userErrors.map((e) => ({
        field: e.field ?? undefined,
        message: e.message,
        code: e.code ?? undefined,
      })),
    };
  }

  return {
    data: deletedAddressId ? { deletedAddressId } : undefined,
  };
}

const SET_DEFAULT_ADDRESS_MUTATION = `
  mutation setDefaultAddress($addressId: ID!) {
    customerDefaultAddressUpdate(addressId: $addressId) {
      customer {
        defaultAddress {
          id
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface SetDefaultAddressResponse {
  customerDefaultAddressUpdate: {
    customer: { defaultAddress: { id: string } | null } | null;
    userErrors: Array<{
      field: string[] | null;
      message: string;
      code: string | null;
    }>;
  };
}

/**
 * Set an address as the default
 */
export async function setDefaultAddress(
  accessToken: string,
  addressId: string,
): Promise<CustomerMutationResult<{ defaultAddressId: string }>> {
  const data = await customerApiFetch<SetDefaultAddressResponse>({
    accessToken,
    operation: "setDefaultAddress",
    query: SET_DEFAULT_ADDRESS_MUTATION,
    variables: { addressId },
  });

  const { customer, userErrors } = data.customerDefaultAddressUpdate;

  if (userErrors.length > 0) {
    return {
      errors: userErrors.map((e) => ({
        field: e.field ?? undefined,
        message: e.message,
        code: e.code ?? undefined,
      })),
    };
  }

  return {
    data: customer?.defaultAddress
      ? { defaultAddressId: customer.defaultAddress.id }
      : undefined,
  };
}

