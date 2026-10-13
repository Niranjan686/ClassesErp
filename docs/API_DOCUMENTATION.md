# CLASSTECH SCHOOL ERP SAAS — REST API SPECIFICATION

**API Version:** 2.0.0  
**Base URL:** `https://your-domain.com/api` (Local: `http://localhost:5000/api`)  
**Format:** JSON  
**Authentication:** HTTP Authorization Header: `Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication & System Health

### 1.1 Server Health & Heartbeat
- **Method:** `GET`
- **Endpoint:** `/health` (also `/ping`, `/status`, `/`)
- **Auth:** None (Public)
- **Response `200 OK`:**
```json
{
  "success": true,
  "status": "HEALTHY",
  "message": "ClassTech Multi-Tenant Educational SaaS ERP Backend is running 🚀",
  "version": "2.0.0",
  "uptimeSeconds": 1420,
  "database": {
    "state": "Connected to MongoDB Atlas",
    "connected": true,
    "name": "SchoolErp"
  }
}
```

### 1.2 User Login (Admin / Staff / SuperAdmin)
- **Method:** `POST`
- **Endpoint:** `/auth/login`
- **Auth:** None
- **Request Body:**
```json
{
  "email": "admin@keerti.classtech.edu",
  "password": "SecurePassword123"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "6aca15cb8f904d9b7cbc1d3a",
    "name": "Niranjan Shukla",
    "email": "admin@keerti.classtech.edu",
    "role": "owner",
    "instituteId": "6aca15cb8f904d9b7cbc1d3a"
  }
}
```

---

## 2. Module 1: Admissions CRM & Application Conversion

### 2.1 Get Admission CRM Dashboard
- **Method:** `GET`
- **Endpoint:** `/enquiries/admission-dashboard`
- **Auth:** Admin
- **Response `200 OK`:**
```json
{
  "success": true,
  "summary": {
    "totalApplications": 48,
    "approved": 32,
    "enrolled": 28,
    "conversionRate": "58.33%"
  },
  "stageFunnel": [
    { "status": "Submitted", "count": 8 },
    { "status": "Interview Scheduled", "count": 8 },
    { "status": "Approved", "count": 4 },
    { "status": "Converted to Student", "count": 28 }
  ]
}
```

### 2.2 Submit Admission Application
- **Method:** `POST`
- **Endpoint:** `/enquiries/applications`
- **Auth:** Admin
- **Request Body:**
```json
{
  "candidateName": "Vivaan Joshi",
  "gender": "Male",
  "dob": "2011-08-20",
  "mobileNo": "9820011223",
  "email": "vivaan.joshi@example.com",
  "fatherName": "Rajesh Joshi",
  "fatherMobileNo": "9820011223",
  "courseId": "6acbe0018f904d9b7cbc1d01",
  "academicYear": "2026-2027"
}
```

### 2.3 Convert Application to Enrolled Student
- **Method:** `POST`
- **Endpoint:** `/enquiries/applications/:id/convert-to-student`
- **Auth:** Admin
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Application converted to Student successfully",
  "student": {
    "_id": "6ad01928f904d9b7cbc1d44",
    "studentId": "STU-0012",
    "grno": "GR-2026-0012",
    "fname": "Vivaan",
    "lname": "Joshi",
    "mobileNo": "9820011223",
    "courseId": "6acbe0018f904d9b7cbc1d01"
  }
}
```

---

## 3. Module 2: Timetable & Substitute Management

### 3.1 Fetch Batch Timetable
- **Method:** `GET`
- **Endpoint:** `/timetable/batch/:batchId?academicYear=2026-2027`
- **Auth:** Staff / Student

### 3.2 Create or Update Schedule Slot (Conflict Detected)
- **Method:** `POST`
- **Endpoint:** `/timetable/slot`
- **Auth:** Admin
- **Request Body:**
```json
{
  "batchId": "6aca15e48f904d9b7cbc1d45",
  "day": "Monday",
  "periodNumber": 1,
  "startTime": "09:00 AM",
  "endTime": "09:45 AM",
  "subject": "Mathematics",
  "teacherId": "6acbe513728c39af041f48d7",
  "roomNo": "Room 101"
}
```
- **Error Response `409 Conflict` (if teacher or room is double-booked):**
```json
{
  "success": false,
  "message": "Teacher Prof. Ramesh Sharma is already assigned to Batch STD10-B in Room 204 at 09:00 AM on Monday"
}
```

