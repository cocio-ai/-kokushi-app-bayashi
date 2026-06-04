const firebaseConfig = { 
    apiKey: "AIzaSyAP4WmzOpwjst-KTgJtD99r12Azdw1n_D8", 
    authDomain: "kokushi-bayashi.firebaseapp.com", 
    projectId: "kokushi-bayashi", 
    storageBucket: "kokushi-bayashi.firebasestorage.app", 
    messagingSenderId: "930906961772", 
    appId: "1:930906961772:web:6564c3747eb8491114e649" 
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ★【修正】「シート1だけを指定する魔法の言葉（gid=0&single=true）」を追加しました★
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6wPUUpF-pqQG8SN0XRcR9p255oUNm768eSvPIdsAOXz_02x3q2ll1xJnAI2kJtOQMomJG7_Msm9Wx/pub?gid=0&single=true&output=csv";

let quizData = [];
let currentIndex = 0;
let score = 0;
let questionLimit = 10;
const PASSING_BORDER = 70; 

const voiceLines = {
    encourage: ["「さあ、次の問題だ！気合を入れ直せ！」", "「疲れてきた時が本当の勝負だぞ！食らいつけ！」", "「バヤシならできる！自分の努力を信じろ！」", "「熱く、そして冷静にな！知識を引き出せ！」"],
    correct: ["「大正解！その調子だバヤシ、お前の力は本物だ！」", "「ナイス判断だ！その知識が未来の患者を救うぞ！」", "「よっしゃあ！！教官も鼻が高いぞ！」"],
    wrong: ["「ドンマイ！今のミスは本番で間違えないための投資だ！」", "「ここで間違えてラッキーだと思え！次は絶対に間違えるな！」", "「落ち着け！解説を声に出して読んで、完全にモノにしろ！」"]
};

function getRandomVoice(type) {
    const lines = voiceLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
}

async function fetchQuizData() {
    try {
        // キャッシュ対策は &t= で繋ぐ
        const response = await fetch(SHEET_CSV_URL + "&t=" + new Date().getTime());
        
        if (!response.ok) throw new Error("HTTPエラー: " + response.status);
        const data = await response.text();

        if (data.includes("<html") || data.includes("<!DOCTYPE")) {
            document.getElementById("teacher-message").innerText = "「Google先生のHTML画面が返ってきたぞ！URLか公開設定のミスだ！」";
            return;
        }

        Papa.parse(data, {
            header: true, 
            skipEmptyLines: true,
            transformHeader: function(header) {
                return header.replace(/^\uFEFF/, '').trim();
            },
            complete: (results) => {
                try {
                    let allData = results.data.filter(row => row["問題文"] && row["問題文"].trim() !== "");
                    if (allData.length === 0) {
                        document.getElementById("teacher-message").innerText = "「問題データが0件だ！スプレッドシートの1行目が見出しになっているか確認しろ！」";
                        return;
                    }
                    allData.sort(() => Math.random() - 0.5);
                    quizData = allData.slice(0, questionLimit);
                    document.getElementById("total-q-num").innerText = quizData.length;
                    showQuiz();
                } catch (err) {
                    document.getElementById("teacher-message").innerText = "「システム内部エラーだ！詳細: " + err.message + "」";
                }
            }
        });
    } catch (e) { 
        document.getElementById("teacher-message").innerText = "「通信失敗だ！原因：【" + e.message + "】」"; 
    }
}

function showQuiz() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-contents").style.display = "block";
    loadQuestion();
}

function loadQuestion() {
    const q = quizData[currentIndex];
    if (!q) return; 
    document.getElementById("current-q-num").innerText = currentIndex + 1;
    document.getElementById("question-text").innerText = q["問題文"];
    if (currentIndex > 0) document.getElementById("teacher-message").innerText = getRandomVoice("encourage");

    const area = document.getElementById("options-area");
    area.innerHTML = "";
    
    [q["選択肢1"], q["選択肢2"], q["選択肢3"], q["選択肢4"]].forEach((text, i) => {
        if (!text || text.trim() === "") return;
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = text;
        btn.onclick = () => checkAnswer(i, btn);
        area.appendChild(btn);
    });
}

function checkAnswer(i, btn) {
    const q = quizData[currentIndex];
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b => b.disabled = true);
    
    const correctIdx = parseInt(q["正解番号"], 10);
    
    if (i === correctIdx) { 
        btn.classList.add("correct"); score++; 
        document.getElementById("teacher-message").innerText = getRandomVoice("correct");
    } else { 
        btn.classList.add("wrong"); 
        if (buttons[correctIdx]) buttons[correctIdx].classList.add("correct");
        document.getElementById("teacher-message").innerText = getRandomVoice("wrong");
    }
    
    let expText = q["解説"] ? q["解説"].replace(/<br>/g, '\n') : "解説データなし";
    document.getElementById("explanation").innerText = expText;
    document.getElementById("result-area").style.display = "block";
    
    if (currentIndex === quizData.length - 1) document.getElementById("next-btn").innerText = "MISSION CLEAR! 結果を見る >>";
    else document.getElementById("next-btn").innerText = "NEXT MISSION >>";
}

