import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceGatewayDefaultSendFrequency1775235600000 implements MigrationInterface {
  name = 'EnforceGatewayDefaultSendFrequency1775235600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "gateways_metadata" ("gateway_id", "send_frequency_ms")
       SELECT g."id", 30000
       FROM "gateways" g
       LEFT JOIN "gateways_metadata" gm ON gm."gateway_id" = g."id"
       WHERE gm."gateway_id" IS NULL`,
    );

    await queryRunner.query(
      `UPDATE "gateways_metadata"
       SET "send_frequency_ms" = 30000
       WHERE "send_frequency_ms" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "gateways_metadata"
       ALTER COLUMN "send_frequency_ms" SET DEFAULT 30000`,
    );

    await queryRunner.query(
      `ALTER TABLE "gateways_metadata"
       ALTER COLUMN "send_frequency_ms" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "gateways_metadata"
       ALTER COLUMN "send_frequency_ms" DROP NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "gateways_metadata"
       ALTER COLUMN "send_frequency_ms" DROP DEFAULT`,
    );
  }
}
