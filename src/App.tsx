import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";
import RoleRedirect from "./components/RoleRedirect";

// Teacher pages
import HomeTeacher from "./pages/teacher/HomeTeacher";
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

// Student pages (web adaptation of studeasy-v2)
import StudentHome from "./pages/student/StudentHome";
import StudentClasses from "./pages/student/StudentClasses";
import StudentClassSubjects from "./pages/student/StudentClassSubjects";
import StudentRank from "./pages/student/StudentRank";
import ProfileStudent from "./pages/student/ProfileStudent";
import StudentQuiz from "./pages/student/StudentQuiz";

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
          {/* ✅ Teacher landing -> Home */}
          <Route index element={<Navigate to="home" replace />} />

          {/* ✅ Home */}
          <Route path="home" element={<HomeTeacher />} />

          {/* Classes */}
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
          {/* Student landing */}
          <Route index element={<Navigate to="home" replace />} />

          <Route path="home" element={<StudentHome />} />
          <Route path="classes" element={<StudentClasses />} />
          <Route path="classes/:classId" element={<StudentClassSubjects />} />

          {/* Studeasy-v2: tab "rank" = erreurs/mistakes */}
          <Route path="rank" element={<StudentRank />} />

          <Route path="profile" element={<ProfileStudent />} />

          {/* Student quiz */}
          <Route path="quiz/:subjectId" element={<StudentQuiz />} />

          <Route path="*" element={<Navigate to="/student" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