document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    if (currentIndex < quizData.length) { 
        document.getElementById("result-area").style.display = "none";
        loadQuestion(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else saveAndShowFinalResult();
};

function startQuiz(limit) { 
    questionLimit = limit; currentIndex = 0; score = 0;
    document.getElementById("teacher-message").innerText = "「データアクセス中... 待機しろ！」";
    fetchQuizData(); 
}

async function saveAndShowFinalResult() {
    document.getElementById("quiz-contents").style.display = "none";
    document.getElementById("final-screen").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const passRate = Math.round((score / quizData.length) * 100);
    document.getElementById("teacher-message").innerText = passRate >= PASSING_BORDER ? "「よくやった！ボーダー突破だ！」" : "「もう1回だ！限界を超えろ！」";
    document.getElementById("final-score-display").innerText = `${passRate}%`;
    document.getElementById("final-score-display").style.color = passRate >= PASSING_BORDER ? "#00ff80" : "#ff0055";

    let compHtml = passRate >= PASSING_BORDER ? `<p class="clear-text">TARGET CLEAR! 国試合格ボーダー(${PASSING_BORDER}%) 到達！</p>` : `<p class="warning-text">WARNING! 合格ボーダーまであと ${PASSING_BORDER - passRate}%！</p>`;
    document.getElementById("comparison-box").innerHTML = compHtml;

    drawDoughnutChart(score, quizData.length - score);

    try {
        await db.collection("examResults").add({ score: score, total: quizData.length, percentage: passRate, mode: questionLimit, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        drawHistoryChart();
    } catch (error) { console.error(error); }
}

let donutChartInstance = null; let lineChartInstance = null;
function drawDoughnutChart(correctCount, wrongCount) {
    if(donutChartInstance) donutChartInstance.destroy();
    donutChartInstance = new Chart(document.getElementById('doughnutChart').getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['正解', '不正解'], datasets: [{ data: [correctCount, wrongCount], backgroundColor: ['rgba(0, 255, 128, 0.8)', 'rgba(255, 0, 85, 0.5)'], borderColor: ['#00ff80', '#ff0055'], borderWidth: 2 }] },
        options: { cutout: '65%', plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: '今回の正答比率', color: '#00f3ff' } } }
    });
}

async function drawHistoryChart() {
    if(lineChartInstance) lineChartInstance.destroy();
    const snapshot = await db.collection("examResults").orderBy("timestamp", "asc").limit(15).get();
    const labels = [], dataPoints = [], borderPoints = []; let attempt = 1;
    snapshot.forEach(doc => { labels.push("T-" + attempt); dataPoints.push(doc.data().percentage); borderPoints.push(PASSING_BORDER); attempt++; });

    lineChartInstance = new Chart(document.getElementById('historyChart').getContext('2d'), {
        type: 'line',
        data: { labels: labels, datasets: [ { label: 'バヤシの正答率 (%)', data: dataPoints, borderColor: '#00f3ff', backgroundColor: 'rgba(0, 243, 255, 0.1)', borderWidth: 3, fill: true }, { label: 'ボーダー (70%)', data: borderPoints, borderColor: '#ff0055', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false } ] },
        options: { plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: '過去の成長と合格ライン', color: '#00f3ff' } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } } } }
    });
}

async function openStatsScreen() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("stats-screen").style.display = "block";
    try {
        const snapshot = await db.collection("examResults").orderBy("timestamp", "desc").get();
        const now = new Date().getTime(), oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000), oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
        let wTotal = 0, wCorrect = 0, mTotal = 0, mCorrect = 0;
        const logList = document.getElementById("log-list"); logList.innerHTML = ""; 
        if (snapshot.empty) { logList.innerHTML = `<p style="text-align: center;">まだ戦歴がないぞ！</p>`; return; }
        snapshot.forEach(doc => {
            const data = doc.data(); if (!data.timestamp) return; 
            const t = data.timestamp.toDate().getTime();
            if (t >= oneWeekAgo) { wTotal += data.total; wCorrect += data.score; }
            if (t >= oneMonthAgo) { mTotal += data.total; mCorrect += data.score; }
            const d = new Date(t);
            logList.innerHTML += `<div class="log-item"><span>${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</span><span>${data.mode}問</span><span class="log-pct ${data.percentage >= PASSING_BORDER ? "" : "low"}">${data.percentage}%</span></div>`;
        });
        document.getElementById("weekly-count").innerHTML = `${wTotal}<span>問</span>`; document.getElementById("weekly-rate").innerHTML = `${wTotal > 0 ? Math.round((wCorrect / wTotal) * 100) : 0}<span>%</span>`;
        document.getElementById("monthly-count").innerHTML = `${mTotal}<span>問</span>`; document.getElementById("monthly-rate").innerHTML = `${mTotal > 0 ? Math.round((mCorrect / mTotal) * 100) : 0}<span>%</span>`;
    } catch (e) { document.getElementById("log-list").innerHTML = `<p>データ取得エラー！</p>`; }
}
function closeStatsScreen() { document.getElementById("stats-screen").style.display = "none"; document.getElementById("start-screen").style.display = "block"; }
