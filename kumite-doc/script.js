let scoreAO = 0,
  scoreAK = 0,
  sAO = false,
  sAK = false;

//ĐỒNG HỒ ĐẾM NGƯỢC
let timeRemaining = 60;
let lastInputValue = 60;
// Giá trị ĐƯỢC CHỌN TỪ DROPDOWN gần nhất - RIÊNG BIỆT với lastInputValue
// (là giá trị ĐANG áp dụng, có thể đến từ gõ tay). RESET TIME dùng biến
// này, không dùng lastInputValue.
let lastDropdownValue = 60;
let tickCount = 10;
let mainInterval = null;
let isTickPaused = false;
let finalTickRunning = false;
let finalTickInterval = null;

// Cập nhật nhấp nháy khi điểm thay đổi hoặc tick thay đổi
function recalculateBlink() {
  checkWinnerBlink();
  updateHBlink();
  checkTimeAndTickEnd();
}

function updateScore(p, val) {
  if (p === "AO") {
    if (scoreAO + val >= 0) scoreAO += val;
    document.getElementById("scoreAO").querySelector(".score-value").innerText =
      scoreAO;
  } else {
    if (scoreAK + val >= 0) scoreAK += val;
    document.getElementById("scoreAK").querySelector(".score-value").innerText =
      scoreAK;
  }
  recalculateBlink();
}

function checkWinnerBlink() {
  const boxAO = document.getElementById("scoreAO");
  const boxAK = document.getElementById("scoreAK");

  // clear trạng thái cũ
  boxAO.classList.remove("blink");
  boxAK.classList.remove("blink");

  // đếm số lỗi của mỗi VĐV
  let faultsAO = document.querySelectorAll(
    '.fault-btn.active[data-side="AO"]',
  ).length;
  let faultsAK = document.querySelectorAll(
    '.fault-btn.active[data-side="AK"]',
  ).length;

  // kiểm tra điều kiện thắng tuyệt đối
  if (scoreAO - scoreAK >= 8 && faultsAO < 5) {
    boxAO.classList.add("blink");
  } else if (scoreAK - scoreAO >= 8 && faultsAK < 5) {
    boxAK.classList.add("blink");
  }
}

function toggleS(p) {
  if (p === "AO") {
    sAO = !sAO;
    document.getElementById("cornerS-AO").style.display = sAO
      ? "block"
      : "none";
  } else {
    sAK = !sAK;
    document.getElementById("cornerS-AK").style.display = sAK
      ? "block"
      : "none";
  }

  recalculateBlink();
}

function switchColor() {
  const boxA = document.getElementById("scoreAO");
  const boxB = document.getElementById("scoreAK");

  // Đổi màu nền
  const colorA = window.getComputedStyle(boxA).backgroundColor;
  const colorB = window.getComputedStyle(boxB).backgroundColor;
  boxA.style.backgroundColor = colorB;
  boxB.style.backgroundColor = colorA;

  // Đổi tên
  const nameAOInput = document.getElementById("nameAO");
  const nameAKInput = document.getElementById("nameAK");
  const tempName = nameAOInput.value;
  nameAOInput.value = nameAKInput.value;
  nameAKInput.value = tempName;

  // Đổi điểm (đổi cả biến state lẫn hiển thị)
  const tempScore = scoreAO;
  scoreAO = scoreAK;
  scoreAK = tempScore;
  boxA.querySelector(".score-value").innerText = scoreAO;
  boxB.querySelector(".score-value").innerText = scoreAK;

  // Đổi cờ S
  const tempS = sAO;
  sAO = sAK;
  sAK = tempS;
  document.getElementById("cornerS-AO").style.display = sAO ? "block" : "none";
  document.getElementById("cornerS-AK").style.display = sAK ? "block" : "none";

  // Đổi trạng thái lỗi (active) giữa các cặp nút CÙNG LOẠI (C1<->C1, C2<->C2, H<->H...)
  // So khớp theo textContent vì thứ tự nút trong DOM của 2 bên bị đảo ngược (không cùng index)
  const aoButtons = document.querySelectorAll('.fault-btn[data-side="AO"]');
  const akButtons = Array.from(
    document.querySelectorAll('.fault-btn[data-side="AK"]'),
  );
  aoButtons.forEach((aoBtn) => {
    const label = aoBtn.textContent.trim();
    const akBtn = akButtons.find((b) => b.textContent.trim() === label);
    if (!akBtn) return;
    const aoActive = aoBtn.classList.contains("active");
    const akActive = akBtn.classList.contains("active");
    aoBtn.classList.toggle("active", akActive);
    akBtn.classList.toggle("active", aoActive);
  });

  // Tính lại toàn bộ hiệu ứng nhấp nháy sau khi đổi (xem recalculateBlink())

  boxA.classList.remove("blink");
  boxB.classList.remove("blink");
  recalculateBlink();
}

