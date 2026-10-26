-- =============================================================================
-- Life Makers El Minya — initial PostgreSQL schema
-- Safe to run inside a transaction. Intended for Neon (PostgreSQL 15+).
-- Does not drop existing production objects.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------------------------------------------------------
-- Shared helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at() IS
  'Maintains updated_at on row changes. created_at is left unchanged.';

-- First-of-month DATE values store year+month without free-form text.
CREATE OR REPLACE FUNCTION is_first_of_month(p_date date)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_date IS NOT NULL AND p_date = date_trunc('month', p_date)::date;
$$;

-- -----------------------------------------------------------------------------
-- 3. Charitable programs
-- -----------------------------------------------------------------------------

CREATE TABLE programs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL,
  name_en       text NOT NULL,
  name_ar       text NOT NULL,
  description   text,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT programs_code_key UNIQUE (code),
  CONSTRAINT programs_name_en_key UNIQUE (name_en),
  CONSTRAINT programs_name_ar_key UNIQUE (name_ar),
  CONSTRAINT programs_code_format_chk CHECK (code ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT programs_name_en_not_blank_chk CHECK (btrim(name_en) <> ''),
  CONSTRAINT programs_name_ar_not_blank_chk CHECK (btrim(name_ar) <> '')
);

COMMENT ON TABLE programs IS
  'Organization charitable programs. Seeded with seven canonical programs; code is the stable identifier.';
COMMENT ON COLUMN programs.code IS
  'Stable machine identifier (snake_case). Used by seeds to remain idempotent.';
COMMENT ON COLUMN programs.is_active IS
  'Soft deactivation. Inactive programs should remain referenced by historical records.';

CREATE TRIGGER programs_set_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Users (admins and volunteers)
-- -----------------------------------------------------------------------------

