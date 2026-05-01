-- =====================================================
-- Smart Disaster Response MIS - MSSQL Schema
-- Standard SQL with Tables, Triggers, Views, Indexes
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'disaster_response_mis')
BEGIN
    CREATE DATABASE disaster_response_mis;
END
GO

USE disaster_response_mis;
GO

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Roles table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[roles]') AND type in (N'U'))
CREATE TABLE roles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT GETDATE()
);

-- Users table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users]') AND type in (N'U'))
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role_id INT NOT NULL,
  is_active BIT DEFAULT 1,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Disaster types reference table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[disaster_types]') AND type in (N'U'))
CREATE TABLE disaster_types (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  icon VARCHAR(50)
);

-- Emergency reports
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[emergency_reports]') AND type in (N'U'))
CREATE TABLE emergency_reports (
  id INT IDENTITY(1,1) PRIMARY KEY,
  reporter_name VARCHAR(100),
  reporter_phone VARCHAR(20),
  disaster_type_id INT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'Moderate' CHECK(severity IN ('Low','Moderate','High','Critical')),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_description VARCHAR(500),
  description TEXT,
  status VARCHAR(20) DEFAULT 'Pending' CHECK(status IN ('Pending','Acknowledged','In Progress','Resolved','Closed')),
  assigned_operator_id INT NULL,
  reported_at DATETIME DEFAULT GETDATE(),
  resolved_at DATETIME NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id),
  FOREIGN KEY (assigned_operator_id) REFERENCES users(id)
);

