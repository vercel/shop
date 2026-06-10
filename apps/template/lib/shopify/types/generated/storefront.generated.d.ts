/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import type * as StorefrontTypes from './storefront.types.js';

export type MoneyFieldsFragment = Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>;

export type ImageFieldsFragment = Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>;

export type ProductVariantFieldsFragment = (
  Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
  & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
);

export type TaxonomyCategoryFieldsFragment = (
  Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>
  & { ancestors: Array<Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>> }
);

export type MetafieldFieldsFragment = Pick<StorefrontTypes.Metafield, 'key' | 'namespace' | 'value' | 'type'>;

export type CartFieldsFragment = (
  Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
  & { lines: { edges: Array<{ node: (
        Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
        & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
          { __typename: 'CartAutomaticDiscountAllocation' }
          & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) | (
          { __typename: 'CartCodeDiscountAllocation' }
          & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) | (
          { __typename: 'CartCustomDiscountAllocation' }
          & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        )>, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
          & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
            Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
            & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
          ) }
        ) }
      ) | (
        Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
        & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
          { __typename: 'CartAutomaticDiscountAllocation' }
          & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) | (
          { __typename: 'CartCodeDiscountAllocation' }
          & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        ) | (
          { __typename: 'CartCustomDiscountAllocation' }
          & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
          & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        )>, merchandise: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
          & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
            Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
            & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
          ) }
        ) }
      ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
    { __typename: 'CartAutomaticDiscountAllocation' }
    & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
    & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
  ) | (
    { __typename: 'CartCodeDiscountAllocation' }
    & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
    & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
  ) | (
    { __typename: 'CartCustomDiscountAllocation' }
    & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
    & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
  )>, appliedGiftCards: Array<(
    Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
    & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
  )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
        Pick<StorefrontTypes.CartDeliveryOption, 'title'>
        & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )> }> } }
);

export type CollectionFieldsFragment = (
  Pick<StorefrontTypes.Collection, 'handle' | 'title' | 'description' | 'updatedAt'>
  & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'> }
);

export type ProductFieldsFragment = (
  Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'description' | 'descriptionHtml' | 'vendor' | 'tags' | 'updatedAt' | 'availableForSale'>
  & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, media: { edges: Array<{ node: Pick<StorefrontTypes.ExternalVideo, 'mediaContentType'> | (
        Pick<StorefrontTypes.MediaImage, 'mediaContentType'>
        & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
      ) | Pick<StorefrontTypes.Model3d, 'mediaContentType'> | (
        Pick<StorefrontTypes.Video, 'mediaContentType'>
        & { previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, sources: Array<Pick<StorefrontTypes.VideoSource, 'url' | 'mimeType' | 'width' | 'height'>> }
      ) }> }, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, variants: { edges: Array<{ node: (
        Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
        & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
      ) }> }, options: Array<(
    Pick<StorefrontTypes.ProductOption, 'id' | 'name' | 'values'>
    & { optionValues: Array<(
      Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>
      & { swatch?: StorefrontTypes.Maybe<(
        Pick<StorefrontTypes.ProductOptionValueSwatch, 'color'>
        & { image?: StorefrontTypes.Maybe<{ previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>> }> }
      )> }
    )> }
  )>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'>, category?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>
    & { ancestors: Array<Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>> }
  )>, collections: { edges: Array<{ node: Pick<StorefrontTypes.Collection, 'handle'> }> } }
);

export type ProductCardFieldsFragment = (
  Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
  & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
    & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
  )> }
);

export type GetCartQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
}>;


export type GetCartQuery = { cart?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
    & { lines: { edges: Array<{ node: (
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
            { __typename: 'CartAutomaticDiscountAllocation' }
            & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) | (
            { __typename: 'CartCodeDiscountAllocation' }
            & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) | (
            { __typename: 'CartCustomDiscountAllocation' }
            & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
            ) }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
            { __typename: 'CartAutomaticDiscountAllocation' }
            & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) | (
            { __typename: 'CartCodeDiscountAllocation' }
            & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          ) | (
            { __typename: 'CartCustomDiscountAllocation' }
            & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
            & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )>, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
            & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
              & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
            ) }
          ) }
        ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
      { __typename: 'CartAutomaticDiscountAllocation' }
      & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
      & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
    ) | (
      { __typename: 'CartCodeDiscountAllocation' }
      & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
      & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
    ) | (
      { __typename: 'CartCustomDiscountAllocation' }
      & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
      & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
    )>, appliedGiftCards: Array<(
      Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
      & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
    )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.CartDeliveryOption, 'title'>
          & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        )> }> } }
  )> };

