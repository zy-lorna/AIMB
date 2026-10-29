/* Detailed consultation paths based on the supplied design screenshots. */
const referenceState={preTab:'basic',questionnaire:'sleep',reportType:'两慢病',reportPage:1,guideTab:'处方',guideDisease:'慢阻肺',guideGroup:'呼吸训练',articleFilter:'全部',resultMode:'图表'};
const referencePanel=renderPanel;
renderPanel=function(){
  referencePanel();
  const sections=[...document.querySelectorAll('#rail-content .panel-section')];
  if(sections.length<6)return;
  const path=(key,label,disabled=false)=>`<button type="button" class="section-row ${nonExamState.path===key?'nonexam-path-active':''}" ${disabled?'disabled aria-disabled="true"':'data-nonexam-path="'+key+'"'}><span>${label}</span>${disabled?'':'<span class="right">›</span>'}</button>`;
  sections[1].innerHTML='<h2><span class="section-num">2</span>检验检查</h2><div class="path-group">既往90天内检验检查项目</div>'+path('bp','<b class="ref-dot danger">!</b> 1. 血压')+path('glucose','<b class="ref-dot danger">!</b> 2. 血糖')+path('chest','<b class="ref-dot good">✓</b> 3. 胸片')+'<div class="path-group">未来90天内<strong>必做</strong>检验检查项目</div>'+['空腹血糖 <em class="ref-frequency month">月</em>','餐后血糖 <em class="ref-frequency month">月</em>','血脂四项 <em class="ref-frequency season">季</em>','尿常规 <em class="ref-frequency half">半年</em>','肝肾功能 <em class="ref-frequency year">年</em>'].map((name,i)=>`<div class="section-row ref-required" aria-label="${i+1}. ${name.replace(/<[^>]*>/g,'')}，仅展示"><span>${i+1}. ${name}</span></div>`).join('')+'<div class="path-group">未来90天内<strong>可选</strong>检验检查项目</div>'+path('abi','1. 踝肱指数 ABI')+path('nerve','2. 外周神经传导检查 / 浅感觉检查')+path('body','3. 内脏脂肪 / 人体成分检测');
  sections[5].innerHTML='<h2><span class="section-num">6</span>健康指导</h2>'+path('education','1. 健康处方');
};
const referenceDrawer=renderDrawer;
renderDrawer=function(){
  referenceDrawer();
  if(state.drawerKind!=='nonexam'||!state.drawer||state.view!=='panel')return;
  const p=patient(),body=document.querySelector('.nonexam-drawer .drawer-body'),actions=document.querySelector('.nonexam-drawer .drawer-actions');
  if(!body||!actions)return;
  body.innerHTML=referenceBody(p);
  actions.innerHTML=referenceActions();
  const key=nonExamState.path==='questionnaire'?`questionnaire_${referenceState.questionnaire}`:nonExamState.path==='previsit'?`previsit_${referenceState.preTab}`:nonExamState.path;
  const record=p.referenceRecords?.[key];
  if(record){const form=body.querySelector('#reference-form');if(form)for(const [key,value] of Object.entries(record)){if(Array.isArray(value)){form.querySelectorAll(`[name="${key}"]`).forEach(field=>field.checked=value.includes(field.value));continue}const field=form.elements.namedItem(key);if(field&&typeof value==='string')field.value=value}}
  if(nonExamState.path==='abi')updateAbi();
};
const refSection=(title,content)=>`<section class="ref-section"><h3>${title}</h3>${content}</section>`;
const refField=(label,name,type='text',value='',extra='')=>`<label class="ref-field"><span>${label}</span><input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const refSelect=(label,name,options)=>`<label class="ref-field"><span>${label}</span><select name="${name}">${options.map(x=>`<option>${x}</option>`).join('')}</select></label>`;
const refRadios=(label,name,options)=>`<fieldset class="ref-radio"><legend>${label}</legend>${options.map((value,i)=>`<label><input type="radio" name="${name}" value="${value}" ${i===0?'checked':''}>${value}</label>`).join('')}</fieldset>`;
const refChecks=(options,name)=>`<div class="ref-checks">${options.map(value=>`<label><input type="checkbox" name="${name}" value="${value}">${value}</label>`).join('')}</div>`;
const refTabs=(items,current,action)=>`<div class="ref-tabs">${items.map(([key,label])=>`<button type="button" data-reference-action="${action}" data-value="${key}" class="${key===current?'active':''}">${label}</button>`).join('')}</div>`;
function referenceBody(p){
  const path=nonExamState.path;
  if(path==='previsit')return refTabs([['basic','基础信息'],['vitals','体征数据'],['symptoms','疾病症状'],['lifestyle','生活方式'],['other','其他评估']],referenceState.preTab,'pre-tab')+`<form id="reference-form">${previsitContent(p)}</form>`;
  if(path==='questionnaire')return refTabs([['sleep','睡眠呼吸暂停初筛量表'],['mood','汉密尔顿抑郁量表'],['copd','COPD评估测试评分表']],referenceState.questionnaire,'questionnaire-tab')+refSection(referenceState.questionnaire==='sleep'?'睡眠呼吸暂停筛选量表':referenceState.questionnaire==='mood'?'汉密尔顿抑郁量表':'COPD评估测试评分表',`<form id="reference-form" class="ref-questionnaire">${questionContent()}</form>`);
  if(path==='copd')return refSection('评估',`<div class="ref-kv"><span>肺功能 FEV1（%预计值）</span><strong>暂无数据</strong></div><div class="ref-copd-grid"><span>急性加重史 ≥2次或 ≥1次住院</span><button class="${p.copdAssessment?.grade==='E'?'chosen':''}" data-reference-action="copd-grade" data-value="E">E</button><span>0 或 1 次未导致住院</span><div><button data-reference-action="copd-grade" data-value="A">A</button><button data-reference-action="copd-grade" data-value="B">B</button></div></div><small>mMRC 0-1 / CAT&lt;10 为 A；mMRC ≥2 / CAT≥10 为 B</small>`)+refSection('管理等级',`<p><span class="ref-level">强化管理</span> 加强营养，防寒保暖；戒烟；减少职业暴露；规范用药并监测呼吸道症状。</p>`)+refSection('药物治疗',`<div class="ref-kv"><span>当前建议分组</span><strong>${esc(p.copdAssessment?.grade||'E')} 组 · LABA + LAMA</strong></div><form id="reference-form" class="ref-form-grid">${refField('急性加重次数','flare','number',p.copdAssessment?.flare||'2','min="0"')}${refField('CAT 评分','cat','number',p.copdAssessment?.cat||'10','min="0" max="40"')}</form>`);
  if(['bp','glucose','chest'].includes(path))return resultContent(path);
  if(['abi','nerve','body'].includes(path))return optionalContent(path);
  if(path==='followup')return followupContent(p);
  if(path==='report')return reportContent(p);
  if(path==='education')return guideContent(p);
  return nonExamBody(p);
}
function previsitContent(p){
  const tab=referenceState.preTab;
  if(tab==='basic')return refSection('基本信息',`<div class="ref-form-grid">${refField('身份证号','identity','text',p.identity,'readonly')}${refField('最近就诊时间','lastVisit','text',p.lastVisit,'readonly')}${refField('责任医生','doctor','text',p.doctor,'readonly')}${refField('联系方式','phone','text',p.phone,'readonly')}</div><p class="ref-warning">当前患者慢阻肺在随访周期内或超期</p><div class="ref-records"><div><strong>王某某</strong><span>去完善信息</span><small>责任医生　${esc(p.doctor)}<br>签约医生　${esc(p.doctor)}<br>预约就诊时间　2026-10-01</small></div><div><strong>高血压专档</strong><span>三级管理</span><small>上次随访　2026-08-28<br>下次随访　2026-10-01</small></div></div>`);
  if(tab==='vitals')return refSection('体征数据',`<div class="ref-form-grid">${refField('收缩压（mmHg）','sbp','number','140')}${refField('舒张压（mmHg）','dbp','number','90')}${refField('心率（次/min）','pulse','number','76')}${refField('体重（kg）','weight','number','68')}${refField('身高（cm）','height','number','165')}${refField('BMI','bmi','number','25.0')}${refField('腰围（cm）','waist','number','76')}${refField('体温（℃）','temperature','number','36.5')}</div>`);
  if(tab==='symptoms')return refSection('疾病症状',refChecks(['无症状','头痛','头晕','视力模糊','眼花','耳鸣','鼻出血','口角歪斜','言语不清','多饮','多尿','乏力','恶心呕吐','心悸','胸闷','胸痛','呼吸困难','下肢水肿','四肢麻木'],'symptom'));
  if(tab==='lifestyle')return refSection('生活方式',`<div class="ref-form-grid">${refRadios('吸烟状况','smokingStatus',['吸烟','从未吸烟','已戒烟'])}${refField('日吸烟量（支）','smoking','number','0')}${refField('日饮酒量（两）','drinking','number','0')}${refField('运动频次（次/周）','exerciseFrequency','number','3')}${refField('每次运动（分钟）','exerciseMinutes','number','30')}${refField('每晚睡眠（小时）','sleepHours','number','7')}${refRadios('摄盐状况','salt',['轻','中','重'])}${refRadios('饮食结构','diet',['荤素均衡','荤食为主','素食为主'])}${refRadios('心理调整','mood',['良好','一般','差'])}</div>`);
  return refSection('辅助检查',`<div class="ref-form-grid">${refField('空腹血糖（mmol/L）','fastingGlucose','number','5.6')}${refField('餐后血糖（mmol/L）','postGlucose','number','7.8')}${refRadios('足背动脉搏动','footPulse',['触及正常','减弱','消失'])}</div>`)+refSection('其他评估',`<div class="ref-form-grid">${refRadios('高血压服药依从性','hypertensionMedicine',['规律','间断','不服药'])}${refRadios('高血脂服药依从性','lipidMedicine',['规律','间断','不服药'])}${refRadios('糖尿病服药依从性','diabetesMedicine',['规律','间断','不服药'])}${refRadios('药物不良反应','adverse',['无','有'])}${refRadios('低血糖反应','hypoglycemia',['无','偶尔','频繁'])}</div>`);
}
function questionContent(){
  const sleep=['是否男性','颈围是否大于40cm','年龄是否大于50岁','BMI是否大于35','您有高血压吗','有人发现您睡眠中有呼吸暂停吗','您白天感到疲倦、劳累、嗜睡吗','您打鼾声音大吗？上说话声音大或关上门能听见'];
  const mood=['抑郁情绪','有罪感','自杀念头','入睡困难','睡眠不深','早醒','工作和活动','迟缓'];
  const copd=['咳嗽程度','痰液情况','胸闷程度','爬坡气促','家务活动受限','外出信心','睡眠情况','精力水平'];
  const items=referenceState.questionnaire==='sleep'?sleep:referenceState.questionnaire==='mood'?mood:copd;
  return items.map((item,i)=>`<fieldset><legend>${i+1}. ${item}</legend>${(referenceState.questionnaire==='sleep'?['是','否']:['0','1','2','3','4','5']).map(value=>`<label><input type="radio" name="q${i+1}" value="${value}" required>${value}</label>`).join('')}</fieldset>`).join('');
}
function resultContent(path){
  const name={bp:'血压',glucose:'血糖',chest:'胸部CT平扫'}[path];
  const dates=['2026-09-10','2026-06-26','2026-01-23'];
  const rows=path==='bp'?[['收缩压','152.0 ↑','mmHg','90～140'],['舒张压','83.0','mmHg','60～90']]:path==='glucose'?[['空腹血糖','7.79 ↑','mmol/L','3.9～6.1'],['餐后血糖','9.4 ↑','mmol/L','<7.8']]:[];
  return refSection(name,`<div class="ref-view-switch"><button data-reference-action="result-mode" data-value="列表" class="${referenceState.resultMode==='列表'?'active':''}">列表</button><button data-reference-action="result-mode" data-value="图表" class="${referenceState.resultMode==='图表'?'active':''}">趋势</button></div>${path!=='chest'&&referenceState.resultMode==='图表'?`<div class="ref-trend" aria-label="${name}历史趋势"><div class="ref-trend-line"></div><div class="ref-trend-line second"></div><span>1月</span><span>3月</span><span>6月</span><span>9月</span><span>12月</span></div>`:''}<div class="ref-timeline">${dates.map(date=>`<div class="ref-timeline-item"><strong>${date}</strong>${path==='chest'?`<div class="ref-imaging"><b>检查所见</b><p>左肺上叶前段见部分实性结节，边界模糊；右肺下叶见实性结节，建议结合既往检查复查。</p><b>检查结果</b><p>左上叶部分实性结节，建议6个月复查胸部CT；右下叶结节对照前片相仿。</p></div>`:`<table class="ref-table"><thead><tr><th>检测指标</th><th>检测结果</th><th>计量单位</th><th>参考范围</th></tr></thead><tbody>${rows.map(row=>`<tr>${row.map((cell,i)=>`<td class="${i===1&&cell.includes('↑')?'ref-danger':''}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`}</div>`).join('')}</div>`);
}
function optionalContent(path){
  if(path==='abi')return refSection('踝肱指数 ABI <span title="踝部收缩压与上臂收缩压之比，用于评估外周血管。">ⓘ</span>',`<form id="reference-form" class="ref-form-grid">${refField('上臂收缩压（mmHg）','arm','number','','min="1" step="0.1"')}${refField('踝部收缩压（mmHg）','ankle','number','','min="1" step="0.1"')}<div class="ref-field"><span>踝肱指数 ABI</span><output id="abi-output">请填写收缩压</output></div></form>`);
  if(path==='nerve')return refSection('外周神经传导检查 / 浅感觉检查',`<form id="reference-form" class="ref-form-grid">${refSelect('左足浅感觉','leftSensation',['请选择','正常','减退','消失'])}${refSelect('右足浅感觉','rightSensation',['请选择','正常','减退','消失'])}${refSelect('神经传导','nerveConduction',['请选择','正常','异常'])}${refField('检查日期','date','date',TODAY)}<label class="ref-field ref-wide"><span>检查备注</span><textarea name="note"></textarea></label></form>`);
  return refSection('内脏脂肪 / 人体成分检测',`<form id="reference-form" class="ref-form-grid">${refField('体重（kg）','weight','number','','min="1" step="0.1"')}${refField('体脂率（%）','bodyFat','number','','min="0" step="0.1"')}${refField('内脏脂肪等级','visceralFat','number','','min="0"')}${refField('骨骼肌量（kg）','muscle','number','','min="0" step="0.1"')}${refField('检查日期','date','date',TODAY)}</form>`);
}
function followupContent(p){return `<form id="reference-form">${refSection('高血压随访',`<div class="ref-form-grid">${refField('应随访日期','due','date',TODAY)}${refField('随访日期','date','date',TODAY)}${refSelect('随访方式','method',['门诊','电话','上门'])}</div>`)}${refSection('诊前采集记录',`<div class="ref-record-line">2026-09-20 15:17　152/83 mmHg　165 cm　59 kg　填写人：${esc(p.doctor)} <button type="button" data-reference-action="extract">选择</button></div>`)}${refSection('就诊记录列表',`<div class="ref-record-line">2026-09-28　血压未填　全科门诊 <button type="button" data-reference-action="extract">选择</button></div>`)}${refSection('疾病症状',refChecks(['无症状','头痛头晕','恶心呕吐','眼花耳鸣','呼吸困难','心悸胸闷','鼻出血','四肢麻木','下肢水肿'],'symptoms'))}${refSection('体征数据',`<div class="ref-form-grid">${refField('收缩压（mmHg）','sbp','number','140')}${refField('舒张压（mmHg）','dbp','number','90')}${refField('体重（kg）','weight','number','59')}${refField('目标体重（kg）','targetWeight','number','58')}${refField('身高（cm）','height','number','165')}${refField('BMI','bmi','number','20.9')}${refField('腰围（cm）','waist','number','65')}${refField('心率（次/分钟）','heartRate','number','96')}</div>`)}${refSection('生活方式',`<div class="ref-form-grid">${refField('当前日吸烟量（支）','smoking','number','0')}${refField('目标日吸烟量（支）','targetSmoking','number','0')}${refField('当前日饮酒量（两）','drinking','number','0')}${refField('目标日饮酒量（两）','targetDrinking','number','0')}${refField('当前运动（次/周）','exercise','number','3')}${refField('目标运动（次/周）','targetExercise','number','4')}${refRadios('摄盐状况','salt',['轻','中','重'])}${refRadios('心理调整','mood',['良好','一般','差'])}</div>`)}${refSection('辅助检查',`<div class="ref-form-grid">${refField('靶器官损害','organDamage')}${refField('合并症','comorbidity')}${refField('其他疾病','otherDisease')}</div>`)}${refSection('其他评估',`<div class="ref-form-grid">${refRadios('高血压服药依从性','adherence',['规律','间断','不服药'])}${refRadios('药物不良反应','adverse',['无','有'])}${refChecks(['控制满意','控制不满意','不良反应','并发症/合并症新增或加重'],'classification')}</div>`)}${refSection('用药情况',`<table class="ref-table"><thead><tr><th>药品名称</th><th>规格</th><th>数量</th><th>用药方式</th><th>用药频次</th></tr></thead><tbody><tr><td>氨氯地平片</td><td>5mg</td><td>1盒</td><td>口服</td><td>每日一次</td></tr></tbody></table><button type="button" data-reference-action="add-medication">＋ 新增药品</button><div id="ref-medications"></div>`)}${refSection('转诊',`${refRadios('是否需要转诊','needReferral',['否','是'])}<div class="ref-form-grid">${refField('转诊原因','referralReason')}${refField('机构及级别','referralHospital')}</div>`)}${refSection('转诊回访',`<div class="ref-form-grid">${refField('回访日期','callbackDate','date')}${refField('未转诊原因','noReferralReason')}</div>`)}</form>`}
function reportContent(p){
  const labels=['年度健康服务','健康评估','主要健康问题','关键指标','医生寄语'];
  const page=referenceState.reportPage;
  if(referenceState.reportType==='慢阻肺')return `<div class="ref-report-toolbar">${refTabs([['两慢病','两慢病'],['慢阻肺','慢阻肺']],referenceState.reportType,'report-type')}<label>打印日期 <input type="date" value="${TODAY}"></label></div><div class="ref-paper"><h2>慢阻肺健康评估报告（年度）</h2><div class="ref-report-metrics"><span>姓名<br><b>${esc(p.name)}</b></span><span>年龄<br><b>${p.age} 岁</b></span><span>报告日期<br><b>${TODAY}</b></span></div><h3>肺功能与症状评估</h3>${refTable(['指标','本次记录','管理建议'],[['FEV1（%预计值）','暂无数据','建议完成肺功能检查'],['急性加重次数',esc(p.copdAssessment?.flare||'2'),'持续监测'],['CAT 评分',esc(p.copdAssessment?.cat||'10'),'按期评估']])}<h3>管理等级</h3><p>${esc(p.copdAssessment?.grade||'E')} 组 · 强化管理。建议戒烟、保持吸入药物规律使用，按计划完成复查。</p><h3>健康指导</h3><ul>${guideItems.呼吸训练.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  let content='';
  if(page===1)content=`<h2>两慢病健康评估报告（年度）</h2><div class="ref-report-metrics"><span>姓名<br><b>${esc(p.name)}</b></span><span>性别<br><b>${esc(p.sex)}</b></span><span>年龄<br><b>${p.age}</b></span><span>身高<br><b>165 cm</b></span><span>体重<br><b>75 kg</b></span><span>BMI<br><b>27.5 偏高</b></span></div><h3>您的年度健康服务计划</h3>${refTable(['名称','应完成','未完成'],[['体征采集','4次/年','2'],['生活方式问询','4次/年','2'],['健康指导和教育','4次/年','2'],['异常值追踪','4次/年','2']])}<h3>年度专病服务小结</h3><p>本年度就诊 6 次，体检 1 次；已完成慢病随访和健康指导，请继续关注异常指标。</p>`;
  if(page===2)content=`<h2>健康评估</h2><div class="ref-score"><strong>75.4</strong><span>心血管健康分 · 较上次提升</span></div><p>心血管风险评估：高危。建议按期复查，持续记录血压、血糖及体重。</p><h3>指标趋势分析</h3><div class="ref-trend"><div class="ref-trend-line"></div><div class="ref-trend-line second"></div></div><p>血脂趋势和体重趋势可结合本年度检查记录查看。</p>`;
  if(page===3)content=`<h2>主要健康问题</h2><ul><li>血压控制不达标，BMI 偏高。</li><li>低密度脂蛋白胆固醇不达标。</li><li>运动不足，仍有吸烟相关风险。</li></ul><h3>健康指导建议</h3><p>规律复查血压、血糖和血脂，按医嘱规范用药，保持适量运动。</p><h3>用药情况</h3>${refTable(['药物名称','用量','用药时间'],[['氨氯地平片','每日一次','早间'],['二甲双胍片','每日两次','餐后']])}`;
  if(page===4)content=`<h2>关键指标情况</h2>${refTable(['指标名称','正常范围','你的值','目标范围','达标'],[['BMI','18.5～23.9','27.5','<24','×'],['腰围','<80 cm','88','<85','×'],['血压','<140/90','152/83','<140/90','×'],['空腹血糖','3.9～6.1','7.79','<7.0','×'],['总胆固醇','3.0～5.2','4.05','<5.2','✓'],['甘油三酯','0.45～1.69','1.15','<1.7','✓']])}`;
  if(page===5)content=`<h2>致尊敬的${esc(p.name)}先生/女士</h2><p>本年度健康管理已完成阶段性评估。请继续按时服药、保持良好习惯，并根据医生建议完成复查。</p><p>建议坚持清淡饮食、增加蔬菜水果摄入、适度运动，并在出现不适时及时就诊。</p><p class="ref-signature">您的医生：${esc(p.doctor)}<br>${TODAY}</p>`;
  return `<div class="ref-report-toolbar">${refTabs([['两慢病','两慢病'],['慢阻肺','慢阻肺']],referenceState.reportType,'report-type')}<label>打印日期 <input type="date" value="${TODAY}"></label></div><div class="ref-paper">${content}<small>${page}/5 · ${labels[page-1]}</small></div><div class="ref-pagination"><button data-reference-action="report-page" data-value="${Math.max(1,page-1)}" ${page===1?'disabled':''}>上一页</button>${[1,2,3,4,5].map(n=>`<button data-reference-action="report-page" data-value="${n}" class="${n===page?'active':''}">${n}</button>`).join('')}<button data-reference-action="report-page" data-value="${Math.min(5,page+1)}" ${page===5?'disabled':''}>下一页</button></div>`;
}
function refTable(headers,rows){return `<table class="ref-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`}
const guideItems={呼吸训练:['每日练习缩唇呼吸，像吹蜡烛般缓慢呼气，吸气与呼气时长比约1:2','运动中感觉气短时立即停下休息，坐下放松并调整呼吸'],吸入药物:['按医嘱规律使用吸入药物；学习如何使用吸入装置，吸药后漱口'],防护:['彻底戒烟，远离二手烟和三手烟','雾霾天气外出佩戴 N95 口罩','烹饪时开启油烟机，避免室内油烟'],运动:['坚持轻量步行，每周逐步增加活动时间'],膳食:['控制盐摄入，保证蛋白质与蔬菜摄入'],疫苗接种:['按建议接种流感和肺炎球菌疫苗']};
function guideContent(p){
  const tabs=[['处方','健康处方'],['建议','指导建议'],['文章','宣教文章']];
  if(referenceState.guideTab==='处方')return refTabs(tabs,referenceState.guideTab,'guide-tab')+`<div class="ref-prescription"><div><h2>健康处方</h2><p>${esc(p.name)} · ${p.age} 岁</p><p>BMI 30.44　吸烟中　运动 120 分钟/周</p><div class="ref-score"><strong>47.86</strong><span>心血管健康分</span></div><p>建议复查日期：2026-11-11</p></div><div><h3>建议复查项目</h3><p>血常规、尿常规、肾功能、肝功能、空腹血糖、餐后血糖、血脂四项</p>${refTable(['指标','最近一次','上次','目标'],[['血压','158/82 ↑','137/92','<150/90'],['空腹血糖','8.9','5.2','3.9～6.1']])}<h3>主要健康问题</h3><p>异常体征：BMI 偏高、血压偏高；生活方式：运动不足、吸烟。</p><h3>指导建议</h3><ul>${guideItems.呼吸训练.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>`;
  if(referenceState.guideTab==='建议')return refTabs(tabs,referenceState.guideTab,'guide-tab')+`<div class="ref-guide-top">${refTabs([['通用','通用'],['高血压','高血压'],['糖尿病','糖尿病'],['慢阻肺','慢阻肺'],['高血脂','高血脂']],referenceState.guideDisease,'guide-disease')}</div><div class="ref-guide-layout"><nav>${Object.entries(guideItems).map(([group,items])=>`<button data-reference-action="guide-group" data-value="${group}" class="${referenceState.guideGroup===group?'active':''}">${group} (${items.length})</button>`).join('')}</nav><div><p class="ref-ai">AI 已根据患者病史与风险评估推荐生活方式意见</p>${guideItems[referenceState.guideGroup].map((item,i)=>`<label class="ref-guide-item"><input type="checkbox" data-guide-item="${esc(item)}" checked><span>${item}</span><em>AI推荐</em></label>`).join('')}</div></div>`;
  const articles=[['这份指南请收好 假期不变“小胖墩”','通用'],['科学健走，行动起来','通用'],['怎样判断自己到底胖不胖','通用'],['吃动两平衡，保持健康体重','高血压'],['慢阻肺患者居家呼吸训练','慢阻肺'],['血糖监测与健康饮食','糖尿病']].filter(x=>referenceState.articleFilter==='全部'||x[1]===referenceState.articleFilter);
  return refTabs(tabs,referenceState.guideTab,'guide-tab')+refTabs([['全部','全部'],['通用','通用'],['高血压','高血压'],['糖尿病','糖尿病'],['慢阻肺','慢阻肺']],referenceState.articleFilter,'article-filter')+`<div class="ref-articles">${articles.map(([title,type])=>`<label><input type="checkbox" data-article="${esc(title)}"><span><strong>${title}</strong><small>${type} · 更新日期 2026-08-02</small></span><button type="button" data-reference-action="favorite" aria-label="收藏${title}">☆</button></label>`).join('')}</div>`;
}
function referenceActions(){
  const path=nonExamState.path;
  if(['previsit','questionnaire','copd','followup','abi','nerve','body'].includes(path))return `<button class="btn" data-reference-action="reset-form">重置</button><button class="btn primary" data-reference-action="save">${path==='questionnaire'?'提交':'保存'}</button>`;
  if(path==='report')return '<button class="btn primary" data-reference-action="print">打印报告</button>';
  if(path==='education')return `<button class="btn primary" data-reference-action="${referenceState.guideTab==='文章'?'push':'accept-guide'}">${referenceState.guideTab==='文章'?'推送所选文章':'保存处方'}</button>`;
  return '<button class="btn" data-nonexam-action="close">收起</button>';
}
function updateAbi(){const form=document.querySelector('#reference-form'),output=document.querySelector('#abi-output');if(!form||!output)return;const arm=Number(form.elements.arm?.value),ankle=Number(form.elements.ankle?.value);output.textContent=arm>0&&ankle>0?(ankle/arm).toFixed(2):'请填写收缩压'}
document.addEventListener('input',event=>{if(event.target.closest('#reference-form')&&nonExamState.path==='abi')updateAbi()});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-reference-action]');if(!button)return;
  const action=button.dataset.referenceAction,value=button.dataset.value,p=patient();
  if(action==='pre-tab'){referenceState.preTab=value;renderDrawer();return}
  if(action==='questionnaire-tab'){referenceState.questionnaire=value;renderDrawer();return}
  if(action==='result-mode'){referenceState.resultMode=value;renderDrawer();return}
  if(action==='report-type'){referenceState.reportType=value;referenceState.reportPage=1;renderDrawer();return}
  if(action==='report-page'){referenceState.reportPage=Number(value);renderDrawer();return}
  if(action==='guide-tab'){referenceState.guideTab=value;renderDrawer();return}
  if(action==='guide-disease'){referenceState.guideDisease=value;renderDrawer();return}
  if(action==='guide-group'){referenceState.guideGroup=value;renderDrawer();return}
  if(action==='article-filter'){referenceState.articleFilter=value;renderDrawer();return}
  if(action==='favorite'){button.classList.toggle('active');button.textContent=button.classList.contains('active')?'★':'☆';return}
  if(action==='extract'){const form=document.querySelector('#reference-form');if(form){form.elements.sbp.value='152';form.elements.dbp.value='83';form.elements.weight.value='59';form.elements.height.value='165'}notify('已带入诊前采集记录');return}
  if(action==='add-medication'){document.querySelector('#ref-medications')?.insertAdjacentHTML('beforeend','<div class="ref-form-grid">'+refField('药品名称','medicine')+refField('用量','dose')+'</div>');return}
  if(action==='reset-form'){document.querySelector('#reference-form')?.reset();updateAbi();return}
  if(action==='print'){window.print();return}
  if(action==='save'){
    const form=document.querySelector('#reference-form');if(!form)return;
    if(nonExamState.path==='questionnaire'&&!form.reportValidity()){notify('请完成全部问卷题目');return}
    if(nonExamState.path==='abi'&&(!Number(form.elements.arm.value)||!Number(form.elements.ankle.value))){notify('请填写两处收缩压');return}
    p.referenceRecords??={};const recordKey=nonExamState.path==='questionnaire'?`questionnaire_${referenceState.questionnaire}`:nonExamState.path==='previsit'?`previsit_${referenceState.preTab}`:nonExamState.path;
    p.referenceRecords[recordKey]=Object.fromEntries(new FormData(form));
    if(nonExamState.path==='previsit'&&referenceState.preTab==='symptoms')p.referenceRecords[recordKey].symptom=[...form.querySelectorAll('[name="symptom"]:checked')].map(field=>field.value);
    if(nonExamState.path==='followup')p.referenceRecords[recordKey].symptoms=[...form.querySelectorAll('[name="symptoms"]:checked')].map(field=>field.value);
    if(nonExamState.path==='previsit')p.didPrevisit=true;
    if(nonExamState.path==='questionnaire')p.questionnaire={...p.referenceRecords[recordKey],type:referenceState.questionnaire,date:TODAY};
    if(nonExamState.path==='copd')p.copdAssessment={...p.copdAssessment,...p.referenceRecords.copd,grade:p.copdAssessment?.grade||'E'};
    if(nonExamState.path==='followup'){p.followupRecord={...p.followupRecord,...p.referenceRecords.followup};p.followed=true}
    save();if(nonExamState.path==='previsit')renderPanel();notify('已保存诊中演示记录');return;
  }
  if(action==='copd-grade'){p.copdAssessment={...p.copdAssessment,grade:value};save();renderDrawer();return}
  if(action==='push'){const titles=[...document.querySelectorAll('[data-article]:checked')].map(x=>x.dataset.article);if(!titles.length){notify('请选择宣教文章');return}p.educationPushes??=[];titles.forEach(title=>p.educationPushes.push({title,date:TODAY}));save();notify(`已推送 ${titles.length} 篇文章（演示）`);return}
  if(action==='accept-guide'){p.referenceRecords??={};p.referenceRecords.education={savedAt:TODAY};save();notify('已保存健康处方（演示）')}
});
render();
