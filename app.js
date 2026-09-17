const KEY='myplanner.web.v2';
const praiseBase=['Ты большая молодец!','Готово — ещё один шаг!','Отличная работа!','Так держать!','Ты справилась!','Маленькая победа — тоже победа!','План выполнен — умница!','Ещё один пункт закрыт!','Вот это продуктивность!','Ты двигаешься вперёд!','Ещё одна галочка в пользу тебя!','Вот так и строится хороший день!','Ты сделала это!','Ещё одно дело позади!','Прекрасный темп!','День становится легче!','Ты держишь свой план в руках!','Супер, выполнено!','Твоя галочка заслужена!','Отличный маленький результат!','Ты приближаешься к цели!','Ещё один плюсик в статистику!','Умница, дело закрыто!','План работает, потому что работаешь ты!','Красиво выполнено!','Так и рождается привычка!','Ещё один шаг к спокойному дню!','Ты молодец — двигаемся дальше!','Готово. Можно выдохнуть!','Твоя продуктивность растёт!']; const praise=[]; for(let i=0;i<7;i++) praiseBase.forEach(x=>praise.push(x+(i?` ✨${i}`:''))); 
const repeatOptions=['Не повторять','Каждые 5 минут','Каждые 15 минут','Каждые 30 минут','Каждый час','Каждый день','Каждую неделю','Каждый месяц','Каждый год','Произвольный интервал'];
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{tasks:[],groups:[{id:'g1',name:'Личное',icon:'❤️',color:'#2563eb'},{id:'g2',name:'Работа',icon:'💼',color:'#7c3aed'}],notes:[],events:[],view:'day',date:iso(new Date()),query:'',filter:'all',group:'all'};
function save(){localStorage.setItem(KEY,JSON.stringify(state))} function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)} function iso(d){return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)} function fmtDate(s){return new Date(s+'T12:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})} function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function parseQuick(s){const m=s.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);return m?{time:`${m[1].padStart(2,'0')}:${m[2]}`,title:m[3]}:{time:'',title:s}}
function taskDate(t){return t.date||state.date} function filteredTasks(){return state.tasks.filter(t=>taskDate(t)===state.date).filter(t=>state.group==='all'||t.groupId===state.group).filter(t=>!state.query||t.title.toLowerCase().includes(state.query.toLowerCase())).filter(t=>state.filter==='all'||(state.filter==='done'?t.done:state.filter==='important'?t.important:state.filter==='active'&&!t.done)).sort((a,b)=>(a.allDay?0:1)-(b.allDay?0:1)||(a.time||'99:99').localeCompare(b.time||'99:99'))}
function app(){document.querySelector('#app').innerHTML=`<main class="app"><header class="top"><div class="toprow"><div><div class="title">MyPlanner</div><div class="sub">${fmtDate(state.date)}</div></div><button onclick="quick()">+ Быстро</button></div><div class="nav">${['day','week','month','focus','stats','notes'].map(x=>`<button class="${state.view===x?'active':''}" onclick="setView('${x}')">${({day:'День',week:'Неделя',month:'Месяц',focus:'Фокус',stats:'Статистика',notes:'Заметки'})[x]}</button>`).join('')}</div></header>${renderView()}<button class="fab" onclick="editTask()">+</button><div id="praise"></div></main>`;if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
function setView(v){state.view=v;save();app()} function renderView(){if(state.view==='day')return day();if(state.view==='week')return week();if(state.view==='month')return month();if(state.view==='focus')return focus();if(state.view==='stats')return stats();return notes()}
function day(){const ts=filteredTasks(),done=ts.filter(t=>t.done).length;return `<section class="card"><div class="between"><div><b>План на ${state.date===iso(new Date())?'сегодня':fmtDate(state.date)}</b><div class="small">${done} из ${ts.length} выполнено</div></div><b>${ts.length?Math.round(done/ts.length*100):0}%</b></div><div class="progress"><i style="width:${ts.length?done/ts.length*100:0}%"></i></div></section><section class="card"><div class="toolbar"><button onclick="shift(-1)">←</button><button onclick="state.date=iso(new Date());save();app()">Сегодня</button><button onclick="shift(1)">→</button><input class="input" style="flex:1;min-width:130px" placeholder="Поиск" value="${esc(state.query)}" oninput="state.query=this.value;app()"></div><div class="toolbar" style="margin-top:8px">${['all','active','important','done'].map(f=>`<button class="${state.filter===f?'primary':''}" onclick="state.filter='${f}';app()">${({all:'Все',active:'Активные',important:'Важные',done:'Готово'})[f]}</button>`).join('')}</div><div class="toolbar" style="margin-top:8px">${groupButtons()}</div></section>${ts.length?ts.map(taskCard).join(''):`<div class="empty">На этот день дел пока нет.<br>Нажми + и добавь первое.</div>`}`}
function groupButtons(){return `<button class="${state.group==='all'?'primary':''}" onclick="state.group='all';app()">Все группы</button>`+state.groups.map(g=>`<button class="${state.group===g.id?'primary':''}" onclick="state.group='${g.id}';app()">${g.icon} ${esc(g.name)}</button>`).join('')}
function taskCard(t){const g=state.groups.find(x=>x.id===t.groupId);return `<article class="card"><div class="task ${t.done?'done':''}"><button class="check ${t.done?'done':''}" onclick="toggle('${t.id}')">${t.done?'✓':''}</button><div class="taskmain" onclick="editTask('${t.id}')"><div class="tasktitle">${esc(t.title)}</div><div class="meta">${t.allDay?'<span class="pill">📌 Весь день</span>':t.time?`<span class="pill">⏰ ${t.time}</span>`:''}${t.important?'<span class="pill">⭐ Важное</span>':''}${t.priority?`<span class="pill">${t.priority}</span>`:''}${g?`<span class="pill">${g.icon} ${esc(g.name)}</span>`:''}${t.repeat?`<span class="pill">🔁 ${esc(t.repeat==='Произвольный интервал'?`Каждые ${t.interval||1} ${({minutes:'мин.',hours:'ч.',days:'дн.',weeks:'нед.',months:'мес.'})[t.unit]||''}`:t.repeat)}</span>`:''}${t.comment?'<span class="pill">💬 Комментарий</span>':''}</div></div><button onclick="editTask('${t.id}')">⋯</button></div></article>`}
function shift(n){const d=new Date(state.date+'T12:00');d.setDate(d.getDate()+n);state.date=iso(d);save();app()}
function week(){const d=new Date(state.date+'T12:00');const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);let out='<section class="card"><div class="between"><button onclick="shift(-7)">←</button><b>Неделя</b><button onclick="shift(7)">→</button></div></section>';for(let i=0;i<7;i++){const x=new Date(d);x.setDate(d.getDate()+i);const s=iso(x),ts=state.tasks.filter(t=>taskDate(t)===s);out+=`<section class="card"><div class="between"><b>${x.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}</b><button onclick="state.date='${s}';state.view='day';app()">Открыть</button></div>${ts.slice(0,4).map(taskCard).join('')}${ts.length>4?`<div class="small">+${ts.length-4} ещё</div>`:''}</section>`}return out}
function month(){const d=new Date(state.date+'T12:00'),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();let h='<section class="card"><div class="between"><button onclick="monthShift(-1)">←</button><b>'+d.toLocaleDateString('ru-RU',{month:'long',year:'numeric'})+'</b><button onclick="monthShift(1)">→</button></div><div class="calendar">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="calhead">${x}</div>`).join('');for(let i=0;i<start;i++)h+='<div></div>';for(let n=1;n<=days;n++){const s=iso(new Date(y,m,n)),ts=state.tasks.filter(t=>taskDate(t)===s);h+=`<div class="day ${s===state.date?'sel':''} ${s===iso(new Date())?'today':''}" onclick="state.date='${s}';state.view='day';app()"><b>${n}</b><div>${ts.slice(0,5).map(t=>`<span class="dot" title="${esc(t.title)}" style="background:${t.color||'#2563eb'}"></span>`).join('')}</div></div>`}return h+'</div></section>'} function monthShift(n){const d=new Date(state.date+'T12:00');d.setMonth(d.getMonth()+n,1);state.date=iso(d);save();app()}
function focus(){const all=state.tasks.filter(t=>!t.done);const score=t=>(t.important?5:0)+(t.priority==='Высокий'?4:t.priority==='Средний'?2:0)+(taskDate(t)<iso(new Date())?6:0);const top=all.sort((a,b)=>score(b)-score(a)).slice(0,3);return `<section class="card"><h2>🎯 Фокус</h2><div class="small">До трёх дел, которым сейчас стоит уделить внимание.</div></section>${top.length?top.map(taskCard).join(''):'<div class="empty">Фокус свободен 🎉</div>'}<section class="card"><b>Серии и последние выполнения</b><p>🔥 Текущая серия: <b>${streak()}</b> ${streak()===1?'день':'дн.'}</p>${state.events.slice(-5).reverse().map(e=>`<p class="small">✓ ${esc(e.title)} — ${new Date(e.at).toLocaleString('ru-RU')}</p>`).join('')||'<p class="small">Пока нет выполненных дел.</p>'}</section>`}
function streak(){const days=new Set(state.events.map(e=>iso(new Date(e.at))));let d=new Date();let n=0;while(days.has(iso(d))){n++;d.setDate(d.getDate()-1)}return n}
function stats(){const total=state.tasks.length,done=state.tasks.filter(t=>t.done).length;const byTitle={};state.events.forEach(e=>byTitle[e.title]=(byTitle[e.title]||0)+1);const top=Object.entries(byTitle).sort((a,b)=>b[1]-a[1]).slice(0,7);return `<section class="grid"><div class="card"><div class="stats">${total}</div><div class="small">Всего дел</div></div><div class="card"><div class="stats">${done}</div><div class="small">Выполнено</div></div><div class="card"><div class="stats">${total?Math.round(done/total*100):0}%</div><div class="small">Процент</div></div><div class="card"><div class="stats">${state.events.length}</div><div class="small">Выполнений</div></div></section><section class="card"><h3>📊 По названию дела</h3>${top.map(([t,n])=>`<div class="between"><span>${esc(t)}</span><b>${n}</b></div>`).join('')||'<div class="small">Пока недостаточно данных.</div>'}</section><section class="card"><h3>🔥 Серия</h3><div class="stats">${streak()} ${streak()===1?'день':'дней'}</div><div class="small">Дней подряд с выполнениями</div></section><section class="card"><h3>🏆 Достижения</h3>${achievements().map(a=>`<p>${a.icon} ${a.text}</p>`).join('')}</section><section class="card"><button class="primary" onclick="exportData()">💾 Экспортировать резервную копию</button></section>`}
function achievements(){const n=state.events.length,s=streak();return [{ok:n>=1,icon:'🥇',text:'Первое выполнение'},{ok:n>=10,icon:'🔥',text:'10 выполнений'},{ok:n>=50,icon:'💎',text:'50 выполнений'},{ok:s>=3,icon:'⭐',text:'Серия 3 дня'},{ok:s>=7,icon:'🏆',text:'Серия 7 дней'}].map(a=>({icon:a.ok?a.icon:'🔒',text:a.text+(a.ok?' — открыто':' — пока закрыто')}))}
function notes(){return `<section class="card"><div class="between"><h2>📝 Заметки</h2><button onclick="newNote()">+ Заметка</button></div></section>${state.notes.map(n=>`<article class="card"><div class="between"><b>${esc(n.title)}</b><button class="danger" onclick="delNote('${n.id}')">Удалить</button></div><p>${esc(n.text)}</p><div class="small">${new Date(n.updated).toLocaleString('ru-RU')}</div></article>`).join('')||'<div class="empty">Заметок пока нет.</div>'}`}
function modal(html){const d=document.createElement('div');d.className='modal';d.innerHTML=`<div class="sheet">${html}</div>`;d.onclick=e=>{if(e.target===d)d.remove()};document.body.append(d);return d}
function quick(){modal(`<div class="between"><h2>Быстрое дело</h2><button onclick="this.closest('.modal').remove()">✕</button></div><div class="field"><label>Например: 18:30 Позвонить маме</label><input id="q" class="input" autofocus></div><button class="primary" onclick="saveQuick()">Добавить</button>`)}
function baseTask(){return{id:uid(),title:'',date:state.date,time:'',allDay:false,done:false,important:false,priority:'Средний',groupId:state.groups[0]?.id||'',color:state.groups[0]?.color||'#2563eb',icon:'✓',repeat:'',interval:1,unit:'days',comment:''}}
function saveQuick(){const {time,title}=parseQuick(document.querySelector('#q').value.trim());if(!title)return;state.tasks.push({...baseTask(),title,time});save();document.querySelector('.modal').remove();app()}
function editTask(id){const old=state.tasks.find(x=>x.id===id),t=old?{...old}:baseTask(),fresh=!old;modal(`<div class="between"><h2>${fresh?'Новое дело':'Редактировать'}</h2><button onclick="this.closest('.modal').remove()">✕</button></div><div class="field"><label>Название</label><input id="etitle" class="input" value="${esc(t.title)}"></div><div class="grid"><div class="field"><label>Дата</label><input id="edate" class="input" type="date" value="${t.date}"></div><div class="field"><label>Время</label><input id="etime" class="input" type="time" value="${t.time||''}" ${t.allDay?'disabled':''}></div></div><div class="field"><label><input id="eall" type="checkbox" ${t.allDay?'checked':''} onchange="document.querySelector('#etime').disabled=this.checked"> Весь день</label></div><div class="grid"><div class="field"><label>Группа</label><select id="egroup" class="input">${state.groups.map(g=>`<option value="${g.id}" ${g.id===t.groupId?'selected':''}>${g.icon} ${esc(g.name)}</option>`).join('')}</select></div><div class="field"><label>Приоритет</label><select id="eprio" class="input">${['Низкий','Средний','Высокий'].map(x=>`<option ${x===t.priority?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="field"><label><input id="eimp" type="checkbox" ${t.important?'checked':''}> ⭐ Важное</label></div><div class="field"><label>Повтор</label><select id="erepeat" class="input" onchange="toggleCustomRepeat()">${repeatOptions.map(x=>`<option ${x===t.repeat?'selected':''}>${x}</option>`).join('')}</select></div><div id="customRepeat" class="grid" style="display:${t.repeat==='Произвольный интервал'?'grid':'none'}"><div class="field"><label>Каждые</label><input id="einterval" class="input" type="number" min="1" value="${t.interval||1}"></div><div class="field"><label>Единица</label><select id="eunit" class="input"><option value="minutes" ${t.unit==='minutes'?'selected':''}>минут</option><option value="hours" ${t.unit==='hours'?'selected':''}>часов</option><option value="days" ${t.unit==='days'?'selected':''}>дней</option><option value="weeks" ${t.unit==='weeks'?'selected':''}>недель</option><option value="months" ${t.unit==='months'?'selected':''}>месяцев</option></select></div></div><div class="field"><label>Комментарий</label><textarea id="ecomment" rows="3" placeholder="Можно оставить пустым">${esc(t.comment)}</textarea></div><div class="toolbar"><button class="primary" onclick="saveTask('${t.id}',${fresh})">Сохранить</button>${!fresh?`<button class="danger" onclick="delTask('${t.id}')">Удалить</button>`:''}</div>`)}
function toggleCustomRepeat(){const r=document.querySelector('#erepeat'),box=document.querySelector('#customRepeat');if(r&&box)box.style.display=r.value==='Произвольный интервал'?'grid':'none'}
function saveTask(id,fresh){const t={id,title:document.querySelector('#etitle').value.trim(),date:document.querySelector('#edate').value,time:document.querySelector('#etime').value,allDay:document.querySelector('#eall').checked,groupId:document.querySelector('#egroup').value,priority:document.querySelector('#eprio').value,important:document.querySelector('#eimp').checked,repeat:document.querySelector('#erepeat').value,interval:Math.max(1,Number(document.querySelector('#einterval')?.value||1)),unit:document.querySelector('#eunit')?.value||'days',comment:document.querySelector('#ecomment').value,color:state.groups.find(g=>g.id===document.querySelector('#egroup').value)?.color||'#2563eb',icon:'✓',done:fresh?false:(state.tasks.find(x=>x.id===id)?.done||false)};if(!t.title)return;if(fresh)state.tasks.push(t);else Object.assign(state.tasks.find(x=>x.id===id),t);save();document.querySelector('.modal').remove();app()}
function nextOccurrence(t){
 const d=new Date((t.date||state.date)+'T'+(t.time||'00:00')+':00');
 const r=t.repeat;
 if(!r||r==='Не повторять')return null;
 if(r==='Каждые 5 минут')d.setMinutes(d.getMinutes()+5);
 else if(r==='Каждые 15 минут')d.setMinutes(d.getMinutes()+15);
 else if(r==='Каждые 30 минут')d.setMinutes(d.getMinutes()+30);
 else if(r==='Каждый час')d.setHours(d.getHours()+1);
 else if(r==='Каждый день')d.setDate(d.getDate()+1);
 else if(r==='Каждую неделю')d.setDate(d.getDate()+7);
 else if(r==='Каждый месяц')d.setMonth(d.getMonth()+1);
 else if(r==='Каждый год')d.setFullYear(d.getFullYear()+1);
 else if(r==='Произвольный интервал'){
   const n=Math.max(1,Number(t.interval)||1); if(t.unit==='minutes')d.setMinutes(d.getMinutes()+n); else if(t.unit==='hours')d.setHours(d.getHours()+n); else if(t.unit==='days')d.setDate(d.getDate()+n); else if(t.unit==='weeks')d.setDate(d.getDate()+7*n); else if(t.unit==='months')d.setMonth(d.getMonth()+n);
 }
 const date=iso(d); const time=t.time?`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`:'';
 return {date,time};
}
function toggle(id){const t=state.tasks.find(x=>x.id===id);if(!t)return;t.done=!t.done;if(t.done){const now=new Date().toISOString();state.events.push({id:uid(),taskId:id,title:t.title,at:now});showPraise();const nx=nextOccurrence(t);if(nx)state.tasks.push({...t,id:uid(),date:nx.date,time:nx.time,done:false});}save();app()}
function showPraise(){const el=document.querySelector('#praise');if(!el)return;el.innerHTML=`<div class="praise">${praise[Math.floor(Math.random()*praise.length)]}</div>`;setTimeout(()=>{el.innerHTML=''},30000)}
function delTask(id){state.tasks=state.tasks.filter(t=>t.id!==id);save();document.querySelector('.modal')?.remove();app()} function newNote(){modal(`<h2>Новая заметка</h2><div class="field"><label>Название</label><input id="nt" class="input"></div><div class="field"><label>Текст</label><textarea id="nx" rows="8"></textarea></div><button class="primary" onclick="saveNote()">Сохранить</button>`)} function saveNote(){const title=document.querySelector('#nt').value.trim();if(!title)return;state.notes.push({id:uid(),title,text:document.querySelector('#nx').value,updated:new Date().toISOString()});save();document.querySelector('.modal').remove();app()} function delNote(id){state.notes=state.notes.filter(n=>n.id!==id);save();app()}
function exportData(){const b=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='MyPlanner-backup.json';a.click()}
window.quick=quick;window.saveQuick=saveQuick;window.setView=setView;window.shift=shift;window.monthShift=monthShift;window.editTask=editTask;window.saveTask=saveTask;window.toggle=toggle;window.delTask=delTask;window.newNote=newNote;window.saveNote=saveNote;window.delNote=delNote;window.exportData=exportData;app();


/* MyPlanner v1.3 — notes, subsections, attachments and bulk actions */
const MP13 = {
  notes: JSON.parse(localStorage.getItem('mp13_notes') || '[]'),
  saveNotes(){ localStorage.setItem('mp13_notes', JSON.stringify(this.notes)); },
  addNote(title='', text='', parent=null){
    const n={id:crypto.randomUUID(),title,text,parent,createdAt:Date.now(),updatedAt:Date.now(),attachments:[]};
    this.notes.push(n); this.saveNotes(); return n;
  },
  updateNote(id, patch){
    const n=this.notes.find(x=>x.id===id); if(!n)return;
    Object.assign(n,patch,{updatedAt:Date.now()}); this.saveNotes();
  },
  removeNote(id){ this.notes=this.notes.filter(n=>n.id!==id && n.parent!==id); this.saveNotes(); },
  addAttachment(id,file){
    const n=this.notes.find(x=>x.id===id); if(!n)return;
    const reader=new FileReader();
    reader.onload=()=>{n.attachments.push({name:file.name,type:file.type,size:file.size,data:reader.result});this.saveNotes();renderNotesPanel();};
    reader.readAsDataURL(file);
  }
};
function renderNotesPanel(){
  let box=document.getElementById('mp13-notes');
  if(!box){box=document.createElement('section');box.id='mp13-notes';box.className='mp13-notes';
    const host=document.querySelector('main')||document.body; host.appendChild(box);}
  const roots=MP13.notes.filter(n=>!n.parent);
  box.innerHTML=`<div class="mp13-head"><h2>Заметки</h2><button id="mp13-add">+ Заметка</button></div>
  <div class="mp13-list">${roots.map(n=>noteCard(n)).join('')}</div>`;
  document.getElementById('mp13-add').onclick=()=>{MP13.addNote('Новая заметка','');renderNotesPanel();};
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{MP13.removeNote(b.dataset.del);renderNotesPanel();});
  box.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{MP13.addNote('Подраздел','',b.dataset.sub);renderNotesPanel();});
  box.querySelectorAll('[data-attach]').forEach(b=>b.onclick=()=>{
    const inp=document.createElement('input');inp.type='file';inp.onchange=()=>inp.files[0]&&MP13.addAttachment(b.dataset.attach,inp.files[0]);inp.click();
  });
  box.querySelectorAll('textarea[data-note]').forEach(t=>t.oninput=()=>MP13.updateNote(t.dataset.note,{text:t.value}));
  box.querySelectorAll('input[data-title]').forEach(t=>t.oninput=()=>MP13.updateNote(t.dataset.title,{title:t.value}));
}
function noteCard(n){
  const children=MP13.notes.filter(x=>x.parent===n.id);
  return `<article class="mp13-note"><input data-title="${n.id}" value="${esc(n.title)}">
    <textarea data-note="${n.id}" placeholder="Текст заметки...">${esc(n.text)}</textarea>
    <div class="mp13-actions"><button data-sub="${n.id}">+ подраздел</button><button data-attach="${n.id}">📎 вложение</button><button data-del="${n.id}">Удалить</button></div>
    ${n.attachments.length?`<small>Вложений: ${n.attachments.length}</small>`:''}
    ${children.map(noteCard).join('')}</article>`;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
document.addEventListener('DOMContentLoaded',()=>setTimeout(renderNotesPanel,50));


/* MyPlanner v1.4 — local search/filter bar, bulk selection, JSON/CSV export */
const MP14 = {
  selected:new Set(),
  query:'',
  status:'all',
  priority:'all',
  refresh(){
    const root=document.getElementById('mp14-tools'); if(!root)return;
    root.innerHTML=`<div class="mp14-row">
      <input id="mp14-search" placeholder="Поиск по делам…" value="${esc(this.query)}">
      <select id="mp14-status"><option value="all">Все</option><option value="open">Активные</option><option value="done">Выполненные</option></select>
      <select id="mp14-priority"><option value="all">Любой приоритет</option><option value="high">Высокий</option><option value="normal">Обычный</option><option value="low">Низкий</option></select>
    </div>
    <div class="mp14-row"><button id="mp14-select">Выбрать всё</button><button id="mp14-clear">Снять выбор</button>
    <button id="mp14-delete">Удалить выбранное</button><button id="mp14-json">Экспорт JSON</button><button id="mp14-csv">Экспорт CSV</button></div>`;
    mp14Wire();
  },
  matches(t){
    const q=this.query.toLowerCase();
    const done=!!(t.completed||t.done);
    const p=(t.priority||'normal').toLowerCase();
    return (!q || `${t.title||''} ${t.comment||''} ${t.group||''}`.toLowerCase().includes(q))
      && (this.status==='all'||(this.status==='done'&&done)||(this.status==='open'&&!done))
      && (this.priority==='all'||p===this.priority);
  }
};
function mp14Tasks(){
  const candidates=[window.tasks,window.todos,window.reminders,window.items].find(Array.isArray);
  return candidates||[];
}
function mp14Wire(){
  const q=document.getElementById('mp14-search'), st=document.getElementById('mp14-status'), pr=document.getElementById('mp14-priority');
  q.oninput=()=>{MP14.query=q.value;mp14ApplyFilter();};
  st.onchange=()=>{MP14.status=st.value;mp14ApplyFilter();};
  pr.onchange=()=>{MP14.priority=pr.value;mp14ApplyFilter();};
  document.getElementById('mp14-select').onclick=()=>{mp14Tasks().filter(MP14.matches).forEach(t=>MP14.selected.add(String(t.id)));mp14Mark();};
  document.getElementById('mp14-clear').onclick=()=>{MP14.selected.clear();mp14Mark();};
  document.getElementById('mp14-delete').onclick=()=>mp14Delete();
  document.getElementById('mp14-json').onclick=()=>mp14Download('myplanner-backup.json',JSON.stringify(mp14Tasks(),null,2),'application/json');
  document.getElementById('mp14-csv').onclick=()=>mp14Download('myplanner-tasks.csv',mp14CSV(),'text/csv;charset=utf-8');
}
function mp14ApplyFilter(){
  const ts=mp14Tasks();
  document.querySelectorAll('[data-task-id]').forEach(el=>{
    const t=ts.find(x=>String(x.id)===String(el.dataset.taskId));
    if(t) el.style.display=MP14.matches(t)?'':'none';
  });
}
function mp14Mark(){
  document.querySelectorAll('[data-task-id]').forEach(el=>{
    el.classList.toggle('mp14-selected',MP14.selected.has(String(el.dataset.taskId)));
  });
}
function mp14Delete(){
  const ids=MP14.selected;
  if(!ids.size)return;
  const ts=mp14Tasks();
  if(!Array.isArray(ts))return;
  for(let i=ts.length-1;i>=0;i--) if(ids.has(String(ts[i].id))) ts.splice(i,1);
  try{localStorage.setItem('myplanner_tasks',JSON.stringify(ts));}catch(e){}
  MP14.selected.clear(); location.reload();
}
function mp14CSV(){
  const rows=[['id','title','date','time','priority','group','completed','comment']];
  mp14Tasks().forEach(t=>rows.push([t.id,t.title,t.date||'',t.time||'',t.priority||'',t.group||'',t.completed||t.done?'yes':'no',t.comment||'']));
  return '\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
}
function mp14Download(name,data,type){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
document.addEventListener('DOMContentLoaded',()=>{
  setTimeout(()=>{
    if(!document.getElementById('mp14-tools')){
      const box=document.createElement('section');box.id='mp14-tools';box.className='mp14-tools';
      box.innerHTML='<h2>Поиск, фильтры и экспорт</h2>'; (document.querySelector('main')||document.body).prepend(box);
    }
    MP14.refresh();mp14ApplyFilter();
  },120);
});


/* MyPlanner v1.5 — notification center, snooze/postpone, sound preference */
const MP15 = {
  key:'mp15_settings',
  get(){try{return JSON.parse(localStorage.getItem(this.key)||'{}')}catch(e){return {}}},
  save(v){localStorage.setItem(this.key,JSON.stringify(v))},
  init(){
    const box=document.createElement('section'); box.id='mp15-notify'; box.className='mp15-notify';
    box.innerHTML=`<div class="mp15-head"><h2>Напоминания</h2><span id="mp15-state"></span></div>
      <div class="mp15-controls">
        <button id="mp15-permission">Разрешить уведомления</button>
        <button id="mp15-test">Тестовое уведомление</button>
        <label><input type="checkbox" id="mp15-sound"> Звук</label>
      </div>
      <div class="mp15-help">MyPlanner проверяет наступившие напоминания, пока приложение открыто. Системные уведомления браузера зависят от возможностей Safari/iPhone; веб-версия не может гарантировать фоновое срабатывание так же, как нативное iOS-приложение.</div>
      <div id="mp15-due"></div>`;
    (document.querySelector('main')||document.body).prepend(box);
    const cfg=this.get();
    document.getElementById('mp15-sound').checked=cfg.sound!==false;
    this.status(); this.wire(); this.tick();
    setInterval(()=>this.tick(),30000);
  },
  status(){
    const el=document.getElementById('mp15-state'); if(!el)return;
    el.textContent=('Notification' in window)?(Notification.permission==='granted'?'Уведомления разрешены':Notification.permission==='denied'?'Уведомления запрещены':'Разрешение не выдано'):'Уведомления недоступны';
  },
  wire(){
    document.getElementById('mp15-permission').onclick=async()=>{
      if(!('Notification' in window)) return this.status();
      try{await Notification.requestPermission()}catch(e){}
      this.status();
    };
    document.getElementById('mp15-test').onclick=()=>this.notify('MyPlanner','Проверка напоминаний');
    document.getElementById('mp15-sound').onchange=e=>this.save({sound:e.target.checked});
  },
  notify(title,body){
    if('Notification' in window && Notification.permission==='granted'){
      try{new Notification(title,{body})}catch(e){}
    }
    const cfg=this.get();
    if(cfg.sound!==false){try{
      const C=window.AudioContext||window.webkitAudioContext; if(C){const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.035;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.12);}
    }catch(e){}}
  },
  tick(){
    const ts=mp14Tasks(); const now=new Date();
    const due=ts.filter(t=>t && !t.completed && !t.done && mp15Date(t) && mp15Date(t)<=now && (!t._mp15Last||Date.now()-t._mp15Last>60000));
    const host=document.getElementById('mp15-due'); if(host) host.innerHTML=due.length?`<div class="mp15-due-title">Сейчас нужно выполнить: ${due.length}</div>`+due.slice(0,5).map(t=>`<div class="mp15-due-item"><b>${esc(t.title||'Без названия')}</b><button data-snooze="${esc(t.id)}">Отложить 10 мин</button><button data-snooze2="${esc(t.id)}">Отложить 1 час</button></div>`).join(''):'';
    due.forEach(t=>{t._mp15Last=Date.now();this.notify('MyPlanner',t.title||'Напоминание');});
    host?.querySelectorAll('[data-snooze]').forEach(b=>b.onclick=()=>mp15Snooze(b.dataset.snooze,10));
    host?.querySelectorAll('[data-snooze2]').forEach(b=>b.onclick=()=>mp15Snooze(b.dataset.snooze2,60));
  }
};
function mp15Date(t){
  const raw=t.datetime||t.dateTime||t.start||((t.date||'')+(t.time?'T'+t.time:''));
  if(!raw)return null; const d=new Date(raw); return isNaN(d)?null:d;
}
function mp15Snooze(id,mins){
  const t=mp14Tasks().find(x=>String(x.id)===String(id)); if(!t)return;
  const d=new Date(Date.now()+mins*60000);
  const iso=d.toISOString();
  if('datetime' in t)t.datetime=iso; else {t.date=iso.slice(0,10);t.time=iso.slice(11,16);}
  try{localStorage.setItem('myplanner_tasks',JSON.stringify(mp14Tasks()))}catch(e){}
  MP15.tick();
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>MP15.init(),180));


/* MyPlanner v1.6 — calendar navigation, month/week/day switching helpers */
const MP16 = {
  current:new Date(),
  view:localStorage.getItem('mp16_view')||'day',
  init(){
    const box=document.createElement('section');box.id='mp16-calendar';box.className='mp16-calendar';
    box.innerHTML=`<div class="mp16-head"><button id="mp16-prev">‹</button><div><b id="mp16-title"></b><div class="mp16-view">
      <button data-view="day">День</button><button data-view="week">Неделя</button><button data-view="month">Месяц</button></div></div><button id="mp16-next">›</button></div>
      <div id="mp16-grid"></div>`;
    (document.querySelector('main')||document.body).prepend(box);
    document.getElementById('mp16-prev').onclick=()=>this.move(-1);
    document.getElementById('mp16-next').onclick=()=>this.move(1);
    box.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{this.view=b.dataset.view;localStorage.setItem('mp16_view',this.view);this.render();});
    this.render();
  },
  move(n){
    const d=this.current;
    if(this.view==='month') d.setMonth(d.getMonth()+n);
    else if(this.view==='week') d.setDate(d.getDate()+n*7);
    else d.setDate(d.getDate()+n);
    this.render();
  },
  render(){
    const t=document.getElementById('mp16-title'),g=document.getElementById('mp16-grid');if(!t||!g)return;
    const fmt=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    t.textContent=this.view==='month'?new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric'}).format(this.current):this.view==='week'?`Неделя от ${fmt.format(this.weekStart())}`:fmt.format(this.current);
    const ts=mp14Tasks();
    if(this.view==='month'){
      const y=this.current.getFullYear(),m=this.current.getMonth(),first=new Date(y,m,1),start=(first.getDay()+6)%7,days=new Date(y,m+1,0).getDate();
      let h=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x=>`<div class="mp16-dow">${x}</div>`).join('');
      for(let i=0;i<start;i++)h+='<div class="mp16-cell empty"></div>';
      for(let d=1;d<=days;d++){const key=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,count=ts.filter(t=>String(t.date||'').startsWith(key)).length;h+=`<div class="mp16-cell"><b>${d}</b>${count?`<span>${count} дел.</span>`:''}</div>`}
      g.innerHTML=h;
    } else {
      const days=this.view==='week'?7:1, start=this.view==='week'?this.weekStart():this.current;
      g.innerHTML=Array.from({length:days},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);const key=d.toISOString().slice(0,10),items=ts.filter(t=>String(t.date||'').startsWith(key));return `<div class="mp16-day"><b>${new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(d)}</b>${items.map(t=>`<div class="mp16-item">${esc(t.time||'')} ${esc(t.title||'Без названия')}</div>`).join('')}</div>`}).join('');
    }
  },
  weekStart(){const d=new Date(this.current);d.setDate(d.getDate()-((d.getDay()+6)%7));d.setHours(0,0,0,0);return d;}
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>MP16.init(),260));


/* MyPlanner v1.7 — achievements dashboard and streak analytics */
const MP17={
  init(){
    const box=document.createElement('section');box.id='mp17-ach';box.className='mp17-ach';
    box.innerHTML=`<div class="mp17-head"><h2>Достижения и серии</h2><span id="mp17-streak"></span></div><div id="mp17-body"></div>`;
    (document.querySelector('main')||document.body).append(box);this.render();
  },
  render(){
    const ts=mp14Tasks(),done=ts.filter(t=>t.completed||t.done),today=new Date().toISOString().slice(0,10);
    const dates=[...new Set(done.map(t=>String(t.completedAt||t.doneAt||t.date||'').slice(0,10)).filter(Boolean))].sort().reverse();
    let streak=0,d=new Date();
    while(dates.includes(d.toISOString().slice(0,10))){streak++;d.setDate(d.getDate()-1);}
    const total=done.length, pct=ts.length?Math.round(total/ts.length*100):0;
    const milestones=[{n:1,t:'Первое выполнение',i:'🌱'},{n:3,t:'Три дела',i:'✨'},{n:7,t:'Неделя действий',i:'🔥'},{n:25,t:'25 выполнений',i:'🏆'},{n:50,t:'50 выполнений',i:'🎯'},{n:100,t:'100 выполнений',i:'💎'}];
    document.getElementById('mp17-streak').textContent=`Серия: ${streak} дн.`;
    document.getElementById('mp17-body').innerHTML=`<div class="mp17-stats"><div><b>${total}</b><span>выполнено</span></div><div><b>${streak}</b><span>дней подряд</span></div><div><b>${pct}%</b><span>доля выполненных</span></div></div>
      <div class="mp17-badges">${milestones.map(x=>`<div class="mp17-badge ${total>=x.n?'earned':''}"><span>${x.i}</span><b>${x.t}</b><small>${total>=x.n?'Получено':'Нужно ещё '+(x.n-total)}</small></div>`).join('')}</div>`;
  }
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>MP17.init(),340));


/* MyPlanner v1.8 — quick capture, focus mode, today's summary */
const MP18={
  init(){
    const box=document.createElement('section');box.id='mp18-quick';box.className='mp18-quick';
    box.innerHTML=`<div class="mp18-head"><h2>Быстрое дело</h2><button id="mp18-focus">🎯 Фокус</button></div>
      <div class="mp18-form"><input id="mp18-title" placeholder="Что нужно сделать?"><input id="mp18-time" type="time"><button id="mp18-add">Добавить</button></div>
      <div id="mp18-summary"></div>`;
    (document.querySelector('main')||document.body).prepend(box);
    document.getElementById('mp18-add').onclick=()=>this.add();
    document.getElementById('mp18-title').onkeydown=e=>{if(e.key==='Enter')this.add()};
    document.getElementById('mp18-focus').onclick=()=>this.focus();
    this.summary();
  },
  add(){
    const title=document.getElementById('mp18-title').value.trim();if(!title)return;
    const time=document.getElementById('mp18-time').value;
    const now=new Date(), t={id:crypto.randomUUID(),title,date:now.toISOString().slice(0,10),time,priority:'normal',completed:false,createdAt:Date.now()};
    const ts=mp14Tasks();ts.push(t);
    try{localStorage.setItem('myplanner_tasks',JSON.stringify(ts))}catch(e){}
    document.getElementById('mp18-title').value='';document.getElementById('mp18-time').value='';
    this.summary(); location.reload();
  },
  summary(){
    const today=new Date().toISOString().slice(0,10),ts=mp14Tasks(),a=ts.filter(t=>String(t.date||'').startsWith(today)),done=a.filter(t=>t.completed||t.done).length;
    const el=document.getElementById('mp18-summary');if(el)el.innerHTML=`<div class="mp18-stat">Сегодня: <b>${a.length}</b> дел · выполнено <b>${done}</b></div>`;
  },
  focus(){
    document.body.classList.toggle('mp18-focus-mode');
    const on=document.body.classList.contains('mp18-focus-mode');localStorage.setItem('mp18_focus',on?'1':'0');
    document.getElementById('mp18-focus').textContent=on?'✕ Выйти из фокуса':'🎯 Фокус';
  }
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  MP18.init();
  if(localStorage.getItem('mp18_focus')==='1'){document.body.classList.add('mp18-focus-mode');const b=document.getElementById('mp18-focus');if(b)b.textContent='✕ Выйти из фокуса';}
},420));


/* MyPlanner v1.9 — group management, colors, icons and priority editor */
const MP19={
  key:'mp19_groups',
  defaults:[
    {id:'work',name:'Работа',icon:'💼',color:'#5b7cfa'},
    {id:'home',name:'Дом',icon:'🏠',color:'#58a66a'},
    {id:'family',name:'Семья',icon:'❤️',color:'#d95f7a'},
    {id:'personal',name:'Личное',icon:'⭐',color:'#a16bd3'}
  ],
  get(){try{return JSON.parse(localStorage.getItem(this.key))||this.defaults}catch(e){return this.defaults}},
  save(v){localStorage.setItem(this.key,JSON.stringify(v))},
  init(){
    const box=document.createElement('section');box.id='mp19-groups';box.className='mp19-groups';
    box.innerHTML=`<div class="mp19-head"><h2>Группы</h2><button id="mp19-new">+ Группа</button></div><div id="mp19-list"></div>`;
    (document.querySelector('main')||document.body).prepend(box);
    if(!localStorage.getItem(this.key))this.save(this.defaults);
    this.render();
    document.getElementById('mp19-new').onclick=()=>this.add();
  },
  render(){
    const list=document.getElementById('mp19-list');if(!list)return;
    list.innerHTML=this.get().map(g=>`<div class="mp19-group" style="--g:${g.color}">
      <span class="mp19-icon">${esc(g.icon)}</span><input data-name="${g.id}" value="${esc(g.name)}">
      <input data-color="${g.id}" type="color" value="${g.color}">
      <button data-del="${g.id}">Удалить</button></div>`).join('');
    list.querySelectorAll('[data-name]').forEach(x=>x.onchange=()=>this.update(x.dataset.name,{name:x.value}));
    list.querySelectorAll('[data-color]').forEach(x=>x.onchange=()=>this.update(x.dataset.color,{color:x.value}));
    list.querySelectorAll('[data-del]').forEach(x=>x.onclick=()=>{this.save(this.get().filter(g=>g.id!==x.dataset.del));this.render()});
  },
  add(){
    const name=prompt('Название группы','Новая группа');if(!name)return;
    const icon=prompt('Иконка','📌')||'📌',color=prompt('Цвет HEX','#7b61ff')||'#7b61ff';
    const g={id:crypto.randomUUID(),name,icon,color};const a=this.get();a.push(g);this.save(a);this.render();
  },
  update(id,p){const a=this.get(),g=a.find(x=>x.id===id);if(g){Object.assign(g,p);this.save(a)}}
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>MP19.init(),500));

/* MyPlanner FINAL — local backup/import and privacy status */
const MPFINAL={
  init(){
    const box=document.createElement('section');box.id='mpfinal';box.className='mpfinal';
    box.innerHTML=`<div class="mpfinal-head"><h2>MyPlanner</h2><span>Финальная версия</span></div>
      <div class="mpfinal-grid">
        <button id="mpfinal-export">💾 Резервная копия</button>
        <button id="mpfinal-import">📥 Восстановить</button>
      </div>
      <p>🔒 Данные планировщика хранятся локально на этом устройстве. GitHub содержит файлы приложения, а не записи планировщика.</p>
      <input id="mpfinal-file" type="file" accept="application/json" hidden>`;
    (document.querySelector('main')||document.body).append(box);
    document.getElementById('mpfinal-export').onclick=()=>this.export();
    document.getElementById('mpfinal-import').onclick=()=>document.getElementById('mpfinal-file').click();
    document.getElementById('mpfinal-file').onchange=e=>this.import(e.target.files[0]);
  },
  export(){
    const d={version:'FINAL',exportedAt:new Date().toISOString(),localStorage:{}};
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);d.localStorage[k]=localStorage.getItem(k);}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d)],{type:'application/json'}));a.download='MyPlanner-backup.json';a.click();
  },
  import(file){
    if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.localStorage)throw 0;Object.entries(d.localStorage).forEach(([k,v])=>localStorage.setItem(k,v));location.reload()}catch(e){alert('Не удалось прочитать резервную копию')}};r.readAsText(file);
  }
};
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>MPFINAL.init(),700));
