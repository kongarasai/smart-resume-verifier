-- Migration: Add fraud caching columns to confidence_scores
-- This resolves the 1.6s delay in GET /api/score by caching AI results

ALTER TABLE confidence_scores ADD COLUMN IF NOT EXISTS fraud_probability DECIMAL(5,4) DEFAULT 0.5;
ALTER TABLE confidence_scores ADD COLUMN IF NOT EXISTS fraud_reasons JSONB DEFAULT '[]';
