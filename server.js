import express from "express";
import { google } from "googleapis";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ⚙️ Thông tin Google Sheet
const SHEET_ID = "1TVjE09Rnv4zuH6IikFAjcNdH2_ahdW2fXlqw62dyLlk";
const SHEET_NAME = "Thongke";

// 🔑 Kết nối Google API
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// 📄 API: Lấy dữ liệu
app.get("/data", async (req, res) => {
  try {
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1:T1000`,
    });
    res.json(result.data.values || []);
  } catch (err) {
    console.error("❌ Lỗi lấy dữ liệu:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 📝 API: Ghi dữ liệu mới vào hàng TRỐNG ĐẦU TIÊN (A–N)
app.post("/add", async (req, res) => {
  const newRow = req.body; // Dữ liệu mảng ["Ngày", "Tên máy", "CPU", ...]

  try {
    // Lấy dữ liệu hiện có trong vùng A2:O1000
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:O1000`,
    });

    const rows = result.data.values || [];

    // 🔍 Tìm hàng trống đầu tiên từ trên xuống
    let emptyRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasData = row && row.some(cell => cell && cell.toString().trim() !== "");
      if (!hasData) {
        emptyRowIndex = i + 2; // +2 vì vùng bắt đầu từ A2
        break;
      }
    }

    // Nếu không tìm thấy hàng trống => ghi vào hàng kế tiếp cuối cùng
    const nextRow = emptyRowIndex === -1 ? rows.length + 2 : emptyRowIndex;

    // Xác định vùng A–N tương ứng với hàng cần ghi
    const range = `${SHEET_NAME}!A${nextRow}:O${nextRow}`;

    // ✏️ Ghi dữ liệu
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [newRow] },
    });

    console.log(`✅ Đã ghi dữ liệu vào hàng ${nextRow}`);
    res.json({ status: "success", message: `Đã ghi dữ liệu vào hàng ${nextRow}` });

  } catch (err) {
    console.error("❌ Lỗi khi ghi dữ liệu:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});


// 📦 API: Trả danh sách gợi ý từ cột R, S, T (Tên máy, CPU, GPU)
app.get("/suggest", async (req, res) => {
  try {
    // Lấy dữ liệu từ 3 cột R, S, T (từ hàng 2 trở đi)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!R2:T1000`,
    });

    const values = response.data.values || [];
    const tenMaySet = new Set();
    const cpuSet = new Set();
    const gpuSet = new Set();

    // Duyệt từng hàng trong bảng để thu thập dữ liệu không trùng
    values.forEach(row => {
      if (row[0]) tenMaySet.add(row[0].trim());
      if (row[1]) cpuSet.add(row[1].trim());
      if (row[2]) gpuSet.add(row[2].trim());
    });

    // Chuyển Set thành mảng trước khi trả về JSON
    res.json({
      tenMay: Array.from(tenMaySet),
      cpu: Array.from(cpuSet),
      gpu: Array.from(gpuSet)
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu gợi ý:", err.message);
    res.status(500).json({ error: "Không thể lấy danh sách gợi ý" });
  }
});



// 🟢 Endpoint: Lấy gợi ý cho các ô nhập (Tên máy, CPU, GPU)
app.get("/suggest", async (req, res) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!R2:T1000`, // 🔹 Lấy dữ liệu từ cột R, S, T
    });

    const values = response.data.values || [];
    const tenMay = [];
    const cpu = [];
    const gpu = [];

    // Duyệt từng hàng trong bảng
    values.forEach(row => {
      if (row[0] && !tenMay.includes(row[0])) tenMay.push(row[0]);
      if (row[1] && !cpu.includes(row[1])) cpu.push(row[1]);
      if (row[2] && !gpu.includes(row[2])) gpu.push(row[2]);
    });

    res.json({ tenMay, cpu, gpu });
  } catch (err) {
    console.error("❌ Lỗi khi lấy dữ liệu gợi ý:", err);
    res.status(500).json({ error: "Không lấy được gợi ý" });
  }
});

// 🚀 Khởi chạy server
app.listen(3000, () => console.log("✅ Server chạy tại: http://localhost:3000"));
