import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import RoleRedirect from "./components/RoleRedirect";

import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Errors from "./pages/Errors";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import ClassCourses from "./pages/ClassCourses";
import Quiz from "./pages/Quiz";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* entrée: redirect selon rôle */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        {/* TEACHER */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassCourses />} />
          <Route path="insights" element={<Insights />} />
          <Route path="quiz/:id" element={<Quiz />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/teacher" replace />} />
        </Route>

        {/* STUDENT */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassCourses />} />
          <Route path="errors" element={<Errors />} />
          <Route path="quiz/:id" element={<Quiz />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
