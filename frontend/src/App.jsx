import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import AllDoctors from "./pages/AllDoctors";
import DoctorProfile from "./pages/DoctorProfile";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorLicenseVerification from "./pages/DoctorLicenseVerification";
import PatientSetup from "./pages/PatientSetup";
import AdminDashboard from "./pages/AdminDashboard";
import SpecializationSetup from "./pages/SpecializationSetup";
import WritePrescription from "./pages/WritePrescription";
import MedicineManagement from "./pages/MedicineManagement";
import LabTestManagement from "./pages/LabTestManagement";
import BedManagement from "./pages/BedManagement";
import DatabaseFeatures from "./pages/DatabaseFeatures";
import ClearStorage from "./pages/ClearStorage";


function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/all-doctors" element={<AllDoctors />} />
        <Route path="/doctor/:doctorId" element={<DoctorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/clear" element={<ClearStorage />} />

        {/* PATIENT PROTECTED ROUTES */}
        <Route 
          path="/patient/dashboard" 
          element={
            <ProtectedRoute requiredRole="PATIENT">
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/patient/setup" 
          element={
            <ProtectedRoute requiredRole="PATIENT">
              <PatientSetup />
            </ProtectedRoute>
          } 
        />

        {/* DOCTOR PROTECTED ROUTES */}
        <Route 
          path="/doctor/license-verification" 
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <DoctorLicenseVerification />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/prescription/:appointmentId" 
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <WritePrescription />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/doctor/specialization/setup" 
          element={
            <ProtectedRoute requiredRole="DOCTOR">
              <SpecializationSetup />
            </ProtectedRoute>
          } 
        />

        {/* ADMIN PROTECTED ROUTES */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/medicines" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <MedicineManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/lab-tests" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <LabTestManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/beds" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <BedManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/database-features" 
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DatabaseFeatures />
            </ProtectedRoute>
          } 
        />
        
        {/* DEFAULT */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
