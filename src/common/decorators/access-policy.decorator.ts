import { SetMetadata } from '@nestjs/common';

export enum AccessPolicy {
  PUBLIC = 'public',
  ADMIN = 'admin',
  TENANT = 'tenant',
}

export const ACCESS_POLICY_KEY = 'access_policy';

export const Public = () => SetMetadata(ACCESS_POLICY_KEY, AccessPolicy.PUBLIC);
export const AdminOnly = () =>
  SetMetadata(ACCESS_POLICY_KEY, AccessPolicy.ADMIN);
export const TenantScoped = () =>
  SetMetadata(ACCESS_POLICY_KEY, AccessPolicy.TENANT);
