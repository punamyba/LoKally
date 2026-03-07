import axiosInstance from "./axiosinstance";

/* FORM TYPES */
export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  gender: "Male" | "Female" | "Other";
  password: string;
  confirm_password: string;
};

/* AUTH APIS */
export const registerApi = (data: RegisterPayload) => {
  return axiosInstance.post("/auth/register", data);
};

export const loginApi = (data: LoginFormData) => {
  return axiosInstance.post("/auth/login", data);
};

/* PROTECTED EXAMPLE */
export const getUserListApi = () => {
  return axiosInstance.get("/user-list");
};