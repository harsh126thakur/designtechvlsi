import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

let assessmentType = "quiz";
let assessmentId = "";
let assessmentData = null;
let questions = [];
let currentQuestionIndex = 0;
let answers = {};
let questionStates = {};
let timerInterval = null;
let timeLeft = 0;
let submitted = false;

// ================= GET PARAMS =================
const params = new URLSearchParams(window.location.search);
assessmentType = (params.get("type") || "quiz").toLowerCase();
assessmentId = params.get("id") || "";

// ================= ELEMENTS =================
const quizModeTag = document.getElementById("quizModeTag");
const quizTitle = document.getElementById("quizTitle");
const quizDescription = document.getElementById("quizDescription");
const quizTypePill = document.getElementById("quizTypePill");
const quizQuestionCount = document.getElementById("quizQuestionCount");
const quizMarks = document.getElementById("quizMarks");
const quizTimer = document.getElementById("quizTimer");

const quizLayout = document.querySelector(".quiz-layout");

const questionNumberBadge = document.getElementById("questionNumberBadge");
const questionTypeBadge = document.getElementById("questionTypeBadge");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const questionText = document.getElementById("questionText");
const questionMeta = document.getElementById("questionMeta");
const optionsContainer = document.getElementById("optionsContainer");
const numericalBox = document.getElementById("numericalBox");
const numericalAnswer = document.getElementById("numericalAnswer");

const questionFormulaWrap = document.getElementById("questionFormulaWrap");
const questionFormula = document.getElementById("questionFormula");
const questionImageWrap = document.getElementById("questionImageWrap");
const questionImage = document.getElementById("questionImage");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const clearAnswerBtn = document.getElementById("clearAnswerBtn");
const markReviewBtn = document.getElementById("markReviewBtn");

const questionPalette = document.getElementById("questionPalette");
const summaryTotal = document.getElementById("summaryTotal");
const summaryAnswered = document.getElementById("summaryAnswered");
const summaryUnanswered = document.getElementById("summaryUnanswered");
const summaryReview = document.getElementById("summaryReview");

const submitTopBtn = document.getElementById("submitTopBtn");
const submitBottomBtn = document.getElementById("submitBottomBtn");

const submitModal = document.getElementById("submitModal");
const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
const modalTotalQuestions = document.getElementById("modalTotalQuestions");
const modalAnsweredQuestions = document.getElementById("modalAnsweredQuestions");
const modalUnansweredQuestions = document.getElementById("modalUnansweredQuestions");
const modalReviewQuestions = document.getElementById("modalReviewQuestions");

const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultTotalMarks = document.getElementById("resultTotalMarks");
const resultCorrect = document.getElementById("resultCorrect");
const resultWrong = document.getElementById("resultWrong");
const resultAttempted = document.getElementById("resultAttempted");
const resultAccuracy = document.getElementById("resultAccuracy");
const resultAnswersWrap = document.getElementById("resultAnswersWrap");
const downloadResultBtn = document.getElementById("downloadResultBtn");

// ================= HELPERS =================
function showAlert(message) {
  alert(message);
}

function safeValue(value, fallback = "") {
  return value ?? fallback;
}

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePurchasedCourses(data) {
  if (!data) return {};

  if (Array.isArray(data)) {
    const mapped = {};
    data.forEach((id) => {
      mapped[id] = true;
    });
    return mapped;
  }

  if (typeof data === "object") {
    return data;
  }

  return {};
}

function parseMultiAnswer(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
      .sort();
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function arraysEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
}

