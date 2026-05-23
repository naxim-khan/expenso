export type DashboardCategoryTotal = {
  categoryId: string;
  categoryName: string;
  total: number;
};

export type DashboardOverview = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  averageExpense: number;
  highestExpenseCategory: DashboardCategoryTotal | null;
  highestIncomeCategory: DashboardCategoryTotal | null;
};
