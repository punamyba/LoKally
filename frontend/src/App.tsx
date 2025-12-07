import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./features/auth/Login/login";
import Register from "./features/auth/Register/register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
