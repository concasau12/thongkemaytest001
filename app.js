// Cấu hình URL backend (API)
const API_URL = "https://script.google.com/macros/s/AKfycbwTUoINCroDvp87W6xYdlOe-a0uAjAKJF1ykJgmeK7o0xQFq2hO9029BcbiQR497XF1/exec";

// 1️⃣ Ẩn/hiện các tab (section)
function showTab(id) {
  document.querySelectorAll("section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}

// 2️⃣ Xử lý lưu dữ liệu khi submit form
const form = document.getElementById("dataForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Thu thập dữ liệu trong form
    const formData = new FormData(e.target);
    const data = Object.values(Object.fromEntries(formData));

    try {
      const res = await fetch(`${API_URL}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Lỗi khi gửi dữ liệu lên server");

      const result = await res.json();
      if (result.status === "success") {
        alert("✅ Đã lưu thành công!");
        e.target.reset();
        if (typeof loadData === "function") loadData(); // cập nhật danh sách
      } else {
        alert("⚠️ Lưu thất bại: " + (result.message || "Không rõ nguyên nhân"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Không thể kết nối server!");
    }
  });
}

// 3️⃣ Hàm tải dữ liệu từ Google Sheets qua API `/data`
async function loadData() {
  const list = document.getElementById("dataList");
  if (!list) return; // Không có phần hiển thị

  try {
    const res = await fetch(`${API_URL}/data`);
    if (!res.ok) throw new Error("Không lấy được dữ liệu");
    const rows = await res.json();

    if (rows.length === 0) {
      list.innerHTML = "<p>Chưa có dữ liệu nào!</p>";
      return;
    }

    list.innerHTML = rows
      .map(r => `<div class="row-item">${r.join(" / ")}</div>`)
      .join("");
  } catch (err) {
    console.error(err);
    list.innerHTML = "<p style='color:red;'>❌ Lỗi khi tải dữ liệu</p>";
  }
}

// 4️⃣ Hàm tìm kiếm dữ liệu theo từ khóa
async function searchData() {
  const keywordInput = document.getElementById("keyword");
  const resultContainer = document.getElementById("searchResults");

  if (!keywordInput || !resultContainer) return;

  const keyword = keywordInput.value.trim().toLowerCase();
  if (!keyword) {
    resultContainer.innerHTML = "<p>⚠️ Nhập từ khóa để tìm kiếm</p>";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/data`);
    if (!res.ok) throw new Error("Không thể lấy dữ liệu tìm kiếm");

    const rows = await res.json();
    const results = rows.filter(r => r.join(" ").toLowerCase().includes(keyword));

    if (results.length === 0) {
      resultContainer.innerHTML = `<p>❌ Không tìm thấy kết quả cho '${keyword}'</p>`;
    } else {
      resultContainer.innerHTML = results
        .map(r => `<div class="row-item">${r.join(" / ")}</div>`)
        .join("");
    }
  } catch (err) {
    console.error(err);
    resultContainer.innerHTML = "<p style='color:red;'>❌ Lỗi khi tìm kiếm dữ liệu</p>";
  }
}


// 🧠 Hàm tải gợi ý từ backend và gán vào datalist
async function loadSuggestions() {
  try {
    const res = await fetch(`${API_URL}/suggest`);
    if (!res.ok) throw new Error("Không thể lấy danh sách gợi ý từ server");

    const data = await res.json();
    const { tenMay = [], cpu = [], gpu = [] } = data;

    // Gán dữ liệu gợi ý vào các ô nhập
    fillDatalist('tenMayList', tenMay);
    fillDatalist('cpuList', cpu);
    fillDatalist('gpuList', gpu);

    console.log("✅ Đã tải danh sách gợi ý:", { tenMay, cpu, gpu });
  } catch (err) {
    console.error("❌ Lỗi khi tải gợi ý:", err);
  }
}

// 🧩 Hàm đổ dữ liệu vào datalist
function fillDatalist(listId, suggestions) {
  const datalist = document.getElementById(listId);
  if (!datalist) return;

  datalist.innerHTML = suggestions
    .filter(item => item && item.trim() !== "")
    .map(item => `<option value="${item}">`)
    .join("");
}

// 🪄 Khi trang nạp, tự động tải danh sách gợi ý
window.addEventListener("DOMContentLoaded", () => {
  // Nếu trong trang có form nhập liệu thì load gợi ý
  if (document.getElementById("TenMay") || document.getElementById("CPU") || document.getElementById("GPU")) {
    loadSuggestions();
  }

  // Nếu có danh sách dữ liệu thì tải dữ liệu
  if (document.getElementById("dataList")) {
    loadData();
  }
});




// 5️⃣ Khi trang vừa tải, hiển thị dữ liệu nếu có phần #dataList
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("dataList")) {
    loadData();
  }
});
