-- CreateTable
CREATE TABLE "public"."consumable_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumable_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unit_consumables" (
    "id" SERIAL NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "consumable_id" INTEGER NOT NULL,
    "service_log_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unit_consumables_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."unit_consumables" ADD CONSTRAINT "unit_consumables_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_consumables" ADD CONSTRAINT "unit_consumables_consumable_id_fkey" FOREIGN KEY ("consumable_id") REFERENCES "public"."consumable_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_consumables" ADD CONSTRAINT "unit_consumables_service_log_id_fkey" FOREIGN KEY ("service_log_id") REFERENCES "public"."ServiceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

