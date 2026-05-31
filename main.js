// --- 1. Firebaseの初期設定 ---
const firebaseConfig = {
    apiKey: "AIzaSyAP4WmzOpwjst-KTgJtD99r12Azdw1n_D8",
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

let allQuizData = []; 
let quizData = [];    
let currentIndex = 0;
let score = 0;
let questionLimit = 10; 

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/11zzNYvPn6RgirwpnYVnnpSyFEH109JGbOPlVr35wIqw/export?format=csv";

// ★熱血教官のセリフ集★
const scripts = {
    encourage: [
        "「その意気だ！もっと熱くなれ！」",
        "「迷うな！自分の努力を信じろ！」",
        "「苦しい時こそ成長のチャンスだ！いけー！」"
    ],
    correct: [
        "「ナイス！その答え、最高に熱いぜ！」",
        "「大正解！今の君は誰よりも輝いてるぞ！」"
    ],
    wrong: [
        "「ドンマイ！失敗は成功のもとだ！次で取り返すぞ！」",
        "「惜しい！解説を読んで確実にモノにしろ！」"
    ],
    finish100: "「完璧だ！この満点は、お前の情熱の証だ！🔥」",
    finishGreat: "「よく頑張った！合格ボーダー突破だ！その調子で突っ走れ！」",
    finishBad: "「どうした！お前の力はこんなもんじゃないはずだ！もう1回だ！」"
};

const teacherMessage = document.getElementById("teacher-message");
const currentQNum = document.getElementById("current-q-num");
const totalQNum = document.getElementById("total-q-num");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const resultArea = document.getElementById("result-area");
const explanationText = document.getElementById("explanation");
const nextBtn = document.getElementById("next-btn");

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startQuiz(limit) {
    questionLimit = limit;
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-contents").style.display = "block";
    teacherMessage.textContent = `「気合を入れろ！${limit}問の特訓を開始するぞ！」`;
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

                quizData = shuffleArray([...allQuizData]).slice(0, questionLimit);
                totalQNum.textContent = quizData.length;
                loadQuestion();
            }
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        teacherMessage.textContent = "「エラーだ！通信環境を確認してくれ！」";
    }
}

function getRandomScript(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

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
        nextBtn.textContent = "特訓結果を見る！ >>";
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

nextBtn.onclick = () => {
    currentIndex++;
    selectedIndex = null; 
    if (currentIndex < quizData.length) {
        loadQuestion();
    } else {
        saveAndShowFinalResult();
        setTimeout(scrollToTop, 100);
    }
};

async function saveAndShowFinalResult() {
    const cardContents = document.getElementById("quiz-contents");
    resultArea.style.display = "none"; 
    
    const percentage = Math.round((score / quizData.length) * 100);
    const PASSING_BORDER = 70; 

    let finalScript = "";
    if (percentage === 100) finalScript = scripts.finish100;
    else if (percentage >= PASSING_BORDER) finalScript = scripts.finishGreat;
    else finalScript = scripts.finishBad;
    teacherMessage.textContent = finalScript;

    let comparisonHtml = "";
    if (percentage >= PASSING_BORDER) {
        comparisonHtml = `<h3 class="clear">TARGET CLEAR! 合格安全圏到達！</h3>`;
    } else {
        comparisonHtml = `<h3 class="warning">WARNING! 合格ボーダーまであと ${PASSING_BORDER - percentage}%！</h3>`;
    }

    cardContents.classList.add("final-result-screen");
    cardContents.innerHTML = `
        <h2 style="color:#00f3ff; font-family:'Orbitron', sans-serif;">熱血！特訓レポート</h2>
        <div class="final-score">${percentage}%</div>
        
        <div class="comparison-box">
            <p>国家試験 合格ボーダー(約70%)との比較</p>
            ${comparisonHtml}
        </div>

        <div class="charts-container">
            <div class="chart-wrapper">
                <canvas id="doughnutChart"></canvas>
            </div>
            <div class="chart-wrapper">
                <canvas id="historyChart"></canvas>
            </div>
        </div>

        <button class="next-btn final-retry-btn" style="margin-top:20px;" onclick="location.reload()">トップに戻る</button>
    `;

    drawDoughnutChart(score, quizData.length - score);

    try {
        await db.collection("examResults").add({
            score: score,
            total: quizData.length,
            percentage: percentage,
            mode: questionLimit, 
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        drawHistoryChart();
    } catch (error) {
        console.error("Firebaseへの保存に失敗しました", error);
        teacherMessage.textContent = "「通信エラーだ！だかお前の努力は無駄じゃないぞ！」";
    }
}

function drawDoughnutChart(correctCount, wrongCount) {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['正解', '不正解'],
            datasets: [{
                data: [correctCount, wrongCount],
                backgroundColor: ['rgba(0, 255, 128, 0.6)', 'rgba(255, 0, 85, 0.6)'],
                borderColor: ['#00ff80', '#ff0055'],
                borderWidth: 1
            }]
        },
        options: {
            cutout: '65%',
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Noto Sans JP' } } },
                title: { display: true, text: '今回の成績', color: '#00f3ff', font: { family: 'Noto Sans JP', size: 16 } }
            }
        }
    });
}

