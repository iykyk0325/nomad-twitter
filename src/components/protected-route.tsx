import { Navigate } from "react-router";

import { auth } from "../firebase";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = auth.currentUser;
  if (user === null) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;
