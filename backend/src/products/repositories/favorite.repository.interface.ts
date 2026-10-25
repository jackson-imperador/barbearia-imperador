export const FAVORITE_REPOSITORY = 'FAVORITE_REPOSITORY';

export interface IFavoriteRepository {
  findByUserAndProduct(userId: string, productId: string): Promise<any>;
  create(userId: string, productId: string): Promise<any>;
  delete(id: string): Promise<any>;
  findAllByUser(userId: string): Promise<any[]>;
}
