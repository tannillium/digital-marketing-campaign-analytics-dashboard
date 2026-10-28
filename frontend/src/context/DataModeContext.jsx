import { createContext, useContext, useEffect, useState } from "react";
import { getDataMode, subscribeDataMode } from "../api/client";

const Context = createContext("loading");
export function DataModeProvider({ children }) {
  const [mode, setMode] = useState(getDataMode());
  useEffect(() => subscribeDataMode(setMode), []);
  return <Context.Provider value={mode}>{children}</Context.Provider>;
}
export const useDataMode = () => useContext(Context);