function isAnswered(answer, type) {
  if (type === "multicorrect") {
    return Array.isArray(answer) && answer.length > 0;
  }
  return String(answer || "").trim() !== "";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getQuestionTypeLabel(type) {
  if (type === "multicorrect") return "Multi Correct";
  if (type === "numerical") return "Numerical";
  return "MCQ";
}

function ensureQuestionState(index) {
  if (!questionStates[index]) {
    questionStates[index] = {
      visited: false,
      markedForReview: false
    };
  }
  return questionStates[index];
}

function getAnsweredCount() {
  return questions.filter((q, index) => isAnswered(answers[index], q.questionType)).length;
}

function getReviewCount() {
  return questions.filter((q, index) => questionStates[index]?.markedForReview).length;
}

function updateSummary() {
  const total = questions.length;
  const answered = getAnsweredCount();
  const review = getReviewCount();
  const unanswered = total - answered;

  summaryTotal.innerText = total;
  summaryAnswered.innerText = answered;
  summaryUnanswered.innerText = unanswered;
  if (summaryReview) summaryReview.innerText = review;

  modalTotalQuestions.innerText = total;
  modalAnsweredQuestions.innerText = answered;
  modalUnansweredQuestions.innerText = unanswered;
  if (modalReviewQuestions) modalReviewQuestions.innerText = review;

  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
  progressFill.style.width = `${percentage}%`;
  progressText.innerText = `${percentage}% completed`;
}

function getPaletteStatus(index) {
  const q = questions[index];
  const state = ensureQuestionState(index);
  const answered = isAnswered(answers[index], q.questionType);

  if (answered && state.markedForReview) return "answered-review";
  if (state.markedForReview) return "review";
  if (answered) return "answered";
  if (state.visited) return "visited";
  return "not-visited";
}

function updatePalette() {
  questionPalette.innerHTML = "";

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn";

    const status = getPaletteStatus(index);

    if (status === "answered") btn.classList.add("answered");
    if (status === "review") btn.classList.add("review");
    if (status === "answered-review") btn.classList.add("answered-review");
    if (status === "visited") btn.classList.add("visited");

    if (index === currentQuestionIndex) {
      btn.classList.add("current");
    }

    btn.innerText = index + 1;
    btn.addEventListener("click", () => {
      saveCurrentAnswer();
      currentQuestionIndex = index;
      renderQuestion();
    });

    questionPalette.appendChild(btn);
  });
}

function updateNavButtons() {
  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.innerText = currentQuestionIndex === questions.length - 1 ? "Review" : "Next";

  const currentState = ensureQuestionState(currentQuestionIndex);
  if (markReviewBtn) {
    markReviewBtn.innerText = currentState.markedForReview
      ? "Unmark Review"
      : "Mark for Review";
  }
}

function renderMath(container = document.body) {
  if (typeof renderMathInElement === "function") {
    renderMathInElement(container, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ]
    });
  }
}
function getQuestionOptions(currentQuestion) {
  if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
   return currentQuestion.options.map((item, index) => {

  const raw = typeof item === "object" ? item.text : item;

  const isImage = typeof raw === "string" && (
    raw.startsWith("http") &&
    (raw.includes(".png") || raw.includes(".jpg") || raw.includes(".jpeg") || raw.includes(".webp"))
  );

  return {
    key: String.fromCharCode(97 + index),

    text: isImage ? "" : String(raw || ""),

    formula: typeof item === "object" ? (item.formula || "") : "",

    imageUrl: typeof item === "object"
      ? (item.imageUrl || "")
      : (isImage ? raw : "")
  };
});
  }

  return [
    {
      key: "a",
      text: currentQuestion.option1 || "",
      formula: currentQuestion.option1Formula || "",
      imageUrl: currentQuestion.option1ImageUrl || ""
    },
    {
      key: "b",
      text: currentQuestion.option2 || "",
      formula: currentQuestion.option2Formula || "",
      imageUrl: currentQuestion.option2ImageUrl || ""
    },
    {
      key: "c",
      text: currentQuestion.option3 || "",
      formula: currentQuestion.option3Formula || "",
      imageUrl: currentQuestion.option3ImageUrl || ""
    },
    {
      key: "d",
      text: currentQuestion.option4 || "",
      formula: currentQuestion.option4Formula || "",
      imageUrl: currentQuestion.option4ImageUrl || ""
    }
  ].filter((opt) => opt.text || opt.formula || opt.imageUrl);
}