// Cập nhật nhấp nháy khi có lỗi H
function updateHBlink() {
  // Xác định xem bên nào có lỗi H đang bật
  const isHAO = Array.from(
    document.querySelectorAll('.fault-btn.active[data-side="AO"]'),
  ).some((btn) => btn.textContent.trim() === "H");
  const isHAK = Array.from(
    document.querySelectorAll('.fault-btn.active[data-side="AK"]'),
  ).some((btn) => btn.textContent.trim() === "H");

  if (isHAO && isHAK) {
    // Nếu cả hai bên đều có H, xóa nhấp nháy của cả hai bên
    document.getElementById("scoreAO").classList.remove("blink");
    document.getElementById("scoreAK").classList.remove("blink");
  } else if (isHAO) {
    document.getElementById("scoreAO").classList.remove("blink");
    document.getElementById("scoreAK").classList.add("blink");
  } else if (isHAK) {
    document.getElementById("scoreAK").classList.remove("blink");
    document.getElementById("scoreAO").classList.add("blink");
  }
}

// Toggle hiển thị C1/C2/H...
document.querySelectorAll(".fault-btn").forEach((btn) => {
  // bỏ qua PENALTY
  if (btn.classList.contains("no-click")) return;
  btn.addEventListener("click", function () {
    btn.classList.toggle("active");

    const isH = btn.textContent.trim() === "H";
    if (isH) {
      // Nếu là lỗi H, cập nhật nhấp nháy dựa trên trạng thái H của cả hai bên
      // Xóa nhấp nháy cũ trước khi tính lại
      document.getElementById("scoreAO").classList.remove("blink");
      document.getElementById("scoreAK").classList.remove("blink");

      recalculateBlink();
    }
  });
});

function stopTick(forceZero = false) {
  clearInterval(mainInterval);
  mainInterval = null;

  if (forceZero) {
    tickCount = 0;
    document.getElementById("tickDisplay").textContent = "0";
    isTickPaused = false;
  } else {
    document.getElementById("tickDisplay").textContent =
      tickCount === 10 ? "00" : tickCount;
    isTickPaused = true;
  }
}

// reset tick
function resetTick() {
  clearInterval(mainInterval);
  mainInterval = null;
  tickCount = 10;
  document.getElementById("tickDisplay").textContent = "00";
  isTickPaused = false;
}

function displayTime() {
  const m = Math.floor(timeRemaining / 60);
  const s = timeRemaining % 60;
  document.getElementById("countdown").textContent =
    `${m}:${String(s).padStart(2, "0")}`;
}
displayTime();

function runFinalTick() {
  if (finalTickRunning) return;
  finalTickRunning = true;

  document.getElementById("countdown").style.color = "red";
  document.getElementById("tickDisplay").style.color = "red";

  // khóa ô chọn thời gian trong suốt lúc buzzer đang đếm (kể cả khi resume)
  document.getElementById("timeInput").disabled = true;
  document.getElementById("timeDropdownBtn").disabled = true;

  document.getElementById("tickDisplay").textContent =
    tickCount === 10 ? "00" : tickCount;

  let stepsLeft = tickCount + 1;

  finalTickInterval = setInterval(() => {
    tickCount--;
    if (tickCount < 0) tickCount = 0;
    document.getElementById("tickDisplay").textContent =
      tickCount === 10 ? "00" : tickCount;
    stepsLeft--;

    if (stepsLeft <= 0) {
      clearInterval(finalTickInterval);
      finalTickInterval = null;

      tickCount = 0;
      finalTickRunning = false;
      document.getElementById("tickDisplay").textContent = "0";
      document.getElementById("tickDisplay").style.color = "red";

      // buzzer đã đếm xong hoàn toàn -> mở lại ô nhập thời gian
      document.getElementById("timeInput").disabled = false;
      document.getElementById("timeDropdownBtn").disabled = false;

      checkTimeAndTickEnd();
    }
  }, 100);
}

