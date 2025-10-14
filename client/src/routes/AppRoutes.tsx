import { Navigate, useRoutes } from "react-router-dom";

import AdminLayout from "@/components/admin/AdminLayout";
import CollaboratorLayout from "@/components/collaborator/CollaboratorLayout";
import { Dashboard, Collaborators, Settings } from "@/pages/admin";
import {
  Overview as CollaboratorOverview,
  Profile as CollaboratorProfile,
  Submissions,
} from "@/pages/collaborator";
import {
  Details,
  Home,
  LandmarkMap,
  NotFoundPage,
  Profile,
  SignIn,
  SignUp,
} from "@/pages/customer";

const AppRoutes = () => {
  return useRoutes([
    {
      path: "/admin",
      element: <AdminLayout />,
      children: [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "collaborators", element: <Collaborators /> },
        { path: "settings", element: <Settings /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
    {
      path: "/collaborator",
      element: <CollaboratorLayout />,
      children: [
        { index: true, element: <Navigate to="overview" replace /> },
        { path: "overview", element: <CollaboratorOverview /> },
        { path: "submissions", element: <Submissions /> },
        { path: "profile", element: <CollaboratorProfile /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
    { path: "/", element: <Home /> },
    { path: "/sign-in", element: <SignIn /> },
    { path: "/sign-up", element: <SignUp /> },
    { path: "/profile", element: <Profile /> },
    { path: "/landmark-map", element: <LandmarkMap /> },
    { path: "/landmark-map/:cityId", element: <LandmarkMap /> },
    { path: "/:cityId/details", element: <Details /> },
    { path: "*", element: <NotFoundPage /> },
  ]);
};

export default AppRoutes;