### 3.3 Find Available Substitute Teachers
- **Method:** `GET`
- **Endpoint:** `/timetable/available-substitutes?day=Monday&startTime=09:00 AM&date=2026-10-30`
- **Auth:** Admin

---

## 4. Module 3: Examinations & Branded Report Cards

### 4.1 Generate Official Branded Report Card
- **Method:** `GET`
- **Endpoint:** `/exams/report-card/:studentId?examId=6ad01288f904d9b7cbc1d99`
- **Auth:** Admin / Student
- **Response `200 OK`:**
```json
{
  "success": true,
  "institution": {
    "name": "Keerti Computer Classes Malad East",
    "code": "K001",
    "logo": "https://storage.classtech.edu/logos/k001.png"
  },
  "student": {
    "name": "Vivaan Joshi",
    "grno": "GR-2026-0012",
    "course": "Secondary Grade 10",
    "batch": "Grade 10-A (2026)"
  },
  "assessment": {
    "examTitle": "Mid-Term Assessment 2026",
    "theoryObtained": 65,
    "practicalObtained": 28,
    "totalObtained": 93,
    "maxMarks": 100,
    "percentage": 93,
    "grade": "A+ (Distinction)",
    "result": "Passed",
    "rank": 1,
    "facultyRemarks": "Outstanding performance across theory and practicals"
  },
  "attendancePercentage": "96.4%"
}
```

---

## 5. Module 4: Certificates & Student Progression

### 5.1 Issue Official Certificate
- **Method:** `POST`
- **Endpoint:** `/certificates/generate`
- **Auth:** Admin
- **Request Body:**
```json
{
  "studentId": "6ad01928f904d9b7cbc1d44",
  "certificateType": "Bonafide Certificate",
  "purpose": "Passport and Visa Verification",
  "academicYear": "2026-2027"
}
```
- **Response `201 Created`:**
```json
{
  "success": true,
  "certificate": {
    "certificateNo": "CERT-2026-0819",
    "certificateType": "Bonafide Certificate",
    "studentName": "Vivaan Joshi",
    "grno": "GR-2026-0012",
    "status": "Issued",
    "issueDate": "2026-10-12T01:40:47.000Z"
  }
}
```

### 5.2 Bulk Student Batch Promotion
- **Method:** `POST`
- **Endpoint:** `/students/promote-batch`
- **Auth:** Admin
- **Request Body:**
```json
{
  "currentBatchId": "6aca15e48f904d9b7cbc1d45",
  "targetBatchId": "6aca15e48f904d9b7cbc1d99",
  "targetAcademicYear": "2027-2028",
  "promotions": [
    { "studentId": "6ad01928f904d9b7cbc1d44", "action": "Promote" }
  ]
}
```

---

## 6. Module 5: Transport Fleet Management

### 6.1 Assign Student to Bus Route
- **Method:** `POST`
- **Endpoint:** `/transport/assign-student`
- **Auth:** Admin
- **Request Body:**
```json
{
  "studentId": "6ad01928f904d9b7cbc1d44",
  "routeId": "6ad022148f904d9b7cbc1d88",
  "stopName": "Malad Station",
  "monthlyTransportFee": 1500
}
```

### 6.2 Route Passenger Manifest
- **Method:** `GET`
- **Endpoint:** `/transport/manifest/:routeId`
- **Auth:** Admin / Staff (Driver view)

---

## 7. Module 6: Library Management

### 7.1 Issue Book to Student / Staff
- **Method:** `POST`
- **Endpoint:** `/library/issue`
- **Auth:** Admin / Librarian
- **Request Body:**
```json
{
  "accessionNumber": "ACC-90412",
  "borrowerId": "6ad01928f904d9b7cbc1d44",
  "borrowerType": "Student",
  "loanDays": 14
}
```