CREATE TABLE users (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name            text NOT NULL,
  username             text NOT NULL,
  password_hash        text NOT NULL,
  phone                text NOT NULL,
  role                 text NOT NULL,
  assigned_program_id  uuid,
  is_active            boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_key UNIQUE (username),
  CONSTRAINT users_full_name_not_blank_chk CHECK (btrim(full_name) <> ''),
  CONSTRAINT users_username_format_chk CHECK (username = lower(username) AND username ~ '^[a-z0-9._-]{3,50}$'),
  CONSTRAINT users_password_hash_not_blank_chk CHECK (btrim(password_hash) <> ''),
  CONSTRAINT users_role_chk CHECK (role IN ('admin', 'volunteer')),
  CONSTRAINT users_role_assignment_chk CHECK (
    (role = 'admin' AND assigned_program_id IS NULL)
    OR
    (role = 'volunteer' AND assigned_program_id IS NOT NULL)
  ),
  CONSTRAINT users_assigned_program_id_fkey
    FOREIGN KEY (assigned_program_id)
    REFERENCES programs (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COMMENT ON TABLE users IS
  'Management-system accounts only (admins and volunteers). Not beneficiary identities.';
COMMENT ON COLUMN users.password_hash IS
  'Password hash only (e.g. argon2id/bcrypt). Never store plaintext. Never write this column into audit_logs.';
COMMENT ON COLUMN users.role IS
  'admin: full application permissions. volunteer: must be assigned to exactly one program.';
COMMENT ON COLUMN users.assigned_program_id IS
  'Required for volunteers; must be NULL for admins. Enforced by users_role_assignment_chk.';
COMMENT ON COLUMN users.is_active IS
  'Soft deactivation. Prefer setting false over deleting accounts that appear in historical records.';

CREATE INDEX users_assigned_program_id_idx ON users (assigned_program_id);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Families
-- -----------------------------------------------------------------------------
CREATE TABLE families (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  head_name               text NOT NULL,
  national_id             text NOT NULL,
  phone                   text NOT NULL,
  gender                  text NOT NULL,
  marital_status          text NOT NULL,
  address                 text NOT NULL,
  family_description      text NOT NULL,
  eligibility_level       text NOT NULL,
  prescription_image_url  text,
  is_archived             boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT families_national_id_key UNIQUE (national_id),
  CONSTRAINT families_head_name_not_blank_chk CHECK (btrim(head_name) <> ''),
  CONSTRAINT families_national_id_format_chk CHECK (national_id ~ '^[0-9]{14}$'),
  CONSTRAINT families_gender_chk CHECK (gender IN ('male', 'female')),
  CONSTRAINT families_marital_status_chk CHECK (
    marital_status IN ('single', 'married', 'divorced', 'widowed', 'abandoned')
  ),
  CONSTRAINT families_eligibility_level_chk CHECK (
    eligibility_level IN ('high', 'medium', 'low')
  ),
  CONSTRAINT families_address_not_blank_chk CHECK (btrim(address) <> ''),
  CONSTRAINT families_family_description_not_blank_chk CHECK (btrim(family_description) <> '')
);

COMMENT ON TABLE families IS
  'Beneficiary families. Family size is derived from family_members, not stored here.';
COMMENT ON COLUMN families.national_id IS
  'Egyptian national ID of the family head (14 digits). Uniqueness is enforced.';
COMMENT ON COLUMN families.family_description IS
  'Free-text social/economic circumstances. Use TEXT; do not truncate in the schema.';
COMMENT ON COLUMN families.prescription_image_url IS
  'Private storage key or URL only. Do not store image bytes. Do not treat this as a public URL.';
COMMENT ON COLUMN families.eligibility_level IS
  'Administrative priority: high, medium, or low.';
COMMENT ON COLUMN families.is_archived IS
  'Soft-delete flag. Archived families are hidden from active lists but retained for audit.';

CREATE INDEX families_phone_idx ON families (phone);
CREATE INDEX families_eligibility_level_idx ON families (eligibility_level);
CREATE INDEX families_active_idx ON families (id) WHERE is_archived = false;

CREATE TRIGGER families_set_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Family members
-- -----------------------------------------------------------------------------

CREATE TABLE family_members (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id            uuid NOT NULL,
  full_name            text NOT NULL,
  national_id          text,
  gender               text NOT NULL,
  marital_status       text NOT NULL,
  date_of_birth        date NOT NULL,
  has_disease          boolean NOT NULL DEFAULT false,
  disease_description  text,
  treatment_cost       numeric(14, 2) NOT NULL DEFAULT 0,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_members_family_id_fkey
    FOREIGN KEY (family_id)
    REFERENCES families (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT family_members_national_id_key UNIQUE (national_id),
  CONSTRAINT family_members_full_name_not_blank_chk CHECK (btrim(full_name) <> ''),
  CONSTRAINT family_members_national_id_format_chk CHECK (
    national_id IS NULL OR national_id ~ '^[0-9]{14}$'
  ),
  CONSTRAINT family_members_gender_chk CHECK (gender IN ('male', 'female')),
  CONSTRAINT family_members_marital_status_chk CHECK (
    marital_status IN ('single', 'married', 'divorced', 'widowed', 'abandoned')
  ),
  CONSTRAINT family_members_date_of_birth_chk CHECK (date_of_birth <= CURRENT_DATE),
  CONSTRAINT family_members_treatment_cost_chk CHECK (treatment_cost >= 0),
  CONSTRAINT family_members_disease_description_chk CHECK (
    has_disease = true OR disease_description IS NULL
  )
);

COMMENT ON TABLE family_members IS
  'Individuals belonging to exactly one family. Age is not stored; derive it from date_of_birth.';
COMMENT ON COLUMN family_members.national_id IS
  'Optional 14-digit Egyptian national ID. Unique when present (PostgreSQL UNIQUE allows multiple NULLs).';
COMMENT ON COLUMN family_members.date_of_birth IS
  'Verified date of birth. Backend should extract and cross-check against national_id when the ID is present.';
COMMENT ON COLUMN family_members.treatment_cost IS
  'Nonnegative EGP amount. Defaults to 0.';
COMMENT ON COLUMN family_members.disease_description IS
  'Must be NULL when has_disease is false.';

CREATE INDEX family_members_family_id_idx ON family_members (family_id);

CREATE TRIGGER family_members_set_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. Family–program memberships (many-to-many)
-- -----------------------------------------------------------------------------

CREATE TABLE family_programs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    uuid NOT NULL,
  program_id   uuid NOT NULL,
  status       text NOT NULL,
  joined_at    date NOT NULL DEFAULT CURRENT_DATE,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT family_programs_family_id_fkey
    FOREIGN KEY (family_id)
    REFERENCES families (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT family_programs_program_id_fkey
    FOREIGN KEY (program_id)
    REFERENCES programs (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT family_programs_family_program_key UNIQUE (family_id, program_id),
  CONSTRAINT family_programs_status_chk CHECK (status IN ('active', 'waiting'))
);

COMMENT ON TABLE family_programs IS
  'Membership of a family in a charitable program. Independent of campaign beneficiary lists.';
COMMENT ON COLUMN family_programs.status IS
  'active = معانا; waiting = انتظار. One membership row per (family, program).';

CREATE INDEX family_programs_program_id_idx ON family_programs (program_id);
CREATE INDEX family_programs_status_idx ON family_programs (status);

CREATE TRIGGER family_programs_set_updated_at
  BEFORE UPDATE ON family_programs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. Assistance records
-- -----------------------------------------------------------------------------

CREATE TABLE assistance_records (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_program_id     uuid NOT NULL,
  assistance_month      date NOT NULL,
  assistance_date       date,
  notes                 text,
  recorded_by_user_id   uuid,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistance_records_family_program_id_fkey
    FOREIGN KEY (family_program_id)
    REFERENCES family_programs (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT assistance_records_recorded_by_user_id_fkey
    FOREIGN KEY (recorded_by_user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT assistance_records_family_program_month_key UNIQUE (family_program_id, assistance_month),
  CONSTRAINT assistance_records_assistance_month_chk CHECK (is_first_of_month(assistance_month)),
  CONSTRAINT assistance_records_assistance_date_chk CHECK (
    assistance_date IS NULL
    OR (
      assistance_date >= assistance_month
      AND assistance_date < (assistance_month + INTERVAL '1 month')::date
    )
  )
);

COMMENT ON TABLE assistance_records IS
  'Assistance delivered against a family-program membership. Supports monthly and irregular programs; at most one row per membership per month.';
COMMENT ON COLUMN assistance_records.assistance_month IS
  'First day of the assistance month (YYYY-MM-01). Do not store month names as text.';
COMMENT ON COLUMN assistance_records.assistance_date IS
  'Optional actual delivery date within assistance_month.';
COMMENT ON COLUMN assistance_records.recorded_by_user_id IS
  'SET NULL if the recorder account is removed so history is retained.';

CREATE INDEX assistance_records_assistance_month_idx ON assistance_records (assistance_month);
CREATE INDEX assistance_records_recorded_by_user_id_idx ON assistance_records (recorded_by_user_id);

CREATE TRIGGER assistance_records_set_updated_at
  BEFORE UPDATE ON assistance_records
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. Campaigns
-- -----------------------------------------------------------------------------

CREATE TABLE campaigns (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  description           text NOT NULL,
  image_url             text NOT NULL,
  program_id            uuid NOT NULL,
  start_date            date NOT NULL,
  end_date              date NOT NULL,
  target_amount         numeric(14, 2) NOT NULL,
  donation_reference    text,
  created_by_user_id    uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaigns_program_id_fkey
    FOREIGN KEY (program_id)
    REFERENCES programs (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT campaigns_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT campaigns_id_program_id_key UNIQUE (id, program_id),
  CONSTRAINT campaigns_title_not_blank_chk CHECK (btrim(title) <> ''),
  CONSTRAINT campaigns_dates_chk CHECK (end_date >= start_date),
  CONSTRAINT campaigns_target_amount_chk CHECK (target_amount >= 0)
);

COMMENT ON TABLE campaigns IS
  'Fundraising campaigns. Each campaign belongs to exactly one program. Status and totals are derived, not stored.';
COMMENT ON COLUMN campaigns.image_url IS
  'Storage key or URL for the campaign image. Prefer private or CDN-controlled storage.';
COMMENT ON COLUMN campaigns.target_amount IS
  'Nonnegative EGP fundraising target. Collected totals come from donations, not this column.';
COMMENT ON COLUMN campaigns.donation_reference IS
  'Optional public/reference number shown to donors; not a running total.';
COMMENT ON CONSTRAINT campaigns_id_program_id_key ON campaigns IS
  'Enables composite FKs from campaign_families so beneficiaries must match the campaign program.';

CREATE INDEX campaigns_program_id_idx ON campaigns (program_id);
CREATE INDEX campaigns_start_date_idx ON campaigns (start_date);
CREATE INDEX campaigns_end_date_idx ON campaigns (end_date);
CREATE INDEX campaigns_created_by_user_id_idx ON campaigns (created_by_user_id);

CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. Campaign beneficiary families
-- -----------------------------------------------------------------------------

CREATE TABLE campaign_families (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL,
  family_id     uuid NOT NULL,
  program_id    uuid NOT NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT campaign_families_campaign_family_key UNIQUE (campaign_id, family_id),
  CONSTRAINT campaign_families_campaign_program_fkey
    FOREIGN KEY (campaign_id, program_id)
    REFERENCES campaigns (id, program_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT campaign_families_family_program_fkey
    FOREIGN KEY (family_id, program_id)
    REFERENCES family_programs (family_id, program_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COMMENT ON TABLE campaign_families IS
  'Explicit campaign beneficiary list. Families are not auto-enrolled from program membership.';
COMMENT ON COLUMN campaign_families.program_id IS
  'Copied from the campaign for composite FK integrity. Must equal campaigns.program_id and a family_programs row.';
COMMENT ON COLUMN campaign_families.family_id IS
  'Beneficiary family, not a donor.';

CREATE INDEX campaign_families_family_id_idx ON campaign_families (family_id);
CREATE INDEX campaign_families_program_id_idx ON campaign_families (program_id);

-- -----------------------------------------------------------------------------
-- 11. Donations (collected amounts)
-- -----------------------------------------------------------------------------

CREATE TABLE donations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id           uuid NOT NULL,
  amount                numeric(14, 2) NOT NULL,
  donation_date         date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by_user_id   uuid NOT NULL,
  reference_number      text,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT donations_campaign_id_fkey
    FOREIGN KEY (campaign_id)
    REFERENCES campaigns (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT donations_recorded_by_user_id_fkey
    FOREIGN KEY (recorded_by_user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT donations_amount_chk CHECK (amount > 0)
);

COMMENT ON TABLE donations IS
  'Individual collected amounts for a campaign. Campaign totals must be SUM(amount), never a separately stored total.';
COMMENT ON COLUMN donations.amount IS
  'EGP amount strictly greater than zero.';
COMMENT ON COLUMN donations.reference_number IS
  'Optional payment/receipt reference. Donor personal identity is not required in this version.';

CREATE INDEX donations_campaign_id_idx ON donations (campaign_id);
CREATE INDEX donations_donation_date_idx ON donations (donation_date);
CREATE INDEX donations_recorded_by_user_id_idx ON donations (recorded_by_user_id);

CREATE TRIGGER donations_set_updated_at
  BEFORE UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 12. Achievements
-- -----------------------------------------------------------------------------

CREATE TABLE achievements (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  description           text NOT NULL,
  image_url             text NOT NULL,
  achievement_month     date NOT NULL,
  uploaded_at           timestamptz NOT NULL DEFAULT now(),
  created_by_user_id    uuid NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT achievements_created_by_user_id_fkey
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT achievements_title_not_blank_chk CHECK (btrim(title) <> ''),
  CONSTRAINT achievements_achievement_month_chk CHECK (is_first_of_month(achievement_month))
);

COMMENT ON TABLE achievements IS
  'Public/internal achievement stories. achievement_month (when it happened) is independent of uploaded_at.';
COMMENT ON COLUMN achievements.achievement_month IS
  'First day of the month in which the achievement occurred (YYYY-MM-01).';
COMMENT ON COLUMN achievements.uploaded_at IS
  'When the record was uploaded, independent of achievement_month.';

CREATE INDEX achievements_achievement_month_idx ON achievements (achievement_month);
CREATE INDEX achievements_created_by_user_id_idx ON achievements (created_by_user_id);

CREATE TRIGGER achievements_set_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------------------
-- 13. Audit logs
-- -----------------------------------------------------------------------------

CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  old_values    jsonb,
  new_values    jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT audit_logs_action_not_blank_chk CHECK (btrim(action) <> ''),
  CONSTRAINT audit_logs_entity_type_not_blank_chk CHECK (btrim(entity_type) <> '')
);

COMMENT ON TABLE audit_logs IS
  'Administrative action history. Backend must never persist plaintext passwords, password hashes, or secrets in JSON snapshots.';
COMMENT ON COLUMN audit_logs.user_id IS
  'Actor. SET NULL if the user row is removed so the audit event remains.';
COMMENT ON COLUMN audit_logs.old_values IS
  'JSONB before-image. Strip password_hash and other secrets in application code before insert.';
COMMENT ON COLUMN audit_logs.new_values IS
  'JSONB after-image. Strip secrets in application code before insert.';

CREATE INDEX audit_logs_user_id_idx ON audit_logs (user_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs (created_at);

-- -----------------------------------------------------------------------------
-- 14. Views
-- -----------------------------------------------------------------------------

-- Family details + derived member count.
-- SENSITIVE: includes national_id, phone, address, family_description, prescription URL.
-- Restrict to authorized backend roles; do not expose publicly.
CREATE VIEW family_details_view AS
SELECT
  f.id,
  f.head_name,
  f.national_id,
  f.phone,
  f.gender,
  f.marital_status,
  f.address,
  f.family_description,
  f.eligibility_level,
  f.prescription_image_url,
  f.created_at,
  f.updated_at,
  COUNT(fm.id)::integer AS member_count
FROM families f
LEFT JOIN family_members fm ON fm.family_id = f.id
GROUP BY
  f.id,
  f.head_name,
  f.national_id,
  f.phone,
  f.gender,
  f.marital_status,
  f.address,
  f.family_description,
  f.eligibility_level,
  f.prescription_image_url,
  f.created_at,
  f.updated_at;

COMMENT ON VIEW family_details_view IS
  'Family rows with member_count derived from family_members. Contains national IDs and other sensitive fields — authorize in the API, not via a public GRANT.';

-- Dynamic age and orphan-sponsorship eligibility. Recomputed on read.
-- Omits national_id, disease, and treatment_cost.
CREATE VIEW family_member_eligibility_view AS
SELECT
  fm.id AS member_id,
  fm.family_id,
  fm.full_name,
  fm.gender,
  fm.marital_status,
  fm.date_of_birth,
  DATE_PART('year', AGE(CURRENT_DATE, fm.date_of_birth))::integer AS current_age,
  CASE
    WHEN fm.gender = 'male'
      AND DATE_PART('year', AGE(CURRENT_DATE, fm.date_of_birth)) < 18
      THEN true
    WHEN fm.gender = 'female'
      AND fm.marital_status <> 'married'
      THEN true
    ELSE false
  END AS is_orphan_sponsorship_eligible
FROM family_members fm;

COMMENT ON VIEW family_member_eligibility_view IS
  'Orphan sponsorship eligibility: males under 18; females whose marital_status is not married. Age uses AGE(CURRENT_DATE, date_of_birth). No medical or national-ID fields.';

CREATE VIEW campaign_summary_view AS
SELECT
  c.id,
  c.title,
  c.description,
  c.image_url,
  c.program_id,
  p.code AS program_code,
  p.name_en AS program_name_en,
  p.name_ar AS program_name_ar,
  c.start_date,
  c.end_date,
  CASE
    WHEN CURRENT_DATE <= c.end_date THEN 'ongoing'
    ELSE 'completed'
  END AS campaign_status,
  c.target_amount,
  COALESCE(d.total_collected_amount, 0)::numeric(14, 2) AS total_collected_amount,
  GREATEST(c.target_amount - COALESCE(d.total_collected_amount, 0), 0)::numeric(14, 2) AS remaining_amount,
  CASE
    WHEN c.target_amount = 0 THEN
      CASE
        WHEN COALESCE(d.total_collected_amount, 0) > 0 THEN 100::numeric
        ELSE 0::numeric
      END
    ELSE ROUND((COALESCE(d.total_collected_amount, 0) / c.target_amount) * 100, 2)
  END AS fundraising_progress_percent,
  (COALESCE(d.total_collected_amount, 0) > c.target_amount) AS has_exceeded_target,
  COALESCE(bf.beneficiary_family_count, 0)::integer AS beneficiary_family_count,
  c.donation_reference,
  c.created_by_user_id,
  c.created_at,
  c.updated_at
FROM campaigns c
INNER JOIN programs p ON p.id = c.program_id
LEFT JOIN (
  SELECT campaign_id, SUM(amount) AS total_collected_amount
  FROM donations
  GROUP BY campaign_id
) d ON d.campaign_id = c.id
LEFT JOIN (
  SELECT campaign_id, COUNT(DISTINCT family_id) AS beneficiary_family_count
  FROM campaign_families
  GROUP BY campaign_id
) bf ON bf.campaign_id = c.id;

COMMENT ON VIEW campaign_summary_view IS
  'Campaign fundraising snapshot. Status is ongoing when CURRENT_DATE <= end_date, else completed. Totals come only from donations. remaining_amount never goes below zero. Progress is 0/100 when target_amount is 0.';

COMMIT;


