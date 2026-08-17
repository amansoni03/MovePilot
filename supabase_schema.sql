-- ============================================================
-- SCHOOL TRANSPORT SAFETY CONSOLE — SUPABASE DATABASE SCHEMA
-- ============================================================
-- Copy-paste this ENTIRE file into the Supabase SQL Editor
-- and click "Run" to set up the complete database.
--
-- This creates:
--   • 9 tables (drivers, vehicles, routes, route_stops,
--     students, emergencies, notifications, activities, settings)
--   • Proper ENUM types for all status fields
--   • Foreign key relationships (applied after seeding)
--   • Indexes for common queries
--   • Row Level Security (RLS) policies
--   • ~600 rows of demo seed data
-- ============================================================


-- =====================
-- 0. CLEANUP (RESET)
-- =====================
DROP TABLE IF EXISTS gps_telemetry_logs CASCADE;
DROP TABLE IF EXISTS gps_devices CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS emergencies CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS route_stops CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;

DROP TYPE IF EXISTS gps_device_status CASCADE;
DROP TYPE IF EXISTS gps_device_protocol CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS emergency_status CASCADE;
DROP TYPE IF EXISTS emergency_type CASCADE;
DROP TYPE IF EXISTS emergency_severity CASCADE;
DROP TYPE IF EXISTS boarding_status CASCADE;
DROP TYPE IF EXISTS route_stop_status CASCADE;
DROP TYPE IF EXISTS route_status CASCADE;
DROP TYPE IF EXISTS vehicle_status CASCADE;
DROP TYPE IF EXISTS vehicle_maintenance_status CASCADE;
DROP TYPE IF EXISTS vehicle_gps_status CASCADE;
DROP TYPE IF EXISTS driver_status CASCADE;
DROP TYPE IF EXISTS driver_safety_status CASCADE;



-- =====================
-- 1. ENUM TYPES
-- =====================

-- Driver
CREATE TYPE driver_safety_status AS ENUM ('safe', 'warning', 'suspended');
CREATE TYPE driver_status AS ENUM ('available', 'on route', 'off duty', 'suspended');

-- Hardware GPS Device
CREATE TYPE gps_device_protocol AS ENUM ('teltonika_codec8', 'teltonika_codec8_extended', 'gt06_contex', 'ais140', 'simulated');
CREATE TYPE gps_device_status AS ENUM ('active', 'inactive', 'maintenance', 'unassigned');


-- Vehicle
CREATE TYPE vehicle_gps_status AS ENUM ('connected', 'disconnected');
CREATE TYPE vehicle_maintenance_status AS ENUM ('good', 'expiring', 'expired', 'maintenance');
CREATE TYPE vehicle_status AS ENUM ('active', 'inactive', 'maintenance', 'emergency');

-- Route
CREATE TYPE route_status AS ENUM ('scheduled', 'running', 'completed', 'inactive');
CREATE TYPE route_stop_status AS ENUM ('pending', 'arrived', 'passed');

-- Student
CREATE TYPE boarding_status AS ENUM ('not boarded', 'boarded', 'dropped off', 'absent');

-- Emergency
CREATE TYPE emergency_severity AS ENUM ('critical', 'high', 'medium');
CREATE TYPE emergency_type AS ENUM (
  'Accident', 'Medical Emergency', 'Vehicle Breakdown',
  'Route Deviation', 'Overspeeding', 'Student Safety', 'GPS Offline'
);
CREATE TYPE emergency_status AS ENUM ('active', 'acknowledged', 'responding', 'resolved');

-- Notification
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'success', 'error');

-- Activity
CREATE TYPE activity_type AS ENUM ('boarding', 'start', 'delay', 'emergency', 'complete', 'general');


-- =====================
-- 2. TABLES
-- =====================

