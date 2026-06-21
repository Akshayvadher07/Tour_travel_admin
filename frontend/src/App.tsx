import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./layout/AdminLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { DestinationFormPage } from "./pages/DestinationFormPage";
import { DestinationListPage } from "./pages/DestinationListPage";
import { TravelPlanListPage } from "./pages/TravelPlanListPage";
import { TourFormPage } from "./pages/TourFormPage";
import { TourListPage } from "./pages/TourListPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="destinations" element={<DestinationListPage />} />
          <Route path="destinations/new" element={<DestinationFormPage />} />
          <Route path="destinations/:id/edit" element={<DestinationFormPage />} />
          <Route path="travel-plans" element={<TravelPlanListPage />} />
          <Route path="tours" element={<TourListPage />} />
          <Route path="tours/new" element={<TourFormPage />} />
          <Route path="tours/:id/edit" element={<TourFormPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
