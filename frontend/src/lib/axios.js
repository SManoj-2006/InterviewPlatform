import axios from "axios";


const axiosInstance = axios.create({
    // Same-origin "/api" by default so a production build works on any domain
    // (e.g. backend serving frontend/dist). Override with VITE_API_URL for
    // split deployments.
    baseURL: import.meta.env.VITE_API_URL || "/api",
    withCredentials:true //by using this field browser will send cookies to the server automatically in every single request
})

let getAuthToken = null;

export const configureAuthToken = (tokenGetter) => {
    getAuthToken = tokenGetter;
};

axiosInstance.interceptors.request.use(async (config) => {
    if (getAuthToken) {
        const token = await getAuthToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default axiosInstance;