function formatAnswerForDisplay(answer) {
  if (Array.isArray(answer)) {
    return answer.length ? answer.join(", ").toUpperCase() : "Not Answered";
  }

  const value = String(answer || "").trim();
  return value ? value : "Not Answered";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function getStoredOptions(item) {
  if (Array.isArray(item.options) && item.options.length > 0) {
    return item.options.map((opt, index) => {

      const raw = typeof opt === "object" ? opt.text : opt;

      const isImage = typeof raw === "string" && (
        raw.startsWith("http") &&
        (raw.includes(".png") || raw.includes(".jpg") || raw.includes(".jpeg") || raw.includes(".webp"))
      );

      return {
        key: String.fromCharCode(97 + index),

        text: isImage ? "" : String(raw || ""),

        formula: typeof opt === "object" ? (opt.formula || "") : "",

        imageUrl: typeof opt === "object"
          ? (opt.imageUrl || "")
          : (isImage ? raw : "")
      };
    });
  }

  return [
    {
      key: "a",
      text: item.option1 || "",
      formula: item.option1Formula || "",
      imageUrl: item.option1ImageUrl || ""
    },
    {
      key: "b",
      text: item.option2 || "",
      formula: item.option2Formula || "",
      imageUrl: item.option2ImageUrl || ""
    },
    {
      key: "c",
      text: item.option3 || "",
      formula: item.option3Formula || "",
      imageUrl: item.option3ImageUrl || ""
    },
    {
      key: "d",
      text: item.option4 || "",
      formula: item.option4Formula || "",
      imageUrl: item.option4ImageUrl || ""
    }
  ].filter((opt) => opt.text || opt.formula || opt.imageUrl);
}

function isOptionSelected(answer, optionKey, type) {
  if (type === "multicorrect") {
    return Array.isArray(answer) && answer.map((v) => String(v).toLowerCase()).includes(String(optionKey).toLowerCase());
  }
  return String(answer || "").trim().toLowerCase() === String(optionKey).trim().toLowerCase();
}

function isOptionCorrect(correctAnswer, optionKey, type) {
  if (type === "multicorrect") {
    return parseMultiAnswer(correctAnswer).includes(String(optionKey).trim().toLowerCase());
  }
  return normalizeString(correctAnswer) === normalizeString(optionKey);
}

// ================= ACCESS CHECK =================
async function hasAssessmentAccess() {
  if (!currentUserData) return false;

  const role = String(currentUserData.role || "user").toLowerCase();

  if (role === "admin" || role === "superadmin") {
    return true;
  }

  const linkedCourseId = assessmentData?.courseId || "";

  if (!linkedCourseId) {
    return true;
  }

  try {
    const courseRef = doc(db, "courses", linkedCourseId);
    const courseSnap = await getDoc(courseRef);

    if (courseSnap.exists()) {
      const courseData = courseSnap.data();
      const courseType = String(courseData.type || "").trim().toLowerCase();

      if (courseType === "free") {
        return true;
      }
    }
  } catch (error) {
    console.error("Course access check error:", error);
  }

  const purchasedCourses = normalizePurchasedCourses(currentUserData.purchasedCourses);
  return !!purchasedCourses[linkedCourseId];
}

// ================= EXISTING RESULT CHECK =================
async function getExistingResult() {
  const q = query(
    collection(db, "results"),
    where("userId", "==", currentUser.uid),
    where("assessmentId", "==", assessmentId),
    where("assessmentType", "==", assessmentType)
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  return {
    id: snap.docs[0].id,
    ...snap.docs[0].data()
  };
}

// ================= LOAD USER =================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      showAlert("User profile not found");
      window.location.href = "login.html";
      return;
    }

    currentUserData = userSnap.data();

    if (!assessmentId) {
      showAlert("Assessment not found");
      window.location.href = "dashboard.html";
      return;
    }

    await loadAssessment();
  } catch (error) {
    console.error("Quiz auth error:", error);
    showAlert("Error loading assessment");
    window.location.href = "dashboard.html";
  }
});

