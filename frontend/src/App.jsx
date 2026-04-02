import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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
        <Route path="/" element={<Home />} />
        <Route path="/all-doctors" element={<AllDoctors />} />
        <Route path="/doctor/:doctorId" element={<DoctorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/clear" element={<ClearStorage />} />

        {/* DASHBOARDS */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/license-verification" element={<DoctorLicenseVerification />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/prescription/:appointmentId" element={<WritePrescription />} />

        <Route path="/patient/setup" element={<PatientSetup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/doctor/specialization/setup" element={<SpecializationSetup />} />
        
        {/* Admin Management Routes */}
        <Route path="/admin/medicines" element={<MedicineManagement />} />
        <Route path="/admin/lab-tests" element={<LabTestManagement />} />
        <Route path="/admin/beds" element={<BedManagement />} />
        <Route path="/admin/database-features" element={<DatabaseFeatures />} />
        
        {/* DEFAULT */}
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