function startTimer() {
  // CHẶN start nếu đã về 0 hoàn toàn
  if (timeRemaining <= 0) {
    // Hết giờ hoàn toàn (timeRemaining=0):
    // Nếu tickCount > 0: buzzer bị Stop giữa chừng, chưa đếm xong -> bấm Start để CHẠY TIẾP nốt phần buzzer còn dang dở
    // Nếu tickCount = 0: buzzer đã đếm xong hoàn toàn, hiệp đấu đã kết thúc thật sự -> bấm Start không làm gì, phải Reset
    if (tickCount > 0) {
      runFinalTick();
    }
    return;
  }

  if (mainInterval) return;

  if (finalTickRunning) return;

  document.getElementById("countdown").style.color = "white"; // đang chạy => trắng
  document.getElementById("tickDisplay").style.color = "white";

  // khóa ô chọn thời gian trong lúc đồng hồ đang chạy
  document.getElementById("timeInput").disabled = true;
  document.getElementById("timeDropdownBtn").disabled = true;

  // Nếu vừa stop, tiếp tục từ tickCount hiện tại
  // Nếu bắt đầu mới hoàn toàn thì reset về 00
  if (!isTickPaused) {
    tickCount = 10;
    document.getElementById("tickDisplay").textContent = "00";
  }
  isTickPaused = false;

  // DUY NHẤT 1 interval (100ms) điều khiển cả tick lẫn countdown
  // countdown chỉ giảm đúng vào lúc tick hoàn thành 1 vòng (10 bước)
  // 2 con số không bao giờ lệch pha, kể cả khi Stop/Start liên tục
  mainInterval = setInterval(() => {
    tickCount--;

    if (tickCount < 0) {
      // Hoàn thành 1 vòng tick đầy đủ (= đúng 1 giây) -> giảm countdown
      tickCount = 9;
      timeRemaining--;

      if (timeRemaining <= 0) {
        // Hết giờ đúng vào thời điểm này -> dừng mainInterval, chuyển sang buzzer (runFinalTick)
        clearInterval(mainInterval);
        mainInterval = null;

        document.getElementById("countdown").textContent = "0:00";

        runFinalTick();
        return;
      }

      displayTime();

      if (timeRemaining <= 14) {
        document.getElementById("countdown").style.color = "red"; // <=14s => đỏ
        document.getElementById("tickDisplay").style.color = "red";
      }
    }

    document.getElementById("tickDisplay").textContent =
      tickCount === 10 ? "00" : tickCount;
  }, 100);
}

