import axiosInstance from "./axiosinstance";

// =======================
// TYPES
// =======================
export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

// =======================
// AUTH APIS
// =======================
export const registerApi = (data: RegisterFormData) => {
  return axiosInstance.post("/register", data);
};

export const loginApi = (data: LoginFormData) => {
  return axiosInstance.post("/login", data);
};

// =======================
// PROTECTED EXAMPLE
// =======================
export const getUserListApi = () => {
  return axiosInstance.get("/user-list");
};
