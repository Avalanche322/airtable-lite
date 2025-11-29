import React from "react";
import useRealtime from "../hooks/useRealtime";

const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useRealtime();
  return <>{children}</>;
};

export default RealtimeProvider;
