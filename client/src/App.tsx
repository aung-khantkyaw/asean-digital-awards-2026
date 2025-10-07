import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import LandmarkMap from "./LandmarkMap";
import Home from "./Home";
import SignupPage from "./SignUp";
import NotFoundPage from "./NotFoundPage";
import LoginPage from "./SignIn";
import Details from "./Details";
import AdminDashboard from "./AdminDashboard";
import Profile from "./Profile";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/sign-in" element={<LoginPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/:cityId/details" element={<Details />} />
        <Route path="/landmark-map" element={<LandmarkMap />} />
        <Route path="/landmark-map/:cityId" element={<LandmarkMap />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