export type CartCreateMutationVariables = StorefrontTypes.Exact<{
  input?: StorefrontTypes.InputMaybe<StorefrontTypes.CartInput>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CartCreateMutation = { cartCreate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartLinesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
}>;


export type CartLinesAddMutation = { cartLinesAdd?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartLinesUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineUpdateInput> | StorefrontTypes.CartLineUpdateInput;
}>;


export type CartLinesUpdateMutation = { cartLinesUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartLinesRemoveMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lineIds: Array<StorefrontTypes.Scalars['ID']['input']> | StorefrontTypes.Scalars['ID']['input'];
}>;


export type CartLinesRemoveMutation = { cartLinesRemove?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartBuyerIdentityUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  buyerIdentity: StorefrontTypes.CartBuyerIdentityInput;
}>;


export type CartBuyerIdentityUpdateMutation = { cartBuyerIdentityUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartNoteUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  note: StorefrontTypes.Scalars['String']['input'];
}>;


export type CartNoteUpdateMutation = { cartNoteUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type CartDiscountCodesUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  discountCodes: Array<StorefrontTypes.Scalars['String']['input']> | StorefrontTypes.Scalars['String']['input'];
}>;


export type CartDiscountCodesUpdateMutation = { cartDiscountCodesUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type GetCartSelectableAddressesQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
}>;


export type GetCartSelectableAddressesQuery = { cart?: StorefrontTypes.Maybe<{ delivery: { addresses: Array<Pick<StorefrontTypes.CartSelectableAddress, 'id'>> } }> };

export type CartDeliveryAddressesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  addresses: Array<StorefrontTypes.CartSelectableAddressInput> | StorefrontTypes.CartSelectableAddressInput;
}>;


export type CartDeliveryAddressesAddMutation = { cartDeliveryAddressesAdd?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type GetCartDeliveryOptionsQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
}>;


export type GetCartDeliveryOptionsQuery = { cart?: StorefrontTypes.Maybe<{ deliveryGroups: { nodes: Array<{ deliveryOptions: Array<(
          Pick<StorefrontTypes.CartDeliveryOption, 'title' | 'deliveryMethodType'>
          & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
        )> }> } }> };

export type CartDeliveryAddressesUpdateMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  addresses: Array<StorefrontTypes.CartSelectableAddressUpdateInput> | StorefrontTypes.CartSelectableAddressUpdateInput;
}>;


export type CartDeliveryAddressesUpdateMutation = { cartDeliveryAddressesUpdate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity' | 'note'>
      & { lines: { edges: Array<{ node: (
            Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) | (
            Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
            & { cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, discountAllocations: Array<(
              { __typename: 'CartAutomaticDiscountAllocation' }
              & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCodeDiscountAllocation' }
              & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            ) | (
              { __typename: 'CartCustomDiscountAllocation' }
              & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
              & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
            )>, merchandise: (
              Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
              & { selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
                Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle'>
                & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
              ) }
            ) }
          ) }> }, cost: { totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }, discountCodes: Array<Pick<StorefrontTypes.CartDiscountCode, 'code' | 'applicable'>>, discountAllocations: Array<(
        { __typename: 'CartAutomaticDiscountAllocation' }
        & Pick<StorefrontTypes.CartAutomaticDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCodeDiscountAllocation' }
        & Pick<StorefrontTypes.CartCodeDiscountAllocation, 'code'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      ) | (
        { __typename: 'CartCustomDiscountAllocation' }
        & Pick<StorefrontTypes.CartCustomDiscountAllocation, 'title'>
        & { discountedAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, appliedGiftCards: Array<(
        Pick<StorefrontTypes.AppliedGiftCard, 'id' | 'lastCharacters'>
        & { amountUsed: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, balance: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
      )>, deliveryGroups: { nodes: Array<{ selectedDeliveryOption?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.CartDeliveryOption, 'title'>
            & { estimatedCost: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }
          )> }> } }
    )>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>>, warnings: Array<Pick<StorefrontTypes.CartWarning, 'code' | 'message' | 'target'>> }> };

