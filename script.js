const $ = id => document.getElementById(id);

const exerciseInput = $("exercise");
const weightInput = $("weight");
const repsInput = $("reps");
const setsInput = $("sets");
const newExerciseInput = $("new-exercise-input");

const oneRMOutput = $("one-rm-output");
const volumeOutput = $("volume-output");
const previousRecordOutput = $("previous-record-output");
const bestRecordOutput = $("best-record-output");

const saveButton = $("save-button");
const previousMonthButton = $("previous-month");
const nextMonthButton = $("next-month");
const addExerciseButton = $("add-exercise-button");
const exerciseList = $("exercise-list");

const graphExerciseInput = $("graph-exercise");
const periodButtons = document.querySelectorAll(".period-button");
const graphContainer = $("graph-container");
const bestList = $("best-list");

const calendarTitle = $("calendar-title");
const calendarDays = $("calendar-days");
const selectedDaySection = $("selected-day-section");
const selectedDateTitle = $("selected-date-title");
const selectedDayRecords = $("selected-day-records");
const memoInput = $("memo-input");
const saveMemoButton = $("save-memo-button");
const memoSavedMessage = $("memo-saved-message");

const showAddRecordButton = $("show-add-record-button");
const addDayRecordForm = $("add-day-record-form");
const pastExerciseInput = $("past-exercise");
const pastWeightInput = $("past-weight");
const pastRepsInput = $("past-reps");
const pastSetsInput = $("past-sets");
const saveDayRecordButton = $("save-day-record-button");
const cancelDayRecordButton = $("cancel-day-record-button");

const menuButton = $("menu-button");
const menuPanel = $("menu-panel");
const menuItems = document.querySelectorAll(".menu-item");

const STORAGE_KEY = "workoutRecords";
const MEMO_STORAGE_KEY = "workoutDayMemos";
const EXERCISE_STORAGE_KEY = "customExercises";
const STANDARD_EXERCISES = ["スクワット", "ベンチプレス", "デッドリフト"];

let currentCalendarDate = new Date();
let selectedDateKey = null;
let editingRecordId = null;
let selectedGraphPeriod = "1";

// データ保存
function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch (error) {
        console.error(`${key}の読み込みに失敗しました:`, error);
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`${key}の保存に失敗しました:`, error);
        return false;
    }
}

function loadRecords() {
    const data = loadJSON(STORAGE_KEY, []);
    return Array.isArray(data) ? data : [];
}

function saveRecords(records) {
    return saveJSON(STORAGE_KEY, records);
}

function loadCustomExercises() {
    const data = loadJSON(EXERCISE_STORAGE_KEY, []);
    if (!Array.isArray(data)) return [];

    return [...new Set(
        data
            .filter(name => typeof name === "string")
            .map(name => name.trim())
            .filter(name =>
                name &&
                name.length <= 30 &&
                !STANDARD_EXERCISES.includes(name)
            )
    )];
}

function saveCustomExercises(exercises) {
    return saveJSON(EXERCISE_STORAGE_KEY, exercises);
}

function loadMemos() {
    const data = loadJSON(MEMO_STORAGE_KEY, {});
    return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
}

function saveMemos(memos) {
    return saveJSON(MEMO_STORAGE_KEY, memos);
}

function getAllExercises() {
    return [...STANDARD_EXERCISES, ...loadCustomExercises()];
}

