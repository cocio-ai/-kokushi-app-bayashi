// スプレッドシートから読み込んだデータを入れる空の箱
let quizData = [];
let currentIndex = 0;
let score = 0;

// ★スプレッドシート（CSV形式）のURL★
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/11zzNYvPn6RgirwpnYVnnpSyFEH109JGbOPlVr35wIqw/export?format=csv";

const scripts = {
    intro: [
        "「わしが国試塾塾長、かにをである！！」",
        "「気合を入れい！！本日の特訓を開始する！！」",
        "「貴様ら、国試をナメるなよ！！死ぬ気でかかってこい！！」"
    ],
    encourage: [
        "「うむ！この問題、貴様ならどう解く！！」",
        "「男なら迷わず直感でいけい！！いや、選択肢は最後まで読めい！！」",
        "「ここは引っかけである！刮目して見よ！！」",
        "「己の直感を信じ、そして論理で打ち破れい！！」"
    ],
    correct: [
        "「うむ！！見事である！！」",
        "「よくぞ答えた！！それでこそわしが見込んだ生徒よ！！」",
        "「大正解である！！その調子で突き進めい！！」",
        "「うおおおお！！完璧な解答である！！」"
    ],
    wrong: [
        "「大ばか者があああ！！基礎からやり直せい！！」",
        "「たるんどる！！テキスト100ページ分、読んでから出直してこい！！」",
        "「なんたる失態！！この解説を血肉となるまで頭に叩き込めい！！」",
        "「貴様、どこを見ている！！罠にまんまとハマりおって！！」"
    ],
    finish100: "「わしが国試塾塾長、かにをである！！貴様の満点、見事なり！！本番もその意気で行けい！！🦀🔥」",
    finishGreat: "「うむ、悪くない成績である！だが、間違えた箇所は今日中に復習せい！！休むのはそれからだ！！」",
    finishBad: "「大ばか者があああ！！この成績で受かると思っているのか！！今すぐ特訓を最初からやり直せい！！」"
};

const teacherMessage = document.getElementById("teacher-message");
const currentQNum = document.getElementById("current-q-num");
const totalQNum = document.getElementById("total-q-num");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const resultArea = document.getElementById("result-area");
const explanationText = document.getElementById("explanation");
const nextBtn = document.getElementById("next-btn");

// --- スプレッドシートからデータを読み込む処理 ---
async function fetchQuizData() {
    try {
        teacherMessage.textContent = "「今、最新の国試データを取り寄せておる！刮目して待てい！！」";

        const response = await fetch(SHEET_CSV_URL);
        const csvText = await response.text();

        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // スプレッドシートのデータをアプリ用の形に変換
                quizData = results.data.map(row => ({
                    question: row["問題文"],
                    options: [row["選択肢1"], row["選択肢2"], row["選択肢3"], row["選択肢4"]],
                    correctIndex: parseInt(row["正解番号"], 10),
                    explanation: row["解説"]
                }));

                totalQNum.textContent = quizData.length;
                teacherMessage.textContent = getRandomScript(scripts.intro);
                loadQuestion();
            }
        });
    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        teacherMessage.textContent = "「エラーである！データが読み込めぬゆえ、通信環境を確認せい！」";
    }
}

fetchQuizData();

function getRandomScript(arr) {
    if (typeof arr === 'string') return arr; 
    return arr[Math.floor(Math.random() * arr.length)];
}

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
        showFinalResult();
    }
};

function showFinalResult() {
    const cardContents = document.getElementById("quiz-contents");
    resultArea.style.display = "none"; 
    
    const percentage = Math.round((score / quizData.length) * 100);

    let finalScript = "";
    if (percentage === 100) {
        finalScript = scripts.finish100;
    } else if (percentage >= 70) {
        finalScript = scripts.finishGreat;
    } else {
        finalScript = scripts.finishBad;
    }
    teacherMessage.textContent = finalScript;

    cardContents.classList.add("final-result-screen");
    cardContents.innerHTML = `
        <h2>特訓終了！</h2>
        <div class="q-progress">${quizData.length}問中 ${score}問 正解</div>
        <div class="final-score">${percentage}%</div>
        <p>間違えた問題は、すぐに復習して理解を深めよう！</p>
        <button class="next-btn final-retry-btn" onclick="location.reload()">もう一度特訓する</button>
    `;
}
