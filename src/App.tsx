import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import Classes from "./pages/Classes";
import Errors from "./pages/Errors";
import Quiz from "./pages/Quiz";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layout/AppLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="classes" element={<Classes />} />
          <Route path="errors" element={<Errors />} />
          <Route path="quiz/:id" element={<Quiz />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

