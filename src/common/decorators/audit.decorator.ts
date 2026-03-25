import { SetMetadata } from '@nestjs/common';

export interface AuditOptions {
  action: string;
  resource: string;
}

export const AUDIT_KEY = 'audit_logging';
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
