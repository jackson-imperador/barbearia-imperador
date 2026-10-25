import { PaginationDto } from '../../common/dto/pagination.dto';

export interface IUserRepository {
  findByEmail(email: string): Promise<any>;
  findById(id: string): Promise<any>;
  findByIdAndTenant(id: string, tenantId: string): Promise<any>;
  findActiveById(id: string): Promise<any>;
  findAll(tenantId: string, paginationDto: PaginationDto, searchFields: string[]): Promise<any>;
  create(tenantId: string, data: any): Promise<any>;
  update(id: string, tenantId: string, data: any): Promise<any>;
  remove(id: string, tenantId: string): Promise<any>;
  registerNewTenantAndUser(
    tenantName: string | undefined,
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    passwordHash: string,
  ): Promise<any>;
  /** 
   * Register a new customer in the EXISTING (first/main) tenant.
   * Used by auth.register() to avoid creating orphan tenants per customer.
   */
  registerCustomerInExistingTenant(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    passwordHash: string,
  ): Promise<any>;
  getDashboardData(userId: string): Promise<any>;
}
