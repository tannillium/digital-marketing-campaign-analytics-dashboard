import { useDataMode } from "../context/DataModeContext";

export default function OfflineNotice() {
  return useDataMode() === "offline" ? <div className="offline-notice" role="status">Offline mode: using local data</div> : null;
}