export type GetCollectionsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetCollectionsQuery = { collections: { edges: Array<{ node: (
        Pick<StorefrontTypes.Collection, 'handle' | 'title' | 'description' | 'updatedAt'>
        & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'> }
      ) }> } };

export type GetCollectionQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetCollectionQuery = { collection?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Collection, 'handle' | 'title' | 'description' | 'updatedAt'>
    & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'> }
  )> };

export type MenuItemFieldsFragment = (
  Pick<StorefrontTypes.MenuItem, 'id' | 'title' | 'url' | 'type' | 'tags'>
  & { resource?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Collection, 'handle'> | Pick<StorefrontTypes.Page, 'handle'> | Pick<StorefrontTypes.Product, 'handle'>> }
);

export type GetMenuQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
}>;


export type GetMenuQuery = { menu?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Menu, 'id' | 'handle' | 'title'>
    & { items: Array<(
      Pick<StorefrontTypes.MenuItem, 'id' | 'title' | 'url' | 'type' | 'tags'>
      & { items: Array<(
        Pick<StorefrontTypes.MenuItem, 'id' | 'title' | 'url' | 'type' | 'tags'>
        & { items: Array<(
          Pick<StorefrontTypes.MenuItem, 'id' | 'title' | 'url' | 'type' | 'tags'>
          & { resource?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Collection, 'handle'> | Pick<StorefrontTypes.Page, 'handle'> | Pick<StorefrontTypes.Product, 'handle'>> }
        )>, resource?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Collection, 'handle'> | Pick<StorefrontTypes.Page, 'handle'> | Pick<StorefrontTypes.Product, 'handle'>> }
      )>, resource?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Collection, 'handle'> | Pick<StorefrontTypes.Page, 'handle'> | Pick<StorefrontTypes.Product, 'handle'>> }
    )> }
  )> };

export type GetProductByHandleQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetProductByHandleQuery = { productByHandle?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'description' | 'descriptionHtml' | 'vendor' | 'tags' | 'updatedAt' | 'availableForSale'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, media: { edges: Array<{ node: Pick<StorefrontTypes.ExternalVideo, 'mediaContentType'> | (
          Pick<StorefrontTypes.MediaImage, 'mediaContentType'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
        ) | Pick<StorefrontTypes.Model3d, 'mediaContentType'> | (
          Pick<StorefrontTypes.Video, 'mediaContentType'>
          & { previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, sources: Array<Pick<StorefrontTypes.VideoSource, 'url' | 'mimeType' | 'width' | 'height'>> }
        ) }> }, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, variants: { edges: Array<{ node: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
        ) }> }, options: Array<(
      Pick<StorefrontTypes.ProductOption, 'id' | 'name' | 'values'>
      & { optionValues: Array<(
        Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>
        & { swatch?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.ProductOptionValueSwatch, 'color'>
          & { image?: StorefrontTypes.Maybe<{ previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>> }> }
        )> }
      )> }
    )>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'>, category?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>
      & { ancestors: Array<Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>> }
    )>, collections: { edges: Array<{ node: Pick<StorefrontTypes.Collection, 'handle'> }> } }
  )> };

