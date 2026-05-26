const quizData = [
    {
        question: "成人女性の正常な安静時呼吸数はどれか。",
        options: ["8〜10回/分", "12〜20回/分", "22〜30回/分", "32〜40回/分"],
        correctIndex: 1,
        explanation: "正常な成人の安静時呼吸数は<strong>12〜20回/分</strong>です。ばやし、バイタルサインは基本中の基本だぞ！"
    },
    {
        question: "胃から分泌される消化酵素はどれか。",
        options: ["ペプシン", "アミラーゼ", "トリプシン", "リパーゼ"],
        correctIndex: 0,
        explanation: "胃液に含まれるのは<strong>ペプシン</strong>（蛋白質分解酵素）だ。アミラーゼは唾液や膵液だぞ。他の酵素と混同するな！"
    },
    {
        question: "日本の死因順位（令和3年）で第1位はどれか。",
        options: ["心疾患", "老衰", "悪性新生物〈がん〉", "脳血管疾患"],
        correctIndex: 2,
        explanation: "第1位は<strong>悪性新生物〈がん〉</strong>だ。統計データは毎年必ずチェックしておけ！ばやし、最新の動向に敏感になれ。"
    }
];

let currentIndex = 0;
let score = 0;

const scripts = {
    intro: [
        "「おい、ばやし！今日も国試の特訓を始めるぞ。気合入れていけよ！」",
        "「ばやし！iPadばかり見てないで、さっさと解きなさい！」",
        "「今日の必須問題は落とせないぞ。全問正解目指すんだ！」"
    ],
    encourage: [
        "「よし、ばやし。この問題はどうだ？」",
        "「焦らず、選択肢を最後までしっかり読めよ。」",
        "「ここは国試でよく出る引っかけだ。慎重にいけ。」"
    ],
    correct: [
        "「よし！その調子だ、ばやし！完璧じゃないか。」",
        "「ほう、やるな！今の理解は間違ってないぞ。」",
        "「当然だ。このレベルで迷っていてはダメだ！」"
    ],
    wrong: [
        "「こら、ばやし！どこを見てるんだ。基礎からやり直せ！」",
        "「おいおい...これは引っかけだぞ。まんまとハマるな！」",
        "「甘い！もっとテキストを読み込みなさい。解説をチェック！」"
    ],
    finish100: "「完璧だ、ばやし！この調子なら本番も絶対に受かるぞ！誇りに思うぞ！🦀」",
    finishGreat: "「全問正解とはいかなかったか...まあ悪くはない。間違えた部分は今日中に復習しておけよ！」",
    finishBad: "「おいおい、ばやし...何をやっているんだ。国家試験を甘く見るな！もう一回最初からやり直しだ！」"
};

const teacherMessage = document.getElementById("teacher-message");
const currentQNum = document.getElementById("current-q-num");
const totalQNum = document.getElementById("total-q-num");
const questionText = document.getElementById("question-text");
const optionsArea = document.getElementById("options-area");
const resultArea = document.getElementById("result-area");
const explanationText = document.getElementById("explanation");
const nextBtn = document.getElementById("next-btn");

totalQNum.textContent = quizData.length;
teacherMessage.textContent = getRandomScript(scripts.intro);
loadQuestion();

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
