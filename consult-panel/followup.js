/* Consultation follow-up tasks and the combined chronic-disease form. */
const followDiseaseNames={high:'高血压',diabetes:'糖尿病',lung:'慢阻肺',lipid:'高血脂'};
const followDiseaseOrder=['high','diabetes','lung','lipid'];
const followDrafts=new Map();
let activeFollowPatient=null;

function followSchedule(p){
  const tags=followDiseaseOrder.filter(key=>(p.diseaseTags||[]).includes(key));
  if(!tags.length)return [];
  const base=p.nextFollowDate;
  if(!base)return [];
  const index=Math.max(0,patients.findIndex(item=>item.id===p.id));
  const offsets={high:index%4===0?-5:0,diabetes:index%5===0?5:7,lung:4,lipid:4};
  return tags.map(key=>{
    const due=datePlus(base,offsets[key]);
    return {key,name:followDiseaseNames[key],start:datePlus(due,-10),end:datePlus(due,20),due,
      inCycle:TODAY>=datePlus(due,-10)&&TODAY<=datePlus(due,20),overdue:TODAY>due};
  });
}
function followTaskDiseases(p){return followSchedule(p).filter(item=>item.inCycle&&!p.followupRecord?.completedDiseases?.includes(item.key)).sort((a,b)=>a.due.localeCompare(b.due))}

const followVisiblePatients=visiblePatients;
visiblePatients=function(){
  if(state.section!=='follow')return followVisiblePatients();
  return patients.filter(p=>p.owner&&followTaskDiseases(p).length&&(!state.query||p.name.includes(state.query)||p.identity.includes(state.query)))
    .sort((a,b)=>followTaskDiseases(a)[0].due.localeCompare(followTaskDiseases(b)[0].due)||a.identity.localeCompare(b.identity));
};

const followListPatientMarkup=listPatientMarkup;
listPatientMarkup=function(p,followTask=false){
  if(!followTask)return followListPatientMarkup(p,false);
  const tasks=followTaskDiseases(p);
  const next=tasks[0];
  return `<button type="button" class="patient-row follow-task-row" data-patient="${esc(p.id)}" aria-label="${esc(p.name)}，${esc(next.name)}随访"><span class="follow-task-main"><strong>${esc(p.name)}</strong>${tags(p)}</span><span class="follow-task-detail"><span class="follow-task-type">${esc(next.name)}随访</span></span></button>`;
};

