-- =====================================================
-- Smart Disaster Response MIS - MySQL Schema
-- Standard SQL with Tables, Triggers, Views, Indexes
-- =====================================================

CREATE DATABASE IF NOT EXISTS disaster_response_mis;
USE disaster_response_mis;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Disaster types reference table
CREATE TABLE IF NOT EXISTS disaster_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  icon VARCHAR(50)
);

-- Emergency reports
CREATE TABLE IF NOT EXISTS emergency_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reporter_name VARCHAR(100),
  reporter_phone VARCHAR(20),
  disaster_type_id INT NOT NULL,
  severity ENUM('Low','Moderate','High','Critical') NOT NULL DEFAULT 'Moderate',
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  location_description VARCHAR(500),
  description TEXT,
  status ENUM('Pending','Acknowledged','In Progress','Resolved','Closed') DEFAULT 'Pending',
  assigned_operator_id INT,
  reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id),
  FOREIGN KEY (assigned_operator_id) REFERENCES users(id)
);

-- Rescue teams
CREATE TABLE IF NOT EXISTS rescue_teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_name VARCHAR(100) NOT NULL,
  team_type ENUM('Medical','Fire','Rescue','Search','Hazmat') NOT NULL,
  leader_name VARCHAR(100),
  member_count INT DEFAULT 5,
  current_latitude DECIMAL(10,7),
  current_longitude DECIMAL(10,7),
  status ENUM('Available','Assigned','Busy','Completed','Off Duty') DEFAULT 'Available',
  phone VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Team assignments (junction table)
CREATE TABLE IF NOT EXISTS team_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  emergency_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  status ENUM('Assigned','En Route','On Site','Completed','Cancelled') DEFAULT 'Assigned',
  notes TEXT,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Team activity log
CREATE TABLE IF NOT EXISTS team_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  team_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  manager_id INT,
  capacity INT DEFAULT 10000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- Resources
CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Food','Water','Medicine','Shelter','Equipment','Clothing','Other') NOT NULL,
  warehouse_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit VARCHAR(30) DEFAULT 'units',
  threshold_min INT DEFAULT 50,
  last_restocked DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Resource allocations
CREATE TABLE IF NOT EXISTS resource_allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  emergency_id INT,
  quantity_allocated INT NOT NULL,
  quantity_consumed INT DEFAULT 0,
  allocated_by INT NOT NULL,
  status ENUM('Pending','Approved','Dispatched','Delivered','Cancelled') DEFAULT 'Pending',
  allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME NULL,
  notes TEXT,
  FOREIGN KEY (resource_id) REFERENCES resources(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (allocated_by) REFERENCES users(id)
);

-- Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(255),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  total_beds INT DEFAULT 100,
  available_beds INT DEFAULT 100,
  icu_beds INT DEFAULT 10,
  available_icu INT DEFAULT 10,
  phone VARCHAR(20),
  status ENUM('Operational','Full','Limited','Closed') DEFAULT 'Operational',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Hospital patients
CREATE TABLE IF NOT EXISTS hospital_patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_id INT NOT NULL,
  emergency_id INT,
  patient_name VARCHAR(100) NOT NULL,
  age INT,
  gender ENUM('Male','Female','Other'),
  condition_severity ENUM('Stable','Serious','Critical') DEFAULT 'Stable',
  admitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  discharged_at DATETIME NULL,
  status ENUM('Admitted','In Treatment','Discharged','Deceased') DEFAULT 'Admitted',
  notes TEXT,
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

-- Financial transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_type ENUM('Donation','Expense','Procurement','Distribution') NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  donor_name VARCHAR(150),
  emergency_id INT,
  description TEXT,
  recorded_by INT NOT NULL,
  status ENUM('Pending','Approved','Completed','Rejected') DEFAULT 'Pending',
  transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Budgets per disaster event