async function drawHistoryChart() {
    const snapshot = await db.collection("examResults").orderBy("timestamp", "asc").limit(10).get();
    const labels = [];
    const dataPoints = [];
    let attempt = 1;

    snapshot.forEach(doc => {
        labels.push("T-" + attempt);
        dataPoints.push(doc.data().percentage);
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
                borderColor: '#00f3ff',
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#00f3ff',
                pointRadius: 4,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#e2e8f0', font: { family: 'Noto Sans JP' } } },
                title: { display: true, text: '過去10回の成長記録', color: '#00f3ff', font: { family: 'Noto Sans JP', size: 16 } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8', font: { family: 'Orbitron' } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8', font: { family: 'Orbitron' } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    });
}

async function openStatsScreen() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("stats-screen").style.display = "block";
    teacherMessage.textContent = "「お前の過去の戦歴だ！しっかり振り返れ！」";
    setTimeout(scrollToTop, 50);

    try {
        const snapshot = await db.collection("examResults").orderBy("timestamp", "desc").get();
        
        const now = new Date();
        const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);

        let weeklyTotalQuestions = 0;
        let weeklyCorrectQuestions = 0;
        let monthlyTotalQuestions = 0;
        let monthlyCorrectQuestions = 0;

        const logListContainer = document.getElementById("log-list");
        logListContainer.innerHTML = ""; 

        if (snapshot.empty) {
            logListContainer.innerHTML = `<p style="color: #64748b; text-align: center; font-size: 13px;">まだ戦歴がないぞ！特訓開始だ！</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.timestamp) return; 

            const examDate = data.timestamp.toDate();
            const examTimeMs = examDate.getTime();

            if (examTimeMs >= oneWeekAgo) {
                weeklyTotalQuestions += data.total;
                weeklyCorrectQuestions += data.score;
            }

            if (examTimeMs >= oneMonthAgo) {
                monthlyTotalQuestions += data.total;
                monthlyCorrectQuestions += data.score;
            }

            const dateStr = String(examDate.getMonth() + 1).padStart(2, '0') + "/" + 
                            String(examDate.getDate()).padStart(2, '0') + " " + 
                            String(examDate.getHours()).padStart(2, '0') + ":" + 
                            String(examDate.getMinutes()).padStart(2, '0');

            const pctClass = data.percentage >= 70 ? "" : "low";
            const itemHtml = `
                <div class="log-item">
                    <span class="log-date">${dateStr}</span>
                    <span class="log-meta">${data.mode}問モード (${data.score}/${data.total})</span>
                    <span class="log-pct ${pctClass}">${data.percentage}%</span>
                </div>
            `;
            logListContainer.innerHTML += itemHtml;
        });

        document.getElementById("weekly-count").innerHTML = `${weeklyTotalQuestions}<span>問</span>`;
        const weeklyRate = weeklyTotalQuestions > 0 ? Math.round((weeklyCorrectQuestions / weeklyTotalQuestions) * 100) : 0;
        document.getElementById("weekly-rate").innerHTML = `${weeklyRate}<span>%</span>`;

        document.getElementById("monthly-count").innerHTML = `${monthlyTotalQuestions}<span>問</span>`;
        const monthlyRate = monthlyTotalQuestions > 0 ? Math.round((monthlyCorrectQuestions / monthlyTotalQuestions) * 100) : 0;
        document.getElementById("monthly-rate").innerHTML = `${monthlyRate}<span>%</span>`;

    } catch (error) {
        console.error("統計データの取得に失敗しました:", error);
        document.getElementById("log-list").innerHTML = `<p style="color: #ff0055; text-align: center;">データの取得に失敗した！</p>`;
    }
}

function closeStatsScreen() {
    document.getElementById("stats-screen").style.display = "none";
    document.getElementById("start-screen").style.display = "block";
    teacherMessage.textContent = "「よし！今日も限界を突破するぞ！特訓メニューを選べ！」";
    setTimeout(scrollToTop, 50);
}
