-- ============================================================================
-- DykeSense-ZW: PostgreSQL + PostGIS Enterprise DDL Schema
-- Production Schema for Affordable Chrome Exploration Platform
-- Targeting Great Dyke ASM Cooperatives and Junior Explorers in Zimbabwe
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if migrating
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;

-- 1. Organizations & ASM Cooperatives
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) NOT NULL CHECK (org_type IN ('asm_cooperative', 'junior_miner', 'equipment_hub', 'assay_lab', 'regulatory_body')),
    district VARCHAR(100) NOT NULL, -- e.g., Shurugwi, Zvishavane, Guruve, Mutorashanga
    provincial_office VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_email VARCHAR(255),
    registration_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Roles & Accounts (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'hub_admin', 
        'geologist', 
        'surveyor', 
        'asm_user', 
        'lab_tech', 
        'viewer_regulator'
    )),
    preferred_language VARCHAR(10) DEFAULT 'en' CHECK (preferred_language IN ('en', 'sn', 'nd')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 3. Mining Claims & Tenements with Access Control & PostGIS Polygons
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    claim_number VARCHAR(100) UNIQUE NOT NULL, -- Mining Commissioner registration tag
    claim_name VARCHAR(255) NOT NULL,
    sub_chamber VARCHAR(50) NOT NULL CHECK (sub_chamber IN (
        'Musengezi', 'Darwendale', 'Sebakwe', 'Selukwe_Shurugwi', 'Wedza'
    )),
    holder_name VARCHAR(255) NOT NULL,
    area_hectares NUMERIC(10, 2) NOT NULL,
    access_status VARCHAR(50) NOT NULL DEFAULT 'cleared' CHECK (access_status IN (
        'cleared', 'disputed', 'restricted_sensitive', 'pending_inspection'
    )),
    sensitive_location BOOLEAN DEFAULT FALSE, -- Mask coordinate accuracy for unprivileged roles
    boundary_geom GEOMETRY(Polygon, 4326) NOT NULL,
    centroid_geom GEOMETRY(Point, 4326),
    permit_issued_date DATE NOT NULL,
    permit_expiry_date DATE NOT NULL,
    commodity VARCHAR(50) DEFAULT 'Chromite',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_boundary_geom ON claims USING GIST (boundary_geom);
CREATE INDEX IF NOT EXISTS idx_claims_sub_chamber ON claims (sub_chamber);
CREATE INDEX IF NOT EXISTS idx_claims_access_status ON claims (access_status);

-- 4. Satellite Screening Areas (Sentinel-2 Alteration & Prospectivity)
CREATE TABLE IF NOT EXISTS screening_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    sub_chamber VARCHAR(50) NOT NULL,
    ferric_iron_index NUMERIC(5, 2) NOT NULL, -- Band 12 / Band 8 ratio proxy
    ferrous_iron_index NUMERIC(5, 2) NOT NULL,
    swir_alteration_index NUMERIC(5, 2) NOT NULL, -- Serpentinization marker
    prospectivity_score NUMERIC(5, 2) NOT NULL CHECK (prospectivity_score BETWEEN 0 AND 100),
    uncertainty_rating VARCHAR(20) NOT NULL CHECK (uncertainty_rating IN ('Low', 'Moderate', 'High')),
    factor_spectral NUMERIC(5, 2) NOT NULL,
    factor_structural NUMERIC(5, 2) NOT NULL,
    factor_historic NUMERIC(5, 2) NOT NULL,
    factor_terrain NUMERIC(5, 2) NOT NULL,
    satellite_tile_ref VARCHAR(100),
    screening_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Equipment Fleet Management (Shared Hub Model)
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Overhauser_Magnetometer', 'Proton_Precession', 'Differential_GPS', 'Base_Station'
    )),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN (
        'available', 'booked', 'maintenance', 'decommissioned'
    )),
    battery_health_percent INTEGER CHECK (battery_health_percent BETWEEN 0 AND 100),
    last_calibration_date DATE NOT NULL,
    daily_rate_usd NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shared Hub Bookings & Co-op Cost Splitting
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cooperative_id UUID REFERENCES organizations(id) ON DELETE RESTRICT,
    claim_id UUID REFERENCES claims(id) ON DELETE RESTRICT,
    contact_person VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    hectares NUMERIC(10, 2) NOT NULL,
    scheduled_date DATE NOT NULL,
    equipment_ids UUID[] NOT NULL,
    total_cost_usd NUMERIC(10, 2) NOT NULL,
    total_cost_zwg NUMERIC(12, 2) NOT NULL, -- Zimbabwe Gold equivalent
    coop_member_count INTEGER NOT NULL CHECK (coop_member_count > 0),
    cost_per_member_usd NUMERIC(10, 2) NOT NULL,
    booking_status VARCHAR(50) DEFAULT 'pending' CHECK (booking_status IN (
        'pending', 'confirmed', 'active', 'completed', 'cancelled'
    )),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Ground Magnetometer Surveys
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    survey_name VARCHAR(255) NOT NULL,
    operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    line_spacing_meters NUMERIC(6, 2) NOT NULL DEFAULT 25.0,
    station_spacing_meters NUMERIC(6, 2) NOT NULL DEFAULT 5.0,
    total_lines INTEGER NOT NULL,
    base_station_frequency_min INTEGER NOT NULL DEFAULT 60,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN (
        'planning', 'in_progress', 'completed', 'qa_approved'
    )),
    target_depth_expected_m NUMERIC(6, 2),
    start_date DATE NOT NULL,
    completed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. High-Frequency Magnetometer Readings (Offline sync target)