// 表示・共通処理
function formatWeight(weight) {
    const value = Number(weight);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getDateFromKey(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDisplayDate(date) {
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatGraphDate(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function createSavedMessage(title, message) {
    const existing = document.querySelector(".saved-message");
    if (existing) existing.remove();

    const element = document.createElement("div");
    const titleElement = document.createElement("strong");
    const messageElement = document.createElement("span");

    element.className = "saved-message";
    titleElement.textContent = `✓ ${title}`;
    messageElement.textContent = message;

    element.append(titleElement, messageElement);
    document.querySelector(".container").prepend(element);

    setTimeout(() => element.remove(), 1800);
}

function getRecordInputValues(exerciseElement, weightElement, repsElement, setsElement) {
    const exercise = exerciseElement.value.trim();
    const weight = Number(weightElement.value);
    const reps = Number(repsElement.value);
    const sets = Number(setsElement.value);

    if (!exercise || weight <= 0 || reps <= 0 || sets <= 0) {
        return null;
    }

    return { exercise, weight, reps, sets };
}

function refreshRecordViews(refreshSelectedDate = false) {
    updatePreviousRecord();
    updateBestRecord();
    renderBestList();
    renderGraph();

    if (refreshSelectedDate && selectedDateKey) {
        showSelectedDate(getDateFromKey(selectedDateKey));
    } else {
        renderCalendar();
    }
}

// メニュー
function switchSection(sectionId) {
    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.toggle("active", section.id === sectionId);
    });

    menuPanel.classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// 計算
function calculateResults() {
    const weight = Number(weightInput.value);
    const reps = Number(repsInput.value);
    const sets = Number(setsInput.value);

    oneRMOutput.textContent =
        weight > 0 && reps > 0
            ? `${(weight * (1 + reps / 30)).toFixed(1)}kg`
            : "-";

    if (weight > 0 && reps > 0 && sets > 0) {
        const volume = weight * reps * sets;
        volumeOutput.textContent = `${Number.isInteger(volume) ? volume : volume.toFixed(1)}kg`;
    } else {
        volumeOutput.textContent = "-";
    }
}

// 種目プルダウン
function populateExerciseSelect(selectElement, preferred = null, fallback = null) {
    const exercises = getAllExercises();
    const current = preferred ?? selectElement.value;

    selectElement.replaceChildren();

    exercises.forEach(exercise => {
        const option = document.createElement("option");
        option.value = exercise;
        option.textContent = exercise;
        selectElement.appendChild(option);
    });

    const target =
        current && exercises.includes(current)
            ? current
            : fallback && exercises.includes(fallback)
                ? fallback
                : exercises[0];

    if (target) selectElement.value = target;
}

function renderExerciseSelect(preferred = null) {
    populateExerciseSelect(exerciseInput, preferred);
    updateExerciseInformation();
}

function renderPastExerciseSelect(preferred = null) {
    populateExerciseSelect(pastExerciseInput, preferred, exerciseInput.value);
}

function renderGraphExerciseSelect(preferred = null) {
    populateExerciseSelect(graphExerciseInput, preferred);
}

// 種目管理
function createExerciseListItem(exercise, isStandard) {
    const item = document.createElement("div");
    const name = document.createElement("div");

    item.className = "exercise-list-item";
    name.className = "exercise-list-name";
    name.textContent = exercise;

    if (isStandard) {
        const label = document.createElement("span");
        label.className = "standard-label";
        label.textContent = "標準";
        name.appendChild(label);
    }

    item.appendChild(name);

    if (!isStandard) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "delete-exercise-button";
        button.textContent = "削除";
        button.addEventListener("click", () => deleteCustomExercise(exercise));
        item.appendChild(button);
    }

    return item;
}

function renderExerciseList() {
    exerciseList.replaceChildren();

    STANDARD_EXERCISES.forEach(exercise => {
        exerciseList.appendChild(createExerciseListItem(exercise, true));
    });

    loadCustomExercises().forEach(exercise => {
        exerciseList.appendChild(createExerciseListItem(exercise, false));
    });
}

function addCustomExercise() {
    const name = newExerciseInput.value.trim();

    if (!name) {
        alert("種目名を入力してください。");
        return;
    }

    if (name.length > 30) {
        alert("種目名は30文字以内で入力してください。");
        return;
    }

    if (getAllExercises().includes(name)) {
        alert("その種目はすでに存在します。");
        return;
    }

    const exercises = loadCustomExercises();
    exercises.push(name);

    if (!saveCustomExercises(exercises)) {
        alert("種目の保存に失敗しました。");
        return;
    }

    renderExerciseSelect(name);
    renderGraphExerciseSelect(name);
    renderPastExerciseSelect(name);
    renderExerciseList();
    renderBestList();
    newExerciseInput.value = "";
}

function deleteCustomExercise(exerciseName) {
    const records = loadRecords();
    const hasRecords = records.some(record => record.exercise === exerciseName);

    const message = hasRecords
        ? `「${exerciseName}」を削除しますか？\n\nこの種目に登録されている過去の筋トレ記録もすべて削除されます。`
        : `「${exerciseName}」を削除しますか？`;

    if (!confirm(message)) return;

    const updatedExercises = loadCustomExercises().filter(
        exercise => exercise !== exerciseName
    );

    if (!saveCustomExercises(updatedExercises)) {
        alert("種目の削除に失敗しました。");
        return;
    }

    if (
        hasRecords &&
        !saveRecords(
            records.filter(record => record.exercise !== exerciseName)
        )
    ) {
        alert("記録の削除に失敗しました。");
        return;
    }

    const preferredExercise =
        exerciseInput.value === exerciseName
            ? STANDARD_EXERCISES[0]
            : exerciseInput.value;

    const preferredGraphExercise =
        graphExerciseInput.value === exerciseName
            ? STANDARD_EXERCISES[0]
            : graphExerciseInput.value;

    const preferredPastExercise =
        pastExerciseInput.value === exerciseName
            ? STANDARD_EXERCISES[0]
            : pastExerciseInput.value;

    renderExerciseSelect(preferredExercise);
    renderGraphExerciseSelect(preferredGraphExercise);
    renderPastExerciseSelect(preferredPastExercise);
    renderExerciseList();
    refreshRecordViews(true);
}

// 記録の検索
function getExerciseRecords(exercise, records = loadRecords()) {
    return records.filter(record =>
        record.exercise === exercise &&
        Number.isFinite(Number(record.weight)) &&
        Number.isFinite(Date.parse(record.date))
    );
}

function findLatestRecord(records) {
    return records.reduce(
        (latest, record) =>
            !latest || new Date(record.date) > new Date(latest.date)
                ? record
                : latest,
        null
    );
}

function findBestRecord(records) {
    return records.reduce((best, record) => {
        if (!best || Number(record.weight) > Number(best.weight)) {
            return record;
        }

        if (
            Number(record.weight) === Number(best.weight) &&
            new Date(record.date) > new Date(best.date)
        ) {
            return record;
        }

        return best;
    }, null);
}

function updatePreviousRecord() {
    const record = findLatestRecord(
        getExerciseRecords(exerciseInput.value)
    );

    previousRecordOutput.textContent = record
        ? `${formatWeight(record.weight)}kg × ${record.reps}回 × ${record.sets}セット`
        : "まだ記録なし";
}

function updateBestRecord() {
    const record = findBestRecord(
        getExerciseRecords(exerciseInput.value)
    );

    bestRecordOutput.textContent = record
        ? `${formatWeight(record.weight)}kg × ${record.reps}回 × ${record.sets}セット`
        : "まだ記録なし";
}

function updateExerciseInformation() {
    updatePreviousRecord();
    updateBestRecord();
}

function renderBestList() {
    bestList.replaceChildren();

    const records = loadRecords();

    getAllExercises().forEach(exercise => {
        const item = document.createElement("div");
        const header = document.createElement("div");
        const name = document.createElement("span");
        const trophy = document.createElement("span");

        item.className = "best-item";
        header.className = "best-item-header";
        name.className = "best-item-name";
        trophy.textContent = "🏆";
        name.textContent = exercise;

        header.append(name, trophy);
        item.appendChild(header);

        const record = findBestRecord(
            getExerciseRecords(exercise, records)
        );

        if (record) {
            const weight = document.createElement("div");
            const detail = document.createElement("div");
            const date = document.createElement("div");

            weight.className = "best-item-weight";
            detail.className = "best-item-detail";
            date.className = "best-item-date";

            weight.textContent = `${formatWeight(record.weight)}kg`;
            detail.textContent = `${record.reps}回 × ${record.sets}セット`;
            date.textContent = formatDisplayDate(
                new Date(record.date)
            );

            item.append(weight, detail, date);
        } else {
            const empty = document.createElement("div");
            empty.className = "best-item-detail";
            empty.textContent = "まだ記録がありません";
            item.appendChild(empty);
        }

        bestList.appendChild(item);
    });
}

// 記録保存・編集・削除
function saveWorkoutRecord() {
    const data = getRecordInputValues(
        exerciseInput,
        weightInput,
        repsInput,
        setsInput
    );

    if (!data) {
        alert("重量・回数・セット数を正しく入力してください。");
        return;
    }

    const records = loadRecords();

    records.push({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        ...data
    });

    if (!saveRecords(records)) {
        alert("記録の保存に失敗しました。");
        return;
    }

    const isToday =
        selectedDateKey === getDateKey(new Date());

    weightInput.value = "";
    repsInput.value = "";
    setsInput.value = "";

    calculateResults();
    refreshRecordViews(isToday);

    createSavedMessage(
        "記録しました",
        `${formatWeight(data.weight)}kg × ${data.reps}回 × ${data.sets}セット`
    );
}

function savePastDayRecord() {
    if (!selectedDateKey) return;

    const data = getRecordInputValues(
        pastExerciseInput,
        pastWeightInput,
        pastRepsInput,
        pastSetsInput
    );

    if (!data) {
        alert("重量・回数・セット数を正しく入力してください。");
        return;
    }

    const records = loadRecords();

    if (editingRecordId) {
        const record = records.find(
            item => item.id === editingRecordId
        );

        if (!record) {
            resetPastRecordForm();
            return;
        }

        Object.assign(record, {
            exercise: data.exercise,
            weight: data.weight,
            reps: data.reps,
            sets: data.sets
        });

        if (!saveRecords(records)) {
            alert("記録の保存に失敗しました。");
            return;
        }

        resetPastRecordForm();
        refreshRecordViews(true);

        createSavedMessage(
            "変更を保存しました",
            `${data.exercise} ${formatWeight(data.weight)}kg × ${data.reps}回 × ${data.sets}セット`
        );

        return;
    }

    const selectedDate = getDateFromKey(selectedDateKey);

    selectedDate.setHours(
        12,
        0,
        0,
        0
    );

    records.push({
        id: crypto.randomUUID(),
        date: selectedDate.toISOString(),
        ...data
    });

    if (!saveRecords(records)) {
        alert("記録の保存に失敗しました。");
        return;
    }

    resetPastRecordForm();
    refreshRecordViews(true);

    createSavedMessage(
        "記録しました",
        `${data.exercise} ${formatWeight(data.weight)}kg × ${data.reps}回 × ${data.sets}セット`
    );
}

function resetPastRecordForm() {
    editingRecordId = null;

    pastWeightInput.value = "";
    pastRepsInput.value = "";
    pastSetsInput.value = "";

    addDayRecordForm.classList.add("hidden");
    saveDayRecordButton.textContent = "この日に保存";
}

function editWorkoutRecord(recordId) {
    const record = loadRecords().find(
        item => item.id === recordId
    );

    if (!record) return;

    editingRecordId = recordId;

    renderPastExerciseSelect(record.exercise);

    pastWeightInput.value = record.weight;
    pastRepsInput.value = record.reps;
    pastSetsInput.value = record.sets;

    addDayRecordForm.classList.remove("hidden");
    saveDayRecordButton.textContent = "変更を保存";

    addDayRecordForm.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

function deleteWorkoutRecord(recordId) {
    const records = loadRecords();
    const record = records.find(
        item => item.id === recordId
    );

    if (!record) return;

    if (
        !confirm(
            `${record.exercise} ${formatWeight(record.weight)}kg × ${record.reps}回 × ${record.sets}セット\n\nこの記録を削除しますか？`
        )
    ) {
        return;
    }

    const updatedRecords = records.filter(
        item => item.id !== recordId
    );

    if (!saveRecords(updatedRecords)) {
        alert("記録の削除に失敗しました。");
        return;
    }

    refreshRecordViews(true);
}

// カレンダー
function getWorkoutDateKeys() {
    return new Set(
        loadRecords().map(
            record => getDateKey(
                new Date(record.date)
            )
        )
    );
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const firstWeekday = new Date(
        year,
        month,
        1
    ).getDay();

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    const workoutDays = getWorkoutDateKeys();
    const todayKey = getDateKey(new Date());

    calendarTitle.textContent = `${year}年${month + 1}月`;
    calendarDays.replaceChildren();

    for (let i = 0; i < firstWeekday; i++) {
        const empty = document.createElement("div");
        empty.className = "calendar-day empty";
        calendarDays.appendChild(empty);
    }

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {
        const date = new Date(
            year,
            month,
            day
        );

        const dateKey = getDateKey(date);
        const element = document.createElement("div");

        element.className = "calendar-day";

        if (dateKey === todayKey) {
            element.classList.add("today");
        }

        if (workoutDays.has(dateKey)) {
            element.classList.add("workout-day");
        }

        if (dateKey === selectedDateKey) {
            element.classList.add("selected-day");
        }

        element.textContent = day;

        element.addEventListener(
            "click",
            () => showSelectedDate(date)
        );

        calendarDays.appendChild(element);
    }
}

function showSelectedDate(date) {
    selectedDateKey = getDateKey(date);

    selectedDaySection.classList.remove("hidden");
    selectedDateTitle.textContent = formatDisplayDate(date);

    renderPastExerciseSelect(exerciseInput.value);
    resetPastRecordForm();

    const records = loadRecords()
        .filter(
            record =>
                getDateKey(new Date(record.date)) ===
                selectedDateKey
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

    selectedDayRecords.replaceChildren();

    if (!records.length) {
        const empty = document.createElement("p");

        empty.className = "no-record-message";
        empty.textContent = "この日の筋トレ記録はありません";

        selectedDayRecords.appendChild(empty);
    } else {
        records.forEach(record => {
            const row = document.createElement("div");
            const info = document.createElement("div");
            const name = document.createElement("p");
            const detail = document.createElement("p");
            const actions = document.createElement("div");
            const edit = document.createElement("button");
            const del = document.createElement("button");

            row.className = "day-record";
            info.className = "day-record-info";
            name.className = "day-record-exercise";
            detail.className = "day-record-detail";
            actions.className = "day-record-actions";
            edit.className = "edit-record-button";
            del.className = "delete-record-button";

            edit.type = "button";
            del.type = "button";

            name.textContent = record.exercise;

            detail.textContent =
                `${formatWeight(record.weight)}kg × ${record.reps}回 × ${record.sets}セット`;

            edit.textContent = "編集";
            del.textContent = "削除";

            edit.addEventListener(
                "click",
                () => editWorkoutRecord(record.id)
            );

            del.addEventListener(
                "click",
                () => deleteWorkoutRecord(record.id)
            );

            info.append(
                name,
                detail
            );

            actions.append(
                edit,
                del
            );

            row.append(
                info,
                actions
            );

            selectedDayRecords.appendChild(row);
        });
    }

    const memos = loadMemos();

    memoInput.value =
        typeof memos[selectedDateKey] === "string"
            ? memos[selectedDateKey]
            : "";

    memoSavedMessage.classList.add("hidden");

    renderCalendar();
}

// グラフ
function getGraphData(exercise, period) {
    const records = getExerciseRecords(exercise);

    if (!records.length) return [];

    const today = new Date();
    today.setHours(
        0,
        0,
        0,
        0
    );

    let startKey = null;

    if (period !== "all") {
        const startDate = new Date(today);

        startDate.setMonth(
            startDate.getMonth() -
            Number(period)
        );

        startKey = getDateKey(startDate);
    }

    const dailyMaxWeights = new Map();

    records.forEach(record => {
        const date = new Date(record.date);
        const dateKey = getDateKey(date);
        const weight = Number(record.weight);

        if (startKey && dateKey < startKey) {
            return;
        }

        if (
            !dailyMaxWeights.has(dateKey) ||
            weight > dailyMaxWeights.get(dateKey)
        ) {
            dailyMaxWeights.set(
                dateKey,
                weight
            );
        }
    });

    return [...dailyMaxWeights.entries()]
        .map(
            ([dateKey, weight]) => ({
                dateKey,
                date: getDateFromKey(dateKey),
                weight
            })
        )
        .sort(
            (a, b) => a.date - b.date
        );
}

function showGraphMessage(message) {
    const element = document.createElement("p");

    element.className = "graph-empty";
    element.textContent = message;

    graphContainer.appendChild(element);
}

function getDateLabelIndexes(dataLength) {
    if (dataLength <= 1) {
        return [0];
    }

    if (dataLength <= 4) {
        return Array.from(
            { length: dataLength },
            (_, index) => index
        );
    }

    const middle =
        Math.floor(
            (dataLength - 1) / 2
        );

    return [
        0,
        middle,
        dataLength - 1
    ];
}

function renderGraph() {
    graphContainer.replaceChildren();

    const exercise = graphExerciseInput.value;

    if (!exercise) {
        showGraphMessage(
            "種目を選択してください"
        );
        return;
    }

    const data = getGraphData(
        exercise,
        selectedGraphPeriod
    );

    if (!data.length) {
        showGraphMessage(
            "この期間の記録はありません"
        );
        return;
    }

    const width = 560;
    const height = 300;
    const paddingLeft = 48;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 42;

    const graphWidth =
        width -
        paddingLeft -
        paddingRight;

    const graphHeight =
        height -
        paddingTop -
        paddingBottom;

    const weights =
        data.map(item => item.weight);

    const minWeight =
        Math.floor(
            Math.min(...weights) / 5
        ) * 5;

    const maxWeight =
        Math.ceil(
            Math.max(...weights) / 5
        ) * 5;

    const adjustedMax =
        maxWeight === minWeight
            ? maxWeight + 5
            : maxWeight;

    const range =
        adjustedMax -
        minWeight;

    const svgNS =
        "http://www.w3.org/2000/svg";

    const svg =
        document.createElementNS(
            svgNS,
            "svg"
        );

    svg.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );

    svg.classList.add("graph-svg");

    for (
        let i = 0;
        i <= 5;
        i++
    ) {
        const ratio = i / 5;

        const y =
            paddingTop +
            graphHeight * ratio;

        const line =
            document.createElementNS(
                svgNS,
                "line"
            );

        const label =
            document.createElementNS(
                svgNS,
                "text"
            );

        line.setAttribute(
            "x1",
            paddingLeft
        );

        line.setAttribute(
            "x2",
            width - paddingRight
        );

        line.setAttribute(
            "y1",
            y
        );

        line.setAttribute(
            "y2",
            y
        );

        line.classList.add(
            "graph-grid-line"
        );

        label.setAttribute(
            "x",
            paddingLeft - 8
        );

        label.setAttribute(
            "y",
            y + 4
        );

        label.setAttribute(
            "text-anchor",
            "end"
        );

        label.classList.add(
            "graph-axis-label"
        );

        label.textContent =
            `${formatWeight(
                adjustedMax -
                range * ratio
            )}kg`;

        svg.append(
            line,
            label
        );
    }

    const points =
        data.map(
            (item, index) => ({
                x:
                    data.length === 1
                        ? paddingLeft +
                          graphWidth / 2
                        : paddingLeft +
                          graphWidth *
                          index /
                          (data.length - 1),

                y:
                    paddingTop +
                    graphHeight *
                    (
                        1 -
                        (
                            item.weight -
                            minWeight
                        ) /
                        range
                    ),

                data: item
            })
        );

    if (points.length >= 2) {
        const path =
            document.createElementNS(
                svgNS,
                "path"
            );

        path.setAttribute(
            "d",
            points
                .map(
                    (point, index) =>
                        `${index ? "L" : "M"} ${point.x} ${point.y}`
                )
                .join(" ")
        );

        path.classList.add(
            "graph-line"
        );

        svg.appendChild(path);
    }

    points.forEach(point => {
        const circle =
            document.createElementNS(
                svgNS,
                "circle"
            );

        circle.setAttribute(
            "cx",
            point.x
        );

        circle.setAttribute(
            "cy",
            point.y
        );

        circle.setAttribute(
            "r",
            5
        );

        circle.classList.add(
            "graph-point"
        );

        svg.appendChild(circle);
    });

    getDateLabelIndexes(
        points.length
    ).forEach(index => {
        const point = points[index];

        const label =
            document.createElementNS(
                svgNS,
                "text"
            );

        label.setAttribute(
            "x",
            point.x
        );

        label.setAttribute(
            "y",
            height - 14
        );

        label.setAttribute(
            "text-anchor",
            "middle"
        );

        label.classList.add(
            "graph-axis-label"
        );

        label.textContent =
            formatGraphDate(
                point.data.date
            );

        svg.appendChild(label);
    });

    graphContainer.appendChild(svg);
}

// メモ
function saveMemo() {
    if (!selectedDateKey) return;

    const memos = loadMemos();
    const text = memoInput.value.trim();

    if (text) {
        memos[selectedDateKey] =
            memoInput.value;
    } else {
        delete memos[selectedDateKey];
    }

    if (!saveMemos(memos)) {
        alert("メモの保存に失敗しました。");
        return;
    }

    memoSavedMessage.classList.remove(
        "hidden"
    );
}

// イベント
menuButton.addEventListener(
    "click",
    () => {
        menuPanel.classList.toggle(
            "hidden"
        );
    }
);

menuItems.forEach(item => {
    item.addEventListener(
        "click",
        () => switchSection(
            item.dataset.section
        )
    );
});

weightInput.addEventListener(
    "input",
    calculateResults
);

repsInput.addEventListener(
    "input",
    calculateResults
);

setsInput.addEventListener(
    "input",
    calculateResults
);

exerciseInput.addEventListener(
    "change",
    () => {
        updateExerciseInformation();
        renderPastExerciseSelect(
            exerciseInput.value
        );
    }
);

saveButton.addEventListener(
    "click",
    saveWorkoutRecord
);

addExerciseButton.addEventListener(
    "click",
    addCustomExercise
);

graphExerciseInput.addEventListener(
    "change",
    renderGraph
);

periodButtons.forEach(button => {
    button.addEventListener(
        "click",
        () => {
            periodButtons.forEach(
                other =>
                    other.classList.remove(
                        "active"
                    )
            );

            button.classList.add(
                "active"
            );

            selectedGraphPeriod =
                button.dataset.period;

            renderGraph();
        }
    );
});

previousMonthButton.addEventListener(
    "click",
    () => {
        currentCalendarDate =
            new Date(
                currentCalendarDate.getFullYear(),
                currentCalendarDate.getMonth() - 1,
                1
            );

        renderCalendar();
    }
);

nextMonthButton.addEventListener(
    "click",
    () => {
        currentCalendarDate =
            new Date(
                currentCalendarDate.getFullYear(),
                currentCalendarDate.getMonth() + 1,
                1
            );

        renderCalendar();
    }
);

showAddRecordButton.addEventListener(
    "click",
    () => {
        editingRecordId = null;

        renderPastExerciseSelect(
            exerciseInput.value
        );

        saveDayRecordButton.textContent =
            "この日に保存";

        addDayRecordForm.classList.remove(
            "hidden"
        );
    }
);

saveDayRecordButton.addEventListener(
    "click",
    savePastDayRecord
);

cancelDayRecordButton.addEventListener(
    "click",
    resetPastRecordForm
);

memoInput.addEventListener(
    "input",
    () => {
        memoSavedMessage.classList.add(
            "hidden"
        );
    }
);

saveMemoButton.addEventListener(
    "click",
    saveMemo
);

// 初期表示
calculateResults();
renderExerciseSelect();
renderGraphExerciseSelect();
renderPastExerciseSelect();
renderExerciseList();
renderBestList();
renderCalendar();
showSelectedDate(new Date());

if ("serviceWorker" in navigator) {
    window.addEventListener(
        "load",
        () => {
            navigator.serviceWorker
                .register("./sw.js")
                .catch(error => {
                    console.error(
                        "Service Workerの登録に失敗しました:",
                        error
                    );
                });
        }
    );
}