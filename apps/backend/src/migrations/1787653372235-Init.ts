import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1787653372235 implements MigrationInterface {
  name = 'Init1787653372235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sports_articles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "title" text NOT NULL, "content" text NOT NULL, "imageUrl" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f9cbfe35ea2d2308b98f4c1b140" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5db8c04fe6ed58959f7e66bd0f" ON "sports_articles"  ("deletedAt", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_5db8c04fe6ed58959f7e66bd0f"`);
    await queryRunner.query(`DROP TABLE "sports_articles"`);
  }
}