export type CatalogProductsQueryVariables = StorefrontTypes.Exact<{
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  query?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CatalogProductsQuery = { products: { edges: Array<(
      Pick<StorefrontTypes.ProductEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
        & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        )> }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'> } };

export type SearchFacetsQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  productFilters?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.ProductFilter> | StorefrontTypes.ProductFilter>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type SearchFacetsQuery = { search: (
    Pick<StorefrontTypes.SearchResultItemConnection, 'totalCount'>
    & { productFilters: Array<(
      Pick<StorefrontTypes.Filter, 'id' | 'label' | 'type'>
      & { values: Array<Pick<StorefrontTypes.FilterValue, 'id' | 'label' | 'count' | 'input'>> }
    )> }
  ) };

export type SearchProductsQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  productFilters?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.ProductFilter> | StorefrontTypes.ProductFilter>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.SearchSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type SearchProductsQuery = { search: (
    Pick<StorefrontTypes.SearchResultItemConnection, 'totalCount'>
    & { edges: Array<(
      Pick<StorefrontTypes.SearchResultItemEdge, 'cursor'>
      & { node: (
        Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
        & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        )> }
      ) }
    )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'> }
  ) };

export type CollectionProductsQueryVariables = StorefrontTypes.Exact<{
  handle: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  after?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['String']['input']>;
  sortKey?: StorefrontTypes.InputMaybe<StorefrontTypes.ProductCollectionSortKeys>;
  reverse?: StorefrontTypes.InputMaybe<StorefrontTypes.Scalars['Boolean']['input']>;
  filters?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.ProductFilter> | StorefrontTypes.ProductFilter>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type CollectionProductsQuery = { collection?: StorefrontTypes.Maybe<{ products: { filters: Array<(
        Pick<StorefrontTypes.Filter, 'id' | 'label' | 'type'>
        & { values: Array<Pick<StorefrontTypes.FilterValue, 'id' | 'label' | 'count' | 'input'>> }
      )>, edges: Array<(
        Pick<StorefrontTypes.ProductEdge, 'cursor'>
        & { node: (
          Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
          & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
            Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
            & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
          )> }
        ) }
      )>, pageInfo: Pick<StorefrontTypes.PageInfo, 'hasNextPage' | 'hasPreviousPage' | 'startCursor' | 'endCursor'> } }> };

export type ProductRecommendationsQueryVariables = StorefrontTypes.Exact<{
  productId: StorefrontTypes.Scalars['ID']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type ProductRecommendationsQuery = { productRecommendations?: StorefrontTypes.Maybe<Array<(
    Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
      & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
    )> }
  )>> };

export type GetProductsByHandlesQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  first: StorefrontTypes.Scalars['Int']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetProductsByHandlesQuery = { products: { edges: Array<{ node: (
        Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
        & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
        )> }
      ) }> } };

export type GetProductByIdQueryVariables = StorefrontTypes.Exact<{
  id: StorefrontTypes.Scalars['ID']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetProductByIdQuery = { node?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'description' | 'descriptionHtml' | 'vendor' | 'tags' | 'updatedAt' | 'availableForSale'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, media: { edges: Array<{ node: Pick<StorefrontTypes.ExternalVideo, 'mediaContentType'> | (
          Pick<StorefrontTypes.MediaImage, 'mediaContentType'>
          & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
        ) | Pick<StorefrontTypes.Model3d, 'mediaContentType'> | (
          Pick<StorefrontTypes.Video, 'mediaContentType'>
          & { previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, sources: Array<Pick<StorefrontTypes.VideoSource, 'url' | 'mimeType' | 'width' | 'height'>> }
        ) }> }, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, maxVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, variants: { edges: Array<{ node: (
          Pick<StorefrontTypes.ProductVariant, 'id' | 'title' | 'availableForSale'>
          & { price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>>, image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>> }
        ) }> }, options: Array<(
      Pick<StorefrontTypes.ProductOption, 'id' | 'name' | 'values'>
      & { optionValues: Array<(
        Pick<StorefrontTypes.ProductOptionValue, 'id' | 'name'>
        & { swatch?: StorefrontTypes.Maybe<(
          Pick<StorefrontTypes.ProductOptionValueSwatch, 'color'>
          & { image?: StorefrontTypes.Maybe<{ previewImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>> }> }
        )> }
      )> }
    )>, seo: Pick<StorefrontTypes.Seo, 'title' | 'description'>, category?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>
      & { ancestors: Array<Pick<StorefrontTypes.TaxonomyCategory, 'id' | 'name'>> }
    )>, collections: { edges: Array<{ node: Pick<StorefrontTypes.Collection, 'handle'> }> } }
  )> };

export type GetProductsByIdsQueryVariables = StorefrontTypes.Exact<{
  ids: Array<StorefrontTypes.Scalars['ID']['input']> | StorefrontTypes.Scalars['ID']['input'];
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type GetProductsByIdsQuery = { nodes: Array<StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
    & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, selectedOrFirstAvailableVariant?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.ProductVariant, 'id' | 'availableForSale'>
      & { image?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url'>>, selectedOptions: Array<Pick<StorefrontTypes.SelectedOption, 'name' | 'value'>> }
    )> }
  )>> };