// ================= LOAD ASSESSMENT =================
async function loadAssessment() {
  try {
    const collectionName = assessmentType === "testseries" ? "testseries" : "quizzes";
    const assessmentRef = doc(db, collectionName, assessmentId);
    const assessmentSnap = await getDoc(assessmentRef);

    if (!assessmentSnap.exists()) {
      showAlert("Assessment not found");
      window.location.href = "dashboard.html";
      return;
    }

    assessmentData = {
      id: assessmentSnap.id,
      ...assessmentSnap.data()
    };
    // 🔥 ADD THIS BLOCK HERE
const calcBtn = document.getElementById("openCalc");

if (assessmentData.calculatorEnabled === false) {
  if (calcBtn) {
    calcBtn.style.display = "none";
  }
}

    if (assessmentData.isActive === false) {
      showAlert("This assessment is inactive");
      window.location.href = "dashboard.html";
      return;
    }

    if (!(await hasAssessmentAccess())) {
      showAlert("You do not have access to this assessment");
      window.location.href = "dashboard.html";
      return;
    }

    const existingResult = await getExistingResult();
    if (existingResult) {
      showPreviousResult(existingResult);
      return;
    }

    await loadQuestions();
    setupAssessmentUI();
    renderQuestion();
    startTimer();
  } catch (error) {
    console.error("Load assessment error:", error);
    showAlert("Error loading assessment");
    window.location.href = "dashboard.html";
  }
}

// ================= LOAD QUESTIONS =================
async function loadQuestions() {
  try {
    const fieldName = assessmentType === "testseries" ? "testSeriesId" : "quizId";

    const q = query(
      collection(db, "questions"),
      where(fieldName, "==", assessmentId)
    );

    const snap = await getDocs(q);

    questions = snap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .filter((item) => item.isActive !== false)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    questionStates = {};
    questions.forEach((_, index) => {
      questionStates[index] = {
        visited: false,
        markedForReview: false
      };
    });

    if (!questions.length) {
      showAlert("No questions found in this assessment");
      window.location.href = "dashboard.html";
    }
  } catch (error) {
    console.error("Load questions error:", error);
    throw error;
  }
}

// ================= SETUP UI =================
function setupAssessmentUI() {
  const isTestSeries = assessmentType === "testseries";
  const totalQuestions = questions.length;
  const totalMarksValue = questions.reduce((sum, item) => sum + Number(item.marks || 0), 0);

  quizModeTag.innerText = isTestSeries ? "Test Series" : "Quiz";
  quizTitle.innerText = safeValue(assessmentData.title, "Assessment");
  quizDescription.innerText = safeValue(
    assessmentData.description,
    "Solve the questions carefully and submit before time ends."
  );
  quizTypePill.innerText = `Type: ${isTestSeries ? "Test Series" : "Quiz"}`;
  quizQuestionCount.innerText = `Questions: ${totalQuestions}`;
  quizMarks.innerText = `Marks: ${totalMarksValue}`;

  timeLeft = isTestSeries
    ? Number(assessmentData.durationMinutes || 30) * 60
    : Math.max(totalQuestions * 60, 300);

  quizTimer.innerText = formatTime(timeLeft);

  updateSummary();
  updatePalette();
  updateNavButtons();
}

