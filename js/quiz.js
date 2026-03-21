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

const questionNumberBadge = document.getElementById("questionNumberBadge");
const questionTypeBadge = document.getElementById("questionTypeBadge");
const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const questionText = document.getElementById("questionText");
const questionMeta = document.getElementById("questionMeta");
const optionsContainer = document.getElementById("optionsContainer");
const numericalBox = document.getElementById("numericalBox");
const numericalAnswer = document.getElementById("numericalAnswer");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const clearAnswerBtn = document.getElementById("clearAnswerBtn");

const questionPalette = document.getElementById("questionPalette");
const summaryTotal = document.getElementById("summaryTotal");
const summaryAnswered = document.getElementById("summaryAnswered");
const summaryUnanswered = document.getElementById("summaryUnanswered");

const submitTopBtn = document.getElementById("submitTopBtn");
const submitBottomBtn = document.getElementById("submitBottomBtn");

const submitModal = document.getElementById("submitModal");
const cancelSubmitBtn = document.getElementById("cancelSubmitBtn");
const confirmSubmitBtn = document.getElementById("confirmSubmitBtn");
const modalTotalQuestions = document.getElementById("modalTotalQuestions");
const modalAnsweredQuestions = document.getElementById("modalAnsweredQuestions");
const modalUnansweredQuestions = document.getElementById("modalUnansweredQuestions");

const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultScore = document.getElementById("resultScore");
const resultTotalMarks = document.getElementById("resultTotalMarks");
const resultCorrect = document.getElementById("resultCorrect");
const resultWrong = document.getElementById("resultWrong");
const resultAttempted = document.getElementById("resultAttempted");
const resultAccuracy = document.getElementById("resultAccuracy");

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

