-- =============================================================================
-- Canonical charitable programs
-- Idempotent: unique on programs.code. Re-running does not duplicate rows
-- and does not overwrite is_active or description changes made later.
-- =============================================================================

BEGIN;

INSERT INTO programs (id, code, name_en, name_ar, description, is_active)
VALUES
  (
    '00000000-0000-4000-8000-000000000001',
    'bride_equipment',
    'Bride Equipment',
    'جهاز عروسة',
    'Support for essential household items for brides.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'orphan_sponsorship',
    'Orphan Sponsorship',
    'كفالة يتيم',
    'Ongoing sponsorship for eligible orphaned family members.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'medical_sponsorship',
    'Medical Sponsorship',
    'كفالة صحية',
    'Medical support and treatment assistance.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'sacrificial_meat',
    'Sacrificial Meat',
    'لحوم الأضاحي',
    'Distribution of sacrificial meat to beneficiary families.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'food_assistance',
    'Food Assistance',
    'إطعام',
    'Food assistance for families in need.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'my_school',
    'My School',
    'مدرستي',
    'Educational support for school-age children.',
    true
  ),
  (
    '00000000-0000-4000-8000-000000000007',
    'warmth_and_safety',
    'Warmth and Safety',
    'دفء وأمان',
    'Seasonal warmth, clothing, and safety support.',
    true
  )
ON CONFLICT (code) DO NOTHING;

COMMIT;
