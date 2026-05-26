const quizData = [
    {
        question: "成人女性の正常な安静時呼吸数はどれか。",
        options: ["8〜10回/分", "12〜20回/分", "22〜30回/分", "32〜40回/分"],
        correctIndex: 1,
        explanation: "正常な成人の安静時呼吸数は<strong>12〜20回/分</strong>だわ。バヤシ、バイタルサインは基本中の基本だでね！"
    },
    {
        question: "胃から分泌される消化酵素はどれか。",
        options: ["ペプシン", "アミラーゼ", "トリプシン", "リパーゼ"],
        correctIndex: 0,
        explanation: "胃液に含まれるのは<strong>ペプシン</strong>（蛋白質分解酵素）だで。アミラーゼは唾液や膵液だがね。他の酵素とごっちゃにしたらかんよ！"
    },
    {
        question: "日本の死因順位（令和3年）で第1位はどれか。",
        options: ["心疾患", "老衰", "悪性新生物〈がん〉", "脳血管疾患"],
        correctIndex: 2,
        explanation: "第1位は<strong>悪性新生物〈がん〉</strong>だがね。統計データは毎年必ずチェックしやあよ！バヤシ、最新の動向に敏感にならんと！"
    }
];

let currentIndex = 0;
let score = 0;

// --- 名古屋弁バリエーション大増量 ---
const scripts = {
    intro: [
        "「バヤシ！今日もしっかりやるでね！気合入れやあよ！」",
        "「どえりゃあ大事な国試だがね。サボっとったらかんで！」",
        "「iPadばっか触っとらんと、はよ解きやあ！」",
        "「今日の問題はでら重要だで、絶対に落とせんよ！」",
        "「ちんたらしとったらかんわ！さっさと始めるで！」",
        "「バヤシ、準備はええか？今日もバシッといくでね！」",
        "「国試舐めとったらいかんに！気ぃ引き締めやあ！」",
        "「毎日コツコツやらんと、後ででら後悔するでね！」",
        "「かにを先生がしっかり教えるで、ついてきやあよ！」",
        "「さあ、今日も頭フル回転でいこまい！」",
        "「寝ぼけとる場合じゃないわ！一問一答、気合入れてけ！」",
        "「バヤシの底力、今日も先生に見せたってちょうだい！」",
        "「合格するためには、今日の踏ん張りがでら効いてくるでね。」",
        "「よそ見しとったらかんよ！画面に集中しやあ！」",
        "「よっしゃ、特訓開始だわ！全問正解狙うでね！」"
    ],
    encourage: [
        "「バヤシ、この問題はどうだね？」",
        "「焦らんでええで、選択肢最後までよー読みやあ。」",
        "「ここは国試ででらよう出る引っ掛けだで、気ぃつけやあ。」",
        "「わからんくても、まずは落ち着いて考えやあ。」",
        "「バヤシなら絶対解けるで、自分を信じやあよ！」",
        "「どえりゃあ悩むかもしれんけど、基本を思い出すんだわ！」",
        "「ここで点取れたらでらデカいぞ！」",
        "「深呼吸して、問題文の隅々まで見やあね。」",
        "「引っ掛けの匂いがプンプンするで、慎重にいこまい！」",
        "「どっちか迷うやつだわ。消去法でしっかり絞りやあ！」",
        "「諦めたらかん！頭の引き出し、全部開けてみやあ！」",
        "「この問題、昨日の復習が生きるはずだでね。」",
        "「慌てんくても時間は逃げんわ。じっくり見やあよ。」",
        "「直感も大事だけど、論理的に考えんと足元すくわれるでね！」",
        "「先生もここで応援しとるで、バシッと決めたって！」"
    ],
    correct: [
        "「よし！その調子だがね、バヤシ！完璧だわ！」",
        "「ほう、やるがや！その理解ででらバッチリだで。」",
        "「当然だわね。このレベルで迷っとったらいかんて！」",
        "「どえりゃあ素晴らしいがね！天才かもしれんわ！」",
        "「その通り！バヤシ、でら賢いがや！」",
        "「よう解けたね！先生もでら嬉しいわ！」",
        "「お見事！この調子でガンガンいこまい！」",
        "「バッチリだがね！解説もよー読んどきやあよ。」",
        "「その意気だわ！国試もそのペースでいけるでね！」",
        "「でらええ感じだがね！次もこの調子で頼むよ！」",
        "「見直しせんでも自信満々だね！その強気がええわ。」",
        "「バヤシ、成長しとるがね！先生、感動したわ！」",
        "「ええぞええぞ！満点ペースだがね！」",
        "「正解だわ！でも油断しとったらかんでね。」",
        "「どえりゃあ気持ちええ正解だがね！次いこまい！」"
    ],
    wrong: [
        "「だめだがね、バヤシ！どこ見とるの。基礎からやり直しだわ！」",
        "「おいおい…でら見事な引っ掛けにハマっとるがや！」",
        "「甘いわ！もっとテキストよー読みなさい。解説チェックしやあ！」",
        "「どえりゃあ惜しいけど、違うがや！もう一回よう考えやあ！」",
        "「何やっとるの！こんなとこで間違えとったらかんて！」",
        "「あかーん！そこはテストででら狙われるポイントだでね！」",
        "「バヤシ、気ぃ抜けとるんじゃないの？シャキッとせんか！」",
        "「そこ間違うのは、まだ理解が足りん証拠だがね！」",
        "「くぅ〜っ！次間違えたらおやつ抜きだでね！」",
        "「ここで間違えたのは逆にラッキーだわ。本番までに絶対覚えやあ！」",
        "「あちゃー、やってもうたね。でも、落ち込んどる暇はないで！」",
        "「先生、悲しいわ…。こんな基本問題で落としたらかん！」",
        "「問題文の『誤っているものを選べ』を見落としてないかね？」",
        "「しゃあない、間違えは誰にでもあるわ。しっかり復習しやあ！」",
        "「ここでつまずくとは…バヤシ、特訓のやり直しだがね！」"
    ],
    finish100: [
        "「でら完璧だがね、バヤシ！この調子なら本番も絶対受かるわ！誇りに思うでね！🦀」",
        "「どえりゃあ素晴らしい！全問正解だがね！今日はでら美味いもん食べに行こまい！🦀」",
        "「バヤシ、お前さん天才だがね！先生、嬉しくて涙が出てくるわ！🦀」",
        "「満点だがね！この最高の状態を本番までキープしやあよ！🦀」",
        "「非の打ち所がないわ！バヤシなら立派な看護師になれるでね！🦀」"
    ],
    finishGreat: [
        "「全問正解とはいかんかったね…まあ悪くはないわ。間違えたとこは今日中に復習しやあよ！」",
        "「惜しかったがね！あとちょっとで完璧だったわ。絶対復習せんとかんよ！」",
        "「でら頑張ったがね！でも、国試は甘くないで、間違えた問題はノートにまとめときやあ！」",
        "「合格ラインには乗っとるけど、油断大敵だわ！慢心したらかんでね！」",
        "「あと一歩だがね！バヤシなら次は絶対満点取れると信じとるでね！」"
    ],
    finishBad: [
        "「おいおい、バヤシ…何やっとるの。国試舐めとったらかんわ！もう一回最初からやり直しだがね！」",
        "「どえりゃあヒドイ点数だがね…。バヤシ、今日から先生と徹夜で特訓だわ！」",
        "「あかーん！こんな点数じゃ国試はパスできんて！基礎から徹底的に叩き直すでね！」",
        "「バヤシ、本気出しとるかね？先生、でらガッカリだわ…。はい、再テスト！」",
        "「このままじゃアカンわ！一回深呼吸して、最初からやり直そまい！」"
    ]
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
        finalScript = getRandomScript(scripts.finish100);
    } else if (percentage >= 70) {
        finalScript = getRandomScript(scripts.finishGreat);
    } else {
        finalScript = getRandomScript(scripts.finishBad);
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
