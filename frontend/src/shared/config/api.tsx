import axiosInstance from "./axiosinstance";

/* =======================
   FORM TYPES (FRONTEND)
======================= */
export type LoginFormData = {
  email: string;
  password: string;
};

/*
⚠️ NOTE:
RegisterFormData यहाँ राख्दैनौँ
किनकि form type ≠ API payload type
*/

/* =======================
   API PAYLOAD TYPES
======================= */
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

/* =======================
   AUTH APIS
======================= */
export const registerApi = (data: RegisterPayload) => {
  return axiosInstance.post("/register", data);
};

export const loginApi = (data: LoginFormData) => {
  return axiosInstance.post("/login", data);
};

/* =======================
   PROTECTED EXAMPLE
======================= */
export const getUserListApi = () => {
  return axiosInstance.get("/user-list");
};
