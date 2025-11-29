import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:4000/api",
});

export default {
  get: axiosInstance.get,
  post: axiosInstance.post,
  put: axiosInstance.put,
  delete: axiosInstance.delete,
  patch: axiosInstance.patch,
};