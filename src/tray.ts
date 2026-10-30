import { defaultWindowIcon } from "@tauri-apps/api/app";
import {
  CheckMenuItem,
  Menu,
  PredefinedMenuItem,
} from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";

/**
 * The system tray icon of the notebook.
 *
 * The notebook has no title bar, so the tray is the only way back to it once
 * it is hidden. This module builds the native menu and reports what the player
 * picked; it never reads or writes the app state itself.
 */

export interface TrayCallbacks {
  /** The always-on-top setting the tray should start with. */
  alwaysOnTop: boolean;
  /** Called when the player ticks or unticks "Always on top". */
  onAlwaysOnTopChange: (alwaysOnTop: boolean) => void;
  /** Called when the player picks Quit. */
  onQuit: () => void;
}

/** Keep the handle alive for as long as the app runs. */
let tray: TrayIcon | null = null;

/** Build the tray icon and its menu. */
export async function createTray(callbacks: TrayCallbacks): Promise<TrayIcon> {
  const notebook = getCurrentWindow();

  // A check item keeps its own tick, so read it back after the click.
  const alwaysOnTopItem = await CheckMenuItem.new({
    id: "always-on-top",
    text: "Always on top",
    checked: callbacks.alwaysOnTop,
    action: () => {
      void alwaysOnTopItem.isChecked().then((checked) => {
        callbacks.onAlwaysOnTopChange(checked);
      });
    },
  });

  const separator = await PredefinedMenuItem.new({ item: "Separator" });

  const menu = await Menu.new({
    items: [
      {
        id: "show-hide",
        text: "Show / Hide",
        action: () => {
          void (async () => {
            if (await notebook.isVisible()) {
              await notebook.hide();
            } else {
              await notebook.show();
              await notebook.setFocus();
            }
          })();
        },
      },
      separator,
      alwaysOnTopItem,
      {
        id: "quit",
        text: "Quit",
        action: () => {
          callbacks.onQuit();
        },
      },
    ],
  });

  tray = await TrayIcon.new({
    icon: (await defaultWindowIcon()) ?? undefined,
    menu,
    tooltip: "Testpets",
  });
  return tray;
}
