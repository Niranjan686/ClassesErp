import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentLogin from './components/Auth/StudentLogin';
import PublicEnquiryForm from './components/Auth/PublicEnquiryForm';
import Dashboard from './components/Dashboard/Dashboard';
import StudentMaster from './components/Master/StudentMaster';
import BatchMaster from './components/Master/BatchMaster';
import CourseMaster from './components/Master/CourseMaster';
import StaffMaster from './components/Master/StaffMaster';
import AttendanceEntry from './components/Attendance/AttendanceEntry';
import MonthlyAttendance from './components/Attendance/MonthlyAttendance';
import Reports from './components/Reports/Reports';
import ConsumerStudentPortal from './components/StudentPortal/ConsumerStudentPortal';
import StudentMobileApp from './components/StudentApp/StudentMobileApp';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import LeaveManagement from './components/Leave/LeaveManagement';
import ComplaintManagement from './components/Grievance/ComplaintManagement';
import EnquiryManagement from './components/EnquiryCRM/EnquiryManagement';
import FeeManagement from './components/FeeManagement/FeeManagement';
import MarksEntry from './components/Marks/MarksEntry';
import StudentList from './components/Student/StudentList';
import LiveClassStudio from './components/LiveClasses/LiveClassStudio';
import NotesMaster from './components/Notes/NotesMaster';
import DemoScheduler from './components/Demos/DemoScheduler';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/enquiry/:instituteCode" element={<PublicEnquiryForm />} />
      <Route path="/public/enquiry/:instituteCode" element={<PublicEnquiryForm />} />

      {/* Student Mobile App (Mobile Number + OTP Login) */}
      <Route path="/app" element={<StudentMobileApp />} />
      <Route path="/student-app" element={<StudentMobileApp />} />
      <Route path="/mobile" element={<StudentMobileApp />} />
      <Route path="/student/login" element={<StudentMobileApp />} />
      <Route path="/student-portal" element={<ConsumerStudentPortal />} />
      <Route path="/student/*" element={<ConsumerStudentPortal />} />

      {/* Admin Operations & Live Modules */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="/superadmin" element={<SuperAdminDashboard />} />
      <Route path="/live-classes" element={<LiveClassStudio />} />
      <Route path="/study-notes" element={<NotesMaster />} />
      <Route path="/demo-schedule" element={<DemoScheduler />} />
      <Route path="/students" element={<StudentList />} />
      <Route path="/student-master" element={<StudentMaster />} />
      <Route path="/batch-master" element={<BatchMaster />} />
      <Route path="/course-master" element={<CourseMaster />} />
      <Route path="/staff-master" element={<StaffMaster />} />
      <Route path="/fee-management" element={<FeeManagement />} />
      <Route path="/attendance-entry" element={<AttendanceEntry />} />
      <Route path="/attendance-monthly" element={<MonthlyAttendance />} />
      <Route path="/marks-entry" element={<MarksEntry />} />
      <Route path="/leave-management" element={<LeaveManagement />} />
      <Route path="/complaints" element={<ComplaintManagement />} />
      <Route path="/enquiries" element={<EnquiryManagement />} />
      <Route path="/reports" element={<Reports />} />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
