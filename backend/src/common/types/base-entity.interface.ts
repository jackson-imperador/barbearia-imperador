import { IAudit } from './audit.interface';

export interface IBaseEntity extends IAudit {
  id: string;
}

export interface ITenantEntity extends IBaseEntity {
  tenantId: string;
}
