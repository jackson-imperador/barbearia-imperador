export interface OpenFinanceProvider {
  getAccountBalance(accountId: string): Promise<number>;
  getStatement(accountId: string, startDate: Date, endDate: Date): Promise<any[]>;
  matchTransaction(systemTransactionId: string, bankStatementId: string): Promise<boolean>;
}
