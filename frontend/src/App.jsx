import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PatientDashboard from "./pages/Profile";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorSetup from "./pages/DoctorSetup";
import PatientSetup from "./pages/PatientSetup";
import AdminDashboard from "./pages/AdminDashboard";
import SpecializationSetup from "./pages/SpecializationSetup";
import DoctorTimeSlots from "./pages/DoctorTimeSlots";
import MedicineManagement from "./pages/MedicineManagement";
import LabTestManagement from "./pages/LabTestManagement";
import BedManagement from "./pages/BedManagement";
import DatabaseFeatures from "./pages/DatabaseFeatures";
import ClearStorage from "./pages/ClearStorage";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/clear" element={<ClearStorage />} />

        {/* DASHBOARDS */}
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />

        <Route path="/doctor/setup" element={<DoctorSetup />} />
        <Route path="/patient/setup" element={<PatientSetup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/doctor/specialization/setup" element={<SpecializationSetup />} />
        <Route path="/doctor/timeslots" element={<DoctorTimeSlots />} />
        
        {/* Admin Management Routes */}
        <Route path="/admin/medicines" element={<MedicineManagement />} />
        <Route path="/admin/lab-tests" element={<LabTestManagement />} />
        <Route path="/admin/beds" element={<BedManagement />} />
        <Route path="/admin/database-features" element={<DatabaseFeatures />} />
        
        {/* DEFAULT */}
        <Route path="*" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
