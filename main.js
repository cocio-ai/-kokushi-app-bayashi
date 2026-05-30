// --- 1. Firebaseの初期設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyAP4WmzOpwjst-KTgJtD99r12Azdw1n_D8",
    authDomain: "kokushi-bayashi.firebaseapp.com",
    projectId: "kokushi-bayashi",
    storageBucket: "kokushi-bayashi.firebasestorage.app",
    messagingSenderId: "930906961772",
    appId: "1:930906961772:web:6564c3747eb8491114e649"
};

// Firebaseの初期化
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 2. 変数と設定 ---
let allQuizData = []; // スプレッドシートの全データ
let quizData = [];    // 今回出題する30問
let currentIndex = 0;
let score = 0;

// スプレッドシートのCSV出力URL
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/11zzNYvPn6RgirwpnYVnnpSyFEH109JGbOPlVr35wIqw/export?format=csv";

// 先生の熱血セリフ集
const scripts = {
    intro: [
        "「バヤシ！今日も熱くいくぞ！ランダム30問1本勝負だ！」",
        "「国試は自分との戦いだ！今日の30問に全身全霊をかけろ！」"
    ],
    encourage: [
        "「その調子だ！もっと熱くなれ！」",
        "「迷うな！お前が今までやってきた努力を信じるんだ！」",
        "「苦しい時こそ成長している証拠だ！いけー！」"
    ],
    correct: [
        "「ナイス！その答え、最高に熱いぜ！」",
        "「大正解！今の君は誰よりも輝いてる！」"
    ],
    wrong: [
        "「ドンマイ！失敗は成功のもとだ！次こそ決めようぜ！」",
        "「惜しい！でもベクトルは合ってるぞ！解説を読んで吸収しろ！」"
    ],
    finish100: "「完璧だバヤシ！この30問満点、お前の情熱の証だ！🔥」",
    finishGreat: "「よく頑張った！間違えた問題こそがお前を強くするんだ！」",
    finishBad: "「どうしたバヤシ！お前の力はこんなもんじゃないはずだ！もう1回だ！」"
};

const teacherMessage = document.getElementById("teacher-message");
const currentQNum = document.getElementById("current-q-num");
const totalQNum = document.getElementById("total-q-num");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const resultArea = document.getElementById("result-area");
const explanationText = document.getElementById("explanation");
const nextBtn = document.getElementById("next-btn");

// --- 3. 問題の読み込みとシャッフル ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function fetchQuizData() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allQuizData = results.data.map(row => ({
                    question: row["問題文"],
                    options: [row["選択肢1"], row["選択肢2"], row["選択肢3"], row["選択肢4"]],
                    correctIndex: parseInt(row["正解番号"], 10),
                    explanation: row["解説"]
                }));

                // 全問題をシャッフルし、先頭の30問だけを切り取る
                quizData = shuffleArray([...allQuizData]).slice(0, 30);

                totalQNum.textContent = quizData.length;
                teacherMessage.textContent = getRandomScript(scripts.intro);
                loadQuestion();
            }
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        teacherMessage.textContent = "「通信エラーだ！電波の良いところでリロードしてくれ！」";
    }
}

fetchQuizData();

function getRandomScript(arr) {
    if (typeof arr === 'string') return arr; 
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- 4. クイズの進行処理 ---
function loadQuestion() {
    resultArea.style.display = "none";
    optionsArea.innerHTML = "";
    
    const currentQuiz = quizData[currentIndex];
    currentQNum.textContent = currentIndex + 1;
    questionText.textContent = currentQuiz.question;

    teacherMessage.textContent = getRandomScript(scripts.encourage);

    currentQuiz.options.forEach((option, index) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = option;
        btn.onclick = () => selectOption(index, btn);
        optionsArea.appendChild(btn);
    });
}

let selectedIndex = null;
function selectOption(index, clickedBtn) {
    if (selectedIndex !== null && resultArea.style.display === "block") return;
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(btn => btn.classList.remove("selected"));
    clickedBtn.classList.add("selected");
    selectedIndex = index;
    checkAnswer(selectedIndex, clickedBtn);
}

function checkAnswer(chosenIndex, chosenBtn) {
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.classList.remove("selected"); 
    });

    const currentQuiz = quizData[currentIndex];
    const isCorrect = (chosenIndex === currentQuiz.correctIndex);

    if (isCorrect) {
        score++;
        chosenBtn.classList.add("correct");
        teacherMessage.textContent = getRandomScript(scripts.correct);
    } else {
        chosenBtn.classList.add("wrong");
        buttons[currentQuiz.correctIndex].classList.add("correct");
        teacherMessage.textContent = getRandomScript(scripts.wrong);
    }

    explanationText.innerHTML = currentQuiz.explanation;
    resultArea.style.display = "block";

    if (currentIndex === quizData.length - 1) {
        nextBtn.textContent = "特訓結果を見る";
    }
}

nextBtn.onclick = () => {
    currentIndex++;
    selectedIndex = null; 
    if (currentIndex < quizData.length) {
        loadQuestion();
    } else {
        saveAndShowFinalResult();
    }
};

// --- 5. Firebaseへの保存とグラフ描画 ---
async function saveAndShowFinalResult() {
    const cardContents = document.getElementById("quiz-contents");
    resultArea.style.display = "none"; 
    
    const percentage = Math.round((score / quizData.length) * 100);

    let finalScript = "";
    if (percentage === 100) finalScript = scripts.finish100;
    else if (percentage >= 70) finalScript = scripts.finishGreat;
    else finalScript = scripts.finishBad;
    teacherMessage.textContent = finalScript;

    // 画面の書き換え（グラフ用のcanvasを描画）
    cardContents.classList.add("final-result-screen");
    cardContents.innerHTML = `
        <h2>特訓終了！</h2>
        <div class="q-progress">30問中 ${score}問 正解</div>
        <div class="final-score">${percentage}%</div>
        <div style="margin-top: 20px; width: 100%; max-width: 400px; margin-inline: auto;">
            <canvas id="historyChart"></canvas>
        </div>
        <button class="next-btn final-retry-btn" style="margin-top:20px;" onclick="location.reload()">次の30問へ挑む！</button>
    `;

    try {
        // Firebaseへ成績を保存
        await db.collection("examResults").add({
            score: score,
            total: quizData.length,
            percentage: percentage,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        drawHistoryChart();

    } catch (error) {
        console.error("Firebaseへの保存に失敗しました", error);
        teacherMessage.textContent = "「通信エラーだ！だがお前の努力は俺の心に刻まれたぞ！」";
    }
}

async function drawHistoryChart() {
    const snapshot = await db.collection("examResults")
                             .orderBy("timestamp", "asc")
                             .limit(10) // 最新の10回分を表示
                             .get();

    const labels = [];
    const dataPoints = [];
    let attempt = 1;

    snapshot.forEach(doc => {
        const data = doc.data();
        labels.push(attempt + "回目");
        dataPoints.push(data.percentage);
        attempt++;
    });

    const ctx = document.getElementById('historyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '正答率 (%)',
                data: dataPoints,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderWidth: 3,
                pointBackgroundColor: '#e74c3c',
                pointRadius: 5,
                tension: 0.3
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}
