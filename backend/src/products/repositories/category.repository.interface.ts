export const CATEGORY_REPOSITORY = 'CATEGORY_REPOSITORY';

export interface ICategoryRepository {
  findAll(tenantId: string): Promise<any[]>;
  findById(id: string, tenantId: string): Promise<any>;
  create(tenantId: string, data: any): Promise<any>;
  update(id: string, tenantId: string, data: any): Promise<any>;
  delete(id: string, tenantId: string): Promise<any>;
}