function followDraft(p){
  if(!followDrafts.has(p.id)){
    const selected=followTaskDiseases(p).map(item=>item.key);
    const saved=p.referenceRecords?.followup||{};
    followDrafts.set(p.id,{selected:saved.selectedDiseases?.length?saved.selectedDiseases:selected,values:{...saved}});
  }
  return followDrafts.get(p.id);
}
function followField(label,name,type='text',value='',extra=''){
  return `<label class="ref-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function followRadio(label,name,choices){return refRadios(label,name,choices)}
function followSection(title,content,key=''){return `<section class="ref-section follow-form-section" ${key?'data-disease-section="'+key+'"':''}><h3>${title}</h3>${content}</section>`}
function followPair(items){return `<div class="ref-form-grid">${items.join('')}</div>`}
function followMulti(label,name,options){return `<div class="follow-choice-row"><strong>${label}</strong>${refChecks(options,name)}</div>`}
function followMedicine(key,name){return `<div class="follow-medicine"><div class="follow-medicine-head"><strong>${name}用药</strong><button type="button" data-follow-action="import" data-disease="${key}">HIS导入</button></div><div class="follow-medicine-table" id="follow-medicine-${key}">${refTable(['药品名称','规格','数量','用药方式','用药频次'],[['暂无数据','—','—','—','—']])}</div><button type="button" data-follow-action="add-med" data-disease="${key}">＋ 新增药品</button></div>`}
function followClassification(key,name){return followSection(`${name}随访分类`,followRadio('本次随访分类',`${key}_class`,['控制满意','控制不满意','不良反应','并发症/合并症新增或加重'])+followRadio('是否转诊',`${key}_refer`,['否','是'])+followPair([followField('转诊原因',`${key}_referReason`),followField('转诊机构',`${key}_referHospital`)]),key)}
function followDiseaseContent(key){
  if(key==='high')return followSection('高血压随访',followPair([
    followField('收缩压（mmHg）','high_sbp','number','','min="30" max="300"'),followField('舒张压（mmHg）','high_dbp','number','','min="20" max="200"'),
    followField('目标收缩压（mmHg）','high_targetSbp','number','140'),followField('目标舒张压（mmHg）','high_targetDbp','number','90'),
    followField('体重（kg）','high_weight','number','','step="0.1"'),followField('目标体重（kg）','high_targetWeight','number','','step="0.1"'),
    followField('身高（cm）','high_height','number','','step="0.1"'),followField('心率（次/分钟）','high_heartRate','number')
  ])+followMulti('疾病症状','high_symptoms',['无症状','头痛','头晕','心悸胸闷','下肢水肿','其他'])+followRadio('摄盐状况','high_salt',['轻','中','重'])+followRadio('服药依从性','high_adherence',['规律','间断','不服药']),key)
  +followMedicine('high','高血压')+followClassification('high','高血压');
  if(key==='diabetes')return followSection('糖尿病随访',followPair([
    followField('空腹血糖（mmol/L）','diabetes_fast','number','','step="0.1"'),followField('餐后血糖（mmol/L）','diabetes_after','number','','step="0.1"'),
    followField('糖化血红蛋白（%）','diabetes_hba1c','number','','step="0.1"'),followField('低血糖发生次数','diabetes_hypoCount','number','','min="0"'),
    followField('足背动脉搏动','diabetes_pulse','text'),followField('体重（kg）','diabetes_weight','number','','step="0.1"')
  ])+followRadio('低血糖反应','diabetes_hypoglycemia',['无','偶尔','频繁'])+followRadio('服药依从性','diabetes_adherence',['规律','间断','不服药']),key)
  +followMedicine('diabetes','糖尿病')+followClassification('diabetes','糖尿病');
  if(key==='lipid')return followSection('高血脂随访',followPair([
    followField('总胆固醇（mmol/L）','lipid_tc','number','','step="0.01"'),followField('甘油三酯（mmol/L）','lipid_tg','number','','step="0.01"'),
    followField('高密度脂蛋白（mmol/L）','lipid_hdl','number','','step="0.01"'),followField('低密度脂蛋白（mmol/L）','lipid_ldl','number','','step="0.01"')
  ])+followRadio('服药依从性','lipid_adherence',['规律','间断','不服药'])+followRadio('药物不良反应','lipid_adverse',['无','有']),key)
  +followMedicine('lipid','高血脂')+followClassification('lipid','高血脂');
  return followSection('慢阻肺随访',followRadio('一年内呼吸系统疾病急性加重','lung_flare',['否','是'])+followPair([
    followField('急性加重次数','lung_flareCount','number','','min="0"'),followField('住院次数','lung_hospitalCount','number','','min="0"')
  ])+`<div class="follow-score-links"><button type="button" data-follow-action="score" data-score="CAT">COPD评估测试评分表（CAT）</button><button type="button" data-follow-action="score" data-score="mMRC">改良呼吸困难指数（mMRC）</button></div>`
  +followRadio('慢阻肺 ABE 分组','lung_group',['A','B','E'])+followRadio('家庭持续氧疗','lung_oxygen',['否','是'])+followPair([
    followField('每日氧疗时间（小时）','lung_oxygenHours','number','','step="0.5"'),followField('氧流量（L/分钟）','lung_oxygenFlow','number','','step="0.1"')
  ])+followRadio('无创呼吸机使用','lung_ventilator',['否','是'])+followMulti('其他呼吸治疗','lung_treatments',['呼吸训练','运动治疗','排痰训练','营养支持','心理辅导']),key)
  +followSection('肺功能检查',followPair([
    followField('FEV1（L）','lung_fev1','number','','step="0.01"'),followField('FVC（L）','lung_fvc','number','','step="0.01"'),
    followField('FEV1/FVC（%）','lung_ratio','number','','step="0.1"'),followField('FEV1 实测比（%）','lung_actual','number','','step="0.1"')
  ])+followRadio('气流受限严重程度','lung_grade',['1级','2级','3级','4级']),key)
  +followMedicine('lung','慢阻肺')+followRadio('吸入装置技术掌握','lung_inhaler',['掌握','部分掌握','未掌握'])+followClassification('lung','慢阻肺');
}

followupContent=function(p){
  const schedule=followSchedule(p),draft=followDraft(p),selected=draft.selected.filter(key=>schedule.some(item=>item.key===key));
  const dueTable=`<div class="follow-date-table">${schedule.map(item=>`<div><strong>${item.name}应随访日期</strong><span class="${item.inCycle?'follow-due-active':''}">${item.start} 至 ${item.end}</span></div>`).join('')}</div>`;
  return `<form id="reference-form" class="follow-form" novalidate>${followSection('应随访日期',`<p class="follow-notice">诊中随访需随访日期与就诊日期为同一天才有效</p>${dueTable}<div class="follow-select"><strong>本次随访内容</strong>${schedule.map(item=>`<label><input type="checkbox" name="selectedDiseases" value="${item.key}" data-follow-disease="${item.key}" ${selected.includes(item.key)?'checked':''}><span>${item.name}随访</span>${item.inCycle?'<em>周期内</em>':''}</label>`).join('')}</div>`)}`
  +followSection('随访信息',followPair([followField('随访日期','date','date',TODAY),followField('就诊日期','visitDate','date',TODAY),`<label class="ref-field"><span>随访方式</span><select name="method"><option>门诊（诊间）</option><option>电话</option><option>上门</option></select></label>`]))
  +followSection('就诊记录',`<div class="ref-record-line">${esc(p.lastVisit)}　全科门诊　${esc(p.doctor)} <button type="button" data-follow-action="extract">选择</button></div>`)
  +(selected.length?followSection('临床症状',followMulti('疾病症状已选','common_symptoms',['无症状','头痛头晕','恶心呕吐','眼花耳鸣','呼吸困难','心悸胸闷','下肢水肿','其他'])):'<div class="follow-empty">请勾选本次需要完成的疾病随访</div>')
  +selected.map(followDiseaseContent).join('')
  +(selected.length?followSection('本次随访',followPair([followField('下次随访日期','next','date',datePlus(TODAY,30)),followField('填写日期','filled','date',TODAY)])+`<label class="ref-field ref-wide"><span>随访记录</span><textarea name="note" rows="3" placeholder="记录患者情况及处理意见"></textarea></label>`):'')+'</form>';
};

function captureFollowDraft(){
  if(nonExamState.path!=='followup'||!activeFollowPatient)return;
  const form=document.querySelector('#reference-form');if(!form)return;
  const draft=followDraft(activeFollowPatient);
  for(const field of form.elements){if(!field.name||field.name==='selectedDiseases')continue;if(field.type==='checkbox'){draft.values[field.name]??=[];draft.values[field.name]=[...form.querySelectorAll(`[name="${field.name}"]:checked`)].map(input=>input.value)}else if(field.type==='radio'){if(field.checked)draft.values[field.name]=field.value}else draft.values[field.name]=field.value}
}
function restoreFollowDraft(){
  const p=patient();if(!p||nonExamState.path!=='followup')return;
  activeFollowPatient=p;
  const form=document.querySelector('#reference-form');if(!form)return;
  const values=followDraft(p).values;
  for(const [name,value] of Object.entries(values)){
    if(name==='selectedDiseases')continue;
    const fields=[...form.querySelectorAll(`[name="${name}"]`)];
    for(const field of fields){if(field.type==='checkbox')field.checked=Array.isArray(value)&&value.includes(field.value);else if(field.type==='radio')field.checked=field.value===value;else if(typeof value==='string')field.value=value}
  }
}
const priorFollowDrawer=renderDrawer;
renderDrawer=function(){priorFollowDrawer();if(state.drawerKind==='nonexam'&&state.drawer&&nonExamState.path==='followup')restoreFollowDraft()};

document.addEventListener('click',event=>{
  const task=event.target.closest('.follow-task-row');
  if(task&&state.section==='follow'){
    event.stopImmediatePropagation();openPatient(task.dataset.patient);nonExamState.path='followup';state.drawer=true;state.drawerKind='nonexam';followDraft(patient());renderPanel();renderDrawer();return;
  }
  const button=event.target.closest('[data-follow-action]');if(!button)return;
  event.stopImmediatePropagation();
  const action=button.dataset.followAction,p=patient();
  if(action==='extract'){const form=document.querySelector('#reference-form');if(form){const sbp=form.elements.namedItem('high_sbp'),dbp=form.elements.namedItem('high_dbp');if(sbp)sbp.value='152';if(dbp)dbp.value='83'}notify('已带入就诊记录');return}
  if(action==='add-med'){const target=document.querySelector(`#follow-medicine-${button.dataset.disease}`);if(target)target.insertAdjacentHTML('beforeend',followPair([followField('药品名称',`${button.dataset.disease}_medicine`),followField('用量',`${button.dataset.disease}_dose`)]));return}
  if(action==='import'){notify('已查看 HIS 用药记录（演示）');return}
  if(action==='score'){notify(`${button.dataset.score} 量表可在健康指数问卷中填写`)}
},true);