// ================= RENDER QUESTION =================
function renderQuestion() {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return;

  ensureQuestionState(currentQuestionIndex).visited = true;

  questionNumberBadge.innerText = `Question ${currentQuestionIndex + 1}`;
  questionTypeBadge.innerText = getQuestionTypeLabel(currentQuestion.questionType);

  // ✅ FIXED
  questionText.innerHTML = currentQuestion.question || "Question not available";

  questionMeta.innerText = `Marks: ${Number(currentQuestion.marks || 1)} | Negative: ${Number(currentQuestion.negativeMarks || 0)}`;

  questionFormula.innerHTML = "";
  questionFormulaWrap.style.display = "none";

  if (currentQuestion.questionFormula && String(currentQuestion.questionFormula).trim() !== "") {
    questionFormula.innerHTML = `$$${currentQuestion.questionFormula}$$`;
    questionFormulaWrap.style.display = "block";
  }

  questionImage.src = "";
  questionImageWrap.style.display = "none";

  if (currentQuestion.questionImageUrl && String(currentQuestion.questionImageUrl).trim() !== "") {
    questionImage.src = currentQuestion.questionImageUrl;
    questionImageWrap.style.display = "block";
  }

  // ✅ VERY IMPORTANT (ADD THIS)
  renderMathInElement(questionText);
  renderMathInElement(questionFormulaWrap);

  optionsContainer.innerHTML = "";
  numericalBox.style.display = "none";
  numericalAnswer.value = "";

  const savedAnswer = answers[currentQuestionIndex];

  if (currentQuestion.questionType === "numerical") {
    numericalBox.style.display = "block";
    numericalAnswer.value = savedAnswer || "";
  } else {
    const inputType = currentQuestion.questionType === "multicorrect" ? "checkbox" : "radio";
    const selectedValues = currentQuestion.questionType === "multicorrect"
      ? (Array.isArray(savedAnswer) ? savedAnswer : [])
      : [savedAnswer || ""];

    const options = getQuestionOptions(currentQuestion);

    options.forEach((option) => {
      const label = document.createElement("label");
      label.className = "option-label";

      const input = document.createElement("input");
      input.type = inputType;
      input.name = `question_${currentQuestionIndex}`;
      input.value = option.key;

      if (selectedValues.includes(option.key)) {
        input.checked = true;
        label.classList.add("selected");
      }

      input.addEventListener("change", () => {
        if (currentQuestion.questionType === "mcq") {
          answers[currentQuestionIndex] = option.key;
        } else {
          const checkedOptions = [...optionsContainer.querySelectorAll("input:checked")].map((el) => el.value);
          answers[currentQuestionIndex] = checkedOptions;
        }

        highlightSelectedOptions();
        updateSummary();
        updatePalette();
      });

      const contentWrap = document.createElement("div");
      contentWrap.className = "option-content";

      const keyBadge = document.createElement("span");
      keyBadge.className = "option-key";
      keyBadge.innerText = option.key.toUpperCase();

      const textWrap = document.createElement("div");
      textWrap.className = "option-text-wrap";

      if (option.text) {
        const text = document.createElement("div");
        text.className = "option-text";
        text.innerHTML = option.text;
        textWrap.appendChild(text);
      }

      if (option.formula) {
        const formula = document.createElement("div");
        formula.className = "option-formula";
       formula.innerHTML = `$${option.formula}$`;
        textWrap.appendChild(formula);
      }

      if (option.imageUrl) {
        const img = document.createElement("img");
        img.className = "option-image";
        img.src = option.imageUrl;
        img.onerror = () => {
  img.style.display = "none";
};
        img.alt = `Option ${option.key.toUpperCase()}`;
        img.style.maxWidth = "220px";
        img.style.marginTop = "10px";
        img.style.borderRadius = "10px";
        img.style.display = "block";
        textWrap.appendChild(img);
      }

      contentWrap.appendChild(keyBadge);
      contentWrap.appendChild(textWrap);

      label.appendChild(input);
      label.appendChild(contentWrap);
      optionsContainer.appendChild(label);
    });

    highlightSelectedOptions();
  }

  updateSummary();
  updatePalette();
  updateNavButtons();
  renderMath(document.body);
}

function highlightSelectedOptions() {
  const labels = optionsContainer.querySelectorAll(".option-label");

  labels.forEach((label) => {
    const input = label.querySelector("input");
    if (input && input.checked) {
      label.classList.add("selected");
    } else {
      label.classList.remove("selected");
    }
  });
}

// ================= SAVE ANSWER =================
function saveCurrentAnswer() {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return;

  ensureQuestionState(currentQuestionIndex).visited = true;

  if (currentQuestion.questionType === "numerical") {
    answers[currentQuestionIndex] = numericalAnswer.value.trim();
  } else if (currentQuestion.questionType === "mcq") {
    const selected = optionsContainer.querySelector("input:checked");
    answers[currentQuestionIndex] = selected ? selected.value : "";
  } else {
    const selected = [...optionsContainer.querySelectorAll("input:checked")].map((el) => el.value);
    answers[currentQuestionIndex] = selected;
  }

  updateSummary();
  updatePalette();
}

// ================= TIMER =================
function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (submitted) {
      clearInterval(timerInterval);
      return;
    }

    timeLeft -= 1;
    quizTimer.innerText = formatTime(Math.max(timeLeft, 0));

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitAssessment(true);
    }
  }, 1000);
}

