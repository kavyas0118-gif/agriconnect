/**
 * Google Sheets Integration via Google Apps Script Web App
 *
 * HOW TO SET UP:
 * 1. Go to https://script.google.com and create a new project
 * 2. Paste the Apps Script code below into the editor
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 4. Copy the Web App URL and set it as VITE_SHEETS_WEBHOOK_URL in your .env file
 *
 * --- Google Apps Script Code (paste into script.google.com) ---
 *
 * function doPost(e) {
 *   var sheet = SpreadsheetApp.openById("YOUR_SPREADSHEET_ID").getActiveSheet();
 *   var data = JSON.parse(e.postData.contents);
 *
 *   if (data.action === "login") {
 *     sheet.appendRow([
 *       data.id, data.name, data.email, data.loginTime, "", data.lat || "", data.lng || ""
 *     ]);
 *   } else if (data.action === "logout") {
 *     var rows = sheet.getDataRange().getValues();
 *     for (var i = rows.length - 1; i >= 1; i--) {
 *       if (rows[i][0] === data.id && !rows[i][4]) {
 *         sheet.getRange(i + 1, 5).setValue(data.logoutTime);
 *         break;
 *       }
 *     }
 *   }
 *
 *   return ContentService.createTextOutput("OK");
 * }
 *
 * --- Spreadsheet Columns ---
 * A: User ID | B: Name | C: Email | D: Login Time | E: Logout Time | F: Latitude | G: Longitude
 */

const WEBHOOK_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined;

export interface LoginLogData {
  id: string;
  name: string;
  email: string;
  loginTime: string;
  lat?: number | null;
  lng?: number | null;
}

export interface LogoutLogData {
  id: string;
  logoutTime: string;
}

const postToSheets = async (payload: object): Promise<void> => {
  if (!WEBHOOK_URL) {
    console.warn("[SheetsService] VITE_SHEETS_WEBHOOK_URL not set. Skipping Google Sheets logging.");
    return;
  }

  try {
    // Using no-cors mode since Apps Script doesn't return CORS headers by default
    await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[SheetsService] Failed to log to Google Sheets:", err);
  }
};

export const logLoginToSheets = (data: LoginLogData): Promise<void> => {
  return postToSheets({ action: "login", ...data });
};

export const logLogoutToSheets = (data: LogoutLogData): Promise<void> => {
  return postToSheets({ action: "logout", ...data });
};
