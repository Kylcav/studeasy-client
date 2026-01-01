import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import RoleRedirect from "./components/RoleRedirect";

// Teacher pages
import ClassesTeacher from "./pages/teacher/ClassesTeacher";
import ClassChaptersTeacher from "./pages/teacher/ClassChaptersTeacher";
import InviteStudentsTeacher from "./pages/teacher/InviteStudentsTeacher";
import ViewStudentsTeacher from "./pages/teacher/ViewStudentsTeacher";
import AddChapterTeacher from "./pages/teacher/AddChapterTeacher";
import InsightsTeacher from "./pages/teacher/InsightsTeacher";
import ProfileTeacher from "./pages/teacher/ProfileTeacher";

// Teacher quiz pages
import GeneratedQuestionsTeacher from "./pages/teacher/GeneratedQuestionsTeacher";
import ViewQuizTeacher from "./pages/teacher/ViewQuizTeacher";

// Shared / Student pages
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Errors from "./pages/Errors";
import ClassCourses from "./pages/ClassCourses";
import Quiz from "./pages/Quiz";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Entrée: redirect selon rôle */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleRedirect />
            </ProtectedRoute>
          }
        />

        {/* =========================
            TEACHER
           ========================= */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Teacher landing */}
          <Route index element={<Navigate to="classes" replace />} />

          <Route path="classes" element={<ClassesTeacher />} />
          <Route path="classes/:classId" element={<ClassChaptersTeacher />} />
          <Route path="classes/:classId/invite" element={<InviteStudentsTeacher />} />
          <Route path="classes/:classId/students" element={<ViewStudentsTeacher />} />
          <Route path="classes/:classId/add-chapter" element={<AddChapterTeacher />} />

          {/* Quiz flow teacher */}
          <Route
            path="classes/:classId/generated-questions/:subjectId"
            element={<GeneratedQuestionsTeacher />}
          />
          <Route
            path="classes/:classId/view-quiz/:subjectId"
            element={<ViewQuizTeacher />}
          />

          <Route path="insights" element={<InsightsTeacher />} />
          <Route path="profile" element={<ProfileTeacher />} />

          <Route path="*" element={<Navigate to="/teacher" replace />} />
        </Route>

        {/* =========================
            STUDENT
           ========================= */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="subjects" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="classes/:classId" element={<ClassCourses />} />
          <Route path="errors" element={<Errors />} />

          {/* Student quiz */}
          <Route path="quiz/:id" element={<Quiz />} />

          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
