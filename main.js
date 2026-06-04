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

// ★お前が勝ち取った最強の直通URLだ！！★
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6wPUUpF-pqQG8SN0XRcR9p255oUNm768eSvPIdsAOXz_02x3q2ll1xJnAI2kJtOQMomJG7_Msm9Wx/pub?output=csv";

let quizData = [];
let currentIndex = 0;
let score = 0;
let questionLimit = 10;
const PASSING_BORDER = 70; 

const voiceLines = {
    encourage: [
        "「さあ、次の問題だ！気合を入れ直せ！」",
        "「疲れてきた時が本当の勝負だぞ！食らいつけ！」",
        "「バヤシならできる！自分の努力を信じろ！」",
        "「熱く、そして冷静にな！知識を引き出せ！」",
        "「国試はメンタルゲーだ！絶対に折れるなよ！」",
        "「いい顔になってきたな！その集中力だ！」"
    ],
    correct: [
        "「大正解！その調子だバヤシ、お前の力は本物だ！」",
        "「ナイス判断だ！その知識が未来の患者を救うぞ！」",
        "「よっしゃあ！！教官も鼻が高いぞ！」",
        "「完璧だ！迷いがない、最高の解答だ！」",
        "「素晴らしい！このペースでガンガンいこうぜ！」"
    ],
    wrong: [
        "「ドンマイ！今のミスは本番で間違えないための投資だ！」",
        "「ここで間違えてラッキーだと思え！次は絶対に間違えるな！」",
        "「悔しいか！？その悔しさが記憶を脳に焼き付けるんだ！」",
        "「落ち着け！解説を声に出して読んで、完全にモノにしろ！」",
        "「焦るなバヤシ！基礎に立ち返れば必ず見えてくる！」"
    ]
};

function getRandomVoice(type) {
    const lines = voiceLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
}

async function fetchQuizData() {
    try {
        const response = await fetch(SHEET_CSV_URL + "?t=" + new Date().getTime());
        if (!response.ok) throw new Error("HTTP Status: " + response.status);
        const data = await response.text();

        if (data.includes("<html") || data.includes("<!DOCTYPE")) {
            document.getElementById("teacher-message").innerText = "「エラーだ！Googleの壁に弾かれたぞ！URLを確認してくれ！」";
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
                    console.error("内部エラー:", err);
                    document.getElementById("teacher-message").innerText = "「システム内部でエラーが発生したぞ！教官のミスだ、申し訳ない！」";
                }
            }
        });
    } catch (e) { 
        document.getElementById("teacher-message").innerText = "「通信エラーだ！電波のいいところでやり直してくれ！」"; 
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
    
    if (currentIndex > 0) {
        document.getElementById("teacher-message").innerText = getRandomVoice("encourage");
    }

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
        btn.classList.add("correct"); 
        score++; 
        document.getElementById("teacher-message").innerText = getRandomVoice("correct");
    } else { 
        btn.classList.add("wrong"); 
        if (buttons[correctIdx]) buttons[correctIdx].classList.add("correct");
        document.getElementById("teacher-message").innerText = getRandomVoice("wrong");
    }
    
    let expText = q["解説"] ? q["解説"].replace(/<br>/g, '\n') : "解説データなし";
    document.getElementById("explanation").innerText = expText;
    document.getElementById("result-area").style.display = "block";
    
    if (currentIndex === quizData.length - 1) {
        document.getElementById("next-btn").innerText = "MISSION CLEAR! 結果とグラフを見る >>";
    } else {
        document.getElementById("next-btn").innerText = "NEXT MISSION >>";
    }
}

document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    if (currentIndex < quizData.length) { 
        document.getElementById("result-area").style.display = "none";
        loadQuestion(); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else { 
        saveAndShowFinalResult();
    }
};

function startQuiz(limit) { 
    questionLimit = limit;
    currentIndex = 0;
    score = 0;
    
    if(limit === 120) {
        document.getElementById("teacher-message").innerText = "「本番モード起動だ！120問、お前の限界を見せてみろ！！絶対に集中を切らすな！！」";
    } else {
        document.getElementById("teacher-message").innerText = `「よし！${limit}問の特訓を開始するぞ！気合を入れろ！」`;
    }
    
    document.getElementById("teacher-message").innerText += "\n(データアクセス中... 待機しろ！)";
    fetchQuizData(); 
}