// ================= RESULT LOGIC =================
function evaluateAnswers() {
  let score = 0;
  let totalMarksValue = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let attemptedCount = 0;

  const resultAnswers = questions.map((question, index) => {
    const userAnswer = answers[index];
    const marks = Number(question.marks || 1);
    const negativeMarks = Number(question.negativeMarks || 0);

    totalMarksValue += marks;

    const attempted = isAnswered(userAnswer, question.questionType);
    if (attempted) attemptedCount += 1;

    let isCorrect = false;
    const correctValue = question.correctAnswer || question.correctAnswerText || "";

    if (question.questionType === "mcq") {
      isCorrect = normalizeString(userAnswer) === normalizeString(correctValue);
    } else if (question.questionType === "multicorrect") {
      isCorrect = arraysEqual(
        parseMultiAnswer(userAnswer),
        parseMultiAnswer(correctValue)
      );
    } else {
      isCorrect = normalizeString(userAnswer) === normalizeString(correctValue);
    }

    if (attempted && isCorrect) {
      score += marks;
      correctCount += 1;
    } else if (attempted && !isCorrect) {
      score -= negativeMarks;
      wrongCount += 1;
    }

    return {
  questionId: question.id,
  question: question.question || "",
  questionType: question.questionType || "mcq",
  questionFormula: question.questionFormula || "",
  questionImageUrl: question.questionImageUrl || "",

  // ✅ ADD HERE
  explanation: question.explanation || "",
  explanationFormula: question.explanationFormula || "",
  explanationImageUrl: question.explanationImageUrl || "",
      options: Array.isArray(question.options) ? question.options : [],

      option1: question.option1 || "",
      option2: question.option2 || "",
      option3: question.option3 || "",
      option4: question.option4 || "",

      option1Formula: question.option1Formula || "",
      option2Formula: question.option2Formula || "",
      option3Formula: question.option3Formula || "",
      option4Formula: question.option4Formula || "",

      option1ImageUrl: question.option1ImageUrl || "",
      option2ImageUrl: question.option2ImageUrl || "",
      option3ImageUrl: question.option3ImageUrl || "",
      option4ImageUrl: question.option4ImageUrl || "",

      userAnswer: userAnswer || (question.questionType === "multicorrect" ? [] : ""),
      correctAnswer: correctValue,
      correctAnswerText: question.correctAnswerText || correctValue,
      marks,
      negativeMarks,
      isCorrect,
      attempted,
      markedForReview: !!questionStates[index]?.markedForReview
    };
  });

  if (score < 0) score = 0;

  const accuracy = attemptedCount > 0
    ? Math.round((correctCount / attemptedCount) * 100)
    : 0;

  return {
    score,
    totalMarks: totalMarksValue,
    correctCount,
    wrongCount,
    attemptedCount,
    accuracy,
    resultAnswers
  };
}