function parseMultiAnswer(value) {
  return String(value || "")
    .split(",")
    .map(item => item.trim().toLowerCase())
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

function getAnsweredCount() {
  return questions.filter((q, index) => isAnswered(answers[index], q.questionType)).length;
}

function updateSummary() {
  const total = questions.length;
  const answered = getAnsweredCount();
  const unanswered = total - answered;

  summaryTotal.innerText = total;
  summaryAnswered.innerText = answered;
  summaryUnanswered.innerText = unanswered;

  modalTotalQuestions.innerText = total;
  modalAnsweredQuestions.innerText = answered;
  modalUnansweredQuestions.innerText = unanswered;

  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
  progressFill.style.width = `${percentage}%`;
  progressText.innerText = `${percentage}% completed`;
}

function updatePalette() {
  questionPalette.innerHTML = "";

  questions.forEach((q, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "palette-btn";

    if (index === currentQuestionIndex) {
      btn.classList.add("current");
    }

    if (isAnswered(answers[index], q.questionType)) {
      btn.classList.add("answered");
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

  if (currentQuestionIndex === questions.length - 1) {
    nextBtn.innerText = "Review";
  } else {
    nextBtn.innerText = "Next";
  }
}

// ================= ACCESS CHECK =================
function hasAssessmentAccess() {
  if (!currentUserData) return false;

  if (currentUserData.role === "admin" || currentUserData.role === "superadmin") {
    return true;
  }

  const purchasedCourses = currentUserData.purchasedCourses || {};
  const linkedCourseId = assessmentData?.courseId || "";

  if (!linkedCourseId) {
    return true;
  }

  return !!purchasedCourses[linkedCourseId];
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

    if (assessmentData.isActive === false) {
      showAlert("This assessment is inactive");
      window.location.href = "dashboard.html";
      return;
    }

    if (!hasAssessmentAccess()) {
      showAlert("You do not have access to this assessment");
      window.location.href = "dashboard.html";
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
    const q = query(
      collection(db, "questions"),
      where(assessmentType === "testseries" ? "testSeriesId" : "quizId", "==", assessmentId)
    );

    const snap = await getDocs(q);

    questions = snap.docs
      .map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))
      .filter(item => item.isActive !== false)
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

    if (!questions.length) {
      showAlert("No questions found in this assessment");
      window.location.href = "dashboard.html";
      return;
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
  quizDescription.innerText = safeValue(assessmentData.description, "Solve the questions carefully and submit before time ends.");
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

  questionNumberBadge.innerText = `Question ${currentQuestionIndex + 1}`;
  questionTypeBadge.innerText = getQuestionTypeLabel(currentQuestion.questionType);
  questionText.innerText = currentQuestion.question || "Question not available";
  questionMeta.innerText = `Marks: ${Number(currentQuestion.marks || 1)} | Negative: ${Number(currentQuestion.negativeMarks || 0)}`;

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

    (currentQuestion.options || []).forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "option-label";

      const input = document.createElement("input");
      input.type = inputType;
      input.name = `question_${currentQuestionIndex}`;
      input.value = option;

      if (selectedValues.includes(option)) {
        input.checked = true;
        label.classList.add("selected");
      }

      input.addEventListener("change", () => {
        if (currentQuestion.questionType === "mcq") {
          answers[currentQuestionIndex] = option;
        } else {
          const checkedOptions = [...optionsContainer.querySelectorAll("input:checked")].map(el => el.value);
          answers[currentQuestionIndex] = checkedOptions;
        }
        highlightSelectedOptions();
        updateSummary();
        updatePalette();
      });

      const text = document.createElement("span");
      text.className = "option-text";
      text.innerText = option;

      label.appendChild(input);
      label.appendChild(text);
      optionsContainer.appendChild(label);
    });

    highlightSelectedOptions();
  }

  updateSummary();
  updatePalette();
  updateNavButtons();
}

function highlightSelectedOptions() {
  const labels = optionsContainer.querySelectorAll(".option-label");
  labels.forEach(label => {
    const input = label.querySelector("input");
    if (input?.checked) {
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

  if (currentQuestion.questionType === "numerical") {
    answers[currentQuestionIndex] = numericalAnswer.value.trim();
  } else if (currentQuestion.questionType === "mcq") {
    const selected = optionsContainer.querySelector("input:checked");
    answers[currentQuestionIndex] = selected ? selected.value : "";
  } else {
    const selected = [...optionsContainer.querySelectorAll("input:checked")].map(el => el.value);
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

    let isCorrect = false;
    const attempted = isAnswered(userAnswer, question.questionType);

    if (attempted) attemptedCount += 1;

    if (question.questionType === "mcq") {
      isCorrect = normalizeString(userAnswer) === normalizeString(question.correctAnswer);
    } else if (question.questionType === "multicorrect") {
      isCorrect = arraysEqual(
        parseMultiAnswer(userAnswer?.join(",")),
        parseMultiAnswer(question.correctAnswer)
      );
    } else {
      isCorrect = normalizeString(userAnswer) === normalizeString(question.correctAnswer);
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
      userAnswer: userAnswer || (question.questionType === "multicorrect" ? [] : ""),
      correctAnswer: question.correctAnswer || "",
      marks,
      negativeMarks,
      isCorrect,
      attempted
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

// ================= SUBMIT =================
async function submitAssessment(autoSubmit = false) {
  if (submitted) return;

  try {
    submitted = true;
    saveCurrentAnswer();
    clearInterval(timerInterval);

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
    await setDoc(userResultRef, {
      ...resultPayload,
      updatedAt: serverTimestamp()
    }, { merge: true });

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

submitTopBtn.addEventListener("click", openSubmitModal);
submitBottomBtn.addEventListener("click", openSubmitModal);
cancelSubmitBtn.addEventListener("click", closeSubmitModal);

confirmSubmitBtn.addEventListener("click", async () => {
  closeSubmitModal();
  await submitAssessment(false);
});

numericalAnswer.addEventListener("input", () => {
  answers[currentQuestionIndex] = numericalAnswer.value.trim();
  updateSummary();
  updatePalette();
});

// ================= TAB CLOSE WARNING =================
window.addEventListener("beforeunload", (e) => {
  if (!submitted && questions.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});