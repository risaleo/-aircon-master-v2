
"use strict";
const DATA=window.AIRCON_DATA;
const STORE="aircon_v24_stats";
const NAME_STORE="aircon_v24_name";
const state={category:"practice",rank:"初級",pool:[],index:0,score:0,current:null,answered:false};
let salesState={caseIndex:0,stepIndex:0,score:0};

const pages={
 home:document.getElementById("homePage"),rank:document.getElementById("rankPage"),
 quiz:document.getElementById("quizPage"),sales:document.getElementById("salesPage"),
 mission:document.getElementById("missionPage"),result:document.getElementById("resultPage"),
 history:document.getElementById("historyPage"),settings:document.getElementById("settingsPage")
};

function showPage(name){
 Object.values(pages).forEach(page=>page.classList.add("hidden"));
 pages[name].classList.remove("hidden");
 window.scrollTo(0,0);
 if(name==="home")updateHome();
}

function shuffle(list){
 const arr=[...list];
 for(let i=arr.length-1;i>0;i--){
  const j=Math.floor(Math.random()*(i+1));
  [arr[i],arr[j]]=[arr[j],arr[i]];
 }
 return arr;
}

function loadStats(){
 try{return JSON.parse(localStorage.getItem(STORE)||'{"answered":0,"correct":0,"sessions":[],"sales":0}')}
 catch{return {answered:0,correct:0,sessions:[],sales:0}}
}
function saveStats(stats){localStorage.setItem(STORE,JSON.stringify(stats))}
function getName(){return (localStorage.getItem(NAME_STORE)||"").trim()}

function todayMissionKey(){return "aircon_v24_mission_"+new Date().toISOString().slice(0,10)}
function getTodayMissionCount(){return Number(localStorage.getItem(todayMissionKey())||0)}
function addTodayMissionCount(){localStorage.setItem(todayMissionKey(),String(getTodayMissionCount()+1));updateMissionDisplay()}

function updateMissionDisplay(){
 const count=Math.min(getTodayMissionCount(),3);
 document.getElementById("missionCount").textContent=count+" / 3";
 document.getElementById("missionDetailCount").textContent=count+" / 3";
 document.getElementById("missionDetailBar").style.width=(count/3*100)+"%";
}

function updateHome(){
 const stats=loadStats();
 const exp=stats.correct*20+stats.sales*30;
 const level=Math.floor(exp/100)+1;
 const within=exp%100;
 const name=getName();
 document.getElementById("helloText").textContent=name?name+"さんの今日の学習状況":"今日の学習状況";
 document.getElementById("levelText").textContent="Lv."+level;
 document.getElementById("rankText").textContent=level>=10?"エアコンアドバイザー":level>=5?"接客担当":"新人スタッフ";
 document.getElementById("expBar").style.width=within+"%";
 document.getElementById("expText").textContent="次のレベルまで あと"+(100-within)+"EXP";
 updateMissionDisplay();
}

function openRank(category){
 state.category=category;
 const list=DATA[category];
 document.getElementById("rankTitle").textContent=(category==="price"?"工事料金":"練習問題")+"・ランク選択";
 const counts={
  初級:list.filter(q=>q.level==="初級").length,
  中級:list.filter(q=>q.level==="中級").length,
  上級:list.filter(q=>q.level==="上級").length
 };
 document.getElementById("beginnerCount").textContent=counts.初級+"問";
 document.getElementById("middleCount").textContent=counts.中級+"問";
 document.getElementById("advancedCount").textContent=counts.上級+"問";
 document.getElementById("randomCount").textContent=list.length+"問";
 showPage("rank");
}

function startQuiz(rank){
 const source=DATA[state.category];
 const selected=rank==="ランダム"?source:source.filter(q=>q.level===rank);
 if(!selected.length){alert(rank+"の問題がありません。");return}
 state.rank=rank;state.pool=shuffle(selected).slice(0,10);state.index=0;state.score=0;
 document.getElementById("quizTitle").textContent=(state.category==="price"?"工事料金":"練習問題")+"・"+rank;
 showPage("quiz");renderQuestion();
}