function renderResultAnswers(answerList = []) {
  if (!resultAnswersWrap) return;

  resultAnswersWrap.innerHTML = "";

  if (!answerList.length) {
    resultAnswersWrap.innerHTML = `
      <div class="review-card">
        <h3>No answers found</h3>
      </div>
    `;
    return;
  }

  answerList.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = `review-card ${item.isCorrect ? "correct" : (item.attempted ? "wrong" : "unanswered")}`;

    const options = getStoredOptions(item);

    let optionsHtml = "";
    if (item.questionType !== "numerical" && options.length) {
      optionsHtml = `
        <div class="review-options">
          ${options.map((option) => {
            const selected = isOptionSelected(item.userAnswer, option.key, item.questionType);
            const correct = isOptionCorrect(item.correctAnswer, option.key, item.questionType);

            return `
              <div class="review-option ${selected ? "selected-option" : ""} ${correct ? "correct-option" : ""}">
                <div class="review-option-top">
                  <strong>${escapeHtml(option.key.toUpperCase())}.</strong>
                  <span>
                    ${selected ? "Your Choice" : ""}
                    ${selected && correct ? " | " : ""}
                    ${correct ? "Correct" : ""}
                  </span>
                </div>

                ${option.text ? `<div class="review-option-text">${escapeHtml(option.text)}</div>` : ""}
                ${option.formula ? `<div class="review-option-formula">$${option.formula}$</div>` : ""}
                ${option.imageUrl ? `<img class="review-option-image" src="${escapeHtml(option.imageUrl)}" alt="Option ${escapeHtml(option.key.toUpperCase())}">` : ""}
              </div>
            `;
          }).join("")}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="review-head">
        <div>
          <p class="review-qno">Question ${index + 1}</p>
          <h3 class="review-question">${escapeHtml(item.question || "Question not available")}</h3>
        </div>
        <span class="review-badge ${item.isCorrect ? "correct-badge" : (item.attempted ? "wrong-badge" : "unanswered-badge")}">
          ${item.isCorrect ? "Correct" : (item.attempted ? "Wrong" : "Not Answered")}
        </span>
      </div>

      ${item.questionFormula ? `<div class="review-question-formula">$${item.questionFormula}$</div>` : ""}
      ${item.questionImageUrl ? `<img class="review-question-image" src="${escapeHtml(item.questionImageUrl)}" alt="Question Image">` : ""}

      ${optionsHtml}

      <div class="review-meta">
        <div><strong>Your Answer:</strong> ${escapeHtml(formatAnswerForDisplay(item.userAnswer))}</div>
        <div><strong>Correct Answer:</strong> ${escapeHtml(formatAnswerForDisplay(item.correctAnswerText || item.correctAnswer))}</div>
        <div><strong>Marks:</strong> ${Number(item.marks || 0)}</div>
        <div><strong>Negative Marks:</strong> ${Number(item.negativeMarks || 0)}</div>
      </div>

<div class="review-explanation">
  <strong>Explanation:</strong>

  ${item.explanation 
    ? `<p>${escapeHtml(item.explanation)}</p>` 
    : ""}

 ${item.explanationFormula 
  ? `<div class="review-explanation-formula">$$${item.explanationFormula}$$</div>` 
  : ""}
  
  ${item.explanationImageUrl 
    ? `<img class="review-explanation-image" src="${escapeHtml(item.explanationImageUrl)}" 
         style="max-width:250px;margin-top:10px;border-radius:10px;" />` 
    : ""}
</div>
    `;

    resultAnswersWrap.appendChild(card);
  });

  renderMath(document.body);
}

// ================= SHOW PREVIOUS RESULT =================
function showPreviousResult(existingResult) {
  submitted = true;
  clearInterval(timerInterval);

  quizModeTag.innerText = assessmentType === "testseries" ? "Test Series" : "Quiz";
  quizTitle.innerText = existingResult.assessmentTitle || assessmentData?.title || "Assessment Result";
  quizDescription.innerText = "You have already attempted this assessment. Your saved result is shown below.";
  quizTypePill.innerText = `Type: ${assessmentType === "testseries" ? "Test Series" : "Quiz"}`;
  quizQuestionCount.innerText = `Questions: ${existingResult.totalQuestions || 0}`;
  quizMarks.innerText = `Marks: ${existingResult.totalMarks || 0}`;
  quizTimer.innerText = "Submitted";

  if (quizLayout) {
    quizLayout.style.display = "none";
  }

  submitTopBtn.style.display = "none";

  resultTitle.innerText = existingResult.assessmentTitle || "Assessment Result";
  resultScore.innerText = existingResult.score || 0;
  resultTotalMarks.innerText = existingResult.totalMarks || 0;
  resultCorrect.innerText = existingResult.correctCount || 0;
  resultWrong.innerText = existingResult.wrongCount || 0;
  resultAttempted.innerText = existingResult.attemptedCount || 0;
  resultAccuracy.innerText = `${existingResult.accuracy || 0}%`;

  renderResultAnswers(existingResult.answers || []);
  resultModal.style.display = "flex";
}