export type PredictiveSearchQueryVariables = StorefrontTypes.Exact<{
  query: StorefrontTypes.Scalars['String']['input'];
  limit: StorefrontTypes.Scalars['Int']['input'];
  limitScope?: StorefrontTypes.InputMaybe<StorefrontTypes.PredictiveSearchLimitScope>;
  types?: StorefrontTypes.InputMaybe<Array<StorefrontTypes.PredictiveSearchType> | StorefrontTypes.PredictiveSearchType>;
  country?: StorefrontTypes.InputMaybe<StorefrontTypes.CountryCode>;
  language?: StorefrontTypes.InputMaybe<StorefrontTypes.LanguageCode>;
}>;


export type PredictiveSearchQuery = { predictiveSearch?: StorefrontTypes.Maybe<{ products: Array<(
      Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'vendor' | 'availableForSale'>
      & { featuredImage?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Image, 'url' | 'altText' | 'width' | 'height'>>, priceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, compareAtPriceRange: { minVariantPrice: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> } }
    )>, collections: Array<Pick<StorefrontTypes.Collection, 'handle' | 'title'>>, queries: Array<Pick<StorefrontTypes.SearchQuerySuggestion, 'text' | 'styledText'>> }> };

export type GetSitemapPagesCountQueryVariables = StorefrontTypes.Exact<{
  type: StorefrontTypes.SitemapType;
}>;


export type GetSitemapPagesCountQuery = { sitemap: { pagesCount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Count, 'count'>> } };

export type GetSitemapPageQueryVariables = StorefrontTypes.Exact<{
  type: StorefrontTypes.SitemapType;
  page: StorefrontTypes.Scalars['Int']['input'];
}>;


export type GetSitemapPageQuery = { sitemap: { resources?: StorefrontTypes.Maybe<(
      Pick<StorefrontTypes.PaginatedSitemapResources, 'hasNextPage'>
      & { items: Array<Pick<StorefrontTypes.SitemapResource, 'handle' | 'updatedAt'> | Pick<StorefrontTypes.SitemapResourceMetaobject, 'handle' | 'updatedAt'>> }
    )> } };