-- Rescue teams
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[rescue_teams]') AND type in (N'U'))
CREATE TABLE rescue_teams (
  id INT IDENTITY(1,1) PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  team_type VARCHAR(20) NOT NULL CHECK(team_type IN ('Medical','Fire','Rescue','Search','Hazmat')),
  leader_name VARCHAR(100),
  member_count INT DEFAULT 5,
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  status VARCHAR(20) DEFAULT 'Available' CHECK(status IN ('Available','Assigned','Busy','Completed','Off Duty')),
  phone VARCHAR(20),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Team assignments (junction table)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[team_assignments]') AND type in (N'U'))
CREATE TABLE team_assignments (
  id INT IDENTITY(1,1) PRIMARY KEY,
  team_id INT NOT NULL,
  emergency_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at DATETIME DEFAULT GETDATE(),
  completed_at DATETIME NULL,
  status VARCHAR(20) DEFAULT 'Assigned' CHECK(status IN ('Assigned','En Route','On Site','Completed','Cancelled')),
  notes TEXT,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Team activity log
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[team_activity_log]') AND type in (N'U'))
CREATE TABLE team_activity_log (
  id INT IDENTITY(1,1) PRIMARY KEY,
  team_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  logged_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id)
);

-- Warehouses
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[warehouses]') AND type in (N'U'))
CREATE TABLE warehouses (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  manager_id INT NULL,
  capacity INT DEFAULT 10000,
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Resources
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[resources]') AND type in (N'U'))
CREATE TABLE resources (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK(category IN ('Food','Water','Medicine','Shelter','Equipment','Clothing','Other')),
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(30) DEFAULT 'units',
  threshold_min INT DEFAULT 50,
  last_restocked DATETIME NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Resource allocations
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[resource_allocations]') AND type in (N'U'))
CREATE TABLE resource_allocations (
  id INT IDENTITY(1,1) PRIMARY KEY,
  resource_id INT NOT NULL,
  emergency_id INT NULL,
  quantity_allocated INT NOT NULL,
  quantity_consumed INT DEFAULT 0,
  allocated_by INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Dispatched','Delivered','Cancelled')),
  allocated_at DATETIME DEFAULT GETDATE(),
  delivered_at DATETIME NULL,
  notes TEXT,
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (allocated_by) REFERENCES users(id)
);

-- Hospitals
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[hospitals]') AND type in (N'U'))
CREATE TABLE hospitals (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  total_beds INT DEFAULT 100,
  available_beds INT DEFAULT 100,
  icu_beds INT DEFAULT 10,
  available_icu INT DEFAULT 10,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Operational' CHECK(status IN ('Operational','Full','Limited','Closed')),
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE()
);

-- Hospital patients
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[hospital_patients]') AND type in (N'U'))
CREATE TABLE hospital_patients (
  id INT IDENTITY(1,1) PRIMARY KEY,
  hospital_id INT NOT NULL,
  emergency_id INT NULL,
  patient_name VARCHAR(100) NOT NULL,
  age INT,
  gender VARCHAR(10) CHECK(gender IN ('Male','Female','Other')),
  condition_severity VARCHAR(20) DEFAULT 'Stable' CHECK(condition_severity IN ('Stable','Serious','Critical')),
  admitted_at DATETIME DEFAULT GETDATE(),
  discharged_at DATETIME NULL,
  status VARCHAR(20) DEFAULT 'Admitted' CHECK(status IN ('Admitted','In Treatment','Discharged','Deceased')),
  notes TEXT,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

-- Financial transactions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[financial_transactions]') AND type in (N'U'))
CREATE TABLE financial_transactions (
  id INT IDENTITY(1,1) PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL CHECK(transaction_type IN ('Donation','Expense','Procurement','Distribution')),
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  donor_name VARCHAR(150),
  emergency_id INT NULL,
  description TEXT,
  recorded_by INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Completed','Rejected')),
  transaction_date DATETIME DEFAULT GETDATE(),
  created_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Budgets per disaster event
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[budgets]') AND type in (N'U'))
CREATE TABLE budgets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  emergency_id INT NOT NULL,
  total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

-- Approval requests
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[approval_requests]') AND type in (N'U'))
CREATE TABLE approval_requests (
  id INT IDENTITY(1,1) PRIMARY KEY,
  request_type VARCHAR(50) NOT NULL CHECK(request_type IN ('Resource Distribution','Rescue Deployment','Financial Approval','Budget Allocation')),
  reference_id INT,
  reference_table VARCHAR(50),
  requested_by INT NOT NULL,
  status VARCHAR(20) DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected')),
  priority VARCHAR(20) DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High','Urgent')),
  description TEXT,
  requested_at DATETIME DEFAULT GETDATE(),
  resolved_at DATETIME NULL,
  resolved_by INT NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Approval history
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[approval_history]') AND type in (N'U'))
CREATE TABLE approval_history (
  id INT IDENTITY(1,1) PRIMARY KEY,
  approval_id INT NOT NULL,
  action VARCHAR(20) NOT NULL CHECK(action IN ('Approved','Rejected','Escalated','Commented')),
  action_by INT NOT NULL,
  comment TEXT,
  action_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (approval_id) REFERENCES approval_requests(id),
  FOREIGN KEY (action_by) REFERENCES users(id)
);

-- Audit logs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[audit_logs]') AND type in (N'U'))
CREATE TABLE audit_logs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(45),
  logged_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

-- =====================================================
-- TRIGGERS (7 total)
-- =====================================================

-- 1. Auto-update resource stock after allocation is dispatched
CREATE OR ALTER TRIGGER trg_resource_allocation_dispatched
ON resource_allocations
AFTER UPDATE
AS
BEGIN
  IF UPDATE(status)
  BEGIN
    UPDATE r
    SET r.quantity = r.quantity - i.quantity_allocated
    FROM resources r
    JOIN inserted i ON r.id = i.resource_id
    JOIN deleted d ON i.id = d.id
    WHERE i.status = 'Dispatched' AND d.status != 'Dispatched';
  END
END;
GO

-- 2. Prevent negative inventory
CREATE OR ALTER TRIGGER trg_prevent_negative_inventory
ON resources
AFTER UPDATE
AS
BEGIN
  IF EXISTS (SELECT 1 FROM inserted WHERE quantity < 0)
  BEGIN
    RAISERROR ('Cannot reduce inventory below zero', 16, 1);
    ROLLBACK TRANSACTION;
  END
END;
GO

-- 3. Auto-change rescue team status on assignment
CREATE OR ALTER TRIGGER trg_team_assignment_status
ON team_assignments
AFTER INSERT
AS
BEGIN
  UPDATE rt
  SET status = 'Assigned'
  FROM rescue_teams rt
  JOIN inserted i ON rt.id = i.team_id;

  INSERT INTO team_activity_log (team_id, activity_type, description)
  SELECT team_id, 'ASSIGNED', 'Assigned to emergency #' + CAST(emergency_id AS VARCHAR(20))
  FROM inserted;
END;
GO

-- 4. Log team completion and reset status
CREATE OR ALTER TRIGGER trg_team_assignment_complete
ON team_assignments
AFTER UPDATE
AS
BEGIN
  IF UPDATE(status)
  BEGIN
    UPDATE rt
    SET status = 'Available'
    FROM rescue_teams rt
    JOIN inserted i ON rt.id = i.team_id
    JOIN deleted d ON i.id = d.id
    WHERE i.status = 'Completed' AND d.status != 'Completed';

    INSERT INTO team_activity_log (team_id, activity_type, description)
    SELECT i.team_id, 'COMPLETED', 'Completed emergency #' + CAST(i.emergency_id AS VARCHAR(20))
    FROM inserted i
    JOIN deleted d ON i.id = d.id
    WHERE i.status = 'Completed' AND d.status != 'Completed';
  END
END;
GO

-- 5. Auto-log financial transactions to audit trail
CREATE OR ALTER TRIGGER trg_financial_audit
ON financial_transactions
AFTER INSERT
AS
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  SELECT 
    recorded_by, 
    'FINANCIAL_TRANSACTION_CREATED', 
    'financial_transactions', 
    id, 
    '{"type":"' + transaction_type + '","amount":' + CAST(amount AS VARCHAR(50)) + ',"category":"' + ISNULL(category,'') + '"}'
  FROM inserted;
END;
GO

-- 6. Auto-update hospital bed count on patient admission
CREATE OR ALTER TRIGGER trg_hospital_admit
ON hospital_patients
AFTER INSERT
AS
BEGIN
  UPDATE h
  SET available_beds = available_beds - 1
  FROM hospitals h
  JOIN inserted i ON h.id = i.hospital_id;
END;
GO

-- 7. Auto-update hospital bed count on patient discharge
CREATE OR ALTER TRIGGER trg_hospital_discharge
ON hospital_patients
AFTER UPDATE
AS
BEGIN
  IF UPDATE(status)
  BEGIN
    UPDATE h
    SET available_beds = available_beds + 1
    FROM hospitals h
    JOIN inserted i ON h.id = i.hospital_id
    JOIN deleted d ON i.id = d.id
    WHERE i.status = 'Discharged' AND d.status != 'Discharged';
  END
END;
GO

-- =====================================================
-- VIEWS (10 total)
-- =====================================================

-- 1. Active emergencies summary
GO
CREATE OR ALTER VIEW vw_active_emergencies AS
SELECT
  er.id, er.reporter_name, dt.name AS disaster_type, er.severity,
  er.latitude, er.longitude, er.location_description, er.status,
  er.description, er.reported_at,
  u.full_name AS assigned_operator
FROM emergency_reports er
JOIN disaster_types dt ON er.disaster_type_id = dt.id
LEFT JOIN users u ON er.assigned_operator_id = u.id
WHERE er.status NOT IN ('Resolved', 'Closed');
GO

-- 2. Resource inventory overview with stock alerts
CREATE OR ALTER VIEW vw_resource_inventory AS
SELECT
  r.id, r.name, r.category, r.quantity, r.unit, r.threshold_min,
  w.name AS warehouse_name, w.location AS warehouse_location,
  CASE WHEN r.quantity <= r.threshold_min THEN 'LOW STOCK' ELSE 'OK' END AS stock_status
FROM resources r
JOIN warehouses w ON r.warehouse_id = w.id;
GO

-- 3. Rescue team status with mission stats
CREATE OR ALTER VIEW vw_rescue_team_status AS
SELECT
  rt.id, rt.team_name, rt.team_type, rt.status, rt.member_count,
  rt.leader_name, rt.current_latitude, rt.current_longitude,
  COUNT(ta.id) AS total_assignments,
  SUM(CASE WHEN ta.status = 'Completed' THEN 1 ELSE 0 END) AS completed_assignments
FROM rescue_teams rt
LEFT JOIN team_assignments ta ON rt.id = ta.team_id
GROUP BY rt.id, rt.team_name, rt.team_type, rt.status, rt.member_count,
  rt.leader_name, rt.current_latitude, rt.current_longitude;
GO

-- 4. Financial summary by type
CREATE OR ALTER VIEW vw_financial_summary AS
SELECT
  transaction_type,
  COUNT(*) AS total_transactions,
  SUM(amount) AS total_amount,
  AVG(amount) AS avg_amount,
  MIN(transaction_date) AS earliest,
  MAX(transaction_date) AS latest
FROM financial_transactions
WHERE status IN ('Approved', 'Completed')
GROUP BY transaction_type;
GO

-- 5. Hospital capacity overview
CREATE OR ALTER VIEW vw_hospital_capacity AS
SELECT
  h.id, h.name, h.location, h.total_beds, h.available_beds,
  h.icu_beds, h.available_icu, h.status,
  (h.total_beds - h.available_beds) AS occupied_beds,
  ROUND(CAST((h.total_beds - h.available_beds) AS FLOAT) / h.total_beds * 100, 1) AS occupancy_pct,
  COUNT(hp.id) AS current_patients
FROM hospitals h
LEFT JOIN hospital_patients hp ON h.id = hp.hospital_id AND hp.status IN ('Admitted', 'In Treatment')
GROUP BY h.id, h.name, h.location, h.total_beds, h.available_beds,
  h.icu_beds, h.available_icu, h.status;
GO

-- 6. Pending approvals queue
CREATE OR ALTER VIEW vw_pending_approvals AS
SELECT
  ar.id, ar.request_type, ar.priority, ar.description, ar.status,
  ar.requested_at, u.full_name AS requested_by_name, u.email AS requested_by_email
FROM approval_requests ar
JOIN users u ON ar.requested_by = u.id
WHERE ar.status = 'Pending';
GO

-- 7. Dashboard real-time stats
CREATE OR ALTER VIEW vw_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM emergency_reports WHERE status NOT IN ('Resolved','Closed')) AS active_emergencies,
  (SELECT COUNT(*) FROM rescue_teams WHERE status = 'Available') AS available_teams,
  (SELECT COUNT(*) FROM rescue_teams) AS total_teams,
  (SELECT COUNT(*) FROM resources WHERE quantity <= threshold_min) AS low_stock_resources,
  (SELECT ISNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Donation' AND status IN ('Approved','Completed')) AS total_donations,
  (SELECT ISNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Expense' AND status IN ('Approved','Completed')) AS total_expenses,
  (SELECT COUNT(*) FROM approval_requests WHERE status = 'Pending') AS pending_approvals,
  (SELECT COUNT(*) FROM hospitals WHERE status = 'Operational') AS operational_hospitals;
GO

-- 8. Audit log detail with user info
CREATE OR ALTER VIEW vw_audit_log_detail AS
SELECT
  al.id, al.action, al.table_name, al.record_id,
  al.old_values, al.new_values, al.ip_address, al.logged_at,
  u.full_name AS user_name, u.email AS user_email,
  r.name AS user_role
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id;
GO

-- 9. Incident statistics by type and severity
CREATE OR ALTER VIEW vw_incident_statistics AS
SELECT
  dt.name AS disaster_type,
  er.severity,
  COUNT(*) AS incident_count,
  AVG(DATEDIFF(MINUTE, er.reported_at, er.resolved_at)) AS avg_resolution_minutes
FROM emergency_reports er
JOIN disaster_types dt ON er.disaster_type_id = dt.id
GROUP BY dt.name, er.severity;
GO

-- 10. Finance officer restricted view (no user passwords)
CREATE OR ALTER VIEW vw_finance_officer_data AS
SELECT
  ft.id, ft.transaction_type, ft.category, ft.amount, ft.currency,
  ft.donor_name, ft.description, ft.status, ft.transaction_date,
  u.full_name AS recorded_by_name
FROM financial_transactions ft
JOIN users u ON ft.recorded_by = u.id;
GO

-- =====================================================
-- INDEXES (22 total for query optimization)
-- =====================================================

-- Emergency reports indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_status' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_status ON emergency_reports(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_severity' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_severity ON emergency_reports(severity);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_disaster_type' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_disaster_type ON emergency_reports(disaster_type_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_location' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_location ON emergency_reports(latitude, longitude);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_reported_at' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_reported_at ON emergency_reports(reported_at);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_status_severity' AND object_id = OBJECT_ID('emergency_reports'))
    CREATE INDEX idx_emergency_status_severity ON emergency_reports(status, severity);

-- Resource indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resource_category' AND object_id = OBJECT_ID('resources'))
    CREATE INDEX idx_resource_category ON resources(category);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resource_warehouse' AND object_id = OBJECT_ID('resources'))
    CREATE INDEX idx_resource_warehouse ON resources(warehouse_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resource_quantity' AND object_id = OBJECT_ID('resources'))
    CREATE INDEX idx_resource_quantity ON resources(quantity);

-- Financial indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_financial_type' AND object_id = OBJECT_ID('financial_transactions'))
    CREATE INDEX idx_financial_type ON financial_transactions(transaction_type);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_financial_date' AND object_id = OBJECT_ID('financial_transactions'))
    CREATE INDEX idx_financial_date ON financial_transactions(transaction_date);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_financial_status' AND object_id = OBJECT_ID('financial_transactions'))
    CREATE INDEX idx_financial_status ON financial_transactions(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_financial_emergency' AND object_id = OBJECT_ID('financial_transactions'))
    CREATE INDEX idx_financial_emergency ON financial_transactions(emergency_id);

-- Rescue team indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_team_status' AND object_id = OBJECT_ID('rescue_teams'))
    CREATE INDEX idx_team_status ON rescue_teams(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_team_type' AND object_id = OBJECT_ID('rescue_teams'))
    CREATE INDEX idx_team_type ON rescue_teams(team_type);

-- Audit log indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_user' AND object_id = OBJECT_ID('audit_logs'))
    CREATE INDEX idx_audit_user ON audit_logs(user_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_action' AND object_id = OBJECT_ID('audit_logs'))
    CREATE INDEX idx_audit_action ON audit_logs(action);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_logged_at' AND object_id = OBJECT_ID('audit_logs'))
    CREATE INDEX idx_audit_logged_at ON audit_logs(logged_at);

-- Approval indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_approval_status' AND object_id = OBJECT_ID('approval_requests'))
    CREATE INDEX idx_approval_status ON approval_requests(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_approval_type' AND object_id = OBJECT_ID('approval_requests'))
    CREATE INDEX idx_approval_type ON approval_requests(request_type);

-- Hospital indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_hospital_status' AND object_id = OBJECT_ID('hospitals'))
    CREATE INDEX idx_hospital_status ON hospitals(status);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_hospital_beds' AND object_id = OBJECT_ID('hospitals'))
    CREATE INDEX idx_hospital_beds ON hospitals(available_beds);
GO