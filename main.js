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

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1gv29nMOukoWjgY9ytkJBLvusbPTp-t3ErixSOCCwgHg/gviz/tq?tqx=out:csv";

let quizData = [];
let currentIndex = 0;
let score = 0;
let questionLimit = 10;
const PASSING_BORDER = 70; 

const voiceLines = {
    encourage: ["「さあ、次の問題だ！気合を入れ直せ！」", "「疲れてきた時が本当の勝負だぞ！食らいつけ！」", "「バヤシならできる！自分の努力を信じろ！」"],
    correct: ["「大正解！その調子だバヤシ、お前の力は本物だ！」", "「ナイス判断だ！その知識が未来の患者を救うぞ！」"],
    wrong: ["「ドンマイ！今のミスは本番で間違えないための投資だ！」", "「ここで間違えてラッキーだと思え！次は絶対に間違えるな！」"]
};

function getRandomVoice(type) {
    const lines = voiceLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
}

// ★起動時にセーブデータがあるかチェック！★
window.onload = () => {
    if (localStorage.getItem('bayashi_save_data')) {
        document.getElementById('resume-btn').style.display = 'block';
    }
};

function fetchQuizData() {
    Papa.parse(SHEET_CSV_URL, {
        download: true,
        header: true, 
        skipEmptyLines: true,
        complete: (results) => {
            try {
                let allData = results.data.filter(row => row["問題文"] && row["問題文"].trim() !== "");
                if (allData.length === 0) {
                    document.getElementById("teacher-message").innerText = "「データが空だ！スプレッドシートを確認してくれ！」"; return;
                }
                allData.sort(() => Math.random() - 0.5);
                quizData = allData.slice(0, questionLimit);
                document.getElementById("total-q-num").innerText = quizData.length;
                showQuiz();
            } catch (err) {
                document.getElementById("teacher-message").innerText = "「システムエラー: " + err.message + "」";
            }
        },
        error: (err) => { document.getElementById("teacher-message").innerText = "「通信失敗: " + err.message + "」"; }
    });
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
    document.getElementById("question-text").innerHTML = q["問題文"].replace(/\n/g, '<br>');
    
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
    
    let expText = q["解説"] ? q["解説"].replace(/\n/g, '<br>') : "解説データが登録されていないぞ！";
    document.getElementById("explanation").innerHTML = expText;
    document.getElementById("result-area").style.display = "block";
    document.getElementById("next-btn").style.display = "block";
    
    if (currentIndex === quizData.length - 1) document.getElementById("next-btn").innerText = "MISSION CLEAR! 結果を見る >>";
    else document.getElementById("next-btn").innerText = "NEXT MISSION >>";
}

document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    if (currentIndex < quizData.length) { 
        document.getElementById("result-area").style.display = "none";
        document.getElementById("next-btn").style.display = "none";
        loadQuestion(); window.scrollTo({ top: 0, behavior: 'smooth' });
    } else saveAndShowFinalResult();
};

function startQuiz(limit) { 
    // 新しく始める時は過去のセーブを消す
    localStorage.removeItem('bayashi_save_data');
    
    questionLimit = limit; currentIndex = 0; score = 0;
    if(limit === 120) {
        document.getElementById("teacher-message").innerText = "「本番モード起動だ！120問、限界を見せてみろ！」";
    } else {
        document.getElementById("teacher-message").innerText = `「よし！${limit}問の特訓を開始するぞ！気合を入れろ！」`;
    }
    document.getElementById("teacher-message").innerText += "\n(データアクセス中... 待機しろ！)";
    fetchQuizData(); 
}

// ★セーブ機能とリタイア機能★
function quitQuiz(isSave) {
    if (isSave) {
        const saveData = { quizData, currentIndex, score, questionLimit };
        localStorage.setItem('bayashi_save_data', JSON.stringify(saveData));
        alert("「現在の状態をセーブしたぞ！しっかり休んで、また戻ってこい！」");
        location.reload();
    } else {
        if(confirm("「本当にリタイアするのか！？ここまでの記録は消えてしまうぞ！」")) {
            localStorage.removeItem('bayashi_save_data');
            location.reload();
        }
    }
}