// ================= SUBMIT =================
async function submitAssessment(autoSubmit = false) {
  if (submitted) return;

  try {
    submitted = true;
    saveCurrentAnswer();
    clearInterval(timerInterval);

    const alreadySubmitted = await getExistingResult();
    if (alreadySubmitted) {
      showPreviousResult(alreadySubmitted);
      return;
    }

    const result = evaluateAnswers();

    const resultPayload = {
      userId: currentUser.uid,
      userName: currentUserData.name || "",
      userEmail: currentUser.email || "",
      assessmentType,
      assessmentId,
      assessmentTitle: assessmentData.title || "",
      courseId: assessmentData.courseId || "",
      score: result.score,
      totalMarks: result.totalMarks,
      correctCount: result.correctCount,
      wrongCount: result.wrongCount,
      attemptedCount: result.attemptedCount,
      totalQuestions: questions.length,
      accuracy: result.accuracy,
      autoSubmitted: autoSubmit,
      answers: result.resultAnswers,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "results"), resultPayload);

    const userResultRef = doc(db, "users", currentUser.uid, "results", `${assessmentType}_${assessmentId}`);
    await setDoc(
      userResultRef,
      {
        ...resultPayload,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    showResult(result);
  } catch (error) {
    console.error("Submit error:", error);
    submitted = false;
    showAlert("Error submitting assessment");
  }
}

function showResult(result) {
  resultTitle.innerText = assessmentData.title || "Assessment Result";
  resultScore.innerText = result.score;
  resultTotalMarks.innerText = result.totalMarks;
  resultCorrect.innerText = result.correctCount;
  resultWrong.innerText = result.wrongCount;
  resultAttempted.innerText = result.attemptedCount;
  resultAccuracy.innerText = `${result.accuracy}%`;

  if (quizLayout) {
    quizLayout.style.display = "none";
  }

  submitTopBtn.style.display = "none";

  renderResultAnswers(result.resultAnswers);
  resultModal.style.display = "flex";
}

// ================= MODAL =================
function openSubmitModal() {
  saveCurrentAnswer();
  updateSummary();
  submitModal.style.display = "flex";
}

function closeSubmitModal() {
  submitModal.style.display = "none";
}

// ================= EVENTS =================
prevBtn.addEventListener("click", () => {
  saveCurrentAnswer();

  if (currentQuestionIndex > 0) {
    currentQuestionIndex -= 1;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  saveCurrentAnswer();

  if (currentQuestionIndex < questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
  } else {
    openSubmitModal();
  }
});

clearAnswerBtn.addEventListener("click", () => {
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return;

  if (currentQuestion.questionType === "numerical") {
    numericalAnswer.value = "";
    answers[currentQuestionIndex] = "";
  } else if (currentQuestion.questionType === "multicorrect") {
    answers[currentQuestionIndex] = [];
  } else {
    answers[currentQuestionIndex] = "";
  }

  renderQuestion();
});

if (markReviewBtn) {
  markReviewBtn.addEventListener("click", () => {
    const state = ensureQuestionState(currentQuestionIndex);
    state.markedForReview = !state.markedForReview;
    updateSummary();
    updatePalette();
    updateNavButtons();
  });
}

submitTopBtn.addEventListener("click", openSubmitModal);
submitBottomBtn.addEventListener("click", openSubmitModal);
cancelSubmitBtn.addEventListener("click", closeSubmitModal);

confirmSubmitBtn.addEventListener("click", async () => {
  closeSubmitModal();
  await submitAssessment(false);
});

numericalAnswer.addEventListener("input", () => {
  ensureQuestionState(currentQuestionIndex).visited = true;
  answers[currentQuestionIndex] = numericalAnswer.value.trim();
  updateSummary();
  updatePalette();
});

if (downloadResultBtn) {
  downloadResultBtn.addEventListener("click", () => {
    window.print();
  });
}

window.addEventListener("beforeunload", (e) => {
  if (!submitted && questions.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("DOMContentLoaded", () => {

  const popup = document.getElementById("calcPopup");
  const openBtn = document.getElementById("openCalc");
  const closeBtn = document.getElementById("closeCalc");
  const calcWindow = document.getElementById("calcWindow");

  if(openBtn){
    openBtn.onclick = () => {
  if (assessmentData && assessmentData.calculatorEnabled === false) return;
  popup.style.display = "block";
};
  }

  if(closeBtn){
    closeBtn.onclick = () => popup.style.display = "none";
  }

  let isDragging = false, offsetX, offsetY;

  const header = document.getElementById("calcHeader");

  if(header){
    header.addEventListener("mousedown",(e)=>{
      isDragging = true;
      offsetX = e.clientX - calcWindow.offsetLeft;
      offsetY = e.clientY - calcWindow.offsetTop;
    });

    document.addEventListener("mousemove",(e)=>{
      if(isDragging){
        calcWindow.style.left = (e.clientX - offsetX)+"px";
        calcWindow.style.top = (e.clientY - offsetY)+"px";
      }
    });

    document.addEventListener("mouseup",()=> isDragging=false);
  }

});