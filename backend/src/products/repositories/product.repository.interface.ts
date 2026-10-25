export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  findAll(tenantId: string, barberId?: string | null): Promise<any[]>;
  findById(id: string, tenantId: string): Promise<any>;
  create(tenantId: string, data: any, barberId?: string): Promise<any>;
  update(id: string, tenantId: string, data: any, barberId?: string | null): Promise<any>;
  delete(id: string, tenantId: string, barberId?: string | null): Promise<any>;
  verifyProductOwnership(id: string, tenantId: string, barberId?: string | null): Promise<any>;
}