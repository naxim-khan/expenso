import { CategoryType } from '../../../generated/prisma/client';

export const DEFAULT_CATEGORY_VERSION = 1;

export const DEFAULT_CATEGORIES = [
  {
    name: 'Salary',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Business',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Freelance',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Investments',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Bonus',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Loan Return',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Gifts',
    type: CategoryType.INCOME,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Food',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Rent',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Fuel',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Transport',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Utilities',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Internet',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Mobile',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Family',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Health',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Education',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Entertainment',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Shopping',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Travel',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Charity',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Zakat',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
  {
    name: 'Savings',
    type: CategoryType.EXPENSE,
    isSystem: true,
    version: DEFAULT_CATEGORY_VERSION,
  },
] as const;