### 7.2 Return Book & Calculate Overdue Fine
- **Method:** `POST`
- **Endpoint:** `/library/return`
- **Auth:** Admin / Librarian
- **Request Body:**
```json
{
  "issueRecordId": "6ad033288f904d9b7cbc1d77",
  "receivedCondition": "Good"
}
```

---

## 8. Module 7: Inventory & Asset Procurement

### 8.1 Goods Receipt for Purchase Order
- **Method:** `PATCH`
- **Endpoint:** `/inventory/orders/:id/receive`
- **Auth:** Admin
- **Description:** Automatically increments current stock quantities across all items included in the purchase order and marks status as `Goods Received`.

---

## 9. Module 8: Calendar & PTM Scheduling

### 9.1 Book PTM Slot
- **Method:** `POST`
- **Endpoint:** `/calendar/ptm-slots/:id/book`
- **Auth:** Student / Parent
- **Request Body:**
```json
{
  "purpose": "Review mid-term examination performance",
  "parentContact": "9820011223"
}
```

---

## 10. Module 9: Communication Centre & Circulars

### 10.1 Acknowledge Official Circular
- **Method:** `POST`
- **Endpoint:** `/announcements/:id/acknowledge`
- **Auth:** Student / Parent
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Circular acknowledged successfully",
  "acknowledgedAt": "2026-10-12T01:40:47.000Z"
}
```

---

## 11. Module 10: ID Cards & Gate Passes

### 11.1 Issue Early Exit Gate Pass
- **Method:** `POST`
- **Endpoint:** `/gatepass/student-pass`
- **Auth:** Admin / Staff
- **Request Body:**
```json
{
  "studentId": "6ad01928f904d9b7cbc1d44",
  "reason": "Doctor appointment for dental procedure",
  "pickupPersonName": "Rajesh Joshi",
  "pickupPersonPhone": "9820011223"
}
```

---

## 12. Module 11: RFID & Biometric Terminal Ingestion

### 12.1 Raw Hardware Ingestion Hook (ZKTeco / eSSL / RFID)
- **Method:** `POST`
- **Endpoint:** `/attendance/device-event`
- **Auth:** Device API Key / Shared Secret Header `x-device-key`
- **Request Body:**
```json
{
  "deviceId": "DEV-NORTH-GATE-01",
  "identifier": "RFID-994412",
  "punchType": "IN",
  "timestamp": "2026-10-12T08:15:30.000Z"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "status": "Processed",
  "studentName": "Vivaan Joshi",
  "inTime": "08:15 AM",
  "debounced": false
}
```
*(Note: If identical punch received within 5 minutes, returns `status: "Duplicate Ignored", debounced: true`)*

---

## 13. Module 14: SaaS Multi-Tenant Billing

### 13.1 Upgrade Institute Subscription Plan
- **Method:** `POST`
- **Endpoint:** `/saas/subscription/upgrade`
- **Auth:** SuperAdmin / Institute Owner
- **Request Body:**
```json
{
  "planCode": "GROWTH-2026",
  "billingCycle": "Annual"
}
```

---

## 14. Module 15: School Expenses & Operating Cashbook

### 14.1 Financial Cashbook Summary
- **Method:** `GET`
- **Endpoint:** `/expenses/cashbook-summary?startDate=2026-04-01&endDate=2027-03-31`
- **Auth:** Admin
- **Response `200 OK`:**
```json
{
  "success": true,
  "financialYear": "2026-2027",
  "summary": {
    "totalFeeIncome": 850000,
    "totalOperationalExpenses": 320000,
    "netOperatingSurplus": 530000,
    "operatingMargin": "62.35%"
  },
  "expenseBreakdown": [
    { "category": "Staff Salaries & Wages", "amount": 210000 },
    { "category": "Campus Rent & Building", "amount": 60000 },
    { "category": "Electricity, Water & Utilities", "amount": 25000 },
    { "category": "Transport Fuel & Bus Maintenance", "amount": 25000 }
  ]
}
```
