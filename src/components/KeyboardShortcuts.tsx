import { useEffect } from "react";
import { toast } from "sonner";

interface KeyboardShortcutsProps {
  onTogglePlayPause: () => void;
  onGenerate: () => void;
  onDownload: () => void;
  isLoaded: boolean;
  remixGenerated: boolean;
}

const KeyboardShortcuts = ({
  onTogglePlayPause,
  onGenerate,
  onDownload,
  isLoaded,
  remixGenerated,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (isLoaded) {
            onTogglePlayPause();
          }
          break;
        case "KeyG":
          if ((e.metaKey || e.ctrlKey) && isLoaded) {
            e.preventDefault();
            onGenerate();
          }
          break;
        case "KeyD":
          if ((e.metaKey || e.ctrlKey) && remixGenerated) {
            e.preventDefault();
            onDownload();
          }
          break;
        case "Slash":
          if (e.shiftKey) {
            e.preventDefault();
            toast.info(
              <div className="space-y-2">
                <p className="font-semibold">Keyboard Shortcuts</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p><kbd className="px-1 bg-muted rounded">Space</kbd> Play/Pause</p>
                  <p><kbd className="px-1 bg-muted rounded">⌘/Ctrl+G</kbd> Generate Remix</p>
                  <p><kbd className="px-1 bg-muted rounded">⌘/Ctrl+D</kbd> Download</p>
                </div>
              </div>,
              { duration: 5000 }
            );
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlayPause, onGenerate, onDownload, isLoaded, remixGenerated]);

  return null;
};

export default KeyboardShortcuts;
