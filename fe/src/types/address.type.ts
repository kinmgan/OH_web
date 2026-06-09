export interface UserAddress {
  id?: number;
  receiverName: string;
  phoneNumber: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailedAddress: string;
  isDefault?: boolean;
}