function renderQuestion(){
 if(state.index>=state.pool.length){finishQuiz();return}
 state.current=state.pool[state.index];state.answered=false;
 document.getElementById("rankBadge").textContent=state.rank==="ランダム"?"ランダム／"+state.current.level:state.current.level;
 document.getElementById("quizProgress").textContent=(state.index+1)+" / "+state.pool.length;
 document.getElementById("questionText").textContent=state.current.q;
 document.getElementById("answerResult").classList.add("hidden");
 document.getElementById("nextButton").classList.add("hidden");
 const list=document.getElementById("choiceList");list.innerHTML="";
 shuffle(state.current.choices.map((text,index)=>({text,index}))).forEach((item,displayIndex)=>{
  const button=document.createElement("button");button.type="button";button.className="choice";
  button.textContent=(displayIndex+1)+"　"+item.text;button.dataset.originalIndex=String(item.index);
  button.addEventListener("click",()=>answerQuestion(item.index,button));list.appendChild(button);
 });
}

function answerQuestion(originalIndex,button){
 if(state.answered)return;state.answered=true;
 const correct=originalIndex===state.current.answer;
 const buttons=[...document.querySelectorAll("#choiceList .choice")];buttons.forEach(b=>b.disabled=true);
 button.classList.add(correct?"correct":"wrong");
 if(correct)state.score++;else{
  const right=buttons.find(b=>Number(b.dataset.originalIndex)===state.current.answer);
  if(right)right.classList.add("correct");
 }
 const result=document.getElementById("answerResult");
 result.innerHTML="<b>"+(correct?"⭕ 正解":"❌ 不正解")+"</b><br>"+(state.current.ex||"正解を確認しましょう。");
 result.classList.remove("hidden");document.getElementById("nextButton").classList.remove("hidden");
 const stats=loadStats();stats.answered++;if(correct)stats.correct++;saveStats(stats);updateHome();
}

function nextQuestion(){if(!state.answered)return;state.index++;renderQuestion()}

function finishQuiz(){
 const stats=loadStats();
 stats.sessions.unshift({date:new Date().toLocaleString("ja-JP"),category:state.category==="price"?"工事料金":"練習問題",rank:state.rank,score:state.score,total:state.pool.length});
 stats.sessions=stats.sessions.slice(0,100);saveStats(stats);
 document.getElementById("resultScore").textContent=state.score+" / "+state.pool.length;
 document.getElementById("resultMessage").textContent=state.score>=8?"合格です！":state.score>=5?"あと少しです。":"もう一度復習しましょう。";
 showPage("result");
}

function startSalesMode(){
 const cases=DATA.salesCases||[];
 if(!cases.length){alert("販買モードのデータがありません。");return}
 salesState={caseIndex:Math.floor(Math.random()*cases.length),stepIndex:0,score:0};
 showPage("sales");renderSalesMode();
}

function renderSalesMode(){
 const item=DATA.salesCases[salesState.caseIndex],step=item.steps[salesState.stepIndex];
 document.getElementById("salesStepper").innerHTML=item.steps.map((_,i)=>'<span class="'+(i<=salesState.stepIndex?'active':'')+'"></span>').join("");
 document.getElementById("salesCustomerCard").innerHTML='<div class="sales-avatar">'+item.avatar+'</div><h2>'+item.title+'</h2><div class="sales-facts"><div>👤 '+item.customer+'</div><div>🏠 '+item.home+'</div><div>📍 '+item.room+'</div><div>💰 '+item.budget+'</div></div><div class="sales-speech">'+item.speech+'</div>';
 document.getElementById("salesQuestion").textContent=step.q;
 const box=document.getElementById("salesChoices");box.innerHTML="";
 document.getElementById("salesFeedback").classList.add("hidden");
 shuffle(step.choices.map((text,index)=>({text,index}))).forEach((choice,displayIndex)=>{
  const button=document.createElement("button");button.type="button";button.className="choice";
  button.textContent=(displayIndex+1)+"　"+choice.text;button.dataset.originalIndex=String(choice.index);
  button.addEventListener("click",()=>answerSales(choice.index,button));box.appendChild(button);
 });
}

