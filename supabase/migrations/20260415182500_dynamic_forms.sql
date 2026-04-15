-- Migration: Add JSONB column for custom form schema to job_positions
ALTER TABLE job_positions ADD COLUMN form_schema JSONB;
