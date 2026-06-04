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

// ★これぞ本物のIDだ！絶対に書き換えるな！★
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1gv29nMOukoWjgY9ytkJBLvusbPTp-t3ErixSOCCwgHg/export?format=csv";

let quizData = [];
let currentIndex = 0;
let score = 0;
let questionLimit = 10;

async function fetchQuizData() {
    try {
        const response = await fetch(SHEET_CSV_URL + "?t=" + new Date().getTime());
        const data = await response.text();
        Papa.parse(data, {
            header: true, 
            skipEmptyLines: true,
            complete: (results) => {
                // 問題文が存在する行だけを抽出し、ランダムにシャッフルする
                let allData = results.data.filter(row => row["問題文"]).sort(() => Math.random() - 0.5);
                quizData = allData.slice(0, questionLimit); // 選択した問題数だけ切り取る
                document.getElementById("total-q-num").innerText = quizData.length;
                showQuiz();
            }
        });
    } catch (e) { 
        alert("データ読み込み失敗！スプレッドシートの公開設定を確認しろ！"); 
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
    const area = document.getElementById("options-area");
    area.innerHTML = "";
    
    [q["選択肢1"], q["選択肢2"], q["選択肢3"], q["選択肢4"]].forEach((text, i) => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.innerText = text;
        btn.onclick = () => checkAnswer(i, btn);
        area.appendChild(btn);
    });
}

function checkAnswer(i, btn) {
    const q = quizData[currentIndex];
    // 選択肢のボタンをすべて無効化して連打を防ぐ
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(b => b.disabled = true);
    
    if (i == q["正解番号"]) { 
        btn.className += " correct"; 
        score++; 
        document.getElementById("teacher-message").innerText = "「ナイス！最高に熱いぜ！」";
    } else { 
        btn.className += " wrong"; 
        // 正解のボタンを緑色に光らせる
        buttons[q["正解番号"]].className += " correct";
        document.getElementById("teacher-message").innerText = "「ドンマイ！次で必ず取り返すぞ！」";
    }
    
    document.getElementById("explanation").innerText = q["解説"];
    document.getElementById("result-area").style.display = "block";
    
    if (currentIndex === quizData.length - 1) {
        document.getElementById("next-btn").innerText = "特訓結果を見る！ >>";
    }
}

document.getElementById("next-btn").onclick = () => {
    currentIndex++;
    if (currentIndex < quizData.length) { 
        loadQuestion(); 
        document.getElementById("result-area").style.display = "none";
        document.getElementById("teacher-message").innerText = "「その意気だ！もっと熱くなれ！」";
    } else { 
        alert(`特訓終了だ！スコア: ${score} / ${quizData.length}\nよく頑張った！`); 
        location.reload(); 
    }
};

function startQuiz(limit) { 
    questionLimit = limit;
    currentIndex = 0;
    score = 0;
    document.getElementById("teacher-message").innerText = `「気合を入れろ！${limit}問の特訓を開始するぞ！」`;
    fetchQuizData(); 
}

function openStatsScreen() { 
    alert("統計機能は現在準備中だ！まずは目の前の特訓に集中しろ！"); 
}

function closeStatsScreen() { 
    document.getElementById("stats-screen").style.display = "none"; 
    document.getElementById("start-screen").style.display = "block"; 
}
