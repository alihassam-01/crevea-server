-- Align legacy role names with the current application role model.
UPDATE "users" SET "role" = 'VENDOR' WHERE "role" = 'SELLER';
UPDATE "users" SET "role" = 'EXECUTIVE' WHERE "role" = 'ADMIN';
