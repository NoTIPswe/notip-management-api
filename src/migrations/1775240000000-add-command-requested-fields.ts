import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommandRequestedFields1775240000000 implements MigrationInterface {
  name = 'AddCommandRequestedFields1775240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "commands" ADD COLUMN "requested_send_frequency_ms" integer',
    );
    await queryRunner.query(
      'ALTER TABLE "commands" ADD COLUMN "requested_status" text',
    );
    await queryRunner.query(
      'ALTER TABLE "commands" ADD COLUMN "requested_firmware_version" text',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "commands" DROP COLUMN "requested_firmware_version"',
    );
    await queryRunner.query(
      'ALTER TABLE "commands" DROP COLUMN "requested_status"',
    );
    await queryRunner.query(
      'ALTER TABLE "commands" DROP COLUMN "requested_send_frequency_ms"',
    );
  }
}
