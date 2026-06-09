export interface ShippingEstimate {
  carrier: 'GHN' | 'GHTK' | 'VNPOST';
  carrierName: string;
  fee: number;
  estimatedDays: number;
  serviceLabel: string;
}

export interface ShippingFeeRequest {
  addressId: number;
  items: {
    productVariantId: number;
    quantity: number;
  }[];
}
