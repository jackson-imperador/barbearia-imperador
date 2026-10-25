export class PaginationHelper {
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  static getMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  static getCursorMeta(limit: number, hasMore: boolean, nextCursor?: string) {
    return {
      limit,
      hasNextPage: hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
    };
  }
}
