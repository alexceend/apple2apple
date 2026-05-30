import { app as s, ipcMain as c, BrowserWindow as l } from "electron";
import { fileURLToPath as v } from "node:url";
import { existsSync as m, readFileSync as g, mkdirSync as _, writeFileSync as w } from "node:fs";
import e, { dirname as P, join as R } from "node:path";
const a = {
  serverUrl: "",
  serverToken: ""
};
function d() {
  return R(s.getPath("userData"), "settings.json");
}
function S() {
  const n = d();
  if (!m(n))
    return a;
  try {
    const t = g(n, "utf-8"), o = JSON.parse(t);
    return {
      serverUrl: typeof o.serverUrl == "string" ? o.serverUrl : "",
      serverToken: typeof o.serverToken == "string" ? o.serverToken : ""
    };
  } catch {
    return a;
  }
}
function T(n) {
  const t = d();
  return _(P(t), {
    recursive: !0
  }), w(
    t,
    JSON.stringify(n, null, 2),
    "utf-8"
  ), n;
}
const p = e.dirname(v(import.meta.url));
process.env.APP_ROOT = e.join(p, "..");
const i = process.env.VITE_DEV_SERVER_URL, O = e.join(process.env.APP_ROOT, "dist-electron"), f = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? e.join(process.env.APP_ROOT, "public") : f;
let r;
c.handle("settings:load", async () => S());
c.handle("settings:save", async (n, t) => T(t));
function u() {
  r = new l({
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(p, "preload.mjs")
    }
  }), r.webContents.on("did-finish-load", () => {
    r?.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? r.loadURL(i) : r.loadFile(e.join(f, "index.html"));
}
s.on("window-all-closed", () => {
  process.platform !== "darwin" && (s.quit(), r = null);
});
s.on("activate", () => {
  l.getAllWindows().length === 0 && u();
});
s.whenReady().then(u);
export {
  O as MAIN_DIST,
  f as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
