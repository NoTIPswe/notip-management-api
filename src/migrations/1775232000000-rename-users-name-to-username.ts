import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameUsersNameToUsername1775232000000 implements MigrationInterface {
  name = 'RenameUsersNameToUsername1775232000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" RENAME COLUMN "name" TO "username"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" RENAME COLUMN "username" TO "name"',
    );
  }
}
