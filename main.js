// --- 1. Firebaseの初期設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyAP4WmzOpwjst-KTgJtD99r12Azdw1n_D8", // ★自分のキーに変更！
    authDomain: "kokushi-bayashi.firebaseapp.com",
    projectId: "kokushi-bayashi",
    storageBucket: "kokushi-bayashi.firebasestorage.app",
    messagingSenderId: "930906961772",
    appId: "1:930906961772:web:6564c3747eb8491114e649"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- 2. 変数と設定 ---
let allQuizData = []; 
let quizData = [];    
let currentIndex = 0;
let score = 0;
let questionLimit = 10; // 選択されたモードの問題数

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/11zzNYvPn6RgirwpnYVnnpSyFEH109JGbOPlVr35wIqw/export?format=csv";

const scripts = {
    encourage: [
        "「思考回路をフル回転させろ！」",
        "「迷うな！過去のデータを信じろ！」",
        "「エラーを恐れるな！アップデートのチャンスだ！」"
    ],
    correct: [
        "「[SUCCESS] 見事だ！その直感、研ぎ澄まされているぞ！」",
        "「[CLEAR] 大正解！シナプスが繋がったな！」"
    ],
    wrong: [
        "「[ERROR] ドンマイだ！この失敗を次期アップデートに活かせ！」",
        "「[WARNING] 軌道修正が必要だ！解説データをインストールしろ！」"
    ],
    finish100: "「[PERFECT] 驚異的な処理能力だ！お前の情熱がシステムを超えたぞ！」",
    finishGreat: "「[MISSION COMPLETE] 合格ボーダー突破！確実な進化を検知したぞ！」",
    finishBad: "「[RETRY REQUIRED] まだポテンシャルを引き出しきれていない！再起動だ！」"
};

const teacherMessage = document.getElementById("teacher-message");
const currentQNum = document.getElementById("current-q-num");
const totalQNum = document.getElementById("total-q-num");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const resultArea = document.getElementById("result-area");
const explanationText = document.getElementById("explanation");
const nextBtn = document.getElementById("next-btn");

// --- 3. モード選択と問題読み込み ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 画面のボタンから呼ばれる関数
function startQuiz(limit) {
    questionLimit = limit;
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-contents").style.display = "block";
    teacherMessage.textContent = `「ターゲット確認。${limit}問の特訓を開始する！」`;
    fetchQuizData();
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

                // 選択された問題数だけ切り取る
                quizData = shuffleArray([...allQuizData]).slice(0, questionLimit);
                totalQNum.textContent = quizData.length;
                loadQuestion();
            }
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        teacherMessage.textContent = "「[FATAL ERROR] データベースへの接続に失敗した！」";
    }
}

function getRandomScript(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- 4. クイズの進行処理 ---
function loadQuestion() {
    resultArea.style.display = "none";
    optionsArea.innerHTML = "";
    
    const currentQuiz = quizData[currentIndex];
    currentQNum.textContent = String(currentIndex + 1).padStart(2, '0');
    questionText.textContent = currentQuiz.question;

    if (currentIndex > 0) {
        teacherMessage.textContent = getRandomScript(scripts.encourage);
    }

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
        nextBtn.textContent = "SHOW RESULTS >>";
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

// --- 5. Firebaseへの保存とダブルグラフ描画 ---
async function saveAndShowFinalResult() {
    const cardContents = document.getElementById("quiz-contents");
    resultArea.style.display = "none"; 
    
    const percentage = Math.round((score / quizData.length) * 100);
    const PASSING_BORDER = 70; // 仮想の合格ボーダー（70%）

    let finalScript = "";
    if (percentage === 100) finalScript = scripts.finish100;
    else if (percentage >= PASSING_BORDER) finalScript = scripts.finishGreat;
    else finalScript = scripts.finishBad;
    teacherMessage.textContent = finalScript;

    // ボーダーとの比較テキスト生成
    let comparisonHtml = "";
    if (percentage >= PASSING_BORDER) {
        comparisonHtml = `<h3 class="clear">TARGET CLEAR! 合格安全圏到達！</h3>`;
    } else {
        comparisonHtml = `<h3 class="warning">WARNING! 合格ボーダーまであと ${PASSING_BORDER - percentage}%！</h3>`;
    }

    cardContents.classList.add("final-result-screen");
    cardContents.innerHTML = `
        <h2 style="color:#00f3ff; font-family:'Orbitron', sans-serif;">SYSTEM REPORT</h2>
        <div class="final-score">${percentage}%</div>
        
        <div class="comparison-box">
            <p>国家試験 合格ボーダー(約70%)との比較</p>
            ${comparisonHtml}
        </div>

        <div class="charts-container">
            <!-- 1. 円グラフ（今回の正答・誤答比率） -->
            <div class="chart-wrapper">
                <canvas id="doughnutChart"></canvas>
            </div>
            <!-- 2. 線グラフ（過去の成長推移） -->
            <div class="chart-wrapper">
                <canvas id="historyChart"></canvas>
            </div>
        </div>

        <button class="next-btn final-retry-btn" style="margin-top:20px;" onclick="location.reload()">REBOOT SYSTEM (TOPへ戻る)</button>
    `;

    // 円グラフ（Doughnut Chart）の描画
    drawDoughnutChart(score, quizData.length - score);

    try {
        await db.collection("examResults").add({
            score: score,
            total: quizData.length,
            percentage: percentage,
            mode: questionLimit, // 何問モードで挑んだかも保存
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 折れ線グラフの描画
        drawHistoryChart();
    } catch (error) {
        console.error("Firebaseへの保存に失敗しました", error);
        teacherMessage.textContent = "「[WARNING] サーバーとの同期に失敗した！」";
    }
}

// 今回の成績を円グラフで表示
function drawDoughnutChart(correctCount, wrongCount) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['CORRECT (正解)', 'ERROR (不正解)'],
            datasets: [{
                data: [correctCount, wrongCount],
                backgroundColor: [
                    'rgba(0, 255, 128, 0.6)', // ネオングリーン
                    'rgba(255, 0, 85, 0.6)'   // ネオンレッド
                ],
                borderColor: [
                    '#00ff80',
                    '#ff0055'
                ],
                borderWidth: 1
            }]
        },
        options: {
            cutout: '65%',
            plugins: {
                legend: {
                    labels: { color: '#e2e8f0', font: { family: 'Orbitron' } }
                },
                title: {
                    display: true,
                    text: 'CURRENT MISSION RESULT',
                    color: '#00f3ff',
                    font: { family: 'Orbitron', size: 16 }
                }
            }
        }
    });
}

// 過去の成績を折れ線グラフで表示
async function drawHistoryChart() {
    const snapshot = await db.collection("examResults")
                             .orderBy("timestamp", "asc")
                             .limit(10)
                             .get();

    const labels = [];
    const dataPoints = [];
    let attempt = 1;

    snapshot.forEach(doc => {
        const data = doc.data();
        labels.push("T-" + attempt);
        dataPoints.push(data.percentage);
        attempt++;
    });

    const ctx = document.getElementById('historyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ACCURACY (%)',
                data: dataPoints,
                borderColor: '#00f3ff',
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#00f3ff',
                pointBorderColor: '#fff',
                pointRadius: 4,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Orbitron' } } },
                title: {
                    display: true,
                    text: 'GROWTH HISTORY (PAST 10)',
                    color: '#00f3ff',
                    font: { family: 'Orbitron', size: 16 }
                }
            },
            scales: {
                x: { 
                    ticks: { color: '#94a3b8', font: { family: 'Orbitron' } },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#94a3b8', font: { family: 'Orbitron' } },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}
