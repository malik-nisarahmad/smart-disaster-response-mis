/* 
=====================================================
Smart Disaster Response MIS - SQL Server (T-SQL)
=====================================================
*/

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

CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    phone NVARCHAR(20),
    role_id INT NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE disaster_types (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255),
    icon NVARCHAR(50)
);

CREATE TABLE emergency_reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    reporter_name NVARCHAR(100),
    reporter_phone NVARCHAR(20),
    disaster_type_id INT NOT NULL,
    severity NVARCHAR(20) NOT NULL DEFAULT 'Moderate' CHECK (severity IN ('Low','Moderate','High','Critical')),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    location_description NVARCHAR(500),
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Acknowledged','In Progress','Resolved','Closed')),
    assigned_operator_id INT,
    reported_at DATETIME DEFAULT GETDATE(),
    resolved_at DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (disaster_type_id) REFERENCES disaster_types(id),
    FOREIGN KEY (assigned_operator_id) REFERENCES users(id)
);

CREATE TABLE rescue_teams (
    id INT IDENTITY(1,1) PRIMARY KEY,
    team_name NVARCHAR(100) NOT NULL,
    team_type NVARCHAR(20) NOT NULL CHECK (team_type IN ('Medical','Fire','Rescue','Search','Hazmat')),
    leader_name NVARCHAR(100),
    member_count INT DEFAULT 5,
    current_latitude DECIMAL(10,7),
    current_longitude DECIMAL(10,7),
    status NVARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available','Assigned','Busy','Completed','Off Duty')),
    phone NVARCHAR(20),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE team_assignments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL,
    emergency_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_at DATETIME DEFAULT GETDATE(),
    completed_at DATETIME NULL,
    status NVARCHAR(20) DEFAULT 'Assigned' CHECK (status IN ('Assigned','En Route','On Site','Completed','Cancelled')),
    notes NVARCHAR(MAX),
    FOREIGN KEY (team_id) REFERENCES rescue_teams(id),
    FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE TABLE team_activity_log (
    id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL,
    activity_type NVARCHAR(50) NOT NULL,
    description NVARCHAR(MAX),
    logged_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (team_id) REFERENCES rescue_teams(id)
);

CREATE TABLE warehouses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    location NVARCHAR(255),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    manager_id INT,
    capacity INT DEFAULT 10000,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE resources (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    category NVARCHAR(20) NOT NULL CHECK (category IN ('Food','Water','Medicine','Shelter','Equipment','Clothing','Other')),
    warehouse_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    unit NVARCHAR(30) DEFAULT 'units',
    threshold_min INT DEFAULT 50,
    last_restocked DATETIME NULL,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE resource_allocations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    resource_id INT NOT NULL,
    emergency_id INT,
    quantity_allocated INT NOT NULL,
    quantity_consumed INT DEFAULT 0,
    allocated_by INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Dispatched','Delivered','Cancelled')),
    allocated_at DATETIME DEFAULT GETDATE(),
    delivered_at DATETIME NULL,
    notes NVARCHAR(MAX),
    FOREIGN KEY (resource_id) REFERENCES resources(id),
    FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
    FOREIGN KEY (allocated_by) REFERENCES users(id)
);

CREATE TABLE hospitals (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    location NVARCHAR(255),
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    total_beds INT DEFAULT 100,
    available_beds INT DEFAULT 100,
    icu_beds INT DEFAULT 10,
    available_icu INT DEFAULT 10,
    phone NVARCHAR(20),
    status NVARCHAR(20) DEFAULT 'Operational' CHECK (status IN ('Operational','Full','Limited','Closed')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE hospital_patients (
    id INT IDENTITY(1,1) PRIMARY KEY,
    hospital_id INT NOT NULL,
    emergency_id INT,
    patient_name NVARCHAR(100) NOT NULL,
    age INT,
    gender NVARCHAR(10) CHECK (gender IN ('Male','Female','Other')),
    condition_severity NVARCHAR(20) DEFAULT 'Stable' CHECK (condition_severity IN ('Stable','Serious','Critical')),
    admitted_at DATETIME DEFAULT GETDATE(),
    discharged_at DATETIME NULL,
    status NVARCHAR(20) DEFAULT 'Admitted' CHECK (status IN ('Admitted','In Treatment','Discharged','Deceased')),
    notes NVARCHAR(MAX),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

CREATE TABLE financial_transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    transaction_type NVARCHAR(20) NOT NULL CHECK (transaction_type IN ('Donation','Expense','Procurement','Distribution')),
    category NVARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency NVARCHAR(10) DEFAULT 'USD',
    donor_name NVARCHAR(150),
    emergency_id INT,
    description NVARCHAR(MAX),
    recorded_by INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Completed','Rejected')),
    transaction_date DATETIME DEFAULT GETDATE(),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

CREATE TABLE budgets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    emergency_id INT NOT NULL,
    total_budget DECIMAL(15,2) NOT NULL DEFAULT 0,
    spent DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (emergency_id) REFERENCES emergency_reports(id)
);

CREATE TABLE approval_requests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    request_type NVARCHAR(30) NOT NULL CHECK (request_type IN ('Resource Distribution','Rescue Deployment','Financial Approval','Budget Allocation')),
    reference_id INT,
    reference_table NVARCHAR(50),
    requested_by INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
    priority NVARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High','Urgent')),
    description NVARCHAR(MAX),
    requested_at DATETIME DEFAULT GETDATE(),
    resolved_at DATETIME NULL,
    resolved_by INT,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE TABLE approval_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    approval_id INT NOT NULL,
    action NVARCHAR(20) NOT NULL CHECK (action IN ('Approved','Rejected','Escalated','Commented')),
    action_by INT NOT NULL,
    comment NVARCHAR(MAX),
    action_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (approval_id) REFERENCES approval_requests(id),
    FOREIGN KEY (action_by) REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT,
    action NVARCHAR(100) NOT NULL,
    table_name NVARCHAR(50),
    record_id INT,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    logged_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

-- =====================================================
-- TRIGGERS
-- =====================================================

-- 1. Auto-update resource stock
CREATE TRIGGER trg_resource_allocation_dispatched
ON resource_allocations
AFTER UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.id = d.id 
               WHERE i.status = 'Dispatched' AND d.status <> 'Dispatched')
    BEGIN
        UPDATE r
        SET r.quantity = r.quantity - i.quantity_allocated
        FROM resources r
        JOIN inserted i ON r.id = i.resource_id;
    END
END;
GO

-- 2. Prevent negative inventory
CREATE TRIGGER trg_prevent_negative_inventory
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
CREATE TRIGGER trg_team_assignment_status
ON team_assignments
AFTER INSERT
AS
BEGIN
    UPDATE rt
    SET rt.status = 'Assigned'
    FROM rescue_teams rt
    JOIN inserted i ON rt.id = i.team_id;

    INSERT INTO team_activity_log (team_id, activity_type, description)
    SELECT team_id, 'ASSIGNED', 'Assigned to emergency #' + CAST(emergency_id AS NVARCHAR)
    FROM inserted;
END;
GO

-- 4. Log completion and reset status
CREATE TRIGGER trg_team_assignment_complete
ON team_assignments
AFTER UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.id = d.id 
               WHERE i.status = 'Completed' AND d.status <> 'Completed')
    BEGIN
        UPDATE rt
        SET rt.status = 'Available'
        FROM rescue_teams rt
        JOIN inserted i ON rt.id = i.team_id;

        INSERT INTO team_activity_log (team_id, activity_type, description)
        SELECT team_id, 'COMPLETED', 'Completed emergency #' + CAST(emergency_id AS NVARCHAR)
        FROM inserted;
    END
END;
GO

-- 5. Financial Audit
CREATE TRIGGER trg_financial_audit
ON financial_transactions
AFTER INSERT
AS
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    SELECT recorded_by, 'FINANCIAL_TRANSACTION_CREATED', 'financial_transactions', id,
    '{"type":"' + transaction_type + '","amount":' + CAST(amount AS NVARCHAR) + '}'
    FROM inserted;
END;
GO

-- 6 & 7. Hospital bed counts
CREATE TRIGGER trg_hospital_admit
ON hospital_patients
AFTER INSERT
AS
BEGIN
    UPDATE h
    SET available_beds = available_beds - 1
    FROM hospitals h JOIN inserted i ON h.id = i.hospital_id;
END;
GO

CREATE TRIGGER trg_hospital_discharge
ON hospital_patients
AFTER UPDATE
AS
BEGIN
    IF EXISTS (SELECT 1 FROM inserted i JOIN deleted d ON i.id = d.id 
               WHERE i.status = 'Discharged' AND d.status <> 'Discharged')
    BEGIN
        UPDATE h
        SET available_beds = available_beds + 1
        FROM hospitals h JOIN inserted i ON h.id = i.hospital_id;
    END
END;
GO

-- =====================================================
-- VIEWS
-- =====================================================

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

-- (Remaining views follow same pattern: replace CREATE OR REPLACE with CREATE OR ALTER)
-- Example of view with logic update:
CREATE OR ALTER VIEW vw_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM emergency_reports WHERE status NOT IN ('Resolved','Closed')) AS active_emergencies,
    (SELECT COUNT(*) FROM rescue_teams WHERE status = 'Available') AS available_teams,
    (SELECT COUNT(*) FROM rescue_teams) AS total_teams,
    (SELECT COUNT(*) FROM resources WHERE quantity <= threshold_min) AS low_stock_resources,
    (SELECT ISNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Donation' AND status IN ('Approved','Completed')) AS total_donations,
    (SELECT ISNULL(SUM(amount),0) FROM financial_transactions WHERE transaction_type='Expense' AND status IN ('Approved','Completed')) AS total_expenses;
GO

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_emergency_status ON emergency_reports(status);
CREATE INDEX idx_emergency_severity ON emergency_reports(severity);
CREATE INDEX idx_resource_category ON resources(category);
CREATE INDEX idx_financial_type ON financial_transactions(transaction_type);
CREATE INDEX idx_team_status ON rescue_teams(status);
CREATE INDEX idx_audit_logged_at ON audit_logs(logged_at);