CREATE TABLE IF NOT EXISTS magnetometer_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    line_id VARCHAR(50) NOT NULL,
    station_number INTEGER NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    raw_total_field_nt NUMERIC(9, 2) NOT NULL, -- Total intensity in nanoTesla (nT)
    diurnal_base_nt NUMERIC(9, 2) NOT NULL,
    diurnal_corrected_nt NUMERIC(9, 2) NOT NULL,
    signal_quality INTEGER CHECK (signal_quality BETWEEN 0 AND 100),
    operator_name VARCHAR(100),
    recorded_at TIMESTAMPTZ NOT NULL,
    is_simulated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mag_readings_location ON magnetometer_readings USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_mag_readings_survey_line ON magnetometer_readings (survey_id, line_id);

-- 9. Corrected Grids & 2D/2.5D Inversion Models
CREATE TABLE IF NOT EXISTS inversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    anomaly_name VARCHAR(100) NOT NULL,
    calculated_depth_m NUMERIC(6, 2) NOT NULL, -- Depth to top of body
    depth_uncertainty_m NUMERIC(6, 2) NOT NULL, -- Confidence bound +/- m
    estimated_width_m NUMERIC(6, 2) NOT NULL,
    dip_degrees NUMERIC(5, 2) NOT NULL,
    strike_degrees NUMERIC(5, 2) NOT NULL,
    magnetic_susceptibility_si NUMERIC(8, 5) NOT NULL, -- SI units
    anomaly_amplitude_nt NUMERIC(8, 2) NOT NULL,
    rms_residual_nt NUMERIC(6, 2) NOT NULL,
    geologist_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_date TIMESTAMPTZ,
    geologist_notes TEXT,
    profile_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Sample Bags & QR-Coded Chain-of-Custody
CREATE TABLE IF NOT EXISTS samples (
    id VARCHAR(100) PRIMARY KEY, -- e.g. 'DYKE-SAMP-2026-084'
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
    inversion_id UUID REFERENCES inversions(id) ON DELETE SET NULL,
    sample_type VARCHAR(50) NOT NULL CHECK (sample_type IN (
        'Podiform_Chromite', 'Stratiform_Seam', 'Eluvial_Float', 'Host_Serpentinite'
    )),
    sample_weight_kg NUMERIC(6, 2) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL,
    sampler_name VARCHAR(255) NOT NULL,
    current_status VARCHAR(50) DEFAULT 'bag_registered' CHECK (current_status IN (
        'bag_registered', 'field_sampled', 'hub_received', 'in_transit_lab', 'lab_received', 'assay_complete'
    )),
    qr_code_signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_samples_location ON samples USING GIST (location_geom);

-- 11. Immutable Custody Events
CREATE TABLE IF NOT EXISTS custody_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id VARCHAR(100) REFERENCES samples(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    hash_signature VARCHAR(64) NOT NULL, -- SHA-256 hash of (prev_hash + event_data)
    notes TEXT,
    event_timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custody_sample_time ON custody_events (sample_id, event_timestamp);

-- 12. Laboratory Assays (Screening vs Certified)
CREATE TABLE IF NOT EXISTS lab_assays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sample_id VARCHAR(100) UNIQUE REFERENCES samples(id) ON DELETE CASCADE,
    lab_name VARCHAR(255) NOT NULL,
    assay_method VARCHAR(50) NOT NULL CHECK (assay_method IN (
        'Portable_XRF_Screening', 'Certified_ICP_OES_FireAssay'
    )),
    cr2o3_percent NUMERIC(5, 2) NOT NULL CHECK (cr2o3_percent BETWEEN 0 AND 100),
    feo_percent NUMERIC(5, 2) NOT NULL CHECK (feo_percent BETWEEN 0 AND 100),
    cr_fe_ratio NUMERIC(5, 2) NOT NULL,
    grade_classification VARCHAR(100) NOT NULL,
    is_certified BOOLEAN DEFAULT FALSE,
    certified_date DATE,
    certificate_number VARCHAR(100),
    registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Plain-Language Target Cards with Strict Statutory Disclosures
CREATE TABLE IF NOT EXISTS target_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'TC-DARW-04'
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    inversion_id UUID REFERENCES inversions(id) ON DELETE SET NULL,
    priority_level VARCHAR(50) NOT NULL CHECK (priority_level IN (
        'Priority 1 — Trenching Required',
        'Priority 2 — Step-out Survey',
        'Priority 3 — Low Priority'
    )),
    plain_english_summary TEXT NOT NULL,
    shona_summary TEXT NOT NULL,
    ndebele_summary TEXT NOT NULL,
    evidence_mag_anomaly_nt NUMERIC(8, 2) NOT NULL,
    evidence_depth_estimate VARCHAR(100) NOT NULL,
    evidence_satellite_correlation VARCHAR(255) NOT NULL,
    evidence_access_feasibility VARCHAR(255) NOT NULL,
    disclosed_uncertainty TEXT NOT NULL,
    statutory_caveat TEXT NOT NULL DEFAULT 'Exploration Target only — Not a SAMREC/JORC compliant resource. Physical verification by trenching or pitting is mandatory before extraction.',
    geologist_signed_off BOOLEAN DEFAULT FALSE,
    geologist_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Cryptographic Tamper-Evident Audit Ledger (SHA-256 Chained)
CREATE TABLE IF NOT EXISTS audit_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_ledger (timestamp);
