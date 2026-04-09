import { MigrationInterface, QueryRunner } from 'typeorm';

export class INITDB1775662681266 implements MigrationInterface {
  name = 'INITDB1775662681266';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "admin"."tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "suspension_interval_days" integer, "suspension_until" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_32731f181236a46182a38c992a8" UNIQUE ("name"), CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('system_admin', 'tenant_admin', 'tenant_user')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'tenant_user', "permissions" jsonb, "last_access" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "thresholds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "sensor_type" text, "sensor_id" uuid, "min_value" double precision NOT NULL, "max_value" double precision NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_99586c2ba61a0e7056915851d8c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_THRESHOLD_TENANT_SENSOR_ID_NOT_NULL" ON "thresholds" ("tenant_id", "sensor_id") WHERE sensor_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_THRESHOLD_TENANT_SENSOR_ID_NULL" ON "thresholds" ("tenant_id", "sensor_type") WHERE sensor_id IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."gateways_metadata_status_enum" AS ENUM('gateway_online', 'gateway_offline', 'gateway_suspended', 'gateway_provisioning')`,
    );
    await queryRunner.query(
      `CREATE TABLE "gateways_metadata" ("gateway_id" uuid NOT NULL, "name" character varying, "status" "public"."gateways_metadata_status_enum" NOT NULL DEFAULT 'gateway_offline', "last_seen_at" TIMESTAMP, "send_frequency_ms" bigint NOT NULL DEFAULT '30000', CONSTRAINT "UQ_248355bb9e92f0c78d4680bacda" UNIQUE ("name"), CONSTRAINT "PK_729d7d97397c3627c5dfb615156" PRIMARY KEY ("gateway_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "gateways" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "factory_id" character varying NOT NULL, "factory_key_hash" text, "provisioned" boolean NOT NULL DEFAULT false, "model" character varying NOT NULL, "firmware_version" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d67ac9bac23aa38cacb630bd360" UNIQUE ("factory_id"), CONSTRAINT "PK_b53153080a6907017cf44cb7f58" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "keys" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gateway_id" uuid NOT NULL, "key_material" bytea NOT NULL, "key_version" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e63d5d51e0192635ab79aa49644" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "commands" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gateway_id" uuid NOT NULL, "tenant_id" uuid NOT NULL, "type" text NOT NULL, "status" text NOT NULL, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ack_received_at" TIMESTAMP WITH TIME ZONE, "requested_send_frequency_ms" integer, "requested_status" text, "requested_firmware_version" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7ac292c3aa19300482b2b190d1e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "audits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "action" character varying NOT NULL, "resource" character varying NOT NULL, "details" jsonb NOT NULL, "timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_b2d7a2089999197dc7024820f28" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "api_clients" ("id" character varying NOT NULL, "tenant_id" uuid NOT NULL, "name" character varying NOT NULL, "keycloak_client_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef2d5ef0eb5e9a6ddc67cfa310e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_b68752c2380e3cdd781f50f6d0" ON "api_clients" ("name") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_8f3d2e03e340216ca480b3d079" ON "api_clients" ("keycloak_client_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alerts_type_enum" AS ENUM('gateway_offline')`,
    );
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "type" "public"."alerts_type_enum" NOT NULL DEFAULT 'gateway_offline', "gateway_id" uuid NOT NULL, "details" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "alert_configs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" uuid NOT NULL, "gateway_id" uuid, "gateway_unreachable_timeout_ms" integer NOT NULL DEFAULT '60000', "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e73bb321ceeb6621d6198bc112f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_alert_config_tenant_gateway" ON "alert_configs" ("tenant_id", "gateway_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_109638590074998bb72a2f2cf08" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "thresholds" ADD CONSTRAINT "FK_e9419175694d87eb26ee98705f4" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateways_metadata" ADD CONSTRAINT "FK_729d7d97397c3627c5dfb615156" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateways" ADD CONSTRAINT "FK_e2df3d14dbab058aae3ebc7fd2a" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "keys" ADD CONSTRAINT "FK_2332c3d817df5c390c8a8d4720c" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" ADD CONSTRAINT "FK_eaf8820af3e97acbea44a97fd26" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" ADD CONSTRAINT "FK_7275a501bf6941b50c30cf6d95a" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audits" ADD CONSTRAINT "FK_e2977d47bd94e9a8e819fa0ee93" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_clients" ADD CONSTRAINT "FK_2a3cf1f14bea25003fe55ac0aa9" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_configs" ADD CONSTRAINT "FK_893fe53519fe5cb8824106af6cc" FOREIGN KEY ("tenant_id") REFERENCES "admin"."tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_configs" ADD CONSTRAINT "FK_3ca7a706efd287aa0a2ef036c4b" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "alert_configs" DROP CONSTRAINT "FK_3ca7a706efd287aa0a2ef036c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "alert_configs" DROP CONSTRAINT "FK_893fe53519fe5cb8824106af6cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_clients" DROP CONSTRAINT "FK_2a3cf1f14bea25003fe55ac0aa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audits" DROP CONSTRAINT "FK_e2977d47bd94e9a8e819fa0ee93"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" DROP CONSTRAINT "FK_7275a501bf6941b50c30cf6d95a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "commands" DROP CONSTRAINT "FK_eaf8820af3e97acbea44a97fd26"`,
    );
    await queryRunner.query(
      `ALTER TABLE "keys" DROP CONSTRAINT "FK_2332c3d817df5c390c8a8d4720c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateways" DROP CONSTRAINT "FK_e2df3d14dbab058aae3ebc7fd2a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "gateways_metadata" DROP CONSTRAINT "FK_729d7d97397c3627c5dfb615156"`,
    );
    await queryRunner.query(
      `ALTER TABLE "thresholds" DROP CONSTRAINT "FK_e9419175694d87eb26ee98705f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_109638590074998bb72a2f2cf08"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_alert_config_tenant_gateway"`,
    );
    await queryRunner.query(`DROP TABLE "alert_configs"`);
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "public"."alerts_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8f3d2e03e340216ca480b3d079"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b68752c2380e3cdd781f50f6d0"`,
    );
    await queryRunner.query(`DROP TABLE "api_clients"`);
    await queryRunner.query(`DROP TABLE "audits"`);
    await queryRunner.query(`DROP TABLE "commands"`);
    await queryRunner.query(`DROP TABLE "keys"`);
    await queryRunner.query(`DROP TABLE "gateways"`);
    await queryRunner.query(`DROP TABLE "gateways_metadata"`);
    await queryRunner.query(
      `DROP TYPE "public"."gateways_metadata_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_THRESHOLD_TENANT_SENSOR_ID_NULL"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_THRESHOLD_TENANT_SENSOR_ID_NOT_NULL"`,
    );
    await queryRunner.query(`DROP TABLE "thresholds"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "admin"."tenants"`);
  }
}
