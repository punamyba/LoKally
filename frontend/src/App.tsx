import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./features/auth/Login/login";
import Register from "./features/auth/Register/register";
import Dashboard from "./features/auth/Dashboard/dashboard";
import AuthGuard from "./shared/guards/authGuard";
import Home from "./features/auth/Home/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Home></Home>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