function checkTimeAndTickEnd() {
  if (timeRemaining === 0 && tickCount === 0) {
    const boxAO = document.getElementById("scoreAO");
    const boxAK = document.getElementById("scoreAK");

    // Xóa hiệu ứng cũ
    boxAO.classList.remove("blink");
    boxAK.classList.remove("blink");

    // Xác định xem bên nào có lỗi H đang bật
    // Nếu cả hai bên đều có H, xóa nhấp nháy của cả hai bên
    // Nếu chỉ có 1 bên có H, nhấp nháy bên còn lại
    // Nếu không có bên nào có H, nhấp nháy bên thắng (điểm cao hơn)
    // Nếu hòa điểm, áp dụng luật Senshu (bên có cờ S thắng)
    const isHAO = Array.from(
      document.querySelectorAll('.fault-btn.active[data-side="AO"]'),
    ).some((btn) => btn.textContent.trim() === "H");
    const isHAK = Array.from(
      document.querySelectorAll('.fault-btn.active[data-side="AK"]'),
    ).some((btn) => btn.textContent.trim() === "H");

    if (isHAO && isHAK) {
      // Nếu cả hai bên đều có H, xóa nhấp nháy của cả hai bên
    } else if (isHAO) {
      boxAK.classList.add("blink");
    } else if (isHAK) {
      boxAO.classList.add("blink");
    } else if (scoreAO > scoreAK) {
      boxAO.classList.add("blink");
    } else if (scoreAK > scoreAO) {
      boxAK.classList.add("blink");
    } else if (scoreAO === scoreAK) {
      // Hòa điểm -> áp dụng luật Senshu: bên nào có cờ S (ghi điểm trước) thắng
      // Nếu cả 2 hoặc không bên nào có S thì vẫn hòa (không ai nhấp nháy)
      if (sAO && !sAK) {
        boxAO.classList.add("blink");
      } else if (sAK && !sAO) {
        boxAK.classList.add("blink");
      }
    }
  }
}

function stopTimer() {
  stopTick();

  clearInterval(finalTickInterval);
  finalTickInterval = null;
  finalTickRunning = false;

  document.getElementById("countdown").style.color = "yellow"; // dừng => vàng
  document.getElementById("tickDisplay").style.color = "yellow";

  // mở lại ô chọn thời gian khi đồng hồ dừng
  document.getElementById("timeInput").disabled = false;
  document.getElementById("timeDropdownBtn").disabled = false;
}

function resetTime() {
  stopTimer();
  // Reset về giá trị ĐƯỢC CHỌN TỪ DROPDOWN gần nhất - KHÔNG dùng giá trị gõ tay
  timeRemaining = lastDropdownValue;
  displayTime();
  resetTick();
  document.getElementById("countdown").style.color = "white"; // reset => trắng
  document.getElementById("tickDisplay").style.color = "white";
  document.getElementById("timeInput").value = lastDropdownValue;
  lastInputValue = lastDropdownValue; // đồng bộ lại, tránh lệch trạng thái
}

