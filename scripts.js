const STORAGE_KEY = "fridgeItems";
const TRASH_KEY = "fridgeTrash";
const form = document.getElementById("fridge-form");
const tbody = document.querySelector("#fridge-table tbody");
const trashBody = document.querySelector("#trash-table tbody");
const nameInput = document.getElementById("name-input");
const expiryInput = document.getElementById("expiry-input");
const submitButton = form.querySelector('button[type="submit"]');
const cancelButton = document.getElementById("cancel-edit");
const submitDefaultText = submitButton.textContent;
let editIndex = null;
const openTrashButton = document.getElementById("open-trash");
        const mainView = document.getElementById("main-view");
        const startRecordButton = document.getElementById("start-record");
        const stopRecordButton = document.getElementById("stop-record");
        const toast = document.getElementById("toast");
        const helpModal = document.getElementById("help-modal");
        const openHelpButton = document.getElementById("open-help");
        const closeHelpButton = document.getElementById("close-help");
        const trashModal = document.getElementById("trash-modal");
        const closeTrashButton = document.getElementById("close-trash");
const toggleThemeButton = document.getElementById("toggle-theme");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
let isRecording = false;

function loadItems(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveItems(key, items) {
    localStorage.setItem(key, JSON.stringify(items));
}

        function renderMain(items) {
            tbody.innerHTML = "";
            if (items.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "В холодильнике пусто";
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

            items.forEach((item, index) => {
                const row = document.createElement("tr");
                const daysLeft = getDaysUntil(item.expiry);
                if (daysLeft === 1) {
                    row.classList.add("row-danger");
                } else if (daysLeft === 3) {
                    row.classList.add("row-warning");
                }
                const nameCell = document.createElement("td");
                nameCell.textContent = item.name;
        const expiryCell = document.createElement("td");
        expiryCell.textContent = formatDateForDisplay(item.expiry);
        const statusCell = document.createElement("td");
        const statusText = document.createElement("span");
        statusText.textContent = item.status || "";
        const actions = document.createElement("span");
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.classList.add("icon-button");
        editButton.innerHTML = "&#9998;";
        editButton.title = "Редактировать";
        editButton.dataset.action = "edit";
        editButton.dataset.index = String(index);
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.classList.add("icon-button");
        deleteButton.innerHTML = "&#128465;";
        deleteButton.title = "Удалить";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.index = String(index);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        statusCell.appendChild(statusText);
        statusCell.appendChild(document.createTextNode(" "));
        statusCell.appendChild(actions);
        row.appendChild(nameCell);
        row.appendChild(expiryCell);
        row.appendChild(statusCell);
        tbody.appendChild(row);
    });
}

function renderTrash(items) {
    trashBody.innerHTML = "";
    if (items.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.textContent = "Корзина пуста";
        row.appendChild(cell);
        trashBody.appendChild(row);
        return;
    }

    items.forEach((item, index) => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.textContent = item.name;
        const expiryCell = document.createElement("td");
        expiryCell.textContent = formatDateForDisplay(item.expiry);
        const statusCell = document.createElement("td");
        const statusText = document.createElement("span");
        statusText.textContent = item.status || "";
        const actions = document.createElement("span");
        const restoreButton = document.createElement("button");
        restoreButton.type = "button";
        restoreButton.textContent = "Восстановить";
        restoreButton.dataset.action = "restore";
        restoreButton.dataset.index = String(index);
        actions.appendChild(restoreButton);
        statusCell.appendChild(statusText);
        statusCell.appendChild(document.createTextNode(" "));
        statusCell.appendChild(actions);
        row.appendChild(nameCell);
        row.appendChild(expiryCell);
        row.appendChild(statusCell);
        trashBody.appendChild(row);
    });
}

function resetEdit() {
    editIndex = null;
    submitButton.textContent = submitDefaultText;
    cancelButton.hidden = true;
}

function startEdit(index) {
    const item = items[index];
    if (!item) return;
    nameInput.value = item.name;
    expiryInput.value = item.expiry;
    editIndex = index;
    submitButton.textContent = "Сохранить";
    cancelButton.hidden = false;
    nameInput.focus();
}

        function formatDateForInput(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }

        function getDaysUntil(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return null;
            const today = new Date();
            const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const diffMs = dateMidnight - todayMidnight;
            return Math.round(diffMs / 86400000);
        }

        function formatDateForDisplay(value) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
        return value;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}.${month}.${year}`;
}
function setExpiryMinToday() {
    expiryInput.min = formatDateForInput(new Date());
}

function parseDateString(value) {
    const trimmed = value.trim();
    const dotted = trimmed.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{2,4})$/);
    if (dotted) {
        const day = Number(dotted[1]);
        const month = Number(dotted[2]);
        let year = Number(dotted[3]);
        if (year < 100) {
            year += 2000;
        }
        const date = new Date(year, month - 1, day);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }
    const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) {
        const date = new Date(trimmed);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }
    const dayMap = {
        "первого": 1,
        "второго": 2,
        "третьего": 3,
        "четвертого": 4,
        "пятого": 5,
        "шестого": 6,
        "седьмого": 7,
        "восьмого": 8,
        "девятого": 9,
        "десятого": 10,
        "одиннадцатого": 11,
        "двенадцатого": 12,
        "тринадцатого": 13,
        "четырнадцатого": 14,
        "пятнадцатого": 15,
        "шестнадцатого": 16,
        "семнадцатого": 17,
        "восемнадцатого": 18,
        "девятнадцатого": 19,
        "двадцатого": 20,
        "двадцать первого": 21,
        "двадцать второго": 22,
        "двадцать третьего": 23,
        "двадцать четвертого": 24,
        "двадцать пятого": 25,
        "двадцать шестого": 26,
        "двадцать седьмого": 27,
        "двадцать восьмого": 28,
        "двадцать девятого": 29,
        "тридцатого": 30,
        "тридцать первого": 31
    };
    const monthMap = {
        января: 0,
        февраля: 1,
        марта: 2,
        апреля: 3,
        мая: 4,
        июня: 5,
        июля: 6,
        августа: 7,
        сентября: 8,
        октября: 9,
        ноября: 10,
        декабря: 11
    };
    const textMatch = trimmed.toLowerCase().match(/^(\d{1,2}|[а-яё\s]+)\s+([а-яё]+)\s*(\d{2,4})?$/);
    if (textMatch) {
        let day = Number(textMatch[1]);
        if (Number.isNaN(day)) {
            day = dayMap[textMatch[1].trim()];
        }
        const monthName = textMatch[2];
        const month = monthMap[monthName];
        if (month !== undefined && Number.isInteger(day)) {
            const today = new Date();
            let year = textMatch[3] ? Number(textMatch[3]) : today.getFullYear();
            if (year < 100) {
                year += 2000;
            }
            let date = new Date(year, month, day);
            if (!textMatch[3] && date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
                date = new Date(year + 1, month, day);
            }
            if (!Number.isNaN(date.getTime())) {
                return date;
            }
        }
    }
    return null;
}

function parseTranscript(text) {
    const cleaned = text.trim();
    if (!cleaned) return null;
    const normalized = cleaned.toLowerCase();
    const patterns = [
        { regex: /^(.+?)\s+до\s+(.+)$/ },
        { regex: /^(.+?)\s+годен\s+до\s+(.+)$/ },
        { regex: /^(.+?)\s+истекает\s+(.+)$/ }
    ];

    for (const pattern of patterns) {
        const match = normalized.match(pattern.regex);
        if (match) {
            const name = match[1].trim();
            const dateText = match[2].trim();
            const date = parseDateString(dateText);
            if (!date) return null;
            return { name, expiry: formatDateForInput(date) };
        }
    }

    const inDaysMatch = normalized.match(/^(.+?)\s+через\s+(\d+)\s+дн(ей|я|ь)?$/);
    if (inDaysMatch) {
        const name = inDaysMatch[1].trim();
        const days = Number(inDaysMatch[2]);
        if (!Number.isInteger(days) || days < 0) {
            return null;
        }
        const date = new Date();
        date.setDate(date.getDate() + days);
        return { name, expiry: formatDateForInput(date) };
    }

    return null;
}

        function setRecordingState(active) {
            isRecording = active;
            startRecordButton.disabled = active;
            stopRecordButton.disabled = !active;
        }

function showToast(message, type) {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    if (type === "error") {
        toast.classList.add("error");
    } else {
        toast.classList.remove("error");
    }
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
        toast.hidden = true;
    }, 1400);
}

function isDateNotPast(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return dateMidnight >= todayMidnight;
}

const items = loadItems(STORAGE_KEY);
const trashItems = loadItems(TRASH_KEY);
renderMain(items);
renderTrash(trashItems);
setExpiryMinToday();

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const newItem = {
        name: nameInput.value.trim(),
        expiry: expiryInput.value,
        status: ""
    };
    if (!newItem.name || !newItem.expiry) {
        return;
    }
    if (!isDateNotPast(newItem.expiry)) {
        return;
    }
            if (editIndex === null) {
                items.push(newItem);
            } else {
                items[editIndex] = newItem;
            }
            saveItems(STORAGE_KEY, items);
            renderMain(items);
            showToast("Запись добавлена");
            form.reset();
            resetEdit();
            nameInput.focus();
        });

cancelButton.addEventListener("click", () => {
    form.reset();
    resetEdit();
    nameInput.focus();
});

tbody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }
    const action = target.dataset.action;
    const index = Number(target.dataset.index);
    if (!Number.isInteger(index)) {
        return;
    }
    if (action === "edit") {
        startEdit(index);
        return;
    }
    if (action === "delete") {
        const [removed] = items.splice(index, 1);
        if (removed) {
            trashItems.push(removed);
        }
        saveItems(STORAGE_KEY, items);
        saveItems(TRASH_KEY, trashItems);
        renderMain(items);
        renderTrash(trashItems);
        if (editIndex === index) {
            form.reset();
            resetEdit();
        } else if (editIndex !== null && index < editIndex) {
            editIndex -= 1;
        }
    }
});

trashBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) {
        return;
    }
    const action = target.dataset.action;
    const index = Number(target.dataset.index);
    if (action !== "restore" || !Number.isInteger(index)) {
        return;
    }
    const [restored] = trashItems.splice(index, 1);
    if (restored) {
        items.push(restored);
    }
    saveItems(STORAGE_KEY, items);
    saveItems(TRASH_KEY, trashItems);
    renderMain(items);
    renderTrash(trashItems);
});

if (openTrashButton && trashModal && closeTrashButton) {
    openTrashButton.addEventListener("click", () => {
        trashModal.hidden = false;
    });

    closeTrashButton.addEventListener("click", () => {
        trashModal.hidden = true;
    });

    trashModal.addEventListener("click", (event) => {
        if (event.target === trashModal) {
            trashModal.hidden = true;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            trashModal.hidden = true;
        }
    });
}

if (openHelpButton && helpModal && closeHelpButton) {
    openHelpButton.addEventListener("click", () => {
        helpModal.hidden = false;
    });

    closeHelpButton.addEventListener("click", () => {
        helpModal.hidden = true;
    });

    helpModal.addEventListener("click", (event) => {
        if (event.target === helpModal) {
            helpModal.hidden = true;
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            helpModal.hidden = true;
        }
    });
}

if (toggleThemeButton) {
    toggleThemeButton.addEventListener("click", () => {
        document.body.classList.toggle("theme-dark");
    });
}

if (recognition) {
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.addEventListener("result", (event) => {
        const text = Array.from(event.results)
            .map((result) => result[0].transcript)
            .join(" ")
            .trim();
        if (!text) {
            showToast("Фраза не распознана", "error");
            return;
        }
        const parsed = parseTranscript(text);
        if (!parsed) {
            showToast("Фраза не распознана", "error");
            return;
        }
        if (!isDateNotPast(parsed.expiry)) {
            return;
        }
                items.push({ name: parsed.name, expiry: parsed.expiry, status: "" });
                saveItems(STORAGE_KEY, items);
                renderMain(items);
                showToast("Запись добавлена");
            });

            recognition.addEventListener("error", () => {
                return;
            });

    recognition.addEventListener("end", () => {
        setRecordingState(false);
    });
}

startRecordButton.addEventListener("click", () => {
            if (!recognition) {
                return;
            }
    if (isRecording) {
        return;
    }
            setRecordingState(true);
            try {
                recognition.start();
            } catch (error) {
                setRecordingState(false);
            }
        });

stopRecordButton.addEventListener("click", () => {
    if (!recognition || !isRecording) {
        return;
    }
    recognition.stop();
});