interface GeneratedQueryTypes {
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  query getCart($cartId: ID!) {\n    cart(id: $cartId) {\n      ...CartFields\n    }\n  }\n": {return: GetCartQuery, variables: GetCartQueryVariables},
  "#graphql\n  query getCartSelectableAddresses($cartId: ID!) {\n    cart(id: $cartId) {\n      delivery {\n        addresses {\n          id\n        }\n      }\n    }\n  }\n": {return: GetCartSelectableAddressesQuery, variables: GetCartSelectableAddressesQueryVariables},
  "#graphql\n  query getCartDeliveryOptions($cartId: ID!) {\n    cart(id: $cartId) {\n      deliveryGroups(first: 5) {\n        nodes {\n          deliveryOptions {\n            title\n            estimatedCost {\n              amount\n              currencyCode\n            }\n            deliveryMethodType\n          }\n        }\n      }\n    }\n  }\n": {return: GetCartDeliveryOptionsQuery, variables: GetCartDeliveryOptionsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  fragment CollectionFields on Collection {\n    handle\n    title\n    description\n    image {\n      ...ImageFields\n    }\n    updatedAt\n    seo {\n      title\n      description\n    }\n  }\n\n  query getCollections($first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    collections(first: $first) {\n      edges {\n        node {\n          ...CollectionFields\n        }\n      }\n    }\n  }\n": {return: GetCollectionsQuery, variables: GetCollectionsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  fragment CollectionFields on Collection {\n    handle\n    title\n    description\n    image {\n      ...ImageFields\n    }\n    updatedAt\n    seo {\n      title\n      description\n    }\n  }\n\n  query getCollection($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      ...CollectionFields\n    }\n  }\n": {return: GetCollectionQuery, variables: GetCollectionQueryVariables},
  "#graphql\n  query getMenu($handle: String!) {\n    menu(handle: $handle) {\n      id\n      handle\n      title\n      items {\n        ...MenuItemFields\n        items {\n          ...MenuItemFields\n          items {\n            ...MenuItemFields\n          }\n        }\n      }\n    }\n  }\n  #graphql\n  fragment MenuItemFields on MenuItem {\n    id\n    title\n    url\n    type\n    tags\n    resource {\n      ... on Collection { handle }\n      ... on Product { handle }\n      ... on Page { handle }\n    }\n  }\n\n": {return: GetMenuQuery, variables: GetMenuQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductVariantFields on ProductVariant {\n    id\n    title\n    availableForSale\n    price {\n      ...MoneyFields\n    }\n    compareAtPrice {\n      ...MoneyFields\n    }\n    selectedOptions {\n      name\n      value\n    }\n    image {\n      ...ImageFields\n    }\n  }\n\n  #graphql\n  fragment TaxonomyCategoryFields on TaxonomyCategory {\n    id\n    name\n    ancestors {\n      id\n      name\n    }\n  }\n\n  fragment ProductFields on Product {\n    id\n    title\n    handle\n    description\n    descriptionHtml\n    vendor\n    tags\n    updatedAt\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    media(first: 10) {\n      edges {\n        node {\n          mediaContentType\n          ... on MediaImage {\n            image {\n              ...ImageFields\n            }\n          }\n          ... on Video {\n            previewImage {\n              ...ImageFields\n            }\n            sources {\n              url\n              mimeType\n              width\n              height\n            }\n          }\n        }\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n      maxVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n      maxVariantPrice {\n        ...MoneyFields\n      }\n    }\n    variants(first: 250) {\n      edges {\n        node {\n          ...ProductVariantFields\n        }\n      }\n    }\n    options {\n      id\n      name\n      values\n      optionValues {\n        id\n        name\n        swatch {\n          color\n          image {\n            previewImage {\n              url\n            }\n          }\n        }\n      }\n    }\n    seo {\n      title\n      description\n    }\n    category {\n      ...TaxonomyCategoryFields\n    }\n    collections(first: 10) {\n      edges {\n        node {\n          handle\n        }\n      }\n    }\n  }\n\n  query getProductByHandle($handle: String!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    productByHandle(handle: $handle) {\n      ...ProductFields\n    }\n  }\n": {return: GetProductByHandleQuery, variables: GetProductByHandleQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query catalogProducts($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    products(\n      first: $first\n      after: $after\n      query: $query\n      sortKey: $sortKey\n      reverse: $reverse\n    ) {\n      edges {\n        cursor\n        node {\n          ...ProductCardFields\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": {return: CatalogProductsQuery, variables: CatalogProductsQueryVariables},
  "#graphql\n  query searchFacets($query: String!, $productFilters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    search(\n      query: $query\n      productFilters: $productFilters\n      types: PRODUCT\n      first: 1\n    ) {\n      totalCount\n      productFilters {\n        id\n        label\n        type\n        values {\n          id\n          label\n          count\n          input\n        }\n      }\n    }\n  }\n": {return: SearchFacetsQuery, variables: SearchFacetsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query searchProducts($query: String!, $first: Int!, $after: String, $productFilters: [ProductFilter!], $sortKey: SearchSortKeys, $reverse: Boolean, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    search(\n      query: $query\n      first: $first\n      after: $after\n      productFilters: $productFilters\n      sortKey: $sortKey\n      reverse: $reverse\n      types: PRODUCT\n    ) {\n      totalCount\n      edges {\n        cursor\n        node {\n          ... on Product {\n            ...ProductCardFields\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n      }\n    }\n  }\n": {return: SearchProductsQuery, variables: SearchProductsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query collectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    collection(handle: $handle) {\n      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {\n        filters {\n          id\n          label\n          type\n          values {\n            id\n            label\n            count\n            input\n          }\n        }\n        edges {\n          cursor\n          node {\n            ...ProductCardFields\n          }\n        }\n        pageInfo {\n          hasNextPage\n          hasPreviousPage\n          startCursor\n          endCursor\n        }\n      }\n    }\n  }\n": {return: CollectionProductsQuery, variables: CollectionProductsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query productRecommendations($productId: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    productRecommendations(productId: $productId) {\n      ...ProductCardFields\n    }\n  }\n": {return: ProductRecommendationsQuery, variables: ProductRecommendationsQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query getProductsByHandles($query: String!, $first: Int!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    products(first: $first, query: $query) {\n      edges {\n        node {\n          ...ProductCardFields\n        }\n      }\n    }\n  }\n": {return: GetProductsByHandlesQuery, variables: GetProductsByHandlesQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductVariantFields on ProductVariant {\n    id\n    title\n    availableForSale\n    price {\n      ...MoneyFields\n    }\n    compareAtPrice {\n      ...MoneyFields\n    }\n    selectedOptions {\n      name\n      value\n    }\n    image {\n      ...ImageFields\n    }\n  }\n\n  #graphql\n  fragment TaxonomyCategoryFields on TaxonomyCategory {\n    id\n    name\n    ancestors {\n      id\n      name\n    }\n  }\n\n  fragment ProductFields on Product {\n    id\n    title\n    handle\n    description\n    descriptionHtml\n    vendor\n    tags\n    updatedAt\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    media(first: 10) {\n      edges {\n        node {\n          mediaContentType\n          ... on MediaImage {\n            image {\n              ...ImageFields\n            }\n          }\n          ... on Video {\n            previewImage {\n              ...ImageFields\n            }\n            sources {\n              url\n              mimeType\n              width\n              height\n            }\n          }\n        }\n      }\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n      maxVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n      maxVariantPrice {\n        ...MoneyFields\n      }\n    }\n    variants(first: 250) {\n      edges {\n        node {\n          ...ProductVariantFields\n        }\n      }\n    }\n    options {\n      id\n      name\n      values\n      optionValues {\n        id\n        name\n        swatch {\n          color\n          image {\n            previewImage {\n              url\n            }\n          }\n        }\n      }\n    }\n    seo {\n      title\n      description\n    }\n    category {\n      ...TaxonomyCategoryFields\n    }\n    collections(first: 10) {\n      edges {\n        node {\n          handle\n        }\n      }\n    }\n  }\n\n  query getProductById($id: ID!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    node(id: $id) {\n      ... on Product {\n        ...ProductFields\n      }\n    }\n  }\n": {return: GetProductByIdQuery, variables: GetProductByIdQueryVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment ProductCardFields on Product {\n    id\n    title\n    handle\n    vendor\n    availableForSale\n    featuredImage {\n      ...ImageFields\n    }\n    priceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    compareAtPriceRange {\n      minVariantPrice {\n        ...MoneyFields\n      }\n    }\n    selectedOrFirstAvailableVariant {\n      id\n      availableForSale\n      image {\n        url\n      }\n      selectedOptions {\n        name\n        value\n      }\n    }\n  }\n\n  query getProductsByIds($ids: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    nodes(ids: $ids) {\n      ... on Product {\n        ...ProductCardFields\n      }\n    }\n  }\n": {return: GetProductsByIdsQuery, variables: GetProductsByIdsQueryVariables},
  "#graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  query predictiveSearch($query: String!, $limit: Int!, $limitScope: PredictiveSearchLimitScope, $types: [PredictiveSearchType!], $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    predictiveSearch(\n      query: $query\n      limit: $limit\n      limitScope: $limitScope\n      types: $types\n    ) {\n      products {\n        id\n        title\n        handle\n        vendor\n        availableForSale\n        featuredImage {\n          ...ImageFields\n        }\n        priceRange {\n          minVariantPrice {\n            ...MoneyFields\n          }\n        }\n        compareAtPriceRange {\n          minVariantPrice {\n            ...MoneyFields\n          }\n        }\n      }\n      collections {\n        handle\n        title\n      }\n      queries {\n        text\n        styledText\n      }\n    }\n  }\n": {return: PredictiveSearchQuery, variables: PredictiveSearchQueryVariables},
  "#graphql\n  query getSitemapPagesCount($type: SitemapType!) {\n    sitemap(type: $type) {\n      pagesCount {\n        count\n      }\n    }\n  }\n": {return: GetSitemapPagesCountQuery, variables: GetSitemapPagesCountQueryVariables},
  "#graphql\n  query getSitemapPage($type: SitemapType!, $page: Int!) {\n    sitemap(type: $type) {\n      resources(page: $page) {\n        hasNextPage\n        items {\n          handle\n          updatedAt\n        }\n      }\n    }\n  }\n": {return: GetSitemapPageQuery, variables: GetSitemapPageQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartCreate($input: CartInput, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {\n    cartCreate(input: $input) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartCreateMutation, variables: CartCreateMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {\n    cartLinesAdd(cartId: $cartId, lines: $lines) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartLinesAddMutation, variables: CartLinesAddMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {\n    cartLinesUpdate(cartId: $cartId, lines: $lines) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartLinesUpdateMutation, variables: CartLinesUpdateMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {\n    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartLinesRemoveMutation, variables: CartLinesRemoveMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {\n    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartBuyerIdentityUpdateMutation, variables: CartBuyerIdentityUpdateMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartNoteUpdate($cartId: ID!, $note: String!) {\n    cartNoteUpdate(cartId: $cartId, note: $note) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartNoteUpdateMutation, variables: CartNoteUpdateMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {\n    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartDiscountCodesUpdateMutation, variables: CartDiscountCodesUpdateMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartDeliveryAddressesAdd($cartId: ID!, $addresses: [CartSelectableAddressInput!]!) {\n    cartDeliveryAddressesAdd(cartId: $cartId, addresses: $addresses) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartDeliveryAddressesAddMutation, variables: CartDeliveryAddressesAddMutationVariables},
  "#graphql\n  #graphql\n  #graphql\n  fragment ImageFields on Image {\n    url\n    altText\n    width\n    height\n  }\n\n  #graphql\n  fragment MoneyFields on MoneyV2 {\n    amount\n    currencyCode\n  }\n\n  fragment CartFields on Cart {\n    id\n    checkoutUrl\n    totalQuantity\n    note\n    lines(first: 50) {\n      edges {\n        node {\n          id\n          quantity\n          cost {\n            totalAmount {\n              ...MoneyFields\n            }\n          }\n          discountAllocations {\n            __typename\n            discountedAmount {\n              ...MoneyFields\n            }\n            ... on CartCodeDiscountAllocation {\n              code\n            }\n            ... on CartAutomaticDiscountAllocation {\n              title\n            }\n            ... on CartCustomDiscountAllocation {\n              title\n            }\n          }\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              selectedOptions {\n                name\n                value\n              }\n              image {\n                ...ImageFields\n              }\n              price {\n                ...MoneyFields\n              }\n              product {\n                id\n                title\n                handle\n                featuredImage {\n                  ...ImageFields\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    cost {\n      totalAmount {\n        ...MoneyFields\n      }\n      subtotalAmount {\n        ...MoneyFields\n      }\n      totalTaxAmount {\n        ...MoneyFields\n      }\n    }\n    discountCodes {\n      code\n      applicable\n    }\n    discountAllocations {\n      __typename\n      discountedAmount {\n        ...MoneyFields\n      }\n      ... on CartCodeDiscountAllocation {\n        code\n      }\n      ... on CartAutomaticDiscountAllocation {\n        title\n      }\n      ... on CartCustomDiscountAllocation {\n        title\n      }\n    }\n    appliedGiftCards {\n      id\n      lastCharacters\n      amountUsed {\n        ...MoneyFields\n      }\n      balance {\n        ...MoneyFields\n      }\n    }\n    deliveryGroups(first: 5) {\n      nodes {\n        selectedDeliveryOption {\n          title\n          estimatedCost {\n            ...MoneyFields\n          }\n        }\n      }\n    }\n  }\n\n  mutation cartDeliveryAddressesUpdate($cartId: ID!, $addresses: [CartSelectableAddressUpdateInput!]!) {\n    cartDeliveryAddressesUpdate(cartId: $cartId, addresses: $addresses) {\n      cart {\n        ...CartFields\n      }\n      userErrors {\n        field\n        message\n      }\n      warnings {\n        code\n        message\n        target\n      }\n    }\n  }\n": {return: CartDeliveryAddressesUpdateMutation, variables: CartDeliveryAddressesUpdateMutationVariables},
}
declare module '@shopify/storefront-api-client' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
