-- Migration: Add display_order column to categories and campaigns tables
-- This supports reordering categories and campaigns in the admin panel

-- Add display_order to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add display_order to campaigns table
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Initialize display_order for existing records based on their current order
-- For categories: update based on id
UPDATE public.categories SET display_order = id WHERE display_order = 0 OR display_order IS NULL;

-- For campaigns: update based on id
UPDATE public.campaigns SET display_order = id WHERE display_order = 0 OR display_order IS NULL;