function answerSales(originalIndex,button){
 const item=DATA.salesCases[salesState.caseIndex],step=item.steps[salesState.stepIndex];
 const buttons=[...document.querySelectorAll("#salesChoices .choice")];buttons.forEach(b=>b.disabled=true);
 const correct=originalIndex===step.answer;button.classList.add(correct?"correct":"wrong");
 if(correct)salesState.score++;else{
  const right=buttons.find(b=>Number(b.dataset.originalIndex)===step.answer);if(right)right.classList.add("correct");
 }
 const feedback=document.getElementById("salesFeedback");
 feedback.innerHTML="<b>"+(correct?"⭕ 正解":"❌ 不正解")+"</b><br>"+step.ex;
 feedback.classList.remove("hidden");
 setTimeout(()=>{salesState.stepIndex++;salesState.stepIndex<item.steps.length?renderSalesMode():finishSalesMode()},700);
}

function finishSalesMode(){
 const item=DATA.salesCases[salesState.caseIndex],stats=loadStats();
 stats.sales=(stats.sales||0)+1;
 stats.sessions.unshift({date:new Date().toLocaleString("ja-JP"),category:"販買モード",rank:item.title,score:salesState.score,total:item.steps.length});
 stats.sessions=stats.sessions.slice(0,100);saveStats(stats);addTodayMissionCount();
 document.getElementById("salesQuestion").textContent="接客終了";
 document.getElementById("salesChoices").innerHTML='<div class="result-card"><span>販売レポート</span><strong>'+salesState.score+' / '+item.steps.length+'</strong><p>'+item.title+'</p></div><button class="next-button" type="button" id="nextCustomerButton">別のお客様</button><button class="next-button" type="button" id="salesHomeButton">ホームへ戻る</button>';
 document.getElementById("salesFeedback").classList.add("hidden");
 document.getElementById("nextCustomerButton").addEventListener("click",startSalesMode);
 document.getElementById("salesHomeButton").addEventListener("click",()=>showPage("home"));
}

function openMission(){updateMissionDisplay();showPage("mission")}

function showHistory(){
 const stats=loadStats(),rate=stats.answered?Math.round(stats.correct/stats.answered*100):0;
 const box=document.getElementById("historyContent");
 box.innerHTML='<div class="history-summary"><div><span>回答数</span><strong>'+stats.answered+'</strong></div><div><span>正答率</span><strong>'+rate+'%</strong></div><div><span>販買モード</span><strong>'+(stats.sales||0)+'</strong></div></div><div class="history-list"></div>';
 const list=box.querySelector(".history-list");
 if(!stats.sessions.length)list.innerHTML="<p>まだ学習記録はありません。</p>";
 stats.sessions.forEach(s=>{
  const row=document.createElement("div");row.className="history-row";
  row.innerHTML="<b>"+s.category+"・"+s.rank+"</b><p>"+s.score+" / "+s.total+" 正解　"+s.date+"</p>";list.appendChild(row);
 });
 showPage("history");
}

function openSettings(){document.getElementById("nameInput").value=getName();showPage("settings")}
function saveName(){
 const value=document.getElementById("nameInput").value.trim();
 if(!value){alert("名前を入力してください。");return}
 localStorage.setItem(NAME_STORE,value);alert(value+"さんで保存しました。");updateHome();
}

document.querySelectorAll("[data-open-category]").forEach(button=>button.addEventListener("click",()=>openRank(button.dataset.openCategory)));
document.querySelectorAll("[data-rank]").forEach(button=>button.addEventListener("click",()=>startQuiz(button.dataset.rank)));
document.querySelectorAll("[data-back-home]").forEach(button=>button.addEventListener("click",()=>showPage("home")));
document.getElementById("quizBack").addEventListener("click",()=>showPage("rank"));
document.getElementById("quitQuiz").addEventListener("click",()=>showPage("home"));
document.getElementById("nextButton").addEventListener("click",nextQuestion);
document.getElementById("salesModeButton").addEventListener("click",startSalesMode);
document.getElementById("salesBack").addEventListener("click",()=>showPage("home"));
document.getElementById("salesQuit").addEventListener("click",()=>showPage("home"));
document.getElementById("missionButton").addEventListener("click",openMission);
document.getElementById("missionHeaderButton").addEventListener("click",openMission);
document.getElementById("missionStartButton").addEventListener("click",startSalesMode);
document.getElementById("historyButton").addEventListener("click",showHistory);
document.getElementById("settingsButton").addEventListener("click",openSettings);
document.getElementById("saveNameButton").addEventListener("click",saveName);

updateHome();
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
