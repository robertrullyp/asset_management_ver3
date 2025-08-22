-- CreateTable
CREATE TABLE "public"."materials" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_log_materials" (
    "service_log_id" INTEGER NOT NULL,
    "material_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "service_log_materials_pkey" PRIMARY KEY ("service_log_id", "material_id")
);

-- CreateTable
CREATE TABLE "public"."service_log_photos" (
    "id" SERIAL NOT NULL,
    "service_log_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    CONSTRAINT "service_log_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."service_log_materials" ADD CONSTRAINT "service_log_materials_service_log_id_fkey" FOREIGN KEY ("service_log_id") REFERENCES "public"."service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."service_log_materials" ADD CONSTRAINT "service_log_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."service_log_photos" ADD CONSTRAINT "service_log_photos_service_log_id_fkey" FOREIGN KEY ("service_log_id") REFERENCES "public"."service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
