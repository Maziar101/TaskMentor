import { RouterProvider } from "react-router-dom";
import useRoutesConfig from "./routes";
import { AuthProvider } from "./store/authStore";
import "./App.css";

export default function App() {
  const routes = useRoutesConfig();

  return (
    <AuthProvider>
      <RouterProvider router={routes} />
    </AuthProvider>
  );
}
