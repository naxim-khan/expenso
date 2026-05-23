# Categories Module

The categories module owns user-scoped category CRUD and default category templates.

## Responsibilities

- Create, list, read, update, and delete authenticated user's categories.
- Normalize category names for duplicate detection.
- Enforce unique category names per user through `normalizedName`.
- Copy default categories during registration.
- Block deletion of categories that have transactions.
- Provide cursor pagination and type filtering.

## Design Details

Categories are owned by users. A category has `name`, `normalizedName`, `type`, `isSystem`, `version`, `userId`, timestamps, and related transactions.

The service formats names by trimming and collapsing whitespace, then lowercases the normalized value. The unique `(userId, normalizedName)` index enforces case-insensitive duplicate protection per user.

## Default Categories

Default categories live in `DEFAULT_CATEGORIES` and are copied into each new user's account during registration. They are not global shared rows. This allows users to edit their copied categories without changing another user's categories or historical transactions.

## Repository Role

`CategoriesRepository` owns selected fields, duplicate lookup, default category creation, list pagination query, user-scoped reads/updates/deletes, and transaction counts for delete protection.

## Delete Behavior

The service blocks hard delete when the category has transactions. This protects financial history from orphaned or semantically broken records. Future audit requirements may introduce soft deletes.
