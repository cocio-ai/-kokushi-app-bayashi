// Firebase設定（そのまま）
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

// 連携URL（変更なし）
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1gv29nMOukoWjgY9ytkJBLvusbPTp-t3ErixSOCCwgHg/export?format=csv";

let quizData = [];
let currentIndex = 0;
let score = 0;
let questionLimit = 10;

// 🔥 熱血教官セリフ集（大幅増量！）
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

// ランダムにセリフを選ぶ関数
function getRandomVoice(type) {
    const lines = voiceLines[type];
    return lines[Math.floor(Math.random() * lines.length)];
}

async function fetchQuizData() {
    try {
        document.getElementById("teacher-message").innerText = "「データベースにアクセス中だ！通信完了まで待機しろ！」";
        const response = await fetch(SHEET_CSV_URL + "?t=" + new Date().getTime());
        const data = await response.text();
        Papa.parse(data, {
            header: true, 
            skipEmptyLines: true,
            complete: (results) => {
                let allData = results.data.filter(row => row["問題文"]).sort(() => Math.random() - 0.5);
                quizData = allData.slice(0, questionLimit);
                document.getElementById("total-q-num").innerText = quizData.length;
                showQuiz();
            }
        });
    } catch (e) { 
        document.getElementById("teacher-message").innerText = "「通信エラーだ！スプレッドシートの公開設定を見直してくれ！」"; 
    }
}

function showQuiz() {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("quiz-contents").style.display = "block";
    loadQuestion();
}

function loadQuestion() {
    const q = quizData[currentIndex];
    document.getElementById("current-q-num").innerText = currentIndex + 1;
    document.getElementById("question-text").innerText = q["問題文"];
    
    // 次の問題に進んだ時は「励ましボイス」
    if (currentIndex > 0) {
        document.getElementById("teacher-message").innerText = getRandomVoice("encourage");
    }

    const area = document.getElementById("options-area");
    area.innerHTML = "";
    
    [q["選択肢1"], q["選択肢2"], q["選択肢3"], q["選択肢4"]].forEach((text, i) => {
        if (!text) return; // 空の選択肢はスキップ
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
    buttons.forEach(b => b.disabled = true); // 連打防止
    
    if (i == q["正解番号"]) { 
        btn.className += " correct"; 
        score++; 
        document.getElementById("teacher-message").innerText = getRandomVoice("correct");
    } else { 
        btn.className += " wrong"; 
        buttons[q["正解番号"]].className += " correct"; // 正解を光らせる
        document.getElementById("teacher-message").innerText = getRandomVoice("wrong");
    }
    
    // スプレッドシートの解説を表示（改行コードを<br>に変換）
    let expText = q["解説"] ? q["解説"].replace(/<br>/g, '\n') : "解説データなし";
    document.getElementById("explanation").innerText = expText;
    document.getElementById("result-area").style.display = "block";
    
    if (currentIndex === quizData.length - 1) {
        document.getElementById("next-btn").innerText = "MISSION CLEAR! 結果を見る >>";
    }
}

document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    if (currentIndex < quizData.length) { 
        document.getElementById("result-area").style.display = "none";
        loadQuestion(); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 上までスクロール
    } else { 
        const passRate = Math.round((score / quizData.length) * 100);
        let finalMessage = "";
        if(passRate === 100) finalMessage = "「完璧だ！お前の情熱の証だ！🔥」";
        else if(passRate >= 70) finalMessage = "「よくやった！合格ボーダー突破だ！」";
        else finalMessage = "「どうした！お前の力はこんなもんじゃない！もう1回だ！」";
        
        alert(`特訓終了だ！\nスコア: ${score} / ${quizData.length} (正答率: ${passRate}%)\n\n教官：${finalMessage}`); 
        location.reload(); 
    }
};

function startQuiz(limit) { 
    questionLimit = limit;
    currentIndex = 0;
    score = 0;
    document.getElementById("teacher-message").innerText = `「よし！${limit}問の特訓を開始するぞ！気合を入れろ！」`;
    fetchQuizData(); 
}
