import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeGatewayFirmwareVersionNullable1775217600000 implements MigrationInterface {
  name = 'MakeGatewayFirmwareVersionNullable1775217600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "gateways" ALTER COLUMN "firmware_version" DROP NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE "gateways" SET "firmware_version" = \'0.0.0\' WHERE "firmware_version" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "gateways" ALTER COLUMN "firmware_version" SET NOT NULL',
    );
  }
}
