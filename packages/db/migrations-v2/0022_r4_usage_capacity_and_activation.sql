ALTER TABLE "billing_plan_catalog_versions" DROP CONSTRAINT "billing_plan_catalog_versions_r3_gate_check";--> statement-breakpoint
ALTER TABLE "billing_plan_prices" ALTER COLUMN "included_storage_bytes" SET DATA TYPE bigint;--> statement-breakpoint
-- Exact R4 usage hypotheses. Zero overage price means no automatic overage
-- charge is permitted; it never means an unlimited cost-bearing service.
UPDATE billing_plan_prices SET
  included_storage_bytes = CASE product_key
    WHEN 'explore' THEN 1073741824 WHEN 'first_shipment_pass' THEN 2147483648
    WHEN 'launch' THEN 5368709120 WHEN 'scale' THEN 26843545600 ELSE 107374182400 END,
  included_automation_units = CASE product_key
    WHEN 'explore' THEN 0 WHEN 'first_shipment_pass' THEN 50
    WHEN 'launch' THEN 250 WHEN 'scale' THEN 2000 ELSE 5000 END,
  included_work_packs = CASE WHEN product_key = 'managed_ops' THEN 2 ELSE 0 END,
  active_lane_overage_minor = CASE WHEN product_key IN ('scale', 'managed_ops') THEN 50000 ELSE 0 END,
  editor_overage_minor = CASE WHEN product_key IN ('scale', 'managed_ops') THEN 20000 ELSE 0 END,
  storage_gib_overage_minor = CASE WHEN product_key IN ('launch', 'scale', 'managed_ops') THEN 10000 ELSE 0 END,
  automation_hundred_overage_minor = CASE WHEN product_key IN ('launch', 'scale', 'managed_ops') THEN 5000 ELSE 0 END,
  work_pack_overage_minor = CASE WHEN product_key = 'managed_ops' THEN 500000 ELSE 0 END;
