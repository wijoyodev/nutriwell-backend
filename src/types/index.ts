import { Request as ExpressRequest } from 'express';

export interface User {
  code: string;
  full_name: string;
  phone_number: string;
  phone_number_country: string;
  date_of_birth: string;
  password: string;
  confirm_password?: string;
  referral_code: string;
  gender: string;
  email: string;
  avatar_url: string;
  status: string;
  role?: string;
  referrer_code?: string;
}

export interface UserAdmin {
  full_name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  code?: string;
}

export type UserQueries = {
  id?: string;
  role?: string;
  email?: string;
};

export type Client = {
  id: string | null;
  host: string | string[] | undefined;
  agent: string | undefined;
};

export type UserCredential = {
  user_id: string | null;
  role: string | null;
  editor: boolean | null;
};

export interface ICustomError extends Error {
  message: string;
  code: number;
}

export type ProtectedRequest = {
  client: Client;
  user: UserCredential;
} & ExpressRequest;

export interface CustomError extends Error {
  errorCode: number;
}

export type tokenPayload = {
  id: string;
  email: string;
  full_name: string;
  role?: string;
};

export type BannerPayload = { title: string; description: string; image_url: string; code: string };

export type ProductPayload = {
  product_name: string;
  description: string;
  product_images: string;
  price: number;
  product_weight?: number;
};

export type ShipmentPayload = {
  user_id: string;
  recipient_name: string;
  recipient_phone_number: string;
  phone_number_country: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  address_detail: string;
  postal_code?: string;
};

export type OrderPayload = {
  user_id: number;
  code: string;
  cart_id: number;
  address_shipment_id: number;
  order_number: string;
  status: number;
  courier_name: string;
  courier_company?: string;
  courier_type?: string;
  courier_service_name: string;
  courier_rate: number;
  total_purchase: number;
  external_id?: string;
  payment_date?: string;
  receive_date?: string;
  delivery_date?: string;
  payment_method?: string;
  shipment_number?: string;
  reasons?: string;
};

export type CartPayload = {
  user_id: string;
  product_id: string;
  quantity: number;
  total_weight?: number;
  total_price?: number;
};

export type QueryBase = {
  id?: string;
  search?: string;
};

export type QueryShipment = QueryBase & { user_id?: string };

export type QueryOrders = QueryBase & { status?: number };

export type QueryProduct = QueryBase;

export type QueryCart = QueryBase & {
  user_id: string;
};

export type QueryNetwork = { sort: string; offset: string; level?: string; upline_id?: string; user_id?: string };

export type QueryBanner = QueryBase & {
  code?: string;
};

export type RateResponse = {
  success: boolean;
  pricing: {
    [key: string]: number | boolean | string | string[];
  }[];
  error?: string;
};

export type FetcherVariables = { [key: string]: string | undefined };

export type FetcherOptions = {
  queryString: string;
  variables?: FetcherVariables;
};

export type FetcherResults<T> = {
  result: T;
};

export enum Order {
  'Belum Bayar' = 0,
  'Dikemas' = 1,
  'Dikirim' = 2,
  'Selesai' = 3,
  'Dibatalkan' = 4,
}
