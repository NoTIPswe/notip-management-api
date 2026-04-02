import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantSuspensionUntil1775181600000 implements MigrationInterface {
  name = 'AddTenantSuspensionUntil1775181600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "admin"."tenants" ADD COLUMN IF NOT EXISTS "suspension_until" TIMESTAMP WITH TIME ZONE',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "admin"."tenants" DROP COLUMN IF EXISTS "suspension_until"',
    );
  }
}