-- ───────────────────────
-- 2.1  DRIVERS
-- ───────────────────────
CREATE TABLE drivers (
  id                TEXT PRIMARY KEY,            -- DRV-001
  name              TEXT NOT NULL,
  avatar            TEXT,                        -- URL to avatar image
  phone             TEXT NOT NULL,
  license_number    TEXT NOT NULL,
  license_expiry    DATE NOT NULL,
  bus_id            TEXT,                        -- FK → vehicles.id (set after seed)
  route_id          TEXT,                        -- FK → routes.id   (set after seed)
  experience        INTEGER NOT NULL DEFAULT 0,  -- years
  safety_status     driver_safety_status NOT NULL DEFAULT 'safe',
  eco_safety_score  INTEGER NOT NULL DEFAULT 95, -- Teltonika Green Driving Score 0-100
  status            driver_status NOT NULL DEFAULT 'available',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.2  VEHICLES
-- ───────────────────────
CREATE TABLE vehicles (
  id                    TEXT PRIMARY KEY,           -- BUS-001
  bus_number            TEXT NOT NULL UNIQUE,
  registration_number   TEXT NOT NULL UNIQUE,
  model                 TEXT NOT NULL,
  capacity              INTEGER NOT NULL DEFAULT 40,
  current_students      INTEGER NOT NULL DEFAULT 0,
  driver_id             TEXT,                       -- FK → drivers.id (set after seed)
  route_id              TEXT,                       -- FK → routes.id (set after seed)
  gps_status            vehicle_gps_status NOT NULL DEFAULT 'connected',
  gps_device_id         TEXT,
  insurance_expiry      DATE NOT NULL,
  fitness_expiry        DATE NOT NULL,
  pollution_expiry      DATE NOT NULL,
  maintenance_status    vehicle_maintenance_status NOT NULL DEFAULT 'good',
  status                vehicle_status NOT NULL DEFAULT 'active',
  current_speed         INTEGER NOT NULL DEFAULT 0, -- km/h
  max_speed_limit       INTEGER NOT NULL DEFAULT 50,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.3  ROUTES
-- ───────────────────────
CREATE TABLE routes (
  id                    TEXT PRIMARY KEY,           -- RT-001
  name                  TEXT NOT NULL,
  route_number          TEXT NOT NULL,
  bus_id                TEXT,                       -- FK → vehicles.id (set after seed)
  driver_id             TEXT,                       -- FK → drivers.id (set after seed)
  students_count        INTEGER NOT NULL DEFAULT 0,
  distance              NUMERIC(6,2) NOT NULL DEFAULT 0,    -- km
  duration              INTEGER NOT NULL DEFAULT 0,          -- minutes
  status                route_status NOT NULL DEFAULT 'scheduled',
  path                  JSONB,                     -- [[lat, lng], ...] polyline
  current_path_index    INTEGER NOT NULL DEFAULT 0,
  departure_time        TEXT,
  expected_arrival_time TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.4  ROUTE STOPS
-- ───────────────────────
CREATE TABLE route_stops (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  route_id        TEXT NOT NULL,                 -- FK → routes.id (set after seed)
  stop_order      INTEGER NOT NULL,              -- 1, 2, 3, …
  name            TEXT NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  scheduled_time  TEXT,
  actual_time     TEXT,
  status          route_stop_status NOT NULL DEFAULT 'pending',
  boarded_count   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.5  STUDENTS
-- ───────────────────────
CREATE TABLE students (
  id                TEXT PRIMARY KEY,              -- STU-0001
  name              TEXT NOT NULL,
  class             TEXT NOT NULL,                 -- "1" through "10"
  section           TEXT NOT NULL,                 -- "A", "B", "C"
  route_id          TEXT,                          -- FK → routes.id   (set after seed)
  bus_id            TEXT,                          -- FK → vehicles.id (set after seed)
  pickup_stop       TEXT,
  boarding_status   boarding_status NOT NULL DEFAULT 'not boarded',
  parent_name       TEXT,
  parent_contact    TEXT,
  emergency_contact TEXT,
  boarding_time     TEXT,
  drop_time         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.6  EMERGENCIES
-- ───────────────────────
CREATE TABLE emergencies (
  id                TEXT PRIMARY KEY,              -- EMG-001
  bus_id            TEXT,                          -- FK → vehicles.id (set after seed)
  route_id          TEXT,                          -- FK → routes.id   (set after seed)
  location_lat      DOUBLE PRECISION,
  location_lng      DOUBLE PRECISION,
  time              TEXT,
  severity          emergency_severity NOT NULL DEFAULT 'medium',
  description       TEXT,
  type              emergency_type NOT NULL,
  status            emergency_status NOT NULL DEFAULT 'active',
  driver_id         TEXT,                          -- FK → drivers.id  (set after seed)
  students_onboard  INTEGER NOT NULL DEFAULT 0,
  resolved_time     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.7  NOTIFICATIONS
-- ───────────────────────
CREATE TABLE notifications (
  id          TEXT PRIMARY KEY,
  type        notification_type NOT NULL DEFAULT 'info',
  message     TEXT NOT NULL,
  time        TEXT,
  bus_id      TEXT,                                -- FK → vehicles.id (set after seed)
  route_id    TEXT,                                -- FK → routes.id   (set after seed)
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.8  ACTIVITIES
-- ───────────────────────
CREATE TABLE activities (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  time        TEXT,
  bus_id      TEXT,                                -- FK → vehicles.id (set after seed)
  route_id    TEXT,                                -- FK → routes.id   (set after seed)
  type        activity_type NOT NULL DEFAULT 'general',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.9  APP SETTINGS
-- ───────────────────────
CREATE TABLE app_settings (
  id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  school_name                 TEXT NOT NULL DEFAULT 'Greenfield International School',
  gps_simulation              BOOLEAN NOT NULL DEFAULT TRUE,
  parent_notifications        BOOLEAN NOT NULL DEFAULT TRUE,
  delay_alerts                BOOLEAN NOT NULL DEFAULT TRUE,
  speed_limit                 INTEGER NOT NULL DEFAULT 50,
  route_deviation_threshold   INTEGER NOT NULL DEFAULT 100,   -- meters
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.10 HARDWARE GPS DEVICES (Teltonika FMC920 / FMB920)
-- ───────────────────────
CREATE TABLE gps_devices (
  id                  TEXT PRIMARY KEY,              -- GPS-DEV-001
  imei                TEXT NOT NULL UNIQUE,          -- Hardware 15-digit IMEI
  device_model        TEXT NOT NULL DEFAULT 'Teltonika FMC920',
  protocol            gps_device_protocol NOT NULL DEFAULT 'teltonika_codec8',
  sim_phone_number    TEXT,                          -- M2M SIM Number
  sim_carrier         TEXT DEFAULT 'Airtel M2M',
  firmware_version    TEXT DEFAULT '03.28.07.Rev.02',
  bus_id              TEXT,                          -- FK → vehicles.id
  status              gps_device_status NOT NULL DEFAULT 'active',
  last_ping_time      TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ───────────────────────
-- 2.11 HARDWARE GPS TELEMETRY LOGS
-- ───────────────────────
CREATE TABLE gps_telemetry_logs (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_id           TEXT NOT NULL,                 -- FK → gps_devices.id
  imei                TEXT NOT NULL,
  bus_id              TEXT,                          -- FK → vehicles.id
  lat                 DOUBLE PRECISION NOT NULL,
  lng                 DOUBLE PRECISION NOT NULL,
  speed               INTEGER NOT NULL DEFAULT 0,    -- km/h
  heading             INTEGER NOT NULL DEFAULT 0,    -- degrees 0-359
  altitude            DOUBLE PRECISION DEFAULT 0,    -- meters
  ignition_on         BOOLEAN NOT NULL DEFAULT TRUE,
  satellites_connected INTEGER DEFAULT 12,
  battery_voltage     NUMERIC(4,2) DEFAULT 12.6,     -- Volts
  raw_payload         TEXT,                          -- Raw Teltonika AVL hex packet or JSON
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT now()
);



-- =====================
-- 3. INDEXES
-- =====================

CREATE INDEX idx_drivers_bus_id       ON drivers(bus_id);
CREATE INDEX idx_drivers_route_id     ON drivers(route_id);
CREATE INDEX idx_drivers_status       ON drivers(status);

CREATE INDEX idx_vehicles_driver_id   ON vehicles(driver_id);
CREATE INDEX idx_vehicles_route_id    ON vehicles(route_id);
CREATE INDEX idx_vehicles_status      ON vehicles(status);

CREATE INDEX idx_routes_bus_id        ON routes(bus_id);
CREATE INDEX idx_routes_driver_id     ON routes(driver_id);
CREATE INDEX idx_routes_status        ON routes(status);

CREATE INDEX idx_route_stops_route    ON route_stops(route_id);

CREATE INDEX idx_students_route_id    ON students(route_id);
CREATE INDEX idx_students_bus_id      ON students(bus_id);
CREATE INDEX idx_students_boarding    ON students(boarding_status);

CREATE INDEX idx_emergencies_bus_id   ON emergencies(bus_id);
CREATE INDEX idx_emergencies_status   ON emergencies(status);

CREATE INDEX idx_notifications_read   ON notifications(read);
CREATE INDEX idx_notifications_bus    ON notifications(bus_id);

CREATE INDEX idx_activities_bus       ON activities(bus_id);
CREATE INDEX idx_activities_type      ON activities(type);


-- =====================
-- 4. ROW LEVEL SECURITY
-- =====================
-- Enable RLS on all tables. For this prototype, we allow full
-- access for authenticated users. In production, tighten these.

ALTER TABLE drivers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops    ENABLE ROW LEVEL SECURITY;
ALTER TABLE students       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything (prototype policy)
CREATE POLICY "Allow all for authenticated" ON drivers        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON vehicles       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON routes         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON route_stops    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON students       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON emergencies    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON notifications  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON activities     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON app_settings   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON gps_devices    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON gps_telemetry_logs FOR ALL USING (true) WITH CHECK (true);



-- =====================
-- 5. AUTO-UPDATE TRIGGERS
-- =====================
-- Automatically set `updated_at` on UPDATE for relevant tables.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_drivers_updated   BEFORE UPDATE ON drivers       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_vehicles_updated  BEFORE UPDATE ON vehicles      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_routes_updated    BEFORE UPDATE ON routes        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated  BEFORE UPDATE ON students      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_emergencies_upd   BEFORE UPDATE ON emergencies   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated  BEFORE UPDATE ON app_settings  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 6. SEED DATA — DEMO RECORDS
-- ============================================================


-- ───────────────────────
-- 6.1  SEED DRIVERS (26)
-- ───────────────────────
INSERT INTO drivers (id, name, avatar, phone, license_number, license_expiry, bus_id, route_id, experience, safety_status, status) VALUES
('DRV-001', 'Amit Sharma',       'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit%20Sharma',       '+91 98765 50000', 'DL-10000/KA03', '2029-12-01', 'BUS-001', 'RT-001', 5,  'safe',    'on route'),
('DRV-002', 'Rakesh Verma',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Rakesh%20Verma',      '+91 98765 50001', 'DL-10001/KA03', '2029-12-02', 'BUS-002', 'RT-002', 6,  'safe',    'on route'),
('DRV-003', 'Sanjay Kumar',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sanjay%20Kumar',      '+91 98765 50002', 'DL-10002/KA03', '2029-12-03', 'BUS-003', 'RT-003', 7,  'warning', 'on route'),
('DRV-004', 'Vijay Singh',       'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay%20Singh',       '+91 98765 50003', 'DL-10003/KA03', '2029-12-04', 'BUS-004', 'RT-004', 8,  'safe',    'on route'),
('DRV-005', 'Rajesh Patel',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh%20Patel',      '+91 98765 50004', 'DL-10004/KA03', '2029-12-05', 'BUS-005', 'RT-005', 9,  'safe',    'on route'),
('DRV-006', 'Anil Gupta',        'https://api.dicebear.com/7.x/avataaars/svg?seed=Anil%20Gupta',        '+91 98765 50005', 'DL-10005/KA03', '2029-12-06', 'BUS-006', 'RT-006', 10, 'safe',    'on route'),
('DRV-007', 'Sunil Dutt',        'https://api.dicebear.com/7.x/avataaars/svg?seed=Sunil%20Dutt',        '+91 98765 50006', 'DL-10006/KA03', '2029-12-07', 'BUS-007', 'RT-007', 11, 'safe',    'on route'),
('DRV-008', 'Ramesh Chawla',     'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh%20Chawla',     '+91 98765 50007', 'DL-10007/KA03', '2029-12-08', 'BUS-008', 'RT-008', 12, 'safe',    'on route'),
('DRV-009', 'Manoj Tiwari',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Manoj%20Tiwari',      '+91 98765 50008', 'DL-10008/KA03', '2029-12-09', 'BUS-009', 'RT-009', 13, 'safe',    'on route'),
('DRV-010', 'Vikram Rathore',    'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram%20Rathore',    '+91 98765 50009', 'DL-10009/KA03', '2029-12-10', 'BUS-010', 'RT-010', 14, 'safe',    'on route'),
('DRV-011', 'Karan Johar',       'https://api.dicebear.com/7.x/avataaars/svg?seed=Karan%20Johar',       '+91 98765 50010', 'DL-10010/KA03', '2029-12-11', 'BUS-011', 'RT-011', 15, 'safe',    'on route'),
('DRV-012', 'Arjun Reddy',       'https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun%20Reddy',       '+91 98765 50011', 'DL-10011/KA03', '2029-12-12', 'BUS-012', 'RT-012', 16, 'safe',    'on route'),
('DRV-013', 'Pradeep Yadav',     'https://api.dicebear.com/7.x/avataaars/svg?seed=Pradeep%20Yadav',     '+91 98765 50012', 'DL-10012/KA03', '2029-12-13', 'BUS-013', 'RT-013', 17, 'safe',    'on route'),
('DRV-014', 'Dinesh Karthik',    'https://api.dicebear.com/7.x/avataaars/svg?seed=Dinesh%20Karthik',    '+91 98765 50013', 'DL-10013/KA03', '2029-12-14', 'BUS-014', 'RT-014', 18, 'safe',    'on route'),
('DRV-015', 'Suresh Raina',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh%20Raina',      '+91 98765 50014', 'DL-10014/KA03', '2029-12-15', 'BUS-015', 'RT-015', 19, 'safe',    'on route'),
('DRV-016', 'Rahul Dravid',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul%20Dravid',      '+91 98765 50015', 'DL-10015/KA03', '2029-12-16', 'BUS-016', 'RT-016', 5,  'safe',    'on route'),
('DRV-017', 'Ashish Nehra',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Ashish%20Nehra',      '+91 98765 50016', 'DL-10016/KA03', '2029-12-17', 'BUS-017', 'RT-017', 6,  'safe',    'on route'),
('DRV-018', 'Harbhajan Singh',   'https://api.dicebear.com/7.x/avataaars/svg?seed=Harbhajan%20Singh',   '+91 98765 50017', 'DL-10017/KA03', '2029-12-18', 'BUS-018', 'RT-018', 7,  'safe',    'on route'),
('DRV-019', 'Mohit Sharma',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohit%20Sharma',      '+91 98765 50018', 'DL-10018/KA03', '2029-12-19', 'BUS-019', 'RT-019', 8,  'safe',    'on route'),
('DRV-020', 'Yuvraj Singh',      'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuvraj%20Singh',      '+91 98765 50019', 'DL-10019/KA03', '2029-12-20', 'BUS-020', 'RT-020', 9,  'safe',    'on route'),
('DRV-021', 'Ajinkya Rahane',    'https://api.dicebear.com/7.x/avataaars/svg?seed=Ajinkya%20Rahane',    '+91 98765 50020', 'DL-10020/KA03', '2029-12-21', 'BUS-021', 'RT-021', 10, 'safe',    'on route'),
('DRV-022', 'Cheteshwar Pujara', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cheteshwar%20Pujara', '+91 98765 50021', 'DL-10021/KA03', '2029-12-22', 'BUS-022', 'RT-022', 11, 'safe',    'on route'),
('DRV-023', 'Jasprit Bumrah',    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasprit%20Bumrah',    '+91 98765 50022', 'DL-10022/KA03', '2029-12-23', NULL,      NULL,     12, 'safe',    'available'),
('DRV-024', 'Hardik Pandya',     'https://api.dicebear.com/7.x/avataaars/svg?seed=Hardik%20Pandya',     '+91 98765 50023', 'DL-10023/KA03', '2029-12-24', NULL,      NULL,     13, 'safe',    'available'),
('DRV-025', 'Krunal Pandya',     'https://api.dicebear.com/7.x/avataaars/svg?seed=Krunal%20Pandya',     '+91 98765 50024', 'DL-10024/KA03', '2029-12-25', NULL,      NULL,     14, 'safe',    'available'),
('DRV-026', 'Ishant Sharma',     'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishant%20Sharma',     '+91 98765 50025', 'DL-10025/KA03', '2029-12-26', NULL,      NULL,     15, 'safe',    'available');


-- ───────────────────────
-- 6.2  SEED VEHICLES (35)
-- ───────────────────────
INSERT INTO vehicles (id, bus_number, registration_number, model, capacity, current_students, driver_id, route_id, gps_status, gps_device_id, insurance_expiry, fitness_expiry, pollution_expiry, maintenance_status, status, current_speed, max_speed_limit) VALUES
('BUS-001', 'BUS 01', 'KA-03-EQ-2001', 'Ashok Leyland Lynx',  40, 0, 'DRV-001', 'RT-001', 'connected',    'GPS-AIS-10001', '2027-04-01', '2026-11-01', '2026-09-01', 'good',        'active',      33,  50),
('BUS-002', 'BUS 02', 'KA-03-EQ-2002', 'Tata Starbus 40S',    40, 0, 'DRV-002', 'RT-002', 'connected',    'GPS-AIS-10002', '2027-04-02', '2026-11-02', '2026-09-02', 'good',        'active',      34,  50),
('BUS-003', 'BUS 03', 'KA-03-EQ-2003', 'Ashok Leyland Lynx',  40, 0, 'DRV-003', 'RT-003', 'connected',    'GPS-AIS-10003', '2027-04-03', '2026-11-03', '2026-09-03', 'expiring',    'active',      35,  50),
('BUS-004', 'BUS 04', 'KA-03-EQ-2004', 'Tata Starbus 40S',    40, 0, 'DRV-004', 'RT-004', 'connected',    'GPS-AIS-10004', '2027-04-04', '2026-11-04', '2026-09-04', 'good',        'active',      36,  50),
('BUS-005', 'BUS 05', 'KA-03-EQ-2005', 'Ashok Leyland Lynx',  40, 0, 'DRV-005', 'RT-005', 'connected',    'GPS-AIS-10005', '2027-04-05', '2026-11-05', '2026-09-05', 'good',        'active',      37,  50),
('BUS-006', 'BUS 06', 'KA-03-EQ-2006', 'Tata Starbus 40S',    40, 0, 'DRV-006', 'RT-006', 'connected',    'GPS-AIS-10006', '2027-04-06', '2026-11-06', '2026-09-06', 'good',        'active',      38,  50),
('BUS-007', 'BUS 07', 'KA-03-EQ-2007', 'Ashok Leyland Lynx',  40, 0, 'DRV-007', 'RT-007', 'connected',    'GPS-AIS-10007', '2027-04-07', '2026-11-07', '2026-09-07', 'good',        'active',      39,  50),
('BUS-008', 'BUS 08', 'KA-03-EQ-2008', 'Tata Starbus 40S',    40, 0, 'DRV-008', 'RT-008', 'connected',    'GPS-AIS-10008', '2027-04-08', '2026-11-08', '2026-09-08', 'good',        'active',      40,  50),
('BUS-009', 'BUS 09', 'KA-03-EQ-2009', 'Ashok Leyland Lynx',  40, 0, 'DRV-009', 'RT-009', 'connected',    'GPS-AIS-10009', '2027-04-09', '2026-11-09', '2026-09-09', 'good',        'active',      41,  50),
('BUS-010', 'BUS 10', 'KA-03-EQ-2010', 'Tata Starbus 40S',    40, 0, 'DRV-010', 'RT-010', 'connected',    'GPS-AIS-10010', '2027-04-10', '2026-11-10', '2026-09-10', 'good',        'active',      42,  50),
('BUS-011', 'BUS 11', 'KA-03-EQ-2011', 'Ashok Leyland Lynx',  40, 0, 'DRV-011', 'RT-011', 'connected',    'GPS-AIS-10011', '2027-04-11', '2026-11-11', '2026-09-11', 'good',        'active',      43,  50),
('BUS-012', 'BUS 12', 'KA-03-EQ-2012', 'Tata Starbus 40S',    40, 0, 'DRV-012', 'RT-012', 'connected',    'GPS-AIS-10012', '2027-04-12', '2026-11-12', '2026-09-12', 'good',        'emergency',    0,  50),
('BUS-013', 'BUS 13', 'KA-03-EQ-2013', 'Ashok Leyland Lynx',  40, 0, 'DRV-013', 'RT-013', 'connected',    'GPS-AIS-10013', '2027-04-13', '2026-11-13', '2026-09-13', 'good',        'active',      45,  50),
('BUS-014', 'BUS 14', 'KA-03-EQ-2014', 'Tata Starbus 40S',    40, 0, 'DRV-014', 'RT-014', 'connected',    'GPS-AIS-10014', '2027-04-14', '2026-11-14', '2026-09-14', 'good',        'active',      46,  50),
('BUS-015', 'BUS 15', 'KA-03-EQ-2015', 'Ashok Leyland Lynx',  40, 0, 'DRV-015', 'RT-015', 'connected',    'GPS-AIS-10015', '2027-04-15', '2026-11-15', '2026-09-15', 'expired',     'active',      32,  50),
('BUS-016', 'BUS 16', 'KA-03-EQ-2016', 'Tata Starbus 40S',    40, 0, 'DRV-016', 'RT-016', 'connected',    'GPS-AIS-10016', '2027-04-16', '2026-11-16', '2026-09-16', 'good',        'active',      33,  50),
('BUS-017', 'BUS 17', 'KA-03-EQ-2017', 'Ashok Leyland Lynx',  40, 0, 'DRV-017', 'RT-017', 'connected',    'GPS-AIS-10017', '2027-04-17', '2026-11-17', '2026-09-17', 'good',        'active',      34,  50),
('BUS-018', 'BUS 18', 'KA-03-EQ-2018', 'Tata Starbus 40S',    40, 0, 'DRV-018', 'RT-018', 'disconnected', 'GPS-AIS-10018', '2027-04-18', '2026-11-18', '2026-09-18', 'good',        'active',      35,  50),
('BUS-019', 'BUS 19', 'KA-03-EQ-2019', 'Ashok Leyland Lynx',  40, 0, 'DRV-019', 'RT-019', 'connected',    'GPS-AIS-10019', '2027-04-19', '2026-11-19', '2026-09-19', 'good',        'active',       0,  50),
('BUS-020', 'BUS 20', 'KA-03-EQ-2020', 'Tata Starbus 40S',    40, 0, 'DRV-020', 'RT-020', 'connected',    'GPS-AIS-10020', '2027-04-20', '2026-11-20', '2026-09-20', 'good',        'active',       0,  50),
('BUS-021', 'BUS 21', 'KA-03-EQ-2021', 'Ashok Leyland Lynx',  40, 0, 'DRV-021', 'RT-021', 'connected',    'GPS-AIS-10021', '2027-04-21', '2026-11-21', '2026-09-21', 'good',        'active',       0,  50),
('BUS-022', 'BUS 22', 'KA-03-EQ-2022', 'Tata Starbus 40S',    40, 0, 'DRV-022', 'RT-022', 'connected',    'GPS-AIS-10022', '2027-04-22', '2026-11-22', '2026-09-22', 'good',        'active',       0,  50),
('BUS-023', 'BUS 23', 'KA-03-EQ-2023', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10023', '2027-04-23', '2026-11-23', '2026-09-23', 'good',        'active',       0,  50),
('BUS-024', 'BUS 24', 'KA-03-EQ-2024', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10024', '2027-04-24', '2026-11-24', '2026-09-24', 'good',        'active',       0,  50),
('BUS-025', 'BUS 25', 'KA-03-EQ-2025', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10025', '2027-04-25', '2026-11-25', '2026-09-25', 'good',        'active',       0,  50),
('BUS-026', 'BUS 26', 'KA-03-EQ-2026', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10026', '2027-04-26', '2026-11-26', '2026-09-26', 'good',        'active',       0,  50),
('BUS-027', 'BUS 27', 'KA-03-EQ-2027', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10027', '2027-04-27', '2026-11-27', '2026-09-27', 'good',        'active',       0,  50),
('BUS-028', 'BUS 28', 'KA-03-EQ-2028', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10028', '2027-04-28', '2026-11-28', '2026-09-28', 'good',        'active',       0,  50),
('BUS-029', 'BUS 29', 'KA-03-EQ-2029', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10029', '2027-04-01', '2026-11-01', '2026-09-01', 'maintenance', 'maintenance',  0,  50),
('BUS-030', 'BUS 30', 'KA-03-EQ-2030', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10030', '2027-04-02', '2026-11-02', '2026-09-02', 'maintenance', 'maintenance',  0,  50),
('BUS-031', 'BUS 31', 'KA-03-EQ-2031', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10031', '2027-04-03', '2026-11-03', '2026-09-03', 'maintenance', 'maintenance',  0,  50),
('BUS-032', 'BUS 32', 'KA-03-EQ-2032', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10032', '2027-04-04', '2026-11-04', '2026-09-04', 'maintenance', 'maintenance',  0,  50),
('BUS-033', 'BUS 33', 'KA-03-EQ-2033', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10033', '2027-04-05', '2026-11-05', '2026-09-05', 'good',        'inactive',     0,  50),
('BUS-034', 'BUS 34', 'KA-03-EQ-2034', 'Tata Starbus 40S',    40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10034', '2027-04-06', '2026-11-06', '2026-09-06', 'good',        'inactive',     0,  50),
('BUS-035', 'BUS 35', 'KA-03-EQ-2035', 'Ashok Leyland Lynx',  40, 0, NULL,      NULL,     'connected',    'GPS-AIS-10035', '2027-04-07', '2026-11-07', '2026-09-07', 'good',        'inactive',     0,  50);


-- ───────────────────────
-- 6.3  SEED ROUTES (22)
-- ───────────────────────
INSERT INTO routes (id, name, route_number, bus_id, driver_id, students_count, distance, duration, status, current_path_index, departure_time, expected_arrival_time) VALUES
('RT-001', 'Greenfield ↔ Zone B', 'Route 1',  'BUS-001', 'DRV-001', 21, 13, 36, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-002', 'Hill ↔ Zone C',       'Route 2',  'BUS-002', 'DRV-002', 22, 14, 37, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-003', 'Sunrise ↔ Zone D',    'Route 3',  'BUS-003', 'DRV-003', 23, 15, 38, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-004', 'Lake ↔ Zone E',       'Route 4',  'BUS-004', 'DRV-004', 24, 16, 39, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-005', 'St. ↔ Zone F',        'Route 5',  'BUS-005', 'DRV-005', 25, 17, 40, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-006', 'Greenfield ↔ Zone A', 'Route 6',  'BUS-006', 'DRV-006', 26, 18, 41, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-007', 'Hill ↔ Zone B',       'Route 7',  'BUS-007', 'DRV-007', 27, 19, 42, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-008', 'Sunrise ↔ Zone C',    'Route 8',  'BUS-008', 'DRV-008', 28, 20, 43, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-009', 'Lake ↔ Zone D',       'Route 9',  'BUS-009', 'DRV-009', 29, 21, 44, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-010', 'St. ↔ Zone E',        'Route 10', 'BUS-010', 'DRV-010', 30, 12, 45, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-011', 'Greenfield ↔ Zone F', 'Route 11', 'BUS-011', 'DRV-011', 31, 13, 46, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-012', 'Hill ↔ Zone A',       'Route 12', 'BUS-012', 'DRV-012', 32, 14, 47, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-013', 'Sunrise ↔ Zone B',    'Route 13', 'BUS-013', 'DRV-013', 33, 15, 48, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-014', 'Lake ↔ Zone C',       'Route 14', 'BUS-014', 'DRV-014', 34, 16, 49, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-015', 'St. ↔ Zone D',        'Route 15', 'BUS-015', 'DRV-015', 20, 17, 50, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-016', 'Greenfield ↔ Zone E', 'Route 16', 'BUS-016', 'DRV-016', 21, 18, 51, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-017', 'Hill ↔ Zone F',       'Route 17', 'BUS-017', 'DRV-017', 22, 19, 52, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-018', 'Sunrise ↔ Zone A',    'Route 18', 'BUS-018', 'DRV-018', 23, 20, 53, 'running',   12, '07:30 AM', '08:30 AM'),
('RT-019', 'Lake ↔ Zone B',       'Route 19', 'BUS-019', 'DRV-019', 24, 21, 54, 'scheduled',  0, '07:30 AM', '08:30 AM'),
('RT-020', 'St. ↔ Zone C',        'Route 20', 'BUS-020', 'DRV-020', 25, 12, 35, 'scheduled',  0, '07:30 AM', '08:30 AM'),
('RT-021', 'Greenfield ↔ Zone D', 'Route 21', 'BUS-021', 'DRV-021', 26, 13, 36, 'scheduled',  0, '07:30 AM', '08:30 AM'),
('RT-022', 'Hill ↔ Zone E',       'Route 22', 'BUS-022', 'DRV-022', 27, 14, 37, 'scheduled',  0, '07:30 AM', '08:30 AM');


-- ───────────────────────
-- 6.4  SEED EMERGENCIES (3)
-- ───────────────────────
INSERT INTO emergencies (id, bus_id, route_id, location_lat, location_lng, time, severity, description, type, status, driver_id, students_onboard) VALUES
('EMG-001', 'BUS-012', 'RT-012', 12.9815, 77.5842, '08:05 AM', 'critical', 'Engine overheating. Smoke reported from the bonnet on MG Road.',                             'Vehicle Breakdown', 'active', 'DRV-012', 26),
('EMG-002', 'BUS-003', 'RT-003', 12.9515, 77.6251, '08:10 AM', 'high',     'Vehicle exceeded school safety limit of 50 km/h (Recorded: 72 km/h on flyover).',            'Overspeeding',      'active', 'DRV-003', 19),
('EMG-003', 'BUS-018', 'RT-018', 12.9325, 77.5482, '07:55 AM', 'medium',   'GPS transponder unit has lost cellular connectivity. Last ping 15 minutes ago.',              'GPS Offline',       'active', 'DRV-018', 19);


-- ───────────────────────
-- 6.5  SEED NOTIFICATIONS (4)
-- ───────────────────────
INSERT INTO notifications (id, type, message, time, bus_id, route_id, read) VALUES
('NTF-001', 'error',   'CRITICAL: BUS 12 reported a Vehicle Breakdown on Route 12.',       '08:05 AM', 'BUS-012', 'RT-012', FALSE),
('NTF-002', 'warning', 'Overspeeding: BUS 03 detected running at 72 km/h (Limit: 50).',    '08:10 AM', 'BUS-003', 'RT-003', FALSE),
('NTF-003', 'warning', 'GPS Signal Lost: BUS 18 GPS has gone offline.',                     '07:55 AM', 'BUS-018', 'RT-018', TRUE),
('NTF-004', 'success', 'Route 7 started running successfully.',                             '07:30 AM', 'BUS-007', 'RT-007', TRUE);


-- ───────────────────────
-- 6.6  SEED ACTIVITIES (5)
-- ───────────────────────
INSERT INTO activities (id, text, time, bus_id, route_id, type) VALUES
('ACT-001', 'BUS 07 started running on Greenfield School radial route.',  '07:30 AM', 'BUS-007', 'RT-007', 'start'),
('ACT-002', 'GPS Offline alert triggered for BUS 18.',                     '07:55 AM', 'BUS-018', 'RT-018', 'emergency'),
('ACT-003', 'Emergency Vehicle Breakdown reported by BUS 12.',             '08:05 AM', 'BUS-012', 'RT-012', 'emergency'),
('ACT-004', 'Overspeeding alert logged for BUS 03 (72 km/h).',            '08:10 AM', 'BUS-003', 'RT-003', 'emergency'),
('ACT-005', '15 students boarded BUS 07 at Indiranagar Circle Stop 1.',   '08:12 AM', 'BUS-007', 'RT-007', 'boarding');


-- ───────────────────────
-- 6.7  SEED APP SETTINGS
-- ───────────────────────
INSERT INTO app_settings (school_name, gps_simulation, parent_notifications, delay_alerts, speed_limit, route_deviation_threshold) VALUES
('Greenfield International School', TRUE, TRUE, TRUE, 50, 100);


-- ============================================================
-- DONE! Your Supabase database is now fully set up.
-- 
-- Tables created:
--   • drivers        (26 rows)
--   • vehicles       (35 rows)
--   • routes         (22 rows)
--   • route_stops    (populate via app or separate INSERT)
--   • students       (populate via CSV import — 573 rows)
--   • emergencies    (3 rows)
--   • notifications  (4 rows)
--   • activities     (5 rows)
--   • app_settings   (1 row)
--
-- NOTE: The `students` table has ~573 rows. Due to the large
-- volume, it is recommended to import them via:
--   1. Supabase Dashboard → Table Editor → students → Import CSV
--   2. Upload the `demo_students.csv` file generated earlier
--
-- The `route_stops` and `routes.path` data contain computed
-- GPS coordinates. The `path` column is stored as JSONB on
-- the routes table. Route stops can be imported similarly
-- from the app's seed logic or via a separate script.
-- ============================================================
-- ============================================================
-- STUDENT SEED DATA (573 rows)
-- Append this to supabase_schema.sql or run separately
-- ============================================================

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0001', 'Aditi Iyer', '2', 'B', 'RT-001', 'BUS-001', 'Koramangala 5th Block Stop 1', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70001', '+91 91111 10001', '08:12 AM', NULL),
('STU-0002', 'Krishna Pillai', '3', 'C', 'RT-001', 'BUS-001', 'HSR Layout BDA Complex Stop 2', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70002', '+91 91111 10002', '08:12 AM', NULL),
('STU-0003', 'Diya Mishra', '4', 'A', 'RT-001', 'BUS-001', 'Whitefield Metro Stn Stop 3', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70003', '+91 91111 10003', '08:12 AM', NULL),
('STU-0004', 'Rohan Patel', '5', 'B', 'RT-001', 'BUS-001', 'Jayanagar 4th Block Stop 4', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70004', '+91 91111 10004', '08:12 AM', NULL),
('STU-0005', 'Kavya Mehta', '6', 'C', 'RT-001', 'BUS-001', 'Malleshwaram 8th Cross Stop 5', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70005', '+91 91111 10005', '08:12 AM', NULL),
('STU-0006', 'Atharv Deshmukh', '7', 'A', 'RT-001', 'BUS-001', 'Hebbal Flyover Junction Stop 6', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70006', '+91 91111 10006', '08:12 AM', NULL),
('STU-0007', 'Anika Verma', '8', 'B', 'RT-001', 'BUS-001', 'Koramangala 5th Block Stop 1', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70007', '+91 91111 10007', '08:12 AM', NULL),
('STU-0008', 'Aaryan Reddy', '9', 'C', 'RT-001', 'BUS-001', 'HSR Layout BDA Complex Stop 2', 'dropped off', 'Mr. & Mrs. Reddy', '+91 99887 70008', '+91 91111 10008', '08:12 AM', '08:35 AM'),
('STU-0009', 'Ridhi Bose', '10', 'A', 'RT-001', 'BUS-001', 'Whitefield Metro Stn Stop 3', 'absent', 'Mr. & Mrs. Bose', '+91 99887 70009', '+91 91111 10009', NULL, NULL),
('STU-0010', 'Siddharth Pandey', '1', 'B', 'RT-001', 'BUS-001', 'Jayanagar 4th Block Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70010', '+91 91111 10010', '08:12 AM', NULL),
('STU-0011', 'Aanya Gupta', '2', 'C', 'RT-001', 'BUS-001', 'Malleshwaram 8th Cross Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70011', '+91 91111 10011', '08:12 AM', NULL),
('STU-0012', 'Sai Das', '3', 'A', 'RT-001', 'BUS-001', 'Hebbal Flyover Junction Stop 6', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70012', '+91 91111 10012', '08:12 AM', NULL),
('STU-0013', 'Prisha Kulkarni', '4', 'B', 'RT-001', 'BUS-001', 'Koramangala 5th Block Stop 1', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70013', '+91 91111 10013', '08:12 AM', NULL),
('STU-0014', 'Kabir Kumar', '5', 'C', 'RT-001', 'BUS-001', 'HSR Layout BDA Complex Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70014', '+91 91111 10014', '08:12 AM', NULL),
('STU-0015', 'Saanvi Rao', '6', 'A', 'RT-001', 'BUS-001', 'Whitefield Metro Stn Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70015', '+91 91111 10015', '08:12 AM', NULL),
('STU-0016', 'Dev Sen', '7', 'B', 'RT-001', 'BUS-001', 'Jayanagar 4th Block Stop 4', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70016', '+91 91111 10016', '08:12 AM', NULL),
('STU-0017', 'Avani Dubey', '8', 'C', 'RT-001', 'BUS-001', 'Malleshwaram 8th Cross Stop 5', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70017', '+91 91111 10017', '08:12 AM', NULL),
('STU-0018', 'Shaurya Nair', '9', 'A', 'RT-001', 'BUS-001', 'Hebbal Flyover Junction Stop 6', 'dropped off', 'Mr. & Mrs. Nair', '+91 99887 70018', '+91 91111 10018', '08:12 AM', '08:35 AM'),
('STU-0019', 'Ira Choudhury', '10', 'B', 'RT-001', 'BUS-001', 'Koramangala 5th Block Stop 1', 'absent', 'Mr. & Mrs. Choudhury', '+91 99887 70019', '+91 91111 10019', NULL, NULL),
('STU-0020', 'Dhruv Prasad', '1', 'C', 'RT-001', 'BUS-001', 'HSR Layout BDA Complex Stop 2', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70020', '+91 91111 10020', '08:12 AM', NULL),
('STU-0021', 'Aisha Singh', '2', 'A', 'RT-001', 'BUS-001', 'Whitefield Metro Stn Stop 3', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70021', '+91 91111 10021', '08:12 AM', NULL),
('STU-0022', 'Vihaan Joshi', '3', 'B', 'RT-002', 'BUS-002', 'HSR Layout BDA Complex Stop 1', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70022', '+91 91111 10022', '08:12 AM', NULL),
('STU-0023', 'Ananya Roy', '4', 'C', 'RT-002', 'BUS-002', 'Whitefield Metro Stn Stop 2', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70023', '+91 91111 10023', '08:12 AM', NULL),
('STU-0024', 'Ishaan Sharma', '5', 'A', 'RT-002', 'BUS-002', 'Jayanagar 4th Block Stop 3', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70024', '+91 91111 10024', '08:12 AM', NULL),
('STU-0025', 'Meera Iyer', '6', 'B', 'RT-002', 'BUS-002', 'Malleshwaram 8th Cross Stop 4', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70025', '+91 91111 10025', '08:12 AM', NULL),
('STU-0026', 'Arjun Pillai', '7', 'C', 'RT-002', 'BUS-002', 'Hebbal Flyover Junction Stop 5', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70026', '+91 91111 10026', '08:12 AM', NULL),
('STU-0027', 'Riya Mishra', '8', 'A', 'RT-002', 'BUS-002', 'MG Road Metro Stop 6', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70027', '+91 91111 10027', '08:12 AM', NULL),
('STU-0028', 'Reyansh Patel', '9', 'B', 'RT-002', 'BUS-002', 'Bannerghatta Road Apex Stop 7', 'dropped off', 'Mr. & Mrs. Patel', '+91 99887 70028', '+91 91111 10028', '08:12 AM', '08:35 AM'),
('STU-0029', 'Zara Mehta', '10', 'C', 'RT-002', 'BUS-002', 'HSR Layout BDA Complex Stop 1', 'absent', 'Mr. & Mrs. Mehta', '+91 99887 70029', '+91 91111 10029', NULL, NULL),
('STU-0030', 'Kian Deshmukh', '1', 'A', 'RT-002', 'BUS-002', 'Whitefield Metro Stn Stop 2', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70030', '+91 91111 10030', '08:12 AM', NULL),
('STU-0031', 'Myra Verma', '2', 'B', 'RT-002', 'BUS-002', 'Jayanagar 4th Block Stop 3', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70031', '+91 91111 10031', '08:12 AM', NULL),
('STU-0032', 'Aarav Reddy', '3', 'C', 'RT-002', 'BUS-002', 'Malleshwaram 8th Cross Stop 4', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70032', '+91 91111 10032', '08:12 AM', NULL),
('STU-0033', 'Aditi Bose', '4', 'A', 'RT-002', 'BUS-002', 'Hebbal Flyover Junction Stop 5', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70033', '+91 91111 10033', '08:12 AM', NULL),
('STU-0034', 'Krishna Pandey', '5', 'B', 'RT-002', 'BUS-002', 'MG Road Metro Stop 6', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70034', '+91 91111 10034', '08:12 AM', NULL),
('STU-0035', 'Diya Gupta', '6', 'C', 'RT-002', 'BUS-002', 'Bannerghatta Road Apex Stop 7', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70035', '+91 91111 10035', '08:12 AM', NULL),
('STU-0036', 'Rohan Das', '7', 'A', 'RT-002', 'BUS-002', 'HSR Layout BDA Complex Stop 1', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70036', '+91 91111 10036', '08:12 AM', NULL),
('STU-0037', 'Kavya Kulkarni', '8', 'B', 'RT-002', 'BUS-002', 'Whitefield Metro Stn Stop 2', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70037', '+91 91111 10037', '08:12 AM', NULL),
('STU-0038', 'Atharv Kumar', '9', 'C', 'RT-002', 'BUS-002', 'Jayanagar 4th Block Stop 3', 'dropped off', 'Mr. & Mrs. Kumar', '+91 99887 70038', '+91 91111 10038', '08:12 AM', '08:35 AM'),
('STU-0039', 'Anika Rao', '10', 'A', 'RT-002', 'BUS-002', 'Malleshwaram 8th Cross Stop 4', 'absent', 'Mr. & Mrs. Rao', '+91 99887 70039', '+91 91111 10039', NULL, NULL),
('STU-0040', 'Aaryan Sen', '1', 'B', 'RT-002', 'BUS-002', 'Hebbal Flyover Junction Stop 5', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70040', '+91 91111 10040', '08:12 AM', NULL),
('STU-0041', 'Ridhi Dubey', '2', 'C', 'RT-002', 'BUS-002', 'MG Road Metro Stop 6', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70041', '+91 91111 10041', '08:12 AM', NULL),
('STU-0042', 'Siddharth Nair', '3', 'A', 'RT-002', 'BUS-002', 'Bannerghatta Road Apex Stop 7', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70042', '+91 91111 10042', '08:12 AM', NULL),
('STU-0043', 'Aanya Choudhury', '4', 'B', 'RT-002', 'BUS-002', 'HSR Layout BDA Complex Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70043', '+91 91111 10043', '08:12 AM', NULL),
('STU-0044', 'Sai Prasad', '5', 'C', 'RT-003', 'BUS-003', 'Whitefield Metro Stn Stop 1', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70044', '+91 91111 10044', '08:12 AM', NULL),
('STU-0045', 'Prisha Singh', '6', 'A', 'RT-003', 'BUS-003', 'Jayanagar 4th Block Stop 2', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70045', '+91 91111 10045', '08:12 AM', NULL),
('STU-0046', 'Kabir Joshi', '7', 'B', 'RT-003', 'BUS-003', 'Malleshwaram 8th Cross Stop 3', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70046', '+91 91111 10046', '08:12 AM', NULL),
('STU-0047', 'Saanvi Roy', '8', 'C', 'RT-003', 'BUS-003', 'Hebbal Flyover Junction Stop 4', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70047', '+91 91111 10047', '08:12 AM', NULL),
('STU-0048', 'Dev Sharma', '9', 'A', 'RT-003', 'BUS-003', 'MG Road Metro Stop 5', 'dropped off', 'Mr. & Mrs. Sharma', '+91 99887 70048', '+91 91111 10048', '08:12 AM', '08:35 AM'),
('STU-0049', 'Avani Iyer', '10', 'B', 'RT-003', 'BUS-003', 'Bannerghatta Road Apex Stop 6', 'absent', 'Mr. & Mrs. Iyer', '+91 99887 70049', '+91 91111 10049', NULL, NULL),
('STU-0050', 'Shaurya Pillai', '1', 'C', 'RT-003', 'BUS-003', 'Basavanagudi Temple St Stop 7', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70050', '+91 91111 10050', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0051', 'Ira Mishra', '2', 'A', 'RT-003', 'BUS-003', 'Richmond Road Plaza Stop 8', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70051', '+91 91111 10051', '08:12 AM', NULL),
('STU-0052', 'Dhruv Patel', '3', 'B', 'RT-003', 'BUS-003', 'Whitefield Metro Stn Stop 1', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70052', '+91 91111 10052', '08:12 AM', NULL),
('STU-0053', 'Aisha Mehta', '4', 'C', 'RT-003', 'BUS-003', 'Jayanagar 4th Block Stop 2', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70053', '+91 91111 10053', '08:12 AM', NULL),
('STU-0054', 'Vihaan Deshmukh', '5', 'A', 'RT-003', 'BUS-003', 'Malleshwaram 8th Cross Stop 3', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70054', '+91 91111 10054', '08:12 AM', NULL),
('STU-0055', 'Ananya Verma', '6', 'B', 'RT-003', 'BUS-003', 'Hebbal Flyover Junction Stop 4', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70055', '+91 91111 10055', '08:12 AM', NULL),
('STU-0056', 'Ishaan Reddy', '7', 'C', 'RT-003', 'BUS-003', 'MG Road Metro Stop 5', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70056', '+91 91111 10056', '08:12 AM', NULL),
('STU-0057', 'Meera Bose', '8', 'A', 'RT-003', 'BUS-003', 'Bannerghatta Road Apex Stop 6', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70057', '+91 91111 10057', '08:12 AM', NULL),
('STU-0058', 'Arjun Pandey', '9', 'B', 'RT-003', 'BUS-003', 'Basavanagudi Temple St Stop 7', 'dropped off', 'Mr. & Mrs. Pandey', '+91 99887 70058', '+91 91111 10058', '08:12 AM', '08:35 AM'),
('STU-0059', 'Riya Gupta', '10', 'C', 'RT-003', 'BUS-003', 'Richmond Road Plaza Stop 8', 'absent', 'Mr. & Mrs. Gupta', '+91 99887 70059', '+91 91111 10059', NULL, NULL),
('STU-0060', 'Reyansh Das', '1', 'A', 'RT-003', 'BUS-003', 'Whitefield Metro Stn Stop 1', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70060', '+91 91111 10060', '08:12 AM', NULL),
('STU-0061', 'Zara Kulkarni', '2', 'B', 'RT-003', 'BUS-003', 'Jayanagar 4th Block Stop 2', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70061', '+91 91111 10061', '08:12 AM', NULL),
('STU-0062', 'Kian Kumar', '3', 'C', 'RT-003', 'BUS-003', 'Malleshwaram 8th Cross Stop 3', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70062', '+91 91111 10062', '08:12 AM', NULL),
('STU-0063', 'Myra Rao', '4', 'A', 'RT-003', 'BUS-003', 'Hebbal Flyover Junction Stop 4', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70063', '+91 91111 10063', '08:12 AM', NULL),
('STU-0064', 'Aarav Sen', '5', 'B', 'RT-003', 'BUS-003', 'MG Road Metro Stop 5', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70064', '+91 91111 10064', '08:12 AM', NULL),
('STU-0065', 'Aditi Dubey', '6', 'C', 'RT-003', 'BUS-003', 'Bannerghatta Road Apex Stop 6', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70065', '+91 91111 10065', '08:12 AM', NULL),
('STU-0066', 'Krishna Nair', '7', 'A', 'RT-003', 'BUS-003', 'Basavanagudi Temple St Stop 7', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70066', '+91 91111 10066', '08:12 AM', NULL),
('STU-0067', 'Diya Choudhury', '8', 'B', 'RT-004', 'BUS-004', 'Jayanagar 4th Block Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70067', '+91 91111 10067', '08:12 AM', NULL),
('STU-0068', 'Rohan Prasad', '9', 'C', 'RT-004', 'BUS-004', 'Malleshwaram 8th Cross Stop 2', 'dropped off', 'Mr. & Mrs. Prasad', '+91 99887 70068', '+91 91111 10068', '08:12 AM', '08:35 AM'),
('STU-0069', 'Kavya Singh', '10', 'A', 'RT-004', 'BUS-004', 'Hebbal Flyover Junction Stop 3', 'absent', 'Mr. & Mrs. Singh', '+91 99887 70069', '+91 91111 10069', NULL, NULL),
('STU-0070', 'Atharv Joshi', '1', 'B', 'RT-004', 'BUS-004', 'MG Road Metro Stop 4', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70070', '+91 91111 10070', '08:12 AM', NULL),
('STU-0071', 'Anika Roy', '2', 'C', 'RT-004', 'BUS-004', 'Bannerghatta Road Apex Stop 5', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70071', '+91 91111 10071', '08:12 AM', NULL),
('STU-0072', 'Aaryan Sharma', '3', 'A', 'RT-004', 'BUS-004', 'Jayanagar 4th Block Stop 1', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70072', '+91 91111 10072', '08:12 AM', NULL),
('STU-0073', 'Ridhi Iyer', '4', 'B', 'RT-004', 'BUS-004', 'Malleshwaram 8th Cross Stop 2', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70073', '+91 91111 10073', '08:12 AM', NULL),
('STU-0074', 'Siddharth Pillai', '5', 'C', 'RT-004', 'BUS-004', 'Hebbal Flyover Junction Stop 3', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70074', '+91 91111 10074', '08:12 AM', NULL),
('STU-0075', 'Aanya Mishra', '6', 'A', 'RT-004', 'BUS-004', 'MG Road Metro Stop 4', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70075', '+91 91111 10075', '08:12 AM', NULL),
('STU-0076', 'Sai Patel', '7', 'B', 'RT-004', 'BUS-004', 'Bannerghatta Road Apex Stop 5', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70076', '+91 91111 10076', '08:12 AM', NULL),
('STU-0077', 'Prisha Mehta', '8', 'C', 'RT-004', 'BUS-004', 'Jayanagar 4th Block Stop 1', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70077', '+91 91111 10077', '08:12 AM', NULL),
('STU-0078', 'Kabir Deshmukh', '9', 'A', 'RT-004', 'BUS-004', 'Malleshwaram 8th Cross Stop 2', 'dropped off', 'Mr. & Mrs. Deshmukh', '+91 99887 70078', '+91 91111 10078', '08:12 AM', '08:35 AM'),
('STU-0079', 'Saanvi Verma', '10', 'B', 'RT-004', 'BUS-004', 'Hebbal Flyover Junction Stop 3', 'absent', 'Mr. & Mrs. Verma', '+91 99887 70079', '+91 91111 10079', NULL, NULL),
('STU-0080', 'Dev Reddy', '1', 'C', 'RT-004', 'BUS-004', 'MG Road Metro Stop 4', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70080', '+91 91111 10080', '08:12 AM', NULL),
('STU-0081', 'Avani Bose', '2', 'A', 'RT-004', 'BUS-004', 'Bannerghatta Road Apex Stop 5', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70081', '+91 91111 10081', '08:12 AM', NULL),
('STU-0082', 'Shaurya Pandey', '3', 'B', 'RT-004', 'BUS-004', 'Jayanagar 4th Block Stop 1', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70082', '+91 91111 10082', '08:12 AM', NULL),
('STU-0083', 'Ira Gupta', '4', 'C', 'RT-004', 'BUS-004', 'Malleshwaram 8th Cross Stop 2', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70083', '+91 91111 10083', '08:12 AM', NULL),
('STU-0084', 'Dhruv Das', '5', 'A', 'RT-004', 'BUS-004', 'Hebbal Flyover Junction Stop 3', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70084', '+91 91111 10084', '08:12 AM', NULL),
('STU-0085', 'Aisha Kulkarni', '6', 'B', 'RT-004', 'BUS-004', 'MG Road Metro Stop 4', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70085', '+91 91111 10085', '08:12 AM', NULL),
('STU-0086', 'Vihaan Kumar', '7', 'C', 'RT-004', 'BUS-004', 'Bannerghatta Road Apex Stop 5', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70086', '+91 91111 10086', '08:12 AM', NULL),
('STU-0087', 'Ananya Rao', '8', 'A', 'RT-004', 'BUS-004', 'Jayanagar 4th Block Stop 1', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70087', '+91 91111 10087', '08:12 AM', NULL),
('STU-0088', 'Ishaan Sen', '9', 'B', 'RT-004', 'BUS-004', 'Malleshwaram 8th Cross Stop 2', 'dropped off', 'Mr. & Mrs. Sen', '+91 99887 70088', '+91 91111 10088', '08:12 AM', '08:35 AM'),
('STU-0089', 'Meera Dubey', '10', 'C', 'RT-004', 'BUS-004', 'Hebbal Flyover Junction Stop 3', 'absent', 'Mr. & Mrs. Dubey', '+91 99887 70089', '+91 91111 10089', NULL, NULL),
('STU-0090', 'Arjun Nair', '1', 'A', 'RT-004', 'BUS-004', 'MG Road Metro Stop 4', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70090', '+91 91111 10090', '08:12 AM', NULL),
('STU-0091', 'Riya Choudhury', '2', 'B', 'RT-005', 'BUS-005', 'Malleshwaram 8th Cross Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70091', '+91 91111 10091', '08:12 AM', NULL),
('STU-0092', 'Reyansh Prasad', '3', 'C', 'RT-005', 'BUS-005', 'Hebbal Flyover Junction Stop 2', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70092', '+91 91111 10092', '08:12 AM', NULL),
('STU-0093', 'Zara Singh', '4', 'A', 'RT-005', 'BUS-005', 'MG Road Metro Stop 3', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70093', '+91 91111 10093', '08:12 AM', NULL),
('STU-0094', 'Kian Joshi', '5', 'B', 'RT-005', 'BUS-005', 'Bannerghatta Road Apex Stop 4', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70094', '+91 91111 10094', '08:12 AM', NULL),
('STU-0095', 'Myra Roy', '6', 'C', 'RT-005', 'BUS-005', 'Basavanagudi Temple St Stop 5', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70095', '+91 91111 10095', '08:12 AM', NULL),
('STU-0096', 'Aarav Sharma', '7', 'A', 'RT-005', 'BUS-005', 'Richmond Road Plaza Stop 6', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70096', '+91 91111 10096', '08:12 AM', NULL),
('STU-0097', 'Aditi Iyer', '8', 'B', 'RT-005', 'BUS-005', 'Malleshwaram 8th Cross Stop 1', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70097', '+91 91111 10097', '08:12 AM', NULL),
('STU-0098', 'Krishna Pillai', '9', 'C', 'RT-005', 'BUS-005', 'Hebbal Flyover Junction Stop 2', 'dropped off', 'Mr. & Mrs. Pillai', '+91 99887 70098', '+91 91111 10098', '08:12 AM', '08:35 AM'),
('STU-0099', 'Diya Mishra', '10', 'A', 'RT-005', 'BUS-005', 'MG Road Metro Stop 3', 'absent', 'Mr. & Mrs. Mishra', '+91 99887 70099', '+91 91111 10099', NULL, NULL),
('STU-0100', 'Rohan Patel', '1', 'B', 'RT-005', 'BUS-005', 'Bannerghatta Road Apex Stop 4', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70100', '+91 91111 10100', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0101', 'Kavya Mehta', '2', 'C', 'RT-005', 'BUS-005', 'Basavanagudi Temple St Stop 5', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70101', '+91 91111 10101', '08:12 AM', NULL),
('STU-0102', 'Atharv Deshmukh', '3', 'A', 'RT-005', 'BUS-005', 'Richmond Road Plaza Stop 6', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70102', '+91 91111 10102', '08:12 AM', NULL),
('STU-0103', 'Anika Verma', '4', 'B', 'RT-005', 'BUS-005', 'Malleshwaram 8th Cross Stop 1', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70103', '+91 91111 10103', '08:12 AM', NULL),
('STU-0104', 'Aaryan Reddy', '5', 'C', 'RT-005', 'BUS-005', 'Hebbal Flyover Junction Stop 2', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70104', '+91 91111 10104', '08:12 AM', NULL),
('STU-0105', 'Ridhi Bose', '6', 'A', 'RT-005', 'BUS-005', 'MG Road Metro Stop 3', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70105', '+91 91111 10105', '08:12 AM', NULL),
('STU-0106', 'Siddharth Pandey', '7', 'B', 'RT-005', 'BUS-005', 'Bannerghatta Road Apex Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70106', '+91 91111 10106', '08:12 AM', NULL),
('STU-0107', 'Aanya Gupta', '8', 'C', 'RT-005', 'BUS-005', 'Basavanagudi Temple St Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70107', '+91 91111 10107', '08:12 AM', NULL),
('STU-0108', 'Sai Das', '9', 'A', 'RT-005', 'BUS-005', 'Richmond Road Plaza Stop 6', 'dropped off', 'Mr. & Mrs. Das', '+91 99887 70108', '+91 91111 10108', '08:12 AM', '08:35 AM'),
('STU-0109', 'Prisha Kulkarni', '10', 'B', 'RT-005', 'BUS-005', 'Malleshwaram 8th Cross Stop 1', 'absent', 'Mr. & Mrs. Kulkarni', '+91 99887 70109', '+91 91111 10109', NULL, NULL),
('STU-0110', 'Kabir Kumar', '1', 'C', 'RT-005', 'BUS-005', 'Hebbal Flyover Junction Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70110', '+91 91111 10110', '08:12 AM', NULL),
('STU-0111', 'Saanvi Rao', '2', 'A', 'RT-005', 'BUS-005', 'MG Road Metro Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70111', '+91 91111 10111', '08:12 AM', NULL),
('STU-0112', 'Dev Sen', '3', 'B', 'RT-005', 'BUS-005', 'Bannerghatta Road Apex Stop 4', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70112', '+91 91111 10112', '08:12 AM', NULL),
('STU-0113', 'Avani Dubey', '4', 'C', 'RT-005', 'BUS-005', 'Basavanagudi Temple St Stop 5', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70113', '+91 91111 10113', '08:12 AM', NULL),
('STU-0114', 'Shaurya Nair', '5', 'A', 'RT-005', 'BUS-005', 'Richmond Road Plaza Stop 6', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70114', '+91 91111 10114', '08:12 AM', NULL),
('STU-0115', 'Ira Choudhury', '6', 'B', 'RT-005', 'BUS-005', 'Malleshwaram 8th Cross Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70115', '+91 91111 10115', '08:12 AM', NULL),
('STU-0116', 'Dhruv Prasad', '7', 'C', 'RT-006', 'BUS-006', 'Hebbal Flyover Junction Stop 1', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70116', '+91 91111 10116', '08:12 AM', NULL),
('STU-0117', 'Aisha Singh', '8', 'A', 'RT-006', 'BUS-006', 'MG Road Metro Stop 2', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70117', '+91 91111 10117', '08:12 AM', NULL),
('STU-0118', 'Vihaan Joshi', '9', 'B', 'RT-006', 'BUS-006', 'Bannerghatta Road Apex Stop 3', 'dropped off', 'Mr. & Mrs. Joshi', '+91 99887 70118', '+91 91111 10118', '08:12 AM', '08:35 AM'),
('STU-0119', 'Ananya Roy', '10', 'C', 'RT-006', 'BUS-006', 'Basavanagudi Temple St Stop 4', 'absent', 'Mr. & Mrs. Roy', '+91 99887 70119', '+91 91111 10119', NULL, NULL),
('STU-0120', 'Ishaan Sharma', '1', 'A', 'RT-006', 'BUS-006', 'Richmond Road Plaza Stop 5', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70120', '+91 91111 10120', '08:12 AM', NULL),
('STU-0121', 'Meera Iyer', '2', 'B', 'RT-006', 'BUS-006', 'Frazer Town Mosque Stop 6', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70121', '+91 91111 10121', '08:12 AM', NULL),
('STU-0122', 'Arjun Pillai', '3', 'C', 'RT-006', 'BUS-006', 'Ulsoor Lake Gate Stop 7', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70122', '+91 91111 10122', '08:12 AM', NULL),
('STU-0123', 'Riya Mishra', '4', 'A', 'RT-006', 'BUS-006', 'Hebbal Flyover Junction Stop 1', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70123', '+91 91111 10123', '08:12 AM', NULL),
('STU-0124', 'Reyansh Patel', '5', 'B', 'RT-006', 'BUS-006', 'MG Road Metro Stop 2', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70124', '+91 91111 10124', '08:12 AM', NULL),
('STU-0125', 'Zara Mehta', '6', 'C', 'RT-006', 'BUS-006', 'Bannerghatta Road Apex Stop 3', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70125', '+91 91111 10125', '08:12 AM', NULL),
('STU-0126', 'Kian Deshmukh', '7', 'A', 'RT-006', 'BUS-006', 'Basavanagudi Temple St Stop 4', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70126', '+91 91111 10126', '08:12 AM', NULL),
('STU-0127', 'Myra Verma', '8', 'B', 'RT-006', 'BUS-006', 'Richmond Road Plaza Stop 5', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70127', '+91 91111 10127', '08:12 AM', NULL),
('STU-0128', 'Aarav Reddy', '9', 'C', 'RT-006', 'BUS-006', 'Frazer Town Mosque Stop 6', 'dropped off', 'Mr. & Mrs. Reddy', '+91 99887 70128', '+91 91111 10128', '08:12 AM', '08:35 AM'),
('STU-0129', 'Aditi Bose', '10', 'A', 'RT-006', 'BUS-006', 'Ulsoor Lake Gate Stop 7', 'absent', 'Mr. & Mrs. Bose', '+91 99887 70129', '+91 91111 10129', NULL, NULL),
('STU-0130', 'Krishna Pandey', '1', 'B', 'RT-006', 'BUS-006', 'Hebbal Flyover Junction Stop 1', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70130', '+91 91111 10130', '08:12 AM', NULL),
('STU-0131', 'Diya Gupta', '2', 'C', 'RT-006', 'BUS-006', 'MG Road Metro Stop 2', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70131', '+91 91111 10131', '08:12 AM', NULL),
('STU-0132', 'Rohan Das', '3', 'A', 'RT-006', 'BUS-006', 'Bannerghatta Road Apex Stop 3', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70132', '+91 91111 10132', '08:12 AM', NULL),
('STU-0133', 'Kavya Kulkarni', '4', 'B', 'RT-006', 'BUS-006', 'Basavanagudi Temple St Stop 4', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70133', '+91 91111 10133', '08:12 AM', NULL),
('STU-0134', 'Atharv Kumar', '5', 'C', 'RT-006', 'BUS-006', 'Richmond Road Plaza Stop 5', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70134', '+91 91111 10134', '08:12 AM', NULL),
('STU-0135', 'Anika Rao', '6', 'A', 'RT-006', 'BUS-006', 'Frazer Town Mosque Stop 6', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70135', '+91 91111 10135', '08:12 AM', NULL),
('STU-0136', 'Aaryan Sen', '7', 'B', 'RT-006', 'BUS-006', 'Ulsoor Lake Gate Stop 7', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70136', '+91 91111 10136', '08:12 AM', NULL),
('STU-0137', 'Ridhi Dubey', '8', 'C', 'RT-006', 'BUS-006', 'Hebbal Flyover Junction Stop 1', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70137', '+91 91111 10137', '08:12 AM', NULL),
('STU-0138', 'Siddharth Nair', '9', 'A', 'RT-006', 'BUS-006', 'MG Road Metro Stop 2', 'dropped off', 'Mr. & Mrs. Nair', '+91 99887 70138', '+91 91111 10138', '08:12 AM', '08:35 AM'),
('STU-0139', 'Aanya Choudhury', '10', 'B', 'RT-006', 'BUS-006', 'Bannerghatta Road Apex Stop 3', 'absent', 'Mr. & Mrs. Choudhury', '+91 99887 70139', '+91 91111 10139', NULL, NULL),
('STU-0140', 'Sai Prasad', '1', 'C', 'RT-006', 'BUS-006', 'Basavanagudi Temple St Stop 4', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70140', '+91 91111 10140', '08:12 AM', NULL),
('STU-0141', 'Prisha Singh', '2', 'A', 'RT-006', 'BUS-006', 'Richmond Road Plaza Stop 5', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70141', '+91 91111 10141', '08:12 AM', NULL),
('STU-0142', 'Kabir Joshi', '3', 'B', 'RT-007', 'BUS-007', 'MG Road Metro Stop 1', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70142', '+91 91111 10142', '08:12 AM', NULL),
('STU-0143', 'Saanvi Roy', '4', 'C', 'RT-007', 'BUS-007', 'Bannerghatta Road Apex Stop 2', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70143', '+91 91111 10143', '08:12 AM', NULL),
('STU-0144', 'Dev Sharma', '5', 'A', 'RT-007', 'BUS-007', 'Basavanagudi Temple St Stop 3', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70144', '+91 91111 10144', '08:12 AM', NULL),
('STU-0145', 'Avani Iyer', '6', 'B', 'RT-007', 'BUS-007', 'Richmond Road Plaza Stop 4', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70145', '+91 91111 10145', '08:12 AM', NULL),
('STU-0146', 'Shaurya Pillai', '7', 'C', 'RT-007', 'BUS-007', 'Frazer Town Mosque Stop 5', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70146', '+91 91111 10146', '08:12 AM', NULL),
('STU-0147', 'Ira Mishra', '8', 'A', 'RT-007', 'BUS-007', 'Ulsoor Lake Gate Stop 6', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70147', '+91 91111 10147', '08:12 AM', NULL),
('STU-0148', 'Dhruv Patel', '9', 'B', 'RT-007', 'BUS-007', 'RT Nagar Main Stop Stop 7', 'dropped off', 'Mr. & Mrs. Patel', '+91 99887 70148', '+91 91111 10148', '08:12 AM', '08:35 AM'),
('STU-0149', 'Aisha Mehta', '10', 'C', 'RT-007', 'BUS-007', 'Rajajinagar Bridge Stop 8', 'absent', 'Mr. & Mrs. Mehta', '+91 99887 70149', '+91 91111 10149', NULL, NULL),
('STU-0150', 'Vihaan Deshmukh', '1', 'A', 'RT-007', 'BUS-007', 'MG Road Metro Stop 1', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70150', '+91 91111 10150', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0151', 'Ananya Verma', '2', 'B', 'RT-007', 'BUS-007', 'Bannerghatta Road Apex Stop 2', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70151', '+91 91111 10151', '08:12 AM', NULL),
('STU-0152', 'Ishaan Reddy', '3', 'C', 'RT-007', 'BUS-007', 'Basavanagudi Temple St Stop 3', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70152', '+91 91111 10152', '08:12 AM', NULL),
('STU-0153', 'Meera Bose', '4', 'A', 'RT-007', 'BUS-007', 'Richmond Road Plaza Stop 4', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70153', '+91 91111 10153', '08:12 AM', NULL),
('STU-0154', 'Arjun Pandey', '5', 'B', 'RT-007', 'BUS-007', 'Frazer Town Mosque Stop 5', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70154', '+91 91111 10154', '08:12 AM', NULL),
('STU-0155', 'Riya Gupta', '6', 'C', 'RT-007', 'BUS-007', 'Ulsoor Lake Gate Stop 6', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70155', '+91 91111 10155', '08:12 AM', NULL),
('STU-0156', 'Reyansh Das', '7', 'A', 'RT-007', 'BUS-007', 'RT Nagar Main Stop Stop 7', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70156', '+91 91111 10156', '08:12 AM', NULL),
('STU-0157', 'Zara Kulkarni', '8', 'B', 'RT-007', 'BUS-007', 'Rajajinagar Bridge Stop 8', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70157', '+91 91111 10157', '08:12 AM', NULL),
('STU-0158', 'Kian Kumar', '9', 'C', 'RT-007', 'BUS-007', 'MG Road Metro Stop 1', 'dropped off', 'Mr. & Mrs. Kumar', '+91 99887 70158', '+91 91111 10158', '08:12 AM', '08:35 AM'),
('STU-0159', 'Myra Rao', '10', 'A', 'RT-007', 'BUS-007', 'Bannerghatta Road Apex Stop 2', 'absent', 'Mr. & Mrs. Rao', '+91 99887 70159', '+91 91111 10159', NULL, NULL),
('STU-0160', 'Aarav Sen', '1', 'B', 'RT-007', 'BUS-007', 'Basavanagudi Temple St Stop 3', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70160', '+91 91111 10160', '08:12 AM', NULL),
('STU-0161', 'Aditi Dubey', '2', 'C', 'RT-007', 'BUS-007', 'Richmond Road Plaza Stop 4', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70161', '+91 91111 10161', '08:12 AM', NULL),
('STU-0162', 'Krishna Nair', '3', 'A', 'RT-007', 'BUS-007', 'Frazer Town Mosque Stop 5', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70162', '+91 91111 10162', '08:12 AM', NULL),
('STU-0163', 'Diya Choudhury', '4', 'B', 'RT-007', 'BUS-007', 'Ulsoor Lake Gate Stop 6', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70163', '+91 91111 10163', '08:12 AM', NULL),
('STU-0164', 'Rohan Prasad', '5', 'C', 'RT-007', 'BUS-007', 'RT Nagar Main Stop Stop 7', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70164', '+91 91111 10164', '08:12 AM', NULL),
('STU-0165', 'Kavya Singh', '6', 'A', 'RT-007', 'BUS-007', 'Rajajinagar Bridge Stop 8', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70165', '+91 91111 10165', '08:12 AM', NULL),
('STU-0166', 'Atharv Joshi', '7', 'B', 'RT-007', 'BUS-007', 'MG Road Metro Stop 1', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70166', '+91 91111 10166', '08:12 AM', NULL),
('STU-0167', 'Anika Roy', '8', 'C', 'RT-007', 'BUS-007', 'Bannerghatta Road Apex Stop 2', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70167', '+91 91111 10167', '08:12 AM', NULL),
('STU-0168', 'Aaryan Sharma', '9', 'A', 'RT-007', 'BUS-007', 'Basavanagudi Temple St Stop 3', 'dropped off', 'Mr. & Mrs. Sharma', '+91 99887 70168', '+91 91111 10168', '08:12 AM', '08:35 AM'),
('STU-0169', 'Ridhi Iyer', '10', 'B', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'absent', 'Mr. & Mrs. Iyer', '+91 99887 70169', '+91 91111 10169', NULL, NULL),
('STU-0170', 'Siddharth Pillai', '1', 'C', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70170', '+91 91111 10170', '08:12 AM', NULL),
('STU-0171', 'Aanya Mishra', '2', 'A', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70171', '+91 91111 10171', '08:12 AM', NULL),
('STU-0172', 'Sai Patel', '3', 'B', 'RT-008', 'BUS-008', 'Frazer Town Mosque Stop 4', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70172', '+91 91111 10172', '08:12 AM', NULL),
('STU-0173', 'Prisha Mehta', '4', 'C', 'RT-008', 'BUS-008', 'Ulsoor Lake Gate Stop 5', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70173', '+91 91111 10173', '08:12 AM', NULL),
('STU-0174', 'Kabir Deshmukh', '5', 'A', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70174', '+91 91111 10174', '08:12 AM', NULL),
('STU-0175', 'Saanvi Verma', '6', 'B', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70175', '+91 91111 10175', '08:12 AM', NULL),
('STU-0176', 'Dev Reddy', '7', 'C', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70176', '+91 91111 10176', '08:12 AM', NULL),
('STU-0177', 'Avani Bose', '8', 'A', 'RT-008', 'BUS-008', 'Frazer Town Mosque Stop 4', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70177', '+91 91111 10177', '08:12 AM', NULL),
('STU-0178', 'Shaurya Pandey', '9', 'B', 'RT-008', 'BUS-008', 'Ulsoor Lake Gate Stop 5', 'dropped off', 'Mr. & Mrs. Pandey', '+91 99887 70178', '+91 91111 10178', '08:12 AM', '08:35 AM'),
('STU-0179', 'Ira Gupta', '10', 'C', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'absent', 'Mr. & Mrs. Gupta', '+91 99887 70179', '+91 91111 10179', NULL, NULL),
('STU-0180', 'Dhruv Das', '1', 'A', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70180', '+91 91111 10180', '08:12 AM', NULL),
('STU-0181', 'Aisha Kulkarni', '2', 'B', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70181', '+91 91111 10181', '08:12 AM', NULL),
('STU-0182', 'Vihaan Kumar', '3', 'C', 'RT-008', 'BUS-008', 'Frazer Town Mosque Stop 4', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70182', '+91 91111 10182', '08:12 AM', NULL),
('STU-0183', 'Ananya Rao', '4', 'A', 'RT-008', 'BUS-008', 'Ulsoor Lake Gate Stop 5', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70183', '+91 91111 10183', '08:12 AM', NULL),
('STU-0184', 'Ishaan Sen', '5', 'B', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70184', '+91 91111 10184', '08:12 AM', NULL),
('STU-0185', 'Meera Dubey', '6', 'C', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70185', '+91 91111 10185', '08:12 AM', NULL),
('STU-0186', 'Arjun Nair', '7', 'A', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70186', '+91 91111 10186', '08:12 AM', NULL),
('STU-0187', 'Riya Choudhury', '8', 'B', 'RT-008', 'BUS-008', 'Frazer Town Mosque Stop 4', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70187', '+91 91111 10187', '08:12 AM', NULL),
('STU-0188', 'Reyansh Prasad', '9', 'C', 'RT-008', 'BUS-008', 'Ulsoor Lake Gate Stop 5', 'dropped off', 'Mr. & Mrs. Prasad', '+91 99887 70188', '+91 91111 10188', '08:12 AM', '08:35 AM'),
('STU-0189', 'Zara Singh', '10', 'A', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'absent', 'Mr. & Mrs. Singh', '+91 99887 70189', '+91 91111 10189', NULL, NULL),
('STU-0190', 'Kian Joshi', '1', 'B', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70190', '+91 91111 10190', '08:12 AM', NULL),
('STU-0191', 'Myra Roy', '2', 'C', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70191', '+91 91111 10191', '08:12 AM', NULL),
('STU-0192', 'Aarav Sharma', '3', 'A', 'RT-008', 'BUS-008', 'Frazer Town Mosque Stop 4', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70192', '+91 91111 10192', '08:12 AM', NULL),
('STU-0193', 'Aditi Iyer', '4', 'B', 'RT-008', 'BUS-008', 'Ulsoor Lake Gate Stop 5', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70193', '+91 91111 10193', '08:12 AM', NULL),
('STU-0194', 'Krishna Pillai', '5', 'C', 'RT-008', 'BUS-008', 'Bannerghatta Road Apex Stop 1', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70194', '+91 91111 10194', '08:12 AM', NULL),
('STU-0195', 'Diya Mishra', '6', 'A', 'RT-008', 'BUS-008', 'Basavanagudi Temple St Stop 2', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70195', '+91 91111 10195', '08:12 AM', NULL),
('STU-0196', 'Rohan Patel', '7', 'B', 'RT-008', 'BUS-008', 'Richmond Road Plaza Stop 3', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70196', '+91 91111 10196', '08:12 AM', NULL),
('STU-0197', 'Kavya Mehta', '8', 'C', 'RT-009', 'BUS-009', 'Basavanagudi Temple St Stop 1', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70197', '+91 91111 10197', '08:12 AM', NULL),
('STU-0198', 'Atharv Deshmukh', '9', 'A', 'RT-009', 'BUS-009', 'Richmond Road Plaza Stop 2', 'dropped off', 'Mr. & Mrs. Deshmukh', '+91 99887 70198', '+91 91111 10198', '08:12 AM', '08:35 AM'),
('STU-0199', 'Anika Verma', '10', 'B', 'RT-009', 'BUS-009', 'Frazer Town Mosque Stop 3', 'absent', 'Mr. & Mrs. Verma', '+91 99887 70199', '+91 91111 10199', NULL, NULL),
('STU-0200', 'Aaryan Reddy', '1', 'C', 'RT-009', 'BUS-009', 'Ulsoor Lake Gate Stop 4', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70200', '+91 91111 10200', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0201', 'Ridhi Bose', '2', 'A', 'RT-009', 'BUS-009', 'RT Nagar Main Stop Stop 5', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70201', '+91 91111 10201', '08:12 AM', NULL),
('STU-0202', 'Siddharth Pandey', '3', 'B', 'RT-009', 'BUS-009', 'Rajajinagar Bridge Stop 6', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70202', '+91 91111 10202', '08:12 AM', NULL),
('STU-0203', 'Aanya Gupta', '4', 'C', 'RT-009', 'BUS-009', 'Basavanagudi Temple St Stop 1', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70203', '+91 91111 10203', '08:12 AM', NULL),
('STU-0204', 'Sai Das', '5', 'A', 'RT-009', 'BUS-009', 'Richmond Road Plaza Stop 2', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70204', '+91 91111 10204', '08:12 AM', NULL),
('STU-0205', 'Prisha Kulkarni', '6', 'B', 'RT-009', 'BUS-009', 'Frazer Town Mosque Stop 3', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70205', '+91 91111 10205', '08:12 AM', NULL),
('STU-0206', 'Kabir Kumar', '7', 'C', 'RT-009', 'BUS-009', 'Ulsoor Lake Gate Stop 4', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70206', '+91 91111 10206', '08:12 AM', NULL),
('STU-0207', 'Saanvi Rao', '8', 'A', 'RT-009', 'BUS-009', 'RT Nagar Main Stop Stop 5', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70207', '+91 91111 10207', '08:12 AM', NULL),
('STU-0208', 'Dev Sen', '9', 'B', 'RT-009', 'BUS-009', 'Rajajinagar Bridge Stop 6', 'dropped off', 'Mr. & Mrs. Sen', '+91 99887 70208', '+91 91111 10208', '08:12 AM', '08:35 AM'),
('STU-0209', 'Avani Dubey', '10', 'C', 'RT-009', 'BUS-009', 'Basavanagudi Temple St Stop 1', 'absent', 'Mr. & Mrs. Dubey', '+91 99887 70209', '+91 91111 10209', NULL, NULL),
('STU-0210', 'Shaurya Nair', '1', 'A', 'RT-009', 'BUS-009', 'Richmond Road Plaza Stop 2', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70210', '+91 91111 10210', '08:12 AM', NULL),
('STU-0211', 'Ira Choudhury', '2', 'B', 'RT-009', 'BUS-009', 'Frazer Town Mosque Stop 3', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70211', '+91 91111 10211', '08:12 AM', NULL),
('STU-0212', 'Dhruv Prasad', '3', 'C', 'RT-009', 'BUS-009', 'Ulsoor Lake Gate Stop 4', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70212', '+91 91111 10212', '08:12 AM', NULL),
('STU-0213', 'Aisha Singh', '4', 'A', 'RT-009', 'BUS-009', 'RT Nagar Main Stop Stop 5', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70213', '+91 91111 10213', '08:12 AM', NULL),
('STU-0214', 'Vihaan Joshi', '5', 'B', 'RT-009', 'BUS-009', 'Rajajinagar Bridge Stop 6', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70214', '+91 91111 10214', '08:12 AM', NULL),
('STU-0215', 'Ananya Roy', '6', 'C', 'RT-009', 'BUS-009', 'Basavanagudi Temple St Stop 1', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70215', '+91 91111 10215', '08:12 AM', NULL),
('STU-0216', 'Ishaan Sharma', '7', 'A', 'RT-009', 'BUS-009', 'Richmond Road Plaza Stop 2', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70216', '+91 91111 10216', '08:12 AM', NULL),
('STU-0217', 'Meera Iyer', '8', 'B', 'RT-009', 'BUS-009', 'Frazer Town Mosque Stop 3', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70217', '+91 91111 10217', '08:12 AM', NULL),
('STU-0218', 'Arjun Pillai', '9', 'C', 'RT-009', 'BUS-009', 'Ulsoor Lake Gate Stop 4', 'dropped off', 'Mr. & Mrs. Pillai', '+91 99887 70218', '+91 91111 10218', '08:12 AM', '08:35 AM'),
('STU-0219', 'Riya Mishra', '10', 'A', 'RT-009', 'BUS-009', 'RT Nagar Main Stop Stop 5', 'absent', 'Mr. & Mrs. Mishra', '+91 99887 70219', '+91 91111 10219', NULL, NULL),
('STU-0220', 'Reyansh Patel', '1', 'B', 'RT-009', 'BUS-009', 'Rajajinagar Bridge Stop 6', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70220', '+91 91111 10220', '08:12 AM', NULL),
('STU-0221', 'Zara Mehta', '2', 'C', 'RT-009', 'BUS-009', 'Basavanagudi Temple St Stop 1', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70221', '+91 91111 10221', '08:12 AM', NULL),
('STU-0222', 'Kian Deshmukh', '3', 'A', 'RT-009', 'BUS-009', 'Richmond Road Plaza Stop 2', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70222', '+91 91111 10222', '08:12 AM', NULL),
('STU-0223', 'Myra Verma', '4', 'B', 'RT-009', 'BUS-009', 'Frazer Town Mosque Stop 3', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70223', '+91 91111 10223', '08:12 AM', NULL),
('STU-0224', 'Aarav Reddy', '5', 'C', 'RT-009', 'BUS-009', 'Ulsoor Lake Gate Stop 4', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70224', '+91 91111 10224', '08:12 AM', NULL),
('STU-0225', 'Aditi Bose', '6', 'A', 'RT-009', 'BUS-009', 'RT Nagar Main Stop Stop 5', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70225', '+91 91111 10225', '08:12 AM', NULL),
('STU-0226', 'Krishna Pandey', '7', 'B', 'RT-010', 'BUS-010', 'Richmond Road Plaza Stop 1', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70226', '+91 91111 10226', '08:12 AM', NULL),
('STU-0227', 'Diya Gupta', '8', 'C', 'RT-010', 'BUS-010', 'Frazer Town Mosque Stop 2', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70227', '+91 91111 10227', '08:12 AM', NULL),
('STU-0228', 'Rohan Das', '9', 'A', 'RT-010', 'BUS-010', 'Ulsoor Lake Gate Stop 3', 'dropped off', 'Mr. & Mrs. Das', '+91 99887 70228', '+91 91111 10228', '08:12 AM', '08:35 AM'),
('STU-0229', 'Kavya Kulkarni', '10', 'B', 'RT-010', 'BUS-010', 'RT Nagar Main Stop Stop 4', 'absent', 'Mr. & Mrs. Kulkarni', '+91 99887 70229', '+91 91111 10229', NULL, NULL),
('STU-0230', 'Atharv Kumar', '1', 'C', 'RT-010', 'BUS-010', 'Rajajinagar Bridge Stop 5', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70230', '+91 91111 10230', '08:12 AM', NULL),
('STU-0231', 'Anika Rao', '2', 'A', 'RT-010', 'BUS-010', 'BTM Layout Water Tank Stop 6', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70231', '+91 91111 10231', '08:12 AM', NULL),
('STU-0232', 'Aaryan Sen', '3', 'B', 'RT-010', 'BUS-010', 'Domlur Flyover Stop 7', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70232', '+91 91111 10232', '08:12 AM', NULL),
('STU-0233', 'Ridhi Dubey', '4', 'C', 'RT-010', 'BUS-010', 'Richmond Road Plaza Stop 1', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70233', '+91 91111 10233', '08:12 AM', NULL),
('STU-0234', 'Siddharth Nair', '5', 'A', 'RT-010', 'BUS-010', 'Frazer Town Mosque Stop 2', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70234', '+91 91111 10234', '08:12 AM', NULL),
('STU-0235', 'Aanya Choudhury', '6', 'B', 'RT-010', 'BUS-010', 'Ulsoor Lake Gate Stop 3', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70235', '+91 91111 10235', '08:12 AM', NULL),
('STU-0236', 'Sai Prasad', '7', 'C', 'RT-010', 'BUS-010', 'RT Nagar Main Stop Stop 4', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70236', '+91 91111 10236', '08:12 AM', NULL),
('STU-0237', 'Prisha Singh', '8', 'A', 'RT-010', 'BUS-010', 'Rajajinagar Bridge Stop 5', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70237', '+91 91111 10237', '08:12 AM', NULL),
('STU-0238', 'Kabir Joshi', '9', 'B', 'RT-010', 'BUS-010', 'BTM Layout Water Tank Stop 6', 'dropped off', 'Mr. & Mrs. Joshi', '+91 99887 70238', '+91 91111 10238', '08:12 AM', '08:35 AM'),
('STU-0239', 'Saanvi Roy', '10', 'C', 'RT-010', 'BUS-010', 'Domlur Flyover Stop 7', 'absent', 'Mr. & Mrs. Roy', '+91 99887 70239', '+91 91111 10239', NULL, NULL),
('STU-0240', 'Dev Sharma', '1', 'A', 'RT-010', 'BUS-010', 'Richmond Road Plaza Stop 1', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70240', '+91 91111 10240', '08:12 AM', NULL),
('STU-0241', 'Avani Iyer', '2', 'B', 'RT-010', 'BUS-010', 'Frazer Town Mosque Stop 2', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70241', '+91 91111 10241', '08:12 AM', NULL),
('STU-0242', 'Shaurya Pillai', '3', 'C', 'RT-010', 'BUS-010', 'Ulsoor Lake Gate Stop 3', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70242', '+91 91111 10242', '08:12 AM', NULL),
('STU-0243', 'Ira Mishra', '4', 'A', 'RT-010', 'BUS-010', 'RT Nagar Main Stop Stop 4', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70243', '+91 91111 10243', '08:12 AM', NULL),
('STU-0244', 'Dhruv Patel', '5', 'B', 'RT-010', 'BUS-010', 'Rajajinagar Bridge Stop 5', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70244', '+91 91111 10244', '08:12 AM', NULL),
('STU-0245', 'Aisha Mehta', '6', 'C', 'RT-010', 'BUS-010', 'BTM Layout Water Tank Stop 6', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70245', '+91 91111 10245', '08:12 AM', NULL),
('STU-0246', 'Vihaan Deshmukh', '7', 'A', 'RT-010', 'BUS-010', 'Domlur Flyover Stop 7', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70246', '+91 91111 10246', '08:12 AM', NULL),
('STU-0247', 'Ananya Verma', '8', 'B', 'RT-010', 'BUS-010', 'Richmond Road Plaza Stop 1', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70247', '+91 91111 10247', '08:12 AM', NULL),
('STU-0248', 'Ishaan Reddy', '9', 'C', 'RT-010', 'BUS-010', 'Frazer Town Mosque Stop 2', 'dropped off', 'Mr. & Mrs. Reddy', '+91 99887 70248', '+91 91111 10248', '08:12 AM', '08:35 AM'),
('STU-0249', 'Meera Bose', '10', 'A', 'RT-010', 'BUS-010', 'Ulsoor Lake Gate Stop 3', 'absent', 'Mr. & Mrs. Bose', '+91 99887 70249', '+91 91111 10249', NULL, NULL),
('STU-0250', 'Arjun Pandey', '1', 'B', 'RT-010', 'BUS-010', 'RT Nagar Main Stop Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70250', '+91 91111 10250', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0251', 'Riya Gupta', '2', 'C', 'RT-010', 'BUS-010', 'Rajajinagar Bridge Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70251', '+91 91111 10251', '08:12 AM', NULL),
('STU-0252', 'Reyansh Das', '3', 'A', 'RT-010', 'BUS-010', 'BTM Layout Water Tank Stop 6', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70252', '+91 91111 10252', '08:12 AM', NULL),
('STU-0253', 'Zara Kulkarni', '4', 'B', 'RT-010', 'BUS-010', 'Domlur Flyover Stop 7', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70253', '+91 91111 10253', '08:12 AM', NULL),
('STU-0254', 'Kian Kumar', '5', 'C', 'RT-010', 'BUS-010', 'Richmond Road Plaza Stop 1', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70254', '+91 91111 10254', '08:12 AM', NULL),
('STU-0255', 'Myra Rao', '6', 'A', 'RT-010', 'BUS-010', 'Frazer Town Mosque Stop 2', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70255', '+91 91111 10255', '08:12 AM', NULL),
('STU-0256', 'Aarav Sen', '7', 'B', 'RT-011', 'BUS-011', 'Frazer Town Mosque Stop 1', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70256', '+91 91111 10256', '08:12 AM', NULL),
('STU-0257', 'Aditi Dubey', '8', 'C', 'RT-011', 'BUS-011', 'Ulsoor Lake Gate Stop 2', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70257', '+91 91111 10257', '08:12 AM', NULL),
('STU-0258', 'Krishna Nair', '9', 'A', 'RT-011', 'BUS-011', 'RT Nagar Main Stop Stop 3', 'dropped off', 'Mr. & Mrs. Nair', '+91 99887 70258', '+91 91111 10258', '08:12 AM', '08:35 AM'),
('STU-0259', 'Diya Choudhury', '10', 'B', 'RT-011', 'BUS-011', 'Rajajinagar Bridge Stop 4', 'absent', 'Mr. & Mrs. Choudhury', '+91 99887 70259', '+91 91111 10259', NULL, NULL),
('STU-0260', 'Rohan Prasad', '1', 'C', 'RT-011', 'BUS-011', 'BTM Layout Water Tank Stop 5', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70260', '+91 91111 10260', '08:12 AM', NULL),
('STU-0261', 'Kavya Singh', '2', 'A', 'RT-011', 'BUS-011', 'Domlur Flyover Stop 6', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70261', '+91 91111 10261', '08:12 AM', NULL),
('STU-0262', 'Atharv Joshi', '3', 'B', 'RT-011', 'BUS-011', 'Bellandur Outer Ring Road Stop 7', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70262', '+91 91111 10262', '08:12 AM', NULL),
('STU-0263', 'Anika Roy', '4', 'C', 'RT-011', 'BUS-011', 'Sarjapur Fire Station Stop 8', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70263', '+91 91111 10263', '08:12 AM', NULL),
('STU-0264', 'Aaryan Sharma', '5', 'A', 'RT-011', 'BUS-011', 'Frazer Town Mosque Stop 1', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70264', '+91 91111 10264', '08:12 AM', NULL),
('STU-0265', 'Ridhi Iyer', '6', 'B', 'RT-011', 'BUS-011', 'Ulsoor Lake Gate Stop 2', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70265', '+91 91111 10265', '08:12 AM', NULL),
('STU-0266', 'Siddharth Pillai', '7', 'C', 'RT-011', 'BUS-011', 'RT Nagar Main Stop Stop 3', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70266', '+91 91111 10266', '08:12 AM', NULL),
('STU-0267', 'Aanya Mishra', '8', 'A', 'RT-011', 'BUS-011', 'Rajajinagar Bridge Stop 4', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70267', '+91 91111 10267', '08:12 AM', NULL),
('STU-0268', 'Sai Patel', '9', 'B', 'RT-011', 'BUS-011', 'BTM Layout Water Tank Stop 5', 'dropped off', 'Mr. & Mrs. Patel', '+91 99887 70268', '+91 91111 10268', '08:12 AM', '08:35 AM'),
('STU-0269', 'Prisha Mehta', '10', 'C', 'RT-011', 'BUS-011', 'Domlur Flyover Stop 6', 'absent', 'Mr. & Mrs. Mehta', '+91 99887 70269', '+91 91111 10269', NULL, NULL),
('STU-0270', 'Kabir Deshmukh', '1', 'A', 'RT-011', 'BUS-011', 'Bellandur Outer Ring Road Stop 7', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70270', '+91 91111 10270', '08:12 AM', NULL),
('STU-0271', 'Saanvi Verma', '2', 'B', 'RT-011', 'BUS-011', 'Sarjapur Fire Station Stop 8', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70271', '+91 91111 10271', '08:12 AM', NULL),
('STU-0272', 'Dev Reddy', '3', 'C', 'RT-011', 'BUS-011', 'Frazer Town Mosque Stop 1', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70272', '+91 91111 10272', '08:12 AM', NULL),
('STU-0273', 'Avani Bose', '4', 'A', 'RT-011', 'BUS-011', 'Ulsoor Lake Gate Stop 2', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70273', '+91 91111 10273', '08:12 AM', NULL),
('STU-0274', 'Shaurya Pandey', '5', 'B', 'RT-011', 'BUS-011', 'RT Nagar Main Stop Stop 3', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70274', '+91 91111 10274', '08:12 AM', NULL),
('STU-0275', 'Ira Gupta', '6', 'C', 'RT-011', 'BUS-011', 'Rajajinagar Bridge Stop 4', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70275', '+91 91111 10275', '08:12 AM', NULL),
('STU-0276', 'Dhruv Das', '7', 'A', 'RT-011', 'BUS-011', 'BTM Layout Water Tank Stop 5', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70276', '+91 91111 10276', '08:12 AM', NULL),
('STU-0277', 'Aisha Kulkarni', '8', 'B', 'RT-011', 'BUS-011', 'Domlur Flyover Stop 6', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70277', '+91 91111 10277', '08:12 AM', NULL),
('STU-0278', 'Vihaan Kumar', '9', 'C', 'RT-011', 'BUS-011', 'Bellandur Outer Ring Road Stop 7', 'dropped off', 'Mr. & Mrs. Kumar', '+91 99887 70278', '+91 91111 10278', '08:12 AM', '08:35 AM'),
('STU-0279', 'Ananya Rao', '10', 'A', 'RT-011', 'BUS-011', 'Sarjapur Fire Station Stop 8', 'absent', 'Mr. & Mrs. Rao', '+91 99887 70279', '+91 91111 10279', NULL, NULL),
('STU-0280', 'Ishaan Sen', '1', 'B', 'RT-011', 'BUS-011', 'Frazer Town Mosque Stop 1', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70280', '+91 91111 10280', '08:12 AM', NULL),
('STU-0281', 'Meera Dubey', '2', 'C', 'RT-011', 'BUS-011', 'Ulsoor Lake Gate Stop 2', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70281', '+91 91111 10281', '08:12 AM', NULL),
('STU-0282', 'Arjun Nair', '3', 'A', 'RT-011', 'BUS-011', 'RT Nagar Main Stop Stop 3', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70282', '+91 91111 10282', '08:12 AM', NULL),
('STU-0283', 'Riya Choudhury', '4', 'B', 'RT-011', 'BUS-011', 'Rajajinagar Bridge Stop 4', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70283', '+91 91111 10283', '08:12 AM', NULL),
('STU-0284', 'Reyansh Prasad', '5', 'C', 'RT-011', 'BUS-011', 'BTM Layout Water Tank Stop 5', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70284', '+91 91111 10284', '08:12 AM', NULL),
('STU-0285', 'Zara Singh', '6', 'A', 'RT-011', 'BUS-011', 'Domlur Flyover Stop 6', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70285', '+91 91111 10285', '08:12 AM', NULL),
('STU-0286', 'Kian Joshi', '7', 'B', 'RT-011', 'BUS-011', 'Bellandur Outer Ring Road Stop 7', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70286', '+91 91111 10286', '08:12 AM', NULL),
('STU-0287', 'Myra Roy', '8', 'C', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70287', '+91 91111 10287', '08:12 AM', NULL),
('STU-0288', 'Aarav Sharma', '9', 'A', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'dropped off', 'Mr. & Mrs. Sharma', '+91 99887 70288', '+91 91111 10288', '08:12 AM', '08:35 AM'),
('STU-0289', 'Aditi Iyer', '10', 'B', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'absent', 'Mr. & Mrs. Iyer', '+91 99887 70289', '+91 91111 10289', NULL, NULL),
('STU-0290', 'Krishna Pillai', '1', 'C', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70290', '+91 91111 10290', '08:12 AM', NULL),
('STU-0291', 'Diya Mishra', '2', 'A', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70291', '+91 91111 10291', '08:12 AM', NULL),
('STU-0292', 'Rohan Patel', '3', 'B', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70292', '+91 91111 10292', '08:12 AM', NULL),
('STU-0293', 'Kavya Mehta', '4', 'C', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70293', '+91 91111 10293', '08:12 AM', NULL),
('STU-0294', 'Atharv Deshmukh', '5', 'A', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70294', '+91 91111 10294', '08:12 AM', NULL),
('STU-0295', 'Anika Verma', '6', 'B', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70295', '+91 91111 10295', '08:12 AM', NULL),
('STU-0296', 'Aaryan Reddy', '7', 'C', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70296', '+91 91111 10296', '08:12 AM', NULL),
('STU-0297', 'Ridhi Bose', '8', 'A', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70297', '+91 91111 10297', '08:12 AM', NULL),
('STU-0298', 'Siddharth Pandey', '9', 'B', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'dropped off', 'Mr. & Mrs. Pandey', '+91 99887 70298', '+91 91111 10298', '08:12 AM', '08:35 AM'),
('STU-0299', 'Aanya Gupta', '10', 'C', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'absent', 'Mr. & Mrs. Gupta', '+91 99887 70299', '+91 91111 10299', NULL, NULL),
('STU-0300', 'Sai Das', '1', 'A', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70300', '+91 91111 10300', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0301', 'Prisha Kulkarni', '2', 'B', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70301', '+91 91111 10301', '08:12 AM', NULL),
('STU-0302', 'Kabir Kumar', '3', 'C', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70302', '+91 91111 10302', '08:12 AM', NULL),
('STU-0303', 'Saanvi Rao', '4', 'A', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70303', '+91 91111 10303', '08:12 AM', NULL),
('STU-0304', 'Dev Sen', '5', 'B', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70304', '+91 91111 10304', '08:12 AM', NULL),
('STU-0305', 'Avani Dubey', '6', 'C', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70305', '+91 91111 10305', '08:12 AM', NULL),
('STU-0306', 'Shaurya Nair', '7', 'A', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70306', '+91 91111 10306', '08:12 AM', NULL),
('STU-0307', 'Ira Choudhury', '8', 'B', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70307', '+91 91111 10307', '08:12 AM', NULL),
('STU-0308', 'Dhruv Prasad', '9', 'C', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'dropped off', 'Mr. & Mrs. Prasad', '+91 99887 70308', '+91 91111 10308', '08:12 AM', '08:35 AM'),
('STU-0309', 'Aisha Singh', '10', 'A', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'absent', 'Mr. & Mrs. Singh', '+91 99887 70309', '+91 91111 10309', NULL, NULL),
('STU-0310', 'Vihaan Joshi', '1', 'B', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70310', '+91 91111 10310', '08:12 AM', NULL),
('STU-0311', 'Ananya Roy', '2', 'C', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70311', '+91 91111 10311', '08:12 AM', NULL),
('STU-0312', 'Ishaan Sharma', '3', 'A', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70312', '+91 91111 10312', '08:12 AM', NULL),
('STU-0313', 'Meera Iyer', '4', 'B', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70313', '+91 91111 10313', '08:12 AM', NULL),
('STU-0314', 'Arjun Pillai', '5', 'C', 'RT-012', 'BUS-012', 'Rajajinagar Bridge Stop 3', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70314', '+91 91111 10314', '08:12 AM', NULL),
('STU-0315', 'Riya Mishra', '6', 'A', 'RT-012', 'BUS-012', 'BTM Layout Water Tank Stop 4', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70315', '+91 91111 10315', '08:12 AM', NULL),
('STU-0316', 'Reyansh Patel', '7', 'B', 'RT-012', 'BUS-012', 'Domlur Flyover Stop 5', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70316', '+91 91111 10316', '08:12 AM', NULL),
('STU-0317', 'Zara Mehta', '8', 'C', 'RT-012', 'BUS-012', 'Ulsoor Lake Gate Stop 1', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70317', '+91 91111 10317', '08:12 AM', NULL),
('STU-0318', 'Kian Deshmukh', '9', 'A', 'RT-012', 'BUS-012', 'RT Nagar Main Stop Stop 2', 'dropped off', 'Mr. & Mrs. Deshmukh', '+91 99887 70318', '+91 91111 10318', '08:12 AM', '08:35 AM'),
('STU-0319', 'Myra Verma', '10', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'absent', 'Mr. & Mrs. Verma', '+91 99887 70319', '+91 91111 10319', NULL, NULL),
('STU-0320', 'Aarav Reddy', '1', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70320', '+91 91111 10320', '08:12 AM', NULL),
('STU-0321', 'Aditi Bose', '2', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70321', '+91 91111 10321', '08:12 AM', NULL),
('STU-0322', 'Krishna Pandey', '3', 'B', 'RT-013', 'BUS-013', 'Domlur Flyover Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70322', '+91 91111 10322', '08:12 AM', NULL),
('STU-0323', 'Diya Gupta', '4', 'C', 'RT-013', 'BUS-013', 'Bellandur Outer Ring Road Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70323', '+91 91111 10323', '08:12 AM', NULL),
('STU-0324', 'Rohan Das', '5', 'A', 'RT-013', 'BUS-013', 'Sarjapur Fire Station Stop 6', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70324', '+91 91111 10324', '08:12 AM', NULL),
('STU-0325', 'Kavya Kulkarni', '6', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70325', '+91 91111 10325', '08:12 AM', NULL),
('STU-0326', 'Atharv Kumar', '7', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70326', '+91 91111 10326', '08:12 AM', NULL),
('STU-0327', 'Anika Rao', '8', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70327', '+91 91111 10327', '08:12 AM', NULL),
('STU-0328', 'Aaryan Sen', '9', 'B', 'RT-013', 'BUS-013', 'Domlur Flyover Stop 4', 'dropped off', 'Mr. & Mrs. Sen', '+91 99887 70328', '+91 91111 10328', '08:12 AM', '08:35 AM'),
('STU-0329', 'Ridhi Dubey', '10', 'C', 'RT-013', 'BUS-013', 'Bellandur Outer Ring Road Stop 5', 'absent', 'Mr. & Mrs. Dubey', '+91 99887 70329', '+91 91111 10329', NULL, NULL),
('STU-0330', 'Siddharth Nair', '1', 'A', 'RT-013', 'BUS-013', 'Sarjapur Fire Station Stop 6', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70330', '+91 91111 10330', '08:12 AM', NULL),
('STU-0331', 'Aanya Choudhury', '2', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70331', '+91 91111 10331', '08:12 AM', NULL),
('STU-0332', 'Sai Prasad', '3', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70332', '+91 91111 10332', '08:12 AM', NULL),
('STU-0333', 'Prisha Singh', '4', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70333', '+91 91111 10333', '08:12 AM', NULL),
('STU-0334', 'Kabir Joshi', '5', 'B', 'RT-013', 'BUS-013', 'Domlur Flyover Stop 4', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70334', '+91 91111 10334', '08:12 AM', NULL),
('STU-0335', 'Saanvi Roy', '6', 'C', 'RT-013', 'BUS-013', 'Bellandur Outer Ring Road Stop 5', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70335', '+91 91111 10335', '08:12 AM', NULL),
('STU-0336', 'Dev Sharma', '7', 'A', 'RT-013', 'BUS-013', 'Sarjapur Fire Station Stop 6', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70336', '+91 91111 10336', '08:12 AM', NULL),
('STU-0337', 'Avani Iyer', '8', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70337', '+91 91111 10337', '08:12 AM', NULL),
('STU-0338', 'Shaurya Pillai', '9', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'dropped off', 'Mr. & Mrs. Pillai', '+91 99887 70338', '+91 91111 10338', '08:12 AM', '08:35 AM'),
('STU-0339', 'Ira Mishra', '10', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'absent', 'Mr. & Mrs. Mishra', '+91 99887 70339', '+91 91111 10339', NULL, NULL),
('STU-0340', 'Dhruv Patel', '1', 'B', 'RT-013', 'BUS-013', 'Domlur Flyover Stop 4', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70340', '+91 91111 10340', '08:12 AM', NULL),
('STU-0341', 'Aisha Mehta', '2', 'C', 'RT-013', 'BUS-013', 'Bellandur Outer Ring Road Stop 5', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70341', '+91 91111 10341', '08:12 AM', NULL),
('STU-0342', 'Vihaan Deshmukh', '3', 'A', 'RT-013', 'BUS-013', 'Sarjapur Fire Station Stop 6', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70342', '+91 91111 10342', '08:12 AM', NULL),
('STU-0343', 'Ananya Verma', '4', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70343', '+91 91111 10343', '08:12 AM', NULL),
('STU-0344', 'Ishaan Reddy', '5', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70344', '+91 91111 10344', '08:12 AM', NULL),
('STU-0345', 'Meera Bose', '6', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70345', '+91 91111 10345', '08:12 AM', NULL),
('STU-0346', 'Arjun Pandey', '7', 'B', 'RT-013', 'BUS-013', 'Domlur Flyover Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70346', '+91 91111 10346', '08:12 AM', NULL),
('STU-0347', 'Riya Gupta', '8', 'C', 'RT-013', 'BUS-013', 'Bellandur Outer Ring Road Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70347', '+91 91111 10347', '08:12 AM', NULL),
('STU-0348', 'Reyansh Das', '9', 'A', 'RT-013', 'BUS-013', 'Sarjapur Fire Station Stop 6', 'dropped off', 'Mr. & Mrs. Das', '+91 99887 70348', '+91 91111 10348', '08:12 AM', '08:35 AM'),
('STU-0349', 'Zara Kulkarni', '10', 'B', 'RT-013', 'BUS-013', 'RT Nagar Main Stop Stop 1', 'absent', 'Mr. & Mrs. Kulkarni', '+91 99887 70349', '+91 91111 10349', NULL, NULL),
('STU-0350', 'Kian Kumar', '1', 'C', 'RT-013', 'BUS-013', 'Rajajinagar Bridge Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70350', '+91 91111 10350', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0351', 'Myra Rao', '2', 'A', 'RT-013', 'BUS-013', 'BTM Layout Water Tank Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70351', '+91 91111 10351', '08:12 AM', NULL),
('STU-0352', 'Aarav Sen', '3', 'B', 'RT-014', 'BUS-014', 'Rajajinagar Bridge Stop 1', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70352', '+91 91111 10352', '08:12 AM', NULL),
('STU-0353', 'Aditi Dubey', '4', 'C', 'RT-014', 'BUS-014', 'BTM Layout Water Tank Stop 2', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70353', '+91 91111 10353', '08:12 AM', NULL),
('STU-0354', 'Krishna Nair', '5', 'A', 'RT-014', 'BUS-014', 'Domlur Flyover Stop 3', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70354', '+91 91111 10354', '08:12 AM', NULL),
('STU-0355', 'Diya Choudhury', '6', 'B', 'RT-014', 'BUS-014', 'Bellandur Outer Ring Road Stop 4', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70355', '+91 91111 10355', '08:12 AM', NULL),
('STU-0356', 'Rohan Prasad', '7', 'C', 'RT-014', 'BUS-014', 'Sarjapur Fire Station Stop 5', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70356', '+91 91111 10356', '08:12 AM', NULL),
('STU-0357', 'Kavya Singh', '8', 'A', 'RT-014', 'BUS-014', 'Vasanth Nagar Park Stop 6', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70357', '+91 91111 10357', '08:12 AM', NULL),
('STU-0358', 'Atharv Joshi', '9', 'B', 'RT-014', 'BUS-014', 'Indiranagar Circle Stop 7', 'dropped off', 'Mr. & Mrs. Joshi', '+91 99887 70358', '+91 91111 10358', '08:12 AM', '08:35 AM'),
('STU-0359', 'Anika Roy', '10', 'C', 'RT-014', 'BUS-014', 'Rajajinagar Bridge Stop 1', 'absent', 'Mr. & Mrs. Roy', '+91 99887 70359', '+91 91111 10359', NULL, NULL),
('STU-0360', 'Aaryan Sharma', '1', 'A', 'RT-014', 'BUS-014', 'BTM Layout Water Tank Stop 2', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70360', '+91 91111 10360', '08:12 AM', NULL),
('STU-0361', 'Ridhi Iyer', '2', 'B', 'RT-014', 'BUS-014', 'Domlur Flyover Stop 3', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70361', '+91 91111 10361', '08:12 AM', NULL),
('STU-0362', 'Siddharth Pillai', '3', 'C', 'RT-014', 'BUS-014', 'Bellandur Outer Ring Road Stop 4', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70362', '+91 91111 10362', '08:12 AM', NULL),
('STU-0363', 'Aanya Mishra', '4', 'A', 'RT-014', 'BUS-014', 'Sarjapur Fire Station Stop 5', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70363', '+91 91111 10363', '08:12 AM', NULL),
('STU-0364', 'Sai Patel', '5', 'B', 'RT-014', 'BUS-014', 'Vasanth Nagar Park Stop 6', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70364', '+91 91111 10364', '08:12 AM', NULL),
('STU-0365', 'Prisha Mehta', '6', 'C', 'RT-014', 'BUS-014', 'Indiranagar Circle Stop 7', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70365', '+91 91111 10365', '08:12 AM', NULL),
('STU-0366', 'Kabir Deshmukh', '7', 'A', 'RT-014', 'BUS-014', 'Rajajinagar Bridge Stop 1', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70366', '+91 91111 10366', '08:12 AM', NULL),
('STU-0367', 'Saanvi Verma', '8', 'B', 'RT-014', 'BUS-014', 'BTM Layout Water Tank Stop 2', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70367', '+91 91111 10367', '08:12 AM', NULL),
('STU-0368', 'Dev Reddy', '9', 'C', 'RT-014', 'BUS-014', 'Domlur Flyover Stop 3', 'dropped off', 'Mr. & Mrs. Reddy', '+91 99887 70368', '+91 91111 10368', '08:12 AM', '08:35 AM'),
('STU-0369', 'Avani Bose', '10', 'A', 'RT-014', 'BUS-014', 'Bellandur Outer Ring Road Stop 4', 'absent', 'Mr. & Mrs. Bose', '+91 99887 70369', '+91 91111 10369', NULL, NULL),
('STU-0370', 'Shaurya Pandey', '1', 'B', 'RT-014', 'BUS-014', 'Sarjapur Fire Station Stop 5', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70370', '+91 91111 10370', '08:12 AM', NULL),
('STU-0371', 'Ira Gupta', '2', 'C', 'RT-014', 'BUS-014', 'Vasanth Nagar Park Stop 6', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70371', '+91 91111 10371', '08:12 AM', NULL),
('STU-0372', 'Dhruv Das', '3', 'A', 'RT-014', 'BUS-014', 'Indiranagar Circle Stop 7', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70372', '+91 91111 10372', '08:12 AM', NULL),
('STU-0373', 'Aisha Kulkarni', '4', 'B', 'RT-014', 'BUS-014', 'Rajajinagar Bridge Stop 1', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70373', '+91 91111 10373', '08:12 AM', NULL),
('STU-0374', 'Vihaan Kumar', '5', 'C', 'RT-014', 'BUS-014', 'BTM Layout Water Tank Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70374', '+91 91111 10374', '08:12 AM', NULL),
('STU-0375', 'Ananya Rao', '6', 'A', 'RT-014', 'BUS-014', 'Domlur Flyover Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70375', '+91 91111 10375', '08:12 AM', NULL),
('STU-0376', 'Ishaan Sen', '7', 'B', 'RT-014', 'BUS-014', 'Bellandur Outer Ring Road Stop 4', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70376', '+91 91111 10376', '08:12 AM', NULL),
('STU-0377', 'Meera Dubey', '8', 'C', 'RT-014', 'BUS-014', 'Sarjapur Fire Station Stop 5', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70377', '+91 91111 10377', '08:12 AM', NULL),
('STU-0378', 'Arjun Nair', '9', 'A', 'RT-014', 'BUS-014', 'Vasanth Nagar Park Stop 6', 'dropped off', 'Mr. & Mrs. Nair', '+91 99887 70378', '+91 91111 10378', '08:12 AM', '08:35 AM'),
('STU-0379', 'Riya Choudhury', '10', 'B', 'RT-014', 'BUS-014', 'Indiranagar Circle Stop 7', 'absent', 'Mr. & Mrs. Choudhury', '+91 99887 70379', '+91 91111 10379', NULL, NULL),
('STU-0380', 'Reyansh Prasad', '1', 'C', 'RT-014', 'BUS-014', 'Rajajinagar Bridge Stop 1', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70380', '+91 91111 10380', '08:12 AM', NULL),
('STU-0381', 'Zara Singh', '2', 'A', 'RT-014', 'BUS-014', 'BTM Layout Water Tank Stop 2', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70381', '+91 91111 10381', '08:12 AM', NULL),
('STU-0382', 'Kian Joshi', '3', 'B', 'RT-014', 'BUS-014', 'Domlur Flyover Stop 3', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70382', '+91 91111 10382', '08:12 AM', NULL),
('STU-0383', 'Myra Roy', '4', 'C', 'RT-014', 'BUS-014', 'Bellandur Outer Ring Road Stop 4', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70383', '+91 91111 10383', '08:12 AM', NULL),
('STU-0384', 'Aarav Sharma', '5', 'A', 'RT-014', 'BUS-014', 'Sarjapur Fire Station Stop 5', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70384', '+91 91111 10384', '08:12 AM', NULL),
('STU-0385', 'Aditi Iyer', '6', 'B', 'RT-014', 'BUS-014', 'Vasanth Nagar Park Stop 6', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70385', '+91 91111 10385', '08:12 AM', NULL),
('STU-0386', 'Krishna Pillai', '7', 'C', 'RT-015', 'BUS-015', 'BTM Layout Water Tank Stop 1', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70386', '+91 91111 10386', '08:12 AM', NULL),
('STU-0387', 'Diya Mishra', '8', 'A', 'RT-015', 'BUS-015', 'Domlur Flyover Stop 2', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70387', '+91 91111 10387', '08:12 AM', NULL),
('STU-0388', 'Rohan Patel', '9', 'B', 'RT-015', 'BUS-015', 'Bellandur Outer Ring Road Stop 3', 'dropped off', 'Mr. & Mrs. Patel', '+91 99887 70388', '+91 91111 10388', '08:12 AM', '08:35 AM'),
('STU-0389', 'Kavya Mehta', '10', 'C', 'RT-015', 'BUS-015', 'Sarjapur Fire Station Stop 4', 'absent', 'Mr. & Mrs. Mehta', '+91 99887 70389', '+91 91111 10389', NULL, NULL),
('STU-0390', 'Atharv Deshmukh', '1', 'A', 'RT-015', 'BUS-015', 'Vasanth Nagar Park Stop 5', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70390', '+91 91111 10390', '08:12 AM', NULL),
('STU-0391', 'Anika Verma', '2', 'B', 'RT-015', 'BUS-015', 'Indiranagar Circle Stop 6', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70391', '+91 91111 10391', '08:12 AM', NULL),
('STU-0392', 'Aaryan Reddy', '3', 'C', 'RT-015', 'BUS-015', 'Koramangala 5th Block Stop 7', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70392', '+91 91111 10392', '08:12 AM', NULL),
('STU-0393', 'Ridhi Bose', '4', 'A', 'RT-015', 'BUS-015', 'HSR Layout BDA Complex Stop 8', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70393', '+91 91111 10393', '08:12 AM', NULL),
('STU-0394', 'Siddharth Pandey', '5', 'B', 'RT-015', 'BUS-015', 'BTM Layout Water Tank Stop 1', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70394', '+91 91111 10394', '08:12 AM', NULL),
('STU-0395', 'Aanya Gupta', '6', 'C', 'RT-015', 'BUS-015', 'Domlur Flyover Stop 2', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70395', '+91 91111 10395', '08:12 AM', NULL),
('STU-0396', 'Sai Das', '7', 'A', 'RT-015', 'BUS-015', 'Bellandur Outer Ring Road Stop 3', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70396', '+91 91111 10396', '08:12 AM', NULL),
('STU-0397', 'Prisha Kulkarni', '8', 'B', 'RT-015', 'BUS-015', 'Sarjapur Fire Station Stop 4', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70397', '+91 91111 10397', '08:12 AM', NULL),
('STU-0398', 'Kabir Kumar', '9', 'C', 'RT-015', 'BUS-015', 'Vasanth Nagar Park Stop 5', 'dropped off', 'Mr. & Mrs. Kumar', '+91 99887 70398', '+91 91111 10398', '08:12 AM', '08:35 AM'),
('STU-0399', 'Saanvi Rao', '10', 'A', 'RT-015', 'BUS-015', 'Indiranagar Circle Stop 6', 'absent', 'Mr. & Mrs. Rao', '+91 99887 70399', '+91 91111 10399', NULL, NULL),
('STU-0400', 'Dev Sen', '1', 'B', 'RT-015', 'BUS-015', 'Koramangala 5th Block Stop 7', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70400', '+91 91111 10400', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0401', 'Avani Dubey', '2', 'C', 'RT-015', 'BUS-015', 'HSR Layout BDA Complex Stop 8', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70401', '+91 91111 10401', '08:12 AM', NULL),
('STU-0402', 'Shaurya Nair', '3', 'A', 'RT-015', 'BUS-015', 'BTM Layout Water Tank Stop 1', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70402', '+91 91111 10402', '08:12 AM', NULL),
('STU-0403', 'Ira Choudhury', '4', 'B', 'RT-015', 'BUS-015', 'Domlur Flyover Stop 2', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70403', '+91 91111 10403', '08:12 AM', NULL),
('STU-0404', 'Dhruv Prasad', '5', 'C', 'RT-015', 'BUS-015', 'Bellandur Outer Ring Road Stop 3', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70404', '+91 91111 10404', '08:12 AM', NULL),
('STU-0405', 'Aisha Singh', '6', 'A', 'RT-015', 'BUS-015', 'Sarjapur Fire Station Stop 4', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70405', '+91 91111 10405', '08:12 AM', NULL),
('STU-0406', 'Vihaan Joshi', '7', 'B', 'RT-016', 'BUS-016', 'Domlur Flyover Stop 1', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70406', '+91 91111 10406', '08:12 AM', NULL),
('STU-0407', 'Ananya Roy', '8', 'C', 'RT-016', 'BUS-016', 'Bellandur Outer Ring Road Stop 2', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70407', '+91 91111 10407', '08:12 AM', NULL),
('STU-0408', 'Ishaan Sharma', '9', 'A', 'RT-016', 'BUS-016', 'Sarjapur Fire Station Stop 3', 'dropped off', 'Mr. & Mrs. Sharma', '+91 99887 70408', '+91 91111 10408', '08:12 AM', '08:35 AM'),
('STU-0409', 'Meera Iyer', '10', 'B', 'RT-016', 'BUS-016', 'Vasanth Nagar Park Stop 4', 'absent', 'Mr. & Mrs. Iyer', '+91 99887 70409', '+91 91111 10409', NULL, NULL),
('STU-0410', 'Arjun Pillai', '1', 'C', 'RT-016', 'BUS-016', 'Indiranagar Circle Stop 5', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70410', '+91 91111 10410', '08:12 AM', NULL),
('STU-0411', 'Riya Mishra', '2', 'A', 'RT-016', 'BUS-016', 'Domlur Flyover Stop 1', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70411', '+91 91111 10411', '08:12 AM', NULL),
('STU-0412', 'Reyansh Patel', '3', 'B', 'RT-016', 'BUS-016', 'Bellandur Outer Ring Road Stop 2', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70412', '+91 91111 10412', '08:12 AM', NULL),
('STU-0413', 'Zara Mehta', '4', 'C', 'RT-016', 'BUS-016', 'Sarjapur Fire Station Stop 3', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70413', '+91 91111 10413', '08:12 AM', NULL),
('STU-0414', 'Kian Deshmukh', '5', 'A', 'RT-016', 'BUS-016', 'Vasanth Nagar Park Stop 4', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70414', '+91 91111 10414', '08:12 AM', NULL),
('STU-0415', 'Myra Verma', '6', 'B', 'RT-016', 'BUS-016', 'Indiranagar Circle Stop 5', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70415', '+91 91111 10415', '08:12 AM', NULL),
('STU-0416', 'Aarav Reddy', '7', 'C', 'RT-016', 'BUS-016', 'Domlur Flyover Stop 1', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70416', '+91 91111 10416', '08:12 AM', NULL),
('STU-0417', 'Aditi Bose', '8', 'A', 'RT-016', 'BUS-016', 'Bellandur Outer Ring Road Stop 2', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70417', '+91 91111 10417', '08:12 AM', NULL),
('STU-0418', 'Krishna Pandey', '9', 'B', 'RT-016', 'BUS-016', 'Sarjapur Fire Station Stop 3', 'dropped off', 'Mr. & Mrs. Pandey', '+91 99887 70418', '+91 91111 10418', '08:12 AM', '08:35 AM'),
('STU-0419', 'Diya Gupta', '10', 'C', 'RT-016', 'BUS-016', 'Vasanth Nagar Park Stop 4', 'absent', 'Mr. & Mrs. Gupta', '+91 99887 70419', '+91 91111 10419', NULL, NULL),
('STU-0420', 'Rohan Das', '1', 'A', 'RT-016', 'BUS-016', 'Indiranagar Circle Stop 5', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70420', '+91 91111 10420', '08:12 AM', NULL),
('STU-0421', 'Kavya Kulkarni', '2', 'B', 'RT-016', 'BUS-016', 'Domlur Flyover Stop 1', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70421', '+91 91111 10421', '08:12 AM', NULL),
('STU-0422', 'Atharv Kumar', '3', 'C', 'RT-016', 'BUS-016', 'Bellandur Outer Ring Road Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70422', '+91 91111 10422', '08:12 AM', NULL),
('STU-0423', 'Anika Rao', '4', 'A', 'RT-016', 'BUS-016', 'Sarjapur Fire Station Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70423', '+91 91111 10423', '08:12 AM', NULL),
('STU-0424', 'Aaryan Sen', '5', 'B', 'RT-016', 'BUS-016', 'Vasanth Nagar Park Stop 4', 'boarded', 'Mr. & Mrs. Sen', '+91 99887 70424', '+91 91111 10424', '08:12 AM', NULL),
('STU-0425', 'Ridhi Dubey', '6', 'C', 'RT-016', 'BUS-016', 'Indiranagar Circle Stop 5', 'boarded', 'Mr. & Mrs. Dubey', '+91 99887 70425', '+91 91111 10425', '08:12 AM', NULL),
('STU-0426', 'Siddharth Nair', '7', 'A', 'RT-016', 'BUS-016', 'Domlur Flyover Stop 1', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70426', '+91 91111 10426', '08:12 AM', NULL),
('STU-0427', 'Aanya Choudhury', '8', 'B', 'RT-017', 'BUS-017', 'Bellandur Outer Ring Road Stop 1', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70427', '+91 91111 10427', '08:12 AM', NULL),
('STU-0428', 'Sai Prasad', '9', 'C', 'RT-017', 'BUS-017', 'Sarjapur Fire Station Stop 2', 'dropped off', 'Mr. & Mrs. Prasad', '+91 99887 70428', '+91 91111 10428', '08:12 AM', '08:35 AM'),
('STU-0429', 'Prisha Singh', '10', 'A', 'RT-017', 'BUS-017', 'Vasanth Nagar Park Stop 3', 'absent', 'Mr. & Mrs. Singh', '+91 99887 70429', '+91 91111 10429', NULL, NULL),
('STU-0430', 'Kabir Joshi', '1', 'B', 'RT-017', 'BUS-017', 'Indiranagar Circle Stop 4', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70430', '+91 91111 10430', '08:12 AM', NULL),
('STU-0431', 'Saanvi Roy', '2', 'C', 'RT-017', 'BUS-017', 'Koramangala 5th Block Stop 5', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70431', '+91 91111 10431', '08:12 AM', NULL),
('STU-0432', 'Dev Sharma', '3', 'A', 'RT-017', 'BUS-017', 'HSR Layout BDA Complex Stop 6', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70432', '+91 91111 10432', '08:12 AM', NULL),
('STU-0433', 'Avani Iyer', '4', 'B', 'RT-017', 'BUS-017', 'Bellandur Outer Ring Road Stop 1', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70433', '+91 91111 10433', '08:12 AM', NULL),
('STU-0434', 'Shaurya Pillai', '5', 'C', 'RT-017', 'BUS-017', 'Sarjapur Fire Station Stop 2', 'boarded', 'Mr. & Mrs. Pillai', '+91 99887 70434', '+91 91111 10434', '08:12 AM', NULL),
('STU-0435', 'Ira Mishra', '6', 'A', 'RT-017', 'BUS-017', 'Vasanth Nagar Park Stop 3', 'boarded', 'Mr. & Mrs. Mishra', '+91 99887 70435', '+91 91111 10435', '08:12 AM', NULL),
('STU-0436', 'Dhruv Patel', '7', 'B', 'RT-017', 'BUS-017', 'Indiranagar Circle Stop 4', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70436', '+91 91111 10436', '08:12 AM', NULL),
('STU-0437', 'Aisha Mehta', '8', 'C', 'RT-017', 'BUS-017', 'Koramangala 5th Block Stop 5', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70437', '+91 91111 10437', '08:12 AM', NULL),
('STU-0438', 'Vihaan Deshmukh', '9', 'A', 'RT-017', 'BUS-017', 'HSR Layout BDA Complex Stop 6', 'dropped off', 'Mr. & Mrs. Deshmukh', '+91 99887 70438', '+91 91111 10438', '08:12 AM', '08:35 AM'),
('STU-0439', 'Ananya Verma', '10', 'B', 'RT-017', 'BUS-017', 'Bellandur Outer Ring Road Stop 1', 'absent', 'Mr. & Mrs. Verma', '+91 99887 70439', '+91 91111 10439', NULL, NULL),
('STU-0440', 'Ishaan Reddy', '1', 'C', 'RT-017', 'BUS-017', 'Sarjapur Fire Station Stop 2', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70440', '+91 91111 10440', '08:12 AM', NULL),
('STU-0441', 'Meera Bose', '2', 'A', 'RT-017', 'BUS-017', 'Vasanth Nagar Park Stop 3', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70441', '+91 91111 10441', '08:12 AM', NULL),
('STU-0442', 'Arjun Pandey', '3', 'B', 'RT-017', 'BUS-017', 'Indiranagar Circle Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70442', '+91 91111 10442', '08:12 AM', NULL),
('STU-0443', 'Riya Gupta', '4', 'C', 'RT-017', 'BUS-017', 'Koramangala 5th Block Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70443', '+91 91111 10443', '08:12 AM', NULL),
('STU-0444', 'Reyansh Das', '5', 'A', 'RT-017', 'BUS-017', 'HSR Layout BDA Complex Stop 6', 'boarded', 'Mr. & Mrs. Das', '+91 99887 70444', '+91 91111 10444', '08:12 AM', NULL),
('STU-0445', 'Zara Kulkarni', '6', 'B', 'RT-017', 'BUS-017', 'Bellandur Outer Ring Road Stop 1', 'boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70445', '+91 91111 10445', '08:12 AM', NULL),
('STU-0446', 'Kian Kumar', '7', 'C', 'RT-017', 'BUS-017', 'Sarjapur Fire Station Stop 2', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70446', '+91 91111 10446', '08:12 AM', NULL),
('STU-0447', 'Myra Rao', '8', 'A', 'RT-017', 'BUS-017', 'Vasanth Nagar Park Stop 3', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70447', '+91 91111 10447', '08:12 AM', NULL),
('STU-0448', 'Aarav Sen', '9', 'B', 'RT-017', 'BUS-017', 'Indiranagar Circle Stop 4', 'dropped off', 'Mr. & Mrs. Sen', '+91 99887 70448', '+91 91111 10448', '08:12 AM', '08:35 AM'),
('STU-0449', 'Aditi Dubey', '10', 'C', 'RT-018', 'BUS-018', 'Sarjapur Fire Station Stop 1', 'absent', 'Mr. & Mrs. Dubey', '+91 99887 70449', '+91 91111 10449', NULL, NULL),
('STU-0450', 'Krishna Nair', '1', 'A', 'RT-018', 'BUS-018', 'Vasanth Nagar Park Stop 2', 'boarded', 'Mr. & Mrs. Nair', '+91 99887 70450', '+91 91111 10450', '08:12 AM', NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0451', 'Diya Choudhury', '2', 'B', 'RT-018', 'BUS-018', 'Indiranagar Circle Stop 3', 'boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70451', '+91 91111 10451', '08:12 AM', NULL),
('STU-0452', 'Rohan Prasad', '3', 'C', 'RT-018', 'BUS-018', 'Koramangala 5th Block Stop 4', 'boarded', 'Mr. & Mrs. Prasad', '+91 99887 70452', '+91 91111 10452', '08:12 AM', NULL),
('STU-0453', 'Kavya Singh', '4', 'A', 'RT-018', 'BUS-018', 'HSR Layout BDA Complex Stop 5', 'boarded', 'Mr. & Mrs. Singh', '+91 99887 70453', '+91 91111 10453', '08:12 AM', NULL),
('STU-0454', 'Atharv Joshi', '5', 'B', 'RT-018', 'BUS-018', 'Whitefield Metro Stn Stop 6', 'boarded', 'Mr. & Mrs. Joshi', '+91 99887 70454', '+91 91111 10454', '08:12 AM', NULL),
('STU-0455', 'Anika Roy', '6', 'C', 'RT-018', 'BUS-018', 'Jayanagar 4th Block Stop 7', 'boarded', 'Mr. & Mrs. Roy', '+91 99887 70455', '+91 91111 10455', '08:12 AM', NULL),
('STU-0456', 'Aaryan Sharma', '7', 'A', 'RT-018', 'BUS-018', 'Sarjapur Fire Station Stop 1', 'boarded', 'Mr. & Mrs. Sharma', '+91 99887 70456', '+91 91111 10456', '08:12 AM', NULL),
('STU-0457', 'Ridhi Iyer', '8', 'B', 'RT-018', 'BUS-018', 'Vasanth Nagar Park Stop 2', 'boarded', 'Mr. & Mrs. Iyer', '+91 99887 70457', '+91 91111 10457', '08:12 AM', NULL),
('STU-0458', 'Siddharth Pillai', '9', 'C', 'RT-018', 'BUS-018', 'Indiranagar Circle Stop 3', 'dropped off', 'Mr. & Mrs. Pillai', '+91 99887 70458', '+91 91111 10458', '08:12 AM', '08:35 AM'),
('STU-0459', 'Aanya Mishra', '10', 'A', 'RT-018', 'BUS-018', 'Koramangala 5th Block Stop 4', 'absent', 'Mr. & Mrs. Mishra', '+91 99887 70459', '+91 91111 10459', NULL, NULL),
('STU-0460', 'Sai Patel', '1', 'B', 'RT-018', 'BUS-018', 'HSR Layout BDA Complex Stop 5', 'boarded', 'Mr. & Mrs. Patel', '+91 99887 70460', '+91 91111 10460', '08:12 AM', NULL),
('STU-0461', 'Prisha Mehta', '2', 'C', 'RT-018', 'BUS-018', 'Whitefield Metro Stn Stop 6', 'boarded', 'Mr. & Mrs. Mehta', '+91 99887 70461', '+91 91111 10461', '08:12 AM', NULL),
('STU-0462', 'Kabir Deshmukh', '3', 'A', 'RT-018', 'BUS-018', 'Jayanagar 4th Block Stop 7', 'boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70462', '+91 91111 10462', '08:12 AM', NULL),
('STU-0463', 'Saanvi Verma', '4', 'B', 'RT-018', 'BUS-018', 'Sarjapur Fire Station Stop 1', 'boarded', 'Mr. & Mrs. Verma', '+91 99887 70463', '+91 91111 10463', '08:12 AM', NULL),
('STU-0464', 'Dev Reddy', '5', 'C', 'RT-018', 'BUS-018', 'Vasanth Nagar Park Stop 2', 'boarded', 'Mr. & Mrs. Reddy', '+91 99887 70464', '+91 91111 10464', '08:12 AM', NULL),
('STU-0465', 'Avani Bose', '6', 'A', 'RT-018', 'BUS-018', 'Indiranagar Circle Stop 3', 'boarded', 'Mr. & Mrs. Bose', '+91 99887 70465', '+91 91111 10465', '08:12 AM', NULL),
('STU-0466', 'Shaurya Pandey', '7', 'B', 'RT-018', 'BUS-018', 'Koramangala 5th Block Stop 4', 'boarded', 'Mr. & Mrs. Pandey', '+91 99887 70466', '+91 91111 10466', '08:12 AM', NULL),
('STU-0467', 'Ira Gupta', '8', 'C', 'RT-018', 'BUS-018', 'HSR Layout BDA Complex Stop 5', 'boarded', 'Mr. & Mrs. Gupta', '+91 99887 70467', '+91 91111 10467', '08:12 AM', NULL),
('STU-0468', 'Dhruv Das', '9', 'A', 'RT-018', 'BUS-018', 'Whitefield Metro Stn Stop 6', 'dropped off', 'Mr. & Mrs. Das', '+91 99887 70468', '+91 91111 10468', '08:12 AM', '08:35 AM'),
('STU-0469', 'Aisha Kulkarni', '10', 'B', 'RT-018', 'BUS-018', 'Jayanagar 4th Block Stop 7', 'absent', 'Mr. & Mrs. Kulkarni', '+91 99887 70469', '+91 91111 10469', NULL, NULL),
('STU-0470', 'Vihaan Kumar', '1', 'C', 'RT-018', 'BUS-018', 'Sarjapur Fire Station Stop 1', 'boarded', 'Mr. & Mrs. Kumar', '+91 99887 70470', '+91 91111 10470', '08:12 AM', NULL),
('STU-0471', 'Ananya Rao', '2', 'A', 'RT-018', 'BUS-018', 'Vasanth Nagar Park Stop 2', 'boarded', 'Mr. & Mrs. Rao', '+91 99887 70471', '+91 91111 10471', '08:12 AM', NULL),
('STU-0472', 'Ishaan Sen', '3', 'B', 'RT-019', 'BUS-019', 'Vasanth Nagar Park Stop 1', 'not boarded', 'Mr. & Mrs. Sen', '+91 99887 70472', '+91 91111 10472', NULL, NULL),
('STU-0473', 'Meera Dubey', '4', 'C', 'RT-019', 'BUS-019', 'Indiranagar Circle Stop 2', 'not boarded', 'Mr. & Mrs. Dubey', '+91 99887 70473', '+91 91111 10473', NULL, NULL),
('STU-0474', 'Arjun Nair', '5', 'A', 'RT-019', 'BUS-019', 'Koramangala 5th Block Stop 3', 'not boarded', 'Mr. & Mrs. Nair', '+91 99887 70474', '+91 91111 10474', NULL, NULL),
('STU-0475', 'Riya Choudhury', '6', 'B', 'RT-019', 'BUS-019', 'HSR Layout BDA Complex Stop 4', 'not boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70475', '+91 91111 10475', NULL, NULL),
('STU-0476', 'Reyansh Prasad', '7', 'C', 'RT-019', 'BUS-019', 'Whitefield Metro Stn Stop 5', 'not boarded', 'Mr. & Mrs. Prasad', '+91 99887 70476', '+91 91111 10476', NULL, NULL),
('STU-0477', 'Zara Singh', '8', 'A', 'RT-019', 'BUS-019', 'Jayanagar 4th Block Stop 6', 'not boarded', 'Mr. & Mrs. Singh', '+91 99887 70477', '+91 91111 10477', NULL, NULL),
('STU-0478', 'Kian Joshi', '9', 'B', 'RT-019', 'BUS-019', 'Malleshwaram 8th Cross Stop 7', 'not boarded', 'Mr. & Mrs. Joshi', '+91 99887 70478', '+91 91111 10478', NULL, NULL),
('STU-0479', 'Myra Roy', '10', 'C', 'RT-019', 'BUS-019', 'Hebbal Flyover Junction Stop 8', 'not boarded', 'Mr. & Mrs. Roy', '+91 99887 70479', '+91 91111 10479', NULL, NULL),
('STU-0480', 'Aarav Sharma', '1', 'A', 'RT-019', 'BUS-019', 'Vasanth Nagar Park Stop 1', 'not boarded', 'Mr. & Mrs. Sharma', '+91 99887 70480', '+91 91111 10480', NULL, NULL),
('STU-0481', 'Aditi Iyer', '2', 'B', 'RT-019', 'BUS-019', 'Indiranagar Circle Stop 2', 'not boarded', 'Mr. & Mrs. Iyer', '+91 99887 70481', '+91 91111 10481', NULL, NULL),
('STU-0482', 'Krishna Pillai', '3', 'C', 'RT-019', 'BUS-019', 'Koramangala 5th Block Stop 3', 'not boarded', 'Mr. & Mrs. Pillai', '+91 99887 70482', '+91 91111 10482', NULL, NULL),
('STU-0483', 'Diya Mishra', '4', 'A', 'RT-019', 'BUS-019', 'HSR Layout BDA Complex Stop 4', 'not boarded', 'Mr. & Mrs. Mishra', '+91 99887 70483', '+91 91111 10483', NULL, NULL),
('STU-0484', 'Rohan Patel', '5', 'B', 'RT-019', 'BUS-019', 'Whitefield Metro Stn Stop 5', 'not boarded', 'Mr. & Mrs. Patel', '+91 99887 70484', '+91 91111 10484', NULL, NULL),
('STU-0485', 'Kavya Mehta', '6', 'C', 'RT-019', 'BUS-019', 'Jayanagar 4th Block Stop 6', 'not boarded', 'Mr. & Mrs. Mehta', '+91 99887 70485', '+91 91111 10485', NULL, NULL),
('STU-0486', 'Atharv Deshmukh', '7', 'A', 'RT-019', 'BUS-019', 'Malleshwaram 8th Cross Stop 7', 'not boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70486', '+91 91111 10486', NULL, NULL),
('STU-0487', 'Anika Verma', '8', 'B', 'RT-019', 'BUS-019', 'Hebbal Flyover Junction Stop 8', 'not boarded', 'Mr. & Mrs. Verma', '+91 99887 70487', '+91 91111 10487', NULL, NULL),
('STU-0488', 'Aaryan Reddy', '9', 'C', 'RT-019', 'BUS-019', 'Vasanth Nagar Park Stop 1', 'not boarded', 'Mr. & Mrs. Reddy', '+91 99887 70488', '+91 91111 10488', NULL, NULL),
('STU-0489', 'Ridhi Bose', '10', 'A', 'RT-019', 'BUS-019', 'Indiranagar Circle Stop 2', 'not boarded', 'Mr. & Mrs. Bose', '+91 99887 70489', '+91 91111 10489', NULL, NULL),
('STU-0490', 'Siddharth Pandey', '1', 'B', 'RT-019', 'BUS-019', 'Koramangala 5th Block Stop 3', 'not boarded', 'Mr. & Mrs. Pandey', '+91 99887 70490', '+91 91111 10490', NULL, NULL),
('STU-0491', 'Aanya Gupta', '2', 'C', 'RT-019', 'BUS-019', 'HSR Layout BDA Complex Stop 4', 'not boarded', 'Mr. & Mrs. Gupta', '+91 99887 70491', '+91 91111 10491', NULL, NULL),
('STU-0492', 'Sai Das', '3', 'A', 'RT-019', 'BUS-019', 'Whitefield Metro Stn Stop 5', 'not boarded', 'Mr. & Mrs. Das', '+91 99887 70492', '+91 91111 10492', NULL, NULL),
('STU-0493', 'Prisha Kulkarni', '4', 'B', 'RT-019', 'BUS-019', 'Jayanagar 4th Block Stop 6', 'not boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70493', '+91 91111 10493', NULL, NULL),
('STU-0494', 'Kabir Kumar', '5', 'C', 'RT-019', 'BUS-019', 'Malleshwaram 8th Cross Stop 7', 'not boarded', 'Mr. & Mrs. Kumar', '+91 99887 70494', '+91 91111 10494', NULL, NULL),
('STU-0495', 'Saanvi Rao', '6', 'A', 'RT-019', 'BUS-019', 'Hebbal Flyover Junction Stop 8', 'not boarded', 'Mr. & Mrs. Rao', '+91 99887 70495', '+91 91111 10495', NULL, NULL),
('STU-0496', 'Dev Sen', '7', 'B', 'RT-020', 'BUS-020', 'Indiranagar Circle Stop 1', 'not boarded', 'Mr. & Mrs. Sen', '+91 99887 70496', '+91 91111 10496', NULL, NULL),
('STU-0497', 'Avani Dubey', '8', 'C', 'RT-020', 'BUS-020', 'Koramangala 5th Block Stop 2', 'not boarded', 'Mr. & Mrs. Dubey', '+91 99887 70497', '+91 91111 10497', NULL, NULL),
('STU-0498', 'Shaurya Nair', '9', 'A', 'RT-020', 'BUS-020', 'HSR Layout BDA Complex Stop 3', 'not boarded', 'Mr. & Mrs. Nair', '+91 99887 70498', '+91 91111 10498', NULL, NULL),
('STU-0499', 'Ira Choudhury', '10', 'B', 'RT-020', 'BUS-020', 'Whitefield Metro Stn Stop 4', 'not boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70499', '+91 91111 10499', NULL, NULL),
('STU-0500', 'Dhruv Prasad', '1', 'C', 'RT-020', 'BUS-020', 'Jayanagar 4th Block Stop 5', 'not boarded', 'Mr. & Mrs. Prasad', '+91 99887 70500', '+91 91111 10500', NULL, NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0501', 'Aisha Singh', '2', 'A', 'RT-020', 'BUS-020', 'Indiranagar Circle Stop 1', 'not boarded', 'Mr. & Mrs. Singh', '+91 99887 70501', '+91 91111 10501', NULL, NULL),
('STU-0502', 'Vihaan Joshi', '3', 'B', 'RT-020', 'BUS-020', 'Koramangala 5th Block Stop 2', 'not boarded', 'Mr. & Mrs. Joshi', '+91 99887 70502', '+91 91111 10502', NULL, NULL),
('STU-0503', 'Ananya Roy', '4', 'C', 'RT-020', 'BUS-020', 'HSR Layout BDA Complex Stop 3', 'not boarded', 'Mr. & Mrs. Roy', '+91 99887 70503', '+91 91111 10503', NULL, NULL),
('STU-0504', 'Ishaan Sharma', '5', 'A', 'RT-020', 'BUS-020', 'Whitefield Metro Stn Stop 4', 'not boarded', 'Mr. & Mrs. Sharma', '+91 99887 70504', '+91 91111 10504', NULL, NULL),
('STU-0505', 'Meera Iyer', '6', 'B', 'RT-020', 'BUS-020', 'Jayanagar 4th Block Stop 5', 'not boarded', 'Mr. & Mrs. Iyer', '+91 99887 70505', '+91 91111 10505', NULL, NULL),
('STU-0506', 'Arjun Pillai', '7', 'C', 'RT-020', 'BUS-020', 'Indiranagar Circle Stop 1', 'not boarded', 'Mr. & Mrs. Pillai', '+91 99887 70506', '+91 91111 10506', NULL, NULL),
('STU-0507', 'Riya Mishra', '8', 'A', 'RT-020', 'BUS-020', 'Koramangala 5th Block Stop 2', 'not boarded', 'Mr. & Mrs. Mishra', '+91 99887 70507', '+91 91111 10507', NULL, NULL),
('STU-0508', 'Reyansh Patel', '9', 'B', 'RT-020', 'BUS-020', 'HSR Layout BDA Complex Stop 3', 'not boarded', 'Mr. & Mrs. Patel', '+91 99887 70508', '+91 91111 10508', NULL, NULL),
('STU-0509', 'Zara Mehta', '10', 'C', 'RT-020', 'BUS-020', 'Whitefield Metro Stn Stop 4', 'not boarded', 'Mr. & Mrs. Mehta', '+91 99887 70509', '+91 91111 10509', NULL, NULL),
('STU-0510', 'Kian Deshmukh', '1', 'A', 'RT-020', 'BUS-020', 'Jayanagar 4th Block Stop 5', 'not boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70510', '+91 91111 10510', NULL, NULL),
('STU-0511', 'Myra Verma', '2', 'B', 'RT-020', 'BUS-020', 'Indiranagar Circle Stop 1', 'not boarded', 'Mr. & Mrs. Verma', '+91 99887 70511', '+91 91111 10511', NULL, NULL),
('STU-0512', 'Aarav Reddy', '3', 'C', 'RT-020', 'BUS-020', 'Koramangala 5th Block Stop 2', 'not boarded', 'Mr. & Mrs. Reddy', '+91 99887 70512', '+91 91111 10512', NULL, NULL),
('STU-0513', 'Aditi Bose', '4', 'A', 'RT-020', 'BUS-020', 'HSR Layout BDA Complex Stop 3', 'not boarded', 'Mr. & Mrs. Bose', '+91 99887 70513', '+91 91111 10513', NULL, NULL),
('STU-0514', 'Krishna Pandey', '5', 'B', 'RT-020', 'BUS-020', 'Whitefield Metro Stn Stop 4', 'not boarded', 'Mr. & Mrs. Pandey', '+91 99887 70514', '+91 91111 10514', NULL, NULL),
('STU-0515', 'Diya Gupta', '6', 'C', 'RT-020', 'BUS-020', 'Jayanagar 4th Block Stop 5', 'not boarded', 'Mr. & Mrs. Gupta', '+91 99887 70515', '+91 91111 10515', NULL, NULL),
('STU-0516', 'Rohan Das', '7', 'A', 'RT-020', 'BUS-020', 'Indiranagar Circle Stop 1', 'not boarded', 'Mr. & Mrs. Das', '+91 99887 70516', '+91 91111 10516', NULL, NULL),
('STU-0517', 'Kavya Kulkarni', '8', 'B', 'RT-020', 'BUS-020', 'Koramangala 5th Block Stop 2', 'not boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70517', '+91 91111 10517', NULL, NULL),
('STU-0518', 'Atharv Kumar', '9', 'C', 'RT-020', 'BUS-020', 'HSR Layout BDA Complex Stop 3', 'not boarded', 'Mr. & Mrs. Kumar', '+91 99887 70518', '+91 91111 10518', NULL, NULL),
('STU-0519', 'Anika Rao', '10', 'A', 'RT-020', 'BUS-020', 'Whitefield Metro Stn Stop 4', 'not boarded', 'Mr. & Mrs. Rao', '+91 99887 70519', '+91 91111 10519', NULL, NULL),
('STU-0520', 'Aaryan Sen', '1', 'B', 'RT-020', 'BUS-020', 'Jayanagar 4th Block Stop 5', 'not boarded', 'Mr. & Mrs. Sen', '+91 99887 70520', '+91 91111 10520', NULL, NULL),
('STU-0521', 'Ridhi Dubey', '2', 'C', 'RT-021', 'BUS-021', 'Koramangala 5th Block Stop 1', 'not boarded', 'Mr. & Mrs. Dubey', '+91 99887 70521', '+91 91111 10521', NULL, NULL),
('STU-0522', 'Siddharth Nair', '3', 'A', 'RT-021', 'BUS-021', 'HSR Layout BDA Complex Stop 2', 'not boarded', 'Mr. & Mrs. Nair', '+91 99887 70522', '+91 91111 10522', NULL, NULL),
('STU-0523', 'Aanya Choudhury', '4', 'B', 'RT-021', 'BUS-021', 'Whitefield Metro Stn Stop 3', 'not boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70523', '+91 91111 10523', NULL, NULL),
('STU-0524', 'Sai Prasad', '5', 'C', 'RT-021', 'BUS-021', 'Jayanagar 4th Block Stop 4', 'not boarded', 'Mr. & Mrs. Prasad', '+91 99887 70524', '+91 91111 10524', NULL, NULL),
('STU-0525', 'Prisha Singh', '6', 'A', 'RT-021', 'BUS-021', 'Malleshwaram 8th Cross Stop 5', 'not boarded', 'Mr. & Mrs. Singh', '+91 99887 70525', '+91 91111 10525', NULL, NULL),
('STU-0526', 'Kabir Joshi', '7', 'B', 'RT-021', 'BUS-021', 'Hebbal Flyover Junction Stop 6', 'not boarded', 'Mr. & Mrs. Joshi', '+91 99887 70526', '+91 91111 10526', NULL, NULL),
('STU-0527', 'Saanvi Roy', '8', 'C', 'RT-021', 'BUS-021', 'Koramangala 5th Block Stop 1', 'not boarded', 'Mr. & Mrs. Roy', '+91 99887 70527', '+91 91111 10527', NULL, NULL),
('STU-0528', 'Dev Sharma', '9', 'A', 'RT-021', 'BUS-021', 'HSR Layout BDA Complex Stop 2', 'not boarded', 'Mr. & Mrs. Sharma', '+91 99887 70528', '+91 91111 10528', NULL, NULL),
('STU-0529', 'Avani Iyer', '10', 'B', 'RT-021', 'BUS-021', 'Whitefield Metro Stn Stop 3', 'not boarded', 'Mr. & Mrs. Iyer', '+91 99887 70529', '+91 91111 10529', NULL, NULL),
('STU-0530', 'Shaurya Pillai', '1', 'C', 'RT-021', 'BUS-021', 'Jayanagar 4th Block Stop 4', 'not boarded', 'Mr. & Mrs. Pillai', '+91 99887 70530', '+91 91111 10530', NULL, NULL),
('STU-0531', 'Ira Mishra', '2', 'A', 'RT-021', 'BUS-021', 'Malleshwaram 8th Cross Stop 5', 'not boarded', 'Mr. & Mrs. Mishra', '+91 99887 70531', '+91 91111 10531', NULL, NULL),
('STU-0532', 'Dhruv Patel', '3', 'B', 'RT-021', 'BUS-021', 'Hebbal Flyover Junction Stop 6', 'not boarded', 'Mr. & Mrs. Patel', '+91 99887 70532', '+91 91111 10532', NULL, NULL),
('STU-0533', 'Aisha Mehta', '4', 'C', 'RT-021', 'BUS-021', 'Koramangala 5th Block Stop 1', 'not boarded', 'Mr. & Mrs. Mehta', '+91 99887 70533', '+91 91111 10533', NULL, NULL),
('STU-0534', 'Vihaan Deshmukh', '5', 'A', 'RT-021', 'BUS-021', 'HSR Layout BDA Complex Stop 2', 'not boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70534', '+91 91111 10534', NULL, NULL),
('STU-0535', 'Ananya Verma', '6', 'B', 'RT-021', 'BUS-021', 'Whitefield Metro Stn Stop 3', 'not boarded', 'Mr. & Mrs. Verma', '+91 99887 70535', '+91 91111 10535', NULL, NULL),
('STU-0536', 'Ishaan Reddy', '7', 'C', 'RT-021', 'BUS-021', 'Jayanagar 4th Block Stop 4', 'not boarded', 'Mr. & Mrs. Reddy', '+91 99887 70536', '+91 91111 10536', NULL, NULL),
('STU-0537', 'Meera Bose', '8', 'A', 'RT-021', 'BUS-021', 'Malleshwaram 8th Cross Stop 5', 'not boarded', 'Mr. & Mrs. Bose', '+91 99887 70537', '+91 91111 10537', NULL, NULL),
('STU-0538', 'Arjun Pandey', '9', 'B', 'RT-021', 'BUS-021', 'Hebbal Flyover Junction Stop 6', 'not boarded', 'Mr. & Mrs. Pandey', '+91 99887 70538', '+91 91111 10538', NULL, NULL),
('STU-0539', 'Riya Gupta', '10', 'C', 'RT-021', 'BUS-021', 'Koramangala 5th Block Stop 1', 'not boarded', 'Mr. & Mrs. Gupta', '+91 99887 70539', '+91 91111 10539', NULL, NULL),
('STU-0540', 'Reyansh Das', '1', 'A', 'RT-021', 'BUS-021', 'HSR Layout BDA Complex Stop 2', 'not boarded', 'Mr. & Mrs. Das', '+91 99887 70540', '+91 91111 10540', NULL, NULL),
('STU-0541', 'Zara Kulkarni', '2', 'B', 'RT-021', 'BUS-021', 'Whitefield Metro Stn Stop 3', 'not boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70541', '+91 91111 10541', NULL, NULL),
('STU-0542', 'Kian Kumar', '3', 'C', 'RT-021', 'BUS-021', 'Jayanagar 4th Block Stop 4', 'not boarded', 'Mr. & Mrs. Kumar', '+91 99887 70542', '+91 91111 10542', NULL, NULL),
('STU-0543', 'Myra Rao', '4', 'A', 'RT-021', 'BUS-021', 'Malleshwaram 8th Cross Stop 5', 'not boarded', 'Mr. & Mrs. Rao', '+91 99887 70543', '+91 91111 10543', NULL, NULL),
('STU-0544', 'Aarav Sen', '5', 'B', 'RT-021', 'BUS-021', 'Hebbal Flyover Junction Stop 6', 'not boarded', 'Mr. & Mrs. Sen', '+91 99887 70544', '+91 91111 10544', NULL, NULL),
('STU-0545', 'Aditi Dubey', '6', 'C', 'RT-021', 'BUS-021', 'Koramangala 5th Block Stop 1', 'not boarded', 'Mr. & Mrs. Dubey', '+91 99887 70545', '+91 91111 10545', NULL, NULL),
('STU-0546', 'Krishna Nair', '7', 'A', 'RT-021', 'BUS-021', 'HSR Layout BDA Complex Stop 2', 'not boarded', 'Mr. & Mrs. Nair', '+91 99887 70546', '+91 91111 10546', NULL, NULL),
('STU-0547', 'Diya Choudhury', '8', 'B', 'RT-022', 'BUS-022', 'HSR Layout BDA Complex Stop 1', 'not boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70547', '+91 91111 10547', NULL, NULL),
('STU-0548', 'Rohan Prasad', '9', 'C', 'RT-022', 'BUS-022', 'Whitefield Metro Stn Stop 2', 'not boarded', 'Mr. & Mrs. Prasad', '+91 99887 70548', '+91 91111 10548', NULL, NULL),
('STU-0549', 'Kavya Singh', '10', 'A', 'RT-022', 'BUS-022', 'Jayanagar 4th Block Stop 3', 'not boarded', 'Mr. & Mrs. Singh', '+91 99887 70549', '+91 91111 10549', NULL, NULL),
('STU-0550', 'Atharv Joshi', '1', 'B', 'RT-022', 'BUS-022', 'Malleshwaram 8th Cross Stop 4', 'not boarded', 'Mr. & Mrs. Joshi', '+91 99887 70550', '+91 91111 10550', NULL, NULL);

INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES
('STU-0551', 'Anika Roy', '2', 'C', 'RT-022', 'BUS-022', 'Hebbal Flyover Junction Stop 5', 'not boarded', 'Mr. & Mrs. Roy', '+91 99887 70551', '+91 91111 10551', NULL, NULL),
('STU-0552', 'Aaryan Sharma', '3', 'A', 'RT-022', 'BUS-022', 'MG Road Metro Stop 6', 'not boarded', 'Mr. & Mrs. Sharma', '+91 99887 70552', '+91 91111 10552', NULL, NULL),
('STU-0553', 'Ridhi Iyer', '4', 'B', 'RT-022', 'BUS-022', 'Bannerghatta Road Apex Stop 7', 'not boarded', 'Mr. & Mrs. Iyer', '+91 99887 70553', '+91 91111 10553', NULL, NULL),
('STU-0554', 'Siddharth Pillai', '5', 'C', 'RT-022', 'BUS-022', 'HSR Layout BDA Complex Stop 1', 'not boarded', 'Mr. & Mrs. Pillai', '+91 99887 70554', '+91 91111 10554', NULL, NULL),
('STU-0555', 'Aanya Mishra', '6', 'A', 'RT-022', 'BUS-022', 'Whitefield Metro Stn Stop 2', 'not boarded', 'Mr. & Mrs. Mishra', '+91 99887 70555', '+91 91111 10555', NULL, NULL),
('STU-0556', 'Sai Patel', '7', 'B', 'RT-022', 'BUS-022', 'Jayanagar 4th Block Stop 3', 'not boarded', 'Mr. & Mrs. Patel', '+91 99887 70556', '+91 91111 10556', NULL, NULL),
('STU-0557', 'Prisha Mehta', '8', 'C', 'RT-022', 'BUS-022', 'Malleshwaram 8th Cross Stop 4', 'not boarded', 'Mr. & Mrs. Mehta', '+91 99887 70557', '+91 91111 10557', NULL, NULL),
('STU-0558', 'Kabir Deshmukh', '9', 'A', 'RT-022', 'BUS-022', 'Hebbal Flyover Junction Stop 5', 'not boarded', 'Mr. & Mrs. Deshmukh', '+91 99887 70558', '+91 91111 10558', NULL, NULL),
('STU-0559', 'Saanvi Verma', '10', 'B', 'RT-022', 'BUS-022', 'MG Road Metro Stop 6', 'not boarded', 'Mr. & Mrs. Verma', '+91 99887 70559', '+91 91111 10559', NULL, NULL),
('STU-0560', 'Dev Reddy', '1', 'C', 'RT-022', 'BUS-022', 'Bannerghatta Road Apex Stop 7', 'not boarded', 'Mr. & Mrs. Reddy', '+91 99887 70560', '+91 91111 10560', NULL, NULL),
('STU-0561', 'Avani Bose', '2', 'A', 'RT-022', 'BUS-022', 'HSR Layout BDA Complex Stop 1', 'not boarded', 'Mr. & Mrs. Bose', '+91 99887 70561', '+91 91111 10561', NULL, NULL),
('STU-0562', 'Shaurya Pandey', '3', 'B', 'RT-022', 'BUS-022', 'Whitefield Metro Stn Stop 2', 'not boarded', 'Mr. & Mrs. Pandey', '+91 99887 70562', '+91 91111 10562', NULL, NULL),
('STU-0563', 'Ira Gupta', '4', 'C', 'RT-022', 'BUS-022', 'Jayanagar 4th Block Stop 3', 'not boarded', 'Mr. & Mrs. Gupta', '+91 99887 70563', '+91 91111 10563', NULL, NULL),
('STU-0564', 'Dhruv Das', '5', 'A', 'RT-022', 'BUS-022', 'Malleshwaram 8th Cross Stop 4', 'not boarded', 'Mr. & Mrs. Das', '+91 99887 70564', '+91 91111 10564', NULL, NULL),
('STU-0565', 'Aisha Kulkarni', '6', 'B', 'RT-022', 'BUS-022', 'Hebbal Flyover Junction Stop 5', 'not boarded', 'Mr. & Mrs. Kulkarni', '+91 99887 70565', '+91 91111 10565', NULL, NULL),
('STU-0566', 'Vihaan Kumar', '7', 'C', 'RT-022', 'BUS-022', 'MG Road Metro Stop 6', 'not boarded', 'Mr. & Mrs. Kumar', '+91 99887 70566', '+91 91111 10566', NULL, NULL),
('STU-0567', 'Ananya Rao', '8', 'A', 'RT-022', 'BUS-022', 'Bannerghatta Road Apex Stop 7', 'not boarded', 'Mr. & Mrs. Rao', '+91 99887 70567', '+91 91111 10567', NULL, NULL),
('STU-0568', 'Ishaan Sen', '9', 'B', 'RT-022', 'BUS-022', 'HSR Layout BDA Complex Stop 1', 'not boarded', 'Mr. & Mrs. Sen', '+91 99887 70568', '+91 91111 10568', NULL, NULL),
('STU-0569', 'Meera Dubey', '10', 'C', 'RT-022', 'BUS-022', 'Whitefield Metro Stn Stop 2', 'not boarded', 'Mr. & Mrs. Dubey', '+91 99887 70569', '+91 91111 10569', NULL, NULL),
('STU-0570', 'Arjun Nair', '1', 'A', 'RT-022', 'BUS-022', 'Jayanagar 4th Block Stop 3', 'not boarded', 'Mr. & Mrs. Nair', '+91 99887 70570', '+91 91111 10570', NULL, NULL),
('STU-0571', 'Riya Choudhury', '2', 'B', 'RT-022', 'BUS-022', 'Malleshwaram 8th Cross Stop 4', 'not boarded', 'Mr. & Mrs. Choudhury', '+91 99887 70571', '+91 91111 10571', NULL, NULL),
('STU-0572', 'Reyansh Prasad', '3', 'C', 'RT-022', 'BUS-022', 'Hebbal Flyover Junction Stop 5', 'not boarded', 'Mr. & Mrs. Prasad', '+91 99887 70572', '+91 91111 10572', NULL, NULL),
('STU-0573', 'Zara Singh', '4', 'A', 'RT-022', 'BUS-022', 'MG Road Metro Stop 6', 'not boarded', 'Mr. & Mrs. Singh', '+91 99887 70573', '+91 91111 10573', NULL, NULL);


-- ============================================================
-- 7. FOREIGN KEY CONSTRAINTS
-- ============================================================
-- Applied after all seed data inserts to prevent circular reference errors.

ALTER TABLE drivers       ADD CONSTRAINT fk_drivers_bus        FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE drivers       ADD CONSTRAINT fk_drivers_route      FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE SET NULL;

ALTER TABLE vehicles      ADD CONSTRAINT fk_vehicles_driver    FOREIGN KEY (driver_id)   REFERENCES drivers(id)    ON DELETE SET NULL;
ALTER TABLE vehicles      ADD CONSTRAINT fk_vehicles_route     FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE SET NULL;

ALTER TABLE routes        ADD CONSTRAINT fk_routes_bus         FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE routes        ADD CONSTRAINT fk_routes_driver      FOREIGN KEY (driver_id)   REFERENCES drivers(id)    ON DELETE SET NULL;

ALTER TABLE route_stops   ADD CONSTRAINT fk_route_stops_route  FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE CASCADE;

ALTER TABLE students      ADD CONSTRAINT fk_students_route     FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE SET NULL;
ALTER TABLE students      ADD CONSTRAINT fk_students_bus       FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;

ALTER TABLE emergencies   ADD CONSTRAINT fk_emergencies_bus    FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE emergencies   ADD CONSTRAINT fk_emergencies_route  FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE SET NULL;
ALTER TABLE emergencies   ADD CONSTRAINT fk_emergencies_driver FOREIGN KEY (driver_id)   REFERENCES drivers(id)    ON DELETE SET NULL;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_bus   FOREIGN KEY (bus_id)   REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_route FOREIGN KEY (route_id) REFERENCES routes(id)     ON DELETE SET NULL;

ALTER TABLE activities    ADD CONSTRAINT fk_activities_bus     FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE activities    ADD CONSTRAINT fk_activities_route   FOREIGN KEY (route_id)    REFERENCES routes(id)     ON DELETE SET NULL;

ALTER TABLE gps_devices   ADD CONSTRAINT fk_gps_devices_bus    FOREIGN KEY (bus_id)      REFERENCES vehicles(id)   ON DELETE SET NULL;
ALTER TABLE gps_telemetry_logs ADD CONSTRAINT fk_telemetry_device FOREIGN KEY (device_id) REFERENCES gps_devices(id) ON DELETE CASCADE;
ALTER TABLE gps_telemetry_logs ADD CONSTRAINT fk_telemetry_bus FOREIGN KEY (bus_id) REFERENCES vehicles(id) ON DELETE CASCADE;



