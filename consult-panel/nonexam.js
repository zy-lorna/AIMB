const nonExamState={path:'',choice:'',educationTab:'全部'};
const nonExamTitles={previsit:'诊前数据查看',questionnaire:'健康指数问卷',copd:'慢阻肺评估',bp:'血压',glucose:'血糖',chest:'胸片',lipid:'血脂四项',urine:'尿常规',liver:'肝肾功能',abi:'踝肱指数 ABI',nerve:'外周神经传导检查 / 浅感觉检查',body:'内脏脂肪 / 人体成分检测',followup:'诊中随访表填写',report:'个人健康管理评估报告',education:'智选健康教育文章',referral:'上级嘱托'};
const originalNotify=notify;
notify=function(message){if(message!=='该管理路径为演示入口')originalNotify(message)};
const originalVisiblePatients=visiblePatients;
visiblePatients=function(){
  if(state.section!=='follow')return originalVisiblePatients();
  return patients.filter(p=>p.owner&&p.nextFollowDate&&p.nextFollowDate>=TODAY&&p.nextFollowDate<=datePlus(TODAY,30)&&(!state.query||p.name.includes(state.query)||p.identity.includes(state.query)));
};
const originalListPatientMarkup=listPatientMarkup;
listPatientMarkup=function(p,followTask=false){
  const html=originalListPatientMarkup(p,followTask);
  return followTask?html.replace('应随访 '+p.followDue,'应随访 '+p.nextFollowDate):html;
};
const originalPanel=renderPanel;
renderPanel=function(){
  originalPanel();
  const p=patient(),sections=[...document.querySelectorAll('#rail-content .panel-section')];
  if(!sections.length)return;
  const lastVisit=sections[0].previousElementSibling?.previousElementSibling?.querySelector('p');
  if(lastVisit)lastVisit.textContent='最近就诊时间：'+p.lastVisit;
  const row=(key,label,disabled=false)=>`<button type="button" class="section-row ${nonExamState.path===key?'nonexam-path-active':''}" data-nonexam-path="${key}" ${disabled?'disabled':''}><span>${label}</span><span class="right">›</span></button>`;
  sections[0].innerHTML='<h2><span class="section-num">1</span>诊间辅助</h2>'+row('previsit','1. 诊前数据查看'+(p.didPrevisit?'　已完成':''))+row('questionnaire','2. 健康指数问卷')+row('copd','3. 慢阻肺评估',!p.diseaseTags.includes('lung'));
  sections[1].innerHTML='<h2><span class="section-num">2</span>检验检查</h2><div class="path-group">既往90天内检验检查项目</div>'+row('bp','1. 血压')+row('glucose','2. 血糖')+row('chest','3. 胸片')+'<div class="path-group">未来90天内<strong>必做</strong>检验检查项目</div>'+row('lipid','1. 血脂四项')+row('urine','2. 尿常规　半年')+row('liver','3. 肝肾功能　半年')+'<div class="path-group">未来90天内<strong>可选</strong>检验检查项目</div>'+row('abi','1. 踝肱指数 ABI')+row('nerve','2. 外周神经传导检查 / 浅感觉检查')+row('body','3. 内脏脂肪 / 人体成分检测');
  sections[2].innerHTML='<h2><span class="section-num">3</span>上级嘱托</h2>'+row('referral',p.referral?'1. 查看上级转诊嘱托':'暂无上级嘱托',!p.referral);
  sections[3].innerHTML='<h2><span class="section-num">4</span>诊中随访表填写</h2>'+((p.diseaseTags||[]).includes('lung')?row('followup','1. 基层社区慢阻肺随访'):'')+((p.diseaseTags||[]).includes('high')?row('followup','2. 基层社区高血压随访'):'')+((p.diseaseTags||[]).includes('diabetes')?row('followup','3. 基层社区糖尿病随访'):'');
  sections[4].innerHTML='<h2><span class="section-num">5</span>评估报告打印</h2>'+row('report','1. 个人健康管理评估报告');
  sections[5].innerHTML='<h2><span class="section-num">6</span>健康指导</h2>'+row('education','1. 智选健康教育文章');
};
function openNonExamPath(button){
  nonExamState.path=button.dataset.nonexamPath||'';
  if(!nonExamState.path)return;
  state.drawer=true;state.drawerKind='nonexam';
  renderPanel();renderDrawer();
}
const originalDrawer=renderDrawer;
renderDrawer=function(){
  if(state.drawerKind!=='nonexam')return originalDrawer();
  const expanded=state.drawer&&state.view==='panel';
  $('.shell').classList.toggle('expanded',expanded);
  if(!expanded){$('#drawer-root').replaceChildren();return}
  const p=patient(),title=nonExamTitles[nonExamState.path]||'患者管理路径';
  $('#drawer-root').innerHTML=`<aside class="drawer nonexam-drawer" role="region" aria-label="${esc(title)}"><div class="drawer-head"><div><h2>${esc(title)}</h2><small>患者管理路径 / ${esc(p.name)}</small></div><button class="close" data-nonexam-action="close" aria-label="收起详情">×</button></div><div class="drawer-body">${nonExamBody(p)}</div><div class="drawer-actions">${nonExamActions(p)}</div></aside>`;
  if(nonExamState.path==='followup')document.querySelector('#nonexam-form')?.insertAdjacentHTML('beforeend',`<h4 class="wide">疾病症状</h4><div class="nonexam-checks wide">${['无症状','头痛头晕','恶心呕吐','眼花耳鸣','呼吸困难','心悸胸闷','四肢发麻','下肢水肿','其他'].map(value=>`<label><input type="checkbox" name="symptoms" value="${value}">${value}</label>`).join('')}</div><h4 class="wide">体征数据</h4><label>体重（kg）<input name="weight" type="number" min="0" step="0.1"></label><label>身高（cm）<input name="height" type="number" min="0" step="0.1"></label><label>腰围（cm）<input name="waist" type="number" min="0" step="0.1"></label><label>心率（次/分钟）<input name="heartRate" type="number" min="0"></label><h4 class="wide">生活方式</h4><label>当前日吸烟量（支）<input name="smoking" type="number" min="0"></label><label>当前日饮酒量（两）<input name="drinking" type="number" min="0" step="0.1"></label><label>运动频率（次/周）<input name="exerciseFrequency" type="number" min="0" max="7"></label><label>每次运动（分钟）<input name="exerciseMinutes" type="number" min="0"></label><label>摄盐状况<select name="salt"><option value="">请选择</option><option>轻</option><option>中</option><option>重</option></select></label><label>心理调整<select name="mood"><option value="">请选择</option><option>良好</option><option>一般</option><option>差</option></select></label><h4 class="wide">用药与转诊</h4><label>服药依从性<select name="adherence"><option value="">请选择</option><option>规律</option><option>间断</option><option>不服药</option></select></label><label>药物不良反应<select name="adverse"><option>无</option><option>有</option></select></label><label>本次随访分类<select name="classification"><option value="">请选择</option><option>控制满意</option><option>控制不满意</option><option>不良反应</option><option>并发症或合并症新增、加重</option></select></label><label>是否需要转诊<select name="needReferral"><option>否</option><option>是</option></select></label><label class="wide">转诊原因<textarea name="referralReason" placeholder="需要转诊时填写"></textarea></label>`);
  const saved={questionnaire:p.questionnaire,copd:p.copdAssessment,followup:p.followupRecord}[nonExamState.path];
  if(saved)for(const [name,value] of Object.entries(saved)){if(name==='symptoms'){document.querySelectorAll('#nonexam-form [name="symptoms"]').forEach(input=>input.checked=value.includes(input.value));continue}const field=document.querySelector(`#nonexam-form [name="${name}"]`);if(field&&value!=null)field.value=value}
};
const fact=(label,value)=>`<div class="nonexam-fact"><span>${label}</span><strong>${esc(value??'—')}</strong></div>`;
const section=(title,body)=>`<section class="nonexam-section"><h3>${title}</h3>${body}</section>`;
const table=(headers,rows)=>`<table class="nonexam-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
function nonExamBody(p){
  const path=nonExamState.path;
  if(path==='previsit')return section('诊前数据',`<div class="nonexam-grid">${fact('最近就诊',p.lastVisit)}${fact('本次刷卡',p.checkinTime)}${fact('公卫责任医生',p.doctor)}${fact('基础信息',p.infoComplete?'已完善':'待完善')}${fact('慢病专档',(p.diseaseTags||[]).map(x=>({high:'高血压',diabetes:'糖尿病',lipid:'高血脂',lung:'慢阻肺'}[x])).join('、'))}${fact('最近体检',p.exam)}</div>`)+section('诊前关注',`<p>体检类别：${p.category}类；当前检后状态：${statusLabel[p.status]}。</p><p>本次可在左侧体检提醒中查看原报告和处理任务。</p><p class="nonexam-muted">诊前内容为演示样例，未连接 HIS 或公卫系统。</p>`);
  if(path==='questionnaire')return section('健康指数问卷',`<form class="nonexam-form" id="nonexam-form"><label>近期总体健康状况<select name="health"><option value="">请选择</option><option>良好</option><option>一般</option><option>较差</option></select></label><label>每周运动情况<select name="exercise"><option value="">请选择</option><option>每周 3 次及以上</option><option>每周 1–2 次</option><option>几乎不运动</option></select></label><label>是否规律服药<select name="medicine"><option value="">请选择</option><option>是</option><option>否</option><option>无用药</option></select></label><label>睡眠情况<select name="sleep"><option value="">请选择</option><option>良好</option><option>一般</option><option>较差</option></select></label><label class="wide">补充记录<textarea name="note" placeholder="填写本次访谈要点">${esc(p.questionnaire?.note||'')}</textarea></label></form>`)+(p.questionnaire?section('最近记录',`<p>${esc(p.questionnaire.date)} · ${esc(p.questionnaire.health)} · 运动：${esc(p.questionnaire.exercise)}</p>`):'');
  if(path==='copd')return section('慢阻肺评估',`<form class="nonexam-form" id="nonexam-form"><label>过去 4 周气促程度<select name="breath"><option>无</option><option>轻度</option><option>中度</option><option>重度</option></select></label><label>过去一年急性加重次数<input name="flare" type="number" min="0" max="20" value="${esc(p.copdAssessment?.flare||'0')}"></label><label>是否有肺功能结果<select name="spirometry"><option>暂无</option><option>已有</option></select></label><label class="wide">评估备注<textarea name="note" placeholder="记录症状、检查与后续安排">${esc(p.copdAssessment?.note||'')}</textarea></label></form><p class="nonexam-muted">此处记录问诊信息，不自动给出诊断或治疗建议。</p>`);
  if(['bp','glucose','chest'].includes(path)){
    const data={bp:[['2026-09-25','收缩压','148','mmHg','90–139'],['2026-09-25','舒张压','88','mmHg','60–89']],glucose:[['2026-09-22','空腹血糖','7.2','mmol/L','3.9–6.1']],chest:[['2026-09-20','胸部正位片','未见明显异常','—','—']]}[path];
    return section('既往 90 天检验检查结果',table(['结果日期','检测指标','检测结果','单位','参考范围'],data))+section('原始记录',`<p>项目：${nonExamTitles[path]}　患者：${esc(p.name)}</p><p class="nonexam-muted">右侧结果为诊中演示样例；体检原报告请从左侧体检提醒查看。</p>`);
  }
  if(['lipid','urine','liver','abi','nerve','body'].includes(path))return section('建议项目',`<div class="nonexam-grid">${fact('项目',nonExamTitles[path])}${fact('建议时间','未来 90 天内')}${fact('项目类型',['lipid','urine','liver'].includes(path)?'必做':'可选')}${fact('当前状态',p.orders?.includes(path)?'已加入本次开单':'待开单')}</div><p class="nonexam-muted">项目清单参考设计稿，是否开具由接诊医生判断。</p>`);
  if(path==='followup')return section('基层社区慢病随访',`<form class="nonexam-form" id="nonexam-form"><label>随访日期<input name="date" type="date" value="${TODAY}"></label><label>随访方式<select name="method"><option>门诊随访</option><option>电话随访</option><option>上门随访</option></select></label><label>收缩压（mmHg）<input name="sbp" type="number" min="40" max="300" value="${esc(p.followupRecord?.sbp||'')}"></label><label>舒张压（mmHg）<input name="dbp" type="number" min="20" max="200" value="${esc(p.followupRecord?.dbp||'')}"></label><label>空腹血糖（mmol/L）<input name="glucose" type="number" min="0" step="0.1" value="${esc(p.followupRecord?.glucose||'')}"></label><label>下次随访日期<input name="next" type="date" value="${esc(p.followupRecord?.next||'')}"></label><label class="wide">症状及处理<textarea name="note" placeholder="记录本次随访情况">${esc(p.followupRecord?.note||'')}</textarea></label></form>`);
  if(path==='report')return section('个人健康管理评估报告',`<div class="nonexam-grid">${fact('患者',p.name)}${fact('报告年度','2026 年')}${fact('报告类型','两慢病 / 慢阻肺')}${fact('体检报告日期',p.report)}</div><p class="nonexam-muted">打印预览展示诊中样例信息，正式报告需由业务系统生成。</p>`)+section('报告摘要',`<p>体检类别 ${p.category} 类。慢病专档：${(p.diseaseTags||[]).map(x=>({high:'高血压',diabetes:'糖尿病',lipid:'高血脂',lung:'慢阻肺'}[x])).join('、')}。</p>`);
  if(path==='education')return section('健康教育文章',`<div class="nonexam-tabs">${['全部','推荐','高血压','糖尿病','慢阻肺','高血脂'].map(tab=>`<button type="button" class="btn ${nonExamState.educationTab===tab?'primary':''}" data-nonexam-action="education-tab" data-value="${tab}">${tab}</button>`).join('')}</div>${[['膳食指导','日常饮食与控盐建议','高血压'],['患者教育','中老年运动注意事项','推荐'],['健康知识','血糖监测记录方法','糖尿病'],['呼吸健康','慢阻肺日常自我管理','慢阻肺'],['健康知识','血脂异常的生活方式管理','高血脂']].filter(x=>nonExamState.educationTab==='全部'||nonExamState.educationTab==='推荐'||x[2]===nonExamState.educationTab).map((x,index)=>`<button type="button" class="nonexam-choice ${nonExamState.choice===x[1]?'selected':''}" data-nonexam-action="choose-article" data-value="${x[1]}"><span><strong>${x[1]}</strong><br><span class="nonexam-muted">${x[0]} · ${x[2]}</span></span><small>${nonExamState.choice===x[1]?'已选':'选择'}</small></button>`).join('')}`);
  if(path==='referral')return section('上级嘱托',`<div class="nonexam-grid">${fact('转诊日期',p.referral?.date)}${fact('转诊医院',p.referral?.hospital)}${fact('转诊科室',p.referral?.department)}${fact('转诊原因',p.referral?.reason)}</div>`);
  return section('详情','<p>暂无内容。</p>');
}
function nonExamActions(p){const path=nonExamState.path;if(['questionnaire','copd','followup'].includes(path))return '<button class="btn primary" data-nonexam-action="save">保存</button>';if(['lipid','urine','liver','abi','nerve','body'].includes(path))return `<button class="btn primary" data-nonexam-action="order">${p.orders?.includes(path)?'移出本次开单':'加入本次开单'}</button>`;if(path==='education')return '<button class="btn primary" data-nonexam-action="push" '+(nonExamState.choice?'':'disabled')+'>推送所选文章</button>';if(path==='report')return '<button class="btn primary" data-nonexam-action="print">打印报告</button>';return '<button class="btn" data-nonexam-action="close">收起</button>'}
profileBody=function(p){
  if(state.profileTab==='report')return '<div class="profile-card"><h2>评估报告</h2><div class="profile-task"><span>个人健康管理评估报告 · 2026 年</span><span class="status tracking">可查看</span></div><div class="profile-task"><span>体检报告 · '+p.report+'</span>'+statusPill(p.category)+'</div></div>';
  if(state.profileTab==='education')return '<div class="profile-card"><h2>患教推送</h2>'+(p.educationPushes?.length?p.educationPushes.map(item=>'<div class="profile-task"><span>'+esc(item.title)+'</span><small>'+esc(item.date)+'</small></div>').join(''):'<div class="empty">暂无推送记录</div>')+'</div>';
  return '<div class="profile-card"><h2>全生命周期管理流程</h2><div class="profile-process"><div>最近就诊<small>'+p.lastVisit+'</small></div><div>体检<small>'+p.exam+'</small></div><div>报告告知<small>'+(p.informed||'待处理')+'</small></div><div>检后跟踪<small>'+statusLabel[p.status]+'</small></div></div></div><div class="profile-card"><h2>待办任务</h2>'+(p.status!=='closed'?'<div class="profile-task"><span>体检报告 · '+statusLabel[p.status]+'</span>'+statusPill(p.category)+'</div>':'')+(p.nextFollowDate?'<div class="profile-task"><span>基层慢病随访</span><small>'+p.nextFollowDate+'</small></div>':'')+p.plans.filter(x=>x.state==='待复查').map(x=>'<div class="profile-task"><span>'+esc(x.item)+'复查</span><small>'+x.date+'</small></div>').join('')+'</div><div class="profile-card"><h2>近期记录</h2><div class="timeline">'+p.history.slice(-4).reverse().map(x=>'<div class="event"><small>'+esc(x.date)+'</small><p>'+esc(x.text)+'</p></div>').join('')+'</div></div>';
};
const originalProfile=renderProfile;
renderProfile=function(){
  originalProfile();
  const p=patient(),root=document.querySelector('#profile-root');
  const person=root?.querySelector('.profile-person')?.parentElement?.querySelector('p');
  if(person)person.textContent='最近就诊时间：'+p.lastVisit;
  const terms=[...root.querySelectorAll('dt')];
  const doctor=terms.find(term=>term.textContent==='责任医生');
  if(doctor?.nextElementSibling)doctor.nextElementSibling.textContent=p.doctor;
};
document.addEventListener('click',event=>{
  const pathButton=event.target.closest('[data-nonexam-path]');if(pathButton){openNonExamPath(pathButton);return}
  const button=event.target.closest('[data-nonexam-action]');if(!button)return;
  const p=patient(),action=button.dataset.nonexamAction;
  if(action==='close'){state.drawer=false;nonExamState.path='';renderDrawer();renderPanel();return}
  if(action==='education-tab'){nonExamState.educationTab=button.dataset.value;renderDrawer();return}
  if(action==='choose-article'){nonExamState.choice=button.dataset.value;renderDrawer();return}
  if(action==='order'){p.orders??=[];const index=p.orders.indexOf(nonExamState.path);index<0?p.orders.push(nonExamState.path):p.orders.splice(index,1);save();renderDrawer();notify(index<0?'已加入本次开单（演示）':'已移出本次开单');return}
  if(action==='push'){p.educationPushes??=[];p.educationPushes.push({title:nonExamState.choice,date:TODAY});save();notify('已记录文章推送（演示）');return}
  if(action==='print'){window.print();return}
  if(action==='save'){const form=document.querySelector('#nonexam-form');if(!form)return;const values=Object.fromEntries(new FormData(form));if(nonExamState.path==='questionnaire'){if(!values.health||!values.exercise||!values.medicine||!values.sleep){notify('请完成问卷选项');return}p.questionnaire={...values,date:TODAY}}else if(nonExamState.path==='copd'){p.copdAssessment={...values,date:TODAY}}else{if(!values.date){notify('请选择随访日期');return}values.symptoms=[...form.querySelectorAll('[name="symptoms"]:checked')].map(input=>input.value);if(values.needReferral==='是'&&!values.referralReason.trim()){notify('请填写转诊原因');return}p.followupRecord=values;p.followed=true}save();renderDrawer();notify('已保存诊中演示记录')}
},true);
render();
