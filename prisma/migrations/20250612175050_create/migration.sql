/*
  Warnings:

  - The primary key for the `_chat_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_group_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_chat_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_group_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "_chat_users" DROP CONSTRAINT "_chat_users_AB_pkey";

-- AlterTable
ALTER TABLE "_group_users" DROP CONSTRAINT "_group_users_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_chat_users_AB_unique" ON "_chat_users"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_group_users_AB_unique" ON "_group_users"("A", "B");