async function saveAndShowFinalResult() {
    document.getElementById("quiz-contents").style.display = "none";
    document.getElementById("final-screen").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const passRate = Math.round((score / quizData.length) * 100);
    
    let finalMessage = "";
    if(passRate === 100) finalMessage = "「完璧だ！お前の情熱の証だ！🔥」";
    else if(passRate >= PASSING_BORDER) finalMessage = "「よくやった！合格ボーダー突破だ！」";
    else finalMessage = "「どうした！お前の力はこんなもんじゃない！もう1回だ！」";
    document.getElementById("teacher-message").innerText = finalMessage;

    document.getElementById("final-score-display").innerText = `${passRate}%`;
    document.getElementById("final-score-display").style.color = passRate >= PASSING_BORDER ? "#00ff80" : "#ff0055";

    let compHtml = passRate >= PASSING_BORDER
        ? `<p class="clear-text">TARGET CLEAR! 国試合格ボーダー(${PASSING_BORDER}%) 到達！</p>`
        : `<p class="warning-text">WARNING! 国試合格ボーダー(${PASSING_BORDER}%)まで あと ${PASSING_BORDER - passRate}%！</p>`;
    document.getElementById("comparison-box").innerHTML = compHtml;

    drawDoughnutChart(score, quizData.length - score);

    try {
        await db.collection("examResults").add({
            score: score,
            total: quizData.length,
            percentage: passRate,
            mode: questionLimit,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        drawHistoryChart();
    } catch (error) {
        console.error("Firebase保存エラー:", error);
        document.getElementById("teacher-message").innerText = "「通信エラーで記録できなかったが、お前の努力は本物だ！」";
    }
}

let donutChartInstance = null;
let lineChartInstance = null;

function drawDoughnutChart(correctCount, wrongCount) {
    if(donutChartInstance) donutChartInstance.destroy();
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    donutChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['正解', '不正解'],
            datasets: [{
                data: [correctCount, wrongCount],
                backgroundColor: ['rgba(0, 255, 128, 0.8)', 'rgba(255, 0, 85, 0.5)'],
                borderColor: ['#00ff80', '#ff0055'],
                borderWidth: 2
            }]
        },
        options: { cutout: '65%', plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: '今回の正答比率', color: '#00f3ff' } } }
    });
}

async function drawHistoryChart() {
    if(lineChartInstance) lineChartInstance.destroy();
    const snapshot = await db.collection("examResults").orderBy("timestamp", "asc").limit(15).get();
    const labels = [];
    const dataPoints = [];
    const borderPoints = []; 
    let attempt = 1;

    snapshot.forEach(doc => {
        labels.push("T-" + attempt);
        dataPoints.push(doc.data().percentage);
        borderPoints.push(PASSING_BORDER);
        attempt++;
    });

    const ctx = document.getElementById('historyChart').getContext('2d');
    lineChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'バヤシの正答率 (%)',
                    data: dataPoints,
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#00f3ff',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: '国試合格ボーダー (70%)',
                    data: borderPoints,
                    borderColor: '#ff0055',
                    borderWidth: 2,
                    borderDash: [5, 5], 
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: '#e2e8f0' } }, title: { display: true, text: '過去15回の成長と合格ライン比較', color: '#00f3ff' } },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    });
}

async function openStatsScreen() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("stats-screen").style.display = "block";
    document.getElementById("teacher-message").innerText = "「お前の過去の戦歴だ！データは嘘をつかないぞ！」";
    
    try {
        const snapshot = await db.collection("examResults").orderBy("timestamp", "desc").get();
        const now = new Date();
        const oneWeekAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = now.getTime() - (30 * 24 * 60 * 60 * 1000);
        
        let wTotal = 0, wCorrect = 0, mTotal = 0, mCorrect = 0;
        const logListContainer = document.getElementById("log-list");
        logListContainer.innerHTML = ""; 

        if (snapshot.empty) {
            logListContainer.innerHTML = `<p style="text-align: center;">まだ戦歴がないぞ！特訓開始だ！</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.timestamp) return; 
            const examTimeMs = data.timestamp.toDate().getTime();

            if (examTimeMs >= oneWeekAgo) { wTotal += data.total; wCorrect += data.score; }
            if (examTimeMs >= oneMonthAgo) { mTotal += data.total; mCorrect += data.score; }

            const d = data.timestamp.toDate();
            const dateStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            const pctClass = data.percentage >= PASSING_BORDER ? "" : "low";
            
            logListContainer.innerHTML += `
                <div class="log-item">
                    <span>${dateStr}</span>
                    <span>${data.mode}問 (${data.score}/${data.total})</span>
                    <span class="log-pct ${pctClass}">${data.percentage}%</span>
                </div>
            `;
        });

        document.getElementById("weekly-count").innerHTML = `${wTotal}<span>問</span>`;
        document.getElementById("weekly-rate").innerHTML = `${wTotal > 0 ? Math.round((wCorrect / wTotal) * 100) : 0}<span>%</span>`;
        document.getElementById("monthly-count").innerHTML = `${mTotal}<span>問</span>`;
        document.getElementById("monthly-rate").innerHTML = `${mTotal > 0 ? Math.round((mCorrect / mTotal) * 100) : 0}<span>%</span>`;

    } catch (error) {
        document.getElementById("log-list").innerHTML = `<p style="color:#ff0055; text-align:center;">データ取得エラーだ！</p>`;
    }
}

function closeStatsScreen() { 
    document.getElementById("stats-screen").style.display = "none"; 
    document.getElementById("start-screen").style.display = "block"; 
    document.getElementById("teacher-message").innerText = "「よし！今日も限界を突破するぞ！特訓メニューを選べ！」";
}