// ★続きから再開する機能★
function resumeQuiz() {
    const saved = localStorage.getItem('bayashi_save_data');
    if (saved) {
        const parsed = JSON.parse(saved);
        quizData = parsed.quizData;
        currentIndex = parsed.currentIndex;
        score = parsed.score;
        questionLimit = parsed.questionLimit;
        
        document.getElementById("total-q-num").innerText = quizData.length;
        document.getElementById("start-screen").style.display = "none";
        document.getElementById("quiz-contents").style.display = "block";
        
        document.getElementById("result-area").style.display = "none";
        document.getElementById("next-btn").style.display = "none";
        loadQuestion();
        
        document.getElementById("teacher-message").innerText = "「よく戻ってきた！セーブ地点から特訓再開だ！」";
    }
}

async function saveAndShowFinalResult() {
    // 完全にクリアしたらセーブデータを消す
    localStorage.removeItem('bayashi_save_data');

    document.getElementById("quiz-contents").style.display = "none";
    document.getElementById("final-screen").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const passRate = Math.round((score / quizData.length) * 100);
    document.getElementById("teacher-message").innerText = passRate >= PASSING_BORDER ? "「よくやった！ボーダー突破だ！」" : "「もう1回だ！限界を超えろ！」";
    document.getElementById("final-score-display").innerText = `${passRate}%`;
    document.getElementById("final-score-display").style.color = passRate >= PASSING_BORDER ? "#00ff80" : "#ff0055";

    let compHtml = passRate >= PASSING_BORDER ? `<p class="clear-text">TARGET CLEAR! 国試合格ボーダー到達！</p>` : `<p class="warning-text">WARNING! 合格ボーダーまであと ${PASSING_BORDER - passRate}%</p>`;
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
        data: { labels: labels, datasets: [ { label: '正答率 (%)', data: dataPoints, borderColor: '#00f3ff', backgroundColor: 'rgba(0, 243, 255, 0.1)', borderWidth: 3, fill: true }, { label: 'ボーダー (70%)', data: borderPoints, borderColor: '#ff0055', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false } ] },
        options: { plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: '成長と合格ライン', color: '#00f3ff' } }, scales: { x: { ticks: { color: '#94a3b8' } }, y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' } } } }
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
        if (snapshot.empty) { logList.innerHTML = `<p style="text-align: center;">戦歴なし</p>`; return; }
        snapshot.forEach(doc => {
            const data = doc.data(); if (!data.timestamp) return; 
            const t = data.timestamp.toDate().getTime();
            if (t >= oneWeekAgo) { wTotal += data.total; wCorrect += data.score; }
            if (t >= oneMonthAgo) { mTotal += data.total; mCorrect += data.score; }
            const d = new Date(t);
            logList.innerHTML += `
                <div class="log-item">
                    <span class="log-date">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}</span>
                    <span class="log-mode">${data.mode}問</span>
                    <span class="log-pct ${data.percentage >= PASSING_BORDER ? "" : "low"}">${data.percentage}%</span>
                </div>`;
        });
        document.getElementById("weekly-count").innerText = wTotal; document.getElementById("weekly-rate").innerText = wTotal > 0 ? Math.round((wCorrect / wTotal) * 100) : 0;
        document.getElementById("monthly-count").innerText = mTotal; document.getElementById("monthly-rate").innerText = mTotal > 0 ? Math.round((mCorrect / mTotal) * 100) : 0;
    } catch (e) { document.getElementById("log-list").innerHTML = `<p>データ取得エラー</p>`; }
}
function closeStatsScreen() { document.getElementById("stats-screen").style.display = "none"; document.getElementById("start-screen").style.display = "block"; }
