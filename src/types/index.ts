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

export type QueryNetwork = { sort: string; offset: string; level?: string; upline_id?: string; user_id?: string };