document.addEventListener('change',event=>{
  const checkbox=event.target.closest('[data-follow-disease]');if(!checkbox)return;
  captureFollowDraft();const draft=followDraft(patient());
  draft.selected=[...document.querySelectorAll('[data-follow-disease]:checked')].map(input=>input.value);
  renderDrawer();
},true);

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-reference-action="save"],[data-reference-action="reset-form"]');
  if(!button||nonExamState.path!=='followup')return;
  event.stopImmediatePropagation();
  const p=patient(),form=document.querySelector('#reference-form'),draft=followDraft(p);
  if(button.dataset.referenceAction==='reset-form'){
    followDrafts.delete(p.id);renderDrawer();return;
  }
  captureFollowDraft();
  if(!draft.selected.length){notify('请选择本次随访的疾病');return}
  if(!form.elements.date.value||!form.elements.visitDate.value){notify('请选择随访日期和就诊日期');return}
  if(form.elements.date.value!==form.elements.visitDate.value){notify('诊中随访日期须与就诊日期相同');return}
  const values={...draft.values,selectedDiseases:[...draft.selected],completedDiseases:[...new Set([...(p.followupRecord?.completedDiseases||[]),...draft.selected])],savedAt:TODAY};
  p.referenceRecords??={};p.referenceRecords.followup=values;
  p.followupRecord={...p.followupRecord,...values};p.followed=true;save();
  notify('已保存合并随访记录');renderPanel();renderDrawer();
},true);

document.addEventListener('click',event=>{if(event.target.id==='reset-confirm')followDrafts.clear()},true);

renderList();