function resetAll() {
  // reset time
  resetTime();

  // reset điểm
  scoreAO = 0;
  scoreAK = 0;
  document.getElementById("scoreAO").querySelector(".score-value").innerText =
    0;
  document.getElementById("scoreAK").querySelector(".score-value").innerText =
    0;

  // reset màu nền về mặc định
  document.getElementById("scoreAO").style.backgroundColor = "";
  document.getElementById("scoreAK").style.backgroundColor = "";

  // reset nút S
  sAO = false;
  sAK = false;
  document.getElementById("cornerS-AO").style.display = "none";
  document.getElementById("cornerS-AK").style.display = "none";

  // reset lỗi (C1/C2/C3/H...)
  document.querySelectorAll(".fault-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // reset cả ô nhập tên
  document.getElementById("nameAO").value = "";
  document.getElementById("nameAK").value = "";

  // reset nhấp nháy
  document.getElementById("scoreAO").classList.remove("blink");
  document.getElementById("scoreAK").classList.remove("blink");

  // Thời gian: KHÔNG ghi đè về 60 - resetTime() ở đầu hàm đã tự reset về đúng lastInputValue (giá trị dropdown đã chọn trước đó)
  // Giữ nguyên thời lượng thi đấu đã chọn qua các trận trong cùng buổi
}

// Chỉ cập nhật lastInputValue
// KHÔNG đụng đến lastDropdownValue, vì biến đó chỉ được cập nhật riêng khi người dùng CHỌN từ dropdown.
function updateTime() {
  // chặn sửa thời gian khi đồng hồ đang chạy
  if (mainInterval) {
    document.getElementById("timeInput").value = timeRemaining;
    return;
  }

  const raw = document.getElementById("timeInput").value;
  let val = parseInt(raw, 10);
  if (isNaN(val)) return;

  if (val < 0) val = 0;
  if (val > 999) val = 999; // chặn số quá lớn gõ nhầm

  document.getElementById("timeInput").value = val; // ghi lại nếu vừa làm tròn/chặn
  timeRemaining = val;
  displayTime();
  lastInputValue = val;
}

// Cập nhật hiển thị khi trang tải xong
window.addEventListener("DOMContentLoaded", () => {
  // Cập nhật ban đầu
  displayTime();

  // --- Xử lý ô nhập thời gian (input + datalist) ---
  const timeInput = document.getElementById("timeInput");
  // Chọn 1 mốc trong danh sách gợi ý, hoặc rời khỏi ô sau khi gõ tay
  timeInput.addEventListener("change", () => {
    updateTime();
  });
  // Cho phép nhấn Enter để áp dụng ngay khi đang gõ tay, không cần blur
  timeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateTime();
      timeInput.blur();
    }
  });

  // --- Dropdown chọn time ---
  const dropdownBtn = document.getElementById("timeDropdownBtn");
  const dropdownList = document.getElementById("timeDropdownList");

  function openDropdown() {
    if (mainInterval) return; // không cho mở khi đồng hồ đang chạy
    // LUÔN hiện đủ tất cả các mục mỗi lần mở (không lọc theo chữ đang gõ)
    dropdownList.hidden = false;
  }
  function closeDropdown() {
    dropdownList.hidden = true;
  }

  dropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (dropdownList.hidden) openDropdown();
    else closeDropdown();
  });

  // Chọn 1 mục trong dropdown: áp dụng giá trị NGAY, và ghi nhớ riêng vào
  // lastDropdownValue (để RESET TIME dùng sau này, không lẫn với gõ tay)
  dropdownList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const val = parseInt(li.dataset.value, 10);
      timeInput.value = val;
      updateTime(); // áp dụng ngay (cập nhật timeRemaining, lastInputValue)
      lastDropdownValue = val; // ghi riêng - đây LÀ lựa chọn dropdown
      closeDropdown();
    });
  });

  // Bấm ra ngoài thì đóng dropdown
  document.addEventListener("click", (e) => {
    if (!dropdownList.hidden && !e.target.closest(".time-select-wrapper")) {
      closeDropdown();
    }
  });

  // timeInput giờ là type="text" (không phải number) nên cần tự lọc bỏ
  // ký tự không phải số ngay khi gõ - bắt cả trường hợp dán/paste mà
  // keydown không chặn được
  timeInput.addEventListener("input", () => {
    const cleaned = timeInput.value.replace(/[^\d]/g, "").slice(0, 3);
    if (cleaned !== timeInput.value) {
      timeInput.value = cleaned;
    }
  });

  // --- Xử lý input cho ô nhập số tatami ---
  const tatamiInput = document.getElementById("tatamiInput");
  tatamiInput.addEventListener("keydown", (e) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
    ];

    // Cho phép Ctrl+A / Cmd+A trước tiên
    if (e.key.toLowerCase() === "a" && (e.ctrlKey || e.metaKey)) return;

    if (allowedKeys.includes(e.key)) {
      if (e.key === "Enter") {
        e.preventDefault();
        tatamiInput.blur(); // bỏ focus khi nhấn Enter
      }
      return;
    }
    // Chặn tất cả ký tự không phải số
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });

  // Lọc sạch mọi ký tự không phải số ngay khi giá trị thay đổi
  // bắt cả trường hợp kéo-thả, autofill... mà keydown không chặn được
  tatamiInput.addEventListener("input", () => {
    const cleaned = tatamiInput.value.replace(/[^\d]/g, "");
    if (cleaned !== tatamiInput.value) {
      tatamiInput.value = cleaned;
    }
  });

  // Xử lý riêng khi DÁN (paste): lọc bỏ ký tự không phải số trước khi chèn
  tatamiInput.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasteText = (e.clipboardData || window.clipboardData).getData("text");
    const digitsOnly = pasteText.replace(/[^\d]/g, "");

    const start = tatamiInput.selectionStart;
    const end = tatamiInput.selectionEnd;
    const newValue =
      tatamiInput.value.slice(0, start) +
      digitsOnly +
      tatamiInput.value.slice(end);

    tatamiInput.value = newValue;
  });
});
