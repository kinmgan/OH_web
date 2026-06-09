import { UserAddress } from '@/types/address.type';
import { http } from '@/utils/http';

const ENDPOINT = '/user/addresses';

export const addressService = {
  async getUserAddresses(): Promise<UserAddress[]> {
    return http<UserAddress[]>(ENDPOINT);
  },

  async addAddress(address: UserAddress): Promise<UserAddress> {
    return http<UserAddress>(ENDPOINT, {
      method: 'POST',
      body: address
    });
  },

  async updateAddress(id: number, address: UserAddress): Promise<UserAddress> {
    return http<UserAddress>(`${ENDPOINT}/${id}`, {
      method: 'PUT',
      body: address
    });
  },

  async deleteAddress(id: number): Promise<void> {
    return http<void>(`${ENDPOINT}/${id}`, {
      method: 'DELETE'
    });
  },

  async setDefault(id: number): Promise<void> {
    return http<void>(`${ENDPOINT}/${id}/default`, {
      method: 'PUT'
    });
  }
};
