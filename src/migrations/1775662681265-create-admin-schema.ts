import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminSchema1775662681265 implements MigrationInterface {
  name = 'CreateAdminSchema1775662681265';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "admin"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SCHEMA IF EXISTS "admin"`);
  }
}
