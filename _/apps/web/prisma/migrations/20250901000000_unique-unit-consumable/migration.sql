-- CreateIndex
CREATE UNIQUE INDEX "unit_consumables_unit_id_consumable_id_service_log_id_key" ON "unit_consumables"("unit_id", "consumable_id", "service_log_id");
