
"use strict";
const DATA=window.AIRCON_DATA;
const state={category:"practice",rank:"初級",pool:[],index:0,score:0,current:null,answered:false};
const STORE="aircon_v2_stats";

const pages={
 home:document.getElementById("homePage"),
 rank:document.getElementById("rankPage"),
 quiz:document.getElementById("quizPage"),
 result:document.getElementById("resultPage"),
 history:document.getElementById("historyPage")
};

function showPage(name){
 Object.values(pages).forEach(page=>page.classList.add("hidden"));
 pages[name].classList.remove("hidden");
 window.scrollTo(0,0);
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
 try{return JSON.parse(localStorage.getItem(STORE)||'{"answered":0,"correct":0,"sessions":[]}')}
 catch{return {answered:0,correct:0,sessions:[]}}
}
function saveStats(stats){localStorage.setItem(STORE,JSON.stringify(stats))}

function updateHome(){
 const stats=loadStats();
 const exp=stats.correct*20;
 const level=Math.floor(exp/100)+1;
 const within=exp%100;
 document.getElementById("levelText").textContent="Lv."+level;
 document.getElementById("expBar").style.width=within+"%";
 document.getElementById("expText").textContent="次のレベルまで あと"+(100-within)+"EXP";
 document.getElementById("missionCount").textContent=Math.min(stats.answered,10)+" / 10";
}

function openRank(category){
 state.category=category;
 const list=DATA[category];
 const title=category==="price"?"工事料金":"練習問題";
 document.getElementById("rankTitle").textContent=title+"・ランク選択";
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
 state.rank=rank;
 state.pool=shuffle(selected).slice(0,10);
 state.index=0;
 state.score=0;
 document.getElementById("quizTitle").textContent=(state.category==="price"?"工事料金":"練習問題")+"・"+rank;
 showPage("quiz");
 renderQuestion();
}

function renderQuestion(){
 if(state.index>=state.pool.length){finishQuiz();return}
 state.current=state.pool[state.index];
 state.answered=false;
 const actualRank=state.current.level;
 document.getElementById("rankBadge").textContent=state.rank==="ランダム"?"ランダム／"+actualRank:actualRank;
 document.getElementById("quizProgress").textContent=(state.index+1)+" / "+state.pool.length;
 document.getElementById("questionText").textContent=state.current.q;
 document.getElementById("answerResult").classList.add("hidden");
 document.getElementById("nextButton").classList.add("hidden");
 const list=document.getElementById("choiceList");
 list.innerHTML="";
 const choices=shuffle(state.current.choices.map((text,index)=>({text,index})));
 choices.forEach((item,displayIndex)=>{
  const button=document.createElement("button");
  button.type="button";
  button.className="choice";
  button.textContent=(displayIndex+1)+"　"+item.text;
  button.dataset.originalIndex=String(item.index);
  button.addEventListener("click",()=>answerQuestion(item.index,button));
  list.appendChild(button);
 });
}

function answerQuestion(originalIndex,button){
 if(state.answered)return;
 state.answered=true;
 const correct=originalIndex===state.current.answer;
 const buttons=[...document.querySelectorAll(".choice")];
 buttons.forEach(b=>b.disabled=true);
 button.classList.add(correct?"correct":"wrong");
 if(correct)state.score++;
 else{
  const right=buttons.find(b=>Number(b.dataset.originalIndex)===state.current.answer);
  if(right)right.classList.add("correct");
 }
 const result=document.getElementById("answerResult");
 result.innerHTML="<b>"+(correct?"⭕ 正解":"❌ 不正解")+"</b><br>"+(state.current.ex||"正解を確認しましょう。");
 result.classList.remove("hidden");
 document.getElementById("nextButton").classList.remove("hidden");
 const stats=loadStats();
 stats.answered++;
 if(correct)stats.correct++;
 saveStats(stats);
 updateHome();
}

function nextQuestion(){
 if(!state.answered)return;
 state.index++;
 renderQuestion();
}

function finishQuiz(){
 const stats=loadStats();
 stats.sessions.unshift({
  date:new Date().toLocaleString("ja-JP"),
  category:state.category==="price"?"工事料金":"練習問題",
  rank:state.rank,
  score:state.score,
  total:state.pool.length
 });
 stats.sessions=stats.sessions.slice(0,50);
 saveStats(stats);
 document.getElementById("resultScore").textContent=state.score+" / "+state.pool.length;
 document.getElementById("resultMessage").textContent=state.score>=8?"合格です！":state.score>=5?"あと少しです。":"もう一度復習しましょう。";
 showPage("result");
 updateHome();
}

function showHistory(){
 const stats=loadStats();
 const rate=stats.answered?Math.round(stats.correct/stats.answered*100):0;
 const box=document.getElementById("historyContent");
 box.innerHTML='<div class="history-summary"><div><span>回答数</span><strong>'+stats.answered+'</strong></div><div><span>正解数</span><strong>'+stats.correct+'</strong></div><div><span>正答率</span><strong>'+rate+'%</strong></div></div><div class="history-list"></div>';
 const list=box.querySelector(".history-list");
 if(!stats.sessions.length){list.innerHTML="<p>まだ学習記録はありません。</p>"}
 stats.sessions.forEach(s=>{
  const row=document.createElement("div");
  row.className="history-row";
  row.innerHTML="<b>"+s.category+"・"+s.rank+"</b><p>"+s.score+" / "+s.total+" 正解　"+s.date+"</p>";
  list.appendChild(row);
 });
 showPage("history");
}

document.querySelectorAll("[data-open-category]").forEach(button=>{
 button.addEventListener("click",()=>openRank(button.dataset.openCategory));
});
document.querySelectorAll("[data-rank]").forEach(button=>{
 button.addEventListener("click",()=>startQuiz(button.dataset.rank));
});
document.querySelectorAll("[data-back-home]").forEach(button=>{
 button.addEventListener("click",()=>showPage("home"));
});
document.getElementById("quizBack").addEventListener("click",()=>showPage("rank"));
document.getElementById("quitQuiz").addEventListener("click",()=>showPage("home"));
document.getElementById("nextButton").addEventListener("click",nextQuestion);
document.getElementById("historyButton").addEventListener("click",showHistory);

updateHome();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));}
