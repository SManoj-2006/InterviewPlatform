import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useEffect, useRef } from "react";
import { Loader2Icon, PlayIcon, RefreshCwIcon, WifiIcon, WifiOffIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

function LiveStatusBadge({ isLive, collabError }) {
  if (collabError) {
    return (
      <span className="badge badge-warning badge-sm gap-1" title="Live sync unavailable — using manual mode">
        <WifiOffIcon className="size-3" />
        Offline mode
      </span>
    );
  }
  return isLive ? (
    <span className="badge badge-success badge-sm gap-1" title="Edits sync live with your peer">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-success" />
      </span>
      Live
    </span>
  ) : (
    <span className="badge badge-ghost badge-sm gap-1" title="Establishing live sync…">
      <Loader2Icon className="size-3 animate-spin" />
      Connecting…
    </span>
  );
}

function CodeEditorPanel({
  selectedLanguage,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  onRefreshCode,
  isRefreshing,
  // live-collab props (optional — panel falls back to legacy mode without them)
  yText = null,
  awareness = null,
  isLive = false,
  collabError = false,
}) {
  const bindingRef = useRef(null);
  const collabMode = isLive && yText;

  // Bind the Yjs shared text to the Monaco model for real-time collaboration.
  // Remote cursors/selections render via the awareness protocol.
  const handleEditorMount = (editor) => {
    if (collabMode && awareness) {
      bindingRef.current = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awareness
      );
    }
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
  }, [collabMode]);

  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-base-100 border-t border-base-300">
        <div className="flex items-center gap-3">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-6"
          />
          <select className="select select-sm" value={selectedLanguage} onChange={onLanguageChange}>
            {Object.entries(LANGUAGE_CONFIG).map(([key, lang]) => (
              <option key={key} value={key}>
                {lang.name}
              </option>
            ))}
          </select>
          <LiveStatusBadge isLive={isLive} collabError={collabError} />
        </div>

        <div className="flex items-center gap-2">
          {!collabMode && (
            <button
              className="btn btn-ghost btn-sm gap-2"
              disabled={isRefreshing}
              onClick={onRefreshCode}
              title="Load the latest shared code"
            >
              <RefreshCwIcon className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Code
            </button>
          )}
          <button className="btn btn-primary btn-sm gap-2" disabled={isRunning} onClick={onRunCode}>
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayIcon className="size-4" />
                Run Code
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        {collabMode ? (
          // Live mode: Yjs drives the editor model — no value/onChange props,
          // or React would fight the MonacoBinding on every keystroke.
          <Editor
            key="collab-editor"
            height={"100%"}
            language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{
              fontSize: 16,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              minimap: { enabled: false },
            }}
          />
        ) : (
          <Editor
            key="legacy-editor"
            height={"100%"}
            language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
            value={code}
            onChange={onCodeChange}
            theme="vs-dark"
            options={{
              fontSize: 16,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              minimap: { enabled: false },
            }}
          />
        )}
      </div>
    </div>
  );
}
export default CodeEditorPanel;