CREATE TABLE IF NOT EXISTS budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emergency_id INT NOT NULL,
  total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
  spent DECIMAL(15,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

-- Approval requests
CREATE TABLE IF NOT EXISTS approval_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_type ENUM('Resource Distribution','Rescue Deployment','Financial Approval','Budget Allocation') NOT NULL,
  reference_id INT,
  reference_table VARCHAR(50),
  requested_by INT NOT NULL,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  priority ENUM('Low','Medium','High','Urgent') DEFAULT 'Medium',
  description TEXT,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  resolved_by INT,
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Approval history
CREATE TABLE IF NOT EXISTS approval_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  approval_id INT NOT NULL,
  action ENUM('Approved','Rejected','Escalated','Commented') NOT NULL,
  action_by INT NOT NULL,
  comment TEXT,
  action_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approval_id) REFERENCES approval_requests(id),
  FOREIGN KEY (action_by) REFERENCES users(id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(50),
  record_id INT,
  old_values TEXT,
  new_values TEXT,
  ip_address VARCHAR(45),
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


-- =====================================================
-- TRIGGERS (7 total)
-- =====================================================

-- 1. Auto-update resource stock after allocation is dispatched
DELIMITER //
CREATE TRIGGER trg_resource_allocation_dispatched
AFTER UPDATE ON resource_allocations
FOR EACH ROW
BEGIN
  IF NEW.status = 'Dispatched' AND OLD.status != 'Dispatched' THEN
    UPDATE resources SET quantity = quantity - NEW.quantity_allocated
    WHERE id = NEW.resource_id;
  END IF;
END//
DELIMITER ;

-- 2. Prevent negative inventory
DELIMITER //
CREATE TRIGGER trg_prevent_negative_inventory
BEFORE UPDATE ON resources
FOR EACH ROW
BEGIN
  IF NEW.quantity < 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot reduce inventory below zero';
  END IF;
END//
DELIMITER ;

-- 3. Auto-change rescue team status on assignment
DELIMITER //
CREATE TRIGGER trg_team_assignment_status
AFTER INSERT ON team_assignments
FOR EACH ROW
BEGIN
  UPDATE rescue_teams SET status = 'Assigned' WHERE id = NEW.team_id;
  INSERT INTO team_activity_log (team_id, activity_type, description)
  VALUES (NEW.team_id, 'ASSIGNED', CONCAT('Assigned to emergency #', NEW.emergency_id));
END//
DELIMITER ;

-- 4. Log team completion and reset status
DELIMITER //
CREATE TRIGGER trg_team_assignment_complete
AFTER UPDATE ON team_assignments
FOR EACH ROW
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE rescue_teams SET status = 'Available' WHERE id = NEW.team_id;
    INSERT INTO team_activity_log (team_id, activity_type, description)
    VALUES (NEW.team_id, 'COMPLETED', CONCAT('Completed emergency #', NEW.emergency_id));
  END IF;
END//
DELIMITER ;

-- 5. Auto-log financial transactions to audit trail
DELIMITER //
CREATE TRIGGER trg_financial_audit
AFTER INSERT ON financial_transactions
FOR EACH ROW
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
  VALUES (NEW.recorded_by, 'FINANCIAL_TRANSACTION_CREATED', 'financial_transactions', NEW.id,
    CONCAT('{"type":"', NEW.transaction_type, '","amount":', NEW.amount, ',"category":"', IFNULL(NEW.category,''), '"}'));
END//
DELIMITER ;

-- 6. Auto-update hospital bed count on patient admission
DELIMITER //
CREATE TRIGGER trg_hospital_admit
AFTER INSERT ON hospital_patients
FOR EACH ROW
BEGIN
  UPDATE hospitals SET available_beds = available_beds - 1 WHERE id = NEW.hospital_id;
END//
DELIMITER ;

-- 7. Auto-update hospital bed count on patient discharge
DELIMITER //
CREATE TRIGGER trg_hospital_discharge
AFTER UPDATE ON hospital_patients
FOR EACH ROW
BEGIN
  IF NEW.status = 'Discharged' AND OLD.status != 'Discharged' THEN
    UPDATE hospitals SET available_beds = available_beds + 1 WHERE id = NEW.hospital_id;
  END IF;
END//
DELIMITER ;


-- =====================================================
-- VIEWS (10 total)
-- =====================================================

-- 1. Active emergencies summary
CREATE OR REPLACE VIEW vw_active_emergencies AS
SELECT
  er.id, er.reporter_name, dt.name AS disaster_type, er.severity,
  er.latitude, er.longitude, er.location_description, er.status,
  er.description, er.reported_at,
  u.full_name AS assigned_operator
FROM emergency_reports er
JOIN disaster_types dt ON er.disaster_type_id = dt.id
LEFT JOIN users u ON er.assigned_operator_id = u.id
WHERE er.status NOT IN ('Resolved', 'Closed');

-- 2. Resource inventory overview with stock alerts
CREATE OR REPLACE VIEW vw_resource_inventory AS
SELECT
  r.id, r.name, r.category, r.quantity, r.unit, r.threshold_min,
  w.name AS warehouse_name, w.location AS warehouse_location,
  CASE WHEN r.quantity <= r.threshold_min THEN 'LOW STOCK' ELSE 'OK' END AS stock_status
FROM resources r
JOIN warehouses w ON r.warehouse_id = w.id;

-- 3. Rescue team status with mission stats
CREATE OR REPLACE VIEW vw_rescue_team_status AS
SELECT
  rt.id, rt.team_name, rt.team_type, rt.status, rt.member_count,
  rt.leader_name, rt.current_latitude, rt.current_longitude,
  COUNT(ta.id) AS total_assignments,
  SUM(CASE WHEN ta.status = 'Completed' THEN 1 ELSE 0 END) AS completed_assignments
FROM rescue_teams rt
LEFT JOIN team_assignments ta ON rt.id = ta.team_id
GROUP BY rt.id, rt.team_name, rt.team_type, rt.status, rt.member_count,
  rt.leader_name, rt.current_latitude, rt.current_longitude;

-- 4. Financial summary by type
CREATE OR REPLACE VIEW vw_financial_summary AS
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

-- 5. Hospital capacity overview
CREATE OR REPLACE VIEW vw_hospital_capacity AS
SELECT
  h.id, h.name, h.location, h.total_beds, h.available_beds,
  h.icu_beds, h.available_icu, h.status,
  (h.total_beds - h.available_beds) AS occupied_beds,
  ROUND((h.total_beds - h.available_beds) / h.total_beds * 100, 1) AS occupancy_pct,
  COUNT(hp.id) AS current_patients
FROM hospitals h
LEFT JOIN hospital_patients hp ON h.id = hp.hospital_id AND hp.status IN ('Admitted', 'In Treatment')
GROUP BY h.id, h.name, h.location, h.total_beds, h.available_beds,
  h.icu_beds, h.available_icu, h.status;

-- 6. Pending approvals queue
CREATE OR REPLACE VIEW vw_pending_approvals AS
SELECT
  ar.id, ar.request_type, ar.priority, ar.description, ar.status,
  ar.requested_at, u.full_name AS requested_by_name, u.email AS requested_by_email
FROM approval_requests ar
JOIN users u ON ar.requested_by = u.id
WHERE ar.status = 'Pending';

-- 7. Dashboard real-time stats
CREATE OR REPLACE VIEW vw_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM emergency_reports WHERE status NOT IN ('Resolved','Closed')) AS active_emergencies,
  (SELECT COUNT(*) FROM rescue_teams WHERE status = 'Available') AS available_teams,
  (SELECT COUNT(*) FROM rescue_teams) AS total_teams,
  (SELECT COUNT(*) FROM resources WHERE quantity <= threshold_min) AS low_stock_resources,
  (SELECT IFNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Donation' AND status IN ('Approved','Completed')) AS total_donations,
  (SELECT IFNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Expense' AND status IN ('Approved','Completed')) AS total_expenses,
  (SELECT COUNT(*) FROM approval_requests WHERE status = 'Pending') AS pending_approvals,
  (SELECT COUNT(*) FROM hospitals WHERE status = 'Operational') AS operational_hospitals;

-- 8. Audit log detail with user info
CREATE OR REPLACE VIEW vw_audit_log_detail AS
SELECT
  al.id, al.action, al.table_name, al.record_id,
  al.old_values, al.new_values, al.ip_address, al.logged_at,
  u.full_name AS user_name, u.email AS user_email,
  r.name AS user_role
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN roles r ON u.role_id = r.id;

-- 9. Incident statistics by type and severity
CREATE OR REPLACE VIEW vw_incident_statistics AS
SELECT
  dt.name AS disaster_type,
  er.severity,
  COUNT(*) AS incident_count,
  AVG(TIMESTAMPDIFF(MINUTE, er.reported_at, er.resolved_at)) AS avg_resolution_minutes
FROM emergency_reports er
JOIN disaster_types dt ON er.disaster_type_id = dt.id
GROUP BY dt.name, er.severity;

-- 10. Finance officer restricted view (no user passwords)
CREATE OR REPLACE VIEW vw_finance_officer_data AS
SELECT
  ft.id, ft.transaction_type, ft.category, ft.amount, ft.currency,
  ft.donor_name, ft.description, ft.status, ft.transaction_date,
  u.full_name AS recorded_by_name
FROM financial_transactions ft
JOIN users u ON ft.recorded_by = u.id;


-- =====================================================
-- INDEXES (22 total for query optimization)
-- =====================================================

-- Emergency reports indexes
CREATE INDEX idx_emergency_status ON emergency_reports(status);
CREATE INDEX idx_emergency_severity ON emergency_reports(severity);
CREATE INDEX idx_emergency_disaster_type ON emergency_reports(disaster_type_id);
CREATE INDEX idx_emergency_location ON emergency_reports(latitude, longitude);
CREATE INDEX idx_emergency_reported_at ON emergency_reports(reported_at);
CREATE INDEX idx_emergency_status_severity ON emergency_reports(status, severity);

-- Resource indexes
CREATE INDEX idx_resource_category ON resources(category);
CREATE INDEX idx_resource_warehouse ON resources(warehouse_id);
CREATE INDEX idx_resource_quantity ON resources(quantity);

-- Financial indexes
CREATE INDEX idx_financial_type ON financial_transactions(transaction_type);
CREATE INDEX idx_financial_date ON financial_transactions(transaction_date);
CREATE INDEX idx_financial_status ON financial_transactions(status);
CREATE INDEX idx_financial_emergency ON financial_transactions(emergency_id);

-- Rescue team indexes
CREATE INDEX idx_team_status ON rescue_teams(status);
CREATE INDEX idx_team_type ON rescue_teams(team_type);

-- Audit log indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_logged_at ON audit_logs(logged_at);

-- Approval indexes
CREATE INDEX idx_approval_status ON approval_requests(status);
CREATE INDEX idx_approval_type ON approval_requests(request_type);

-- Hospital indexes
CREATE INDEX idx_hospital_status ON hospitals(status);
CREATE INDEX idx_hospital_beds ON hospitals(available_beds);
