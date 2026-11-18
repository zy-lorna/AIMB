// Product prototype refinements. All organization names below county level and all values are demonstrations.
const demoClinicNames={
  '余杭区':['良渚街道','仁和街道','余杭街道','闲林街道','五常街道','仓前街道','中泰街道','瓶窑镇','径山镇','黄湖镇','鸬鸟镇','百丈镇'],
  '上城区':['湖滨街道','清波街道','小营街道','望江街道','南星街道','紫阳街道','采荷街道','凯旋街道','闸弄口街道','四季青街道','彭埠街道','笕桥街道','九堡街道','丁兰街道'],
  '拱墅区':['长庆潮鸣街道','天水武林街道','文晖街道','朝晖街道','东新街道','石桥街道','拱宸桥街道','大关上塘街道','小河湖墅街道','祥符街道','康桥街道','米市巷街道','半山街道','和睦街道'],
  '西湖区':['文新街道','三墩镇','古荡街道','转塘街道','双浦镇','北山街道','灵隐街道','翠苑街道','留下街道'],
  '滨江区':['长河街道'],
  '萧山区':['所前镇','盈丰街道','闻堰街道','蜀山街道','瓜沥镇','益农镇','楼塔镇','河上镇','衙前镇','北干街道','城厢街道','浦阳镇','戴村镇','进化镇','临浦镇'],
  '临平区':['运河街道','崇贤街道','塘栖镇','东湖街道','星桥街道'],
  '钱塘区':['下沙街道','河庄街道','义蓬街道','新湾街道','临江街道','前进街道'],
  '鹿城区':['七都街道','滨江街道','南汇街道','松台街道','五马街道','广化街道','双屿街道','大南街道','南郊街道','蒲鞋市街道','藤桥镇'],
  '龙湾区':['永中街道','海滨街道','永兴街道','蒲州街道','瑶溪街道','状元街道'],
  '瓯海区':['茶山街道','郭溪街道','娄桥街道','潘桥街道','梧田街道','三垟街道','仙岩街道','丽岙街道','南白象街道'],
  '洞头区':['北岙街道','东屏街道','元觉街道','霓屿街道'],
  '永嘉县':['瓯北街道','黄田街道','三江街道','乌牛街道'],
  '瑞安市':['玉海街道','莘塍街道']
};
const roleNames={province:'省级',city:'市级',county:'区县',consortium:'医共体',clinic:'基层机构'};
const originalPopulationFor=populationFor;
populationFor=function(x){
  if(x.consortiumName&&!x.clinicIndex){let members=clinics.filter(c=>c.consortiumName===x.name),keys=['high','diabetes','overlap','diagnosed','managedHigh','managedDiabetes','managedOverlap','managed','senior','riskHigh','riskDiabetes'];return Object.fromEntries(keys.map(key=>[key,members.reduce((n,c)=>n+populationFor(c)[key],0)]))}
  let p=originalPopulationFor(x);if(!x.cityName)return p;
  let siblings=counties.filter(c=>c.cityName===x.cityName),county=siblings.find(c=>c.adcode===x.adcode),rank=siblings.indexOf(county),weights=siblings.map((c,i)=>1+(i%5-2)*.055),mean=siblings.reduce((n,c,i)=>n+c.should*weights[i],0)/siblings.reduce((n,c)=>n+c.should,0),factor=(weights[rank]||1)/mean;
  if(x.clinicIndex){let members=clinics.filter(c=>c.adcode===x.adcode),micro=1+(x.clinicIndex%7-3)*.018,microMean=members.reduce((n,c)=>n+1+(c.clinicIndex%7-3)*.018,0)/members.length;factor*=micro/microMean}
  for(let key of ['managedHigh','managedDiabetes','managedOverlap','riskHigh','riskDiabetes'])p[key]*=factor;
  p.managed=p.managedHigh+p.managedDiabetes-p.managedOverlap;return p
};
const fullName=x=>x.cityName&&!x.consortiumName?x.cityName+x.name:x.name;
const currentNode=()=>state.city==='all'?null:selected()[0];
function inScope(x){let me=currentNode();if(state.role==='province')return true;if(!me)return true;if(state.role==='city')return x.name==='杭州市'||x.cityName==='杭州市';if(state.role==='county')return x.name==='余杭区'&&x.cityName==='杭州市'||x.county==='余杭区'&&x.cityName==='杭州市';if(state.role==='consortium')return x.name===me.name||x.consortiumName===me.name;return x.name===me.name}
function orgOption(value,label,active,allowed=true){return `<button type="button" class="org-option ${active?'active':''}" data-org="${esc(value)}" ${allowed?'':'disabled'}>${esc(label)}</button>`}
renderOrgPicker=function(){
  let [level,name]=state.city==='all'?[]:state.city.split(':'),me=currentNode(),cityName=level==='city'?name:me?.cityName,countyName=['county','consortium','clinic'].includes(level)?me?.county:null,consortiumName=['consortium','clinic'].includes(level)?me?.consortiumName:null;
  $('orgValue').textContent=['浙江省',cityName,countyName,consortiumName,level==='clinic'?name:null].filter(Boolean).join(' > ');
  let browsingCity=orgBrowseCity,browsingCounty=orgBrowseCounty,browsingConsortium=orgBrowseConsortium;
  let columns=[['省级',[{value:'all',label:'浙江省',entity:null}]]];
  if(orgBrowseProvince)columns.push(['地市',cities.map(x=>({value:nodeKey(x),label:x.name,entity:x}))]);
  if(browsingCity)columns.push(['区县',counties.filter(x=>x.cityName===browsingCity).map(x=>({value:nodeKey(x),label:x.cityName+x.name,entity:x}))]);
  if(browsingCounty)columns.push(['医共体 / 直属医院',consortia.filter(x=>x.cityName===browsingCity&&x.county===browsingCounty).map(x=>({value:nodeKey(x),label:x.name,entity:x}))]);
  if(browsingConsortium)columns.push(['基层医疗卫生机构',clinics.filter(x=>x.consortiumName===browsingConsortium).map(x=>({value:nodeKey(x),label:x.name,entity:x}))]);
  $('orgPanel').innerHTML=columns.map(([title,items])=>`<div class="org-col"><div class="org-col-title">${title}</div><div class="org-col-options">${items.map(x=>orgOption(x.value,x.label,x.value===state.city,x.entity?inScope(x.entity):state.role==='province')).join('')}</div></div>`).join('');
};
let orgBrowseProvince=true;
function childUnits(){let me=currentNode();if(!me)return cities;if(state.city.startsWith('city:'))return counties.filter(x=>x.cityName===me.name);if(state.city.startsWith('county:'))return consortia.filter(x=>x.adcode===me.adcode);if(state.city.startsWith('consortium:'))return clinics.filter(x=>x.consortiumName===me.name);return [me]}
function comparisonUnits(){let me=currentNode();if(!me)return counties;if(state.city.startsWith('city:'))return counties.filter(x=>x.cityName===me.name);if(state.city.startsWith('county:'))return clinics.filter(x=>x.adcode===me.adcode);if(state.city.startsWith('consortium:'))return clinics.filter(x=>x.consortiumName===me.name);return [me]}
function formatPct(n){return `${n.toFixed(1)}%`}
function popCoverage(x){let p=populationFor(x);return p.diagnosed?p.managed/p.diagnosed*100:0}
function populationDataFor(nodes){return nodes.map(populationFor).reduce((a,p)=>({diagnosed:a.diagnosed+p.diagnosed,managed:a.managed+p.managed,managedHigh:a.managedHigh+p.managedHigh,managedDiabetes:a.managedDiabetes+p.managedDiabetes}),{diagnosed:0,managed:0,managedHigh:0,managedDiabetes:0})}
function insightMarkup(index,title,signal,finding,action,evidence,type,group){return `<article class="insight-card"><header><span class="ai-index">${index}</span>${title}<span class="ai-tag">智能发现</span></header><div class="signal">${signal}</div><div class="finding">${finding}</div><div class="action">${action}</div><div class="evidence">${evidence}</div><button type="button" class="link" data-insight-group="${group}" data-insight-type="${type}">查看完整分析</button></article>`}
function renderPopulationIntelligence(){let target=document.querySelector('.population-page .ai-panel');if(!target)return;let {items}=populationFindings(),title=state.role==='province'?'全省人群配置智能分析':`${esc(regionLabel())}人群服务智能分析`;target.querySelector('h2').textContent=title;target.querySelector('.ai-summary')?.remove();target.querySelector('.ai-insights').outerHTML=`<div class="insight-grid">${items.map((x,i)=>insightMarkup(String(i+1).padStart(2,'0'),x.title,x.signal,x.finding,x.action,x.evidence,String(i),'population')).join('')}</div>`;
  let riskPanel=document.querySelector('.population-grid .panel:last-child'),riskData=populationData();if(riskPanel){let total=riskData.riskHigh+riskData.riskDiabetes;riskPanel.querySelector('.resource-bars')?.insertAdjacentHTML('afterend',`<div class="risk-overview"><div class="risk-overview-label">高危线索病种构成</div><div class="risk-share-bar"><i style="width:${riskData.riskHigh/total*100}%"></i><i style="width:${riskData.riskDiabetes/total*100}%"></i></div><div class="risk-share-values"><span>高血压线索 <b>${formatPct(riskData.riskHigh/total*100)}</b></span><span>糖尿病线索 <b>${formatPct(riskData.riskDiabetes/total*100)}</b></span></div></div>`)}
  let chart=document.querySelector('.population-chart');if(chart){let labels=['84岁以上','75–84岁','65–74岁','55–64岁','45–54岁','35–44岁','35岁以下'],shares=[.025,.095,.25,.28,.22,.11,.02],p=populationData(),colors=['#3489df','#18a79b','#f1a64c'],totals=[p.high-p.overlap,p.diabetes-p.overlap,p.overlap];let rows=labels.map((name,i)=>{let count=p.diagnosed*shares[i],segments=totals.map(v=>v/p.diagnosed*count),bar=(sex,ratio)=>`<div class="pop-sex-bar ${sex}" title="${name}${sex==='male'?'男':'女'} ${people(count*ratio)}">${(sex==='male'?[...segments].reverse():segments).map((v,j)=>`<i style="width:${v*ratio/(p.diagnosed*.22)*100}%;background:${colors[sex==='male'?2-j:j]}"></i>`).join('')}</div>`;return `<div class="population-chart-row">${bar('male',.48)}<span class="age-label">${name}</span>${bar('female',.52)}</div>`}).join('');chart.querySelectorAll('.population-chart-row').forEach(x=>x.remove());chart.querySelector('.population-chart-head').insertAdjacentHTML('afterend',rows)}
}
function nodeTier(x){if(!x.clinics)return '未建成';let n=x.clinicIndex||1;if(n%9===0)return '鼓励探索';if(n%3===0)return '强化功能';return '基本保障'}
function tierCounts(x){let items=x.clinicIndex?[x]:x.consortiumName?clinics.filter(y=>y.consortiumName===x.name):x.cityName?clinics.filter(y=>y.adcode===x.adcode):clinics.filter(y=>y.cityName===x.name);return {basic:items.filter(y=>y.clinics&&nodeTier(y)==='基本保障').length,enhanced:items.filter(y=>y.clinics&&nodeTier(y)==='强化功能').length,explore:items.filter(y=>y.clinics&&nodeTier(y)==='鼓励探索').length}}
function clinicFindings(){let s=selected(),units=comparisonUnits(),eligible=sum(s,'should'),built=sum(s,'clinics'),active=sum(s,'active'),unused=built-active,provinceUnused=(sum(cities,'clinics')-sum(cities,'active'))/sum(cities,'clinics')*100,weak=[...units].sort((a,b)=>rate(b.clinics-b.active,b.clinics)-rate(a.clinics-a.active,a.clinics))[0],under=units.filter(x=>x.clinics&&rate(x.clinics-x.active,x.clinics)>provinceUnused),gap=[...units].sort((a,b)=>(b.should-b.clinics)-(a.should-a.clinics))[0];return [
  {title:'建成后未充分使用',signal:`${under.length} 个单位`,finding:`${under.length} 个下辖单位的建而未用比例高于全省同期 ${formatPct(provinceUnused)}；${fullName(weak)}为 ${rate(weak.clinics-weak.active,weak.clinics)}%。`,action:`优先督促${fullName(weak)}确认开诊安排和接口服务记录，随后安排医共体人员支持。`,evidence:`本级已建 ${built} 家 · 有效启用 ${active} 家 · 未启用 ${unused} 家`,stats:[['已建',built+' 家'],['有效启用',active+' 家'],['未启用',unused+' 家'],['高于省均单位',under.length+' 个']]},
  {title:'建设缺口集中',signal:`${eligible-built} 家`,finding:`本级应建 ${eligible} 家，尚有 ${eligible-built} 家未完成建设；${fullName(gap)}缺口 ${gap.should-gap.clinics} 家，为当前范围最大。`,action:`将${fullName(gap)}列为建设计划优先地区，明确完成时间和场地、人员、设备支持。`,evidence:`当前范围 ${units.length} 个下辖单位 · 建设覆盖 ${rate(built,eligible)}%`,stats:[['应建',eligible+' 家'],['已建',built+' 家'],['最大缺口单位',fullName(gap)],['最大缺口',gap.should-gap.clinics+' 家']]},
  {title:state.role==='province'?'省级审核疑点':'申报与建设进度',signal:state.role==='province'?'AI 标注待复核':`${state.submissions.length} 条申报`,finding:state.role==='province'?'系统比对申报清单、标识照片、机构代码与接口开诊记录，标注不一致项供省级审核员复核。':`${esc(regionLabel())}的机构可准备建设材料，由区县统一提交；省级审核结论和退回原因在此跟踪。`,action:state.role==='province'?'进入审核队列，逐条查看疑点、原始材料和规则依据后做通过或退回决定。':'查看本机构或下辖机构的申报状态，对退回材料补充说明，再由区县提交。',evidence:`省级审核权限 · 本地演示 ${state.submissions.length} 条新申报`,stats:[['待省级处理','39 家'],['AI疑点','12 家'],['本次新申报',state.submissions.length+' 条'],['审批口径','演示流程']]}
  ]}
function renderClinicIntelligence(){if(state.page!=='clinic'||state.clinicTab!=='overview')return;let tab=document.querySelector('[data-clinic-tab="report"]');if(tab)tab.textContent=({province:'省级审核',city:'申报进度',county:'建设上报',consortium:'申报进度',clinic:'建设草稿'})[state.role];let blocks=document.querySelectorAll('.clinic-grid .panel'),capacity=blocks[0],review=blocks[1],items=clinicFindings(),s=selected(),built=sum(s,'clinics'),enhanced=clinics.filter(x=>x.clinics&&inSelected(x)&&['强化功能','鼓励探索'].includes(nodeTier(x))).length,explore=clinics.filter(x=>x.clinics&&inSelected(x)&&nodeTier(x)==='鼓励探索').length;
  if(state.role==='province'){let pending=reviewItems().filter(x=>x.status==='待省级审核');items[2].stats[0][1]=pending.length+' 家';items[2].stats[1][1]=pending.filter(x=>x.flags.length).length+' 家'}
  capacity.querySelector('.capacity-steps').innerHTML=[['basic','基本保障',built,'场地、设备、人员、流程'],['enhanced','强化功能',enhanced,'在基础能力上完善医防融合'],['explore','鼓励探索',explore,'拓展多病共管与示教']].map(([tier,name,count,note],i)=>`<div class="capacity-step" data-tier="${tier}" role="button" tabindex="0"><span class="step-no">0${i+1}</span><div><strong>${name}<span class="metric-help" tabindex="0" data-tip="${esc(metricRules[{basic:'基本保障清单达标',enhanced:'强化功能清单完成',explore:'鼓励探索清单开展'}[tier]])}">?</span></strong><small>${note}</small></div><b>${count} 家</b></div>`).join('');
  if(state.role==='clinic'){review.querySelector('h2').textContent='本机构建设认定';let x=currentNode(),tier=nodeTier(x),record=state.submissions.find(y=>y.name===x.name);review.innerHTML=`<div class="panel-head"><h2>本机构建设认定</h2></div><div class="tier-badge">${tier==='未建成'?'尚未认定':tier+' · 建设荣誉标识'}</div><div class="review-row"><span>省级审核结果</span><strong>${record?.status||'演示已通过'}</strong></div>${record?.status==='退回补充'?`<div class="review-flag">退回原因：${esc(record.opinion||'建设佐证材料不完整')}</div>`:''}<div class="actions"><button class="primary" data-clinic-tab="report">查看建设材料</button></div>`}
  else if(state.role==='province'){review.querySelector('h2').textContent='省级建设审核';review.innerHTML=`<div class="panel-head"><h2>省级建设审核</h2><small>AI 疑点辅助 · 人工裁定</small></div><div class="review-row"><span>待审核</span><strong>39 家</strong></div><div class="review-row"><span>AI 标注疑点</span><strong>12 家</strong></div><div class="review-flag">12 家存在机构代码、建设清单或开诊记录不一致，需逐条查看证据。</div><div class="actions"><button class="primary" data-review="province">进入审核队列</button></div>`}
  if(state.role==='province'){let pending=reviewItems().filter(x=>x.status==='待省级审核'),flagged=pending.filter(x=>x.flags.length).length,rows=review.querySelectorAll('.review-row strong');if(rows[0])rows[0].textContent=pending.length+' 家';if(rows[1])rows[1].textContent=flagged+' 家';let flag=review.querySelector('.review-flag');if(flag)flag.textContent=`${flagged} 家存在机构代码、建设清单或开诊记录不一致，需逐条查看证据。`}
  else if(state.role!=='clinic'){review.querySelector('h2').textContent='建设申报进度';review.innerHTML=`<div class="panel-head"><h2>建设申报进度</h2></div><div class="review-row"><span>本辖区新申报</span><strong>${state.submissions.length} 家</strong></div><div class="review-row"><span>省级退回</span><strong>${state.submissions.filter(x=>x.status==='退回补充').length} 家</strong></div><div class="actions"><button class="primary" data-clinic-tab="report">查看申报记录</button></div>`}
  let analysis=document.querySelector('.clinic-grid + .ai-panel');if(analysis){analysis.querySelector('h2').textContent=`${regionLabel()}建设智能分析`;analysis.querySelector('.ai-summary').outerHTML=`<div class="insight-context"><span>建设申报 × 门诊运行记录</span><b>✦ 分层比较 · 建设进度 · 启用质量</b></div>`;analysis.querySelector('.ai-insights').outerHTML=`<div class="insight-grid">${items.map((x,i)=>insightMarkup(String(i+1).padStart(2,'0'),x.title,x.signal,x.finding,x.action,x.evidence,String(i),'clinic')).join('')}</div>`}
}
function inSelected(x){let me=currentNode();if(!me)return true;return state.city.startsWith('city:')?x.cityName===me.name:state.city.startsWith('county:')?x.adcode===me.adcode:state.city.startsWith('consortium:')?x.consortiumName===me.name:x.name===me.name}
function analysisDrawer(group,index,focus){let findings=group==='clinic'?clinicFindings():populationFindings().items,item=findings[index],scope=focus||regionLabel();if(!item)return;drawer(`${scope} · ${item.title}`,`<div class="detail">${esc(periodText())} · ${esc(scope)} · 演示规则分析</div><div class="drawer-section"><h3>分析结果</h3><p>${item.finding}</p></div><div class="drawer-section"><h3>建议执行</h3><p>${item.action}</p></div><div class="drawer-section"><h3>判断依据</h3><div class="drawer-evidence">${item.stats.map(([k,v])=>`<div>${esc(k)}<b>${esc(v)}</b></div>`).join('')}</div><p>${item.evidence}</p></div><div class="drawer-section"><h3>后续观察</h3><p>${group==='clinic'?'下一周期比较建设覆盖、有效启用及审核退回变化。':'下一周期比较专档覆盖、高风险服务负荷及有效启用门诊变化。'}</p></div>`)}
function tierDrawer(tier){let labels={basic:'基本保障',enhanced:'强化功能',explore:'鼓励探索'},matches=clinics.filter(x=>inSelected(x)&&x.clinics&&(tier==='basic'||tier==='enhanced'&&['强化功能','鼓励探索'].includes(nodeTier(x))||tier==='explore'&&nodeTier(x)==='鼓励探索'));drawer(`${labels[tier]}机构`, `<div class="detail">${esc(regionLabel())} · 共 ${matches.length} 家。层级为递进能力，强化及探索机构同时具备基础能力。</div><div class="drawer-section"><h3>机构名单</h3><div class="table-wrap"><table><thead><tr><th>机构</th><th>所属区县</th><th>能力层级</th></tr></thead><tbody>${matches.slice(0,50).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.cityName+x.county)}</td><td>${nodeTier(x)}</td></tr>`).join('')}</tbody></table></div>${matches.length>50?'<p>当前展示前 50 家，机构级筛选可进一步查看。</p>':''}</div>`)}
function reviewItems(){if(!state.reviewItems){let built=clinics.filter(x=>x.clinics),step=Math.floor(built.length/39);state.reviewItems=Array.from({length:39},(_,i)=>{let x=built[i*step];return {name:x.name,county:x.cityName+x.county,tier:['basic','enhanced','explore'][i%3],status:'待省级审核',flags:i<12?i%2?['机构代码与机构名录映射不一致']:['建设清单与佐证照片不一致','接口未识别本期有效两慢病服务记录']:[],opinion:''}})}return state.reviewItems}
reviewDrawer=function(stage){if(state.role!=='province'||stage!=='province')return;let items=reviewItems(),pending=items.filter(x=>x.status==='待省级审核'),item=pending[0]||items[0];if(!item){drawer('省级审核队列','<div class="detail">暂无待审核记录</div>');return}drawer('省级建设审核',`<div class="detail">待审核 ${pending.length} 家 · AI 标注 ${pending.filter(x=>x.flags.length).length} 家 · 审核结论由省级人员确认</div><div class="drawer-section"><h3>${esc(item.name)}</h3><p>申报区县：${esc(item.county)}　申报能力：${{basic:'基本保障',enhanced:'强化功能',explore:'鼓励探索'}[item.tier]}</p></div><div class="drawer-section"><h3>AI 辅助审核</h3>${item.flags.length?item.flags.map(flag=>`<div class="review-flag">疑点：${esc(flag)}<br>请对照申报材料、机构主数据及接口记录复核。</div>`).join(''):'<div class="review-flag ok">暂未发现清单和接口的规则冲突，仍需人工确认材料。</div>'}</div><div class="drawer-section"><h3>审核意见</h3><textarea id="reviewOpinion" rows="3" style="width:100%" placeholder="填写审核依据及通过或退回原因"></textarea><div class="review-action"><button class="primary" data-review-result="pass">审核通过</button><button class="outline" data-review-result="return">退回补充</button></div><div id="reviewResult" class="result" aria-live="polite"></div></div><div class="drawer-section"><h3>待审核机构</h3>${pending.slice(0,10).map(x=>`<div class="review-row"><span>${esc(x.name)}</span><b>${x.flags.length?'AI 疑点':'常规审核'}</b><button class="link" data-review-item="${esc(x.name)}">查看</button></div>`).join('')}</div>`);document.querySelectorAll('[data-review-result]').forEach(button=>button.onclick=()=>{let opinion=$('reviewOpinion').value.trim();if(!opinion){$('reviewResult').className='result show bad';$('reviewResult').textContent='请填写审核意见';return}item.status=button.dataset.reviewResult==='pass'?'审核通过':'退回补充';item.opinion=opinion;reviewDrawer('province');render()});document.querySelectorAll('[data-review-item]').forEach(button=>button.onclick=()=>{let x=items.find(y=>y.name===button.dataset.reviewItem);if(x){items.splice(items.indexOf(x),1);items.unshift(x);reviewDrawer('province')}})};
function refinedScopeExplorer(kind){let me=currentNode(),roots=childUnits(),size=state.pageSizes?.[kind]||10,headers={population:['机构名称','确诊人数','专档纳管患者数','两者差额','专档覆盖率'],clinic:['机构名称','应建设','已建成','建设覆盖率','有效启用','能力分层'],service:['机构名称','路径入径率','核心监测完成率','异常复查完成率','数据状态'],outcome:['机构名称','血压检测覆盖率','血压控制率','血压改善率','血糖控制率','血糖改善率'],governance:['机构名称','建设覆盖率','有效启用率','路径入径率','数据状态']}[kind],rows=[];for(let x of roots){rows.push([x,0]);if(!state.expanded.includes(nodeKey(x)))for(let child of nodeChildren(x))rows.push([child,1])}let page=Math.min(state.listPages?.[kind]||1,Math.max(1,Math.ceil(rows.length/size))),slice=rows.slice((page-1)*size,page*size),value=(x)=>{let p=populationFor(x),v=n=>x.quality==='已复核'?n+'%':'待核验';return kind==='population'?[people(p.diagnosed),people(p.managed),people(p.diagnosed-p.managed),formatPct(popCoverage(x))]:kind==='clinic'?[x.should+' 家',x.clinics+' 家',rate(x.clinics,x.should)+'%',x.active+' 家',(()=>{let t=tierCounts(x);return `<span class="tier-counts">仅基础 <b>${t.basic}</b> · 强化 <b>${t.enhanced}</b> · 探索 <b>${t.explore}</b></span>`})()]:kind==='service'?[v(x.entry),v(x.follow-5),v(x.follow-17),x.quality]:kind==='outcome'?[v(x.follow-6),v(x.control),v(x.control-11),v(x.control-6),v(x.control-16)]:[rate(x.clinics,x.should)+'%',v(rate(x.active,x.clinics)),v(x.entry),x.quality]};let content=slice.map(([x,depth])=>{let children=depth===0?nodeChildren(x):[],key=nodeKey(x),name=fullName(x),cells=value(x);return `<tr data-depth="${depth}"><td style="padding-left:${11+depth*16}px" class="tree-name">${children.length?`<button type="button" class="tree-toggle" data-expand="${esc(key)}" aria-label="展开或收起${esc(name)}">${state.expanded.includes(key)?'▸':'▾'}</button>`:''}${esc(name)}</td>${cells.map((cell,i)=>`<td>${kind==='clinic'&&i===5?cell:esc(cell)}</td>`).join('')}<td><button class="link" data-region="${esc(x.name)}">查看详情</button></td></tr>`}).join('');let label=state.role==='province'?'各市、区':state.role==='city'?'各区县':state.role==='county'?'各医共体及基层机构':state.role==='consortium'?'各基层机构':'本机构',suffix=kind==='population'?'人群情况':kind==='clinic'?'一体化门诊建设情况':'情况',pages=Math.max(1,Math.ceil(rows.length/size));return `<section class="panel"><div class="scope-toolbar"><h2>${label}${suffix}</h2></div><div class="table-wrap scope-table"><table><thead><tr>${[...headers,'操作'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${content}</tbody></table></div><div class="list-pagination"><span>共 ${rows.length} 条 · 每页 ${size} 条</span><button data-list-page="${page-1}" data-list-kind="${kind}" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${pages}</strong><button data-list-page="${page+1}" data-list-kind="${kind}" ${page===pages?'disabled':''}>下一页</button></div></section>`}
scopeExplorer=refinedScopeExplorer;
const renderBeforeRefinement=render;
render=function(){renderBeforeRefinement();renderPopulationIntelligence();renderClinicIntelligence();renderReportPermissions();renderReviewPager();bind();$('rolePicker').value=state.role};
function renderReviewPager(){if(state.page!=='clinic'||state.clinicTab!=='report'||state.role!=='province')return;let table=$('view').querySelector('.scope-table table'),panel=table?.closest('.panel');if(!table||!panel)return;let queue=reviewItems(),pages=Math.ceil(queue.length/10),page=Math.min(state.reviewPage||1,pages);table.querySelector('tbody').innerHTML=queue.slice((page-1)*10,page*10).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.county)}</td><td>${{basic:'基本保障',enhanced:'强化功能',explore:'鼓励探索'}[x.tier]}</td><td>${x.flags.length?'需复核 '+x.flags.length+' 项':'暂未标注'}</td><td>${esc(x.status)}</td></tr>`).join('');panel.insertAdjacentHTML('beforeend',`<div class="list-pagination"><span>共 ${queue.length} 条 · 每页 10 条</span><button data-review-page="${page-1}" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${pages}</strong><button data-review-page="${page+1}" ${page===pages?'disabled':''}>下一页</button></div>`)}
function renderReportPermissions(){if(state.page!=='clinic'||state.clinicTab!=='report')return;let view=$('view'),tabButton=view.querySelector('[data-clinic-tab="report"]');if(tabButton)tabButton.textContent=({province:'省级审核',city:'申报进度',county:'建设上报',consortium:'申报进度',clinic:'建设草稿'})[state.role];let tab=view.querySelector('.clinic-tabs')?.outerHTML||'',items=state.submissions.filter(item=>state.role==='province'||state.role==='city'&&item.county.startsWith('杭州市')||state.role==='consortium'&&item.county.includes('余杭区'));if(state.role==='province'){let queue=reviewItems(),pending=queue.filter(x=>x.status==='待省级审核'),flagged=pending.filter(x=>x.flags.length);view.innerHTML=tab+panel('省级建设审核',`<div class="drawer-evidence"><div>待省级审核<b>${pending.length} 家</b></div><div>AI 标注疑点<b>${flagged.length} 家</b></div></div><div class="actions"><button class="primary" data-review="province">查看疑点并审核</button></div>`)+panel('审核机构',`<div class="table-wrap scope-table"><table><thead><tr><th>机构名称</th><th>区县</th><th>申报层级</th><th>AI 疑点</th><th>状态</th></tr></thead><tbody>${queue.slice(0,10).map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.county)}</td><td>${{basic:'基本保障',enhanced:'强化功能',explore:'鼓励探索'}[x.tier]}</td><td>${x.flags.length?'需复核 '+x.flags.length+' 项':'暂未标注'}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table></div>`);return}if(['city','consortium'].includes(state.role)){view.innerHTML=tab+panel('建设申报进度',`<div class="detail">本级可查看下辖建设材料和省级审核结论。基层机构准备材料，区县统一提交。</div><div class="table-wrap"><table><thead><tr><th>区县</th><th>机构</th><th>申报层级</th><th>省级结论</th></tr></thead><tbody>${items.map(x=>`<tr><td>${esc(x.county)}</td><td>${esc(x.name)}</td><td>${esc(x.tier)}</td><td>${esc(x.status)}</td></tr>`).join('')||'<tr><td colspan="4">暂无本次演示申报</td></tr>'}</tbody></table></div>`);return}let panels=[...view.querySelectorAll(':scope > .panel')];if(state.role==='county'){panels.filter(p=>p.querySelector('h2')?.textContent==='建设审核情况').forEach(p=>p.remove())}if(state.role==='clinic'){panels.filter(p=>p.querySelector('h2')?.textContent==='建设审核情况').forEach(p=>p.remove());let result=state.submissions.find(x=>x.name===currentNode()?.name);if(result)view.insertAdjacentHTML('beforeend',panel('省级审核结论',`<div class="tier-badge">${result.status==='审核通过'?result.tier:'待认定'}</div>${result.status==='退回补充'?`<p>退回原因：${esc(result.opinion||'需补充佐证')}</p>`:''}`))}}
function resetListPages(){state.listPages={};state.expanded=[]}
const priorOrgClick=$('orgPanel').onclick;
$('orgPanel').onclick=event=>{let target=event.target.closest('[data-org]');if(target?.disabled)return;resetListPages();priorOrgClick(event)};
const priorRoleChange=$('rolePicker').onchange;
let consortiumOption=document.createElement('option');consortiumOption.value='consortium';consortiumOption.textContent='医共体管理员';$('rolePicker').insertBefore(consortiumOption,$('rolePicker').querySelector('[value="clinic"]'));
$('rolePicker').onchange=event=>{if(event.target.value!=='consortium'){resetListPages();priorRoleChange(event);return}let unit=consortia.find(x=>x.cityName==='杭州市'&&x.county==='余杭区');state.role='consortium';state.city=nodeKey(unit);orgBrowseCity='杭州市';orgBrowseCounty='余杭区';orgBrowseConsortium=unit.name;resetListPages();closeDrawer();render()};
document.addEventListener('click',event=>{let pager=event.target.closest('[data-list-page]'),reviewPage=event.target.closest('[data-review-page]'),insight=event.target.closest('[data-insight-group]'),tier=event.target.closest('[data-tier]');if(pager&&!pager.disabled){state.listPages ||= {};state.listPages[pager.dataset.listKind]=Number(pager.dataset.listPage);render()}if(reviewPage&&!reviewPage.disabled){state.reviewPage=Number(reviewPage.dataset.reviewPage);render()}if(insight)analysisDrawer(insight.dataset.insightGroup,Number(insight.dataset.insightType));if(tier&&!event.target.closest('.metric-help'))tierDrawer(tier.dataset.tier)});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-tier]')){event.preventDefault();tierDrawer(event.target.dataset.tier)}});
const previousRegionDetail=regionDetail;
regionDetail=function(name){if(!['population','clinic'].includes(state.page)){previousRegionDetail(name);return}let x=[...clinics,...consortia,...counties,...cities].find(y=>y.name===name);if(!x)return;let group=state.page==='clinic'?'clinic':'population',title=fullName(x),p=populationFor(x),local=group==='clinic'?clinicFindings():populationFindings().items,relevant=group==='clinic'?`建设覆盖 ${rate(x.clinics,x.should)}%，有效启用 ${rate(x.active,x.clinics)}%；${x.should-x.clinics} 家未建，${x.clinics-x.active} 家建而未用。`:`确诊 ${people(p.diagnosed)}，专档纳管 ${people(p.managed)}，覆盖 ${formatPct(popCoverage(x))}；高血压高风险 ${people(p.managedHigh*.25)}，糖尿病高风险 ${people(p.managedDiabetes*.31)}。`,action=group==='clinic'?'针对建设缺口制定计划，对已建门诊跟踪有效开诊；需要审核的材料送省级。':'结合专档覆盖、风险分层与有效启用门诊，调整本机构或下辖机构的服务投入。';drawer(`${title} · 智能分析`, `<div class="detail">${esc(periodText())} · ${esc(title)} · 演示规则分析</div><div class="drawer-section"><h3>分析结果</h3><p>${relevant}</p><p>${group==='clinic'?local[0].finding:local[0].finding}</p></div><div class="drawer-section"><h3>建议执行</h3><p>${action}</p></div><div class="drawer-section"><h3>判断依据</h3><div class="drawer-evidence">${(group==='clinic'?[['应建设',x.should+' 家'],['已建成',x.clinics+' 家'],['有效启用',x.active+' 家'],['能力分层',JSON.stringify(tierCounts(x))]]:[['确诊人数',people(p.diagnosed)],['专档纳管',people(p.managed)],['专档覆盖率',formatPct(popCoverage(x))],['有效启用门诊',x.active+' 家']]).map(([label,val])=>`<div>${esc(label)}<b>${esc(val)}</b></div>`).join('')}</div></div><div class="actions"><button class="primary" id="focusUnit">筛选到此机构</button></div>`);$('focusUnit').onclick=()=>{state.city=nodeKey(x);resetListPages();closeDrawer();render()}};
// Population indicators use disjoint people counts. Visits are encounters, not people.
function highRiskPeople(p){return p.managedHigh*.25+p.managedDiabetes*.31-p.managedOverlap*.25}
const riskProfileCache=new WeakMap();
function riskProfileFor(x){if(riskProfileCache.has(x))return riskProfileCache.get(x);let result;if(x.clinicIndex){let p=populationFor(x),factor=1+((Number(x.adcode)%9)-4)*.035+((x.clinicIndex%5)-2)*.012,high=highRiskPeople(p)*factor,middle=(p.managedHigh*.4+p.managedDiabetes*.42-p.managedOverlap*.4)*Math.max(.88,2-factor);result={high,middle,low:Math.max(0,p.managed-high-middle)}}else{let leaves=clinics.filter(c=>x.consortiumName?c.consortiumName===x.name:x.cityName?c.adcode===x.adcode:c.cityName===x.name);result=leaves.reduce((a,c)=>{let r=riskProfileFor(c);a.high+=r.high;a.middle+=r.middle;a.low+=r.low;return a},{high:0,middle:0,low:0})}riskProfileCache.set(x,result);return result}
function selectedRiskProfile(){return (state.city==='all'?cities:selected()).reduce((a,x)=>{let r=riskProfileFor(x);a.high+=r.high;a.middle+=r.middle;a.low+=r.low;return a},{high:0,middle:0,low:0})}
function visitsFor(x){
  if(!x.clinicIndex){let leaves=clinics.filter(c=>x.consortiumName?c.consortiumName===x.name:x.cityName?c.adcode===x.adcode:c.cityName===x.name);if(leaves.length)return leaves.reduce((a,c)=>{let v=visitsFor(c);a.primary+=v.primary;a.hospital+=v.hospital;return a},{primary:0,hospital:0})}
  let p=populationFor(x),total=p.diagnosed*(2.2+(x.clinicIndex||1)%5*.08),primaryShare=Math.max(.35,Math.min(.72,.48+(p.managed/p.diagnosed-.55)*.24+(x.entry-65)*.002));return {primary:total*primaryShare,hospital:total*(1-primaryShare)}
}
function visitsForSelection(){return (state.city==='all'?cities:selected()).reduce((a,x)=>{let v=visitsFor(x);a.primary+=v.primary;a.hospital+=v.hospital;return a},{primary:0,hospital:0})}
function primaryShare(x){let v=visitsFor(x);return v.primary/(v.primary+v.hospital)*100}
const populationScopeBeforeVisits=scopeExplorer;
scopeExplorer=function(kind){let html=populationScopeBeforeVisits(kind);if(kind!=='population')return html;let section=document.createElement('div');section.innerHTML=html;let table=section.querySelector('table'),head=table.querySelector('thead tr');['高风险患者数','中风险患者数','低风险患者数'].forEach(label=>{let th=document.createElement('th');th.textContent=label;head.insertBefore(th,head.lastElementChild)});table.querySelectorAll('tbody tr').forEach(tr=>{let name=tr.querySelector('[data-region]')?.dataset.region,x=[...clinics,...consortia,...counties,...cities].find(y=>y.name===name);if(!x)return;let profile=riskProfileFor(x);[profile.high,profile.middle,profile.low].forEach(n=>{let td=document.createElement('td');td.textContent=people(n);tr.insertBefore(td,tr.lastElementChild)})});return section.innerHTML};
const populationIntelligenceBeforeLayout=renderPopulationIntelligence;
renderPopulationIntelligence=function(){populationIntelligenceBeforeLayout();let page=document.querySelector('.population-page');if(!page)return;let hero=page.querySelector('.population-hero'),grid=page.querySelector('.population-grid'),risk=grid?.querySelector('.panel:last-child'),tier=hero?.querySelector('.panel:last-child'),age=grid?.querySelector('.panel:first-child');if(!risk||!tier||!age)return;
  hero.appendChild(risk);grid.appendChild(tier);hero.querySelector('.panel:first-child h2').textContent='确诊人群';hero.querySelector('.panel:nth-child(2) h2').textContent='专档纳管';risk.querySelector('h2').textContent='高危人群';age.querySelector('h2').textContent='纳管人群年龄、性别与病种分布';
  let p=populationData(),overlap=Math.min(p.riskHigh,p.riskDiabetes)*.28,total=p.riskHigh+p.riskDiabetes-overlap,segments=[['仅高血压高危',p.riskHigh-overlap,'#3489df'],['仅糖尿病高危',p.riskDiabetes-overlap,'#29a69b'],['两病同时高危',overlap,'#f2ad57']];risk.querySelector('.resource-bars').outerHTML=`<div class="high-risk-total"><small>高危人群数</small><strong>${people(total)}</strong></div><div class="stackbar">${segments.map(([,n,color])=>`<span style="width:${n/total*100}%;background:${color}"></span>`).join('')}</div><div class="high-risk-split">${segments.map(([label,n,color])=>`<div><i style="background:${color}"></i><span>${label}</span><b>${people(n)} · ${formatPct(n/total*100)}</b></div>`).join('')}</div>`;risk.querySelector('.risk-overview')?.remove();
  let profile=selectedRiskProfile();tier.querySelectorAll('.risk-tier').forEach((row,i)=>{let count=[profile.high,profile.middle,profile.low][i],strong=row.querySelector('strong');strong.insertAdjacentHTML('beforeend',`<b class="risk-tier-count">${people(count)} · ${formatPct(count/p.managed*100)}</b>`)});
  let chart=age.querySelector('.population-chart'),chartTotal=chart?.querySelector('.population-chart-total');if(chart&&chartTotal){chartTotal.innerHTML=`<span>男 <b>${people(p.managed*.48)} · 48.0%</b></span><span>女性 <b>${people(p.managed*.52)} · 52.0%</b></span>`;let groups=[p.managedHigh-p.managedOverlap,p.managedDiabetes-p.managedOverlap,p.managedOverlap],shares=[.025,.095,.25,.28,.22,.11,.02],colors=['#3489df','#18a79b','#f1a64c'];chart.querySelectorAll('.population-chart-row').forEach(row=>row.remove());chart.querySelector('.population-chart-head').insertAdjacentHTML('afterend',shares.map((share,i)=>{let names=['84岁以上','75–84岁','65–74岁','55–64岁','45–54岁','35–44岁','35岁以下'],bars=ratio=>groups.map((g,j)=>`<i style="width:${g*share*ratio/(p.managed*.22)*100}%;background:${colors[j]}"></i>`).join('');return `<div class="population-chart-row"><div class="pop-sex-bar male">${bars(.48)}</div><span class="age-label">${names[i]}</span><div class="pop-sex-bar female">${bars(.52)}</div></div>`}).join(''))}
  let v=visitsForSelection(),sumVisits=v.primary+v.hospital,visitPanel=document.createElement('section');visitPanel.className='panel visit-panel';visitPanel.innerHTML=`<div class="panel-head"><h2>就诊流向</h2></div><div class="visit-flow"><div><small>基层就诊人次</small><strong>${people(v.primary)}</strong><span>基层就诊率 ${formatPct(v.primary/sumVisits*100)}</span></div><div><small>等级医院就诊人次</small><strong>${people(v.hospital)}</strong><span>等级医院就诊率 ${formatPct(v.hospital/sumVisits*100)}</span></div></div><div class="visit-bar"><i style="width:${v.primary/sumVisits*100}%"></i></div>`;grid.after(visitPanel);[risk.querySelector('.high-risk-total small'),...risk.querySelectorAll('.high-risk-split span'),...visitPanel.querySelectorAll('small')].filter(Boolean).forEach(label=>{let rule=metricRules[label.textContent.trim()];if(!rule)return;let icon=document.createElement('span');icon.className='metric-help';icon.textContent='?';icon.dataset.tip=rule;icon.tabIndex=0;icon.onmouseenter=()=>showMetricTooltip(icon);icon.onmouseleave=()=>hideMetricTooltip(icon);icon.onfocus=()=>showMetricTooltip(icon);icon.onblur=()=>hideMetricTooltip(icon);label.appendChild(icon)})
};

populationFindings=function(){
  let scopeLevel=state.city==='all'?'province':state.city.split(':')[0],units=comparisonUnits(),p=populationData(),province=populationDataFor(cities),provinceCover=province.managed/province.diagnosed*100,provinceRisk=cities.reduce((n,x)=>n+riskProfileFor(x).high,0)/province.managed*100,provinceVisits=cities.reduce((a,x)=>{let v=visitsFor(x);a.primary+=v.primary;a.hospital+=v.hospital;return a},{primary:0,hospital:0}),provincePrimary=provinceVisits.primary/(provinceVisits.primary+provinceVisits.hospital)*100,leaf=scopeLevel==='clinic',reference=leaf?counties.find(x=>x.adcode===currentNode().adcode):null,coverBase=reference?popCoverage(reference):provinceCover,riskBase=reference?riskProfileFor(reference).high/populationFor(reference).managed*100:provinceRisk,visitBase=reference?primaryShare(reference):provincePrimary,baseName=reference?'所属区县':'全省';
  let coverRows=units.filter(x=>popCoverage(x)<coverBase).sort((a,b)=>(coverBase-popCoverage(b))*populationFor(b).diagnosed-(coverBase-popCoverage(a))*populationFor(a).diagnosed),riskRows=units.filter(x=>riskProfileFor(x).high/populationFor(x).managed*100>riskBase).sort((a,b)=>riskProfileFor(b).high/populationFor(b).managed-riskProfileFor(a).high/populationFor(a).managed),visitRows=units.filter(x=>primaryShare(x)<visitBase).sort((a,b)=>primaryShare(a)-primaryShare(b));
  let kind=({province:'区县',city:'区县',county:'基层机构',consortium:'成员机构',clinic:'本机构'})[scopeLevel],scope=({province:'全省',city:'全市',county:'本区县',consortium:'本医共体',clinic:'本机构'})[scopeLevel],who=leaf?'本机构':`${units.length} 个${kind}`,actions=({province:['请相关市针对确诊人数多、专档覆盖偏低的区县制定提升计划，省级按季度跟踪覆盖变化。','将高风险占比偏高的区县纳入重点指导，比较其风险分层和后续血压、血糖控制结果。','会同相关市分析基层与等级医院的就诊流向，优先支持基层就诊占比偏低且患者规模大的区县。'],city:['与相关区县明确专档服务目标和团队支持计划。','组织医共体复盘高风险患者的随访、控制和转诊情况。','协调区县优化基层接诊时段及医共体转诊衔接。'],county:['要求相关医共体和基层机构调整专档服务安排。','安排医共体对高风险占比偏高的基层机构开展病例讨论和技术支持。','调整基层慢病门诊接诊时段，跟踪本区县患者就诊流向。'],consortium:['对成员机构分配专档服务支持和培训。','向高风险占比偏高的成员机构下沉专科力量。','优化成员机构接诊能力及双向转诊安排。'],clinic:['按病种梳理本机构确诊与专档服务量，调整团队排班。','复盘本机构高风险患者控制情况，安排强化随访和必要转诊。','结合本机构就诊流向调整接诊时段和服务方式。']})[scopeLevel];
  let make=(title,rows,base,metric,action,detail,comparison)=>({title,signal:`${rows.length} / ${units.length} 个${kind}`,finding:rows.length?`${who}中有 ${rows.length} 个专档覆盖或服务结构异常；${fullName(rows[0])}${detail(rows[0])}，${baseName}${comparison} ${formatPct(base)}。`:`${who}均未触发低于或高于${baseName}${comparison}的比较条件。`,action,rows:rows.map(x=>[fullName(x),metric(x)]),evidence:'按当前统计周期、当前机构及下辖单位的接口数据比较。',stats:[]});
  let coverage=make(`${scope}专档覆盖差异`,coverRows,coverBase,x=>`确诊 ${people(populationFor(x).diagnosed)} · 专档 ${people(populationFor(x).managed)} · 覆盖 ${formatPct(popCoverage(x))}`,actions[0],x=>`确诊 ${people(populationFor(x).diagnosed)}，专档覆盖 ${formatPct(popCoverage(x))}`, '专档覆盖率');coverage.finding=coverRows.length?`${units.length} 个${kind}中，${coverRows.length} 个专档覆盖率低于${baseName} ${formatPct(coverBase)}；${fullName(coverRows[0])}的确诊人数为 ${people(populationFor(coverRows[0]).diagnosed)}、覆盖率为 ${formatPct(popCoverage(coverRows[0]))}。`:`${units.length} 个${kind}的专档覆盖率均不低于${baseName} ${formatPct(coverBase)}。`;
  let risk=make(`${scope}高风险占比差异`,riskRows,riskBase,x=>`高风险 ${people(riskProfileFor(x).high)} · 纳管 ${people(populationFor(x).managed)} · 占比 ${formatPct(riskProfileFor(x).high/populationFor(x).managed*100)}`,actions[1],x=>`高风险患者占纳管患者 ${formatPct(riskProfileFor(x).high/populationFor(x).managed*100)}`,'高风险患者占比');risk.finding=riskRows.length?`${units.length} 个${kind}中，${riskRows.length} 个高风险患者占比高于${baseName} ${formatPct(riskBase)}；${fullName(riskRows[0])}为 ${formatPct(riskProfileFor(riskRows[0]).high/populationFor(riskRows[0]).managed*100)}。需结合后续健康成效判断是人群结构差异，还是管理效果需要改进。`:`${units.length} 个${kind}的高风险患者占比均未高于${baseName} ${formatPct(riskBase)}。`;
  let visits=make(`${scope}基层就诊流向`,visitRows,visitBase,x=>{let v=visitsFor(x);return `基层 ${people(v.primary)} · 等级医院 ${people(v.hospital)} · 基层占比 ${formatPct(primaryShare(x))}`},actions[2],x=>`基层就诊率 ${formatPct(primaryShare(x))}`,'基层就诊率');visits.finding=visitRows.length?`${units.length} 个${kind}中，${visitRows.length} 个基层就诊率低于${baseName} ${formatPct(visitBase)}；${fullName(visitRows[0])}为 ${formatPct(primaryShare(visitRows[0]))}。需要结合病情严重程度和转诊记录判断原因。`:`${units.length} 个${kind}的基层就诊率均未低于${baseName} ${formatPct(visitBase)}。`;
  return {items:[coverage,risk,visits],units,baseline:coverBase}
};

const clinicAnalysisDrawer=analysisDrawer;
analysisDrawer=function(group,index,focus){if(group==='clinic')return clinicAnalysisDrawer(group,index,focus);let item=populationFindings().items[index],scope=focus||regionLabel();if(!item)return;drawer(`${scope} · ${item.title}`,`<div class="detail">${esc(periodText())} · ${esc(scope)} · 演示规则分析</div><div class="drawer-section"><h3>分析结果</h3><p>${esc(item.finding)}</p></div><div class="drawer-section"><h3>建议执行</h3><p>${esc(item.action)}</p></div><div class="drawer-section"><h3>问题机构与相关数据</h3>${item.rows.length?`<div class="issue-list">${item.rows.map(([label,value])=>`<div><strong>${esc(label)}</strong><span>${esc(value)}</span></div>`).join('')}</div>`:'<p>当前范围没有触发该项比较条件的下级机构。</p>'}</div>`)};

const renderWithPopulationChanges=render;
Object.assign(metricRules,{'高危人群数':'统计期内尚未确诊、符合高血压或糖尿病高危筛查条件的居民，按居民身份跨病种只计一次。当前重叠比例为模拟假设。','仅高血压高危':'高血压高危且非糖尿病高危的居民数。','仅糖尿病高危':'糖尿病高危且非高血压高危的居民数。','两病同时高危':'同时符合高血压与糖尿病高危条件的居民数。','基层就诊人次':'统计期内两慢病患者在基层医疗卫生机构的就诊诊次；一人多次就诊重复计入。','等级医院就诊人次':'统计期内两慢病患者在等级医院的就诊诊次；一人多次就诊重复计入。','高风险患者数':'有效专档在管患者中被分为高风险的人数；两病同患按居民身份只计一次。','中风险患者数':'有效专档在管患者中被分为中风险的人数；与高、低风险互斥。','低风险患者数':'有效专档在管患者中被分为低风险的人数；与高、中风险互斥。'});
render=function(){renderWithPopulationChanges();let drawerNode=document.querySelector('.drawer');if(drawerNode)drawerNode.scrollTop=0};
// The screen keeps a fixed design grid while fitting the available dashboard area.
const dashboardBeforeCommandCenter=dashboard;
const mapValueBeforeCommandCenter=mapValue;
const provinceValueBeforeCommandCenter=provinceMetricValue;
const mapTooltipBeforeCommandCenter=mapTooltip;
const mapMetricNames={construction:'建设覆盖率',management:'专档覆盖率',entry:'入径率',improvement:'血压改善率',glucose:'血糖改善率',lipid:'血脂改善率',hba1c:'糖化改善率'};
function dashboardRate(node,kind){
  if(kind==='construction')return node?rate(node.clinics,node.should):rate(sum(cities,'clinics'),sum(cities,'should'));
  if(kind==='management'){const p=node?populationFor(node):populationData();return p.diagnosed?p.managed/p.diagnosed*100:0}
  const rows=node?[node]:cities,average=key=>rows.reduce((total,x)=>total+x[key],0)/rows.length;
  if(kind==='entry')return average('entry');
  const base=average('control');
  return base-({improvement:11,glucose:16,lipid:20,hba1c:19}[kind]||0);
}
mapValue=function(node){return mapMetricNames[state.mapMetric]?Math.round(dashboardRate(node,state.mapMetric)*10)/10:mapValueBeforeCommandCenter(node)};
provinceMetricValue=function(){return mapMetricNames[state.mapMetric]?Math.round(dashboardRate(null,state.mapMetric)*10)/10:provinceValueBeforeCommandCenter()};
mapTooltip=function(node){const p=populationFor(node),name=mapMetricNames[state.mapMetric];return name?`<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>${name}</span><b>${formatPct(dashboardRate(node,state.mapMetric))}</b></div><div><span>确诊人数</span><b>${people(p.diagnosed)}</b></div><div><span>专档纳管</span><b>${people(p.managed)}</b></div><div><span>有效启用机构</span><b>${node.active} 家</b></div></div>`:mapTooltipBeforeCommandCenter(node)};
dashboard=function(){
  const p=populationData(),node=currentNode(),metrics=clinicMetrics(node),risk=node?riskProfileFor(node):selectedRiskProfile(),units=comparisonUnits(),base=node||cities[0],mapRoot=document.createElement('div');
  mapRoot.innerHTML=dashboardBeforeCommandCenter();const map=mapRoot.querySelector('.map-panel');
  map.querySelector('.map-metrics').innerHTML=Object.entries(mapMetricNames).map(([key,label])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}">${label}</button>`).join('');
  const resident=node?p.diagnosed*(9.6+(Number(node.adcode||330000)%7)*.17):6700;
  const cards=[['两慢确诊人数',people(p.diagnosed),`占常住人口 ${formatPct(p.diagnosed/resident*100)}`],['两慢专档患者数',people(p.managed),`占确诊人数 ${formatPct(p.managed/p.diagnosed*100)}`],['高风险患者数',people(risk.high),`占专档患者 ${formatPct(risk.high/p.managed*100)}`],['应建设机构总数',`${metrics.eligible} 家`,'适用机构名册'],['已核验建成数',`${metrics.built} 家`,`建设覆盖率 ${formatPct(metrics.built/metrics.eligible*100)}`],['有效启用机构数',`${metrics.active} 家`,`占已建成 ${formatPct(metrics.active/metrics.built*100)}`]];
  const stages=[['入径率',dashboardRate(node,'entry')],['诊前采集率',base.follow+2],['诊中执行率',base.follow-2],['诊后追踪率',base.follow-12]];
  const monitoring=[['血压',base.follow+4],['血糖',base.follow-2],['糖化血红蛋白',base.follow-16],['低密度脂蛋白',base.follow-25]];
  const tiers=node?tierCounts(node):clinics.reduce((result,x)=>{if(x.clinics){const key={基本保障:'basic',强化功能:'enhanced',鼓励探索:'explore'}[nodeTier(x)];if(key)result[key]++}return result},{basic:0,enhanced:0,explore:0});
  const ranking=[...units].sort((a,b)=>b.active-a.active).slice(0,6),top=Math.max(1,...ranking.map(x=>x.active));
  const card=(title,body)=>`<section class="board-panel"><h2>${title}</h2>${body}</section>`;
  return `<div class="dashboard-viewport" id="dashboardViewport"><div class="dashboard-board" id="dashboardBoard"><div class="board-title"><div><small>浙江省慢病一体化管理监管平台 · 模拟数据</small><h1>${esc(regionLabel())}慢病管理</h1></div><button type="button" class="board-fullscreen" id="boardFullscreen" aria-label="全屏查看数据大屏" title="全屏查看">⛶</button></div><div class="board-kpis">${cards.map(([title,value,sub])=>`<div class="board-kpi"><span>${title}</span><strong>${value}</strong><small>${sub}</small></div>`).join('')}</div><div class="board-columns"><div class="board-stack">${card('患者路径化执行情况',`<div class="board-path">${stages.map(([label,value])=>`<div><strong>${formatPct(value)}</strong><span>${label}</span></div>`).join('')}</div>`)}${card('核心项目检测情况',`<table class="board-table"><thead><tr><th>检测项目</th><th>检测率</th><th>漏测率</th></tr></thead><tbody>${monitoring.map(([label,value])=>`<tr><td>${label}</td><td>${formatPct(value)}</td><td>${formatPct(100-value)}</td></tr>`).join('')}</tbody></table>`)}</div><div class="board-map">${map.outerHTML}</div><div class="board-stack">${card('一体化建设能力分层',`<div class="board-tiers"><div>基本保障<strong>${tiers.basic} 家</strong></div><div>强化功能<strong>${tiers.enhanced} 家</strong></div><div>鼓励探索<strong>${tiers.explore} 家</strong></div></div>`)}${card('下级机构门诊服务人次排行',`<div class="board-bars">${ranking.map(x=>{const visits=Math.round(x.active*1210+x.follow*35);return `<div><span>${esc(fullName(x))}</span><i style="width:${Math.max(4,x.active/top*100)}%"></i><b>${visits.toLocaleString()}</b></div>`}).join('')}</div>`)}${card('高风险患者及时处置',`<div class="board-treatment"><strong>${formatPct(Math.max(0,base.follow-17))}</strong><span>高风险到期异常复查完成率</span><p>及时复查约 ${people(risk.high*Math.max(0,base.follow-17)/100)} · 待跟进约 ${people(risk.high*(100-Math.max(0,base.follow-17))/100)}</p></div>`)}</div></div></div></div>`;
};
pages.dashboard=dashboard;
const governanceBeforeRoleFocus=governance;
pages.governance=function(){
  const focus={province:'跨市比较逾期与反复出现的问题，明确市级牵头责任并抽查复核证据。',city:'比较区县整改时效，协调跨区资源和医共体支持，复核问题是否真正消除。',county:'把异常定位到医共体和基层机构，指定负责人、完成时限与复核证据。',consortium:'跟踪成员机构的问题、转诊协同和检测资源缺口，统一复盘后反馈区县。',clinic:'查看本机构及团队待办，逐项完成复查、处置记录与材料补充，由上级复核关闭。'}[scopeLevel()];
  return panel(`${regionLabel()}督办重点`,`<p class="sub">${focus}</p>`)+governanceBeforeRoleFocus();
};
const reviewDetailBeforeApproval=reviewDetail;
reviewDetail=function(item){
  reviewDetailBeforeApproval(item);
  if(item.status==='审核通过'){
    const note=document.createElement('div');note.className='drawer-section';
    note.innerHTML=`<h3>审核记录</h3><div class="review-fields"><div><small>审核通过时间</small><b>${esc(item.reviewedAt||'2026-10-25 14:20（演示）')}</b></div><div><small>审核人签字</small><b>${esc(item.reviewer||'王明（演示签字）')}</b></div></div>`;
    $('drawerBody').appendChild(note);
  }
  document.querySelectorAll('[data-review-result]').forEach(button=>button.addEventListener('click',()=>{if(item.status==='审核通过'){item.reviewedAt=new Date().toLocaleString('zh-CN',{hour12:false});item.reviewer='王明（演示签字）'}},{once:true}));
};
document.addEventListener('click',event=>{const button=event.target.closest('[data-review-status]');if(!button)return;event.stopImmediatePropagation();state.reviewStatus=state.reviewStatus===button.dataset.reviewStatus?'':button.dataset.reviewStatus;state.reviewPage=1;render()},{capture:true});
function fitDashboard(){const viewport=$('dashboardViewport'),board=$('dashboardBoard');if(!viewport||!board)return;const width=viewport.clientWidth;if(!width)return;const scale=width/1920,boardHeight=1080;board.style.height=`${boardHeight}px`;board.style.transform=`scale(${scale})`;viewport.style.height=`${Math.ceil(boardHeight*scale)}px`;const treatment=board.querySelector('.board-treatment');if(treatment){treatment.querySelector('span').textContent='到期异常复查完成率';treatment.querySelector('p').textContent='高风险患者需优先核查到期异常记录与处置时效'}provinceChart?.resize()}
document.addEventListener('click',event=>{if(event.target.closest('#boardFullscreen')){const view=$('view');if(document.fullscreenElement)document.exitFullscreen();else view?.requestFullscreen?.()}});
document.addEventListener('fullscreenchange',fitDashboard);
window.addEventListener('resize',fitDashboard);
const renderBeforeDashboardFit=render;
render=function(){renderBeforeDashboardFit();requestAnimationFrame(fitDashboard)};


// The current presentation keeps first-phase measures separate from research metrics.
const dashboardBeforeReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeReview();
  const board=root.querySelector('#dashboardBoard');
  const ticker=root.querySelector('.board-ticker');
  if(ticker)board.querySelector('.board-title').append(ticker);
  return root.innerHTML;
};
pages.dashboard=dashboard;

service=function(){
  const node=currentNode(),units=node?[node]:cities;
  const average=(field,offset=0)=>Math.round(units.reduce((total,item)=>total+item.should*(item[field]+offset),0)/Math.max(1,sum(units,'should')));
  const entry=average('entry'),follow=average('follow');
  const stages=[['路径入径',entry],['诊前采集',follow+2],['诊中执行',follow-2],['诊后追踪',follow-12]];
  const checks=[['血压',follow+4],['血糖',follow-2],['糖化血红蛋白',follow-16],['低密度脂蛋白',follow-25]];
  return `<div class="process-page"><div class="notice">${esc(regionLabel())} · ${esc(periodText())} · 模拟数据。路径按适用患者统计，节点按应执行服务统计；检测率以各项目应检人群为分母。</div><div class="process-detail-grid"><section class="panel"><div class="panel-head"><h2>路径执行</h2><small>从入径到诊后追踪</small></div><div class="process-stage-bars">${stages.map(([name,value])=>`<div><span>${name}</span><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><strong>${value}%</strong></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><h2>核心项目检测</h2><small>分项目应检口径</small></div><div class="process-stage-bars">${checks.map(([name,value])=>`<div><span>${name}</span><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><strong>${value}%</strong></div>`).join('')}</div></section></div><div class="detail">异常结果处置需核对服务记录；区域汇总口径仍待统一。</div></div>`;
};
pages.service=service;

outcome=function(){
  const node=currentNode(),units=node?[node]:cities;
  const average=(field,offset=0)=>Math.round(units.reduce((total,item)=>total+item.should*(item[field]+offset),0)/Math.max(1,sum(units,'should')));
  const follow=average('follow'),control=average('control');
  const rows=[['血压',follow-6,control,control-11],['血糖',follow-12,control-6,control-16],['糖化血红蛋白',follow-16,control-9,control-19],['低密度脂蛋白',follow-25,control-12,control-20]];
  return `<div class="process-page outcome-page"><div class="notice">${esc(regionLabel())} · ${esc(periodText())} · 模拟数据。控制率仅在有效检测者中计算；改善率仅在有基线及复测的可评价患者中计算。</div><section class="panel"><div class="panel-head"><h2>检测覆盖与健康结果</h2><small>同项目并列比较，不能跨分母相加</small></div><div class="outcome-legend"><span>检测覆盖率</span><span>控制率</span><span>改善率</span></div><div class="outcome-matrix">${rows.map(([name,detected,controlled,improved])=>`<div class="outcome-matrix-row"><strong>${name}</strong>${[detected,controlled,improved].map((value,index)=>`<div class="outcome-metric tone-${index}"><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><span>${value}%</span></div>`).join('')}</div>`).join('')}</div></section><div class="outcome-foot"><div><strong>评价样本</strong><span>改善需有同项目基线与复测记录；当前演示比例不代表全体确诊患者。</span></div><div><strong>跨机构比较</strong><span>先核对检查覆盖、可评价人数与病例结构，再比较控制及改善。</span></div></div></div>`;
};
pages.outcome=outcome;
const meetingServicePage=service,meetingOutcomePage=outcome;

function fitRolePicker(){
  const picker=$('rolePicker');if(!picker)return;
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  context.font=getComputedStyle(picker).font;
  const label=picker.selectedOptions[0]?.textContent||'';
  picker.style.width=`${Math.min(Math.ceil(context.measureText(label).width)+42,Math.max(150,window.innerWidth*.42))}px`;
}
const renderBeforeMeetingEdits=render;
render=function(){
  const existingHeading=document.querySelector('.content>.heading');
  if(existingHeading&&!existingHeading.querySelector('.filters')&&meetingFilters)existingHeading.append(meetingFilters);
  renderBeforeMeetingEdits();
  const heading=document.querySelector('.content>.heading');
  if(state.page==='dashboard'){
    const board=$('dashboardBoard'),filters=heading?.querySelector('.filters');
    if(board&&filters){
      board.querySelector('.board-title').prepend(filters);
      heading.hidden=true;
      const ticker=board.querySelector('.board-ticker'),map=board.querySelector('.board-map');
      if(ticker&&map)map.append(ticker);
      fitDashboard();
    }
  }
  fitRolePicker();
};
window.addEventListener('resize',fitRolePicker);
const meetingFilters=document.querySelector('.content>.heading .filters');
// Keep board controls and chart details usable after each dashboard redraw.
function boardPeriodFactor(){
  const year=state.year==='2025'?.91:1;
  if(state.periodMode==='year')return year;
  if(state.periodMode==='quarter')return year*(.88+Number(state.quarter)*.03);
  return year*(.78+Number(state.month)*.02);
}
const populationForBeforeBoardPeriod=populationFor;
populationFor=function(node){
  const data=populationForBeforeBoardPeriod(node);
  if(state.page!=='dashboard')return data;
  const factor=boardPeriodFactor();
  return Object.fromEntries(Object.entries(data).map(([key,value])=>[key,typeof value==='number'?value*factor:value]));
};
const clinicMetricsBeforeBoardPeriod=clinicMetrics;
clinicMetrics=function(node){
  const data=clinicMetricsBeforeBoardPeriod(node);
  if(state.page!=='dashboard')return data;
  const factor=boardPeriodFactor();
  const built=Math.round(data.built*factor);
  return {...data,built,active:Math.min(built,Math.round(data.active*factor))};
};
const dashboardRateBeforeBoardPeriod=dashboardRate;
dashboardRate=function(node,kind){
  const value=dashboardRateBeforeBoardPeriod(node,kind);
  return state.page==='dashboard'&&Number.isFinite(value)?Math.max(0,Math.min(100,value+(boardPeriodFactor()-1)*18)):value;
};
const outcomeValueBeforeBoardPeriod=outcomeValue;
outcomeValue=function(node,key){
  const value=outcomeValueBeforeBoardPeriod(node,key);
  return state.page==='dashboard'?Math.max(0,Math.min(100,value+(boardPeriodFactor()-1)*15)):value;
};
const visitsForBeforeBoardPeriod=visitsFor;
visitsFor=function(node){
  const data=visitsForBeforeBoardPeriod(node);
  if(state.page!=='dashboard')return data;
  const factor=boardPeriodFactor();
  return {primary:data.primary*factor,hospital:data.hospital*factor*(1.04-factor*.04)};
};
const constructionValueBeforeBoardPeriod=constructionValue;
constructionValue=function(node,metric){
  if(state.page==='dashboard'&&metric==='construction'){
    const data=clinicMetrics(node);
    return data.built/Math.max(1,data.eligible)*100;
  }
  return constructionValueBeforeBoardPeriod(node,metric);
};
document.addEventListener('click',event=>{
  const button=event.target.closest('#dashboardBoard #periodSeg [data-period-mode]');
  if(!button)return;
  state.periodMode=button.dataset.periodMode;
  render();
});
const boardChartTooltip=document.createElement('div');
boardChartTooltip.className='board-chart-tooltip';
boardChartTooltip.setAttribute('role','tooltip');
document.body.append(boardChartTooltip);
function boardTipText(target){
  if(target.closest('strong,small,em,text,.coverage-count,.coverage-name'))return '';
  if(!target.closest('svg rect,svg circle,svg path,svg polyline,.risk-cell,.risk-composition-strip > div,.coverage-bar,.outcome-mini-track,.risk-bar-line,.situation-bars i,.risk-composition-track,.requested-rank-list i,.home-risk-bars i,.home-capacity-bars i,.outcome-rank-chart-row i,.construction-nodes i,.construction-node-bar,.construction-node-list i,.home-case-stack > div,.disease-stack > i,.outcome-slope i,.outcome-source-bar,.construction-rank i,[class*="track"],[class*="bar"] i'))return '';
  const chart=target.closest('svg,.period-trend-layout,.board-panel,.outcome-detail-panel,.outcome-comparison-row,.outcome-new-panel');
  if(!chart)return '';
  const valueNode=target.closest('[data-board-tip]');
  return valueNode?.dataset.boardTip||'';
}
function formatBoardTip(raw){
  if(!raw.includes('｜'))return raw.replace(/；/g,'\n').replace(/，/g,'\n');
  const [period,...groups]=raw.split('｜');
  return `${period.trim()}\n${groups.join('｜').split('；').map(group=>group.trim().replace(/，/g,'\n')).join('\n')}`;
}
document.addEventListener('pointermove',event=>{
  if(!event.target.closest('#dashboardBoard .board-panel,#dashboardBoard .outcome-detail-panel,#dashboardBoard .outcome-comparison-row,#dashboardBoard .outcome-new-panel')){boardChartTooltip.classList.remove('visible');return}
  const detail=boardTipText(event.target);
  if(!detail){boardChartTooltip.classList.remove('visible');return}
  const tooltipHost=document.fullscreenElement||document.body;
  if(boardChartTooltip.parentElement!==tooltipHost)tooltipHost.append(boardChartTooltip);
  const target=event.target.closest('[data-board-tip]');
  const scale=document.querySelector('#dashboardBoard')?.getBoundingClientRect().width/1920||1;
  if(homeView()){
    const parts=detail.split('｜'), lines=(parts[1]||'').split(/[；\n]/).map(s=>s.trim()).filter(Boolean);
    const isFiling=!!target.closest('.home-filing-chart');
    const isService=!!target.closest('.home-service-chart');
    const serviceMatch=isService&&detail.match(/^(.*?)\s*门诊服务人次\s*([\d,]+)\s*人次/);
    if(serviceMatch)boardChartTooltip.textContent=`${serviceMatch[1]}\n门诊服务人次：${(Number(serviceMatch[2].replace(/,/g,''))/10000).toFixed(2)} 万人次`;
    else if(target.closest('.home-risk-bars,.home-capacity-bars')){
      const value=lines[0]||'', extra=lines.find(line=>line.startsWith('占'))||'';
      boardChartTooltip.textContent=`${parts[0]}：${value}${extra?'\n'+extra:''}`;
    }
    else if(parts.length===1)boardChartTooltip.textContent=formatBoardTip(detail);
    else if(isFiling){boardChartTooltip.innerHTML=`<div>${esc(parts[0])}</div>${lines.map((line,i)=>`<div class="board-tip-row"><i style="background:${['#105ccd','#f66d2b','#105ccd'][i]}"></i><span>${esc(line.replace(/^(高血压专档|糖尿病专档|慢阻肺专档)\s*/, '$1：'))}</span></div>`).join('')}`}
    else if(lines.length===1&&!isService)boardChartTooltip.textContent=`${parts[0]}：${lines[0]}`;
    else boardChartTooltip.textContent=`${parts[0]}${lines.length?'\n'+lines.join('\n'):''}`;
  }else boardChartTooltip.textContent=formatBoardTip(detail);
  boardChartTooltip.style.fontSize=`${16*scale}px`;
  boardChartTooltip.style.padding=`${12*scale}px ${16*scale}px`;
  boardChartTooltip.style.gap=`${8*scale}px`;
  boardChartTooltip.style.setProperty('--tip-scale',scale);
  if(target.dataset.tipRows){
    const rows=JSON.parse(target.dataset.tipRows),color=target.dataset.tipColor||'#63baff';
    boardChartTooltip.innerHTML=`<div class="structured-tip-title"><i style="background:${esc(color)}"></i>${esc(rows[0])}</div>${rows.slice(1).map(([label,value])=>`<div class="structured-tip-row"><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('')}`;
  }else if(!boardChartTooltip.querySelector('.board-tip-row')){
    const lines=boardChartTooltip.textContent.split(/\n/).map(line=>line.trim()).filter(Boolean);
    boardChartTooltip.innerHTML=lines.map(line=>{
      const match=line.match(/^(.*?)[：:\s]+([+−-]?[\d,]+(?:\.\d+)?\s*(?:%|个百分点|万(?:人次|人|家|次)?|人次|人|家|次)?)$/);
      return match?`<div class="structured-tip-row"><span>${esc(match[1])}</span><b>${esc(match[2])}</b></div>`:`<div class="structured-tip-line">${esc(line)}</div>`;
    }).join('');
  }
  boardChartTooltip.classList.add('visible');
  const width=boardChartTooltip.offsetWidth,height=boardChartTooltip.offsetHeight;
  boardChartTooltip.style.left=`${Math.min(event.clientX+14,innerWidth-width-8)}px`;
  boardChartTooltip.style.top=`${Math.max(8,Math.min(event.clientY+14,innerHeight-height-8))}px`;
});
function normalizeBoardTips(){
  const board=document.querySelector('#dashboardBoard');
  if(!board)return;
  board.querySelectorAll('.board-panel [title],.outcome-detail-panel [title],.outcome-metric-column [title]').forEach(node=>{
    const tip=node.getAttribute('title');
    if(tip&&tip.length<180&&!node.dataset.boardTip)node.dataset.boardTip=tip;
    node.removeAttribute('title');
  });
  board.querySelectorAll('.board-panel svg title,.outcome-detail-panel svg title,.outcome-metric-column svg title').forEach(node=>{
    const tip=node.textContent.trim();
    if(tip&&tip.length<180&&!node.parentElement.dataset.boardTip)node.parentElement.dataset.boardTip=tip;
    node.remove();
  });
}
new MutationObserver(normalizeBoardTips).observe(document.querySelector('#view'),{childList:true,subtree:true});
queueMicrotask(normalizeBoardTips);
render();





// Dashboard perspectives share the same scoped data and geographic map.
const dashboardBeforePerspectives=dashboard;
const dashboardViews={home:'概览',situation:'态势',construction:'一体化建设',outcomes:'管理成效'};
function boardPercent(value){return formatPct(Math.max(0,Math.min(100,value)))}
function boardPortrait(node){
  const p=populationData(),risk=node?riskProfileFor(node):selectedRiskProfile(),senior=p.senior/p.diagnosed*100,co=p.overlap/p.diagnosed*100,high=risk.high/p.managed*100;
  return [
    ['患者人群画像',`<div class="board-portrait"><div class="board-portrait-main"><strong>${boardPercent(senior)}</strong><span>65 岁及以上确诊患者</span><small>${people(p.senior)} / ${people(p.diagnosed)}</small></div><div class="board-portrait-row"><span>45-64 岁</span><i><b style="width:${boardPercent((100-senior)*.8)}"></b></i><strong>${boardPercent((100-senior)*.8)}</strong></div><div class="board-portrait-row"><span>44 岁及以下</span><i><b style="width:${boardPercent((100-senior)*.2)}"></b></i><strong>${boardPercent((100-senior)*.2)}</strong></div></div>`],
    ['病种与风险结构',`<div class="board-portrait-legend"><div><span>高血压单病</span><strong>${boardPercent((p.high-p.overlap)/p.diagnosed*100)}</strong></div><div><span>糖尿病单病</span><strong>${boardPercent((p.diabetes-p.overlap)/p.diagnosed*100)}</strong></div><div><span>两病同患</span><strong>${boardPercent(co)}</strong></div></div><div class="board-portrait-risk"><span>专档患者中高风险</span><strong>${boardPercent(high)}</strong><div class="board-portrait-track"><i style="width:${boardPercent(high)}"></i></div><small>${people(risk.high)} / ${people(p.managed)}</small></div>`]
  ];
}
function boardPerspectivePanels(view,node,units){
  const p=populationData(),m=clinicMetrics(node),base=node||cities[0],risk=node?riskProfileFor(node):selectedRiskProfile(),cards=boardPortrait(node);
  const panelHtml=([title,body])=>`<section class="board-panel"><h2>${title}</h2>${body}</section>`;
  if(view==='home'){
    const built=units.filter(x=>x.should).sort((a,b)=>rate(a.clinics,a.should)-rate(b.clinics,b.should));
    const coverage=m.built/Math.max(1,m.eligible)*100,activation=m.active/Math.max(1,m.built)*100;
    return {left:cards.map(panelHtml).join(''),metric:'construction',right:[
      ['一体化门诊建设下沉',`<div class="board-path"><div><strong>${m.eligible} 家</strong><span>基层机构</span></div><div><strong>${m.built} 家</strong><span>已建成</span></div><div><strong>${boardPercent(coverage)}</strong><span>门诊覆盖率</span></div></div>`],
      ['建成后有效启用',`<div class="board-focus-number">${boardPercent(activation)}</div><p class="board-focus-copy">${m.active} / ${m.built} 家已建成门诊在统计期内产生有效两慢病服务记录；${m.built-m.active} 家建而未用。</p>`],
      ['下级区域建设差异',`<div class="board-compare">${built.slice(0,4).map(x=>`<div><span title="${esc(fullName(x))}">${esc(fullName(x))}</span><i><b style="width:${Math.min(100,rate(x.clinics,x.should))}%"></b></i><strong>${rate(x.clinics,x.should)}%</strong></div>`).join('')}</div><p class="board-focus-copy">${esc(periodText())} · 按当前范围下级单位建设覆盖率排序</p>`]
    ].map(panelHtml).join('')};
  }
  if(view==='situation'){
    const coverage=p.managed/p.diagnosed*100,entry=dashboardRate(node,'entry'),low=units.filter(x=>popCoverage(x)<coverage).length;
    return {metric:'management',left:[['确诊到专档',`<div class="board-path"><div><strong>${people(p.diagnosed)}</strong><span>两慢确诊</span></div><div><strong>${people(p.managed)}</strong><span>专档在管</span></div><div><strong>${boardPercent(coverage)}</strong><span>专档覆盖</span></div><div><strong>${people(p.diagnosed-p.managed)}</strong><span>人数差额</span></div></div>`],['辖区差异',`<div class="board-focus-number">${low} <small>/ ${units.length}</small></div><p class="board-focus-copy">下级单位专档覆盖率低于当前范围。结合确诊规模和基层就诊流向查看服务承接。</p>`]].map(panelHtml).join(''),right:[['患者风险结构',`<div class="board-focus-number">${boardPercent(risk.high/p.managed*100)}</div><p class="board-focus-copy">高风险患者占专档在管患者比例</p>`],['基层服务流向',`<div class="board-path"><div><strong>48.0%</strong><span>基层就诊率</span></div><div><strong>52.0%</strong><span>等级医院就诊率</span></div></div><p class="board-focus-copy">就诊率按诊次统计，和患者人数分别计算。</p>`],['路径进入',`<div class="board-treatment"><strong>${boardPercent(entry)}</strong><span>符合条件患者入径率</span><p>结合诊前、诊中、诊后节点查看服务是否连续。</p></div>`]].map(panelHtml).join('')};
  }
  if(view==='construction'){
    const records=reviewInScope(node),pending=records.filter(x=>x.status==='待省级审核').length,returned=records.filter(x=>x.status==='退回补充').length;
    return {metric:'construction',left:[['建设与启用',`<div class="board-path"><div><strong>${m.eligible} 家</strong><span>应建设</span></div><div><strong>${m.built} 家</strong><span>已核验建成</span></div><div><strong>${m.active} 家</strong><span>有效启用</span></div><div><strong>${m.built-m.active} 家</strong><span>建而未用</span></div></div>`],['建设认定进度',`<div class="board-path"><div><strong>${pending} 家</strong><span>待审核</span></div><div><strong>${returned} 家</strong><span>退回修改</span></div></div><p class="board-focus-copy">审核结论以申报清单、材料和开诊记录共同判断。</p>`]].map(panelHtml).join(''),right:null};
  }
  const outcomes=[['血压',dashboardRate(node,'improvement')],['血糖',dashboardRate(node,'glucose')],['血脂',dashboardRate(node,'lipid')],['糖化',dashboardRate(node,'hba1c')]];
  return {metric:'improvement',left:[['患者路径化执行情况',`<div class="board-path"><div><strong>${boardPercent(dashboardRate(node,'entry'))}</strong><span>入径率</span></div><div><strong>${boardPercent(base.follow+2)}</strong><span>诊前采集率</span></div><div><strong>${boardPercent(base.follow-2)}</strong><span>诊中执行率</span></div><div><strong>${boardPercent(base.follow-12)}</strong><span>诊后追踪率</span></div></div>`],['核心项目检测情况',`<table class="board-table"><thead><tr><th>检测项目</th><th>检测率</th></tr></thead><tbody>${[['血压',base.follow+4],['血糖',base.follow-2],['糖化血红蛋白',base.follow-16],['低密度脂蛋白',base.follow-25]].map(([label,value])=>`<tr><td>${label}</td><td>${boardPercent(value)}</td></tr>`).join('')}</tbody></table>`]].map(panelHtml).join(''),right:[['分项改善',`<div class="board-tiers">${outcomes.map(([label,value])=>`<div>${label}改善率<strong>${boardPercent(value)}</strong></div>`).join('')}</div>`],['异常结果处置',`<div class="board-treatment"><strong>${boardPercent(base.follow-17)}</strong><span>到期异常复查完成率</span><p>改善率需与检测覆盖和可评价样本一起解释。</p></div>`],['管理判断',`<p class="board-focus-copy">先检查应检项目的完成情况，再追踪异常复查和诊后服务，最后比较同口径可评价患者的改善情况。</p>`]].map(panelHtml).join('')};
}
dashboard=function(){
  const node=currentNode(),view=state.dashboardView||'home',perspective=boardPerspectivePanels(view,node,comparisonUnits());
  if(state.page==='dashboard'&&state.mapMetric!==perspective.metric&&state.dashboardMetricView!==view){state.mapMetric=perspective.metric;state.dashboardMetricView=view}
  const root=document.createElement('div');root.innerHTML=dashboardBeforePerspectives();const board=root.querySelector('#dashboardBoard');
  board.querySelector('.board-title small')?.remove();
  board.querySelector('.board-title').insertAdjacentHTML('beforeend',`<nav class="board-tabs" aria-label="数据大屏视图">${Object.entries(dashboardViews).map(([key,label])=>`<button type="button" data-board-view="${key}" class="${view===key?'active':''}" aria-pressed="${view===key}">${label}</button>`).join('')}</nav>`);
  const fullscreen=board.querySelector('#boardFullscreen');board.querySelector('.board-title').appendChild(fullscreen);
  const builtClinics=(node?scopeDescendants(node):clinics).filter(x=>x.clinics),explore=builtClinics.filter(x=>nodeTier(x)==='鼓励探索').length,enhanced=builtClinics.filter(x=>['强化功能','鼓励探索'].includes(nodeTier(x))).length;
  const tierRows=board.querySelectorAll('.board-tiers>div');
  [['基本保障',builtClinics.length],['强化功能',enhanced],['鼓励探索',explore]].forEach(([label,count],index)=>{if(tierRows[index])tierRows[index].innerHTML=`${label}<strong>${count} 家</strong>`});
  board.querySelector('.board-stack').innerHTML=perspective.left;
  if(perspective.right)board.querySelector('.board-stack:last-child').innerHTML=perspective.right;
  const metrics=clinicMetrics(node),kpis=board.querySelectorAll('.board-kpi');
  kpis[3].querySelector('span').textContent='基层机构总数';
  kpis[4].querySelector('span').textContent='已建成一体化门诊机构数';
  kpis[4].querySelector('small').textContent='建设申报统计 · 模拟数据';
  kpis[5].querySelector('span').textContent='一体化门诊覆盖率';
  kpis[5].querySelector('strong').textContent=formatPct(metrics.built/Math.max(1,metrics.eligible)*100);
  kpis[5].querySelector('small').textContent=`${metrics.built} / ${metrics.eligible} 家 · 模拟数据`;
  const mapHead=board.querySelector('.board-map .panel-head'),modes=document.createElement('div');
  modes.className='board-map-modes';modes.append(board.querySelector('.map-view-switch'),board.querySelector('.map-levels'));mapHead.append(modes);
  board.querySelectorAll('.board-path>div').forEach(item=>{
    const value=Number.parseFloat(item.querySelector('strong')?.textContent||'');
    if(!item.querySelector('strong')?.textContent.includes('%')||!Number.isFinite(value))return;
    const track=document.createElement('i');track.className='board-progress';track.innerHTML=`<b style="width:${Math.max(0,Math.min(100,value))}%"></b>`;item.append(track);
  });
  board.querySelectorAll('.board-tiers>div').forEach(item=>{
    const value=Number.parseFloat(item.querySelector('strong')?.textContent||'');
    if(!item.querySelector('strong')?.textContent.includes('%')||!Number.isFinite(value))return;
    const track=document.createElement('i');track.className='board-tier-progress';track.innerHTML=`<b style="width:${Math.max(0,Math.min(100,value))}%"></b>`;item.append(track);
  });
  const ticker=document.createElement('div');ticker.className='board-ticker';ticker.setAttribute('aria-label','模拟数据动态播报');
  const tickerItems=[`${regionLabel()}两慢确诊 ${people(populationData().diagnosed)}`,`已建成一体化门诊 ${metrics.built} 家`, `一体化门诊覆盖率 ${formatPct(metrics.built/Math.max(1,metrics.eligible)*100)}`,`路径入径率 ${formatPct(dashboardRate(node,'entry'))}`];
  ticker.innerHTML=`<span>动态播报</span><b>模拟数据 · ${esc(periodText())}</b><strong id="boardTickerText">${esc(tickerItems[0])}</strong><small>数据随当前机构与周期切换</small>`;
  ticker.dataset.items=JSON.stringify(tickerItems);board.querySelector('.board-kpis').after(ticker);
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest('[data-board-view]');if(!button)return;event.stopImmediatePropagation();state.dashboardView=button.dataset.boardView;render()},true);

function demoClinicAccounts(){
  const records=reviewItems(),used=new Set(records.map(x=>x.name)),available=clinics.filter(x=>x.clinics&&!used.has(x.name));
  const unsubmitted=available[0]||clinics.find(x=>!used.has(x.name));
  const draft=available[1]||clinics.find(x=>x.name!==unsubmitted?.name&&!used.has(x.name));
  if(draft&&!state.submissions.some(x=>x.name===draft.name))state.submissions.push({...demoSubmission({name:draft.name,tier:'basic',status:'机构草稿',flags:[],opinion:''},records.length+1),status:'机构草稿'});
  const find=status=>records.find(x=>x.status===status);
  const pendingClean=records.find(x=>x.status==='待省级审核'&&!x.flags.length);
  return [{key:'unsubmitted',label:'未申请',node:unsubmitted},{key:'draft',label:'草稿待提交',node:draft},{key:'pending',label:'待审核·有疑点',node:find('待省级审核')&&clinics.find(x=>x.name===find('待省级审核').name)},{key:'pendingClean',label:'待审核·无疑点',node:pendingClean&&clinics.find(x=>x.name===pendingClean.name)},{key:'returned',label:'退回修改',node:find('退回补充')&&clinics.find(x=>x.name===find('退回补充').name)},{key:'approved',label:'审核通过',node:find('审核通过')&&clinics.find(x=>x.name===find('审核通过').name)}].filter(x=>x.node);
}
const accountPicker=$('rolePicker'),changeRoleBeforeAccounts=accountPicker.onchange;
function updateAccountPicker(){
  accountPicker.querySelectorAll('[data-demo-account]').forEach(x=>x.remove());
  const accounts=demoClinicAccounts();
  if(state.demoAccount&&!accounts.some(x=>x.key===state.demoAccount&&nodeKey(x.node)===state.city))state.demoAccount=null;
  for(const account of accounts){const option=document.createElement('option');option.value=`account:${account.key}`;option.dataset.demoAccount=account.key;option.textContent=`${account.label} · ${account.node.name}`;accountPicker.appendChild(option)}
  accountPicker.querySelectorAll('option:disabled,optgroup').forEach(x=>x.remove());
  if(state.demoAccount)accountPicker.value=`account:${state.demoAccount}`;
}
accountPicker.onchange=event=>{
  if(!event.target.value.startsWith('account:')){state.demoAccount=null;changeRoleBeforeAccounts(event);return}
  const account=demoClinicAccounts().find(x=>x.key===event.target.value.slice(8));if(!account)return;
  state.demoAccount=account.key;state.role='clinic';state.city=nodeKey(account.node);state.page='clinic';state.clinicTab='overview';state.reviewStatus='';state.reviewCounty='';closeDrawer();render();
};
const renderBeforeAccounts=render;
render=function(){
  renderBeforeAccounts();updateAccountPicker();
  if(state.page==='clinic'&&scopeLevel()==='clinic'){
    const record=reviewInScope(currentNode())[0];
    if(record&&['机构草稿','退回补充'].includes(record.status)&&$('code')){
      for(const [id,value] of Object.entries({code:record.code,address:record.address,date:record.date,contact:record.contact,phone:record.phone,targetTier:record.tier}))if($(id)&&value)$(id).value=value;
      document.querySelectorAll('[data-check="basic"]').forEach(select=>select.value='yes');
    }
  }
};

// Final demo data is scoped to the selected organization, including list details.
function scopeLevel(){return state.city==='all'?'province':state.city.split(':')[0]}
function scopeDescendants(node){return node.clinicIndex?[node]:node.consortiumName?clinics.filter(x=>x.consortiumName===node.name):node.cityName?clinics.filter(x=>x.adcode===node.adcode):clinics.filter(x=>x.cityName===node.name)}
function clinicMetrics(node){const items=node?scopeDescendants(node):clinics;return {eligible:items.length,built:items.filter(x=>x.clinics).length,active:items.filter(x=>x.active).length}}
function reviewInScope(node){const items=new Map([...reviewItems(),...state.submissions].map(item=>[item.name,item]));return [...items.values()].filter(item=>!node||item.name===node.name||scopeDescendants(node).some(x=>x.name===item.name))}
function demoSubmission(item,index){const node=clinics.find(x=>x.name===item.name),county=counties.find(x=>x.adcode===node?.adcode),status=index%11===8?'退回补充':index%13===9?'审核通过':item.status;return {...item,status,date:`2026-${String(8+index%2).padStart(2,'0')}-${String(2+index%25).padStart(2,'0')}`,submittedAt:`2026-10-${String(1+index%20).padStart(2,'0')} 09:30`,code:`DEMO-${node?.adcode||'330000'}-${String(node?.clinicIndex||index+1).padStart(4,'0')}`,address:`${node?.cityName||'浙江省'}${node?.county||''}${index%2?'健康路':'民生路'}${18+index}号（演示）`,contact:['王医生','陈主任','李医生'][index%3],phone:`1380000${String(1000+index).slice(-4)}`,checks:{basic:`${index%5===0?'8/9':'9/9'} 项符合`,enhanced:item.tier==='basic'?'未申报':`${index%7===0?'5/6':'6/6'} 项符合`,explore:item.tier==='explore'?`${index%6===0?'3/4':'4/4'} 项开展`:'未申报'},opinion:status==='退回补充'?'请补充诊前设备与门诊标识同框照片，并说明开诊记录。':item.opinion,files:item.files||{logo:[{name:'门诊标识同框照（演示记录）'}],site:[{name:'诊前设备与诊室照片（演示记录）'}],other:[]},county:county?fullName(county):item.county}}
const originalReviewItemsForDemo=reviewItems;
reviewItems=function(){
  const rows=originalReviewItemsForDemo();
  if(!rows[0]?.submittedAt){
    const prepared=rows.map(demoSubmission),names=new Set(prepared.map(x=>x.name));
    for(const county of counties){
      const node=clinics.find(x=>x.adcode===county.adcode&&x.clinics);
      if(node&&!names.has(node.name)){prepared.push(demoSubmission({name:node.name,county:fullName(county),tier:['basic','enhanced','explore'][prepared.length%3],status:'待省级审核',flags:[],opinion:''},prepared.length));names.add(node.name)}
    }
    rows.splice(0,rows.length,...prepared);
  }
  return rows;
};

function constructionFindings(){
  const node=currentNode(),units=comparisonUnits(),scope=regionLabel(),self=scopeLevel()==='clinic',metrics=clinicMetrics(node),rows=reviewInScope(node),pending=rows.filter(x=>x.status==='待省级审核'),returned=rows.filter(x=>x.status==='退回补充'),province=clinicMetrics(null),average=province.built/province.eligible*100;
  const rank=[...units].filter(x=>x.should).sort((a,b)=>rate(a.clinics,a.should)-rate(b.clinics,b.should)),below=rank.filter(x=>rate(x.clinics,x.should)<average),above=rank.filter(x=>rate(x.clinics,x.should)>average),equal=rank.length-below.length-above.length,gap=rank.filter(x=>x.should>x.clinics).sort((a,b)=>(b.should-b.clinics)-(a.should-a.clinics));
  const unused=rank.filter(x=>x.clinics>x.active).sort((a,b)=>(b.clinics-b.active)-(a.clinics-a.active)),label={province:'市、区',city:'区县',county:'医共体和基层机构',consortium:'基层机构',clinic:'本机构'}[scopeLevel()];
  if(self){const record=rows[0];return [{title:'本机构建设与认定',signal:record?.status||'未申报',finding:`本机构${metrics.built?'已建成':'尚未建成'}；${record?`申报于 ${record.submittedAt} 提交，当前${record.status}`:'尚未提交建设申报'}。${metrics.active?'本期已有有效服务记录。':'本期尚无有效服务记录。'}`,action:record?.status==='退回补充'?`根据退回意见补充材料：${record.opinion}`:record?.status==='待省级审核'?'保留现有门诊服务记录，等待省级认定。':'完成建设清单、标识照片及开诊资料后提交申报。',rows:[[scope,`已建 ${metrics.built} · 启用 ${metrics.active} · ${record?.status||'未申报'}`]]},{title:'本机构开诊服务',signal:metrics.active?'已启用':'未启用',finding:metrics.active?'门诊已产生有效两慢病服务记录，下一步关注路径入径与监测执行。':'已建门诊尚未产生本期有效两慢病服务记录。',action:'核对实际开诊排班、就诊流水和路径记录，必要时向医共体申请人员支持。',rows:[[scope,`已建 ${metrics.built} · 启用 ${metrics.active}`]]}]}
  return [
    {title:'建设概况与区域差异',signal:`${metrics.built} / ${metrics.eligible} 家`,finding:`${scope}应建设 ${metrics.eligible} 家、已建 ${metrics.built} 家、未建 ${metrics.eligible-metrics.built} 家；待省级审核 ${pending.length} 家。${label}中，建设率低于全省 ${formatPct(average)} 的有 ${below.length} 个，高于全省 ${above.length} 个，持平 ${equal} 个。已建门诊中 ${metrics.active} 家有效启用（${formatPct(metrics.active/Math.max(1,metrics.built)*100)}），${metrics.built-metrics.active} 家未启用（${formatPct((metrics.built-metrics.active)/Math.max(1,metrics.built)*100)}）；${unused[0]?`${fullName(unused[0])}建而未用 ${unused[0].clinics-unused[0].active} 家，当前范围最多。`:''}`,action:gap[0]?`先请${fullName(gap[0])}明确未建门诊的场地、人员和完成日期；对${unused[0]?fullName(unused[0]):'已建未启用机构'}安排开诊与服务记录复盘。`:'跟踪待审核申报与建成后开诊情况。',rows:rank.slice(0,12).map(x=>[fullName(x),`应建 ${x.should} · 已建 ${x.clinics} · 启用 ${x.active} · 覆盖 ${rate(x.clinics,x.should)}%`])},
    {title:'建成后使用与服务衔接',signal:`${metrics.built-metrics.active} 家未启用`,finding:`${scope}已建 ${metrics.built} 家中，${metrics.built-metrics.active} 家本期没有有效两慢病服务记录。${unused[0]?`${fullName(unused[0])}未启用 ${unused[0].clinics-unused[0].active} 家。`:''}建设完成不能替代诊前、诊中、诊后服务运行。`,action:`${unused[0]?`请${fullName(unused[0])}先列出未启用机构并核对排班、就诊流水与路径记录；`:''}医共体提供人员与设备支持，下期观察有效启用率和入径率是否同步改善。`,rows:unused.slice(0,12).map(x=>[fullName(x),`已建 ${x.clinics} · 启用 ${x.active} · 未启用 ${x.clinics-x.active}`])},
    {title:scopeLevel()==='province'?'省级审核与材料疑点':'申报进度与退回原因',signal:`待审 ${pending.length} 家 · 退回 ${returned.length} 家`,finding:`当前范围待审核 ${pending.length} 家，退回修改 ${returned.length} 家；其中 ${pending.filter(x=>x.flags.length).length} 家存在演示规则疑点。审核结论需对照建设清单、材料和开诊记录由省级作出。`,action:scopeLevel()==='province'?'先处理有疑点的申请，逐项查看表单与材料，采纳或修改退回意见；其余按提交时间审核。':'按退回原因补齐申报字段与佐证材料，跟踪省级审核结论。',rows:[...returned,...pending].slice(0,12).map(x=>[x.name,`${x.status} · ${clinicTierLabel[x.tier]} · ${x.flags.length} 项疑点`])}
  ];
}
$('help').onclick=()=>drawer('原型说明',`<div class="detail"><p>所有数值均为模拟数据，不能作为浙江省真实统计或考核结果。省内 11 市和 90 个区县来自本地行政边界；医共体及基层机构为演示占位。</p><p>确诊、专档、风险数据拟从各地公卫系统接口获取；就诊数据拟对接诊疗记录接口。只有一体化门诊建设由区县上报。智能分析目前使用透明的比较规则，并未接入 AI 模型。</p><p>高危人群按仅高血压、仅糖尿病、两病同时高危互斥分组；在管患者高、中、低风险按患者互斥计算。就诊人次为统计期内诊次，同一人可重复就诊；基层与等级医院就诊率分别以两类就诊人次之和为分母。正式数据须确认医疗机构分级、就诊归属及转诊口径。</p><p>全省或所属区县同期水平只用于发现差异，不作为政策考核阈值。高风险占比差异需结合健康成效判断原因。建设审核疑点和审批流程为原型建议，正式权限及口径需业务确认。</p></div>`);

// The picker browse path is independent from the committed scope. Selecting a city
// reveals its counties without implicitly selecting a county.
$('orgPanel').onclick=event=>{
  event.stopPropagation();
  const button=event.target.closest('[data-org]');
  if(!button||button.disabled)return;
  const value=button.dataset.org,level=value.split(':')[0];
  if(value==='all'){
    orgBrowseCity=orgBrowseCounty=orgBrowseConsortium=null;
  }else if(level==='city'){
    orgBrowseCity=value.slice(5);orgBrowseCounty=orgBrowseConsortium=null;
  }else if(level==='county'){
    const county=counties.find(x=>nodeKey(x)===value);
    orgBrowseCity=county?.cityName||orgBrowseCity;
    orgBrowseCounty=county?.name||null;orgBrowseConsortium=null;
  }else if(level==='consortium'){
    const unit=consortia.find(x=>nodeKey(x)===value);
    orgBrowseCity=unit?.cityName||orgBrowseCity;
    orgBrowseCounty=unit?.county||orgBrowseCounty;
    orgBrowseConsortium=unit?.name||null;
  }
  state.city=value;resetListPages();render();
  if(level==='clinic'){
    $('orgPicker').classList.remove('open');
    $('orgTrigger').setAttribute('aria-expanded','false');
  }else{
    positionOrgPanel();
    const columns=$('orgPanel').querySelectorAll('.org-col');
    const next=columns[Math.min(columns.length-1,level==='city'?2:level==='county'?3:level==='consortium'?4:1)];
    if(next)$('orgPanel').scrollLeft=Math.max(0,next.offsetLeft-$('orgPanel').clientWidth+next.offsetWidth+12);
  }
};

const assistantState={open:false,conversation:[],selection:0,context:''};
const assistant=document.createElement('aside');
assistant.className='analysis-assistant';
assistant.setAttribute('aria-label','数据分析助手');
assistant.innerHTML=`<div class="assistant-head"><img src="mascot-head.svg" alt=""><div><strong>AI助手小安</strong><span id="assistantScope"></span></div><button type="button" class="assistant-face" aria-label="切换小安表情" title="切换表情">☺</button><button type="button" class="assistant-close" aria-label="收起助手" title="收起助手">×</button></div><div class="assistant-body" id="assistantBody"></div><form class="assistant-compose" id="assistantForm"><div class="assistant-presets" id="assistantPresets"></div><div class="assistant-input"><textarea id="assistantQuestion" rows="2" aria-label="向小安提问" placeholder="询问当前机构的数据与决策建议"></textarea><button type="submit" aria-label="发送问题" title="发送问题" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg></button></div><small id="assistantConnection" class="visually-hidden" aria-live="polite"></small></form>`;
document.body.appendChild(assistant);
const assistantLauncher=document.createElement('button');
assistantLauncher.type='button';assistantLauncher.className='assistant-launcher';
assistantLauncher.title='打开AI助手小安';assistantLauncher.setAttribute('aria-label','打开AI助手小安');
assistantLauncher.innerHTML='<img src="mascot-head.svg" alt="">';
document.querySelector('.side').appendChild(assistantLauncher);
function assistantItems(){
  if(state.page==='population')return populationFindings().items;
  if(state.page==='clinic')return clinicFindings();
  const labels={dashboard:'区域监管',service:'管理过程',outcome:'管理成效',governance:'整改督办'};
  return [{title:`${regionLabel()}${labels[state.page]||'数据'}概览`,signal:'查看当前范围',finding:`当前选择 ${regionLabel()}，可结合页面指标查看下辖机构差异。`,action:'选择具体机构或指标后继续提问。',rows:[]}];
}
function assistantEvidence(item){return item.rows?.length?`<div class="assistant-evidence"><b>相关机构与数据</b>${item.rows.slice(0,8).map(([name,value])=>`<div><span>${esc(name)}</span><small>${esc(value)}</small></div>`).join('')}</div>`:''}
function assistantFinding(index){
  assistantState.selection=index;
  const item=assistantItems()[index];if(!item)return;
  const body=$('assistantBody');
  $('assistantPresets').querySelectorAll('.assistant-prompt').forEach((button,i)=>button.classList.toggle('active',i===index));
  const result=body.querySelector('.assistant-result');
  result.innerHTML=`<div class="assistant-result-head"><span>分析结果</span></div><h3>${esc(item.title)}</h3><strong class="assistant-signal">${esc(item.signal)}</strong><p>${esc(item.finding)}</p><div class="assistant-action"><b>建议执行</b><p>${esc(item.action)}</p></div>${assistantEvidence(item)}`;
}
function refreshAssistant(){
  const context=[state.page,state.city,state.year,state.periodMode,state.quarter,state.month].join('|');
  if(assistantState.context!==context){assistantState.context=context;assistantState.conversation=[];assistantState.selection=0}
  document.body.classList.toggle('assistant-open',assistantState.open);
  requestAnimationFrame(fitDashboard);
  assistantLauncher.hidden=assistantState.open;
  $('assistantScope').textContent='';
  const items=assistantItems();
  $('assistantPresets').innerHTML=items.map((item,i)=>`<button type="button" class="assistant-prompt" data-assistant-prompt="${i}">${esc(state.page==='population'?['专档覆盖','高风险占比','基层就诊流向'][i]:item.title)}</button>`).join('');
  $('assistantBody').innerHTML='<div class="assistant-result"></div><div class="assistant-dialogue" id="assistantDialogue" aria-live="polite"></div>';
  assistantFinding(Math.min(assistantState.selection,items.length-1));
  renderAssistantMessages();
}
function renderAssistantMessages(){
  const dialogue=$('assistantDialogue');if(!dialogue)return;
  dialogue.innerHTML=assistantState.conversation.map(message=>`<div class="assistant-message ${message.role}"><b>${message.role==='user'?'我':'数据助手'}</b><p>${esc(message.text)}</p></div>`).join('');
}
assistantLauncher.onclick=()=>{assistantState.open=true;refreshAssistant()};
assistant.querySelector('.assistant-close').onclick=()=>{assistantState.open=false;refreshAssistant()};
assistant.onclick=event=>{const button=event.target.closest('[data-assistant-prompt]');if(button)assistantFinding(Number(button.dataset.assistantPrompt))};
const assistantQuestion=$('assistantQuestion');
assistantQuestion.addEventListener('input',()=>{assistant.querySelector('[type="submit"]').disabled=!assistantQuestion.value.trim()});
function localAssistantAnswer(question){
  const items=assistantItems(),terms=[['专档','覆盖'],['高风险','风险'],['就诊','基层'],['建设','门诊']];
  const index=items.findIndex((item,i)=>question.includes(item.title.slice(-4))||terms[i]?.some(term=>question.includes(term)));
  const item=items[index>=0?index:assistantState.selection]||items[0];
  return `${regionLabel()}：${item.finding} 建议：${item.action} 这是基于当前模拟数据的规则演示回复。`;
}
assistant.querySelector('form').onsubmit=async event=>{
  event.preventDefault();const input=$('assistantQuestion'),question=input.value.trim();if(!question)return;
  input.value='';assistant.querySelector('[type="submit"]').disabled=true;assistantState.conversation.push({role:'user',text:question});renderAssistantMessages();
  const context={page:state.page,scope:regionLabel(),period:periodText(),target:assistantTargetContext(question),findings:assistantItems().map(item=>({title:item.title,finding:item.finding,action:item.action,rows:item.rows?.slice(0,12)}))};
  let answer;
  if(location.protocol==='http:'||location.protocol==='https:'){
    try{const response=await fetch('/api/analysis',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,context})});if(response.ok){answer=(await response.json()).answer;$('assistantConnection').textContent='ChatGPT 已连接'}}catch(error){}
  }
  if(!answer){answer=localAssistantAnswer(question);$('assistantConnection').textContent='当前为演示数据回答，ChatGPT 未连接'}
  assistantState.conversation.push({role:'assistant',text:answer});renderAssistantMessages();
};
const renderBeforeAssistant=render;
function numberPager(page,total,kind,attribute){
  const numbers=new Set([1,total,page-2,page-1,page,page+1,page+2].filter(n=>n>=1&&n<=total));
  let previous=0,html='';
  for(const n of [...numbers].sort((a,b)=>a-b)){
    if(n-previous>1)html+='<span class="pager-ellipsis">…</span>';
    html+=`<button type="button" ${attribute}="${n}" ${kind} class="${n===page?'active':''}" ${n===page?'aria-current="page"':''}>${n}</button>`;
    previous=n;
  }
  return html;
}
function enhancePagers(){
  document.querySelectorAll('#view .list-pagination').forEach(pager=>{
    const previous=pager.querySelector('[data-list-page], [data-review-page]');if(!previous)return;
    const isReview=previous.hasAttribute('data-review-page'),attribute=isReview?'data-review-page':'data-list-page',kind=isReview?'':`data-list-kind="${previous.dataset.listKind}"`;
    const label=pager.querySelector('span')?.textContent||'',count=Number(label.match(/共\s*(\d+)\s*条/)?.[1]||0),size=state.pageSizes?.[isReview?'review':previous.dataset.listKind]||10,total=Math.max(1,Math.ceil(count/size));
    const page=isReview?Math.min(state.reviewPage||1,total):Math.min(state.listPages?.[previous.dataset.listKind]||1,total);
    pager.innerHTML=`<span>共 ${count} 条</span><button type="button" ${attribute}="${page-1}" ${kind} aria-label="上一页" ${page===1?'disabled':''}>‹</button>${numberPager(page,total,kind,attribute)}<button type="button" ${attribute}="${page+1}" ${kind} aria-label="下一页" ${page===total?'disabled':''}>›</button><select aria-label="每页条数" data-page-size="${isReview?'review':previous.dataset.listKind}">${[10,15,20].map(n=>`<option value="${n}" ${size===n?'selected':''}>${n} 条/页</option>`).join('')}</select>`;
  });
}
render=function(){renderBeforeAssistant();document.querySelectorAll('#view .ai-panel').forEach(panel=>panel.remove());const page=document.querySelector('.population-page');if(page){const grid=page.querySelector('.population-grid'),visit=page.querySelector('.visit-panel');if(grid&&visit){grid.appendChild(visit);grid.classList.add('population-details-grid')}}enhancePagers();if(assistantState.open)refreshAssistant()};
render();

// A selection opens the next column; no lower-level list is preselected.
$('orgTrigger').onclick=()=>{let open=$('orgPicker').classList.toggle('open');$('orgTrigger').setAttribute('aria-expanded',String(open));if(open){let node=currentNode(),level=state.city.split(':')[0];orgBrowseProvince=true;orgBrowseCity=level==='city'?node?.name:node?.cityName||null;orgBrowseCounty=level==='county'?node?.name:node?.county||null;orgBrowseConsortium=level==='consortium'?node?.name:node?.consortiumName||null;renderOrgPicker();positionOrgPanel()}};
new ResizeObserver(()=>document.documentElement.style.setProperty('--demo-top-height',`${document.querySelector('.top').offsetHeight}px`)).observe(document.querySelector('.top'));

const clinicTierLabel={basic:'基本保障',enhanced:'强化功能',explore:'鼓励探索'};
const originalClinicFindings=clinicFindings;
clinicFindings=function(){
  const units=comparisonUnits(),s=selected(),built=sum(s,'clinics'),active=sum(s,'active'),eligible=sum(s,'should'),scope=regionLabel();
  if(state.role==='clinic'){
    const node=currentNode(),record=state.submissions.find(x=>x.name===node.name),status=record?.status||'未提交审核申请';
    return [
      {title:'本机构建设认定',signal:status,finding:record?.status==='退回补充'?`申报材料已退回：${record.opinion||'请补充建设佐证材料'}。`:record?.status==='审核通过'?`本机构已认定为${clinicTierLabel[record.tier]}。`:`本机构当前建设能力为${nodeTier(node)}，${status}。`,action:record?.status==='审核通过'?'持续记录开诊服务，按认定层级维持建设要求。':'完善建设表单和照片材料，由区县汇总上报省级审核。'},
      {title:'开诊使用',signal:active?'已启用':'待启用',finding:active?'本机构已识别有效两慢病服务记录。':'本期尚未识别有效两慢病服务记录。',action:active?'持续观察门诊服务量和诊疗记录。':'确认实际开诊时间、接诊安排及接口记录是否完整。'}
    ]
  }
  const gaps=[...units].filter(x=>x.should>x.clinics).sort((a,b)=>(b.should-b.clinics)-(a.should-a.clinics));
  const unused=[...units].filter(x=>x.clinics>x.active).sort((a,b)=>rate(b.clinics-b.active,b.clinics)-rate(a.clinics-a.active,a.clinics));
  const pending=reviewItems().filter(x=>x.status==='待省级审核'&&(state.role==='province'||x.county.includes(scope)));
  const findings=[
    {title:'建设缺口',signal:`${eligible-built} 家`,finding:gaps.length?`${gaps.length} 个下辖单位仍有应建未建门诊；${fullName(gaps[0])}缺口最大，为 ${gaps[0].should-gaps[0].clinics} 家。`:'当前下辖单位均完成应建任务。',action:gaps.length?`先请${fullName(gaps[0])}提交建设排期和场地、人员配置计划，再跟踪其他缺口单位。`:'保持定期复核机构名册。'},
    {title:'建成后使用',signal:`${built-active} 家`,finding:unused.length?`${unused.length} 个下辖单位存在已建未启用门诊；${fullName(unused[0])}的未启用比例最高，为 ${rate(unused[0].clinics-unused[0].active,unused[0].clinics)}%。`:'当前已建门诊均有有效服务记录。',action:unused.length?`请${fullName(unused[0])}区分实际未开诊和接口记录未传送，并报告开诊安排或数据修复进度。`:'继续观察门诊服务量。'},
    {title:state.role==='province'?'审核关注':'申报进度',signal:state.role==='province'?`${pending.length} 家待审核`:`${state.submissions.length} 条申报`,finding:state.role==='province'?`待审核材料中 ${pending.filter(x=>x.flags.length).length} 家被标注疑点，需结合原始表单和照片核定。`:`${scope}可查看下辖机构申报和省级结论，退回材料需要按原因补充。`,action:state.role==='province'?'先处理 AI 标注疑点的记录，再处理常规申请；结论由省级审核员决定。':'督促申报机构补齐材料，跟踪省级审核结论。',stats:[['待省级处理',pending.length+' 家'],['AI疑点',pending.filter(x=>x.flags.length).length+' 家']]}
  ];
  if(state.role==='city'){
    findings[0].title='跨区建设差异';findings[0].action=gaps.length?`请${fullName(gaps[0])}报送未建机构清单，市级协调场地与人员支持，并按月比较各区县进度。`:'按月比较各区县进度。';
    findings[1].title='区县开诊差异';findings[2].title='区县申报进度';
  }else if(state.role==='county'){
    findings[0].title='机构建设任务';findings[0].action=gaps.length?`将${fullName(gaps[0])}未建任务落实到具体基层机构，确定建设完成时间。`:'维护本区县机构名册。';
    findings[1].title='基层开诊情况';findings[2].title='材料上报准备';findings[2].action='汇总下辖基层机构建设表单和照片，补齐被退回的项目后提交省级审核。';
  }else if(state.role==='consortium'){
    findings[0].title='成员机构建设支持';findings[0].action=gaps.length?`医共体统筹人员、设备和培训资源，协助${fullName(gaps[0])}完成建设。`:'支持成员机构维持建设能力。';
    findings[1].title='成员机构开诊支持';findings[1].action=unused.length?`向${fullName(unused[0])}安排全科与专科支持，确认服务记录能正常传送。`:'跟踪成员机构服务质量。';
    findings[2].title='成员机构材料进度';
  }
  return findings
};

function reviewDetail(item){
  const node=clinics.find(x=>x.name===item.name),flags=item.flags||[],fields=[['申报机构',item.name],['机构统一代码',item.code||`DEMO-${node?.adcode||'330000'}-0001`],['所属区县',item.county],['详细地址',item.address||`${item.county}健康路18号（演示）`],['申报层级',clinicTierLabel[item.tier]||item.tier],['建成日期',item.date||'2026-09-20'],['联系人',item.contact||'王医生'],['联系电话',item.phone||'13800001001']];
  const material=(label,files)=>`<div class="review-material"><b>${label}</b><span>${files?.length?files.map(x=>x.url&&x.type?.startsWith('image/')?`<a href="${esc(x.url)}" target="_blank" rel="noopener" class="review-thumbnail"><img src="${esc(x.url)}" alt="${esc(x.name)}"><small>${esc(x.name)}</small></a>`:esc(x.name)).join('、'):'未上传可预览文件'}</span></div>`;
  drawer(`${item.name} · 建设申报`, `<div class="detail">审核状态：${esc(item.status)} · 申请时间：${esc(item.submittedAt||'2026-10-01 09:30')}</div><div class="drawer-section"><h3>申报表单</h3><div class="review-fields">${fields.map(([name,value])=>`<div><small>${esc(name)}</small><b>${esc(value)}</b></div>`).join('')}</div></div><div class="drawer-section"><h3>建设清单</h3><p>基本保障：${esc(item.checks?.basic||'9/9 项符合')}；强化功能：${esc(item.checks?.enhanced||'未申报')}；鼓励探索：${esc(item.checks?.explore||'未申报')}。</p></div><div class="drawer-section"><h3>上传材料</h3>${material('门诊标识与机构名称同框照片',item.files?.logo)}${material('诊前、诊中、诊后及设备照片',item.files?.site)}${material('补充佐证材料',item.files?.other)}${item.files?.logo?.length||item.files?.site?.length?'<p>仅当前会话实际上传的图片支持预览；演示记录展示材料名称。</p>':''}</div><div class="drawer-section"><h3>AI 辅助审核</h3>${flags.length?flags.map(flag=>`<div class="review-flag review-flag-error"><b>需人工复核：</b>${esc(flag)}<br><small>${flag.includes('代码')?'机构代码与机构名录对应关系不一致。':flag.includes('照片')?'申报的建设结论与佐证照片不一致。':'申报为已开诊，但接口尚未识别本期服务记录。'}</small></div>`).join(''):'<div class="review-flag ok">暂未发现规则疑点，仍需人工审核原始材料。</div>'}</div>${state.role==='province'?`<div class="drawer-section"><h3>审核决定</h3><button type="button" class="outline" id="acceptAiReason" ${flags.length?'':'disabled'}>采纳 AI 建议</button><label class="field">审核意见<textarea id="reviewOpinion" rows="3" placeholder="填写审核依据或退回原因">${esc(item.opinion||'')}</textarea></label><div class="review-action"><button class="primary" data-review-result="pass">审核通过</button><button type="button" class="outline" data-review-result="return">退回修改</button></div><div id="reviewResult" class="result" aria-live="polite"></div></div>`:''}`);
  const accept=$('acceptAiReason');if(accept)accept.onclick=()=>{$('reviewOpinion').value=flags.map(x=>`请补充说明：${x}`).join('；')};
  document.querySelectorAll('[data-review-result]').forEach(button=>button.onclick=()=>{const opinion=$('reviewOpinion').value.trim();if(!opinion){$('reviewResult').className='result show bad';$('reviewResult').textContent='请填写审核意见或退回原因';return}item.status=button.dataset.reviewResult==='pass'?'审核通过':'退回补充';item.opinion=opinion;closeDrawer();render()});
}

function clinicReviewList(){
  const me=currentNode(),queue=reviewItems().filter(x=>state.role==='province'||state.role==='city'&&x.county.startsWith(me.name)||state.role==='county'&&x.county===fullName(me)||state.role==='consortium'&&clinics.some(c=>c.name===x.name&&c.consortiumName===me.name)),size=state.pageSizes?.review||10,page=Math.min(state.reviewPage||1,Math.max(1,Math.ceil(queue.length/size))),rows=queue.slice((page-1)*size,page*size);
  return panel(state.role==='province'?'建设审核与认定':'下辖机构建设认定',`<div class="table-wrap scope-table"><table><thead><tr><th>机构名称</th><th>所属区县</th><th>申报层级</th><th>AI 疑点</th><th>审核状态</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td><button type="button" class="link review-name" data-review-name="${esc(x.name)}">${esc(x.name)}</button></td><td>${esc(x.county)}</td><td>${esc(clinicTierLabel[x.tier])}</td><td>${x.flags.length?`<span class="review-error">${x.flags.length} 项待复核</span>`:'未标注'}</td><td>${esc(x.status)}</td><td><button type="button" class="link" data-review-name="${esc(x.name)}">查看表单与材料</button></td></tr>`).join('')||'<tr><td colspan="6">暂无申报记录</td></tr>'}</tbody></table></div><div class="list-pagination"><span>共 ${queue.length} 条</span><button type="button" data-review-page="${page-1}" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${Math.max(1,Math.ceil(queue.length/size))}</strong><button type="button" data-review-page="${page+1}" ${page>=Math.ceil(queue.length/size)?'disabled':''}>下一页</button></div>`);
}

function enhanceClinicScopeTable(){
  const section=[...$('view').querySelectorAll(':scope > .panel')].find(x=>x.querySelector('h2')?.textContent.includes('一体化门诊建设情况'));
  const table=section?.querySelector('table');if(!table)return;
  const head=table.querySelector('thead tr');for(const label of ['待审核','退回修改']){const th=document.createElement('th');th.textContent=label;head.insertBefore(th,head.lastElementChild)}
  for(const row of table.querySelectorAll('tbody tr')){
    const name=row.querySelector('[data-region]')?.dataset.region,node=[...clinics,...consortia,...counties,...cities].find(x=>x.name===name),count=node?tierCounts(node):{basic:0,enhanced:0,explore:0};
    const tier=row.cells[5];tier.replaceChildren();const span=document.createElement('span');span.className='tier-counts';span.textContent=`基础 ${count.basic} · 强化 ${count.enhanced} · 探索 ${count.explore}`;tier.append(span);
    const records=reviewItems().filter(x=>node&&(x.name===node.name||x.county===fullName(node)||x.county.startsWith(node.name)));
    for(const status of ['待省级审核','退回补充']){const td=document.createElement('td');td.textContent=`${records.filter(x=>x.status===status).length} 家`;row.insertBefore(td,row.lastElementChild)}
  }
}

const renderBeforeIntegratedClinic=render;
render=function(){
  if(state.page==='clinic')state.clinicTab='overview';
  renderBeforeIntegratedClinic();
  if(state.page==='clinic'){
    const view=$('view');view.querySelector('.clinic-tabs')?.remove();
    if(state.role==='clinic'){
      view.querySelector('.kpis')?.remove();view.querySelector('.clinic-grid')?.remove();view.querySelector(':scope > .panel:last-child')?.remove();
      const node=currentNode(),record=state.submissions.find(x=>x.name===node?.name)||reviewItems().find(x=>x.name===node?.name);
      if(record&&record.status!=='退回补充'&&record.status!=='机构草稿')view.insertAdjacentHTML('beforeend',panel('本机构建设认定',`<div class="tier-badge">${record.status==='审核通过'?clinicTierLabel[record.tier]:'审核中'}</div><p>${record.status==='审核通过'?'本机构建设等级已认定。':'申请已提交，省级审核尚未完成，请等待审核结果。'}</p><button type="button" class="link" data-review-name="${esc(record.name)}">查看申报材料</button>`));
      else{
        const temp=document.createElement('div');temp.innerHTML=report();const form=temp.querySelector('.panel');if(form){view.appendChild(form);const county=$('county'),name=$('name'),submit=$('checkReport');if(county){county.value=node.cityName+node.county;county.disabled=true}if(name){name.value=node.name;name.readOnly=true}if(submit){submit.textContent='校验并保存草稿';submit.addEventListener('click',checkReport)}}
        if(record?.status==='退回补充')view.insertAdjacentHTML('afterbegin',panel('退回修改',`<div class="review-flag review-flag-error">${esc(record.opinion||'请根据审核意见补充建设材料')}</div>`));
      }
    }else{
      if(state.role==='province'){view.querySelector('.clinic-grid .panel:last-child')?.remove();view.querySelector('.clinic-grid')?.classList.add('single-column')}
      const overview=view.querySelector('.clinic-grid');if(overview)overview.insertAdjacentHTML('afterend',clinicReviewList());
      enhanceClinicScopeTable();
    }
    view.querySelectorAll('.clinic-grid [data-clinic-tab]').forEach(button=>button.remove());
  }
  document.querySelector('.top .brand-mark')?.remove();
  const help=$('help'),picker=$('rolePicker');if(help&&picker)help.style.height=`${picker.getBoundingClientRect().height}px`;
  enhancePagers();
};
document.addEventListener('click',event=>{const button=event.target.closest('[data-review-name]');if(button){const item=state.submissions.find(x=>x.name===button.dataset.reviewName)||reviewItems().find(x=>x.name===button.dataset.reviewName);if(item)reviewDetail(item)}});
document.addEventListener('change',event=>{if(!event.target.matches('[data-page-size]'))return;const kind=event.target.dataset.pageSize;state.pageSizes||={};state.pageSizes[kind]=Number(event.target.value);if(kind==='review')state.reviewPage=1;else{state.listPages||={};state.listPages[kind]=1}render()});
const checkReportBeforeEvidence=checkReport;
checkReport=function(){
  const previousCount=state.submissions.length;
  const inputs={code:$('code')?.value,address:$('address')?.value,contact:$('contact')?.value,phone:$('phone')?.value},files={logo:[...($('logoPhoto')?.files||[])],site:[...($('sitePhotos')?.files||[])],other:[...($('otherFiles')?.files||[])]};
  const name=$('name')?.value,checks={};for(const level of ['basic','enhanced','explore']){const values=[...document.querySelectorAll(`[data-check="${level}"]`)].map(x=>x.value);checks[level]=values.length?`${values.filter(x=>x==='yes').length}/${values.length} 项符合`:'未填写'}
  checkReportBeforeEvidence();const item=state.submissions.length>previousCount?state.submissions.find(x=>x.name===name):null;if(item)Object.assign(item,inputs,{files:Object.fromEntries(Object.entries(files).map(([key,values])=>[key,values.map(file=>({name:file.name,type:file.type,url:URL.createObjectURL(file)}))])),checks});
};
assistant.querySelector('.assistant-result-head')?.remove();
render();

function populationFindings(){
  const units=comparisonUnits(),p=populationData(),province=populationDataFor(cities),provinceCoverage=province.managed/province.diagnosed*100,localCoverage=p.managed/p.diagnosed*100;
  const name=x=>fullName(x),cover=x=>popCoverage(x),risk=x=>{let d=populationFor(x);return d.managedHigh*.25+d.managedDiabetes*.31},load=x=>risk(x)/Math.max(1,x.active),provinceLoad=counties.reduce((n,x)=>n+risk(x),0)/Math.max(1,sum(cities,'active'));
  const coverRows=[...units].filter(x=>cover(x)<provinceCoverage).sort((a,b)=>cover(a)-cover(b));
  const loadRows=[...units].filter(x=>load(x)>provinceLoad).sort((a,b)=>load(b)-load(a));
  const inactiveRows=[...units].filter(x=>x.clinics&&x.active/x.clinics<sum(cities,'active')/sum(cities,'clinics')).sort((a,b)=>a.active/Math.max(1,a.clinics)-b.active/Math.max(1,b.clinics));
  const kind=state.role==='province'?'区县':state.role==='city'?'区县':state.role==='county'?'医共体及基层机构':state.role==='consortium'?'基层机构':'本机构';
  const make=(title,signal,finding,action,rows,metric,evidence)=>({title,signal,finding,action,evidence,rows:rows.map(x=>[name(x),metric(x)]),stats:[['当前机构确诊',people(p.diagnosed)],['当前机构专档',people(p.managed)],['当前机构覆盖率',formatPct(localCoverage)],['全省同期覆盖率',formatPct(provinceCoverage)]]});
  if(state.role==='clinic'){
    let x=currentNode(),county=counties.find(c=>c.adcode===x.adcode),countyCoverage=cover(county),countyLoad=load(county),items=[
      make('本机构专档服务安排',formatPct(cover(x)),`本机构专档覆盖率 ${formatPct(cover(x))}，所属区县 ${formatPct(countyCoverage)}；${cover(x)<countyCoverage?'低于区县同期水平，需关注现有门诊和团队的服务安排。':'高于区县同期水平，继续观察服务连续性。'}`,'按高血压、糖尿病分别查看已确诊和在管人数，调整本机构门诊时段与团队排班。',[x],y=>`${formatPct(cover(y))} · 确诊 ${people(populationFor(y).diagnosed)} · 专档 ${people(populationFor(y).managed)}`,'本机构与所属区县比较'),
      make('高风险病种服务安排',`${people(risk(x))} 病种人次`,`本机构高风险病种服务量 ${people(risk(x))}，每家有效启用门诊对应 ${people(load(x))}；所属区县为 ${people(countyLoad)}。高糖同患按两个病种分别计入。`,'把高风险病种患者优先纳入强化随访时段，必要时向医共体申请专科支持。',[x],y=>`高风险 ${people(risk(y))} · 每家门诊 ${people(load(y))}`,'高风险病种数与有效启用门诊比较'),
      make('服务能力与门诊启用',x.active?'已启用':'未启用',`本机构${x.clinics?'已建成门诊':'尚未建成门诊'}，${x.active?'已有有效开诊记录。':'本周期没有有效开诊记录，现有高风险服务需要协调承接。'}`,'核对实际排班与接口记录，安排开诊或由医共体承接，并在下一周期观察服务量。',[x],y=>`已建 ${y.clinics} 家 · 有效启用 ${y.active} 家`,'建设数据与服务记录')
    ];return {items,units,baseline:provinceCoverage};
  }
  const scopeTitle={province:'全省区县',city:'辖区区县',county:'辖区基层机构',consortium:'成员机构'}[state.role];
  let items=[
    make(`${scopeTitle}专档覆盖差异`,`${coverRows.length} / ${units.length} 个${kind}`,`${coverRows.length} 个${kind}的覆盖率低于全省同期 ${formatPct(provinceCoverage)}；${coverRows[0]?`${name(coverRows[0])}为 ${formatPct(cover(coverRows[0]))}`:'当前无低于全省同期的单位'}。`,`${state.role==='province'?'将低覆盖区县列入省级季度资源配置讨论':state.role==='city'?'与低覆盖区县商定季度专档服务安排':state.role==='county'?'协调医共体调整基层服务时段':'调整成员机构的慢病团队排班'}，优先处理差距最大且确诊规模较大的单位。`,coverRows,x=>`覆盖 ${formatPct(cover(x))} · 确诊 ${people(populationFor(x).diagnosed)} · 专档 ${people(populationFor(x).managed)}`,`当前机构 ${formatPct(localCoverage)} · 全省 ${formatPct(provinceCoverage)}`),
    make(`${scopeTitle}高风险服务负荷`,`${loadRows.length} 个高于省均`,`以高风险病种数除以有效启用门诊数比较，${loadRows.length} 个${kind}高于全省每家 ${people(provinceLoad)}；${loadRows[0]?`${name(loadRows[0])}最高，为每家 ${people(load(loadRows[0]))}`:'当前无高于省均的单位'}。`,`将强化随访、专科下沉及转诊时段优先配置到${loadRows[0]?name(loadRows[0]):regionLabel()}，观察下期每家门诊的服务量。`,loadRows,x=>`高风险 ${people(risk(x))} · 启用 ${x.active} 家 · 每家 ${people(load(x))}`,`全省每家有效启用门诊 ${people(provinceLoad)}`),
    make(`${scopeTitle}门诊承接差异`,`${inactiveRows.length} 个偏低`,`${inactiveRows.length} 个${kind}的有效启用率低于全省同期；${inactiveRows[0]?`${name(inactiveRows[0])}已建 ${inactiveRows[0].clinics} 家、有效启用 ${inactiveRows[0].active} 家`:'当前无低于全省同期的单位'}。`,`先推动${inactiveRows[0]?name(inactiveRows[0]):regionLabel()}的已建门诊稳定开诊，再判断是否需要新增门诊和人员。`,inactiveRows,x=>`已建 ${x.clinics} 家 · 启用 ${x.active} 家 · 启用率 ${rate(x.active,x.clinics)}%`,`全省有效启用率 ${rate(sum(cities,'active'),sum(cities,'clinics'))}%`)
  ];return {items,units,baseline:provinceCoverage};
};

// Compare peers at one administrative level. At the last level, describe the
// selected institution directly rather than inventing a one-item ranking.
populationFindings=function(){
  const node=currentNode(),level=state.city==='all'?'province':state.city.split(':')[0];
  const parent=level==='clinic'?counties.find(x=>x.adcode===node.adcode):null;
  const units=level==='province'?counties:level==='city'?counties.filter(x=>x.cityName===node.name):level==='county'?clinics.filter(x=>x.adcode===node.adcode):level==='consortium'?clinics.filter(x=>x.consortiumName===node.name):[node];
  const upper=level==='province'?cities:level==='city'?consortia.filter(x=>x.cityName===node.name):level==='county'?consortia.filter(x=>x.adcode===node.adcode):[];
  const label={province:'区县',city:'区县',county:'基层机构',consortium:'成员机构',clinic:'本机构'}[level];
  const baseNode=parent||null,baseName=parent?'所属区县':'当前范围';
  const current=state.city==='all'?populationDataFor(cities):populationFor(node);
  const coverBase=current.managed/current.diagnosed*100;
  const riskBase=selectedRiskProfile().high/current.managed*100;
  const visits=visitsForSelection(),visitBase=visits.primary/(visits.primary+visits.hospital)*100;
  const baselines=baseNode?[popCoverage(baseNode),riskProfileFor(baseNode).high/populationFor(baseNode).managed*100,primaryShare(baseNode)]:[coverBase,riskBase,visitBase];
  const metrics=[x=>popCoverage(x),x=>riskProfileFor(x).high/populationFor(x).managed*100,x=>primaryShare(x)];
  const titles=['专档覆盖','高风险占比','基层就诊流向'];
  const descriptions=[x=>{let p=populationFor(x);return `确诊 ${people(p.diagnosed)} · 专档 ${people(p.managed)} · 覆盖 ${formatPct(popCoverage(x))}`},x=>`高风险 ${people(riskProfileFor(x).high)} · 纳管 ${people(populationFor(x).managed)} · 占比 ${formatPct(metrics[1](x))}`,x=>{let v=visitsFor(x);return `基层 ${people(v.primary)} · 等级医院 ${people(v.hospital)} · 基层就诊率 ${formatPct(metrics[2](x))}`}];
  const actions={province:['请覆盖率偏低的区县所在市明确专档服务改进计划，省级跟踪下期变化。','请高风险占比偏高的市组织病例讨论，结合血压、血糖控制结果判断管理短板。','请相关市复盘基层接诊时段、转诊记录与病情结构，调整区域服务安排。'],city:['与相关区县商定专档服务安排并跟踪执行。','组织医共体复盘高风险患者随访与转诊。','协调区县优化基层接诊与医共体转诊衔接。'],county:['协调医共体和基层机构调整专档服务安排。','安排医共体对高风险占比偏高的基层机构提供病例讨论和技术支持。','调整基层慢病门诊接诊时段，观察后续就诊流向。'],consortium:['对成员机构分配专档服务支持和培训。','向高风险占比偏高的成员机构提供专科支持。','优化成员机构接诊和双向转诊安排。'],clinic:['结合确诊人数和现有专档服务量，调整本机构团队排班。','复盘高风险患者的随访和控制情况，安排强化随访与必要转诊。','结合本机构就诊记录，优化接诊时段和转诊衔接。']}[level];
  const items=metrics.map((metric,i)=>{
    const baseline=baselines[i],descending=i===1;
    const ordered=[...units].sort((a,b)=>descending?metric(b)-metric(a):metric(a)-metric(b));
    const problem=ordered.filter(x=>descending?metric(x)>baseline+.05:metric(x)<baseline-.05);
    const lowest=[...units].sort((a,b)=>metric(a)-metric(b))[0],highest=[...units].sort((a,b)=>metric(b)-metric(a))[0];
    const below=units.filter(x=>metric(x)<baseline-.05).length,above=units.filter(x=>metric(x)>baseline+.05).length,equal=units.length-below-above;
    const counts=`${below} 个低于平均水平，${above} 个高于平均水平${equal?`，${equal} 个与平均水平持平`:''}`;
    const metricName=['专档覆盖率','高风险患者占比','基层就诊率'][i];
    const self=level==='clinic';
    let finding;
    if(self){
      const value=metric(node),delta=Math.abs(Number(value.toFixed(1))-Number(baseline.toFixed(1))).toFixed(1),relation=value<baseline-.05?'低于':value>baseline+.05?'高于':'与';
      finding=`本机构${metricName} ${formatPct(value)}，${baseName} ${formatPct(baseline)}；${relation==='与'?'与所属区县水平持平':`${relation}所属区县 ${delta} 个百分点`}。${i===0?`本机构确诊 ${people(current.diagnosed)}，专档 ${people(current.managed)}。`:i===1?`高风险患者 ${people(riskProfileFor(node).high)}，纳管患者 ${people(current.managed)}。`:`基层就诊 ${people(visits.primary)}，等级医院就诊 ${people(visits.hospital)}。`}`;
    }else{
      const worst=problem[0];
      const upperLabel={province:'市',city:'医共体',county:'医共体'}[level];
      const upperWorst=upper.length?[...upper].sort((a,b)=>descending?metric(b)-metric(a):metric(a)-metric(b))[0]:null;
      finding=`${units.length} 个${label}中，${counts}（${baseName} ${formatPct(baseline)}）。${worst?`其中${descending?'高风险占比最高':'最低'}的${fullName(worst)}：${descriptions[i](worst)}。`:''}${lowest&&highest&&lowest!==highest?`最高为${fullName(highest)} ${formatPct(metric(highest))}，最低为${fullName(lowest)} ${formatPct(metric(lowest))}。`:''}${upperWorst?`${upper.length} 个${upperLabel}汇总中，${descending?'高风险占比最高':'该指标最低'}的是${fullName(upperWorst)} ${formatPct(metric(upperWorst))}。`:''}`;
    }
    return {title:titles[i],signal:self?formatPct(metric(node)):`${problem.length} / ${units.length} 个${label}`,finding,action:actions[i],rows:(self?[node]:problem).map(x=>[fullName(x),descriptions[i](x)]),stats:[]};
  });
  return {items,units,baseline:baselines[0]};
};
state.periodMode='year';
render();

const mascotFaces=['mascot-head.svg','mascot-expression-1.svg','mascot-expression-2.svg','mascot-expression-3.svg'];
let mascotFace=0,launcherMoved=false;
const mascotImage=assistantLauncher.querySelector('img');
function setMascotFace(next){mascotFace=(next+mascotFaces.length)%mascotFaces.length;mascotImage.src=mascotFaces[mascotFace];assistant.querySelector('.assistant-head img').src=mascotFaces[mascotFace]}
assistant.querySelector('.assistant-face')?.remove();
function updateMascotWarning(){
  if(state.page!=='population'){assistantLauncher.dataset.warning='点击查看当前机构的分析建议';return}
  const p=populationData(),coverage=p.managed/p.diagnosed*100;
  assistantLauncher.dataset.warning=`${regionLabel()}专档覆盖率 ${formatPct(coverage)}，点击查看分析`;
}
assistantLauncher.addEventListener('mouseenter',()=>{setMascotFace(1);updateMascotWarning()});
assistantLauncher.addEventListener('mouseleave',()=>setMascotFace(0));
assistantLauncher.addEventListener('contextmenu',event=>{event.preventDefault();setMascotFace(mascotFace+1)});
const renderWithMascot=render;
render=function(){renderWithMascot();updateMascotWarning()};
render();

function demoTeamRows(clinic){
  const p=populationFor(clinic),risk=riskProfileFor(clinic),teamDiagnosed=[.38,.34,.28],teamManaged=[.35,.37,.28];
  return teamDiagnosed.flatMap((share,i)=>{
    const teamName=`${clinic.name} · 全科${i+1}团队（演示）`,teamP={diagnosed:p.diagnosed*share,managed:p.managed*teamManaged[i]};
    const team={name:teamName,depth:0,p:teamP,r:{high:risk.high*teamManaged[i],middle:risk.middle*teamManaged[i],low:risk.low*teamManaged[i]}};
    const doctors=[.53,.47].map((part,j)=>({name:`${teamName} · 医生${j+1}（演示）`,depth:1,p:{diagnosed:teamP.diagnosed*part,managed:teamP.managed*part},r:{high:team.r.high*part,middle:team.r.middle*part,low:team.r.low*part}}));
    return [team,...doctors];
  });
}
const scopeExplorerWithTeams=scopeExplorer;
scopeExplorer=function(kind){
  const level=state.city==='all'?'province':state.city.split(':')[0];
  if(kind!=='population'||!['consortium','clinic'].includes(level))return scopeExplorerWithTeams(kind);
  const clinicsInScope=level==='clinic'?[currentNode()]:clinics.filter(x=>x.consortiumName===currentNode().name);
  const rows=level==='clinic'?demoTeamRows(currentNode()):clinicsInScope.flatMap(clinic=>{
    const p=populationFor(clinic),r=riskProfileFor(clinic);
    return [{name:clinic.name,depth:0,p,r},...demoTeamRows(clinic).filter(row=>row.depth===0).map(row=>({...row,depth:1}))];
  });
  const size=state.pageSizes?.population||10,page=Math.min(state.listPages?.population||1,Math.max(1,Math.ceil(rows.length/size))),slice=rows.slice((page-1)*size,page*size);
  const headcount=n=>`${Math.round(n*10000).toLocaleString('zh-CN')} 人`;
  const body=slice.map(row=>`<tr data-depth="${row.depth}"><td style="padding-left:${12+row.depth*18}px">${esc(row.name)}</td><td>${headcount(row.p.diagnosed)}</td><td>${headcount(row.p.managed)}</td><td>${headcount(row.p.diagnosed-row.p.managed)}</td><td>${formatPct(row.p.managed/row.p.diagnosed*100)}</td><td>${headcount(row.r.high)}</td><td>${headcount(row.r.middle)}</td><td>${headcount(row.r.low)}</td></tr>`).join('');
  return `<section class="panel"><div class="scope-toolbar"><h2>${level==='clinic'?'本机构团队与医生':'成员机构与团队'}人群情况</h2></div><div class="table-wrap scope-table"><table><thead><tr><th>机构 / 团队 / 医生</th><th>确诊人数</th><th>专档纳管患者数</th><th>两者差额</th><th>专档覆盖率</th><th>高风险患者数</th><th>中风险患者数</th><th>低风险患者数</th></tr></thead><tbody>${body}</tbody></table></div><div class="list-pagination"><span>共 ${rows.length} 条 · 每页 ${size} 条</span><button data-list-page="${page-1}" data-list-kind="population" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${Math.max(1,Math.ceil(rows.length/size))}</strong><button data-list-page="${page+1}" data-list-kind="population" ${page>=Math.ceil(rows.length/size)?'disabled':''}>下一页</button></div></section>`;
};
const originalTierDrawerFinal=tierDrawer;
tierDrawer=function(tier){
  originalTierDrawerFinal(tier);
  const detail=$('drawerBody').querySelector('.detail');
  if(detail)detail.innerHTML=`<p>${esc(regionLabel())} · 基本保障：场地、设备、人员和诊前诊中诊后基本流程；强化功能：在基本保障上增加检查协同、风险分层及专科支持；鼓励探索：开展多病共管、异常闭环和示教创新。三类清单按建设难度递进，具体认定以省级审核为准。</p>`;
};
render();

const previousAssistantItemsFinal=assistantItems;
assistantItems=function(){if(state.page==='clinic')return constructionFindings();if(state.page==='service')return processFindings();return previousAssistantItemsFinal()};
const previousServicePage=service;
service=function(){
  const node=currentNode(),units=node?[node]:cities,weighted=(field,offset=0)=>Math.round(units.reduce((n,x)=>n+x.should*(x[field]+offset),0)/Math.max(1,sum(units,'should'))),base=weighted('follow'),entry=weighted('entry');
  const stages=[['路径入径率',entry],['诊前采集率',Math.min(100,base+2)],['诊中节点执行率',Math.max(0,base-2)],['诊后追踪率',Math.max(0,base-12)]];
  const checks=[['血压',Math.min(100,base+4),Math.max(0,base-31)],['血糖',Math.max(0,base-2),Math.max(0,base-40)],['糖化血红蛋白',Math.max(0,base-16),Math.max(0,base-45)],['低密度脂蛋白',Math.max(0,base-25),Math.max(0,base-53)],['BMI / 腰围',Math.min(100,base+3),Math.max(0,base-36)]];
  const closure=[['异常复查完成率',Math.max(0,base-17),'到期异常结果的同项目复测'],['异常闭环率',Math.max(0,base-21),'有处置、结果和责任人的异常事件'],['诊间随访率',Math.max(0,base-50),'两慢病诊间随访 / 全部随访']];
  return `<div class="process-page"><section class="panel"><div class="panel-head"><h2>路径执行</h2><span class="muted">按患者和应执行节点分别统计</span></div><div class="process-steps process-journey">${stages.map(([name,value],i)=>`<div class="process-step"><small>${value}%</small><span class="process-step-icon">${['↪','◫','▣','✓'][i]}</span><span>${name}</span></div>`).join('')}</div></section><div class="process-detail-grid"><section class="panel"><div class="panel-head"><h2>核心监测</h2><span class="muted">按适用人群与检查时窗</span></div><div class="table-wrap"><table class="process-table"><thead><tr><th>项目</th><th>检测率</th><th>漏测率</th><th>异常率</th></tr></thead><tbody>${checks.map(([name,detected,abnormal])=>`<tr><th scope="row">${name}</th><td>${detected}%</td><td>${100-detected}%</td><td>${abnormal}%</td></tr>`).join('')}</tbody></table></div></section><section class="panel"><div class="panel-head"><h2>服务闭环</h2></div><div class="process-closure">${closure.map(([name,value,desc])=>`<div><span>${name}</span><strong>${value}%</strong><small>${desc}</small></div>`).join('')}</div></section></div></div>`;
};
pages.service=service;
function processFindings(){
  const node=currentNode(),units=comparisonUnits(),scope=regionLabel(),provinceEntry=sum(cities,'entry')/cities.length,rank=[...units].sort((a,b)=>a.entry-b.entry),low=rank.filter(x=>x.entry<provinceEntry),monitor=[...units].sort((a,b)=>a.follow-b.follow),abnormal=[...units].sort((a,b)=>(a.follow-17)-(b.follow-17));
  const level=scopeLevel(),target={province:'督促相关市制定路径执行改进计划，并跟踪区县差异',city:'组织区县和医共体复盘路径执行断点',county:'安排医共体指导基层机构完善诊前采集和检测',consortium:'协调成员机构人员培训及检查资源',clinic:'调整本机构门诊排班、检测与异常处置流程'}[level];
  const self=level==='clinic',prefix=self?'本机构':`${units.length} 个下辖单位中`;
  return [
    {title:'入径与路径衔接',signal:`${node?node.entry:Math.round(provinceEntry)}% 入径率`,finding:self?`本机构入径率 ${node.entry}%，所属区县 ${counties.find(x=>x.adcode===node.adcode)?.entry}%。需要比较确诊、在管与实际就诊人群，明确哪些患者尚未进入路径。`:`${prefix} ${low.length} 个入径率低于全省同期 ${formatPct(provinceEntry)}；${rank[0]?`${fullName(rank[0])}最低，为 ${rank[0].entry}%。`:''}优先核对确诊人数较多且入径率偏低的单位。`,action:`${target}；按同一统计期复看入径率及诊前采集率。`,rows:rank.slice(0,10).map(x=>[fullName(x),`入径 ${x.entry}% · 诊前采集 ${x.follow+2}%`])},
    {title:'检测项目薄弱环节',signal:`${monitor[0]?.follow-16||0}% HbA1c检测`,finding:`${scope}的 HbA1c 与 LDL-C 检测率低于血压、血糖等基础项目；${monitor[0]?`${fullName(monitor[0])}核心监测完成率在当前范围最低。`:''}需按应检人群和检查时窗区分项目缺口。`,action:`${target}；核对 HbA1c、LDL-C 的应检名单、检查排期和医共体检验协同，下期比较项目检测率。`,rows:monitor.slice(0,10).map(x=>[fullName(x),`血压 ${x.follow+4}% · HbA1c ${Math.max(0,x.follow-16)}% · LDL-C ${Math.max(0,x.follow-25)}%`])},
    {title:'异常发现后的处置',signal:`${abnormal[0]?.follow-17||0}% 复查完成率`,finding:`${scope}的异常复查完成率低于诊前采集率；${abnormal[0]?`${fullName(abnormal[0])}异常复查完成率 ${Math.max(0,abnormal[0].follow-17)}%，为当前范围最低。`:''}只有检测记录，无法证明异常患者已得到后续服务。`,action:`${target}；对到期异常结果安排同项目复测，记录处置结果与责任人；需要转诊的再跟踪接诊结果。`,rows:abnormal.slice(0,10).map(x=>[fullName(x),`异常复查 ${Math.max(0,x.follow-17)}% · 异常闭环 ${Math.max(0,x.follow-21)}%`])}
  ];
}

regionDetail=function(name){
  if(state.page==='dashboard'){
    const current=currentNode();
    const target=state.mapScope==='county'
      ?counties.find(x=>x.name===name&&(!current||scopeLevel()==='province'||x.cityName===(scopeLevel()==='city'?current.name:current.cityName)))
      :cities.find(x=>x.name===name);
    if(target){state.city=nodeKey(target);state.mapScope='county';mapZoom=1;render();return}
  }
  const node=[...clinics,...consortia,...counties,...cities].find(x=>x.name===name);if(!node)return;
  const title=fullName(node),p=populationFor(node),metrics=clinicMetrics(node),reference=node.cityName?counties.find(x=>x.adcode===node.adcode):null,records=reviewInScope(node),children=node.clinicIndex?[node]:nodeChildren(node),tier=tierCounts(node);
  const section=(heading,content)=>`<div class="drawer-section"><h3>${heading}</h3>${content}</div>`;
  const evidence=(rows)=>`<div class="drawer-evidence">${rows.map(([label,value])=>`<div>${esc(label)}<b>${esc(value)}</b></div>`).join('')}</div>`;
  let findings,action,proof;
  if(state.page==='population'){
    const coverage=popCoverage(node),compare=reference?popCoverage(reference):popCoverage(cities.find(x=>x.name===node.name)||node),weak=children.filter(x=>popCoverage(x)<coverage).sort((a,b)=>popCoverage(a)-popCoverage(b));
    findings=`${title}确诊 ${people(p.diagnosed)}、专档纳管 ${people(p.managed)}，覆盖率 ${formatPct(coverage)}。${reference?`所属区县为 ${formatPct(compare)}。`:''}${weak.length&&children.length>1?`${weak.length} 个下级单位低于本级覆盖率，${fullName(weak[0])}为 ${formatPct(popCoverage(weak[0]))}。`:''}`;
    action=`结合${weak[0]?fullName(weak[0]):'本机构'}的确诊规模与专档服务量，安排慢病团队服务时段；下期观察专档覆盖和高风险占比变化。`;
    proof=evidence([['确诊人数',people(p.diagnosed)],['专档纳管',people(p.managed)],['专档覆盖率',formatPct(coverage)],['下级低于本级',weak.length+' 个']]);
  }else if(state.page==='clinic'){
    const gap=metrics.eligible-metrics.built,unused=metrics.built-metrics.active;
    findings=`${title}应建 ${metrics.eligible} 家，已建 ${metrics.built} 家，未建 ${gap} 家；有效启用 ${metrics.active} 家，建而未用 ${unused} 家。当前范围待省级审核 ${records.filter(x=>x.status==='待省级审核').length} 家、退回修改 ${records.filter(x=>x.status==='退回补充').length} 家。`;
    action=`${gap?'对未建机构明确场地、人员和完工日期；':''}${unused?'对已建未用机构复盘排班与服务记录；':''}按省级退回意见补充申报材料。`;
    proof=evidence([['应建机构',metrics.eligible+' 家'],['已建成',metrics.built+' 家'],['有效启用',metrics.active+' 家'],['能力分层',`基础 ${tier.basic} · 强化 ${tier.enhanced} · 探索 ${tier.explore}`]]);
  }else if(state.page==='service'){
    findings=`${title}路径入径率 ${node.entry}%，诊前采集率 ${node.follow+2}%，诊中节点执行率 ${node.follow-2}%，诊后追踪率 ${node.follow-12}%；异常复查完成率 ${node.follow-17}%。目前应优先核对诊后追踪与异常复查的责任和时限。`;
    action='按应检名单安排检查；对到期异常结果落实同项目复测、处置记录与责任人，下期分别复看漏测率和异常复查完成率。';
    proof=evidence([['路径入径率',node.entry+'%'],['诊中节点执行率',node.follow-2+'%'],['诊后追踪率',node.follow-12+'%'],['异常复查完成率',node.follow-17+'%']]);
  }else{drawer(title,`<div class="detail">${esc(periodText())}</div>${section('当前机构',evidence([['确诊人数',people(p.diagnosed)],['专档纳管',people(p.managed)],['建设覆盖率',rate(metrics.built,metrics.eligible)+'%']]))}`);return}
  drawer(`${title} · 详情分析`,`<div class="detail">${esc(periodText())} · ${esc(title)}</div>${section('分析结果',`<p>${esc(findings)}</p>`)}${section('建议执行',`<p>${esc(action)}</p>`)}${section('判断依据',proof)}`);
};

const renderBeforeFinalScope=render;
render=function(){renderBeforeFinalScope();if(state.page==='clinic'){
  const view=$('view'),overview=view.querySelector('.clinic-grid'),list=[...view.querySelectorAll(':scope > .panel')].find(x=>x.querySelector('h2')?.textContent.includes('一体化门诊建设情况')),review=[...view.querySelectorAll(':scope > .panel')].find(x=>x.querySelector('h2')?.textContent.includes('建设审核与认定'));
  if(list&&review)list.after(review);
  if(scopeLevel()==='clinic'){view.querySelector('.kpis')?.remove();view.querySelector('.clinic-grid')?.remove();list?.remove();review?.remove();if(!view.querySelector('h2')?.textContent.includes('本机构建设')){const node=currentNode(),record=reviewInScope(node)[0];view.insertAdjacentHTML('afterbegin',panel('本机构建设认定',`<div class="tier-badge">${record?.status==='审核通过'?clinicTierLabel[record.tier]:record?.status||'未提交申请'}</div><p>${record?.status==='退回补充'?esc(record.opinion):record?.status==='待省级审核'?'申请已提交，请等待省级审核结果。':'查看本机构申报表单与建设材料。'}</p>${record?`<button class="link" data-review-name="${esc(record.name)}">查看表单与材料</button>`:''}`))}}
  else if(overview&&scopeLevel()!=='province')overview.querySelector('.panel:last-child')?.remove();
  view.querySelectorAll('.capacity-step').forEach(step=>step.querySelector('small')?.remove());
}
};
clinicReviewList=function(){
  const node=currentNode(),all=reviewInScope(node),countiesInScope=[...new Set(all.map(x=>x.county))].sort((a,b)=>a.localeCompare(b,'zh-CN'));if(state.reviewCounty&&!countiesInScope.includes(state.reviewCounty))state.reviewCounty='';const queue=all.filter(x=>!state.reviewCounty||x.county===state.reviewCounty),size=state.pageSizes?.review||10,page=Math.min(state.reviewPage||1,Math.max(1,Math.ceil(queue.length/size))),rows=queue.slice((page-1)*size,page*size);
  const count=x=>queue.filter(item=>item.status===x).length;
  return panel(scopeLevel()==='province'?'建设审核与认定':`${regionLabel()}建设申报进度`,`<div class="review-summary"><span>待省级审核 <button type="button" data-review-status="待省级审核">${count('待省级审核')}</button></span><span>退回修改 <button type="button" data-review-status="退回补充">${count('退回补充')}</button></span><span>审核通过 <button type="button" data-review-status="审核通过">${count('审核通过')}</button></span><label>所属区县 <select aria-label="筛选所属区县" id="reviewCounty"><option value="">全部区县</option>${countiesInScope.map(name=>`<option value="${esc(name)}" ${state.reviewCounty===name?'selected':''}>${esc(name)}</option>`).join('')}</select></label></div><div class="table-wrap scope-table"><table><thead><tr><th>机构名称</th><th>所属区县</th><th>申报层级</th><th>AI 疑点</th><th>审核状态</th><th>操作</th></tr></thead><tbody>${rows.map(x=>`<tr><td><button type="button" class="link review-name" data-review-name="${esc(x.name)}">${esc(x.name)}</button></td><td>${esc(x.county)}</td><td>${esc(clinicTierLabel[x.tier])}</td><td>${x.flags.length?`<span class="review-error">${x.flags.length} 项待复核</span>`:'未标注'}</td><td>${esc(x.status)}</td><td><button type="button" class="link" data-review-name="${esc(x.name)}">查看表单与材料</button></td></tr>`).join('')||'<tr><td colspan="6">暂无申报记录</td></tr>'}</tbody></table></div><div class="list-pagination"><span>共 ${queue.length} 条</span><button type="button" data-review-page="${page-1}" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${Math.max(1,Math.ceil(queue.length/size))}</strong><button type="button" data-review-page="${page+1}" ${page>=Math.ceil(queue.length/size)?'disabled':''}>下一页</button></div>`);
};
document.addEventListener('change',event=>{if(event.target.id==='reviewCounty'){state.reviewCounty=event.target.value;state.reviewPage=1;render()}});
document.addEventListener('click',event=>{const button=event.target.closest('[data-review-status]');if(!button)return;const item=reviewInScope(currentNode()).find(x=>x.status===button.dataset.reviewStatus&&(!state.reviewCounty||x.county===state.reviewCounty));if(item)reviewDetail(item)});
const scopeExplorerBeforeProcess=scopeExplorer;
scopeExplorer=function(kind){
  if(kind!=='service')return scopeExplorerBeforeProcess(kind);
  const rows=[];for(const root of childUnits()){rows.push([root,0]);if(!state.expanded.includes(nodeKey(root)))nodeChildren(root).forEach(child=>rows.push([child,1]))}
  const size=state.pageSizes?.service||10,page=Math.min(state.listPages?.service||1,Math.max(1,Math.ceil(rows.length/size)));
  const visible=rows.slice((page-1)*size,page*size);
  return panel(`${regionLabel()}下辖机构管理过程`,`<div class="table-wrap scope-table"><table><thead><tr><th>机构名称</th><th>入径率</th><th>诊前采集率</th><th>规范监测率</th><th>异常处置率</th><th>操作</th></tr></thead><tbody>${visible.map(([node,depth])=>`<tr><td style="padding-left:${12+depth*18}px">${depth?'↳ ':''}${esc(fullName(node))}</td><td>${node.entry}%</td><td>${node.follow+2}%</td><td>${Math.max(0,node.follow-5)}%</td><td>${Math.max(0,node.follow-17)}%</td><td><button class="link" data-region="${esc(node.name)}">查看详情</button></td></tr>`).join('')}</tbody></table></div><div class="list-pagination"><span>共 ${rows.length} 条</span><button data-list-page="${page-1}" data-list-kind="service" ${page===1?'disabled':''}>上一页</button><strong>${page} / ${Math.max(1,Math.ceil(rows.length/size))}</strong><button data-list-page="${page+1}" data-list-kind="service" ${page>=Math.ceil(rows.length/size)?'disabled':''}>下一页</button></div>`);
};
const finalReviewList=clinicReviewList;
clinicReviewList=function(){
  const html=finalReviewList(),container=document.createElement('div');container.innerHTML=html;
  const all=reviewInScope(currentNode()).filter(x=>!state.reviewCounty||x.county===state.reviewCounty),filtered=state.reviewStatus?all.filter(x=>x.status===state.reviewStatus):all,size=state.pageSizes?.review||10,page=Math.min(state.reviewPage||1,Math.max(1,Math.ceil(filtered.length/size)));
  container.querySelector('tbody').innerHTML=filtered.slice((page-1)*size,page*size).map(x=>`<tr><td><button type="button" class="link review-name" data-review-name="${esc(x.name)}">${esc(x.name)}</button></td><td>${esc(x.county)}</td><td>${esc(clinicTierLabel[x.tier])}</td><td>${x.flags.length?`<span class="review-error">${x.flags.length} 项待复核</span>`:'未标注'}</td><td>${esc(x.status)}</td><td><button type="button" class="link" data-review-name="${esc(x.name)}">查看表单与材料</button></td></tr>`).join('')||'<tr><td colspan="6">当前状态下暂无记录</td></tr>';
  container.querySelectorAll('[data-review-status]').forEach(button=>{button.classList.toggle('active',state.reviewStatus===button.dataset.reviewStatus);button.setAttribute('aria-pressed',String(state.reviewStatus===button.dataset.reviewStatus))});
  const pager=container.querySelector('.list-pagination');pager.querySelector('span').textContent=`共 ${filtered.length} 条`;pager.querySelector('strong').textContent=`${page} / ${Math.max(1,Math.ceil(filtered.length/size))}`;
  pager.querySelectorAll('[data-review-page]').forEach((button,index)=>{button.dataset.reviewPage=index?String(page+1):String(page-1);button.disabled=index?page>=Math.ceil(filtered.length/size):page===1});
  return container.innerHTML;
};
function assistantTargetContext(question){
  const nodes=[...clinics,...consortia,...counties,...cities].filter(x=>question.includes(fullName(x))||question.includes(x.name)||x.name.replace(/[市区县]$/,'').length>=2&&question.includes(x.name.replace(/[市区县]$/,''))).sort((a,b)=>fullName(b).length-fullName(a).length),node=nodes[0]||currentNode();
  const children=(node?nodeChildren(node):cities).map(x=>({name:fullName(x),diagnosed:populationFor(x).diagnosed,managed:populationFor(x).managed,coverage:popCoverage(x),highRiskShare:riskProfileFor(x).high/populationFor(x).managed*100,built:x.clinics,eligible:x.should,active:x.active,entry:x.entry}));
  if(!node){const p=populationData(),risk=selectedRiskProfile();return {name:'浙江省',population:{...p,highRisk:risk.high,highRiskShare:risk.high/p.managed*100},construction:clinicMetrics(null),entry:dashboardRate(null,'entry'),lowerUnits:children}}
  const p=populationFor(node),r=riskProfileFor(node),m=clinicMetrics(node);
  return {name:fullName(node),population:{diagnosed:p.diagnosed,managed:p.managed,coverage:popCoverage(node),highRisk:r.high,highRiskShare:r.high/p.managed*100},construction:m,entry:node.entry,monitoring:{bloodPressure:node.follow+4,bloodGlucose:node.follow-2,hba1c:node.follow-16,ldlc:node.follow-25,abnormalRecheck:node.follow-17},outcome:{bloodPressureImprovement:node.control-11,bloodGlucoseImprovement:node.control-16,lipidImprovement:node.control-20,hba1cImprovement:node.control-19},lowerUnits:children};
}
localAssistantAnswer=function(question){
  const target=assistantTargetContext(question),name=target.name,p=target.population,m=target.construction;
  const weakest=[...(target.lowerUnits||[])].sort((a,b)=>a.coverage-b.coverage)[0],largestGap=[...(target.lowerUnits||[])].sort((a,b)=>(b.eligible-b.built)-(a.eligible-a.built))[0];
  const population=`${name}两慢确诊 ${people(p.diagnosed)}，专档纳管 ${people(p.managed)}，专档覆盖率 ${formatPct(p.coverage||p.managed/p.diagnosed*100)}。${p.highRisk!=null?`高风险患者 ${people(p.highRisk)}，占专档 ${formatPct(p.highRiskShare)}。`:''}${weakest?`下级中${weakest.name}的专档覆盖率最低，为 ${formatPct(weakest.coverage)}。`:''}建议核对确诊与纳管差额，按高风险人数安排随访和基层服务。`;
  const construction=`${name}应建 ${m.eligible} 家，已建成 ${m.built} 家，有效启用 ${m.active} 家；未建 ${m.eligible-m.built} 家，建而未用 ${m.built-m.active} 家。${largestGap&&largestGap.eligible>largestGap.built?`${largestGap.name}未建 ${largestGap.eligible-largestGap.built} 家。`:''}建议按未建、未启用分别核查建设排期和开诊记录。`;
  const process=`${name}入径率 ${formatPct(target.entry)}，血压检测率 ${formatPct(target.monitoring?.bloodPressure||0)}，糖化血红蛋白检测率 ${formatPct(target.monitoring?.hba1c||0)}，异常复查完成率 ${formatPct(target.monitoring?.abnormalRecheck||0)}。建议先排查应检未检名单，再追踪异常复查、转诊及责任人。`;
  const outcome=`${name}血压改善率 ${formatPct(target.outcome?.bloodPressureImprovement||0)}，血糖改善率 ${formatPct(target.outcome?.bloodGlucoseImprovement||0)}，血脂改善率 ${formatPct(target.outcome?.lipidImprovement||0)}，糖化改善率 ${formatPct(target.outcome?.hba1cImprovement||0)}。建议同时核对检测覆盖和可评价样本，再判断改善差异。`;
  const explicit=/人群|确诊|专档|高风险/.test(question)?population:/建设|门诊|审核/.test(question)?construction:/入径|检测|复查|管理过程/.test(question)?process:/改善|健康成效|控制/.test(question)?outcome:null;
  return `按${periodText()}的模拟数据：${explicit||{dashboard:`${population} ${construction}`,population,clinic:construction,service:process,outcome,governance:`${name}当前需要把建设缺口、路径执行和健康结果中的异常转为责任事项，明确责任方、完成时间和复核证据。${construction}`}[state.page]}`;
};
const renderBeforeDashboardUi=render;
render=function(){
  const content=document.querySelector('.content'),viewHost=$('view'),heading=content.querySelector('.heading');
  if(heading?.parentElement?.id==='dashboardBoard')content.insertBefore(heading,viewHost);
  renderBeforeDashboardUi();
  if(state.page==='dashboard'){
    const board=$('dashboardBoard'),currentHeading=content.querySelector('.heading');
    if(board&&currentHeading){board.querySelector('.board-title').after(currentHeading);fitDashboard()}
    return;
  }
  if(state.page!=='clinic'||scopeLevel()==='clinic')return;
  const view=$('view'),kpis=view.querySelector(':scope > .kpis'),overview=view.querySelector(':scope > .clinic-grid');
  if(kpis&&overview){
    kpis.querySelectorAll('.kpi').forEach((card,index)=>{
      if(index>2){card.remove();return}
      const label=card.querySelector('span:first-child');
      if(label?.firstChild?.nodeType===Node.TEXT_NODE)label.firstChild.textContent=['基层机构总数','已建成一体化门诊机构数','一体化门诊覆盖率'][index];
      if(index===1)card.querySelector('small').textContent='建设申报统计 · 模拟数据';
    });
    const summary=document.createElement('div');summary.className='clinic-summary-layout';kpis.before(summary);summary.append(kpis,overview);
  }
  const switcher=document.createElement('div');switcher.className='clinic-review-setting';
  switcher.innerHTML=`<span>建设审核展示</span><button type="button" role="switch" aria-checked="${Boolean(state.reviewVisible)}" aria-label="显示建设审核相关内容" id="clinicReviewSwitch"><i></i></button>`;
  view.prepend(switcher);
  if(!state.reviewVisible){
    view.querySelectorAll(':scope > .panel').forEach(panel=>{if(/建设审核|建设申报进度|下辖机构建设认定/.test(panel.querySelector('h2')?.textContent||''))panel.remove()});
    view.querySelectorAll('.scope-table table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')],hidden=headers.map((cell,index)=>/待审核|退回修改/.test(cell.textContent)?index:-1).filter(index=>index>=0).reverse();
      table.querySelectorAll('tr').forEach(row=>hidden.forEach(index=>row.cells[index]?.remove()));
    });
  }
};
document.addEventListener('click',event=>{if(event.target.closest('#clinicReviewSwitch')){state.reviewVisible=!state.reviewVisible;render()}});
let tickerPosition=0;
setInterval(()=>{
  const ticker=$('boardTickerText'),board=$('dashboardBoard');if(!ticker||!board)return;
  const items=JSON.parse(board.querySelector('.board-ticker')?.dataset.items||'[]');if(!items.length)return;
  tickerPosition=(tickerPosition+1)%items.length;ticker.textContent=items[tickerPosition];
},4200);
const renderBeforeFinalMeetingEdits=render;
render=function(){
  const heading=document.querySelector('.content>.heading');
  if(heading&&!heading.querySelector('.filters')&&meetingFilters)heading.append(meetingFilters);
  heading?.removeAttribute('hidden');
  renderBeforeFinalMeetingEdits();
  if(state.page==='dashboard'){
    const board=$('dashboardBoard'),currentHeading=document.querySelector('.content>.heading'),filters=currentHeading?.querySelector('.filters')||meetingFilters;
    if(board&&filters){
      board.querySelector('.board-title').prepend(filters);
      if(currentHeading)currentHeading.hidden=true;
      const ticker=board.querySelector('.board-ticker');
      if(ticker){const bottom=board.querySelector('.situation-bottom');if(bottom)bottom.before(ticker);else board.querySelector('.board-map')?.append(ticker)}
      fitDashboard();
    }
  }
  if(state.page==='clinic'&&scopeLevel()!=='clinic'){
    const summary=$('view').querySelector('.clinic-summary-layout'),cards=summary?.querySelector('.kpis');
    if(summary&&cards){
      const original=[...cards.children];
      if(original.length>=3)cards.append(original[0],original[2],original[1]);
      const items=currentNode()?scopeDescendants(currentNode()):clinics;
      const counts=[items.filter(item=>item.clinics).length,items.filter(item=>item.clinics&&['强化功能','鼓励探索'].includes(nodeTier(item))).length,items.filter(item=>item.clinics&&nodeTier(item)==='鼓励探索').length];
      ['基本保障','强化功能','鼓励探索'].forEach((label,index)=>cards.insertAdjacentHTML('beforeend',`<button type="button" class="kpi" data-metric="${label}"><span>${label}</span><strong>${counts[index]} 家</strong><small>递进能力清单 · 不可相加</small></button>`));
      summary.querySelector('.clinic-grid')?.remove();
    }
  }
  fitRolePicker();
};
service=meetingServicePage;pages.service=service;
outcome=meetingOutcomePage;pages.outcome=outcome;
const processFindingsBeforeMeeting=processFindings;
processFindings=function(){return processFindingsBeforeMeeting().slice(0,2)};
const assistantAnswerBeforeMeeting=localAssistantAnswer;
localAssistantAnswer=function(question){
  if(/建设|门诊|人群|确诊|专档|高风险|控制|改善/.test(question)||state.page!=='service'&&!/入径|检测|复查|管理过程/.test(question))return assistantAnswerBeforeMeeting(question);
  const node=currentNode(),units=node?[node]:cities;
  const average=(field,offset=0)=>Math.round(units.reduce((total,item)=>total+item.should*(item[field]+offset),0)/Math.max(1,sum(units,'should')));
  return `按${periodText()}的模拟数据，${regionLabel()}路径入径率 ${average('entry')}%，糖化血红蛋白检测率 ${average('follow',-16)}%，低密度脂蛋白检测率 ${average('follow',-25)}%。建议先核对应入径人数、各项目应检人群及接口覆盖，再定位诊前、诊中和诊后断点。`;
};
const dashboardBeforeMeetingFinal=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeMeetingFinal();
  const board=root.querySelector('#dashboardBoard');
  const diagnosedNote=board.querySelector('.board-kpi small');
  if(diagnosedNote)diagnosedNote.textContent='跨机构确诊去重 · 模拟数据';
  const unsupported=[...board.querySelectorAll('.board-panel')].find(item=>item.querySelector('h2')?.textContent==='高风险患者及时处置');
  if(unsupported)unsupported.innerHTML='<h2>管理观察</h2><p class="board-focus-copy">结合入径、诊前采集、核心检测和诊后追踪，定位当前范围的服务断点。</p>';
  if(state.dashboardView==='outcomes'){
    const panel=[...board.querySelectorAll('.board-panel')].find(item=>item.querySelector('h2')?.textContent==='异常结果处置');
    if(panel)panel.innerHTML='<h2>评价基础</h2><p class="board-focus-copy">按血压、血糖、糖化血红蛋白和低密度脂蛋白分别核对检测覆盖与可评价人数，再比较控制率、改善率。</p>';
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
const scopeExplorerBeforeMeeting=scopeExplorer;
scopeExplorer=function(kind){
  if(!['service','outcome'].includes(kind))return scopeExplorerBeforeMeeting(kind);
  const previousPage=state.listPages?.population,previousSize=state.pageSizes?.population;
  state.listPages ||= {}; state.pageSizes ||= {};
  state.listPages.population=state.listPages[kind]; state.pageSizes.population=state.pageSizes[kind];
  const container=document.createElement('div');
  try{container.innerHTML=scopeExplorerBeforeMeeting('population')}
  finally{state.listPages.population=previousPage;state.pageSizes.population=previousSize}
  const labels=kind==='service'?['入径率',...managementNodes(cities[0]).map(([name])=>name),...managementChecks(cities[0]).flatMap(([name])=>[`${name}检测率`,`${name}异常率`])]:[...outcomeSummaryMetrics(cities[0]).map(([name])=>name),...outcomeResults(cities[0]).flatMap(([name])=>[`${name}控制率`,`${name}改善率`])];
  const table=container.querySelector('table');
  table.closest('.table-wrap').classList.add('management-table');
  table.querySelector('thead tr').innerHTML=`<th>机构 / 团队 / 医生</th>${labels.map(label=>`<th>${esc(label)}</th>`).join('')}<th>数据状态</th><th>操作</th>`;
  table.querySelectorAll('tbody tr').forEach(row=>{
    const first=row.firstElementChild,action=row.querySelector('[data-region]'),node=action&&[...clinics,...consortia,...counties,...cities].find(x=>x.name===action.dataset.region);
    const values=!node?labels.map(()=> '待核验'):kind==='service'?[dashboardRate(node,'entry'),...managementNodes(node).map(([,value])=>value),...managementChecks(node).flatMap(([,detected,abnormal])=>[detected,abnormal])].map(formatPct):[...outcomeSummaryMetrics(node).map(([,value,unit])=>unit==='次/人'?`${value.toFixed(2)} 次/人`:formatPct(value)),...outcomeResults(node).flatMap(([,target,improved])=>[formatPct(target),formatPct(improved)])];
    const nameCell=first.outerHTML,operation=action?`<button type="button" class="link" data-region="${esc(node.name)}">查看详情</button>`:'';
    row.innerHTML=nameCell+values.map(value=>`<td>${node?.quality==='已复核'?esc(value):'待核验'}</td>`).join('')+`<td>${esc(node?.quality||'待核验')}</td><td>${operation}</td>`;
  });
  container.querySelector('.scope-toolbar h2').textContent=kind==='service'?'下级单位路径与检测情况':'下级单位管理成效情况';
  container.querySelectorAll('[data-list-kind="population"]').forEach(button=>button.dataset.listKind=kind);
  return container.innerHTML;
};

// The situation view is a patient and regional snapshot; historical values and flows are illustrative.
const dashboardBeforeSituation=dashboard;
const mapValueBeforeSituation=mapValue;
const provinceValueBeforeSituation=provinceMetricValue;
const mapTooltipBeforeSituation=mapTooltip;
const renderProvinceMapBeforeSituation=renderProvinceMap;
const bindMapControlsBeforeSituation=bindMapControls;
const changeMapZoomBeforeSituation=changeMapZoom;
function situationMetric(node,kind){const p=node?populationFor(node):populationData();return kind==='comorbidity'?p.overlap/Math.max(1,p.diagnosed)*100:p.diagnosed}
mapValue=function(node){return state.page==='dashboard'&&state.dashboardView==='situation'&&['diagnosed','comorbidity'].includes(state.mapMetric)?situationMetric(node,state.mapMetric):mapValueBeforeSituation(node)};
provinceMetricValue=function(){return state.page==='dashboard'&&state.dashboardView==='situation'&&['diagnosed','comorbidity'].includes(state.mapMetric)?situationMetric(null,state.mapMetric):provinceValueBeforeSituation()};
mapTooltip=function(node){
  if(state.page!=='dashboard'||state.dashboardView!=='situation'||!['diagnosed','comorbidity','flow'].includes(state.mapMetric))return mapTooltipBeforeSituation(node);
  const p=populationFor(node),visits=visitsFor(node),total=visits.primary+visits.hospital;
  const rows=state.mapMetric==='diagnosed'?[['两慢病确诊人数',p.diagnosed],['两慢病建档人数',p.managed],['高血压确诊人数',p.high],['糖尿病确诊人数',p.diabetes],['高糖合并确诊人数',p.overlap],['高血压专档人数',p.managedHigh],['糖尿病专档人数',p.managedDiabetes],['高糖合并专档人数',p.managedOverlap]]:state.mapMetric==='comorbidity'?[['高糖合并确诊人数',p.overlap],['占两慢确诊人数',formatPct(p.overlap/Math.max(1,p.diagnosed)*100)]]:[['基层就诊人次',visits.primary],['等级医院就诊人次',visits.hospital],['基层就诊人次占比',formatPct(visits.primary/Math.max(1,total)*100)]];
  return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong>${rows.map(([label,value])=>`<div><span>${label}</span><b>${typeof value==='number'?people(value):value}</b></div>`).join('')}<div><span>统计期</span><b>${esc(periodText())}</b></div></div>`;
};
function situationRow(label,value,max,color){return `<div class="situation-row"><span title="${esc(label)}">${esc(label)}</span><i><b style="width:${Math.max(2,value/Math.max(1,max)*100)}%;background:${color}"></b></i><strong>${people(value)}</strong></div>`}
function situationPctRow(label,value,color){return `<div class="situation-pct-row"><span>${esc(label)}</span><i><b style="width:${Math.max(2,value)}%;background:${color}"></b></i><strong>${formatPct(value)}</strong></div>`}
function situationRatioLine(units){
  const rows=[...units].sort((a,b)=>populationFor(b).overlap/Math.max(1,populationFor(b).diagnosed)-populationFor(a).overlap/Math.max(1,populationFor(a).diagnosed)),width=Math.max(350,rows.length*76),height=150,max=50;
  const chart=`<svg viewBox="0 0 ${width} ${height}" style="width:${width}px" role="img" aria-label="下级地区共病占确诊人群比例折线图"><g class="ratio-grid">${[0,25,50].map(v=>`<line x1="36" x2="${width-10}" y1="${120-v/max*105}" y2="${120-v/max*105}"/><text x="31" y="${124-v/max*105}" text-anchor="end">${v}%</text>`).join('')}</g><polyline points="${rows.map((x,i)=>`${45+i*(width-60)/Math.max(1,rows.length-1)},${120-populationFor(x).overlap/Math.max(1,populationFor(x).diagnosed)*100/max*105}`).join(' ')}" fill="none" stroke="#b48af5" stroke-width="2.5"/>${rows.map((x,i)=>{const value=populationFor(x).overlap/Math.max(1,populationFor(x).diagnosed)*100,cx=45+i*(width-60)/Math.max(1,rows.length-1);return `<circle cx="${cx}" cy="${120-value/max*105}" r="4" fill="#d6b5ff"><title>${esc(fullName(x))} ${formatPct(value)}</title></circle><text class="ratio-label" x="${cx}" y="142">${esc(x.name)}</text>`}).join('')}</svg>`;
  return `<div class="situation-ratio-layout"><div class="situation-ratio-axis">50%<span>25%</span>0%</div><div class="situation-ratio-window"><div class="situation-ratio-track">${chart}${chart}</div></div></div>`;
}
function situationPanel(title,body,note=''){return `<section class="board-panel situation-panel"><h2>${title}</h2>${body}${note?`<p class="situation-note">${note}</p>`:''}</section>`}
function situationUnits(){return childUnits()}
function situationTickerItems(units){
  const metric=state.mapMetric,period=periodText(),scope=regionLabel();
  if(metric==='comorbidity')return [...units].sort((a,b)=>populationFor(b).overlap/Math.max(1,populationFor(b).diagnosed)-populationFor(a).overlap/Math.max(1,populationFor(a).diagnosed)).slice(0,5).map(x=>`${fullName(x)}两病同患 ${people(populationFor(x).overlap)}，占确诊人群 ${formatPct(populationFor(x).overlap/Math.max(1,populationFor(x).diagnosed)*100)} · ${period}`);
  if(metric==='flow')return [...units].sort((a,b)=>visitsFor(a).primary/Math.max(1,visitsFor(a).primary+visitsFor(a).hospital)-visitsFor(b).primary/Math.max(1,visitsFor(b).primary+visitsFor(b).hospital)).slice(0,5).map(x=>`${fullName(x)}基层就诊人次占比 ${formatPct(visitsFor(x).primary/Math.max(1,visitsFor(x).primary+visitsFor(x).hospital)*100)}，建议关注基层承接 · ${period}`);
  return [...units].sort((a,b)=>(populationFor(b).diagnosed-populationFor(b).managed)-(populationFor(a).diagnosed-populationFor(a).managed)).slice(0,5).map(x=>`${fullName(x)}确诊未入专档 ${people(Math.max(0,populationFor(x).diagnosed-populationFor(x).managed))}，建议核对专档纳管情况 · ${period}`);
}
function situationTrend(p){
  const series=[['高血压',p.high,p.managedHigh,'#398ff0','#17599d'],['糖尿病',p.diabetes,p.managedDiabetes,'#2cc5a4','#147b6c']],years=[.82,.91,1],managedFactors=[.76,.87,1],max=Math.max(p.high,p.diabetes)*1.12;
  const ticks=[0,.25,.5,.75,1].map(n=>`<text x="38" y="${142-n*114+4}">${people(max*n)}</text><line x1="43" x2="350" y1="${142-n*114}" y2="${142-n*114}"/>`).join('');
  const bars=years.map((factor,i)=>series.map(([name,total,managedTotal,light,dark],j)=>{const value=total*factor,managed=managedTotal*managedFactors[i],h=value/max*114,mh=managed/max*114,x=88+i*99+j*28;return `<g><rect x="${x}" y="${142-h}" width="19" height="${h}" fill="${light}"/><rect x="${x}" y="${142-mh}" width="19" height="${mh}" fill="${dark}"/><title>${2024+i} 年${name}确诊 ${people(value)}，其中专档 ${people(managed)}；专档占比 ${formatPct(managed/value*100)}（模拟）</title></g>`}).join('')).join('');
  const lines=series.map(([name,total,managed,light],j)=>{const ratios=years.map((factor,i)=>managed*managedFactors[i]/Math.max(1,total*factor)*100),points=ratios.map((ratio,i)=>`${98+i*99+j*27},${142-ratio/100*114}`).join(' ');return `<polyline points="${points}" fill="none" stroke="${light}" stroke-width="2.8"/>${ratios.map((ratio,i)=>`<circle cx="${98+i*99+j*27}" cy="${142-ratio/100*114}" r="4" fill="${light}"><title>${2024+i} 年${name}专档占确诊 ${formatPct(ratio)}</title></circle>`).join('')}`}).join('');
  return `<div class="situation-trend-legend"><span><i></i>高血压确诊 / 专档</span><span><i></i>糖尿病确诊 / 专档</span><span class="line-key blue">高血压专档占比</span><span class="line-key green">糖尿病专档占比</span></div><svg class="situation-trend-chart" viewBox="0 0 370 170" role="img" aria-label="2024 至 2026 年高血压与糖尿病确诊、专档人数及各自专档占比；左轴人数，右轴百分比"><g class="chart-grid">${ticks}<line x1="43" x2="43" y1="28" y2="142"/><line x1="350" x2="350" y1="28" y2="142"/>${[0,25,50,75,100].map(n=>`<text class="right-axis" x="355" y="${142-n/100*114+4}">${n}%</text>`).join('')}</g>${bars}${lines}${years.map((_,i)=>`<text x="${111+i*99}" y="160">${2024+i}</text>`).join('')}</svg>`;
}
function situationComplications(){
  const disease=state.situationDisease||'高血压',common=['脑出血','缺血性脑卒中','短暂性脑缺血发作','蛛网膜下腔出血','其他脑血管病','急性心肌梗死','陈旧性心肌梗死','心绞痛','冠状动脉粥样硬化性心脏病','冠状动脉血运重建','肾功能不全','慢性肾功能不全','肾功能衰竭','慢性肾脏疾病','蛋白尿','急性肾炎','慢性肾炎','外周动脉粥样硬化','四肢动脉粥样硬化','外周动脉疾病','动脉闭塞性疾病','下肢动脉硬化闭塞症','夹层动脉瘤','主动脉瘤和主动脉夹层','足背动脉减弱','视网膜病变','视网膜出血或渗出','视乳头水肿','白内障','视力缺损','高脂血症','高甘油三酯血症','高低密度脂蛋白血症','高胆固醇血症','低高密度脂蛋白血症','代谢综合征','高尿酸血症'],names={高血压:[...common,'慢性心力衰竭','高血压心脏病','左心室肥厚','高血压肾病','高血压视网膜病变','高血压急症','高血压脑病','高血压亚急症','2型糖尿病'],糖尿病:[...common,'糖尿病肾病','糖尿病足','糖尿病周围神经病变','糖尿病视网膜病变','糖尿病酮症酸中毒','低血糖','高血糖高渗状态','高血压'],慢阻肺:['呼吸衰竭','肺心病','肺部感染','心力衰竭','气胸']}[disease]||[];
  const p=populationData(),denominator=disease==='糖尿病'?p.managedDiabetes:disease==='慢阻肺'?p.managedCopd:p.managedHigh;
  return `<div class="situation-panel-title"><h2>并发症情况</h2><div class="situation-tabs">${['高血压','糖尿病','高糖合并'].map(x=>`<button type="button" data-situation-disease="${x}" class="${x===disease?'active':''}">${x}</button>`).join('')}</div></div><div class="situation-complication-head"><div><strong>25.97%</strong><span>并发症发病率</span></div><svg viewBox="0 0 120 42" aria-label="模拟趋势"><polyline points="2,33 24,29 48,31 72,20 96,18 118,10" fill="none" stroke="#50d4ed" stroke-width="3"/></svg></div><div class="situation-complication-list">${[...names,...names].map((name,i)=>{const pct=11.8-i%4*2.1;return `<div data-board-tip="${name} ${people(denominator*pct/100)}，发生率 ${formatPct(pct)}"><span>${name}</span><i><b style="width:${75-i%4*13}%"></b></i><strong>${people(denominator*pct/100)} · ${formatPct(pct)}</strong></div>`}).join('')}</div>`;
}
function situationBottom(units){
  const metric=state.mapMetric,byDiagnosed=[...units].sort((a,b)=>populationFor(b).diagnosed-populationFor(a).diagnosed),max=Math.max(1,...byDiagnosed.map(x=>populationFor(x).diagnosed));
  const scrolling=rows=>`<div class="situation-bottom-scroll auto-scroll"><div class="scroll-track">${rows}${rows}</div></div>`;
  if(metric==='diagnosed'){
    const gaps=[...units].sort((a,b)=>(populationFor(b).diagnosed-populationFor(b).managed)-(populationFor(a).diagnosed-populationFor(a).managed));
    const gapMax=Math.max(1,...gaps.map(x=>populationFor(x).diagnosed-populationFor(x).managed));
    return situationPanel('下级地区确诊负荷',scrolling(byDiagnosed.map(x=>situationRow(fullName(x),populationFor(x).diagnosed,max,'#44b9e8')).join('')))+situationPanel('确诊未入专档人数排行',scrolling(gaps.map(x=>situationRow(fullName(x),Math.max(0,populationFor(x).diagnosed-populationFor(x).managed),gapMax,'#f2ad6e')).join('')),'确诊未入专档是人数差额，需核对建档记录。');
  }
  if(metric==='comorbidity')return situationPanel('下级地区共病人数',scrolling(byDiagnosed.sort((a,b)=>populationFor(b).overlap-populationFor(a).overlap).map(x=>situationRow(fullName(x),populationFor(x).overlap,max,'#b48af5')).join('')))+situationPanel('共病占确诊人群比例',situationRatioLine(units));
  return situationPanel('下级地区基层就诊人次',byDiagnosed.sort((a,b)=>visitsFor(b).primary-visitsFor(a).primary).map(x=>situationRow(fullName(x),visitsFor(x).primary,Math.max(1,...byDiagnosed.map(y=>visitsFor(y).primary)),'#47cdb7')).join(''))+situationPanel('基层就诊人次占比',byDiagnosed.sort((a,b)=>visitsFor(b).primary/(visitsFor(b).primary+visitsFor(b).hospital)-visitsFor(a).primary/(visitsFor(a).primary+visitsFor(a).hospital)).map(x=>situationPctRow(fullName(x),visitsFor(x).primary/(visitsFor(x).primary+visitsFor(x).hospital)*100,'#47cdb7')).join(''),'按诊次汇总，不代表真实转诊轨迹。');
}
function situationPanels(){
  const p=populationData(),risk=selectedRiskProfile(),units=comparisonUnits(),visits=visitsForSelection(),visitTotal=visits.primary+visits.hospital;
  const high=p.high-p.overlap,diabetes=p.diabetes-p.overlap,share=p.overlap/Math.max(1,p.diagnosed)*100;
  const trend=situationTrend(p);
  const ages=[['84岁以上',.05],['75–84岁',.07],['65–74岁',.14],['55–64岁',.27],['45–54岁',.25],['35–44岁',.14],['35岁以下',.08]];
  const disease=state.situationPopulationDisease||'高血压';
  const populationCount=disease==='糖尿病'?p.managedDiabetes:disease==='慢阻肺'?p.managedCopd:p.managedHigh;
  const maleShare=disease==='糖尿病'?.51:disease==='高糖合并'?.55:.53;
  const pyramid=`<div class="situation-legend"><span>■ 男 ${people(populationCount*maleShare)} · ${formatPct(maleShare*100)}</span><span>■ 女 ${people(populationCount*(1-maleShare))} · ${formatPct((1-maleShare)*100)}</span></div><div class="situation-pyramid">${ages.map(([age,ratio])=>`<div><span>${age}</span><small>${formatPct(ratio*100)}</small><strong>${people(populationCount*ratio*maleShare)}</strong><i class="male"><b style="width:${ratio/.27*100}%"></b></i><i class="female"><b style="width:${ratio/.27*100}%"></b></i><strong>${people(populationCount*ratio*(1-maleShare))}</strong></div>`).join('')}</div>`;
  const riskTotal=Math.max(1,p.managed),riskRows=[['高风险',risk.high,'#ef8065'],['中风险',risk.middle,'#f4c767'],['低风险',risk.low,'#35bde5']];
  const riskBars=riskRows.map(([label,count,color])=>situationPctRow(label,count/riskTotal*100,color)).join('');
  const riskTrend=`<div class="situation-spark-title">高危人群占比趋势 · 历史演示序列</div><div class="situation-spark"><svg viewBox="0 0 320 76" preserveAspectRatio="none" aria-label="2023 至 2026 年高、中、低风险占比趋势，纵轴为百分比"><g class="chart-grid">${[0,25,50].map((n,i)=>`<line x1="33" x2="315" y1="${65-i*28}" y2="${65-i*28}"/><text x="28" y="${69-i*28}">${n}%</text>`).join('')}</g><polyline points="35,22 125,27 218,30 312,34" stroke="#ef8065"/><polyline points="35,41 125,37 218,35 312,33" stroke="#f4c767"/><polyline points="35,57 125,53 218,49 312,43" stroke="#35bde5"/></svg><div>2023</div><div>2024</div><div>2025</div><div>2026</div></div>`;
  const primaryShare=visits.primary/Math.max(1,visitTotal)*100;
  const flowOffset=primaryShare-48,firstVisit=62.3+flowOffset*.35,upward=13.7-flowOffset*.12,downward=48.6+flowOffset*.22,crossCity=7.5-flowOffset*.06;
  const flow=`<div class="situation-flow reference-flow"><div class="situation-flow-ring" style="--flow-share:${firstVisit}%"><div class="flow-ring-center"><span class="flow-hospital-icon">✚</span><strong>${formatPct(firstVisit)}</strong><span>基层首诊率</span></div></div><div class="situation-flow-breakdown"><div><i></i><span>上转占比</span><strong>${formatPct(upward)}</strong></div><div><i></i><span>下转占比</span><strong>${formatPct(downward)}</strong></div><div><i></i><span>跨市就诊</span><strong>${formatPct(crossCity)}</strong></div></div></div>`;
  const rankedUnits=situationUnits(),top=[...rankedUnits].sort((a,b)=>riskProfileFor(b).high/Math.max(1,populationFor(b).managed)-riskProfileFor(a).high/Math.max(1,populationFor(a).managed));
  const regionRows=[...units].sort((a,b)=>populationFor(b).diagnosed-populationFor(a).diagnosed).slice(0,5),max=Math.max(1,...regionRows.map(x=>populationFor(x).diagnosed));
  const source=currentNode()?[currentNode()]:cities;
  const follow=source.reduce((total,x)=>total+populationFor(x).diagnosed*x.follow,0)/Math.max(1,source.reduce((total,x)=>total+populationFor(x).diagnosed,0));
  const measured=[['血压',follow+4],['糖化血红蛋白',follow-16],['低密度脂蛋白',follow-25],['BMI',follow-4]];
  return {
    left:situationPanel('确诊人群规模与变化',`<div class="situation-headline"><strong>${people(p.diagnosed)}</strong><span>两慢确诊去重人数</span></div>${trend}`)+
      `<section class="board-panel situation-panel"><div class="situation-panel-title"><h2>患者人口构成</h2><div class="situation-tabs">${['高血压','糖尿病','高糖合并'].map(x=>`<button type="button" data-situation-population-disease="${x}" class="${x===disease?'active':''}">${x}</button>`).join('')}</div></div>${pyramid}</section>`+
      `<section class="board-panel situation-panel">${situationComplications()}</section>`,
    right:situationPanel('风险分层与变化',`<div class="situation-risk-layout"><div class="situation-risk-total"><strong>${people(risk.high)}</strong><span>高风险在管患者</span><small>占专档 ${formatPct(risk.high/riskTotal*100)}</small></div><div class="situation-risk-bars"><h3>风险等级分布</h3>${riskBars}</div></div>${riskTrend}`,'高、中、低风险互斥；分母为专档在管患者。')+
      situationPanel('服务流动与就诊态势',flow)+
      situationPanel('重点地区与风险预警',`<div class="situation-warning-total"><strong>${people(risk.high)}</strong><span>高风险在管患者</span><small>占专档 ${formatPct(risk.high/riskTotal*100)}</small></div><div class="situation-warning-ranks"><h3>${{province:'地市',city:'区县',county:'医共体',consortium:'基层机构',clinic:'本机构'}[scopeLevel()]}高风险人数和占比</h3><div class="situation-warning-scroll auto-scroll"><div class="scroll-track">${[...top,...top].map((x,i)=>`<div class="situation-rank"><em>${i%top.length+1}</em><span title="${esc(fullName(x))}">${esc(fullName(x))}</span><i><b style="width:${Math.min(100,riskProfileFor(x).high/Math.max(1,populationFor(x).managed)*250)}%"></b></i><strong>${formatPct(riskProfileFor(x).high/Math.max(1,populationFor(x).managed)*100)}</strong></div>`).join('')}</div></div></div>`),
    bottom:situationBottom(rankedUnits)
  };
}
dashboard=function(){
  const view=state.dashboardView||'home';
  if(view!=='situation'){
    const root=document.createElement('div');root.innerHTML=dashboardBeforeSituation();
    if(view!=='home'){
      const board=root.querySelector('#dashboardBoard');board.classList.add('board-no-kpis');board.querySelector('.board-kpis')?.remove();
    }
    return root.innerHTML;
  }
  if(state.dashboardMetricView!=='situation'){state.mapMetric='risk';state.situationCombination='7';state.mapScope=scopeLevel()==='province'?'city':'county';state.dashboardMetricView='situation';mapZoom=1}
  const root=document.createElement('div');root.innerHTML=dashboardBeforeSituation();const board=root.querySelector('#dashboardBoard'),parts=situationPanels();
  board.classList.add('situation-board','board-no-kpis');board.querySelector('.board-stack').innerHTML=parts.left;board.querySelector('.board-stack:last-child').innerHTML=parts.right;
  board.querySelector('.board-kpis')?.remove();
  const center=board.querySelector('.board-map'),bottom=document.createElement('div');bottom.className='situation-bottom';bottom.innerHTML=parts.bottom;center.querySelector('.map-panel').after(bottom);
  const ticker=board.querySelector('.board-ticker'),items=situationTickerItems(situationUnits());
  if(ticker){ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent={diagnosed:'确诊纳管预警',comorbidity:'共病负荷预警',flow:'基层就诊预警'}[state.mapMetric];ticker.querySelector('b').textContent=periodText();ticker.querySelector('small')?.remove();const message=ticker.querySelector('#boardTickerText');if(message)message.textContent=items[0]||`${regionLabel()}暂无下级单位`;bottom.before(ticker);tickerPosition=0}
  const mapHead=center.querySelector('.panel-head h2');if(mapHead)mapHead.textContent='区域慢病态势地图';
  const mapModes=center.querySelector('.board-map-modes');if(mapModes)mapHead.after(mapModes);
  const mapTools=center.querySelector('.map-tools'),mapStage=center.querySelector('.map-stage');if(mapTools&&mapStage)mapStage.append(mapTools);
  const tabs=center.querySelector('.map-metrics');tabs.innerHTML=[['diagnosed','确诊分布'],['comorbidity','共病负荷'],['flow','就诊流向']].map(([key,label])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}" aria-pressed="${state.mapMetric===key}">${label}</button>`).join('');
  const label=center.querySelector('#mapMetricLabel');if(label)label.textContent={diagnosed:'确诊去重人数',comorbidity:'两病同患占比',flow:'模拟就诊轨迹'}[state.mapMetric];
  center.querySelector('.map-scale span:last-child').textContent=state.mapMetric==='flow'?'基层 → 等级医院':'低 → 高';
  return root.innerHTML;
};
pages.dashboard=dashboard;
bindMapControls=function(){
  bindMapControlsBeforeSituation();
  if(state.page!=='dashboard'||state.dashboardView!=='situation')return;
  document.querySelectorAll('.situation-board [data-map-metric]').forEach(button=>button.onclick=()=>{
    state.mapMetric=button.dataset.mapMetric;
    document.querySelectorAll('.situation-board [data-map-metric]').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button))});
    $('mapMetricLabel').textContent={diagnosed:'确诊去重人数',comorbidity:'两病同患占比',flow:'模拟就诊轨迹'}[state.mapMetric];
    document.querySelector('.situation-board .map-scale span:last-child').textContent=state.mapMetric==='flow'?'基层 → 等级医院':'低 → 高';
    render();
  });
  document.querySelectorAll('[data-situation-disease]').forEach(button=>button.onclick=()=>{state.situationDisease=button.dataset.situationDisease;render()});
  document.querySelectorAll('[data-situation-population-disease]').forEach(button=>button.onclick=()=>{state.situationPopulationDisease=button.dataset.situationPopulationDisease;render()});
};
changeMapZoom=function(action){
  if(state.page!=='dashboard'||state.dashboardView!=='situation'||state.mapMetric!=='flow')return changeMapZoomBeforeSituation(action);
  if(!provinceChart)return;
  const current=provinceChart.getOption().geo?.[0]?.zoom||1.3;
  mapZoom=action==='reset'?1:Math.max(.5,Math.min(8,current*(action==='in'?1.5:1/1.5)));
  provinceChart.setOption({geo:{zoom:mapZoom,center:action==='reset'?null:provinceChart.getOption().geo?.[0]?.center}});
  updateMapZoom();
};
function situationCenter(feature){
  if(Array.isArray(feature.properties?.center))return feature.properties.center;
  if(Array.isArray(feature.properties?.centroid))return feature.properties.centroid;
  let coordinates=feature.geometry?.coordinates||[],points=[];
  const collect=value=>{if(typeof value?.[0]==='number'&&typeof value?.[1]==='number')points.push(value);else if(Array.isArray(value))value.forEach(collect)};collect(coordinates);
  return points.length?[points.reduce((a,x)=>a+x[0],0)/points.length,points.reduce((a,x)=>a+x[1],0)/points.length]:null;
}
renderProvinceMap=function(){
  if(state.page!=='dashboard'||state.dashboardView!=='situation'||state.mapMetric!=='flow'){
    document.querySelector('.situation-board [data-map-view="3d"]')?.removeAttribute('disabled');
    renderProvinceMapBeforeSituation();
    if(provinceChart&&state.mapView==='2d')provinceChart.setOption({visualMap:{inRange:{color:['#0751b8','#11b9ec','#f9cc5e','#f16a45']}},series:[{itemStyle:{borderColor:'#7acbfa',borderWidth:1.3,shadowColor:'#37aeff',shadowBlur:9},label:{color:'#e9f6ff',textShadowColor:'#123a68',textShadowBlur:4}}]});
    return;
  }
  if(state.mapView==='3d'){
    const target=$('zhejiangMap3D'),selectedNode=currentNode(),county=state.mapScope==='county';
    const items=county?(selectedNode?counties.filter(x=>scopeLevel()==='city'?x.cityName===selectedNode.name:x.adcode===selectedNode.adcode):counties):cities;
    const source=county?window.ZHEJIANG_COUNTIES_DATAV_GEOJSON:window.ZHEJIANG_DATAV_GEOJSON;
    const geo=county?{...source,features:source.features.filter(feature=>items.some(item=>item.name===feature.properties?.name))}:source;
    const cityName=scopeLevel()==='city'?selectedNode.name:selectedNode?.cityName||'杭州市';
    const hubFeature=window.ZHEJIANG_DATAV_GEOJSON.features.find(feature=>feature.properties?.name===cityName);
    const hub=hubFeature?situationCenter(hubFeature):[120.15,30.28];
    const lines=geo.features.map(feature=>situationCenter(feature)).filter(Boolean).map(center=>[center,hub]);
    provinceChart?.dispose();provinceChart=null;map3DHandle?.dispose();map3DHandle=null;
    try{map3DHandle=window.ZhejiangMap3D.mount(target,geo,items.map(item=>({name:item.name,value:visitsFor(item).hospital})),{showLabels:true,countyLevel:county,flowLines:lines,onHover:name=>{const item=items.find(x=>x.name===name);return item?mapTooltip(item):''},onClick:regionDetail,onZoom:zoom=>{mapZoom=zoom;updateMapZoom()}});updateMapZoom()}catch(error){fallbackTo2D(error)}
    return;
  }
  const baseGeo=state.mapScope==='county'?window.ZHEJIANG_COUNTIES_DATAV_GEOJSON:window.ZHEJIANG_DATAV_GEOJSON,element=$('zhejiangMap');
  if(!element||!window.echarts||!baseGeo)return;
  map3DHandle?.dispose();map3DHandle=null;provinceChart?.dispose();provinceChart=echarts.init(element);
  const allItems=state.mapScope==='county'?counties:cities,selectedNode=currentNode();
  const items=state.mapScope==='county'&&selectedNode?allItems.filter(x=>scopeLevel()==='city'?x.cityName===selectedNode.name:x.adcode===selectedNode.adcode):allItems;
  const geo=state.mapScope==='county'&&selectedNode?{...baseGeo,features:baseGeo.features.filter(feature=>items.some(x=>x.name===feature.properties?.name))}:baseGeo;
  const centers=new Map(geo.features.map(feature=>[feature.properties?.name,situationCenter(feature)]));
  const cityName=scopeLevel()==='city'?selectedNode.name:selectedNode?.cityName||'杭州市';
  const cityFeature=window.ZHEJIANG_DATAV_GEOJSON.features.find(feature=>feature.properties?.name===cityName);
  const hub=cityFeature?situationCenter(cityFeature):[120.15,30.28];
  const lines=items.filter(x=>centers.get(x.name)).map(x=>({fromName:x.name,toName:'区域就诊中心',coords:[centers.get(x.name),hub],value:visitsFor(x).hospital}));
  echarts.registerMap('situation-flow-map',geo);
  provinceChart.setOption({backgroundColor:'transparent',tooltip:{trigger:'item',formatter:params=>{const x=items.find(item=>item.name===params.name);return x?mapTooltip(x):'演示就诊轨迹；非实际转诊记录'},confine:true},geo:{map:'situation-flow-map',roam:true,zoom:1.3,itemStyle:{areaColor:'#174264',borderColor:'#4b8db6',borderWidth:1},emphasis:{itemStyle:{areaColor:'#246b94'}}},series:[{type:'lines',coordinateSystem:'geo',zlevel:2,polyline:false,effect:{show:true,period:5,trailLength:.28,symbol:'arrow',symbolSize:7},lineStyle:{color:'#f1ba66',width:1.5,opacity:.58,curveness:.18},data:lines},{type:'effectScatter',coordinateSystem:'geo',zlevel:3,rippleEffect:{scale:3},symbolSize:11,itemStyle:{color:'#f1ba66'},data:[{name:'区域就诊中心',value:[...hub,1]}]}]});
  mapZoom=1.3;updateMapZoom();
  provinceChart.on('click',params=>{const x=items.find(item=>item.name===params.name);if(x)regionDetail(x.name)});
  setTimeout(()=>provinceChart?.resize(),0);
};
const renderBeforeAssistantPosition=render;
function positionAssistantBelowHeader(){
  const top=Math.max(0,document.querySelector('.top')?.getBoundingClientRect().bottom||0);
  assistant.style.top=`${top}px`;
  assistant.style.height=`calc(100vh - ${top}px)`;
}
render=function(){renderBeforeAssistantPosition();positionAssistantBelowHeader()};
window.addEventListener('resize',positionAssistantBelowHeader);

// Construction board: monthly series are illustrative and follow the selected scope.
function constructionLineChart(series,unit='%',maxOverride){
  const width=360,height=148,left=40,right=12,top=12,bottom=25,values=series.flatMap(x=>x.values),max=maxOverride||Math.ceil(Math.max(1,...values)*1.12/10)*10;
  const x=i=>left+i*(width-left-right)/11,y=v=>height-bottom-v/max*(height-top-bottom);
  const grid=[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-5}" y="${y(max*t)+3}" text-anchor="end">${Math.round(max*t)}${unit}</text>`).join('');
  return `<svg class="construction-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="一月至十二月趋势图，纵轴${unit==='%'?'百分比':'人次'}"><g class="construction-grid">${grid}</g>${series.map(item=>`<polyline points="${item.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${item.color}" stroke-width="2.3"/>${item.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${item.color}"><title>${i+1}月 ${item.name} ${unit==='%'?formatPct(v):Math.round(v).toLocaleString()+' 人次'}</title></circle>`).join('')}`).join('')}${Array.from({length:12},(_,i)=>`<text class="construction-month" x="${x(i)}" y="${height-4}">${i+1}月</text>`).join('')}</svg>`;
}
function constructionSeries(base,phase=0){return Array.from({length:12},(_,i)=>Math.max(0,Math.min(100,base-5+(i+1)*.45+Math.sin(i*.72+phase)*2.2)))}
function constructionPanel(title,body){return `<section class="board-panel construction-panel"><h2>${title}</h2>${body}</section>`}
function constructionBottom(units){
  const metric=state.mapMetric,sorted=[...units].sort((a,b)=>constructionValue(b,metric)-constructionValue(a,metric)),max=Math.max(1,...sorted.map(x=>constructionValue(x,metric))),title={construction:'建成覆盖率',entry:'入径率',monitoring:'规范监测率'}[metric],label=scopeLevel()==='province'?'地市':scopeLevel()==='city'?'区县':scopeLevel()==='county'?'医共体':'基层机构';
  const rank=constructionPanel(`${label}${title}排行`,`<div class="construction-scroll auto-scroll"><div class="scroll-track">${[...sorted,...sorted].map(x=>`<div class="construction-rank"><span title="${esc(fullName(x))}">${esc(fullName(x))}</span><i><b style="width:${constructionValue(x,metric)/max*100}%"></b></i><strong>${formatPct(constructionValue(x,metric))}</strong></div>`).join('')}</div></div>`);
  const second=metric==='construction'?constructionPanel('建成与待建机构',`<div class="construction-summary"><div><strong>${clinicMetrics(currentNode()).built}</strong><span>已建成机构</span></div><div><strong>${Math.max(0,clinicMetrics(currentNode()).eligible-clinicMetrics(currentNode()).built)}</strong><span>未建成机构</span></div></div><p class="construction-foot">分母为当前范围基层机构总数</p>`):metric==='entry'?constructionPanel('路径纳管观察',`<div class="construction-summary"><div><strong>${formatPct(dashboardRate(currentNode(),'entry'))}</strong><span>当前范围入径率</span></div><div><strong>${units.length}</strong><span>下级单位</span></div></div><p class="construction-foot">按当前统计期与机构范围展示</p>`):constructionPanel('规范监测观察',`<div class="construction-summary"><div><strong>${formatPct(constructionValue(currentNode(),'monitoring'))}</strong><span>当前范围规范监测率</span></div><div><strong>${units.length}</strong><span>下级单位</span></div></div><p class="construction-foot">各监测项目应检人群分别计算</p>`);
  return rank+second;
}
function constructionValue(node,metric){if(metric==='construction')return node?rate(node.clinics,node.should):clinicMetrics(null).built/Math.max(1,clinicMetrics(null).eligible)*100;if(metric==='entry')return dashboardRate(node,'entry');const rows=node?[node]:cities;return rows.reduce((n,x)=>n+x.follow-8,0)/rows.length}
function constructionTickerItems(units){
  const metric=state.mapMetric,label={construction:'一体化门诊覆盖率',entry:'医防融合入径率',monitoring:'路径节点总执行率'}[metric],average=constructionValue(null,metric);
  return [...units].filter(x=>constructionValue(x,metric)<average).sort((a,b)=>constructionValue(a,metric)-constructionValue(b,metric)).slice(0,5).map(x=>`${fullName(x)}${label}偏低，为${constructionValue(x,metric).toFixed(2)}%，省平均${average.toFixed(2)}%。`);
}
const dashboardBeforeConstruction=dashboard;
dashboard=function(){
  if((state.dashboardView||'home')!=='construction')return dashboardBeforeConstruction();
  if(state.dashboardMetricView!=='construction'){state.mapMetric='construction';state.dashboardMetricView='construction'}
  const root=document.createElement('div');root.innerHTML=dashboardBeforeConstruction();const board=root.querySelector('#dashboardBoard'),node=currentNode(),metrics=clinicMetrics(node),units=childUnits(),coverage=metrics.built/Math.max(1,metrics.eligible)*100,base=node||cities[0];
  board.classList.add('construction-board');
  const built=(node?scopeDescendants(node):clinics).filter(x=>x.clinics),enhanced=built.filter(x=>['强化功能','鼓励探索'].includes(nodeTier(x))).length,explore=built.filter(x=>nodeTier(x)==='鼓励探索').length;
  const doughnut=(value,label)=>`<div class="construction-doughnut" style="--doughnut:${value}%"><div><strong>${formatPct(value)}</strong><span>${label}</span></div></div>`;
  const monthVisits=Array.from({length:12},(_,i)=>Math.round(metrics.built*(990+i*46+Math.sin(i*.8)*80)));
  board.querySelector('.board-stack').innerHTML=constructionPanel('一体化门诊建成覆盖',`<div class="construction-coverage">${doughnut(coverage,'已建成占比')}<div><strong>${metrics.built} / ${metrics.eligible} 家</strong><span>已建成一体化门诊 / 基层机构总数</span></div></div>`)+constructionPanel('建成门诊能力分层',`<div class="construction-tier-list">${[['基本保障',metrics.built,'#45bdf0'],['强化功能',enhanced,'#6ed9ba'],['鼓励探索',explore,'#f5c76b']].map(([label,count,color])=>`<div><span>${label}</span><i><b style="width:${count/Math.max(1,metrics.built)*100}%;background:${color}"></b></i><strong>${formatPct(count/Math.max(1,metrics.built)*100)}</strong></div>`).join('')}</div><p class="construction-foot">递进能力，均以已建成机构为分母</p>`)+constructionPanel('已建成基层机构服务人次',`<div class="construction-key"><i style="background:#46c7f0"></i>门诊服务人次 · 1—12月</div>${constructionLineChart([{name:'门诊服务人次',values:monthVisits,color:'#46c7f0'}],'',Math.ceil(Math.max(...monthVisits)*1.15/100000)*100000)}`);
  const nodes=[['诊前采集率',base.follow+2],['规范监测率',base.follow-8],['诊中随访完成率',base.follow-2],['健康处方打印率',base.follow-12],['异常追踪管理率',base.follow-17],['转诊率',Math.max(0,base.entry-45)]];
  const monitoring=[['血压',base.follow+4],['血糖',base.follow-2],['糖化',base.follow-16],['血脂',base.follow-25]];
  board.querySelector('.board-stack:last-child').innerHTML=constructionPanel('入径率月度趋势',`<div class="construction-key"><i style="background:#f7c66e"></i>入径率 · 1—12月</div>${constructionLineChart([{name:'入径率',values:constructionSeries(dashboardRate(node,'entry')),color:'#f7c66e'}])}`)+constructionPanel('路径节点执行率',`<div class="construction-node-head"><strong>${formatPct(dashboardRate(node,'entry'))}</strong><span>当前范围入径率</span><svg viewBox="0 0 100 32"><polyline points="0,25 18,20 36,22 54,13 73,16 100,5" fill="none" stroke="#45c7ec" stroke-width="2.5"/></svg></div><div class="construction-nodes">${nodes.map(([label,value])=>`<div><span>${label}</span><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><strong>${formatPct(value)}</strong></div>`).join('')}</div>`)+constructionPanel('核心监测与异常月度趋势',`<div class="construction-metric-tabs">${monitoring.map(([label])=>`<button type="button" data-construction-monitor="${label}" class="${(state.constructionMonitor||'血压')===label?'active':''}">${label}</button>`).join('')}</div>${(()=>{const [label,value]=monitoring.find(([name])=>name===(state.constructionMonitor||'血压'))||monitoring[0];return `<div class="construction-key"><i style="background:#49c7f2"></i>监测率 <i style="background:#f4a76a"></i>异常率</div>${constructionLineChart([{name:`${label}监测率`,values:constructionSeries(value),color:'#49c7f2'},{name:`${label}异常率`,values:constructionSeries(Math.max(5,100-value),1.5),color:'#f4a76a'}])}`})()}`);
  const center=board.querySelector('.board-map'),bottom=document.createElement('div');bottom.className='situation-bottom';bottom.innerHTML=constructionBottom(units);center.querySelector('.map-panel').after(bottom);
  const ticker=board.querySelector('.board-ticker'),items=constructionTickerItems(units);if(ticker){ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent={construction:'建设覆盖预警',entry:'入径执行预警',monitoring:'规范监测预警'}[state.mapMetric];ticker.querySelector('b').textContent=periodText();ticker.querySelector('small')?.remove();ticker.querySelector('#boardTickerText').textContent=items[0]||'当前范围暂无需关注的地区';bottom.before(ticker);tickerPosition=0}
  center.querySelector('.panel-head h2').textContent='一体化门诊建设与服务地图';
  const mapTools=center.querySelector('.map-tools'),mapStage=center.querySelector('.map-stage');if(mapTools&&mapStage)mapStage.append(mapTools);
  const tabs=center.querySelector('.map-metrics');tabs.innerHTML=[['construction','建成覆盖率'],['entry','入径率'],['monitoring','规范监测率']].map(([key,label])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}" aria-pressed="${state.mapMetric===key}">${label}</button>`).join('');
  center.querySelector('#mapMetricLabel').textContent={construction:'建成覆盖率',entry:'入径率',monitoring:'规范监测率'}[state.mapMetric];
  return root.innerHTML;
};
pages.dashboard=dashboard;
const mapValueBeforeConstruction=mapValue,provinceValueBeforeConstruction=provinceMetricValue,bindMapBeforeConstruction=bindMapControls;
mapValue=function(node){return state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='monitoring'?constructionValue(node,'monitoring'):mapValueBeforeConstruction(node)};
provinceMetricValue=function(){return state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='monitoring'?constructionValue(null,'monitoring'):provinceValueBeforeConstruction()};
bindMapControls=function(){bindMapBeforeConstruction();if(state.page!=='dashboard'||state.dashboardView!=='construction')return;document.querySelectorAll('.construction-board [data-map-metric]').forEach(button=>button.onclick=()=>{state.mapMetric=button.dataset.mapMetric;render()});document.querySelectorAll('[data-construction-monitor]').forEach(button=>button.onclick=()=>{state.constructionMonitor=button.dataset.constructionMonitor;render()})};
// Final dashboard refinements keep chart labels, tooltips and map comparisons in sync.
const situationTrendBeforeFinal=situationTrend;
situationTrend=function(p){
  const host=document.createElement('div');host.innerHTML=situationTrendBeforeFinal(p);
  const svg=host.querySelector('svg');
  [0,1,2].forEach(i=>{
    const factor=[.82,.91,1][i],managedFactor=[.76,.87,1][i],overlap=p.overlap*factor;
    const managedOverlap=p.managedOverlap*managedFactor;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('class','chart-hover-zone');rect.setAttribute('x',String(75+i*99));rect.setAttribute('y','27');rect.setAttribute('width','82');rect.setAttribute('height','140');rect.setAttribute('fill','transparent');
    const title=document.createElementNS('http://www.w3.org/2000/svg','title');
    title.textContent=`${2024+i}年｜高血压确诊 ${people(p.high*factor)}，建档 ${people(p.managedHigh*managedFactor)}，建档率 ${formatPct(p.managedHigh*managedFactor/(p.high*factor)*100)}；糖尿病确诊 ${people(p.diabetes*factor)}，建档 ${people(p.managedDiabetes*managedFactor)}，建档率 ${formatPct(p.managedDiabetes*managedFactor/(p.diabetes*factor)*100)}；高糖合并确诊 ${people(overlap)}，建档 ${people(managedOverlap)}，建档率 ${formatPct(managedOverlap/Math.max(1,overlap)*100)}`;
    rect.append(title);svg.append(rect);
  });
  return host.innerHTML;
};
const situationPanelsBeforeFinal=situationPanels;
situationPanels=function(){
  const parts=situationPanelsBeforeFinal(),root=document.createElement('div');root.innerHTML=parts.left;
  const first=root.querySelector('.situation-panel');
  first.querySelector('h2').textContent='确诊与建档';
  const headline=first.querySelector('.situation-headline');
  headline.innerHTML=`<div class="situation-headline-item"><strong>${people(populationData().diagnosed)}</strong><span>两慢病确诊人数</span></div><div class="situation-headline-item"><strong class="situation-managed-total">${people(populationData().managed)}</strong><span>两慢病专档人数</span></div>`;
  root.querySelector('.situation-complication-list')?.closest('.situation-panel')?.querySelector('h2')?.replaceChildren('并发症情况');
  parts.left=root.innerHTML;
  const right=document.createElement('div');right.innerHTML=parts.right;
  right.querySelector('.situation-panel h2').textContent='风险分层趋势';
  right.querySelector('.situation-panel .situation-note')?.remove();
  right.querySelector('.situation-risk-total small')?.remove();
  right.querySelectorAll('.situation-spark polyline').forEach((line,j)=>line.getAttribute('points').split(' ').forEach((point,i)=>{const [x,y]=point.split(',').map(Number),circle=document.createElementNS('http://www.w3.org/2000/svg','circle'),title=document.createElementNS('http://www.w3.org/2000/svg','title');circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r','4');circle.setAttribute('fill',['#ef8065','#f4c767','#35bde5'][j]);title.textContent=`${2023+i}年 ${['高风险','中风险','低风险'][j]}占比约 ${formatPct(Math.max(0,(65-y)/56*50))}`;circle.append(title);line.parentNode.append(circle)}));
  const warning=right.querySelector('.situation-warning-total');warning?.querySelector('small')?.remove();
  right.querySelectorAll('.situation-rank').forEach(row=>{
    const node=situationUnits().find(x=>fullName(x)===row.querySelector('span')?.textContent);
    if(!node)return;
    const count=riskProfileFor(node).high,ratio=count/Math.max(1,populationFor(node).managed)*100;
    row.querySelector('strong').textContent=`${people(count)} · ${formatPct(ratio)}`;
    row.dataset.boardTip=`${fullName(node)}｜高风险在管 ${people(count)}，占专档 ${formatPct(ratio)}`;
  });
  right.querySelector('.situation-warning-scroll')?.setAttribute('title','悬浮暂停滚动，可查看全部地区');
  parts.right=right.innerHTML;
  return parts;
};
const situationBottomBeforeFinal=situationBottom;
situationBottom=function(units){
  const host=document.createElement('div');host.innerHTML=situationBottomBeforeFinal(units);
  const panels=host.querySelectorAll('.situation-panel');
  const metric=state.mapMetric;
  if(metric==='diagnosed'){
    panels[0].querySelector('h2').textContent='区域确诊负荷';panels[1].querySelector('h2').textContent='未建档确诊患者数';
    panels[0].querySelectorAll('.situation-row').forEach(row=>{
      const node=units.find(x=>fullName(x)===row.querySelector('span')?.textContent);if(!node)return;
      const p=populationFor(node),sum=Math.max(1,p.high+p.diabetes);
      row.querySelector('i').innerHTML=`<b style="width:${p.high/sum*100}%;background:#398ff0"></b><b style="width:${p.diabetes/sum*100}%;background:#2cc5a4"></b>`;
      row.title=`${fullName(node)}：高血压 ${people(p.high)}，糖尿病 ${people(p.diabetes)}，两病可同患`;
    });
    panels[0].querySelector('h2').insertAdjacentHTML('afterend','<div class="construction-key chart-legend"><span><i style="background:#398ff0"></i>高血压</span><span><i style="background:#2cc5a4"></i>糖尿病</span></div>');
    panels[1].querySelector('.situation-note')?.remove();
  }else if(metric==='comorbidity')panels[0].querySelector('h2').textContent='区域共病人数';
  else{panels[0].querySelector('h2').textContent='区域基层就诊人次';panels[1].querySelector('h2').textContent='区域基层就诊人次占比'}
  return host.innerHTML;
};
const constructionBottomBeforeFinal=constructionBottom;
constructionBottom=function(units){
  const metric=state.mapMetric,ordered=[...units].sort((a,b)=>constructionValue(b,metric)-constructionValue(a,metric));
  const rows=(list,make)=>`<div class="construction-scroll auto-scroll"><div class="scroll-track">${[...list,...list].map(make).join('')}</div></div>`;
  const rank=(title,list,make)=>constructionPanel(title,rows(list,make));
  const percentRow=x=>`<div class="construction-rank" title="${esc(fullName(x))} ${formatPct(constructionValue(x,metric))}"><span>${esc(fullName(x))}</span><i><b style="width:${constructionValue(x,metric)}%"></b></i><strong>${formatPct(constructionValue(x,metric))}</strong></div>`;
  if(metric==='construction'){
    const missing=[...units].sort((a,b)=>(b.should-b.clinics)-(a.should-a.clinics));
    const max=Math.max(1,...missing.map(x=>x.should-x.clinics));
    const cover=x=>{const clinicsInScope=scopeDescendants(x).filter(item=>item.clinics),basic=clinicsInScope.filter(item=>nodeTier(item)==='基本保障').length,enhanced=clinicsInScope.filter(item=>nodeTier(item)==='强化功能').length,explore=clinicsInScope.filter(item=>nodeTier(item)==='鼓励探索').length;return `<div class="construction-rank" title="${esc(fullName(x))}：基本保障 ${basic} 家，强化功能 ${enhanced} 家，鼓励探索 ${explore} 家；覆盖率 ${formatPct(constructionValue(x,metric))}"><span>${esc(fullName(x))}</span><i class="construction-stacked"><b style="width:${basic/Math.max(1,x.should)*100}%;background:#398ff0"></b><b style="width:${enhanced/Math.max(1,x.should)*100}%;background:#39c6a6"></b><b style="width:${explore/Math.max(1,x.should)*100}%;background:#f4c66d"></b></i><strong>${formatPct(constructionValue(x,metric))}</strong></div>`};
    return rank('区域建成覆盖率',ordered,cover)+rank('区域未建成机构数',missing,x=>`<div class="construction-rank" title="${esc(fullName(x))} 未建成 ${Math.max(0,x.should-x.clinics)} 家"><span>${esc(fullName(x))}</span><i><b style="width:${Math.max(0,x.should-x.clinics)/max*100}%;background:#f2a86e"></b></i><strong>${Math.max(0,x.should-x.clinics)} 家</strong></div>`);
  }
  if(metric==='entry')return rank('区域入径率',ordered,percentRow);
  const nodes=['诊前采集率','规范监测率','诊中随访率','健康处方打印率','异常追踪率','转诊率'];
  const nodeValue=(x,i)=>Math.max(0,Math.min(100,constructionValue(x,'monitoring')+[3,0,-4,-9,-13,-35][i]));
  const nodeRows=nodes.map((name,i)=>`<div class="construction-node-region"><strong>${name}</strong>${rows(ordered,x=>`<div class="construction-rank" title="${esc(fullName(x))} ${name} ${formatPct(nodeValue(x,i))}"><span>${esc(fullName(x))}</span><i><b style="width:${nodeValue(x,i)}%;background:${['#39b8ef','#43d1ba','#85a8ff','#f4c66d','#f2a86e','#b995ed'][i]}"></b></i><strong>${formatPct(nodeValue(x,i))}</strong></div>`)}</div>`).join('');
  return rank('区域节点执行率',ordered,percentRow)+constructionPanel('各地市路径节点执行情况',`<div class="construction-node-regions">${nodeRows}</div>`);
};
const dashboardBeforeFinal=dashboard;
dashboard=function(){
  const html=dashboardBeforeFinal();if(state.page!=='dashboard'||!['situation','construction'].includes(state.dashboardView))return html;
  const host=document.createElement('div');host.innerHTML=html;const board=host.querySelector('#dashboardBoard');
  board.querySelector('.map-zoom-level')?.remove();
  if(state.dashboardView==='construction'){
    const left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child');
    left.querySelector('.construction-coverage').innerHTML=`<div class="construction-doughnut" style="--doughnut:${clinicMetrics(currentNode()).built/Math.max(1,clinicMetrics(currentNode()).eligible)*100}%"><div><strong>${formatPct(clinicMetrics(currentNode()).built/Math.max(1,clinicMetrics(currentNode()).eligible)*100)}</strong><span>覆盖率</span></div></div><div class="construction-coverage-legend"><div><i></i><span>已建成<strong>${clinicMetrics(currentNode()).built} 家</strong></span></div><div><i></i><span>未建成<strong>${Math.max(0,clinicMetrics(currentNode()).eligible-clinicMetrics(currentNode()).built)} 家</strong></span></div><div><i></i><span>基层机构总数<strong>${clinicMetrics(currentNode()).eligible} 家</strong></span></div></div>`;
    left.querySelector('.construction-foot')?.remove();
    const visits=left.querySelectorAll('.construction-panel')[2];visits.querySelector('h2').textContent='一体化门诊服务人次';
    const monthly=Array.from({length:12},(_,i)=>Math.round(clinicMetrics(currentNode()).built*(990+i*46+Math.sin(i*.8)*80)));
    visits.querySelector('.construction-key').innerHTML='<span><i style="background:#46c7f0"></i>门诊服务人次</span>';
    visits.querySelector('.construction-key').insertAdjacentHTML('beforebegin',`<div class="construction-total"><strong>${Math.round(monthly.reduce((a,b)=>a+b,0)/12).toLocaleString()}</strong><span>月均服务人次</span></div>`);
    visits.querySelector('svg').outerHTML=constructionBarChart(monthly);
    const entry=right.querySelector('.construction-panel');entry.querySelector('h2').textContent='入径率趋势';entry.querySelector('.construction-key').innerHTML='<span><i style="background:#f7c66e"></i>入径率</span>';
    entry.querySelector('.construction-key').insertAdjacentHTML('beforebegin',`<div class="construction-total"><strong>${formatPct(dashboardRate(currentNode(),'entry'))}</strong><span>当前入径率</span></div>`);
    board.querySelectorAll('[data-map-metric="monitoring"]').forEach(x=>x.textContent='节点执行率');
    board.querySelector('#mapMetricLabel')?.replaceChildren(state.mapMetric==='monitoring'?'节点执行率':state.mapMetric==='entry'?'入径率':'建成覆盖率');
    if(state.mapMetric==='monitoring')board.querySelector('.board-ticker span').textContent='节点执行预警';
  }
  board.querySelectorAll('.construction-key,.situation-trend-legend').forEach(x=>x.classList.add('chart-legend'));
  board.querySelectorAll('.situation-row,.situation-pct-row,.construction-rank,.construction-nodes>div,.construction-tier-list>div,.situation-pyramid>div').forEach(row=>{if(!row.title)row.title=row.textContent.replace(/\s+/g,' ').trim()});
  board.querySelectorAll('.board-panel .situation-flow-ring,.board-panel .construction-doughnut,.board-panel .situation-risk-bars i,.board-panel .construction-nodes i,.board-panel .construction-tier-list i').forEach(chart=>{if(!chart.title)chart.title=chart.closest('.situation-pct-row,.construction-nodes>div,.construction-tier-list>div')?.textContent.replace(/\s+/g,' ').trim()||chart.closest('.board-panel')?.textContent.replace(/\s+/g,' ').trim()});
  board.querySelectorAll('.situation-spark polyline,.situation-complication-head polyline,.construction-node-head polyline').forEach(line=>{const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=line.closest('.board-panel')?.textContent.replace(/\s+/g,' ').trim()||'趋势';line.append(title)});
  return host.innerHTML;
};
pages.dashboard=dashboard;
const mapTooltipBeforeFinal=mapTooltip;
mapTooltip=function(node){
  if(state.page!=='dashboard'||state.dashboardView!=='construction')return mapTooltipBeforeFinal(node);
  const metrics=clinicMetrics(node),labels=state.mapMetric==='construction'?[['已建成机构',`${metrics.built} 家`],['基层机构总数',`${metrics.eligible} 家`],['未建成机构',`${Math.max(0,metrics.eligible-metrics.built)} 家`]]:state.mapMetric==='entry'?[['入径率',formatPct(dashboardRate(node,'entry'))]]:[['节点执行率',formatPct(constructionValue(node,'monitoring'))]];
  return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong>${labels.map(([name,value])=>`<div><span>${name}</span><b>${value}</b></div>`).join('')}<div><span>统计期</span><b>${esc(periodText())}</b></div></div>`;
};

function constructionBarChart(values){
  const max=Math.ceil(Math.max(...values)*1.1/100000)*100000,width=360,height=148,left=42,right=8,top=9,bottom=27;
  const x=i=>left+i*(width-left-right)/12,y=v=>height-bottom-v/max*(height-top-bottom);
  return `<svg class="construction-line construction-bar-chart" viewBox="0 0 360 148" role="img" aria-label="一至十二月服务人次柱状图"><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-5}" y="${y(max*t)+3}" text-anchor="end">${Math.round(max*t)}</text>`).join('')}</g>${values.map((v,i)=>`<rect x="${x(i)+3}" y="${y(v)}" width="${(width-left-right)/12-6}" height="${height-bottom-y(v)}" fill="#46c7f0"><title>${i+1}月 门诊服务人次 ${v.toLocaleString()} 人次</title></rect><text class="construction-month" x="${x(i)+(width-left-right)/24}" y="${height-4}">${i+1}月</text>`).join('')}</svg>`;
}
const renderBeforeDashboardChartTips=render;
render=function(){
  renderBeforeDashboardChartTips();
  if(state.page!=='dashboard')return;
  document.querySelectorAll('#dashboardBoard .board-panel i,#dashboardBoard .board-panel svg rect,#dashboardBoard .board-panel svg circle').forEach(shape=>{
    if(shape.hasAttribute('data-board-tip'))return;
    if(shape.title?.textContent||shape.querySelector('title'))return;
    if(shape.closest('[data-board-tip]')||shape.closest('.construction-rank[title]'))return;
    const row=shape.closest('.board-portrait-row,.board-compare>div,.board-portrait-risk,.situation-row,.situation-pct-row,.construction-rank,.construction-nodes>div,.construction-tier-list>div,.situation-pyramid>div');
    const label=row?.textContent.replace(/\s+/g,' ').trim();if(!label)return;
    if(shape instanceof SVGElement){const tip=document.createElementNS('http://www.w3.org/2000/svg','title');tip.textContent=label;shape.append(tip)}else shape.title=label;
  });
};
// The board uses one period model for every time-based chart.
function boardTimeAxis(values){
  if(state.periodMode==='month')return {labels:Array.from({length:12},(_,i)=>`${i+1}月`),values};
  if(state.periodMode==='quarter')return {labels:['第一季度','第二季度','第三季度','第四季度'],values:[0,1,2,3].map(i=>values.slice(i*3,i*3+3).reduce((a,b)=>a+b,0)/3)};
  const current=values.reduce((a,b)=>a+b,0)/values.length;
  return {labels:['2024年','2025年','2026年'],values:[current*.86,current*.93,current]};
}
constructionLineChart=function(series,unit='%',maxOverride){
  const adapted=series.map(item=>({...item,...boardTimeAxis(item.values)}));
  const labels=adapted[0].labels,width=360,height=166,left=43,right=28,top=12,bottom=30;
  const max=maxOverride||Math.ceil(Math.max(1,...adapted.flatMap(x=>x.values))*1.12/10)*10;
  const x=i=>left+i*(width-left-right)/Math.max(1,labels.length-1),y=v=>height-bottom-v/max*(height-top-bottom);
  const grid=[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-5}" y="${y(max*t)+3}" text-anchor="end">${Math.round(max*t)}${unit}</text>`).join('');
  return `<svg class="construction-line" viewBox="0 0 ${width} ${height}" role="img" aria-label="按统计周期展示的${unit==='%'?'百分比':'人次'}趋势图"><g class="construction-grid">${grid}</g>${adapted.map(item=>`<polyline points="${item.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${item.color}" stroke-width="2.5"/>${item.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="${item.color}"><title>${labels[i]} ${item.name} ${unit==='%'?formatPct(v):Math.round(v).toLocaleString()+' 人次'}</title></circle>`).join('')}`).join('')}${labels.map((label,i)=>`<rect class="chart-period-zone" x="${Math.max(left,x(i)-(width-left-right)/Math.max(1,labels.length-1)/2)}" y="${top}" width="${(width-left-right)/labels.length}" height="${height-top-bottom}" fill="transparent"><title>${label}｜${adapted.map(item=>`${item.name} ${unit==='%'?formatPct(item.values[i]):Math.round(item.values[i]).toLocaleString()+' 人次'}`).join('；')}</title></rect><text class="construction-month" x="${x(i)}" y="${height-5}">${label}</text>`).join('')}</svg>`;
};
constructionBarChart=function(values){
  if(homeView()){
    const data=boardTimeAxis(values), width=464, height=154, left=50, right=1, top=25, bottom=24;
    const max=Math.max(200,Math.ceil(Math.max(...data.values)/10000/50)*50), step=(width-left-right)/data.labels.length;
    const y=v=>height-bottom-v/max*(height-top-bottom);
    return `<svg class="construction-line construction-bar-chart home-service-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="按统计周期展示的服务人次柱状图，单位万人次"><defs><linearGradient id="homeServiceBar" x2="0" y2="1"><stop stop-color="#09baf4"/><stop offset="1" stop-color="#073177"/></linearGradient></defs><text class="service-unit" x="42" y="14" text-anchor="end">万人次</text><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="42" y="${y(max*t)+5}" text-anchor="end">${max*t}</text>`).join('')}</g>${data.values.map((v,i)=>{const cx=left+step*(i+.5), yy=y(v/10000), base=y(0), half=28;return `<path d="M${cx-half},${yy} L${cx},${yy-6} L${cx+half},${yy} L${cx+half},${base-5} L${cx},${base} L${cx-half},${base-5} Z" fill="url(#homeServiceBar)" stroke="#188fd4" stroke-width=".5"/><path d="M${cx-half},${yy} L${cx},${yy+6} L${cx+half},${yy} L${cx},${yy-6} Z" fill="#08a8ef"/><text class="service-bar-value" x="${cx}" y="${yy-12}" text-anchor="middle">${(v/10000).toFixed(2)}</text><rect x="${left+step*i}" y="${top}" width="${step}" height="${base-top}" fill="transparent"><title>${data.labels[i]} 门诊服务人次 ${Math.round(v).toLocaleString()} 人次</title></rect><text class="construction-month" x="${cx}" y="${height-3}" text-anchor="middle">${data.labels[i]}</text>`}).join('')}</svg>`;
  }
  const data=boardTimeAxis(values),labels=data.labels,width=360,height=184,left=75,right=12,top=22,bottom=31,max=Math.ceil(Math.max(...data.values)*1.12/100000)*100000;
  const step=(width-left-right)/labels.length,x=i=>left+i*step,y=v=>height-bottom-v/max*(height-top-bottom);
  return `<svg class="construction-line construction-bar-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="按统计周期展示的服务人次柱状图"><defs><linearGradient id="serviceBarLeft" x2="0" y2="1"><stop stop-color="#08b8f5"/><stop offset="1" stop-color="#073177"/></linearGradient><linearGradient id="serviceBarRight" x2="0" y2="1"><stop stop-color="#078bdd"/><stop offset="1" stop-color="#071e5b"/></linearGradient></defs><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-5}" y="${y(max*t)+3}" text-anchor="end">${Math.round(max*t)}</text>`).join('')}</g>${data.values.map((v,i)=>{const cx=x(i)+step/2,half=Math.min(22,step*.27),yy=y(v),base=height-bottom;return `<path d="M${cx-half},${yy} L${cx},${yy+7} L${cx},${base} L${cx-half},${base-7} Z" fill="url(#serviceBarLeft)"/><path d="M${cx},${yy+7} L${cx+half},${yy} L${cx+half},${base-7} L${cx},${base} Z" fill="url(#serviceBarRight)"/><path d="M${cx-half},${yy} L${cx},${yy-7} L${cx+half},${yy} L${cx},${yy+7} Z" fill="#08a8ef" stroke="#59d9ff" stroke-width=".5"/><text class="service-bar-value" x="${cx}" y="${yy-10}" text-anchor="middle">${Math.round(v).toLocaleString()}</text><rect class="chart-period-zone" x="${x(i)}" y="${top}" width="${step}" height="${height-bottom-top}" fill="transparent"><title>${labels[i]} 门诊服务人次 ${Math.round(v).toLocaleString()} 人次</title></rect><text class="construction-month" x="${cx}" y="${height-5}">${labels[i]}</text>`}).join('')}</svg>`;
};
function outcomeValue(node,key){
  const x=node||cities[0],control=x.control||65,follow=x.follow||75;
  return {contract:Math.min(96,follow+7),managed:Math.min(95,follow-4),authenticity:Math.min(99,follow+14),target:control,improved:Math.max(20,control-11),complication:Math.max(8,33-control*.13),primary:Math.max(30,Math.min(70,48+(x.entry-65)*.62)),referral:Math.max(8,x.entry-44)}[key];
}
function outcomeSeries(value,phase=0){return Array.from({length:12},(_,i)=>Math.max(0,Math.min(100,value-5+i*.55+Math.sin(i*.72+phase)*2.1)))}
function outcomePanel(title,content){return `<section class="board-panel outcome-board-panel"><h2>${title}</h2>${content}</section>`}
function outcomeHeadline(value,label){return `<div class="outcome-headline"><strong>${formatPct(value)}</strong><span>${label}</span></div>`}
function outcomeRings(rows){return `<div class="outcome-rings">${rows.map(([name,value,color])=>`<div class="outcome-ring-item" data-board-tip="${name}｜${formatPct(value)}"><i style="--ring:${Math.max(0,Math.min(100,value))}%;--ring-color:${color}"><b>${formatPct(value)}</b></i><span>${name}</span></div>`).join('')}</div>`}
function outcomeSources(node){
  const adjustment=(node?.follow||78)-78;
  return `<div class="outcome-source-list">${[['血压达标数据',76+adjustment*.3],['血糖指标达标数据',68+adjustment*.4]].map(([name,device])=>`<div data-board-tip="回溯365天｜${name}\n设备采集 ${formatPct(device)}\n手工输入 ${formatPct(100-device)}"><span>${name}</span><div class="outcome-source-bar"><i style="width:${device}%"></i><b style="width:${100-device}%"></b></div><small>设备 ${formatPct(device)} · 手工 ${formatPct(100-device)}</small></div>`).join('')}</div><div class="chart-legend"><span><i style="background:#43c9e9"></i>设备采集</span><span><i style="background:#f5bd75"></i>手工输入</span></div>`;
}
function outcomeComplications(node){
  const disease=state.outcomeDisease||'高血压',base=outcomeValue(node,'complication'),value=disease==='糖尿病'?base-2.8:base;
  const names=disease==='高血压'?['脑卒中','冠心病','慢性肾病']:['糖尿病肾病','视网膜病变','糖尿病足'];
  const count=disease==='高血压'?populationFor(node||cities[0]).managedHigh:populationFor(node||cities[0]).managedDiabetes;
  return `<div class="outcome-complication-tabs situation-tabs">${['高血压','糖尿病'].map(name=>`<button type="button" data-outcome-disease="${name}" class="${name===disease?'active':''}">${name}</button>`).join('')}</div>${outcomeHeadline(value,`${disease}并发症发生率`)}<div class="outcome-complication-list">${names.map((name,i)=>{const rate=value*(.48-i*.09);return `<div data-board-tip="${name}｜${people(count*rate/100)}\n发生率 ${formatPct(rate)}"><span>${name}</span><strong>${people(count*rate/100)}</strong><b>${formatPct(rate)}</b></div>`}).join('')}</div>`;
}
function outcomeRank(units,key){
  const sorted=[...units].sort((a,b)=>outcomeValue(b,key)-outcomeValue(a,key));
  return `<div class="outcome-rank auto-scroll"><div class="scroll-track">${[...sorted,...sorted].map(x=>`<div class="outcome-rank-row" title="${esc(fullName(x))} ${formatPct(outcomeValue(x,key))}"><span>${esc(fullName(x))}</span><i><b style="width:${outcomeValue(x,key)}%"></b></i><strong>${formatPct(outcomeValue(x,key))}</strong></div>`).join('')}</div></div>`;
}
function outcomeBottom(units){
  const up=units.reduce((n,x)=>n+outcomeValue(x,'referral'),0)/Math.max(1,units.length),down=Math.min(95,up+24);
  return outcomePanel('区域基层就诊率',outcomeRank(units,'primary'))+outcomePanel('双向转诊',`<div class="outcome-referral-flow"><div class="outcome-referral-node">基层</div><div class="outcome-referral-paths"><div data-board-tip="上转率 ${formatPct(up)}"><span>上转</span><strong>${formatPct(up)}</strong><i>→</i></div><div data-board-tip="下转率 ${formatPct(down)}"><i>←</i><span>下转</span><strong>${formatPct(down)}</strong></div></div><div class="outcome-referral-node">医院</div></div><div class="outcome-referral-foot">${units.length} 个下级单位 · ${esc(periodText())}</div>`);
}
const dashboardBeforeOutcomesBoard=dashboard;
dashboard=function(){
  if((state.dashboardView||'home')==='home'){
    const host=document.createElement('div');host.innerHTML=dashboardBeforeOutcomesBoard();
    const right=host.querySelector('#dashboardBoard .board-stack:last-child');
    const node=currentNode(),metrics=clinicMetrics(node),entry=dashboardRate(node,'entry'),monitor=constructionValue(node,'monitoring'),control=outcomeValue(node,'target');
    const coverage=metrics.built/Math.max(1,metrics.eligible)*100;
    right.innerHTML=`<section class="board-panel"><h2>一体化门诊建设</h2><div class="home-coverage"><div class="home-coverage-ring" style="--ring:${coverage}%" data-board-tip="建成覆盖率 ${formatPct(coverage)}｜已建成 ${metrics.built} 家\n基层机构 ${metrics.eligible} 家"><strong>${formatPct(coverage)}</strong></div><div><span>已建成</span><b>${metrics.built} 家</b><span>未建成</span><b>${metrics.eligible-metrics.built} 家</b></div></div></section>`+
      `<section class="board-panel"><h2>路径服务承接</h2><div class="home-path-steps">${[['专档在管',people(populationData().managed)],['入径率',formatPct(entry)],['节点执行率',formatPct(monitor)]].map(([label,value])=>`<div data-board-tip="${label} ${value}"><strong>${value}</strong><span>${label}</span></div>`).join('')}</div></section>`+
      `<section class="board-panel"><h2>健康结果</h2>${outcomeRings([['血压达标',control,'#42c8ed'],['血糖达标',control-7,'#f2c26e'],['血压改善',control-11,'#55d8bd'],['血糖改善',control-16,'#b3a1f3']])}</section>`;
    const ticker=host.querySelector('.board-ticker');
    if(ticker){
      ticker.querySelector('span').textContent='全省管理提醒';
      ticker.querySelector('b').textContent=periodText();
      ticker.querySelector('small')?.remove();
    }
    return host.innerHTML;
  }
  if(state.dashboardView==='construction'){
    const host=document.createElement('div');host.innerHTML=dashboardBeforeOutcomesBoard();
    const board=host.querySelector('#dashboardBoard'),node=currentNode(),metrics=clinicMetrics(node);
    board.querySelectorAll('.construction-tier-list>div').forEach((row,i)=>{
      const percent=Number.parseFloat(row.querySelector('strong').textContent),count=i===0?metrics.built:Math.round(metrics.built*percent/100);
      row.querySelector('strong').textContent=`${count} 家 · ${formatPct(percent)}`;
      row.dataset.boardTip=`${row.querySelector('span').textContent}｜${count} 家\n占已建成 ${formatPct(percent)}`;
    });
    const nodeHead=board.querySelector('.construction-node-head');
    if(nodeHead){nodeHead.querySelector('strong').textContent=formatPct(constructionValue(node,'monitoring'));nodeHead.querySelector('span').textContent='节点总执行率'}
    board.querySelector('.construction-total span')?.replaceChildren('月均服务人次');
    board.querySelectorAll('.construction-total span')[1]?.replaceChildren('入径率');
    const monitorPanel=board.querySelector('.board-stack:last-child .construction-panel:last-child');
    const base=node||cities[0],follow=base.follow;
    if(monitorPanel){monitorPanel.innerHTML=`<h2>核心监测情况</h2><div class="monitor-matrix">${[['血压',follow+4,10],['血糖',follow-2,15],['糖化',follow-16,22],['血脂',follow-25,27]].map(([name,rate,abnormal])=>`<div data-board-tip="${name}｜监测率 ${formatPct(rate)}\n异常率 ${formatPct(abnormal)}"><i style="--ring:${rate}%;--ring-color:#43c9e9"><b>${formatPct(rate)}</b></i><span>${name}</span><small>异常 ${formatPct(abnormal)}</small></div>`).join('')}</div><div class="chart-legend"><span><i style="background:#43c9e9"></i>监测率</span><span><i style="background:#f4a76a"></i>异常率</span></div>`}
    return host.innerHTML;
  }
  if(state.dashboardView!=='outcomes')return dashboardBeforeOutcomesBoard();
  if(state.dashboardMetricView!=='outcomes'){state.mapMetric='outcomeBpTarget';state.dashboardMetricView='outcomes';state.activeMapLink=null}
  const host=document.createElement('div');host.innerHTML=dashboardBeforeOutcomesBoard();
  const board=host.querySelector('#dashboardBoard'),node=currentNode(),units=childUnits(),v=key=>outcomeValue(node,key),left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child');
  board.classList.add('outcome-board','board-no-kpis');board.querySelector('.board-kpis')?.remove();
  left.innerHTML=outcomePanel('签约率',`${outcomeHeadline(v('contract'),'两慢专档签约患者占比')}${constructionLineChart([{name:'签约率',values:outcomeSeries(v('contract')),color:'#42c9f2'}])}`)+
    outcomePanel('规范管理率',outcomeRings([['高血压',v('managed')+2,'#43c9e9'],['糖尿病',v('managed')-4,'#6fd9b8']]))+
    outcomePanel('数据来源',`${outcomeHeadline(v('authenticity'),'数据可信度')}${outcomeSources(node)}`);
  const targetRows=[['血压',v('target'),'#42c8ed'],['血糖',v('target')-7,'#f2c26e'],['糖化',v('target')-12,'#65d4aa'],['血脂',v('target')-17,'#b8a0f6']];
  const improveRows=[['血压',v('improved')],['血糖',v('improved')-4],['糖化',v('improved')-9],['血脂',v('improved')-12]];
  right.innerHTML=outcomePanel('控制率',outcomeRings(targetRows))+
    outcomePanel('改善率',`<div class="outcome-slope">${improveRows.map(([name,value],i)=>`<div data-board-tip="${name}改善率 ${formatPct(value)}"><span>${name}</span><i style="--start:${Math.max(10,value-9)}%;--end:${value}%;--tone:${['#42c8ed','#f2c26e','#65d4aa','#b8a0f6'][i]}"><b></b><em></em></i><strong>${formatPct(value)}</strong></div>`).join('')}</div><div class="outcome-slope-caption">基线 → 本期</div>`)+
    outcomePanel('并发症发生率',outcomeComplications(node));
  const center=board.querySelector('.board-map'),bottom=document.createElement('div');bottom.className='situation-bottom';bottom.innerHTML=outcomeBottom(units);center.querySelector('.map-panel').after(bottom);
  center.querySelector('.panel-head h2').textContent='区域管理成效地图';
  const tools=center.querySelector('.map-tools'),stage=center.querySelector('.map-stage');if(tools&&stage)stage.append(tools);
  const outcomeMetrics=[['outcomeTarget','控制率'],['outcomeImproved','改善率'],['outcomeComplication','并发症发生率'],['outcomePrimary','基层就诊率'],['outcomeReferral','双向转诊']];
  center.querySelector('.map-metrics').innerHTML=outcomeMetrics.map(([key,label])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}" aria-pressed="${state.mapMetric===key}">${label}</button>`).join('');
  center.querySelector('#mapMetricLabel').textContent=outcomeMetrics.find(([key])=>key===state.mapMetric)?.[1]||'基层就诊率';
  const sortKey=({outcomeTarget:'target',outcomeImproved:'improved',outcomeComplication:'complication',outcomeReferral:'referral'})[state.mapMetric]||'primary';
  const ticker=board.querySelector('.board-ticker'),metricLabel=outcomeMetrics.find(([key])=>key===state.mapMetric)?.[1]||'基层就诊率';
  const items=[...units].sort((a,b)=>outcomeValue(a,sortKey)-outcomeValue(b,sortKey)).slice(0,5).map(x=>`${fullName(x)}${metricLabel} ${formatPct(outcomeValue(x,sortKey))}`);
  if(ticker){ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent=`${metricLabel}预警`;ticker.querySelector('b').textContent=periodText();ticker.querySelector('small')?.remove();ticker.querySelector('#boardTickerText').textContent=items[0]||'本级暂无下级单位';bottom.before(ticker);tickerPosition=0}
  return host.innerHTML;
};
pages.dashboard=dashboard;
const mapValueBeforeOutcomesBoard=mapValue,provinceValueBeforeOutcomesBoard=provinceMetricValue,mapTooltipBeforeOutcomesBoard=mapTooltip,bindMapBeforeOutcomesBoard=bindMapControls;
const outcomeMapKey=()=>({outcomeTarget:'target',outcomeImproved:'improved',outcomeComplication:'complication',outcomeReferral:'referral'})[state.mapMetric]||'primary';
mapValue=function(node){return state.page==='dashboard'&&state.dashboardView==='outcomes'?outcomeValue(node,outcomeMapKey()):mapValueBeforeOutcomesBoard(node)};
provinceMetricValue=function(){return state.page==='dashboard'&&state.dashboardView==='outcomes'?outcomeValue(null,outcomeMapKey()):provinceValueBeforeOutcomesBoard()};
mapTooltip=function(node){if(state.page!=='dashboard'||state.dashboardView!=='outcomes')return mapTooltipBeforeOutcomesBoard(node);const labels={target:'控制率',improved:'改善率',complication:'并发症发生率',primary:'基层就诊率',referral:'上转率'},key=outcomeMapKey();return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>${labels[key]}</span><b>${formatPct(outcomeValue(node,key))}</b></div>${key==='referral'?`<div><span>下转率</span><b>${formatPct(outcomeValue(node,'referral')+24)}</b></div>`:''}</div>`};
bindMapControls=function(){bindMapBeforeOutcomesBoard();if(state.page!=='dashboard'||state.dashboardView!=='outcomes')return;document.querySelectorAll('.outcome-board [data-map-metric]').forEach(button=>button.onclick=()=>{state.mapMetric=button.dataset.mapMetric;render()})};
document.addEventListener('click',event=>{const button=event.target.closest('[data-outcome-disease]');if(!button)return;state.outcomeDisease=button.dataset.outcomeDisease;render()});
document.addEventListener('click',event=>{
  const button=event.target.closest('#dashboardBoard [data-map-scope]');
  if(!button||state.city==='all'||button.dataset.mapScope==='county'||button.dataset.mapScope==='town')return;
  event.stopPropagation();
  state.city='all';
  state.mapScope=button.dataset.mapScope;
  mapZoom=1;
  render();
},true);
const situationTrendBeforePeriod=situationTrend;
situationTrend=function(p){
  if(state.periodMode==='year')return situationTrendBeforePeriod(p);
  const labels=boardTimeAxis(Array.from({length:12},(_,i)=>i)).labels,n=labels.length,width=370,height=170,left=44,right=24,top=27,bottom=29;
  const max=Math.max(p.high,p.diabetes)*1.18,step=(width-left-right)/n;
  const series=[['高血压',p.high,p.managedHigh,'#398ff0','#17599d'],['糖尿病',p.diabetes,p.managedDiabetes,'#2cc5a4','#147b6c']];
  const factor=i=>.8+.2*(i+1)/n,managedFactor=i=>.75+.25*(i+1)/n;
  const yCount=v=>height-bottom-v/max*(height-top-bottom),yRate=v=>height-bottom-v/100*(height-top-bottom);
  const ticks=[0,.25,.5,.75,1].map(v=>`<line x1="${left}" x2="${width-right}" y1="${yCount(max*v)}" y2="${yCount(max*v)}"/><text x="${left-5}" y="${yCount(max*v)+3}">${people(max*v)}</text><text class="right-axis" x="${width-right+4}" y="${yRate(v*100)+3}">${Math.round(v*100)}%</text>`).join('');
  const bars=labels.map((label,i)=>series.map(([name,total,managed,light,dark],j)=>{const value=total*factor(i),filed=managed*managedFactor(i),barWidth=Math.min(13,step*.28),x=left+i*step+step*(j?.53:.2),base=height-bottom;return `<g><rect x="${x}" y="${yCount(value)}" width="${barWidth}" height="${base-yCount(value)}" fill="${light}"/><rect x="${x}" y="${yCount(filed)}" width="${barWidth}" height="${base-yCount(filed)}" fill="${dark}"/><title>${label} ${name}确诊 ${people(value)}，建档 ${people(filed)}，建档率 ${formatPct(filed/value*100)}</title></g>`}).join('')).join('');
  const lines=series.map(([name,total,managed,color],j)=>{const pts=labels.map((_,i)=>[left+i*step+step*(j?.53:.2)+Math.min(13,step*.28)/2,yRate(managed*managedFactor(i)/(total*factor(i))*100)]);return `<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="2.3"/>${pts.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="3.5" fill="${color}"><title>${labels[i]} ${name}建档率 ${formatPct(managed*managedFactor(i)/(total*factor(i))*100)}</title></circle>`).join('')}`}).join('');
  return `<div class="situation-trend-legend"><span><i></i>高血压确诊 / 专档</span><span><i></i>糖尿病确诊 / 专档</span><span class="line-key blue">高血压专档占比</span><span class="line-key green">糖尿病专档占比</span></div><svg class="situation-trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${state.periodMode==='quarter'?'季度':'月度'}确诊与建档趋势"><g class="chart-grid">${ticks}</g>${bars}${lines}${labels.map((label,i)=>`<text x="${left+i*step+step/2}" y="${height-5}">${label}</text>`).join('')}</svg>`;
};
const situationPanelsBeforePeriod=situationPanels;
situationPanels=function(){
  const parts=situationPanelsBeforePeriod(),host=document.createElement('div');host.innerHTML=parts.right;
  const spark=host.querySelector('.situation-spark');
  if(spark){const labels=boardTimeAxis(Array.from({length:12},(_,i)=>i)).labels,n=labels.length,width=320,left=34,right=8,ys=[[22,27,30,34],[41,37,35,33],[57,53,49,43]];
    spark.innerHTML=`<svg viewBox="0 0 320 76" preserveAspectRatio="none" aria-label="${state.periodMode==='year'?'年度':state.periodMode==='quarter'?'季度':'月度'}风险构成趋势"><g class="chart-grid">${[0,25,50].map((v,i)=>`<line x1="${left}" x2="315" y1="${65-i*28}" y2="${65-i*28}"/><text x="28" y="${69-i*28}">${v}%</text>`).join('')}</g>${ys.map((row,j)=>{const values=labels.map((_,i)=>row[0]+(row[3]-row[0])*i/Math.max(1,n-1)+Math.sin(i*.9+j)*2),color=['#ef8065','#f4c767','#35bde5'][j];return `<polyline points="${values.map((y,i)=>`${left+i*(width-left-right)/Math.max(1,n-1)},${y}`).join(' ')}" stroke="${color}" fill="none"/>${values.map((y,i)=>`<circle cx="${left+i*(width-left-right)/Math.max(1,n-1)}" cy="${y}" r="3" fill="${color}"><title>${labels[i]} ${['高风险','中风险','低风险'][j]} ${formatPct(Math.max(0,(65-y)/56*50))}</title></circle>`).join('')}`}).join('')}</svg>${labels.map(label=>`<div>${label}</div>`).join('')}`;
    spark.style.gridTemplateColumns=`repeat(${n},1fr)`;
  }
  parts.right=host.innerHTML;
  return parts;
};
situationTrend=function(p){
  if(state.periodMode==='year')return situationTrendBeforePeriod(p);
  const labels=boardTimeAxis(Array.from({length:12},(_,i)=>i)).labels,n=labels.length;
  const ratios=labels.map((_,i)=>{const f=.8+.2*(i+1)/n,m=.75+.25*(i+1)/n;return [p.managedHigh*m/(p.high*f)*100,p.managedDiabetes*m/(p.diabetes*f)*100]});
  const max=Math.max(p.high,p.diabetes)*1.15;
  const lines=[0,1].map(j=>`<polyline points="${ratios.map((r,i)=>`${(i+.5)*320/n},${70-r[j]*.6}`).join(' ')}" fill="none" stroke="${j?'#2cc5a4':'#398ff0'}" stroke-width="2"/>`).join('');
  const columns=labels.map((label,i)=>{const factor=.8+.2*(i+1)/n,managedFactor=.75+.25*(i+1)/n;
    const high=p.high*factor,highManaged=p.managedHigh*managedFactor,diabetes=p.diabetes*factor,diabetesManaged=p.managedDiabetes*managedFactor,overlap=p.overlap*factor,overlapManaged=p.managedOverlap*managedFactor;
    const details=`${label}｜高血压确诊 ${people(high)}、建档 ${people(highManaged)}、建档率 ${formatPct(highManaged/high*100)}；糖尿病确诊 ${people(diabetes)}、建档 ${people(diabetesManaged)}、建档率 ${formatPct(diabetesManaged/diabetes*100)}；高糖合并确诊 ${people(overlap)}、建档 ${people(overlapManaged)}、建档率 ${formatPct(overlapManaged/overlap*100)}`;
    return `<div class="period-trend-column" title="${details}"><div class="period-trend-bars"><i style="height:${high/max*100}%;background:#398ff0"><b style="height:${highManaged/high*100}%;background:#17599d"></b></i><i style="height:${diabetes/max*100}%;background:#2cc5a4"><b style="height:${diabetesManaged/diabetes*100}%;background:#147b6c"></b></i></div><span>${label}</span></div>`;
  }).join('');
  return `<div class="situation-trend-legend"><span><i></i>高血压确诊 / 专档</span><span><i></i>糖尿病确诊 / 专档</span><span class="line-key blue">高血压专档占比</span><span class="line-key green">糖尿病专档占比</span></div><div class="period-trend-layout"><div class="period-trend-axis">${[1,.75,.5,.25,0].map(x=>`<span>${people(max*x)}</span>`).join('')}</div><div class="period-trend-plot"><div class="period-trend-columns" style="grid-template-columns:repeat(${n},1fr)">${columns}</div><svg class="period-trend-lines" viewBox="0 0 320 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg></div><div class="period-trend-axis">${['100','75','50','25','0'].map(x=>`<span>${x}%</span>`).join('')}</div></div>`;
};
function applyDashboardSpacingRevision(html){
  if(state.page!=='dashboard')return html;
  const host=document.createElement('div');host.innerHTML=html;
  const board=host.querySelector('#dashboardBoard');
  const title=board.querySelector('.board-title h1');
  if(title)title.textContent='基层慢病健康管理服务平台';
  const view=state.dashboardView||'home';
  if(view==='home'){
    const p=populationData(),metrics=clinicMetrics(currentNode()),kpis=board.querySelectorAll('.board-kpi');
    if(kpis.length>5){
      kpis[3].querySelector('small')?.remove();
      kpis[5].querySelector('span').textContent='基层服务人次';
      kpis[4].querySelector('span').textContent='入径率';
      kpis[5].after(kpis[4]);
    }
    const age=board.querySelector('.home-age-panel');
    if(age){
      age.classList.add('home-diagnosis-panel');
      age.innerHTML=`<h2>确诊与建档</h2>${situationTrend(p)}`;
      age.querySelector('.situation-trend-chart')?.setAttribute('preserveAspectRatio','none');
    }
    board.querySelector('.home-case-caption')?.remove();
    board.querySelectorAll('.home-case-legend>div').forEach((row,i)=>{
      const count=[p.high-p.overlap,p.diabetes-p.overlap,p.overlap][i];
      row.querySelector('strong').textContent=`${people(count)} · ${formatPct(count/Math.max(1,p.diagnosed)*100)}`;
    });
    const coverage=board.querySelector('.board-stack:last-child .board-panel:first-child');
    if(coverage){
      const percent=metrics.built/Math.max(1,metrics.eligible)*100;
      coverage.innerHTML=`<h2>一体化门诊建成覆盖</h2><div class="construction-coverage"><div class="construction-doughnut" style="--doughnut:${percent}%" data-board-tip="建成覆盖率｜${formatPct(percent)}\n已建成 ${metrics.built} 家\n未建成 ${metrics.eligible-metrics.built} 家"><div><strong>${formatPct(percent)}</strong><span>覆盖率</span></div></div><div class="construction-coverage-legend"><div><i></i><span>已建成<strong>${metrics.built} 家</strong></span></div><div><i></i><span>未建成<strong>${metrics.eligible-metrics.built} 家</strong></span></div><div><i></i><span>基层机构总数<strong>${metrics.eligible} 家</strong></span></div></div></div>`;
    }
    const stage=board.querySelector('.board-map .map-stage'),tools=board.querySelector('.board-map .map-tools');
    if(stage&&tools)stage.append(tools);
  }
  if(view==='situation')board.querySelector('.situation-trend-legend')?.classList.add('compact-legend');
  if(view==='outcomes'){
    board.querySelectorAll('.outcome-complication-list>div').forEach((row,i)=>{
      const rate=Number.parseFloat(row.querySelector('b')?.textContent||'0');
      const bar=document.createElement('i');bar.className='outcome-complication-bar';
      bar.innerHTML=`<b style="width:${Math.min(100,rate*5)}%"></b>`;
      row.querySelector('span')?.after(bar);
    });
  }
  return host.innerHTML;
}
// Keep the overview scoped to distinct population, construction, pathway and outcome signals.
const dashboardBeforeMeetingRevision=dashboard;
dashboard=function(){
  const html=dashboardBeforeMeetingRevision();
  if(state.page!=='dashboard')return html;
  const host=document.createElement('div');host.innerHTML=html;
  const board=host.querySelector('#dashboardBoard'),view=state.dashboardView||'home',node=currentNode();
  if(view==='home'){
    const p=populationData(),risk=node?riskProfileFor(node):selectedRiskProfile(),clinic=clinicMetrics(node);
    const visits=node?visitsFor(node):visitsForSelection(),kpis=board.querySelectorAll('.board-kpi');
    if(kpis[4]){
      kpis[4].querySelector('span').textContent='路径入径率';
      kpis[4].querySelector('strong').textContent=formatPct(dashboardRate(node,'entry'));
      kpis[4].querySelector('small').textContent=periodText();
    }
    if(kpis[5]){
      kpis[5].querySelector('span').textContent='基层就诊人次';
      kpis[5].querySelector('strong').textContent=people(visits.primary);
      kpis[5].querySelector('small').textContent=periodText();
    }
    const left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child');
    const younger=p.diagnosed-p.senior,olderRate=p.senior/Math.max(1,p.diagnosed)*100;
    left.innerHTML=`<section class="board-panel home-age-panel"><h2>确诊患者年龄结构</h2><div class="home-age-layout"><div class="home-age-ring" style="--ring:${olderRate}%" data-board-tip="65岁及以上确诊患者｜${people(p.senior)}\n占确诊患者 ${formatPct(olderRate)}"><strong>${formatPct(olderRate)}</strong><span>65岁及以上</span></div><div class="home-age-detail"><div data-board-tip="65岁及以上｜${people(p.senior)}"><span>65岁及以上</span><strong>${people(p.senior)}</strong></div><div data-board-tip="65岁以下｜${people(younger)}"><span>65岁以下</span><strong>${people(younger)}</strong></div></div></div></section>`+
      `<section class="board-panel home-case-panel"><h2>病种与风险结构</h2><div class="home-case-caption">按确诊去重人数构成</div><div class="home-case-stack">${[['仅高血压',p.high-p.overlap,'#398ff0'],['仅糖尿病',p.diabetes-p.overlap,'#2cc5a4'],['高糖合并',p.overlap,'#f2c26e']].map(([name,value,color])=>`<div style="width:${value/p.diagnosed*100}%;background:${color}" data-board-tip="${name}｜${people(value)}\n占确诊 ${formatPct(value/p.diagnosed*100)}"></div>`).join('')}</div><div class="home-case-legend">${[['仅高血压',p.high-p.overlap,'#398ff0'],['仅糖尿病',p.diabetes-p.overlap,'#2cc5a4'],['高糖合并',p.overlap,'#f2c26e']].map(([name,value,color])=>`<div data-board-tip="${name}｜${people(value)}\n占确诊 ${formatPct(value/p.diagnosed*100)}"><i style="background:${color}"></i><span>${name}</span><strong>${formatPct(value/p.diagnosed*100)}</strong></div>`).join('')}</div><div class="home-risk-summary" data-board-tip="高风险专档患者｜${people(risk.high)}\n占专档 ${formatPct(risk.high/p.managed*100)}"><span>专档患者中高风险占比</span><strong>${formatPct(risk.high/p.managed*100)}</strong></div></section>`;
    const path=right.querySelector('.board-panel:nth-child(2)');
    if(path){path.querySelector('h2').textContent='路径节点执行情况';path.querySelector('.home-path-steps').innerHTML=[['诊前采集率',constructionValue(node,'monitoring')+3],['诊中随访率',constructionValue(node,'monitoring')-4],['异常追踪率',Math.max(0,constructionValue(node,'monitoring')-13)]].map(([name,value])=>`<div data-board-tip="${name}｜${formatPct(value)}"><strong>${formatPct(value)}</strong><span>${name}</span></div>`).join('')}
  }
  if(view==='construction'){
    const panel=board.querySelector('.board-stack:last-child .construction-panel:last-child');
    if(panel){
      const base=node||cities[0],follow=base.follow;
      panel.innerHTML=`<h2>核心监测情况</h2><div class="monitor-comparison">${[['血压',follow+4,10],['血糖',follow-2,15],['糖化',follow-16,22],['血脂',follow-25,27]].map(([name,rate,abnormal])=>`<div data-board-tip="${name}｜监测率 ${formatPct(rate)}\n异常率 ${formatPct(abnormal)}"><strong>${name}</strong><div><span>监测</span><i style="--value:${rate}%;--tone:#43c9e9"></i><b>${formatPct(rate)}</b></div><div><span>异常</span><i style="--value:${abnormal}%;--tone:#f5bd75"></i><b>${formatPct(abnormal)}</b></div></div>`).join('')}</div>`;
    }
  }
  if(view==='outcomes'){
    const right=board.querySelector('.board-stack:last-child');
    const improved=outcomeValue(node,'improved');
    const rows=[['血压',improved],['血糖',improved-4],['血脂',improved-12],['糖化血红蛋白',improved-9]];
    const improve=right.querySelector('.outcome-board-panel:nth-child(2)');
    if(improve)improve.innerHTML=`<h2>改善率</h2><div class="outcome-improve-rings">${rows.map(([name,value],i)=>`<div class="outcome-improve-item" data-board-tip="${name}改善率｜${formatPct(value)}"><i style="--ring:${Math.max(0,Math.min(100,value))}%"><img src="dashboard-assets/${['高血压','糖尿病','血脂','糖化血红蛋白'][i]}.svg" alt=""></i><div><span>${name}</span><strong>${formatPct(value)}</strong></div></div>`).join('')}</div>`;
    const complication=right.querySelector('.outcome-board-panel:nth-child(3)');
    if(complication){const tabs=complication.querySelector('.outcome-complication-tabs');if(tabs)complication.querySelector('h2').append(tabs)}
    const referral=board.querySelector('.outcome-referral-flow');
    if(referral){
      const visits=node?visitsFor(node):visitsForSelection();
      referral.querySelectorAll('.outcome-referral-paths>div').forEach((row,i)=>{const rate=Number.parseFloat(row.querySelector('strong')?.textContent||'0'),count=(i?visits.hospital:visits.primary)*rate/100;row.insertAdjacentHTML('beforeend',`<small>约 ${people(count)}人次</small>`);row.dataset.boardTip=`${i?'下转':'上转'}｜${formatPct(rate)}\n演示估算 ${people(count)}人次`});
    }
    board.querySelector('.outcome-referral-foot')?.remove();
    const ticker=board.querySelector('.board-ticker');if(ticker)ticker.querySelector('b')?.remove();
  }
  return host.innerHTML;
};
pages.dashboard=dashboard;
const renderProvinceMapBeforeLegendPalette=renderProvinceMap;
renderProvinceMap=function(){
  renderProvinceMapBeforeLegendPalette();
  if(state.page==='dashboard'&&state.mapView==='2d'&&provinceChart){
    provinceChart.setOption({visualMap:{inRange:{color:['#0751b8','#11b9ec','#f9cc5e','#e8474d']}},series:[{itemStyle:{borderColor:'#7acbfa',borderWidth:1.2,shadowColor:'#37aeff',shadowBlur:8},label:{color:'#e9f6ff'}}]});
  }
};
const dashboardBeforeSpacingRevision=dashboard;
dashboard=function(){return applyDashboardSpacingRevision(dashboardBeforeSpacingRevision())};
pages.dashboard=dashboard;
function homeRateChart(p,disease){
  const high=disease==='高血压',total=high?p.high:p.diabetes,managed=high?p.managedHigh:p.managedDiabetes;
  const labels=state.periodMode==='year'?['2024年','2025年','2026年']:state.periodMode==='quarter'?['第一季度','第二季度','第三季度','第四季度']:Array.from({length:12},(_,i)=>`${i+1}月`);
  const n=labels.length,width=360,height=230,left=38,right=12,top=12,bottom=34,step=(width-left-right)/n;
  const values=labels.map((_,i)=>{const factor=.8+.2*(i+1)/n,managedFactor=.75+.25*(i+1)/n;return {diagnosed:total*factor,managed:managed*managedFactor,rate:managed*managedFactor/(total*factor)*100}});
  const y=value=>height-bottom-value/100*(height-top-bottom);
  return `<svg class="home-rate-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${disease}建档率趋势">${[0,25,50,75,100].map(value=>`<line x1="${left}" x2="${width-right}" y1="${y(value)}" y2="${y(value)}" stroke="#285777"/><text x="${left-5}" y="${y(value)+4}" text-anchor="end">${value}%</text>`).join('')}<polyline points="${values.map((item,i)=>`${left+step*(i+.5)},${y(item.rate)}`).join(' ')}" fill="none" stroke="${high?'#398ff0':'#2cc5a4'}" stroke-width="3"/>${values.map((item,i)=>`<circle cx="${left+step*(i+.5)}" cy="${y(item.rate)}" r="4" fill="${high?'#398ff0':'#2cc5a4'}" pointer-events="none"/><rect x="${left+i*step}" y="${top}" width="${step}" height="${height-top-bottom}" fill="transparent" data-board-tip="${labels[i]}｜${disease}确诊 ${people(item.diagnosed)}\n${disease}建档 ${people(item.managed)}\n建档率 ${formatPct(item.rate)}"/><text x="${left+step*(i+.5)}" y="${height-7}" text-anchor="middle">${labels[i].replace('第一季度','一季').replace('第二季度','二季').replace('第三季度','三季').replace('第四季度','四季')}</text>`).join('')}</svg>`;
}
const dashboardBeforeHomeRevision=dashboard;
dashboard=function(){
  const html=dashboardBeforeHomeRevision();
  if(state.page!=='dashboard'||(state.dashboardView||'home')!=='home')return html;
  const host=document.createElement('div');host.innerHTML=html;
  const board=host.querySelector('#dashboardBoard'),p=populationData(),node=currentNode(),risk=node?riskProfileFor(node):selectedRiskProfile(),metrics=clinicMetrics(node);
  const kpis=board.querySelectorAll('.board-kpi');
  const setKpi=(index,label,value)=>{const card=kpis[index];if(!card)return;card.querySelector('span').textContent=label;card.querySelector('strong').textContent=value;card.querySelector('small')?.remove()};
  setKpi(0,'两慢确诊患者数',`${p.diagnosed.toFixed(1)} w人`);
  setKpi(1,'两慢专档数',`${p.managed.toFixed(1)} w份`);
  setKpi(2,'高风险患者数',`${risk.high.toFixed(1)} w人`);
  setKpi(3,'一体化门诊总数',`${metrics.built} 家`);
  setKpi(4,'医防融合入径率',formatPct(dashboardRate(node,'entry')));
  setKpi(5,'基层服务人次',`${visitsForSelection().primary.toFixed(1)} w人次`);
  const total=document.createElement('div');total.className='board-kpi';total.innerHTML='<span>总患者数</span><strong>待接入</strong><small>注：数据高铁中按患者身份证去重</small>';
  board.querySelector('.board-kpis').prepend(total);
  const left=board.querySelector('.board-stack');
  const onlyHigh=p.high-p.overlap,onlyDiabetes=p.diabetes-p.overlap;
  const disease=`<section class="board-panel home-disease-panel"><h2>确诊患者疾病分布</h2><div class="home-venn" role="img" aria-label="仅高血压、两病同患和仅糖尿病患者人数"><div class="venn-circle venn-high" data-board-tip="仅高血压｜${people(onlyHigh)}"><span>仅高血压<strong>${people(onlyHigh)}</strong></span></div><div class="venn-circle venn-diabetes" data-board-tip="仅糖尿病｜${people(onlyDiabetes)}"><span>仅糖尿病<strong>${people(onlyDiabetes)}</strong></span></div><div class="venn-overlap" data-board-tip="高糖合并｜${people(p.overlap)}"><span>高糖合并</span><strong>${people(p.overlap)}</strong></div></div><p class="home-venn-note">注：两圆分别代表高血压、糖尿病确诊患者；交集为两病同患，患者按身份证去重。</p></section>`;
  const selected=state.homeDisease||'高血压';
  const filing=`<section class="board-panel home-filing-panel"><div class="home-panel-heading"><h2>两慢建档情况</h2><div class="situation-tabs" role="tablist" aria-label="病种">${['高血压','糖尿病'].map(name=>`<button type="button" role="tab" data-home-disease="${name}" aria-selected="${selected===name}" class="${selected===name?'active':''}">${name}</button>`).join('')}</div></div>${homeRateChart(p,selected)}</section>`;
  const riskRows=[['高风险',risk.high,'#ef8065'],['中风险',risk.middle,'#f4c767'],['低风险',risk.low,'#35bde5']];
  const riskPanel=`<section class="board-panel home-risk-panel"><h2>风险分布</h2><div class="home-risk-bars">${riskRows.map(([name,count,color])=>`<div data-board-tip="${name}｜${people(count)}\n占专档 ${formatPct(count/Math.max(1,p.managed)*100)}"><span>${name}</span><i><b style="width:${count/Math.max(1,p.managed)*100}%;background:${color}"></b></i><strong>${formatPct(count/Math.max(1,p.managed)*100)}</strong></div>`).join('')}</div></section>`;
  left.innerHTML=disease+filing+riskPanel;
  const right=board.querySelector('.board-stack:last-child');
  const built=(node?scopeDescendants(node):clinics).filter(item=>item.clinics);
  const tierRows=[['基本保障',metrics.built,'#45bdf0'],['强化功能',built.filter(item=>['强化功能','鼓励探索'].includes(nodeTier(item))).length,'#6ed9ba'],['鼓励探索',built.filter(item=>nodeTier(item)==='鼓励探索').length,'#f5c76b']];
  const capacity=right.querySelector('.board-panel:first-child');
  capacity.innerHTML=`<h2>一体化门诊能力分布</h2><div class="home-capacity-bars">${tierRows.map(([name,count,color])=>`<div data-board-tip="${name}｜${count} 家\n占一体化门诊 ${formatPct(count/Math.max(1,metrics.built)*100)}"><span>${name}</span><i><b style="width:${count/Math.max(1,metrics.built)*100}%;background:${color}"></b></i><strong>${count} 家 · ${formatPct(count/Math.max(1,metrics.built)*100)}</strong></div>`).join('')}</div><p class="home-capacity-foot">一体化门诊总数 / 基层机构总数：${metrics.built} / ${metrics.eligible} 家</p>`;
  const monthVisits=Array.from({length:12},(_,i)=>Math.round(metrics.built*(990+i*46+Math.sin(i*.8)*80)));
  const service=right.querySelector('.board-panel:nth-child(2)');
  service.innerHTML=`<h2>一体化门诊服务人次</h2><div class="home-service-summary"><strong>${Math.round(monthVisits.reduce((sum,value)=>sum+value,0)/12).toLocaleString()}</strong><span>月均服务人次</span><div class="chart-legend"><span><i style="background:#46c7f0"></i>门诊服务人次</span></div></div>${constructionBarChart(monthVisits)}`;
  right.querySelector('.board-panel:nth-child(3) h2').textContent='核心指标控制率';
  return host.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const tab=event.target.closest('[data-home-disease]');if(!tab)return;state.homeDisease=tab.dataset.homeDisease;render()});
const renderProvinceMapBeforeHomeLabels=renderProvinceMap;
renderProvinceMap=function(){renderProvinceMapBeforeHomeLabels();if(state.page==='dashboard'&&state.mapView==='2d'&&provinceChart)provinceChart.setOption({series:[{label:{fontSize:state.mapScope==='county'?12:16},emphasis:{label:{fontSize:16}}}]})};

const homeMapDefinitions={
  comorbidity:['共病患者占比','共病患者占比=共病患者数÷重点慢病患者数。','high'],
  highRisk:['高风险人数占比','高风险人数占比=高风险专档患者数÷专档患者数。','high'],
  construction:['一体化门诊覆盖率','一体化门诊覆盖率=一体化门诊机构数÷基层总机构数。','low'],
  entry:['医防融合入径率','医防融合入径率=入径患者数÷专档患者数。','low'],
  bloodPressure:['血压控制率','血压控制率=最近一次血压达标患者数÷专档患者数。','low'],
  bloodGlucose:['血糖控制率','血糖控制率=最近一次空腹血糖达标患者数÷专档患者数。','low'],
  bloodLipids:['血脂控制率','血脂控制率=最近一次血脂达标患者数÷专档患者数。','low'],
  hba1cTarget:['糖化血红蛋白控制率','糖化血红蛋白控制率=最近一次糖化血红蛋白达标患者数÷专档患者数。','low']
};
const homeView=()=>state.page==='dashboard'&&(state.dashboardView||'home')==='home';
function homeRisk(node){
  const raw=node?riskProfileFor(node):selectedRiskProfile(),population=node?populationFor(node):populationData();
  const factor=population.managed/Math.max(1,raw.high+raw.middle+raw.low);
  return {high:raw.high*factor,middle:raw.middle*factor,low:raw.low*factor};
}
function homeTierCounts(node){
  const clinicsInScope=(node?scopeDescendants(node):clinics).filter(item=>item.clinics);
  const total=clinicMetrics(node).built;
  const raw=['基本保障','强化功能','鼓励探索'].map(tier=>clinicsInScope.filter(item=>nodeTier(item)===tier).length);
  const scaled=raw.map(count=>count/Math.max(1,clinicsInScope.length)*total);
  const counts=scaled.map(Math.floor);
  let remainder=total-counts.reduce((sum,count)=>sum+count,0);
  scaled.map((value,index)=>({index,fraction:value-counts[index]})).sort((a,b)=>b.fraction-a.fraction).slice(0,remainder).forEach(item=>counts[item.index]++);
  return counts;
}
function homeMapValue(node,key=state.mapMetric){
  const population=node?populationFor(node):populationData();
  const target=outcomeValue(node,'target');
  return ({comorbidity:()=>{const groups=node?[diseaseCombinations(population)]:cities.map(city=>diseaseCombinations(populationFor(city)));return groups.reduce((sum,parts)=>sum+parts.slice(3).reduce((n,x)=>n+x.value,0),0)/Math.max(.0001,groups.reduce((sum,parts)=>sum+parts.reduce((n,x)=>n+x.value,0),0))*100},highRisk:()=>homeRisk(node).high/Math.max(1,population.managed)*100,
    construction:()=>{const metrics=clinicMetrics(node);return metrics.built/Math.max(1,metrics.eligible)*100},
    entry:()=>dashboardRate(node,'entry'),bloodPressure:()=>target,bloodGlucose:()=>target-7,
    bloodLipids:()=>target-17,hba1cTarget:()=>target-12})[key]?.()||0;
}
function homeFilingChart(population){
  const labels=state.periodMode==='year'?['2024年','2025年','2026年']:state.periodMode==='quarter'?['第一季度','第二季度','第三季度','第四季度']:Array.from({length:12},(_,index)=>`${index+1}月`);
  const width=390,height=110,left=43,right=8,top=12,bottom=28,step=(width-left-right)/labels.length;
  const max=Math.ceil(Math.max(population.managedHigh,population.managedDiabetes)*1.18/20)*20;
  const y=value=>height-bottom-value/max*(height-top-bottom);
  const series=[['高血压专档',population.managedHigh,'#399bf1'],['糖尿病专档',population.managedDiabetes,'#2ac9a7']];
  const bars=labels.map((label,index)=>series.map(([name,total,color],seriesIndex)=>{
    const factor=.82+.18*(index+1)/labels.length,value=total*factor,x=left+index*step+step*(seriesIndex?.52:.12),barWidth=step*.34;
    return `<rect x="${x}" y="${y(value)}" width="${barWidth}" height="${height-bottom-y(value)}" fill="${color}"/>`;
  }).join('')+`<rect x="${left+index*step}" y="${top}" width="${step}" height="${height-top-bottom}" fill="transparent" data-board-tip="${label}｜${series.map(([name,total])=>`${name} ${(total*(.82+.18*(index+1)/labels.length)).toFixed(1)} 万份`).join('；')}"/><text x="${left+step*(index+.5)}" y="${height-5}" text-anchor="middle">${label}</text>`).join('');
  return `<svg class="home-filing-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="按统计周期展示高血压和糖尿病专档份数，纵轴单位为万份"><g class="construction-grid">${[0,.5,1].map(tick=>`<line x1="${left}" x2="${width-right}" y1="${y(max*tick)}" y2="${y(max*tick)}"/><text x="${left-4}" y="${y(max*tick)+4}" text-anchor="end">${Math.round(max*tick)}</text>`).join('')}</g><text x="3" y="9" class="home-filing-unit">单位：万份</text>${bars}</svg>`;
}
const dashboardBeforeHomeRequest=dashboard;
dashboard=function(){
  if(homeView()&&state.dashboardMetricView!=='home'){
    state.dashboardMetricView='home';
    state.mapMetric='comorbidity';
  }
  const html=dashboardBeforeHomeRequest();
  if(!homeView())return html;
  if(!homeMapDefinitions[state.mapMetric])state.mapMetric='comorbidity';
  const host=document.createElement('div');host.innerHTML=html;
  const board=host.querySelector('#dashboardBoard'),node=currentNode(),population=populationData(),risk=homeRisk(node),metrics=clinicMetrics(node);
  const archiveCount=board.querySelectorAll('.board-kpi')[2]?.querySelector('strong');
  if(archiveCount)archiveCount.textContent=`${(population.managedHigh+population.managedDiabetes).toFixed(1)} w份`;
  const riskCount=board.querySelectorAll('.board-kpi')[3]?.querySelector('strong');
  if(riskCount)riskCount.textContent=`${risk.high.toFixed(1)} w人`;
  board.querySelectorAll('.board-kpi strong').forEach(strong=>{
    const match=strong.textContent.match(/^(.*?)(w人次|w人|w份|家)$/);
    if(match)strong.innerHTML=`${match[1]}<em class="board-kpi-unit">${match[2]}</em>`;
  });
  const filing=board.querySelector('.home-filing-panel');
  if(filing)filing.innerHTML=`<h2>两慢专档情况</h2><div class="home-filing-summary"><div data-board-tip="高血压专档｜${population.managedHigh.toFixed(1)} w份"><span>高血压专档</span><strong>${population.managedHigh.toFixed(1)}<small>w份</small></strong></div><div data-board-tip="糖尿病专档｜${population.managedDiabetes.toFixed(1)} w份"><span>糖尿病专档</span><strong>${population.managedDiabetes.toFixed(1)}<small>w份</small></strong></div><div class="home-filing-dedup" data-board-tip="两慢病专档去重患者｜${population.managed.toFixed(1)} w人；同一患者可同时持有两类专档"><span>去重后两慢专档患者</span><strong>${population.managed.toFixed(1)}<small>w人</small></strong></div></div><div class="home-filing-legend chart-legend"><span><i style="background:#399bf1"></i>高血压专档</span><span><i style="background:#2ac9a7"></i>糖尿病专档</span></div>${homeFilingChart(population)}<p class="home-panel-note">注：两慢专档份数≠两慢专档人数，患者可能同时有糖尿病和高血压专档。</p>`;
  const riskPanel=board.querySelector('.home-risk-panel');
  if(riskPanel){
    const rows=[['高风险',risk.high,'#ef8065'],['中风险',risk.middle,'#f4c767'],['低风险',risk.low,'#35bde5']];
    riskPanel.innerHTML=`<h2>风险分布</h2><div class="home-risk-bars">${rows.map(([name,count,color])=>`<div data-board-tip="${name}｜${people(count)}\n占专档确诊人数 ${formatPct(count/Math.max(1,population.managed)*100)}"><span>${name}</span><i><b style="width:${count/Math.max(1,population.managed)*100}%;background:${color}"></b></i><strong>${people(count)} · ${formatPct(count/Math.max(1,population.managed)*100)}</strong></div>`).join('')}</div><p class="home-panel-note">注：各层级风险人数÷专档确诊人数。</p>`;
  }
  const tiers=homeTierCounts(node),tierNames=['基本保障','强化功能','鼓励探索'],tierColors=['#45bdf0','#6ed9ba','#f5c76b'];
  const capacity=board.querySelector('.board-stack:last-child .board-panel:first-child');
  if(capacity)capacity.innerHTML=`<h2>一体化门诊能力分布</h2><div class="home-capacity-head" data-board-tip="一体化门诊覆盖率｜${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%\n已建成 ${metrics.built} 家\n基层机构 ${metrics.eligible} 家"><span>一体化门诊覆盖率</span><strong>${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%</strong><small>${metrics.built}/${metrics.eligible}</small></div><div class="home-capacity-bars">${tiers.map((count,index)=>`<div data-board-tip="${tierNames[index]}｜${count} 家\n占已建成 ${formatPct(count/Math.max(1,metrics.built)*100)}"><span>${tierNames[index]}</span><i><b style="width:${count/Math.max(1,metrics.built)*100}%;background:${tierColors[index]}"></b></i><strong>${count} 家 · ${formatPct(count/Math.max(1,metrics.built)*100)}</strong></div>`).join('')}</div><p class="home-panel-note">注：覆盖率=一体化门诊总数÷基层机构总数。</p>`;
  const map=board.querySelector('.board-map'),tabs=map?.querySelector('.map-metrics');
  if(tabs)tabs.innerHTML=Object.entries(homeMapDefinitions).map(([key,[label]])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}" aria-pressed="${state.mapMetric===key}">${label}</button>`).join('');
  map?.querySelector('#mapMetricLabel')?.replaceChildren(homeMapDefinitions[state.mapMetric][0]);
  const units=childUnits(),definition=homeMapDefinitions[state.mapMetric],average=homeMapValue(null);
  const sorted=[...units].sort((a,b)=>definition[2]==='high'?homeMapValue(b)-homeMapValue(a):homeMapValue(a)-homeMapValue(b));
  const ticker=board.querySelector('.board-ticker');
  if(ticker){
    const items=sorted.slice(0,5).map(item=>`${fullName(item)}${definition[0]}${definition[2]==='high'?'过高':'偏低'}，为${homeMapValue(item).toFixed(2)}%，省平均${average.toFixed(2)}%。`);
    ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent=`${definition[0]}预警`;
    ticker.querySelector('b')?.remove();ticker.querySelector('small')?.remove();ticker.querySelector('#boardTickerText').textContent=items[0]||'当前范围暂无下级单位';tickerPosition=0;
  }
  return host.innerHTML;
};
pages.dashboard=dashboard;
const mapValueBeforeHomeRequest=mapValue,provinceValueBeforeHomeRequest=provinceMetricValue,mapTooltipBeforeHomeRequest=mapTooltip,bindMapControlsBeforeHomeRequest=bindMapControls;
mapValue=function(node){return homeView()?homeMapValue(node):mapValueBeforeHomeRequest(node)};
provinceMetricValue=function(){return homeView()?homeMapValue(null):provinceValueBeforeHomeRequest()};
mapTooltip=function(node){
  if(!homeView())return mapTooltipBeforeHomeRequest(node);
  const key=state.mapMetric,definition=homeMapDefinitions[key],metrics=clinicMetrics(node),tiers=homeTierCounts(node),population=populationFor(node);
  const rows=key==='construction'?[['一体化门诊机构数',`${metrics.built} 家`],['基层总机构数',`${metrics.eligible} 家`]]:key==='highRisk'?[['高风险人数',people(homeRisk(node).high)+'人'],['专档人数',people(population.managed)+'人']]:key==='entry'?[['入径患者数',people(population.managed*homeMapValue(node)/100)+'人'],['专档患者数',people(population.managed)+'人']]:[['最近一次达标患者数',people(population.managed*homeMapValue(node)/100)+'人'],['专档患者数',people(population.managed)+'人']];
  return `<div class="map-tooltip home-map-tooltip"><strong class="home-map-tooltip-title">${esc(fullName(node))}</strong><div class="home-map-tooltip-body"><div><span>${esc(definition[0])}</span><b>${homeMapValue(node).toFixed(2)} %</b></div>${rows.map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('')}<em>${definition[1]}</em></div></div>`;
};
bindMapControls=function(){
  bindMapControlsBeforeHomeRequest();
  if(!homeView())return;
  document.querySelectorAll('#dashboardBoard [data-map-metric]').forEach(button=>button.onclick=()=>{state.mapMetric=button.dataset.mapMetric;render()});
};
const dashboardBeforeTierConsistency=dashboard;
dashboard=function(){
  const html=dashboardBeforeTierConsistency();
  if(state.page!=='dashboard'||state.dashboardView!=='construction')return html;
  const host=document.createElement('div');host.innerHTML=html;
  const counts=homeTierCounts(currentNode()),built=clinicMetrics(currentNode()).built;
  host.querySelectorAll('.construction-tier-list>div').forEach((row,index)=>{
    const percent=counts[index]/Math.max(1,built)*100;
    row.querySelector('strong').textContent=`${counts[index]} 家 · ${formatPct(percent)}`;
    row.querySelector('i b').style.width=`${percent}%`;
    row.dataset.boardTip=`${['基本保障','强化功能','鼓励探索'][index]}｜${counts[index]} 家\n占已建成 ${formatPct(percent)}`;
  });
  const foot=host.querySelector('.construction-tier-list + .construction-foot');
  if(foot)foot.textContent=`按最高能力层级归类，合计 ${built} 家`;
  return host.innerHTML;
};
pages.dashboard=dashboard;
const renderProvinceMapBeforeHomeRequest=renderProvinceMap;
renderProvinceMap=function(){
  renderProvinceMapBeforeHomeRequest();
  if(homeView()&&state.mapView==='2d'&&provinceChart)provinceChart.setOption({visualMap:{inRange:{color:['#126cb4','#26b9e4','#f5cd62','#ef634f']}},series:[{label:{show:state.mapScope!=='county'||state.city!=='all'||mapZoom>=2.5,fontSize:state.mapScope==='county'?12:16,color:'#f3fbff',fontWeight:600},emphasis:{label:{show:true,fontSize:17}}}]});
};
// Shared situation metrics keep the map, warning and rankings on the same basis.
function situationData(node){
  const p=node?populationFor(node):populationData(),risk=homeRisk(node);
  return {p,risk,missing:Math.max(0,p.diagnosed-p.managed),comorbidity:p.overlap,
    comorbidityRate:p.overlap/Math.max(.0001,p.diagnosed)*100,
    riskRate:risk.high/Math.max(.0001,p.managed)*100};
}
const situationActive=()=>state.page==='dashboard'&&state.dashboardView==='situation';
const mapValueBeforeRequestedRevision=mapValue,tooltipBeforeRequestedRevision=mapTooltip;
mapValue=function(node){if(situationActive()){const d=situationData(node);return state.mapMetric==='diagnosed'?d.p.diagnosed:state.mapMetric==='comorbidity'?d.comorbidityRate:d.riskRate}return mapValueBeforeRequestedRevision(node)};
mapTooltip=function(node){
  if(!situationActive())return tooltipBeforeRequestedRevision(node);
  const d=situationData(node),rows=state.mapMetric==='diagnosed'?[['两慢病确诊人数',people(d.p.diagnosed)+'人'],['两慢病专档人数',people(d.p.managed)+'人']]:state.mapMetric==='comorbidity'?[['区域共病占确诊人数比例',d.comorbidityRate.toFixed(2)+'%'],['区域共病人数',people(d.comorbidity)+'人']]:[['高风险占比',d.riskRate.toFixed(2)+'%'],['高风险人数',people(d.risk.high)+'人']];
  return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong>${rows.map(([name,value])=>`<div><span>${name}</span><b>${value}</b></div>`).join('')}</div>`;
};
function requestedRank(title,units,value,percent=false){
  const rows=[...units].sort((a,b)=>value(b)-value(a)),max=Math.max(.0001,...rows.map(value));
  return `<section class="board-panel situation-panel requested-rank"><h2>${title}</h2><div class="requested-rank-list">${rows.map(x=>{const v=value(x),label=percent?v.toFixed(2)+'%':people(v)+'人';return `<div data-board-tip="${esc(fullName(x))}｜${label}"><span title="${esc(fullName(x))}">${esc(fullName(x))}</span><i><b style="width:${v/max*100}%"></b></i><strong>${label}</strong></div>`}).join('')}</div></section>`;
}
const dashboardBeforeRequestedRevision=dashboard;
dashboard=function(){
  const html=dashboardBeforeRequestedRevision();if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard'),view=state.dashboardView||'home',p=populationData(),node=currentNode(),metrics=clinicMetrics(node);
  board.querySelectorAll('#periodSeg [data-period-mode="month"]').forEach(x=>x.remove());
  if(view==='home'){
    const total=board.querySelector('.board-kpi');total.querySelector('strong').innerHTML=`${(p.diagnosed*1.28).toFixed(1)}<em class="board-kpi-unit">w人</em>`;total.querySelector('small').textContent='模拟总患者数，按患者身份证去重';
    board.querySelectorAll('.home-panel-note,.home-venn-note').forEach(x=>x.textContent=x.textContent.replace(/^注：/,''));
    const riskNote=board.querySelector('.home-risk-panel .home-panel-note');if(riskNote)riskNote.textContent='各风险占比=各层级风险人数÷专档确诊人数。';
    const service=board.querySelector('.board-stack:last-child .board-panel:nth-child(2) .home-service-summary strong');if(service)service.textContent+=' 次';
    const count=board.querySelector('.home-capacity-head small');if(count)count.textContent+=' 家';
  }
  if(view==='situation'){
    const left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child'),panels=left.querySelectorAll(':scope > .board-panel');
    const high=p.high-p.overlap,diabetes=p.diabetes-p.overlap;
    panels[0].innerHTML=`<h2>确诊患者疾病分布</h2><div class="home-venn"><div class="venn-circle venn-high"><span>仅高血压<strong>${people(high)}人</strong></span></div><div class="venn-circle venn-diabetes"><span>仅糖尿病<strong>${people(diabetes)}人</strong></span></div><div class="venn-overlap"><span>高糖合并</span><strong>${people(p.overlap)}人</strong></div></div>`;
    const filing=document.createElement('section');filing.className='board-panel situation-panel situation-filing';filing.innerHTML=`<h2>两慢专档情况</h2><div class="home-filing-summary"><div><span>高血压专档</span><strong>${p.managedHigh.toFixed(1)}<small>万份</small></strong></div><div><span>糖尿病专档</span><strong>${p.managedDiabetes.toFixed(1)}<small>万份</small></strong></div><div><span>去重专档患者</span><strong>${p.managed.toFixed(1)}<small>万人</small></strong></div></div><div class="home-filing-legend chart-legend"><span><i style="background:#399bf1"></i>高血压专档</span><span><i style="background:#2ac9a7"></i>糖尿病专档</span></div>${homeFilingChart(p)}<p class="home-panel-note">专档份数不等于患者人数，患者可同时持有两类专档。</p>`;panels[0].after(filing);
    panels[1].querySelector('h2').textContent='专档患者人口构成';panels[2].querySelectorAll('[data-situation-disease]').forEach(b=>b.textContent=b.dataset.situationDisease+'专档');
    const r=homeRisk(node),riskRows=[['高风险',r.high,'#ef8065'],['中风险',r.middle,'#f4c767'],['低风险',r.low,'#35bde5']];
    right.children[0].innerHTML=`<h2>风险分布</h2><div class="home-risk-bars">${riskRows.map(([name,count,color])=>`<div><span>${name}</span><i><b style="width:${count/p.managed*100}%;background:${color}"></b></i><strong>${people(count)}人 · ${formatPct(count/p.managed*100)}</strong></div>`).join('')}</div><p class="home-panel-note">注：各风险占比=各层级风险人数÷专档确诊人数。</p>`;
    const rawVisits=node?visitsFor(node):visitsForSelection(),visitFactor=p.managed/Math.max(.0001,p.diagnosed),visits={primary:rawVisits.primary*visitFactor,hospital:rawVisits.hospital*visitFactor},sum=visits.primary+visits.hospital,share=visits.primary/Math.max(.0001,sum)*100;
    right.children[1].innerHTML=`<h2>服务流动与就诊态势</h2><div class="construction-coverage"><div class="construction-doughnut" style="--doughnut:${share}%"><div><strong>${people(sum)}次</strong><span>总就诊次数</span></div></div><div class="construction-coverage-legend"><div><i></i><span>基层就诊<strong>${people(visits.primary)}次 · ${formatPct(share)}</strong></span></div><div><i></i><span>等级医院就诊<strong>${people(visits.hospital)}次 · ${formatPct(100-share)}</strong></span></div></div></div>`;
    const units=childUnits(),lost=x=>populationFor(x).managed*(.08+((x.should||1)%9)*.009),lostMax=Math.max(.0001,...units.map(lost));
    right.children[2].innerHTML=`<h2>失管患者情况</h2><p class="home-panel-note">专档患者中 180 天未到建档机构就诊</p><div class="requested-rank-list">${[...units].sort((a,b)=>lost(b)-lost(a)).map(x=>`<div><span title="${esc(fullName(x))}">${esc(fullName(x))}</span><i><b style="width:${lost(x)/lostMax*100}%"></b></i><strong>${people(lost(x))}人 · ${formatPct(lost(x)/Math.max(.0001,populationFor(x).managed)*100)}</strong></div>`).join('')}</div>`;
    const tabs=board.querySelector('.map-metrics');tabs.innerHTML=[['diagnosed','确诊分布'],['comorbidity','共病负荷'],['highRisk','高风险占比']].map(([key,label])=>`<button type="button" data-map-metric="${key}" class="${state.mapMetric===key?'active':''}">${label}</button>`).join('');
    const isDiagnosis=state.mapMetric==='diagnosed',isComorbidity=state.mapMetric==='comorbidity',province=cities.map(situationData),provinceDiagnosed=province.reduce((s,d)=>s+d.p.diagnosed,0),provinceManaged=province.reduce((s,d)=>s+d.p.managed,0),ticker=board.querySelector('.board-ticker');
    const measure=x=>{const d=situationData(x);return isDiagnosis?d.missing/Math.max(.0001,d.p.diagnosed)*100:isComorbidity?d.comorbidityRate:d.riskRate};
    const avg=isDiagnosis?(provinceDiagnosed-provinceManaged)/provinceDiagnosed*100:isComorbidity?province.reduce((s,d)=>s+d.comorbidity,0)/provinceDiagnosed*100:province.reduce((s,d)=>s+d.risk.high,0)/provinceManaged*100;
    const items=[...units].sort((a,b)=>measure(b)-measure(a)).slice(0,5).map(x=>{const d=situationData(x);return isDiagnosis?`${fullName(x)}未建档人数占比偏高，两慢病确诊人数 ${people(d.p.diagnosed)}人，未建档人数占比 ${measure(x).toFixed(2)}%，省平均 ${avg.toFixed(2)}%。`:isComorbidity?`${fullName(x)}共病患者占比偏高，共病人数 ${people(d.comorbidity)}人，区域共病占确诊人数比例 ${measure(x).toFixed(2)}%，省平均 ${avg.toFixed(2)}%。`:`${fullName(x)}高风险占比偏高，高风险人数 ${people(d.risk.high)}人，高风险占比 ${measure(x).toFixed(2)}%，省平均 ${avg.toFixed(2)}%。`});
    ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent=isDiagnosis?'确诊分布预警':isComorbidity?'共病负荷预警':'高风险预警';ticker.querySelector('#boardTickerText').textContent=items[0]||'暂无下级单位';
    board.querySelector('#mapMetricLabel').textContent=isDiagnosis?'两慢确诊人数':isComorbidity?'共病占确诊人数比例':'高风险占比';
    board.querySelector('.situation-bottom').innerHTML=isDiagnosis?requestedRank('区域确诊负荷',units,x=>situationData(x).p.diagnosed)+requestedRank('未建档患者数',units,x=>situationData(x).missing):isComorbidity?requestedRank('区域共病人数',units,x=>situationData(x).comorbidity)+requestedRank('共病占确诊人群比例',units,x=>situationData(x).comorbidityRate,true):requestedRank('高风险人数',units,x=>situationData(x).risk.high)+requestedRank('高风险占比',units,x=>situationData(x).riskRate,true);
  }
  if(view==='construction'){
    const saved={view:state.dashboardView,metric:state.mapMetric,metricView:state.dashboardMetricView};state.dashboardView='home';const home=document.createElement('div');home.innerHTML=dashboardBeforeRequestedRevision();Object.assign(state,{dashboardView:saved.view,mapMetric:saved.metric,dashboardMetricView:saved.metricView});
    const left=board.querySelector('.board-stack'),homeRight=home.querySelector('.board-stack:last-child'),built=metrics.built,eligible=metrics.eligible,share=built/Math.max(1,eligible)*100;
    left.children[0].innerHTML=`<h2>一体化门诊覆盖情况</h2><div class="construction-coverage"><div class="construction-doughnut" style="--doughnut:${share}%"><div><strong>${eligible} 家</strong><span>基层机构总数</span></div></div><div class="construction-coverage-legend"><div><i></i><span>一体化门诊<strong>${built} 家 · ${formatPct(share)}</strong></span></div><div><i></i><span>未建设基层机构<strong>${eligible-built} 家 · ${formatPct(100-share)}</strong></span></div></div></div>`;
    left.children[1].innerHTML=homeRight.children[0].innerHTML;left.children[2].innerHTML=homeRight.children[1].innerHTML;
    const monitor=[...board.querySelectorAll('.board-stack:last-child .board-panel')].find(x=>x.querySelector('h2')?.textContent.includes('核心监测'));if(monitor){const base=node||cities[0],follow=base.follow;monitor.innerHTML=`<h2>核心监测情况</h2><table class="board-table"><thead><tr><th>监测项目</th><th>监测率</th><th>异常率</th></tr></thead><tbody>${[['血压',follow+4,10],['血糖',follow-2,15],['糖化',follow-16,22],['血脂',follow-25,27]].map(([name,value,abnormal])=>`<tr><td>${name}</td><td>${formatPct(value)}</td><td>${formatPct(abnormal)}</td></tr>`).join('')}</tbody></table>`}
  }
  const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT);let textNode;
  while((textNode=walker.nextNode())){
    if(textNode.parentElement?.closest('script,style'))continue;
    const context=textNode.parentElement?.closest('.board-panel,.board-kpi')?.textContent||'';
    textNode.nodeValue=textNode.nodeValue.replace(/(\d+(?:\.\d+)?\s*万)(?![人份次家])/g,`$1${/就诊|服务人次|转诊/.test(context)?'次':'人'}`);
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
const bindBeforeRequestedRevision=bindMapControls;
bindMapControls=function(){bindBeforeRequestedRevision();if(situationActive())document.querySelectorAll('.situation-board [data-map-metric]').forEach(b=>b.onclick=()=>{state.mapMetric=b.dataset.mapMetric;render()})};
const renderMapBeforeRequestedRevision=renderProvinceMap;
renderProvinceMap=function(){renderMapBeforeRequestedRevision();if(state.page==='dashboard'&&state.mapView==='2d'&&provinceChart){const values=(provinceChart.getOption().series[0]?.data||[]).map(x=>x.value).filter(Number.isFinite);if(values.length){let min=Math.min(...values),max=Math.max(...values);if(min===max){min-=1;max+=1}provinceChart.setOption({visualMap:{min,max,inRange:{color:['#126cb4','#26b9e4','#f5cd62','#ef433d']}}})}}};
const dashboardBeforeAnnotations=dashboard;
dashboard=function(){
  const html=dashboardBeforeAnnotations();if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),view=state.dashboardView||'home',p=populationData(),node=currentNode();
  board.querySelectorAll('.board-ticker > b').forEach(el=>el.remove());
  if(view==='home'){
    const total=board.querySelector('.board-kpi small');if(total)total.textContent='数据高铁中按患者身份证去重';
    const rings=board.querySelector('.outcome-rings');if(rings){const target=outcomeValue(node,'target');rings.outerHTML=outcomeRings([['血压控制率',target,'#42c8ed'],['血糖控制率',target-7,'#f2c26e'],['血脂控制率',target-17,'#55d8bd'],['糖化血红蛋白控制率',target-12,'#b3a1f3']])}
  }
  if(view==='situation'){
    const left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child');
    const parts=[['仅高血压',p.high-p.overlap,'#398ff0'],['仅糖尿病',p.diabetes-p.overlap,'#2cc5a4'],['高糖合并',p.overlap,'#f2c26e']];
    left.children[0].innerHTML=`<h2>确诊患者疾病分布</h2><div class="disease-stack">${parts.map(([name,value,color])=>`<i style="width:${value/p.diagnosed*100}%;background:${color}" data-board-tip="${name}｜${people(value)}人"></i>`).join('')}</div><div class="disease-stack-legend">${parts.map(([name,value,color])=>`<div><span><i style="background:${color}"></i>${name}</span><strong>${people(value)}人</strong></div>`).join('')}</div>`;
    right.children[2].querySelector('.home-panel-note').textContent='失管：专档患者中 180天未到建档机构就诊';
    const visits=node?visitsFor(node):visitsForSelection(),factor=p.managed/Math.max(.0001,p.diagnosed),primary=visits.primary*factor,hospital=visits.hospital*factor,sum=primary+hospital,share=primary/Math.max(.0001,sum)*100;
    right.children[1].innerHTML=`<h2>服务流动与就诊态势</h2><div class="construction-coverage"><div class="construction-doughnut" style="--doughnut:${share}%"><div><strong>${share.toFixed(2)}%</strong><span>基层就诊率</span></div></div><div class="construction-coverage-legend"><div><i></i><span>基层就诊<strong>${people(primary)}次 · ${share.toFixed(2)}%</strong></span></div><div><i></i><span>等级医院就诊<strong>${people(hospital)}次 · ${(100-share).toFixed(2)}%</strong></span></div><div><i></i><span>总就诊次数<strong>${people(sum)}次</strong></span></div></div></div>`;
    board.querySelectorAll('.requested-rank-list').forEach(list=>{if(list.children.length>4){const rows=list.innerHTML;list.classList.add('auto-scroll');list.innerHTML=`<div class="scroll-track">${rows}${rows}</div>`}});
  }
  if(view==='construction'){
    const coverage=board.querySelector('.board-stack .construction-coverage'),m=clinicMetrics(node),share=m.built/Math.max(1,m.eligible)*100;
    if(coverage)coverage.innerHTML=`<div class="construction-doughnut" style="--doughnut:${share}%"><div><strong>${share.toFixed(2)}%</strong><span>一体化门诊覆盖率</span></div></div><div class="construction-coverage-legend"><div><i></i><span>一体化门诊<strong>${m.built} 家 · ${share.toFixed(2)}%</strong></span></div><div><i></i><span>未建设基层机构<strong>${m.eligible-m.built} 家 · ${(100-share).toFixed(2)}%</strong></span></div><div><i></i><span>基层总机构数<strong>${m.eligible} 家</strong></span></div></div>`;
    const capacityCount=board.querySelector('.home-capacity-head small');if(capacityCount&&!capacityCount.textContent.includes('家'))capacityCount.textContent+=' 家';
    const serviceCount=board.querySelector('.home-service-summary strong');if(serviceCount&&!serviceCount.textContent.includes('次'))serviceCount.textContent+=' 次';
    const monitor=[...board.querySelectorAll('.board-panel')].find(el=>el.querySelector('h2')?.textContent==='核心监测情况');if(monitor)monitor.querySelectorAll('th').forEach(th=>{if(th.textContent==='监测率')th.textContent='检测率'});
    const regions=board.querySelector('.construction-node-regions');if(regions){const panel=regions.closest('.board-panel'),names=['诊前采集','规范监测','诊中随访','健康处方','一次追踪'],selected=Math.min(state.constructionNodeTab||0,4);panel.querySelector('h2').outerHTML=`<div class="node-region-head"><h2>区域节点执行情况</h2><div class="situation-tabs">${names.map((name,i)=>`<button type="button" data-node-tab="${i}" class="${i===selected?'active':''}">${name}</button>`).join('')}</div></div>`;regions.querySelectorAll('.construction-node-region').forEach((item,i)=>{item.hidden=i!==selected})}
  }
  board.querySelectorAll('.home-service-summary .chart-legend').forEach(el=>el.remove());
  board.querySelectorAll('.construction-bar-chart,.construction-line:not(.construction-bar-chart)').forEach(svg=>{if(svg.classList.contains('home-service-chart'))return;const unit=svg.classList.contains('construction-bar-chart')?'人次':'%';svg.insertAdjacentHTML('afterbegin',`<text x="4" y="10" class="chart-axis-unit">单位：${unit}</text>`)});
  const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT);let t;while((t=walker.nextNode()))t.nodeValue=t.nodeValue.replace(/w(?=人次|人|份)/g,'万');
  board.querySelectorAll('[data-board-tip]').forEach(el=>el.dataset.boardTip=el.dataset.boardTip.replace(/w(?=人次|人|份)/g,'万'));
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const tab=event.target.closest('[data-node-tab]');if(tab){state.constructionNodeTab=Number(tab.dataset.nodeTab);render()}});
function latestTrend(series,unit){
  const width=360,height=145,left=48,right=20,top=22,bottom=23,maxValue=Math.max(...series.flatMap(item=>item.values)),max=unit==='%'?Math.ceil(maxValue*1.15/10)*10:Math.ceil(maxValue*1.15*2)/2;
  const x=i=>left+i*(width-left-right)/2,y=v=>height-bottom-v/max*(height-top-bottom),fmt=v=>unit==='%'?v.toFixed(1)+'%':v.toFixed(2)+' 次/人';
  return `<svg class="construction-line latest-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="2024年至2026年趋势，单位${unit}"><text x="4" y="10" class="chart-axis-unit">单位：${unit}</text><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-5}" y="${y(max*t)+3}" text-anchor="end">${unit==='%'?Math.round(max*t):Number((max*t).toFixed(1))}</text>`).join('')}</g>${series.map(item=>`<polyline points="${item.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${item.color}" stroke-width="2.5"/>${item.values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${item.color}"><title>${2024+i}年 ${item.name} ${fmt(v)}</title></circle>`).join('')}`).join('')}${[2024,2025,2026].map((year,i)=>`<text class="construction-month" x="${x(i)}" y="${height-4}">${year}年</text>`).join('')}</svg>`;
}
const dashboardBeforeLatestComments=dashboard;
dashboard=function(){
  const html=dashboardBeforeLatestComments();
  if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),view=state.dashboardView||'home',node=currentNode();
  board.querySelectorAll('[data-board-view]').forEach(tab=>{if(tab.dataset.boardView==='situation')tab.textContent='慢病态势';if(tab.dataset.boardView==='construction')tab.textContent='一体化门诊'});
  board.querySelectorAll('.home-panel-note').forEach(note=>note.textContent=note.textContent.replace(/^注：/,''));
  board.querySelectorAll('.construction-line').forEach(svg=>{if(svg.classList.contains('home-service-chart'))return;const box=svg.getAttribute('viewBox').split(/\s+/).map(Number);svg.setAttribute('viewBox',`${box[0]} -16 ${box[2]} ${box[3]+16}`);const unit=svg.querySelector('.chart-axis-unit');if(unit)unit.setAttribute('y','-4')});
  if(view==='construction'){
    board.querySelector('.home-capacity-head')?.remove();
    const capacity=board.querySelector('.home-capacity-bars');if(capacity)capacity.parentElement.querySelector('.home-panel-note')?.remove();
    board.querySelectorAll('.construction-coverage-legend span').forEach(span=>{if(span.textContent.includes('基层总机构数'))span.firstChild.textContent='基层机构总数'});
    board.querySelectorAll('[data-map-metric="construction"]').forEach(tab=>tab.textContent='一体化门诊覆盖率');
    if(state.mapMetric==='construction')board.querySelector('#mapMetricLabel')?.replaceChildren('一体化门诊覆盖率');
    board.querySelectorAll('.situation-bottom h2').forEach(h=>{if(h.textContent==='区域建成覆盖率')h.textContent='区域一体化门诊覆盖率'});
  }
  if(view==='outcomes'){
    const left=board.querySelector('.board-stack'),right=board.querySelector('.board-stack:last-child'),base=outcomeValue(node,'managed');
    const pop=populationData(),visits=node?visitsFor(node):visitsForSelection(),frequency=(visits.primary+visits.hospital)/Math.max(.0001,pop.diagnosed);
    left.children[1].innerHTML=`<h2>人均就诊频率</h2><div class="construction-total"><strong>${frequency.toFixed(2)}</strong><span>次/人</span></div>${latestTrend([{name:'人均就诊频率',values:[frequency*.86,frequency*.93,frequency],color:'#43c9e9'}],'次/人')}`;
    const lostUnits=childUnits(),lostTotal=lostUnits.reduce((sum,x)=>sum+populationFor(x).managed*(.08+((x.should||1)%9)*.009),0),lostDenominator=lostUnits.reduce((sum,x)=>sum+populationFor(x).managed,0),lost=lostTotal/Math.max(.0001,lostDenominator)*100;
    left.children[2].innerHTML=`<h2>专档患者失管率</h2>${outcomeHeadline(lost,'专档患者失管率')}${latestTrend([{name:'专档患者失管率',values:[lost*.86,lost*.93,lost],color:'#f2c26e'}],'%')}`;
    const follow=(node||cities[0]).follow;
    right.children[0].innerHTML=`<h2>检测情况</h2><table class="board-table latest-monitor"><thead><tr><th>监测项目</th><th>检测率</th><th>异常率</th></tr></thead><tbody>${[['血压',follow+4,10],['血糖',follow-2,15],['糖化',follow-16,22],['血脂',follow-25,27]].map(([name,detection,abnormal])=>`<tr><td>${name}</td><td>${formatPct(detection)}</td><td>${formatPct(abnormal)}</td></tr>`).join('')}</tbody></table>`;
    const flow=board.querySelector('.outcome-referral-flow');if(flow){const up=outcomeValue(node,'referral'),down=up+24;flow.outerHTML=`<div class="latest-trend-key"><span>● 上转率</span><span>● 下转率</span></div>${latestTrend([{name:'上转率',values:[up*.86,up*.93,up],color:'#43c9e9'},{name:'下转率',values:[down*.86,down*.93,down],color:'#f2c26e'}],'%')}`}
    right.children[2].innerHTML=situationComplications();right.children[2].querySelectorAll('[data-situation-disease]').forEach(b=>b.textContent=b.dataset.situationDisease+'专档');
  }
  if(view==='construction'){
    board.querySelectorAll('[data-map-metric="entry"]').forEach(el=>el.textContent='医防融合入径率');
    board.querySelectorAll('[data-map-metric="monitoring"]').forEach(el=>el.textContent='路径节点总执行率');
    if(state.mapMetric==='entry'||state.mapMetric==='monitoring')board.querySelector('#mapMetricLabel')?.replaceChildren(state.mapMetric==='entry'?'医防融合入径率':'路径节点总执行率');
    board.querySelectorAll('.construction-node-region > strong').forEach(el=>el.remove());
    board.querySelectorAll('.construction-coverage-legend strong').forEach(el=>el.innerHTML=el.innerHTML.replace(/家/g,'<small class="coverage-unit">家</small>'));
    const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT);let text;while((text=walker.nextNode())){if(text.parentElement.closest('.map-metrics'))continue;text.nodeValue=text.nodeValue.replace(/(?:医防融合)?入径率趋势|当前入径率|区域入径率|(?<!医防融合)入径率/g,match=>match==='区域入径率'?'区域医防融合入径率':'医防融合入径率').replace(/(?<!路径)节点总执行率/g,'路径节点总执行率')}
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest('[data-situation-disease]');if(button&&state.page==='dashboard'&&state.dashboardView==='outcomes'){state.situationDisease=button.dataset.situationDisease;render()}});
const tooltipBeforeLatestComments=mapTooltip;
mapTooltip=function(node){
  if(state.page==='dashboard'&&state.dashboardView==='construction'&&['entry','monitoring'].includes(state.mapMetric)){
    const entry=state.mapMetric==='entry',denominator=entry?Math.round(populationFor(node).managed*10000):Math.round(populationFor(node).managed*10000*4),rateValue=constructionValue(node,state.mapMetric),numerator=Math.round(denominator*rateValue/100),label=entry?'医防融合入径率':'路径节点总执行率';
    const rows=[[label,(numerator/Math.max(1,denominator)*100).toFixed(2)+'%'],[entry?'入径患者数':'已完成任务数',numerator.toLocaleString()+(entry?' 人':' 次')],[entry?'专档患者数':'应完成任务数',denominator.toLocaleString()+(entry?' 人':' 次')]];
    return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong>${rows.map(([name,value])=>`<div><span>${name}</span><b>${value}</b></div>`).join('')}<p>${entry?'医防融合入径率=入径患者数÷专档患者数':'路径节点总执行率=所有已完成节点任务数÷所有应完成节点任务数'}</p></div>`;
  }
  if(state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='construction'){
    const m=clinicMetrics(node),rows=[['一体化门诊覆盖率',(m.built/Math.max(1,m.eligible)*100).toFixed(2)+'%'],['一体化门诊数',`${m.built} 家`],['未建设基层机构数',`${Math.max(0,m.eligible-m.built)} 家`],['基层机构总数',`${m.eligible} 家`]];
    return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong>${rows.map(([label,value])=>`<div><span>${label}</span><b>${value}</b></div>`).join('')}</div>`;
  }
  return tooltipBeforeLatestComments(node);
};
function managementMetricRows(rows){return `<div class="process-stage-bars">${rows.map(([name,value])=>`<div><span>${name}</span><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><strong>${formatPct(value)}</strong></div>`).join('')}</div>`}
function managementNodes(node){const follow=node.follow;return [['诊前采集率',follow+2],['规范监测率',follow-8],['诊中随访完成率',follow-2],['健康处方打印率',follow-12],['异常追踪管理率',follow-17],['转诊率',Math.max(0,node.entry-45)]]}
function managementChecks(node){const follow=node.follow;return [['血压',follow+4,10],['血糖',follow-2,15],['糖化血红蛋白',follow-16,22],['血脂',follow-25,27]]}
pages.service=function(){
  const node=currentNode(),base=node||cities[0],follow=base.follow;
  const nodes=managementNodes(base),checks=managementChecks(base);
  return `<div class="process-page"><div class="notice">${esc(regionLabel())} · ${esc(periodText())} · 模拟数据</div><div class="process-detail-grid"><section class="panel"><div class="panel-head"><h2>路径节点执行情况</h2><small>入径率 ${formatPct(dashboardRate(node,'entry'))}</small></div>${managementMetricRows(nodes)}</section><section class="panel"><div class="panel-head"><h2>核心监测情况</h2><small>按项目分别统计</small></div><div class="table-wrap"><table class="process-table"><thead><tr><th>监测项目</th><th>检测率</th><th>异常率</th></tr></thead><tbody>${checks.map(([name,detected,abnormal])=>`<tr><th scope="row">${name}</th><td>${formatPct(detected)}</td><td>${formatPct(abnormal)}</td></tr>`).join('')}</tbody></table></div></section></div></div>`;
};
function outcomeSummaryMetrics(node){
  const visits=node?visitsFor(node):visitsForSelection(),pop=node?populationFor(node):populationData(),children=node?nodeChildren(node):childUnits(),units=children.length?children:(node?[node]:[]),weight=units.reduce((sum,x)=>sum+populationFor(x).managed,0),lost=units.reduce((sum,x)=>sum+populationFor(x).managed*(.08+((x.should||1)%9)*.009),0)/Math.max(.0001,weight)*100,up=outcomeValue(node,'referral');
  return [['签约率',outcomeValue(node,'contract')],['人均就诊频率',(visits.primary+visits.hospital)/Math.max(.0001,pop.diagnosed),'次/人'],['失管率',lost],['基层就诊率',outcomeValue(node,'primary')],['上转率',up],['下转率',up+24]];
}
function outcomeResults(node){const target=outcomeValue(node,'target'),improved=outcomeValue(node,'improved');return [['血压',target,improved],['血糖',target-7,improved-4],['糖化血红蛋白',target-12,improved-9],['血脂',target-17,improved-12]]}
pages.outcome=function(){
  const node=currentNode(),results=outcomeResults(node);
  return `<div class="process-page outcome-page"><div class="notice">${esc(regionLabel())} · ${esc(periodText())} · 模拟数据</div><div class="outcome-summary">${outcomeSummaryMetrics(node).map(([name,value,unit])=>`<div><span>${name}</span><strong>${unit==='次/人'?`${value.toFixed(2)} <small>次/人</small>`:formatPct(value)}</strong></div>`).join('')}</div><section class="panel"><div class="panel-head"><h2>健康结果</h2><small>按项目分别评价</small></div><div class="outcome-legend outcome-two-columns"><span>控制率</span><span>改善率</span></div><div class="outcome-matrix">${results.map(([name,...values])=>`<div class="outcome-matrix-row outcome-two-columns"><strong>${name}</strong>${values.map((value,index)=>`<div class="outcome-metric tone-${index}"><i><b style="width:${Math.max(0,Math.min(100,value))}%"></b></i><span>${formatPct(value)}</span></div>`).join('')}</div>`).join('')}</div></section></div>`;
};
const outcomeMapMetrics=[['outcomeContract','签约率'],['outcomeFrequency','人均就诊率'],['outcomeLost','失管率'],['outcomePrimary','基层就诊率'],['outcomeBpTarget','血压控制率'],['outcomeGlucoseTarget','血糖控制率'],['outcomeHba1cTarget','糖化血红蛋白控制率'],['outcomeLipidTarget','血脂控制率'],['outcomeBpImprove','血压改善率'],['outcomeGlucoseImprove','血糖改善率'],['outcomeHba1cImprove','糖化血红蛋白改善率'],['outcomeLipidImprove','血脂改善率'],['outcomeComplication','并发症发生率']];
function outcomeMapData(node,key){
  const pop=node?populationFor(node):populationData(),managed=Math.max(1,Math.round(pop.managed*10000)),diagnosed=Math.max(1,Math.round(pop.diagnosed*10000)),visits=node?visitsFor(node):visitsForSelection(),visitsTotal=Math.round((visits.primary+visits.hospital)*10000),primary=Math.round(visits.primary*10000),target=outcomeValue(node,'target'),improved=outcomeValue(node,'improved');
  const def={outcomeContract:[outcomeValue(node,'contract'),'签约患者数','专档患者数'],outcomeLost:[node?(.08+((node.should||1)%9)*.009)*100:outcomeSummaryMetrics(null)[2][1],'失管患者数','专档患者数'],outcomeBpTarget:[target,'最近一次血压达标患者数','专档患者数'],outcomeGlucoseTarget:[target-7,'最近一次空腹血糖达标患者数','专档患者数'],outcomeHba1cTarget:[target-12,'最近一次糖化血红蛋白达标患者数','专档患者数'],outcomeLipidTarget:[target-17,'最近一次血脂达标患者数','专档患者数'],outcomeBpImprove:[improved,'血压改善患者数','专档患者数'],outcomeGlucoseImprove:[improved-4,'血糖改善患者数','专档患者数'],outcomeHba1cImprove:[improved-9,'糖化血红蛋白改善患者数','专档患者数'],outcomeLipidImprove:[improved-12,'血脂改善患者数','专档患者数'],outcomeComplication:[outcomeValue(node,'complication'),'发生并发症患者数','专档患者数']}[key];
  if(key==='outcomeFrequency')return {value:visitsTotal/diagnosed,numerator:visitsTotal,denominator:diagnosed,numeratorLabel:'两慢病就诊次数',denominatorLabel:'两慢病确诊患者数',unit:'次/人',numeratorUnit:'次',denominatorUnit:'人'};
  if(key==='outcomePrimary')return {value:primary/Math.max(1,visitsTotal)*100,numerator:primary,denominator:visitsTotal,numeratorLabel:'基层就诊次数',denominatorLabel:'总就诊次数',unit:'%',numeratorUnit:'次',denominatorUnit:'次'};
  const [value,numeratorLabel,denominatorLabel]=def||[outcomeValue(node,'contract'),'签约患者数','专档患者数'],numerator=Math.round(managed*Math.max(0,value)/100);
  return {value:numerator/managed*100,numerator,denominator:managed,numeratorLabel,denominatorLabel,unit:'%',numeratorUnit:'人',denominatorUnit:'人'};
}
const mapValueBeforeOutcomeDetails=mapValue,provinceValueBeforeOutcomeDetails=provinceMetricValue,tooltipBeforeOutcomeDetails=mapTooltip,dashboardBeforeOutcomeDetails=dashboard;
mapValue=function(node){return state.page==='dashboard'&&state.dashboardView==='outcomes'?outcomeMapData(node,state.mapMetric).value:mapValueBeforeOutcomeDetails(node)};
provinceMetricValue=function(){return state.page==='dashboard'&&state.dashboardView==='outcomes'?outcomeMapData(null,state.mapMetric).value:provinceValueBeforeOutcomeDetails()};
mapTooltip=function(node){
  if(state.page==='dashboard'&&state.dashboardView==='outcomes'){
    const label=outcomeMapMetrics.find(([key])=>key===state.mapMetric)?.[1]||'签约率',d=outcomeMapData(node,state.mapMetric),value=d.value.toFixed(2)+d.unit;
    return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>${label}</span><b>${value}</b></div><div><span>${d.numeratorLabel}</span><b>${d.numerator.toLocaleString()} ${d.numeratorUnit}</b></div><div><span>${d.denominatorLabel}</span><b>${d.denominator.toLocaleString()} ${d.denominatorUnit}</b></div><p>${label}=${d.numeratorLabel}÷${d.denominatorLabel}${d.unit==='%'?'×100%':''}</p></div>`;
  }
  const html=tooltipBeforeOutcomeDetails(node);
  if(state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='construction')return html.replace(/<\/div>$/, '<p>一体化门诊覆盖率=一体化门诊机构数÷基层机构总数</p></div>');
  return html;
};
dashboard=function(){
  const html=dashboardBeforeOutcomeDetails();if(state.page!=='dashboard'||state.dashboardView!=='outcomes')return html;
  if(!outcomeMapMetrics.some(([key])=>key===state.mapMetric))state.mapMetric='outcomePrimary';
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard'),label=outcomeMapMetrics.find(([key])=>key===state.mapMetric)[1],tabs=board.querySelector('.map-metrics');
  tabs.innerHTML=outcomeMapMetrics.map(([key,name])=>`<button type="button" data-map-metric="${key}" class="${key===state.mapMetric?'active':''}" aria-pressed="${key===state.mapMetric}">${name}</button>`).join('');
  board.querySelector('#mapMetricLabel').textContent=label;
  const rank=board.querySelector('.situation-bottom .outcome-board-panel'),units=[...childUnits()].sort((a,b)=>outcomeMapData(b,state.mapMetric).value-outcomeMapData(a,state.mapMetric).value),max=Math.max(1,...units.map(x=>outcomeMapData(x,state.mapMetric).value));
  if(rank){const rows=units.map(x=>{const d=outcomeMapData(x,state.mapMetric),value=d.value.toFixed(2)+d.unit;return `<div class="outcome-rank-row" title="${esc(fullName(x))} ${label} ${value}"><span>${esc(fullName(x))}</span><i><b style="width:${d.value/max*100}%"></b></i><strong>${value}</strong></div>`}).join('');rank.innerHTML=`<h2>区域${label}</h2><div class="outcome-rank auto-scroll"><div class="scroll-track">${rows}${rows}</div></div>`}
  board.querySelector('.situation-bottom .latest-trend')?.setAttribute('preserveAspectRatio','none');
  const highRisk=['outcomeLost','outcomeComplication'].includes(state.mapMetric),average=outcomeMapData(null,state.mapMetric),items=[...childUnits()].filter(x=>highRisk?outcomeMapData(x,state.mapMetric).value>average.value:outcomeMapData(x,state.mapMetric).value<average.value).sort((a,b)=>highRisk?outcomeMapData(b,state.mapMetric).value-outcomeMapData(a,state.mapMetric).value:outcomeMapData(a,state.mapMetric).value-outcomeMapData(b,state.mapMetric).value).slice(0,5).map(x=>{const d=outcomeMapData(x,state.mapMetric);return `${fullName(x)}${label}${highRisk?'偏高':'偏低'}，为${d.value.toFixed(2)}${d.unit}，省平均${average.value.toFixed(2)}${average.unit}。`}),ticker=board.querySelector('.board-ticker');
  if(ticker){ticker.dataset.items=JSON.stringify(items);ticker.querySelector('span').textContent=label+'预警';const text=ticker.querySelector('#boardTickerText');if(text)text.textContent=items[0]||'当前范围暂无需关注的地区'}
  return root.innerHTML;
};
pages.dashboard=dashboard;
const renderBeforeMetricComments=render;
render=function(){
  renderBeforeMetricComments();
  const view=$('view');
  if(['clinic','service','outcome'].includes(state.page)){
    view.querySelectorAll('.scope-table table').forEach(table=>{
      if(table.querySelector('thead th:last-child')?.textContent.trim()==='操作')table.classList.add('fixed-action-table');
    });
  }
  if(state.page==='clinic'){
    const table=[...view.querySelectorAll('.scope-table table')].find(t=>[...t.querySelectorAll('thead th')].some(th=>th.textContent.trim()==='能力分层'));
    if(table){
      const heading=[...table.querySelectorAll('thead th')].find(th=>th.textContent.trim()==='能力分层');
      const index=heading.cellIndex;
      ['仅基本保障','仅强化功能','鼓励探索'].forEach(label=>{const th=document.createElement('th');th.textContent=label;heading.before(th)});
      heading.remove();
      table.querySelectorAll('tbody tr').forEach(row=>{
        const cell=row.cells[index];if(!cell)return;
        const counts=[...cell.textContent.matchAll(/(?:基础|强化|探索)\s*(\d+)/g)].map(match=>match[1]);
        if(counts.length!==3)return;
        counts.forEach(value=>{const td=document.createElement('td');td.textContent=value+' 家';cell.before(td)});cell.remove();
      });
    }
  }
  const selectors=state.page==='clinic'?'.clinic-summary-layout .kpi > span:first-child':state.page==='service'?'.process-stage-bars > div > span,.process-table tbody th,.management-table thead th:not(:first-child):not(:nth-last-child(-n+2))':state.page==='outcome'?'.outcome-summary > div > span,.outcome-legend > span,.outcome-matrix-row > strong,.management-table thead th:not(:first-child):not(:nth-last-child(-n+2))':'';
  if(!selectors)return;
  view.querySelectorAll(selectors).forEach(label=>{
    if(label.querySelector('.metric-help'))return;
    const name=label.textContent.trim(),rule=metricRules[name]||`${name}：当前为演示数据，正式统计口径待确认。`;
    const icon=document.createElement('span');icon.className='metric-help';icon.textContent='?';icon.tabIndex=0;icon.dataset.tip=rule;icon.setAttribute('aria-label',`${name}口径：${rule}`);
    icon.onmouseenter=()=>showMetricTooltip(icon);icon.onmouseleave=()=>hideMetricTooltip(icon);icon.onfocus=()=>showMetricTooltip(icon);icon.onblur=()=>hideMetricTooltip(icon);icon.onclick=event=>event.stopPropagation();label.appendChild(icon);
  });
};
// 填报表仅覆盖省、市、区县；医共体和机构层级仍沿用演示数据。
function clinicReportRow(node){
  if(!node)return clinicReport20261105.cities['全省'];
  if(node.clinicIndex||node.consortiumName)return null;
  return node.cityName?clinicReport20261105.counties[node.cityName+'|'+node.name]:clinicReport20261105.cities[node.name];
}
const clinicMetricsBeforeReport=clinicMetrics,homeTierCountsBeforeReport=homeTierCounts,constructionValueBeforeReport=constructionValue;
clinicMetrics=function(node){const row=clinicReportRow(node);if(!row)return clinicMetricsBeforeReport(node);return {eligible:row[0],built:row[1]+row[2]+row[3],active:clinicMetricsBeforeReport(node).active,other:row[4],none:row[5]}};
homeTierCounts=function(node){const row=clinicReportRow(node);return row?row.slice(1,4):homeTierCountsBeforeReport(node)};
constructionValue=function(node,metric){if(metric==='construction'){const m=clinicMetrics(node);return m.built/Math.max(1,m.eligible)*100}return constructionValueBeforeReport(node,metric)};
const mapValueBeforeReport=mapValue,provinceValueBeforeReport=provinceMetricValue;
mapValue=function(node){return state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='construction'?constructionValue(node,'construction'):mapValueBeforeReport(node)};
provinceMetricValue=function(){return state.page==='dashboard'&&state.dashboardView==='construction'&&state.mapMetric==='construction'?constructionValue(null,'construction'):provinceValueBeforeReport()};
// 慢阻肺人群为演示模拟数据；只有独立患者增加去重总数。
const populationBeforeCopd=populationFor;
populationFor=function(node){
  const p=populationBeforeCopd(node), copdOnly=p.diagnosed*.04, copdOverlap=p.diagnosed*.04;
  const managedCopdOnly=p.managed*.03, managedCopdOverlap=p.managed*.05;
  return {...p,copdOnly,copdOverlap,copd:copdOnly+copdOverlap,managedCopd:managedCopdOnly+managedCopdOverlap,diagnosed:p.diagnosed+copdOnly,managed:p.managed+managedCopdOnly};
};
const populationDataBeforeCopd=populationData;
populationData=function(){
  const p=populationDataBeforeCopd(),rows=(state.city==='all'?cities:selected()).map(populationFor);
  for(const key of ['copdOnly','copdOverlap','copd','managedCopd'])p[key]=rows.reduce((sum,row)=>sum+row[key],0);
  return p;
};
homeFilingChart=function(p){
  const labels=state.periodMode==='year'?['2024年','2025年','2026年']:['第一季度','第二季度','第三季度','第四季度'];
  const width=390,height=116,left=43,right=8,top=18,bottom=32,step=(width-left-right)/labels.length;
  const series=[['高血压专档',p.managedHigh,'#399bf1'],['糖尿病专档',p.managedDiabetes,'#f66d2b'],['慢阻肺专档',p.managedCopd,'#94dfff']];
  const max=Math.ceil(Math.max(...series.map(item=>item[1]))*1.18/20)*20,y=value=>height-bottom-value/max*(height-top-bottom);
  const bars=labels.map((label,index)=>{const factor=.82+.18*(index+1)/labels.length;return series.map(([name,total,color],i)=>{const value=total*factor,x=left+index*step+step*(.28+i*.13),barWidth=step*.085;return `<rect x="${x}" y="${y(value)}" width="${barWidth}" height="${height-bottom-y(value)}" fill="url(#filing-gradient-${i})"/><line x1="${x}" x2="${x+barWidth}" y1="${y(value)}" y2="${y(value)}" stroke="#d9f4ff" stroke-width=".7"/>`}).join('')+`<rect x="${left+index*step}" y="${top}" width="${step}" height="${height-top-bottom}" fill="transparent" data-board-tip="${label}｜${series.map(([name,total])=>`${name} ${(total*factor).toFixed(1)} 万份`).join('；')}"/><text x="${left+step*(index+.5)}" y="${height-5}" text-anchor="middle">${label}</text>`}).join('');
  return `<svg class="home-filing-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="按统计周期展示高血压、糖尿病和慢阻肺专档份数，纵轴单位为万份"><defs>${[['#72c7ff','#102d6b'],['#ff8846','#602916'],['#a2e9ff','#184158']].map((colors,i)=>`<linearGradient id="filing-gradient-${i}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>`).join('')}</defs><g class="construction-grid">${[0,.5,1].map(t=>`<line x1="${left}" x2="${width-right}" y1="${y(max*t)}" y2="${y(max*t)}"/><text x="${left-4}" y="${y(max*t)+4}" text-anchor="end">${Math.round(max*t)}</text>`).join('')}</g><text x="3" y="9" class="home-filing-unit">万份</text>${bars}</svg>`;
};
function copdFilingContent(p){
  const values=[['高血压专档',p.managedHigh,'#399bf1'],['糖尿病专档',p.managedDiabetes,'#f66d2b'],['慢阻肺专档',p.managedCopd,'#94dfff'],['去重后慢病专档患者',p.managed,'#a994e8']];
  return `<h2>慢病专档情况</h2><div class="home-filing-summary copd-filing-summary">${values.map(([name,value,color],i)=>`<div style="border-color:${color}" data-board-tip="${name}｜${value.toFixed(1)} 万${i===3?'人':'份'}"><span>${name}</span><strong>${value.toFixed(1)}<small>万${i===3?'人':'份'}</small></strong></div>`).join('')}</div><div class="home-filing-legend chart-legend">${values.slice(0,3).map(([name,,color])=>`<span><i style="background:${color}"></i>${name}</span>`).join('')}</div>${homeFilingChart(p)}<p class="home-panel-note">专档份数不等于患者人数，患者可同时持有多种专档。</p>`;
}
const dashboardBeforeCopd=dashboard;
dashboard=function(){
  const html=dashboardBeforeCopd();if(!homeView()){if(state.page==='dashboard'&&state.dashboardView==='situation'){const root=document.createElement('div');root.innerHTML=html;const filing=root.querySelector('.situation-filing');if(filing)filing.innerHTML=copdFilingContent(populationData());return root.innerHTML}return html}
  const root=document.createElement('div');root.innerHTML=html;const p=populationData(),kpis=root.querySelectorAll('.board-kpi');
  const update=(index,label,note)=>{kpis[index].querySelector('span').textContent=label;let small=kpis[index].querySelector('small');if(!small){small=document.createElement('small');kpis[index].appendChild(small)}small.textContent=note};
  update(1,'重点慢病人数','高血压/糖尿病/慢阻肺患者去重人数');
  update(2,'专档患者数','任一疾病确诊且有专档患者去重数');
  kpis[2].querySelector('strong').innerHTML=`${p.managed.toFixed(1)}<em class="board-kpi-unit">万人</em>`;
  update(3,'高风险患者数','专档患者中高风险患者去重数');
  const filing=root.querySelector('.home-filing-panel');
  if(filing)filing.innerHTML=copdFilingContent(p);
  const venn=root.querySelector('.home-disease-panel .home-venn');
  if(venn){venn.classList.add('three-disease-venn');venn.setAttribute('aria-label','高血压、糖尿病和慢阻肺确诊患者分布');venn.innerHTML=`<div class="copd-venn-circle copd-venn-high" data-board-tip="高血压｜${people(p.high)}人">高血压<br><strong>${people(p.high)}人</strong></div><div class="copd-venn-circle copd-venn-diabetes" data-board-tip="糖尿病｜${people(p.diabetes)}人">糖尿病<br><strong>${people(p.diabetes)}人</strong></div><div class="copd-venn-circle copd-venn-lung" data-board-tip="慢阻肺｜${people(p.copd)}人；其中与其他病种合并 ${people(p.copdOverlap)}人">慢阻肺<br><strong>${people(p.copd)}人</strong></div>`;const note=venn.parentElement.querySelector('.home-venn-note');if(note)note.textContent='圆形交集表示疾病共存；患者按身份证去重，慢阻肺数据为模拟值。'}
  return root.innerHTML;
};
const dashboardBeforeClinicReport=dashboard;
dashboard=function(){
  const html=dashboardBeforeClinicReport();if(state.page!=='dashboard'||!['home','construction'].includes(state.dashboardView||'home'))return html;
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard'),node=currentNode(),row=clinicReportRow(node);
  if(!row)return html;
  const built=row[1]+row[2]+row[3],view=state.dashboardView||'home';
  const panel=view==='home'?board.querySelector('.board-stack:last-child .board-panel:first-child'):board.querySelector('.board-stack .board-panel:nth-child(2)');
  if(view==='construction'){
    if(state.mapMetric==='construction'){
      const units=childUnits(),rank=board.querySelector('.situation-bottom .board-panel:first-child'),values=units.map(item=>({item,row:clinicReportRow(item)})).filter(x=>x.row).sort((a,b)=>constructionValue(b.item,'construction')-constructionValue(a.item,'construction'));
      if(rank&&values.length){const renderRow=x=>{const r=x.row,pct=constructionValue(x.item,'construction');return `<div class="construction-rank" title="${esc(fullName(x.item))}：基本保障 ${r[1]} 家，强化功能 ${r[2]} 家，鼓励探索 ${r[3]} 家"><span>${esc(fullName(x.item))}</span><i class="construction-stacked">${r.slice(1,4).map((n,i)=>`<b style="width:${n/r[0]*100}%;background:${['#398ff0','#39c6a6','#f4c66d'][i]}"></b>`).join('')}</i><strong>${pct.toFixed(2)}%</strong></div>`};rank.innerHTML=`<h2>区域一体化门诊覆盖率</h2><div class="construction-scroll auto-scroll"><div class="scroll-track">${values.map(renderRow).join('')}${values.map(renderRow).join('')}</div></div>`}
      const missing=board.querySelector('.situation-bottom .board-panel:nth-child(2)');if(missing&&values.length){const sorted=[...values].sort((a,b)=>(b.row[0]-b.row[1]-b.row[2]-b.row[3])-(a.row[0]-a.row[1]-a.row[2]-a.row[3])),max=Math.max(1,...sorted.map(x=>x.row[0]-x.row[1]-x.row[2]-x.row[3])),renderRow=x=>{const n=x.row[0]-x.row[1]-x.row[2]-x.row[3];return `<div class="construction-rank"><span title="${esc(fullName(x.item))}">${esc(fullName(x.item))}</span><i><b style="width:${n/max*100}%;background:#f2a86e"></b></i><strong>${n} 家</strong></div>`};missing.innerHTML=`<h2>区域未建成机构数</h2><div class="construction-scroll auto-scroll"><div class="scroll-track">${sorted.map(renderRow).join('')}${sorted.map(renderRow).join('')}</div></div>`}
    }
  }
  return root.innerHTML;
};
function diseaseCombinations(p){
  const overlap=p.copdOverlap, triple=overlap*.25, highLung=overlap*.45, diabetesLung=overlap*.30;
  return [
    {name:'仅高血压',bits:1,value:p.high-p.overlap-highLung},
    {name:'仅糖尿病',bits:2,value:p.diabetes-p.overlap-diabetesLung},
    {name:'仅慢阻肺',bits:4,value:p.copdOnly},
    {name:'仅高血压+糖尿病',bits:3,value:p.overlap-triple},
    {name:'仅高血压+慢阻肺',bits:5,value:highLung},
    {name:'仅糖尿病+慢阻肺',bits:6,value:diabetesLung},
    {name:'高糖慢合并',bits:7,value:triple}
  ];
}
function diseaseVenn(p){
  const rows=diseaseCombinations(p), circles=[[103,110],[197,110],[150,55]], paths=Object.fromEntries(rows.map(row=>[row.bits,'']));
  for(let y=0;y<170;y+=2)for(let x=0;x<300;x+=2){
    const bits=circles.reduce((mask,[cx,cy],i)=>mask|((x+1-cx)**2+(y+1-cy)**2<55**2?1<<i:0),0);
    if(bits)paths[bits]+=`M${x} ${y}h2v2h-2z`;
  }
  return `<div class="disease-venn-layout"><svg viewBox="48 0 204 170" class="disease-venn-svg" aria-label="三种疾病确诊患者交集，交集人数为模拟数据"><circle cx="103" cy="110" r="55" fill="#1763d0" fill-opacity=".42" stroke="#69b7ff"/><circle cx="197" cy="110" r="55" fill="#e76a29" fill-opacity=".42" stroke="#ffae74"/><circle cx="150" cy="55" r="55" fill="#83d9ff" fill-opacity=".42" stroke="#b5e9ff"/>${rows.map(row=>`<path d="${paths[row.bits]}" fill="transparent" data-venn-name="${row.name}" data-venn-value="${people(row.value)}人" data-board-tip="${row.name}｜${people(row.value)}人" tabindex="0" role="button" aria-label="${row.name} ${people(row.value)}人"/>`).join('')}</svg><div class="disease-venn-totals">${[['高血压',p.high,'#105ccd'],['糖尿病',p.diabetes,'#f66d2b'],['慢阻肺',p.copd,'#94dfff']].map(([name,value,color])=>`<div><i style="background:${color}"></i><span>${name}患者</span><strong>${people(value)}人</strong></div>`).join('')}</div></div><p class="home-venn-note">统计数据为非去重</p>`;
}
function diseaseMatrix(p){
  const rows=diseaseCombinations(p), diseases=[['高血压',p.high],['糖尿病',p.diabetes],['慢阻肺',p.copd]];
  return `<h2>确诊患者疾病分布</h2><div class="disease-matrix-totals">${diseases.map(([name,value])=>`<span>${name} <strong>${people(value)}人</strong></span>`).join('')}</div><div class="disease-matrix-scroll"><table class="disease-matrix"><thead><tr><td>疾病组合</td>${diseases.map(([name])=>`<td>${name}</td>`).join('')}<td>人数</td></tr></thead><tbody>${rows.map(row=>`<tr title="${row.name}：仅包含所列疾病，模拟数据"><td>${row.name}</td>${diseases.map((_,i)=>`<td><i class="${row.bits&(1<<i)?'on':''}"></i><span class="sr-only">${row.bits&(1<<i)?'有':'无'}</span></td>`).join('')}<td>${people(row.value)}人</td></tr>`).join('')}</tbody></table></div><p class="disease-matrix-note">组合互斥，人数为模拟数据</p>`;
}
const dashboardBeforeDiseaseMatrix=dashboard;
dashboard=function(){
  const html=dashboardBeforeDiseaseMatrix(), view=state.dashboardView||'home';
  if(state.page!=='dashboard'||!['home','situation'].includes(view))return html;
  const root=document.createElement('div');root.innerHTML=html;
  const panel=view==='home'?root.querySelector('.home-disease-panel'):root.querySelector('.board-stack .situation-panel');
  if(panel){panel.classList.add('disease-distribution-panel');panel.innerHTML=`<h2>重点慢病患者分布</h2>${diseaseVenn(populationData())}`}
  if(view==='situation'){
    const complication=root.querySelector('.situation-complication-list')?.closest('.situation-panel');
    const right=root.querySelector('.situation-board .board-stack:last-child');
    if(complication&&right){complication.classList.add('situation-complication-panel');right.firstElementChild?.after(complication)}
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
const regionDetailBeforeClinicReport=regionDetail;
regionDetail=function(name){
  if(state.page==='clinic'){
    const node=[...counties,...cities].find(item=>item.name===name),row=node&&clinicReportRow(node);
    if(row){const built=row[1]+row[2]+row[3];drawer(`${esc(fullName(node))} · 门诊填报情况`,`<div class="detail">2026-11-05 11:46 填报快照</div><div class="drawer-section"><p>基层机构总数 ${row[0]} 家；一体化门诊 ${built} 家；覆盖率 ${(built/Math.max(1,row[0])*100).toFixed(2)}%。</p><p>基本保障型 ${row[1]} 家、强化功能型 ${row[2]} 家、鼓励探索型 ${row[3]} 家。</p><p>未建设 ${row[4]+row[5]} 家，其中其他 ${row[4]} 家、无 ${row[5]} 家。</p></div>`);return}
  }
  return regionDetailBeforeClinicReport(name);
};
const renderBeforeClinicReport=render;
render=function(){
  renderBeforeClinicReport();if(state.page!=='clinic')return;
  const row=clinicReportRow(currentNode()),view=$('view');if(!row)return;
  const built=row[1]+row[2]+row[3],values=[`${row[0]} 家`,`${(built/Math.max(1,row[0])*100).toFixed(2)}%`,`${built} 家`,`${row[1]} 家`,`${row[2]} 家`,`${row[3]} 家`];
  view.querySelectorAll('.clinic-summary-layout .kpi').forEach((card,i)=>{if(i>=values.length)return;card.querySelector('strong').textContent=values[i];card.querySelector('small').textContent=i<3?'2026-11-05 填报快照':'互斥分层 · 填报快照';const help=card.querySelector('.metric-help');if(help){help.dataset.tip=i===1?'一体化门诊覆盖率=三个能力层级机构数÷基层机构总数；其他计入未建设。':i===2?'三个能力层级机构数之和；不代表已完成审核。':'2026-11-05 填报快照；三个能力层级互斥。';help.setAttribute('aria-label',help.dataset.tip)}});
  const table=view.querySelector('.scope-table table');if(!table)return;
  const head=table.querySelector('thead tr');if(head&&head.cells.length===9){head.cells[4].textContent='有效启用';head.lastElementChild.insertAdjacentHTML('beforebegin','<th>其他（未建设）</th><th>无（未建设）</th>')}
  table.querySelectorAll('tbody tr').forEach(tr=>{
    const name=tr.cells[0]?.textContent.replace(/[▾▸]/g,'').trim(),node=[...cities,...counties].find(x=>fullName(x)===name),data=node&&clinicReportRow(node);
    if(!data){for(let i=1;i<=7;i++)if(tr.cells[i])tr.cells[i].textContent='--';tr.lastElementChild.insertAdjacentHTML('beforebegin','<td>--</td><td>--</td>');return}
    const n=data[1]+data[2]+data[3];[`${data[0]} 家`,`${n} 家`,`${(n/Math.max(1,data[0])*100).toFixed(2)}%`].forEach((v,i)=>tr.cells[i+1].textContent=v);
    tr.cells[4].textContent='--';data.slice(1,4).forEach((v,i)=>tr.cells[i+5].textContent=`${v} 家`);tr.lastElementChild.insertAdjacentHTML('beforebegin',`<td>${data[4]} 家</td><td>${data[5]} 家</td>`);
  });
  const notice=document.createElement('p');notice.className='detail';notice.textContent='门诊建设数据为 2026-11-05 填报快照；其他计入未建设。表格未提供有效启用及医共体归属。';view.querySelector('.clinic-summary-layout')?.after(notice);
};
$('help').onclick=()=>{showPrototypeHelp();const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){if(node.nodeValue.includes('所有数值、机构和事项均为模拟内容'))node.nodeValue=node.nodeValue.replace('所有数值、机构和事项均为模拟内容，不代表浙江省真实情况。','门诊建设省、市、区县汇总采用 2026-11-05 填报快照；患者、服务数据及演示事项为模拟内容。')}};
// Township values are illustrative; boundary names reflect the supplied historical dataset.
let townshipFeatures=null,townshipLoad=null;
const renderBeforeTownshipControls=render;
render=function(){
  renderBeforeTownshipControls();
  if(state.page!=='dashboard')return;
  const levels=document.querySelector('#dashboardBoard .map-levels'),views=document.querySelector('#dashboardBoard .map-view-switch');
  if(levels){levels.querySelectorAll('button').forEach(button=>{if(button.textContent.trim()==='全省'){button.remove();return}button.classList.toggle('active',button.dataset.mapScope===state.mapScope);button.onclick=()=>{state.city='all';state.mapScope=button.dataset.mapScope;mapZoom=1;render()}})}
  if(views){const back=document.createElement('button');back.type='button';back.dataset.mapBack='';back.textContent='← 返回';back.title='返回上一级';back.disabled=state.city==='all'&&!['county','town'].includes(state.mapScope);back.onclick=()=>{const node=currentNode();if(state.mapScope==='town'){state.mapScope='county';if(node)state.city='city:'+node.cityName}else if(scopeLevel()==='county'){state.city='city:'+node.cityName;state.mapScope='county'}else if(scopeLevel()==='city'){state.city='all';state.mapScope='city'}else{state.mapScope='city'}mapZoom=1;render()};views.prepend(back)}
};
const regionDetailBeforeTownships=regionDetail;
regionDetail=function(name){
  if(state.page==='dashboard'&&state.mapScope==='town')return;
  if(state.page==='dashboard'&&state.mapScope==='county'){
    const current=currentNode();
    const county=counties.find(x=>x.name===name&&(!current||scopeLevel()==='province'||x.cityName===(scopeLevel()==='city'?current.name:current.cityName)));
    if(county){state.city=nodeKey(county);state.mapScope='town';mapZoom=1;render();return}
  }
  regionDetailBeforeTownships(name);
};
const renderProvinceMapBeforeTownships=renderProvinceMap;
renderProvinceMap=function(){
  document.querySelector('.township-boundary-notice')?.remove();
  const scale=document.querySelector('#mapStage .map-scale');if(scale)scale.style.visibility='';
  if(state.page!=='dashboard'||state.mapScope!=='town'){renderProvinceMapBeforeTownships();return}
  const element=$('zhejiangMap'),county=currentNode();
  if(!element)return;
  const target=state.mapView==='3d'?$('zhejiangMap3D'):element;
  const yuhang=county?.cityName==='杭州市'&&county?.name==='余杭区'&&window.YUHANG_TOWNSHIPS?.features;
  const supplied=county&&window.HANGZHOU_WENZHOU_TOWNSHIPS?.[`${county.cityName}|${county.name}`];
  if(!townshipFeatures&&!yuhang&&!supplied){
    target.textContent='正在加载乡镇边界…';
    if(!townshipLoad)townshipLoad=(location.protocol==='file:'?new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='zhejiang-townships-data.js';script.onload=()=>resolve(window.ZHEJIANG_TOWNSHIPS);script.onerror=reject;document.head.append(script)}):fetch('zhejiang-townships.geojson').then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json()}).catch(async()=>{const parts=await Promise.all(Array.from({length:16},(_,i)=>fetch(`township-parts/${String(i).padStart(2,'0')}.bin`).then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.arrayBuffer()})));return JSON.parse(await new Blob(parts).text())})).then(data=>{townshipFeatures=data.features;townshipLoad=null;if(state.mapScope==='town')renderProvinceMap()}).catch(error=>{townshipLoad=null;console.error('乡镇边界加载失败',error);if(state.mapScope==='town')target.textContent='乡镇边界加载失败，请检查数据文件后重试'});
    return;
  }
  const countyName=name=>name==='临安市'?'临安区':name;
  const features=(yuhang||supplied||townshipFeatures).filter(f=>!county||(f.properties['市']===county.cityName&&countyName(f.properties['县'])===county.name)).map(f=>({...f,properties:{...f.properties,name:[f.properties['市'],countyName(f.properties['县']),f.properties['乡']].join('')}}));
  provinceChart?.dispose();provinceChart=null;map3DHandle?.dispose();map3DHandle=null;
  if(!features.length){target.textContent=`${county.name}暂无可匹配的乡镇边界`;return}
  target.textContent='';
  const geo={type:'FeatureCollection',features};
  const metricLabel=document.querySelector('#mapMetricLabel')?.textContent||'指标';
  const values=features.map(f=>{const name=f.properties.name,node=counties.find(c=>c.cityName===f.properties['市']&&c.name===countyName(f.properties['县'])),base=node?mapValue(node):null,hash=Array.from(name+state.mapMetric).reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);return {name,displayName:f.properties['乡'],value:Number.isFinite(base)?Math.max(0,base*(.82+(hash%37)/100)):null}});
  const valid=values.map(x=>x.value).filter(Number.isFinite),min=Math.min(...valid),max=Math.max(...valid);
  const tooltip=name=>{const value=values.find(x=>x.name===name)?.value,average=dashboardMapBenchmark(),unit=metricLabel.includes('人数')?'万人':'%';return `<div class="map-tooltip home-map-tooltip"><strong class="home-map-tooltip-title">${esc(name)}</strong><div class="home-map-tooltip-body">${Number.isFinite(value)&&Number.isFinite(average)?`<div class="map-tooltip-comparison"><span>与省均值差</span><b>${value-average>=0?'+':''}${(value-average).toFixed(2)}${unit==='%'?' 个百分点':unit}</b></div>`:''}<div><span>${esc(metricLabel)}</span><b>${Number.isFinite(value)?value.toFixed(2)+unit:'暂无数据'}</b></div>${Number.isFinite(average)?`<div><span>省平均</span><b>${average.toFixed(2)}${unit}</b></div>`:''}<em>街镇指标为演示数据</em></div></div>`};
  const openTownClinic=name=>{if(state.dashboardView!=='construction')return;const county=currentNode();leadingClinicItems();selectedClinicTown=county&&name.startsWith(county.cityName+county.name)?name.slice((county.cityName+county.name).length):name;leadingPhotoIndex=0;clinicImageIndex=0;const items=leadingClinicItems(),content=document.querySelector('.leading-content');if(content)content.innerHTML=items.length?leadingClinicMarkup(items[0],items.length):'<span>该街道暂无可匹配的机构照片</span><div class="leading-photo">暂无展示图片</div>';const dialog=document.createElement('dialog');dialog.className='town-clinic-dialog';dialog.innerHTML=`<h2>${esc(name)}机构图片</h2>${items.length?items.map(item=>`<p>${esc(item.name)}</p><div class="town-photo-grid">${clinicImages(item).map((photo,i)=>`<button type="button" data-photo-preview="${esc(photo)}" data-photo-name="${esc(item.name)}" aria-label="放大查看${esc(item.name)}第${i+1}张照片"><img src="${esc(photo)}" alt="${esc(item.name)}"></button>`).join('')}</div>`).join(''):'<p>该街道暂无可匹配的机构图片</p>'}<button type="button" data-close-town>关闭</button>`;document.body.append(dialog);dialog.querySelector('[data-close-town]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal()};
  if(state.mapView==='3d'){
    if(!window.ZhejiangMap3D){fallbackTo2D(new Error('三维地图资源未加载'));return}
    try{map3DHandle=window.ZhejiangMap3D.mount(target,geo,values,{showLabels:!!county,countyLevel:false,townLevel:true,onHover:tooltip,onClick:openTownClinic,onZoom:zoom=>{mapZoom=zoom;updateMapZoom()}});updateMapZoom()}catch(error){fallbackTo2D(error)}
    return;
  }
  echarts.registerMap('zhejiang-townships-current',geo);
  provinceChart=echarts.init(element);
  provinceChart.setOption({tooltip:{trigger:'item',formatter:p=>tooltip(p.name),confine:true,backgroundColor:'transparent',borderWidth:0,padding:0,extraCssText:'box-shadow:none;',textStyle:{color:'#fff'}},visualMap:valid.length?{show:false,min,max:max===min?min+1:max,inRange:{color:['#218ed0','#29c3e6','#f4d467','#fb9a53','#f15c55']}}:undefined,series:[{type:'map',map:'zhejiang-townships-current',data:values,roam:true,scaleLimit:{min:1,max:8},zoom:mapZoom,label:{show:!!county,formatter:p=>values.find(x=>x.name===p.name)?.displayName||p.name,fontSize:10,color:'#e9f6ff'},itemStyle:{areaColor:'#176d9b',borderColor:'#7acbfa',borderWidth:1},emphasis:{label:{show:true,formatter:p=>values.find(x=>x.name===p.name)?.displayName||p.name},itemStyle:{areaColor:'#2baed1'}}}]});
  provinceChart.on('georoam',()=>{mapZoom=provinceChart.getOption().series[0].zoom||1;updateMapZoom()});
  provinceChart.on('click',params=>openTownClinic(params.name));
  updateMapZoom();setTimeout(()=>provinceChart?.resize(),0);
};
// Home panel controls share the existing map metric state and drilldown rendering.
const dashboardBeforeHomeMapLinks=dashboard;
dashboard=function(){
  const html=dashboardBeforeHomeMapLinks();
  if(!homeView())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard');
  const labels={bloodPressure:'血压控制率',bloodGlucose:'血糖控制率',hba1cTarget:'糖化血红蛋白控制率',bloodLipids:'血脂控制率'};
  Object.entries(labels).forEach(([key,label])=>{homeMapDefinitions[key][0]=label;homeMapDefinitions[key][1]=homeMapDefinitions[key][1].replace(/控制率/g,'控制率')});
  const link=(heading,key)=>{if(heading)heading.insertAdjacentHTML('beforeend',`<button class="home-map-link" type="button" data-home-map-link="${key}" title="联动地图">⌖ 联动地图</button>`)};
  link(board.querySelector('.home-risk-panel h2'),'highRisk');
  const panels=board.querySelectorAll('.board-stack:last-child > .board-panel');
  link(panels[0]?.querySelector('h2'),'construction');
  const capacityHead=panels[0]?.querySelector('.home-capacity-head');
  if(capacityHead){
    const note=panels[0].querySelector('.home-panel-note');
    if(note){note.textContent='一体化门诊总数 ÷ 基层机构总数';capacityHead.append(note)}
    const value=capacityHead.querySelector('strong');if(value)value.innerHTML=value.textContent.replace('%','<small class="home-percent-unit">%</small>');
  }
  const serviceValue=panels[1]?.querySelector('.home-service-summary strong');
  if(serviceValue)serviceValue.innerHTML=serviceValue.textContent.replace(/\s*次\s*$/,' <small class="summary-unit">次</small>');
  const core=panels[2],heading=core?.querySelector('h2');
  if(heading){heading.textContent='核心指标控制率';link(heading,'control')}
  core?.querySelectorAll('.outcome-ring-item').forEach(item=>{item.innerHTML=item.innerHTML.replace(/控制率/g,'控制率');const number=item.querySelector('b');if(number)number.innerHTML=number.textContent.replace('%','<small class="home-percent-unit">%</small>');if(item.dataset.boardTip)item.dataset.boardTip=item.dataset.boardTip.replace(/控制率/g,'控制率')});
  const metric=homeMapDefinitions[state.mapMetric];
  const mapTitle=board.querySelector('.board-map .panel-head h2');
  if(mapTitle&&metric&&state.homeMapLinked)mapTitle.textContent=`${currentNode()?.name||'浙江省'}${metric[0]}热力图`;
  if(mapTitle&&state.homeMapLinked&&labels[state.mapMetric]){const selected=state.mapMetric;mapTitle.insertAdjacentHTML('afterend',`<div class="home-control-tabs" role="tablist" aria-label="核心指标控制率">${Object.entries(labels).map(([key,label])=>`<button type="button" role="tab" data-home-control="${key}" aria-selected="${selected===key}" class="${selected===key?'active':''}">${label.replace('控制率','')}</button>`).join('')}</div>`)}
  const mapLabel=board.querySelector('#mapMetricLabel');if(mapLabel&&metric)mapLabel.textContent=metric[0];
  board.querySelector('.home-filing-chart')?.setAttribute('preserveAspectRatio','xMidYMid meet');
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-home-map-link]'),tab=event.target.closest('[data-home-control]');
  if(!homeView()||(!link&&!tab))return;
  const key=tab?.dataset.homeControl||(link.dataset.homeMapLink==='control'?(state.homeControlMetric||'bloodPressure'):link.dataset.homeMapLink);
  if(labelsForHomeControl(key))state.homeControlMetric=key;
  state.mapMetric=key;state.homeMapLinked=true;render();
});
function labelsForHomeControl(key){return ['bloodPressure','bloodGlucose','hba1cTarget','bloodLipids'].includes(key)}

// Combination values are mutually exclusive, as in the disease distribution.
const situationCombinationLabels={'3':'高+糖','5':'高+慢','6':'糖+慢','7':'高+糖+慢'};
function situationCombinationValue(node,key){return diseaseCombinations(node?populationFor(node):populationData()).find(row=>row.bits===Number(key))?.value||0}
const mapValueBeforeCombination=mapValue;
mapValue=function(node){
  if(situationActive()&&state.mapMetric==='comorbidity')return situationCombinationValue(node,state.situationCombination||'7')/Math.max(.0001,situationData(node).p.diagnosed)*100;
  if(situationActive()&&state.mapMetric==='diagnosed')return situationData(node).p.diagnosed/Math.max(.0001,situationData(node).p.diagnosed*(1.18+(100-(node.follow||70))/200))*100;
  return mapValueBeforeCombination(node);
};
const mapTooltipBeforeCombination=mapTooltip;
mapTooltip=function(node){
  if(situationActive()&&state.mapMetric==='comorbidity'){const d=situationData(node),n=situationCombinationValue(node,state.situationCombination||'7');return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>${situationCombinationLabels[state.situationCombination||'7']}共病人数</span><b>${people(n)}人</b></div><div><span>占确诊人群比例</span><b>${(n/Math.max(.0001,d.p.diagnosed)*100).toFixed(2)}%</b></div><p>共病人数 ÷ 重点慢病确诊人数</p></div>`}
  return mapTooltipBeforeCombination(node);
};
const dashboardBeforeSituationMapLinks=dashboard;
dashboard=function(){
  const html=dashboardBeforeSituationMapLinks();if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard');
  if(homeView()){
    const venn=board.querySelector('.disease-venn-svg');if(venn){[['高血压',90,120],['糖尿病',210,120],['慢阻肺',150,40]].forEach(([name,x,y])=>{const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',x);text.setAttribute('y',y);text.setAttribute('text-anchor','middle');text.setAttribute('class','venn-disease-label');text.textContent=name;venn.append(text)})}
    const title=board.querySelector('.board-map .panel-head h2'),metric=homeMapDefinitions[state.mapMetric];
    if(title&&metric)title.textContent=`${currentNode()?.name||'浙江省'}${metric[0]}热力图`;
  }
  if(situationActive()){
    const metric=state.mapMetric,units=childUnits(),key=state.situationCombination||'7';
    const venn=board.querySelector('.disease-venn-svg');if(venn){[['高血压',92,120],['糖尿病',208,120],['慢阻肺',150,45]].forEach(([name,x,y])=>{const text=document.createElementNS('http://www.w3.org/2000/svg','text');text.setAttribute('x',x);text.setAttribute('y',y);text.setAttribute('text-anchor','middle');text.setAttribute('class','venn-disease-label');text.textContent=name;venn.append(text)})}
    const title=board.querySelector('.board-map .panel-head h2');
    if(title)title.textContent=`${currentNode()?.name||'浙江省'}${metric==='diagnosed'?'重点慢病患者占比':metric==='comorbidity'?'共病负荷':'高风险人数占比'}热力图`;
    const label=board.querySelector('#mapMetricLabel');if(label)label.textContent=metric==='diagnosed'?'重点慢病患者占比':metric==='comorbidity'?`${situationCombinationLabels[key]}占确诊人群比例`:'高风险人数占比';
    if(metric==='comorbidity'){
      const ordered=[...units].sort((a,b)=>mapValue(b)-mapValue(a)),total=cities.reduce((sum,x)=>sum+situationData(x).p.diagnosed,0),average=cities.reduce((sum,x)=>sum+situationCombinationValue(x,key),0)/Math.max(.0001,total)*100;
      const items=ordered.slice(0,5).map(x=>`${fullName(x)}${situationCombinationLabels[key]}共病人数 ${people(situationCombinationValue(x,key))}人，占确诊人群 ${mapValue(x).toFixed(2)}%，省平均 ${average.toFixed(2)}%。`);
      const ticker=board.querySelector('.board-ticker');if(ticker){ticker.dataset.items=JSON.stringify(items);const text=ticker.querySelector('#boardTickerText');if(text)text.textContent=items[0]||'暂无下级单位'}
    }
    const link=(heading,value)=>heading?.insertAdjacentHTML('beforeend',`<button type="button" class="home-map-link" data-situation-map-link="${value}">⌖ 联动地图</button>`);
    link(board.querySelector('.disease-distribution-panel h2'),'diagnosed');
    link(board.querySelector('.board-stack:last-child > .board-panel:first-child h2'),'highRisk');
    const tabs=(selected,slot)=>`<div class="situation-combination-tabs" role="tablist" aria-label="疾病组合">${Object.entries(situationCombinationLabels).map(([id,name])=>`<button type="button" role="tab" data-combination="${id}" data-combination-slot="${slot}" aria-selected="${id===selected}" class="${id===selected?'active':''}">${name}</button>`).join('')}</div>`;
    const rank=(name,slot,fn,percent=false)=>{const selected=state[`combination${slot}`]||(slot==='Missing'?'high':'7');const holder=document.createElement('div');holder.innerHTML=requestedRank(name,units,x=>fn(x,selected),percent);const controls=slot==='Missing'?`<div class="situation-combination-tabs" role="tablist">${[['high','高血压'],['diabetes','糖尿病'],['copd','慢阻肺']].map(([id,label])=>`<button type="button" data-combination="${id}" data-combination-slot="Missing" class="${id===selected?'active':''}">${label}</button>`).join('')}</div>`:tabs(selected,slot);holder.querySelector('h2').insertAdjacentHTML('beforeend',controls);holder.querySelector('.requested-rank-list')?.insertAdjacentHTML('afterend','<small class="combination-note">模拟数据</small>');return holder.innerHTML};
    board.querySelectorAll('.construction-coverage strong').forEach(el=>{el.innerHTML=el.innerHTML.replace(/(万次)/g,'<small class="visit-unit">$1</small>')});
    const bottom=board.querySelector('.situation-bottom');
    if(metric==='comorbidity')bottom.innerHTML=rank('区域共病人数','Count',(x,k)=>situationCombinationValue(x,k))+rank('共病占确诊人群比例','Rate',(x,k)=>situationCombinationValue(x,k)/Math.max(.0001,situationData(x).p.diagnosed)*100,true);
    else if(metric==='diagnosed')bottom.innerHTML=requestedRank('区域确诊人数',units,x=>situationData(x).p.diagnosed)+rank('区域未建档人数','Missing',(x,k)=>{const p=populationFor(x);return Math.max(0,({high:p.high-p.managedHigh,diabetes:p.diabetes-p.managedDiabetes,copd:p.copd-p.managedCopd})[k]||0)});
    else bottom.innerHTML=requestedRank('区域高风险人数',units,x=>situationData(x).risk.high)+requestedRank('区域高风险人数占比',units,x=>situationData(x).riskRate,true);
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{
  if(!situationActive())return;
  const link=event.target.closest('[data-situation-map-link]'),tab=event.target.closest('[data-combination]');
  if(link){state.mapMetric=link.dataset.situationMapLink;render()}
  if(tab){state[`combination${tab.dataset.combinationSlot}`]=tab.dataset.combination;if(state.mapMetric==='comorbidity')state.situationCombination=tab.dataset.combination;render()}
});
const renderProvinceMapBeforeCanvasAdjustment=renderProvinceMap;
renderProvinceMap=function(){renderProvinceMapBeforeCanvasAdjustment();if(state.page==='dashboard'&&state.mapView==='2d'&&provinceChart)provinceChart.setOption({tooltip:{backgroundColor:'transparent',borderWidth:0,padding:0,extraCssText:'box-shadow:none;'},series:[{layoutSize:'80%',scaleLimit:{min:.05,max:100}}]})};
const changeMapZoomBeforeAnnotations=changeMapZoom;
changeMapZoom=function(action){
  if(state.page!=='dashboard'||state.mapView!=='2d'||!provinceChart)return changeMapZoomBeforeAnnotations(action);
  const current=provinceChart.getOption().series[0];
  mapZoom=action==='reset'?1:Math.max(.05,Math.min(100,(current.zoom||1)*(action==='in'?1.5:1/1.5)));
  provinceChart.setOption({series:[{zoom:mapZoom,center:action==='reset'?null:current.center}]});updateMapZoom();
};
const dashboardBeforeCurrentAnnotations=dashboard;
dashboard=function(){
  const html=dashboardBeforeCurrentAnnotations();
  if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard');
  board.querySelectorAll('.board-ticker span').forEach(el=>{el.textContent=el.textContent.replace(/预警/g,'')});
  board.querySelectorAll('.board-ticker strong').forEach(el=>{const viewport=document.createElement('div');viewport.className='ticker-viewport';el.replaceWith(viewport);viewport.append(el)});
  board.querySelectorAll('.outcome-ring-item').forEach(item=>{item.querySelectorAll('span').forEach(el=>{el.textContent=el.textContent.replace(/控制率/g,'')})});
  if(state.dashboardView==='construction'){
    const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
    const link=(heading,key)=>heading?.insertAdjacentHTML('beforeend',`<button type="button" class="home-map-link" data-construction-map-link="${key}">⌖ 联动地图</button>`);
    link(left?.children[0]?.querySelector('h2'),'construction');
    link(right?.children[0]?.querySelector('h2'),'entry');
    link(right?.children[1]?.querySelector('h2'),'monitoring');
    const titles={construction:'一体化门诊覆盖率',entry:'医防融合入径率',monitoring:'路径节点总执行率'};
    const title=board.querySelector('.board-map .panel-head h2');if(title)title.textContent=`${currentNode()?.name||'浙江省'}${titles[state.mapMetric]||titles.construction}热力图`;
    const clinicItems=leadingClinicItems();
    const clinic=clinicItems[leadingPhotoIndex%clinicItems.length];
    left?.children[1]?.insertAdjacentHTML('beforeend',`<div class="leading-content">${clinic?leadingClinicMarkup(clinic,clinicItems.length):'<span>当前区域机构资料待核实</span><div class="leading-photo">暂无展示图片</div>'}</div>`);
    const bottom=board.querySelector('.situation-bottom');
    if(state.mapMetric==='entry')bottom?.querySelector('h2')?.replaceChildren('区域医防融合入径率');
    if(state.mapMetric==='monitoring')bottom?.querySelector('h2')?.replaceChildren('区域路径节点总执行率');
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const link=event.target.closest('[data-construction-map-link]');if(link&&state.page==='dashboard'&&state.dashboardView==='construction'){state.mapMetric=link.dataset.constructionMapLink;render()}});

const dashboardBeforeOutcomeLinks=dashboard;
dashboard=function(){
  const html=dashboardBeforeOutcomeLinks();if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard');
  if(state.dashboardView==='outcomes'){
    const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
    [[left?.children[0],'outcomeContract'],[left?.children[1],'outcomeFrequency'],[left?.children[2],'outcomeLost'],[right?.children[0],'outcomeBpTarget'],[right?.children[1],'outcomeBpImprove'],[right?.children[2],'outcomeComplication']].forEach(([panel,key])=>{
      const heading=panel?.querySelector('.situation-panel-title')||panel?.querySelector('h2');
      heading?.insertAdjacentHTML('beforeend',`<button type="button" class="home-map-link" data-outcome-map-link="${key}">⌖ 联动地图</button>`);
    });
    const metric=outcomeMapMetrics.find(([key])=>key===state.mapMetric)?.[1]||'血压控制率',title=board.querySelector('.board-map .panel-head h2');
    if(title)title.textContent=`${currentNode()?.name||'浙江省'}${metric==='人均就诊率'?'人均就诊频率':metric}热力图`;
    const group=state.mapMetric.endsWith('Target')?'Target':state.mapMetric.endsWith('Improve')?'Improve':null;
    if(title&&group){const options=[['Bp','血压'],['Glucose','血糖'],['Hba1c','糖化血红蛋白'],['Lipid','血脂']];title.insertAdjacentHTML('afterend',`<div class="home-control-tabs" role="tablist" aria-label="指标项目">${options.map(([key,label])=>`<button type="button" role="tab" data-outcome-control="outcome${key}${group}" aria-selected="${state.mapMetric===`outcome${key}${group}`}" class="${state.mapMetric===`outcome${key}${group}`?'active':''}">${label}</button>`).join('')}</div>`)}
  }
  board.querySelectorAll('[data-home-map-link],[data-situation-map-link],[data-construction-map-link],[data-outcome-map-link]').forEach(button=>{const key=button.dataset.homeMapLink||button.dataset.situationMapLink||button.dataset.constructionMapLink||button.dataset.outcomeMapLink;const selected=state.activeMapLink===key;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected))});
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-home-map-link],[data-situation-map-link],[data-construction-map-link],[data-outcome-map-link],[data-outcome-control]');
  if(!button||state.page!=='dashboard')return;
  event.stopImmediatePropagation();
  if(button.dataset.outcomeControl){state.mapMetric=button.dataset.outcomeControl;render();return}
  const key=button.dataset.homeMapLink||button.dataset.situationMapLink||button.dataset.constructionMapLink||button.dataset.outcomeMapLink;
  const defaults={home:'highRisk',situation:'comorbidity',construction:'construction',outcomes:'outcomeBpTarget'},view=state.dashboardView||'home';
  if(state.activeMapLink===key){state.activeMapLink=null;state.mapMetric=defaults[view];state.homeMapLinked=false}
  else{state.activeMapLink=key;state.mapMetric=key==='control'?(state.homeControlMetric||'bloodPressure'):key;state.homeMapLinked=true}
  render();
},true);
const dashboardBeforeLatestCorrections=dashboard;
dashboard=function(){
  const html=dashboardBeforeLatestCorrections();if(!situationActive())return html;
  const root=document.createElement('div');root.innerHTML=html;
  root.querySelectorAll('[data-situation-population-disease],[data-situation-disease]').forEach(button=>{const key=button.hasAttribute('data-situation-disease')?'situationDisease':'situationPopulationDisease';if(button.dataset[key]==='高糖合并')button.dataset[key]='慢阻肺';button.textContent=button.dataset[key];button.classList.toggle('active',button.dataset[key]===(state[key]||'高血压'))});
  root.querySelectorAll('.situation-panel-title h2').forEach(title=>{if(title.textContent==='并发症情况')title.textContent='专档患者并发症情况'});
  root.querySelectorAll('.requested-rank-list:not(.auto-scroll)').forEach(list=>{if(list.children.length>2){const rows=list.innerHTML;list.classList.add('auto-scroll');list.innerHTML=`<div class="scroll-track">${rows}${rows}</div>`}});
  return root.innerHTML;
};
pages.dashboard=dashboard;
let leadingPhotoIndex=0;
let clinicImageIndex=0,clinicLastInteraction=0;
let selectedClinicTown='',clinicScopeKey='';
function leadingClinicItems(){const node=currentNode(),level=scopeLevel(),key=state.city;if(key!==clinicScopeKey){selectedClinicTown='';clinicScopeKey=key;leadingPhotoIndex=0;clinicImageIndex=0}return (window.CLINIC_PHOTOS||[]).filter(item=>{if(!node)return true;if(level==='city')return item.city===node.name;if(level==='consortium'||level==='clinic')return false;if(!item.name.includes(node.name)||item.city!==node.cityName)return false;return !selectedClinicTown||item.name.includes(selectedClinicTown)})}
function clinicImages(clinic){return Array.isArray(clinic.photos)&&clinic.photos.length?clinic.photos:[clinic.photo].filter(Boolean)}
function leadingClinicMarkup(clinic,count){const photos=clinicImages(clinic),start=Math.floor(clinicImageIndex/4)*4;return `<div class="leading-name"><span>${esc(clinic.name)}</span><div class="leading-controls"><button type="button" data-clinic-step="-1" aria-label="上一家机构" title="上一家机构" ${count<2?'disabled':''}>‹</button><button type="button" data-clinic-step="1" aria-label="下一家机构" title="下一家机构" ${count<2?'disabled':''}>›</button></div></div><div class="leading-photo photo-grid">${photos.slice(start,start+4).map((photo,i)=>`<button type="button" data-photo-preview="${esc(photo)}" data-photo-name="${esc(clinic.name)}" aria-label="放大查看第${start+i+1}张照片"><img src="${esc(photo)}" alt="${esc(clinic.name)}第${start+i+1}张照片"></button>`).join('')}${Array.from({length:Math.max(0,4-photos.slice(start,start+4).length)},()=>'<div class="photo-empty"></div>').join('')}</div>`}
function refreshLeadingClinic(){const content=document.querySelector('.leading-content'),items=leadingClinicItems();if(!content||!items.length)return;leadingPhotoIndex=(leadingPhotoIndex%items.length+items.length)%items.length;content.innerHTML=leadingClinicMarkup(items[leadingPhotoIndex],items.length)}
document.addEventListener('click',event=>{const step=event.target.closest('[data-clinic-step]'),dot=event.target.closest('[data-clinic-photo]');if(!step&&!dot)return;clinicLastInteraction=Date.now();if(step){leadingPhotoIndex+=Number(step.dataset.clinicStep);clinicImageIndex=0}else clinicImageIndex=Number(dot.dataset.clinicPhoto);refreshLeadingClinic()});
document.addEventListener('click',event=>{const button=event.target.closest('[data-photo-preview]');if(!button)return;clinicLastInteraction=Date.now();const dialog=document.createElement('dialog');dialog.className='town-clinic-dialog photo-preview-dialog';dialog.innerHTML=`<h2>${esc(button.dataset.photoName)}</h2><img src="${esc(button.dataset.photoPreview)}" alt="${esc(button.dataset.photoName)}"><button type="button">关闭</button>`;document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal()});
setInterval(()=>{const items=leadingClinicItems();if(!document.querySelector('.leading-content')||!items.length||document.querySelector('dialog[open]')||Date.now()-clinicLastInteraction<5000)return;const photos=clinicImages(items[leadingPhotoIndex%items.length]);if(clinicImageIndex+4<photos.length)clinicImageIndex+=4;else{clinicImageIndex=0;leadingPhotoIndex++}refreshLeadingClinic()},5000);
const dashboardBeforeRingAnnotations=dashboard;
dashboard=function(){
  const html=dashboardBeforeRingAnnotations();if(state.page!=='dashboard')return html;
  const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard'),view=state.dashboardView||'home';
  if(view==='outcomes'){
    const panel=board.querySelector('.outcome-board-panel .situation-panel-title');
    if(panel){panel.querySelector('h2').textContent='专档患者并发症情况';panel.querySelectorAll('[data-situation-disease]').forEach(button=>{if(button.dataset.situationDisease==='高糖合并')button.dataset.situationDisease='慢阻肺';button.textContent=button.dataset.situationDisease;button.classList.toggle('active',button.dataset.situationDisease===(state.situationDisease||'高血压'))})}
  }
  if(view==='situation'||view==='construction'){
    const coverage=view==='construction'?board.querySelector('.board-stack:first-child .construction-coverage'):board.querySelector('.board-stack:last-child .construction-coverage');
    if(coverage){const ring=coverage.querySelector('.construction-doughnut'),share=parseFloat(ring.style.getPropertyValue('--doughnut')),labels=view==='construction'?['一体化门诊覆盖率','未建成占比']:['基层就诊率','等级医院就诊率'];ring.dataset.ringShare=share;ring.dataset.ringLabels=JSON.stringify(labels);ring.classList.add('rotating-doughnut');coverage.querySelectorAll('.construction-coverage-legend strong').forEach(el=>{el.innerHTML=el.innerHTML.replace(/\s*·\s*[\d.]+%/g,'')});}
  }
  if(view==='construction'){
    const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
    const service=left?.querySelector('.home-service-summary');if(service){const strong=service.querySelector('strong');if(strong)strong.innerHTML=strong.textContent.replace(/\s*次\s*$/,' <small class="summary-unit">次</small>');service.classList.add('stacked-total')}
    const entry=right?.children[0]?.querySelector('.construction-total');if(entry){entry.classList.add('stacked-total');entry.insertAdjacentHTML('afterend','<div class="entry-formula">入径患者数 ÷ 专档患者数</div>')}
    right?.querySelector('.construction-node-head')?.classList.add('stacked-node');
    board.querySelectorAll('.construction-line').forEach(svg=>svg.setAttribute('preserveAspectRatio','none'));
  }
  board.querySelectorAll('.home-risk-bars>div').forEach(row=>{if(row.dataset.boardTip)row.dataset.boardTip+='\n公式：各层级风险人数 ÷ 专档确诊人数'});
  board.querySelectorAll('.requested-rank-list > div,.requested-rank-list .scroll-track > div').forEach(row=>{if(!row.dataset.boardTip)row.dataset.boardTip=row.textContent.replace(/\s+/g,' ').trim().replace(/\s*·\s*/g,'\n占比：')});
  board.querySelectorAll('.construction-line').forEach(svg=>svg.setAttribute('preserveAspectRatio','none'));
  if(view==='home'){
    const scaleLabel=board.querySelector('.map-scale span:last-child');if(scaleLabel)scaleLabel.textContent='';
    const serviceTotal=board.querySelector('.home-service-summary strong');
    if(serviceTotal){const amount=Number(serviceTotal.textContent.replace(/[^\d.]/g,''));if(Number.isFinite(amount))serviceTotal.innerHTML=`${(amount/10000).toFixed(2)} <small class="summary-unit">万人次</small>`}
    const entry=[...board.querySelectorAll('.board-kpi')].find(card=>card.querySelector('span')?.textContent.trim()==='医防融合入径率');
    if(entry&&!entry.querySelector('.entry-formula'))entry.insertAdjacentHTML('beforeend','<small class="entry-formula">入径患者数 ÷ 专档患者数</small>');
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{
  const path=event.target.closest('.disease-venn-svg [data-venn-name]');if(!path)return;
  const layout=path.closest('.disease-venn-layout'), totals=layout.querySelector('.disease-venn-totals');
  if(!totals.dataset.original)totals.dataset.original=totals.innerHTML;
  const selected=path.classList.contains('venn-selected');
  layout.querySelectorAll('.venn-selected').forEach(item=>item.classList.remove('venn-selected'));
  totals.classList.toggle('showing-selection',!selected);
  if(selected)totals.innerHTML=totals.dataset.original;
  else{path.classList.add('venn-selected');totals.innerHTML=`<div><i></i><span>${esc(path.dataset.vennName)}</span><strong>${esc(path.dataset.vennValue)}</strong></div>`}
});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.disease-venn-svg [data-venn-name]')){event.preventDefault();event.target.click()}});
const mapTooltipBeforeSharedAppearance=mapTooltip;
mapTooltip=function(node){
  const html=mapTooltipBeforeSharedAppearance(node);
  if(state.page!=='dashboard'||homeView())return html;
  const container=document.createElement('div');container.innerHTML=html;
  const tip=container.querySelector('.map-tooltip'),title=tip?.querySelector(':scope > strong');
  if(!tip||!title)return html;
  tip.classList.add('home-map-tooltip');title.classList.add('home-map-tooltip-title');
  const body=document.createElement('div');body.className='home-map-tooltip-body';
  while(title.nextSibling)body.append(title.nextSibling);
  tip.append(body);return container.innerHTML;
};
let ringRotation=0,ringLastInteraction=0;
function updateRotatingRings(){document.querySelectorAll('.rotating-doughnut').forEach(ring=>{const share=Number(ring.dataset.ringShare),labels=JSON.parse(ring.dataset.ringLabels),active=ringRotation%2;ring.classList.toggle('second-selected',!!active);ring.querySelector('strong').textContent=`${(active?100-share:share).toFixed(2)}%`;ring.querySelector('span').textContent=labels[active];const rows=ring.parentElement.querySelectorAll('.construction-coverage-legend>div');rows.forEach((row,index)=>row.classList.toggle('ring-selected',index===active))})}
document.addEventListener('click',event=>{const ring=event.target.closest('.rotating-doughnut'),row=event.target.closest('.construction-coverage-legend>div');const target=ring||row?.closest('.construction-coverage')?.querySelector('.rotating-doughnut');if(!target)return;let index;if(row){index=Array.from(row.parentElement.children).indexOf(row);if(index>1)return}else{const rect=ring.getBoundingClientRect(),x=event.clientX-(rect.left+rect.width/2),y=event.clientY-(rect.top+rect.height/2);if(Math.hypot(x,y)<rect.width*.28)return;const angle=(Math.atan2(x,-y)*180/Math.PI+360)%360;index=angle<Number(ring.dataset.ringShare)*3.6?0:1}ringRotation=index;ringLastInteraction=Date.now();updateRotatingRings()});
setInterval(()=>{if(Date.now()-ringLastInteraction<4000)return;ringRotation++;updateRotatingRings()},2000);
const dashboardBeforeHomeFunnels=dashboard;
dashboard=function(){
  const html=dashboardBeforeHomeFunnels();if(!homeView())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),p=populationData(),node=currentNode(),metrics=clinicMetrics(node),resident=residentForNode(node)?.[0] ?? null;
  const cards=board.querySelectorAll('.board-kpi');
  cards[0].querySelector('span').textContent='常住人口';cards[0].querySelector('small')?.remove();
  cards[0].querySelector('strong').innerHTML=resident===null?'待接入':`${resident.toFixed(1)}<em class="board-kpi-unit">万人</em>`;
  const entry=[...cards].find(card=>card.querySelector('span')?.textContent.trim()==='医防融合入径率');
  if(entry){entry.querySelector('span').textContent='基层就诊人次';entry.querySelector('strong').innerHTML=`${visitsForSelection().primary.toFixed(1)}<em class="board-kpi-unit">万人次</em>`;entry.querySelectorAll('small').forEach(el=>el.remove())}
  const riskRate=homeRisk(node).high/Math.max(1,p.managed);
  const diseases=[['高血压',p.high,p.managedHigh],['糖尿病',p.diabetes,p.managedDiabetes],['慢阻肺',p.copd,p.managedCopd]];
  board.querySelectorAll('.board-stack:first-child > .board-panel').forEach((panel,i)=>{
    const [name,diagnosed,managed]=diseases[i],high=managed*riskRate;
    const rows=[['确诊',diagnosed,resident,'常住人口'],['专档',managed,diagnosed,'确诊患者'],['高风险',high,managed,'专档患者']];
    panel.innerHTML=`<h2>${name}患者情况</h2><div class="disease-funnel" aria-label="${name}患者情况，模拟数据">${rows.map(([label,value,base,baseLabel],index)=>`<div class="funnel-row"><div class="funnel-shape funnel-${index}"><span>${label}</span><strong>${value.toFixed(1)} <small>万人</small></strong></div><div class="funnel-ratio"><strong>${base==null?'待接入':formatPct(value/Math.max(.0001,base)*100)}</strong><span>占${baseLabel}</span></div></div>`).join('')}</div>`;
  });
  const counts=[...homeTierCounts(node),Math.max(0,metrics.eligible-metrics.built)],names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#37baf2','#4ed5bc','#f2bd65','#536b88'];
  let start=0;const stops=counts.map((count,i)=>{const from=start;start+=count/Math.max(1,metrics.eligible)*100;return `${colors[i]} ${from}% ${start}%`}).join(',');
  const capacity=board.querySelector('.board-stack:last-child > .board-panel:first-child');
  capacity.innerHTML=`<h2>一体化门诊覆盖率</h2><div class="home-coverage-layout"><div class="home-coverage-ring" style="background:conic-gradient(${stops})"><div><strong>${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%</strong><span>覆盖率</span></div></div><div class="home-coverage-legend">${counts.map((count,i)=>`<div><i style="background:${colors[i]}"></i><span>${names[i]}</span><strong>${count} <small>家</small></strong></div>`).join('')}<div class="coverage-total">已建设 ${metrics.built} / ${metrics.eligible} 家</div></div></div>`;
  const weights=Array.from({length:12},(_,i)=>990+i*46+Math.sin(i*.8)*80),annualVisits=visitsForSelection().primary*10000*.6,weightTotal=weights.reduce((a,b)=>a+b,0);
  const values=weights.map(weight=>Math.round(annualVisits*weight/weightTotal)),data=boardTimeAxis(values),w=464,h=154,left=50,right=18,top=25,bottom=24;
  const total=values.reduce((a,b)=>a+b,0), serviceCard=[...cards].find(card=>card.querySelector('span')?.textContent.trim()==='基层服务人次');
  if(serviceCard){serviceCard.querySelector('span').textContent='一体化门诊服务人次';serviceCard.querySelector('strong').innerHTML=`${(total/10000).toFixed(1)}<em class="board-kpi-unit">万人次</em>`;}
  const rates=data.values.map((v,i)=>i&&data.values[i-1]?(v/data.values[i-1]-1)*100:null),valid=rates.filter(Number.isFinite),extent=Math.max(1,...valid.map(Math.abs)),step=Math.pow(10,Math.floor(Math.log10(extent)))/2,min=Math.min(0,Math.floor(Math.min(0,...valid)/step)*step),max=Math.max(step,Math.ceil(Math.max(0,...valid)/step+0.2)*step),x=i=>left+30+i*(w-left-right-60)/Math.max(1,data.values.length-1),y=v=>h-bottom-(v-min)/(max-min)*(h-top-bottom);
  const service=board.querySelector('.board-stack:last-child > .board-panel:nth-child(2)');
  service.innerHTML=`<h2>一体化门诊服务人次增长率</h2><div class="home-service-summary"><span>月均服务人次</span><strong>${(total/12/10000).toFixed(2)} <small class="summary-unit">万人次</small></strong></div><svg class="home-service-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="一体化门诊服务人次增长率，单位百分比"><text class="service-unit" x="42" y="14" text-anchor="end">%</text><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>{const v=min+(max-min)*t;return `<line x1="${left}" x2="${w-right}" y1="${y(v)}" y2="${y(v)}"/><text x="42" y="${y(v)+5}" text-anchor="end">${Number(v.toFixed(1))}</text>`}).join('')}</g><polyline points="${rates.map((v,i)=>v===null?'':`${x(i)},${y(v)}`).filter(Boolean).join(' ')}" fill="none" stroke="#2dc5ff" stroke-width="3"/>${rates.map((v,i)=>`${v===null?'':`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="#68dcff"><title>${data.labels[i]} ${v.toFixed(1)}%</title></circle><text class="service-bar-value" x="${x(i)}" y="${y(v)-10}" text-anchor="middle">${v.toFixed(1)}%</text>`}<text class="construction-month" x="${x(i)}" y="${h-3}" text-anchor="middle">${data.labels[i]}</text>`).join('')}</svg>`;
  return root.innerHTML;
};
pages.dashboard=dashboard;
const dashboardBeforeSituationRefresh=dashboard;
dashboard=function(){
  const html=dashboardBeforeSituationRefresh();if(!situationActive())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),p=populationData(),risk=homeRisk(currentNode()),parts=diseaseCombinations(p);
  const groups=[['仅高血压',parts[0].value,'#38a7f2'],['仅糖尿病',parts[1].value,'#f4a664'],['仅慢阻肺',parts[2].value,'#85d1e9'],['2病共患',parts.slice(3,6).reduce((a,x)=>a+x.value,0),'#a78de9'],['3病叠加',parts[6].value,'#f2ce68']];
  const total=groups.reduce((a,x)=>a+x[1],0),comorbid=groups[3][1]+groups[4][1];
  function ring(rows,center,label){let offset=0;const sum=rows.reduce((a,x)=>a+x[1],0),stops=rows.map(([,value,color])=>{const start=offset;offset+=value/Math.max(.0001,sum)*100;return `${color} ${start}% ${offset}%`}).join(',');return `<div class="situation-ring-layout"><div class="situation-ring" style="background:conic-gradient(${stops})"><div><strong>${center}</strong><span>${label}</span></div></div><div class="situation-ring-legend">${rows.map(([name,value,color])=>`<div><i style="background:${color}"></i><span>${name}</span><strong>${value.toFixed(1)}<small>万人</small></strong><b>${formatPct(value/Math.max(.0001,sum)*100)}</b></div>`).join('')}</div></div>`}
  const cards=[['重点慢病人数',total.toFixed(1),'万人'],['慢病专档数',(p.managedHigh+p.managedDiabetes+p.managedCopd).toFixed(1),'万份'],['共病患者数',comorbid.toFixed(1),'万人'],['共病患者占比',(comorbid/Math.max(.0001,total)*100).toFixed(1),'%'],['高风险患者数',risk.high.toFixed(1),'万人'],['并发症发病率','25.97','%']];
  const kpis=document.createElement('div');kpis.className='board-kpis situation-kpis';kpis.innerHTML=cards.map(([label,value,unit])=>`<div class="board-kpi"><strong>${value}<em class="board-kpi-unit">${unit}</em></strong><span>${label}</span></div>`).join('');board.querySelector('.board-columns').before(kpis);board.classList.remove('board-no-kpis');
  const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
  left.children[0].innerHTML=`<h2>重点慢病患者分布</h2>${ring(groups,total.toFixed(1),'重点慢病人数（万人）')}`;
  left.children[1].innerHTML=`<h2>慢病专档情况</h2><div class="situation-filing-cards">${[['高血压',p.managedHigh,'✚'],['糖尿病',p.managedDiabetes,'✦'],['慢阻肺',p.managedCopd,'✚']].map(([name,value,icon])=>`<div><div class="filing-icon">${icon}</div><strong>${value.toFixed(1)}<small>万份</small></strong><span>${name}</span></div>`).join('')}</div>`;
  const riskRows=[['高风险',risk.high,'#ef8065'],['中风险',risk.middle,'#f4c767'],['低风险',risk.low,'#43cba5']];
  right.children[0].innerHTML=`<h2>风险分布</h2>${ring(riskRows,p.managed.toFixed(1),'专档患者（万人）')}<p class="situation-risk-note">最近3次血压、糖化、血脂：任一项≥2次不达标为高风险；否则任一项1次不达标为中风险；全部达标为低风险。</p>`;
  right.querySelector('.situation-complication-head svg')?.remove();
  [...right.children].forEach(panel=>{const title=panel.querySelector('h2');if(title?.textContent.includes('服务流动与就诊态势'))title.textContent='就诊流向';if(title?.textContent.includes('失管患者情况'))panel.remove()});
  board.querySelector('.situation-bottom')?.remove();board.querySelector('.board-ticker')?.remove();
  return root.innerHTML;
};
pages.dashboard=dashboard;
const dashboardBeforeRequestedAdjustments=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeRequestedAdjustments();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.construction-line,.outcome-trend').forEach(svg=>svg.setAttribute('preserveAspectRatio','xMidYMid meet'));
  if(homeView()){
    const service=board.querySelector('.home-service-chart')?.closest('.board-panel');
    service?.querySelector('.home-service-summary')?.remove();
    service?.insertAdjacentHTML('beforeend','<p class="service-growth-formula">增长率 = 本期服务人次 ÷ 上期服务人次 − 1</p>');
    board.querySelector('.coverage-total')?.remove();
    const ring=board.querySelector('.home-coverage-ring>div');
    if(ring){const metrics=clinicMetrics(currentNode());ring.insertAdjacentHTML('beforeend',`<small>已建设 ${metrics.built} / ${metrics.eligible} 家</small>`)}
    board.querySelectorAll('.funnel-ratio strong').forEach(el=>{el.innerHTML=el.textContent.replace('%','<small>%</small>')});
  }
  if(situationActive()){
    const cards=board.querySelectorAll('.situation-kpis .board-kpi');
    cards[2]?.insertAdjacentHTML('beforeend','<small>同时患有两种或三种重点慢病</small>');
    cards[3]?.insertAdjacentHTML('beforeend','<small>共病患者数 ÷ 重点慢病人数</small>');
  }
  if((state.dashboardView||'home')==='construction'){
    const node=currentNode(),metrics=clinicMetrics(node),base=node||cities[0],left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
    const count=homeTierCounts(node),counts=[...count,Math.max(0,metrics.eligible-metrics.built)],names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#37baf2','#4ed5bc','#f2bd65','#536b88'];
    let offset=0;const stops=counts.map((value,i)=>{const start=offset;offset+=value/Math.max(1,metrics.eligible)*100;return `${colors[i]} ${start}% ${offset}%`}).join(',');
    left.children[0].innerHTML=`<h2>一体化门诊覆盖情况</h2><div class="home-coverage-layout"><div class="home-coverage-ring" style="background:conic-gradient(${stops})"><div><strong>${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%</strong><span>覆盖率</span></div></div><div class="home-coverage-legend">${counts.map((value,i)=>`<div><i style="background:${colors[i]}"></i><span>${names[i]}</span><strong>${value} <small>家</small></strong></div>`).join('')}</div></div>`;
    left.children[0].querySelector('.home-coverage-ring>div').insertAdjacentHTML('beforeend',`<small>已建设 ${metrics.built} / ${metrics.eligible} 家</small>`);
    left.children[1].remove();
    const annualVisits=visitsForSelection().primary*.6*10000,weights=Array.from({length:12},(_,i)=>990+i*46+Math.sin(i*.8)*80),weightSum=weights.reduce((a,b)=>a+b,0);
    const annualized=weights.map(value=>annualVisits*12*value/weightSum);
    left.children[1].innerHTML=`<h2>一体化门诊服务人次</h2><div class="home-service-summary"><strong>${Math.round(annualVisits/12).toLocaleString()}</strong><span>月均服务人次</span></div>${constructionBarChart(annualized)}`;
    const frequencyData=boardTimeAxis([2.2,2.3,2.4,2.4,2.5,2.5,2.6,2.6,2.7,2.7,2.8,2.9]),fx=i=>43+i*289/Math.max(1,frequencyData.values.length-1),fy=v=>136-v/4*124;
    const frequency=constructionPanel('人均就诊频率',`<div class="construction-key">单位：次 / 人</div><svg class="construction-line" viewBox="0 0 360 166" role="img" aria-label="人均就诊频率趋势，单位次每人"><g class="construction-grid">${[0,1,2,3,4].map(v=>`<line x1="43" x2="332" y1="${fy(v)}" y2="${fy(v)}"/><text x="38" y="${fy(v)+3}" text-anchor="end">${v}</text>`).join('')}</g><polyline points="${frequencyData.values.map((v,i)=>`${fx(i)},${fy(v)}`).join(' ')}" fill="none" stroke="#46c7f0" stroke-width="2.5"/>${frequencyData.values.map((v,i)=>`<circle cx="${fx(i)}" cy="${fy(v)}" r="4" fill="#46c7f0"><title>${frequencyData.labels[i]} ${v.toFixed(1)} 次/人</title></circle><text class="construction-month" x="${fx(i)}" y="161" text-anchor="middle">${frequencyData.labels[i]}</text>`).join('')}</svg>`);
    left.insertAdjacentHTML('beforeend',frequency);
    [...right.children].slice(2).forEach(panel=>panel.remove());
    board.querySelector('.situation-bottom')?.remove();board.querySelector('.board-ticker')?.remove();
    const cards=[['一体化门诊总数',metrics.built,'家'],['一体化门诊服务人次',(visitsForSelection().primary*.6).toFixed(1),'万人次'],['医防融合入径率',formatPct(dashboardRate(node,'entry')),''],['诊间随访率',formatPct(Math.max(0,base.follow-50)),''],['健康监测率',formatPct(constructionValue(node,'monitoring')),'']];
    const kpis=document.createElement('div');kpis.className='board-kpis construction-kpis';kpis.innerHTML=cards.map(([label,value,unit])=>`<div class="board-kpi"><strong>${value}<em class="board-kpi-unit">${unit}</em></strong><span>${label}</span></div>`).join('');board.querySelector('.board-columns').before(kpis);board.classList.remove('board-no-kpis');
    [...kpis.querySelectorAll('strong')].forEach(el=>{if(el.firstChild?.nodeType===3 && el.firstChild.textContent.endsWith('%')){el.firstChild.textContent=el.firstChild.textContent.slice(0,-1);el.querySelector('em').textContent='%'}});
    kpis.children[2].insertAdjacentHTML('beforeend','<small>入径患者数 ÷ 专档患者数</small>');
    right.children[0].querySelector('.construction-headline,.construction-stat,.construction-summary,.construction-big')?.remove();
    const entryPanel=right.children[0];
    [...entryPanel.children].forEach(el=>{if(el!==entryPanel.querySelector('h2') && !el.matches('svg,.construction-key') && !el.querySelector('svg'))el.remove()});
    board.querySelectorAll('.construction-line').forEach(svg=>svg.setAttribute('preserveAspectRatio','none'));
  }
  if(state.dashboardView==='outcomes'){
    const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child');
    const metrics=[['血压','Bp',88,67,56],['血糖','Glucose',82,62,52],['糖化血红蛋白','Hba1c',68,55,47],['血脂','Lipid',59,53,44]];
    left.innerHTML=metrics.map(([name,key,detection,control])=>`<section class="board-panel outcome-metric-panel"><h2>${name}检测情况 <button type="button" class="home-map-link" data-outcome-map-link="outcome${key}Target">⌖ 联动地图</button></h2><div class="outcome-metric-values"><div><span>检测率</span><strong>${detection.toFixed(1)}<small>%</small></strong></div><div><span>控制率</span><strong>${control.toFixed(1)}<small>%</small></strong></div></div></section>`).join('');
    const columns=board.querySelector('.board-columns'),map=columns.querySelector('.board-map');
    const comparison=document.createElement('div');comparison.className='outcome-comparison';
    const chartMetrics=[['血压','Bp',[88.6,92.3,95.7],[62.4,68.9,74.5]],['血糖','Glucose',[82.4,89.1,93.6],[48.7,55.3,62.1]],['血脂','Lipid',[76.8,84.5,90.2],[41.2,47.6,54.3]],['糖化血红蛋白','Hba1c',[65.3,74.8,83.4],[36.5,42.6,49.6]]];
    const groups=['确诊人群','专档人群','一体化管理专档人群'];
    const chart=(type)=>`<svg class="outcome-bar-chart" viewBox="0 0 600 300" preserveAspectRatio="none" role="img" aria-label="三类人群四项${type===2?'检测率':'控制率'}对比">${[0,20,40,60,80,100].map(v=>`<line x1="40" x2="590" y1="${255-v*2}" y2="${255-v*2}"/><text x="33" y="${259-v*2}" text-anchor="end">${v}</text>`).join('')}${chartMetrics.map(([name,key,...values],i)=>{const vals=values[type-2],x=51+i*137;return `${vals.map((v,j)=>`<rect class="bar-${j}" x="${x+j*36}" y="${255-v*2}" width="24" height="${v*2}" rx="2"><title>${groups[j]} ${name} ${v}%</title></rect><text class="bar-value" x="${x+j*36+12}" y="${248-v*2}" text-anchor="middle">${v}</text>`).join('')}<text class="bar-label" x="${x+48}" y="280" text-anchor="middle">${name}</text>`}).join('')}</svg>`;
    comparison.innerHTML=[['检测率',2],['控制率',3]].map(([label,type])=>`<section class="outcome-comparison-row"><h2>三类人群四项${label} <small>模拟数据</small></h2><div class="outcome-chart-legend">${groups.map((group,i)=>`<span><i class="bar-${i}"></i>${group}</span>`).join('')}</div>${chart(type)}</section>`).join('');
    const middle=document.createElement('div');middle.className='outcome-center';
    const tabs=document.createElement('div');tabs.className='outcome-map-tabs';tabs.innerHTML=chartMetrics.map(([name,key])=>`<button type="button" data-outcome-map-link="outcome${key}Target">${name}</button>`).join('');
    map.querySelector('.panel-head')?.after(tabs);
    const rank=document.createElement('button');rank.type='button';rank.className='outcome-notice';const selectedIndex=Math.max(0,chartMetrics.findIndex(([,key])=>state.mapMetric===`outcome${key}Target`));const baseRate=chartMetrics[selectedIndex][3][2],rankOffsets=[[3.9,2.5,1.8,-5.9,-5.2,-3.6],[3.9,2.3,1.3,-5.9,-4.7,-3.3],[3.5,2.3,1.2,-5.9,-4.7,-3.1],[3.3,2,1,-5.1,-4.3,-2.6]][selectedIndex];const metricName=chartMetrics[selectedIndex][0];const notices=['丽水','衢州','舟山'].map((name,i)=>`${name}市${metricName}控制率 ${(baseRate+rankOffsets[i+3]).toFixed(1)}%，低于省级参考值 ${Math.abs(rankOffsets[i+3]).toFixed(1)} 个百分点，建议关注薄弱环节。`);rank.dataset.items=JSON.stringify(notices);rank.innerHTML=`<span>成效总结</span><strong>${esc(notices[0])}</strong>`;map.querySelector('.map-panel')?.append(rank);middle.append(map);
    const risk=document.createElement('div');risk.className='outcome-risk';
    const riskChart=(title,rows)=>`<section class="outcome-detail-panel"><h2>高风险人群 · ${title}</h2><div class="risk-legend"><span>■ 确诊患者</span><span>■ 专档患者</span><span>■ 一体化管理患者</span></div><div class="risk-bars">${rows.map(([name,a,b])=>{const middle=((a+b)/2).toFixed(1);return `<div class="risk-bar-row"><span>${name}</span><div><div class="risk-bar-line"><i style="width:${a}%"></i><b>${a}%</b></div><div class="risk-bar-line recorded"><i style="width:${middle}%"></i><b>${middle}%</b></div><div class="risk-bar-line integrated"><i style="width:${b}%"></i><b>${b}%</b></div></div></div>`}).join('')}</div></section>`;
    risk.innerHTML=riskChart('检测率',[['血压',74.5,88.2],['血糖',59.3,79.6],['血脂',47.8,71.4],['糖化血红蛋白',35.2,58.3]])+riskChart('控制率',[['血压',48.6,62.3],['血糖',33.1,47.8],['血脂',24.5,35.6],['糖化血红蛋白',27.8,40.2]]);
    const bottom=document.createElement('div');bottom.className='outcome-regions';const cities=['杭州','宁波','湖州','嘉兴','温州','绍兴','台州','金华','舟山','衢州','丽水'];
    const deviations=[[3.9,2.5,1.8,.9,.7,.1,-1.3,-2.5,-3.6,-5.2,-5.9],[3.9,2.3,1.3,.6,.4,-.3,-.9,-2.1,-3.3,-4.7,-5.9],[3.5,2.3,1.2,.5,.3,-.4,-1.1,-1.5,-3.1,-4.7,-5.9],[3.3,2,1,.7,.2,-.1,-.8,-1.7,-2.6,-4.3,-5.1]];
    const improvementRates=[53.0,49.0,41.0,44.0];
    const improvementOffsets=[[2.8,1.6,1.1,.5,.3,-.2,-.8,-1.4,-2.5,-3.6,-4.8],[3.1,1.9,1.2,.7,.1,-.4,-1.0,-1.8,-2.7,-3.8,-4.6],[2.6,1.8,1.0,.6,.2,-.3,-.9,-1.7,-2.4,-3.5,-4.2],[2.4,1.7,1.1,.5,.1,-.2,-.7,-1.5,-2.3,-3.3,-4.1]];
    bottom.innerHTML=['control','improvement'].map(mode=>{const i=Number(state.outcomeRankMetric?.[mode]||0),[name,,,control]=chartMetrics[i],base=mode==='control'?control[2]:improvementRates[i],offsets=mode==='control'?deviations[i]:improvementOffsets[i];const rows=cities.map((city,j)=>({city,delta:offsets[j]})).sort((a,b)=>b.delta-a.delta),maxDelta=Math.max(...rows.map(row=>Math.abs(row.delta)));return `<section class="outcome-detail-panel" data-control-base="${control[2]}"><h2><span class="outcome-region-title">各地市${mode==='control'?'控制率':'改善率'}排序</span><span class="outcome-region-tabs" role="group" aria-label="选择指标">${chartMetrics.map(([label],index)=>`<button type="button" data-rank-mode="${mode}" data-rank-metric="${index}" aria-pressed="${i===index}">${label}</button>`).join('')}</span></h2><div class="outcome-region-benchmark">${name} · 省平均 ${base.toFixed(1)}% <span>偏差（百分点）</span></div><div class="outcome-rank-chart auto-scroll" role="img" aria-label="各地市与省平均的差距"><div class="scroll-track">${[...rows,...rows].map(row=>`<div class="outcome-rank-chart-row" title="${row.city} ${(base+row.delta).toFixed(1)}%，较省平均 ${row.delta>=0?'+':''}${row.delta.toFixed(1)} 个百分点"><span>${row.city}</span><div class="outcome-rank-track"><i class="${row.delta>=0?'positive':'negative'}" style="width:${Math.abs(row.delta)/maxDelta*48}%"></i></div><strong>${(base+row.delta).toFixed(1)}%</strong></div>`).join('')}</div></div></section>`}).join('');
    columns.replaceChildren(comparison,middle,risk,bottom);columns.classList.add('outcome-layout');
    board.querySelector('.situation-bottom')?.remove();
    board.querySelector('.home-control-tabs')?.remove();
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
const dashboardBeforeDetailRevision=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeDetailRevision();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelector('.situation-complication-head')?.remove();
  board.querySelectorAll('.situation-complication-list>div').forEach(row=>{
    row.dataset.boardTip=`${row.querySelector('span').textContent}｜${row.querySelector('strong').textContent}`;
  });
  if(situationActive()){
    const p=populationData();
    board.querySelectorAll('.situation-filing-cards>div').forEach((card,i)=>{const value=[p.managedHigh,p.managedDiabetes,p.managedCopd][i],denominator=p.managedHigh+p.managedDiabetes+p.managedCopd;card.insertAdjacentHTML('beforeend',`<small class="filing-percentage">${formatPct(value/Math.max(.0001,denominator)*100)} <span>占慢病专档数</span></small>`)});
    const riskPanel=[...board.querySelectorAll('.situation-panel')].find(panel=>panel.querySelector('h2')?.textContent==='风险分布'),riskCenter=riskPanel?.querySelector('.situation-ring>div'),riskRow=riskPanel?.querySelector('.situation-ring-legend>div');
    if(riskCenter&&riskRow){riskCenter.querySelector('strong').innerHTML=riskRow.querySelector('b').textContent.replace('%','<small>%</small>');riskCenter.querySelector('span').textContent='高风险占比';riskRow.classList.add('ring-active')}
  }
  board.querySelectorAll('.home-coverage-layout').forEach(layout=>{
    const metrics=clinicMetrics(currentNode()),center=layout.querySelector('.home-coverage-ring>div');
    if(!center)return;
    const value=center.querySelector('strong');value.innerHTML=value.textContent.replace('%','<small>%</small>');
    const note=center.querySelector(':scope>small');if(note)note.remove();
    layout.insertAdjacentHTML('beforeend',`<p class="coverage-formula">覆盖率 = 已建成 ÷ 基层机构总数：${metrics.built} ÷ ${metrics.eligible}</p>`);
    layout.querySelectorAll('.home-coverage-legend>div').forEach(row=>{const count=parseFloat(row.querySelector('strong')?.textContent);if(Number.isFinite(count))row.insertAdjacentHTML('beforeend',`<b>${formatPct(count/Math.max(1,metrics.eligible)*100)}</b>`)});
  });
  board.querySelectorAll('.funnel-shape strong,.funnel-ratio strong,.board-kpi strong,.situation-ring-legend strong,.situation-ring-legend b,.situation-filing-cards strong,.filing-percentage,.construction-coverage-legend strong,.home-coverage-legend strong,.home-coverage-legend b,.home-coverage-ring strong,.situation-ring strong,.situation-complication-list strong,.outcome-rings b,.outcome-metric-values strong,.construction-nodes strong,.construction-total strong,.construction-node-head strong,.home-service-summary strong,.outcome-trend circle,.construction-line circle,.home-service-chart circle,.home-service-chart .service-bar-value').forEach(el=>{el.classList.add('metric-detail-trigger');el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${el.textContent.trim()||el.querySelector('title')?.textContent||'指标'}，点击查看区域明细`);el.setAttribute('title',`${el.textContent.trim()}，点击查看区域明细`)});
  return root.innerHTML;
};
pages.dashboard=dashboard;

const dashboardBeforeChartPolish=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeChartPolish();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(state.dashboardView==='outcomes')board.querySelector('.board-map .board-ticker')?.remove();
  board.querySelectorAll('.situation-ring-layout,.home-coverage-layout').forEach(layout=>{
    const ring=layout.querySelector('.situation-ring,.home-coverage-ring');
    const rows=[...layout.querySelectorAll('.situation-ring-legend>div,.home-coverage-legend>div')].filter(row=>row.querySelector('b'));
    if(!ring||!rows.length)return;
    ring.dataset.boardTip=rows.map(row=>row.textContent.replace(/\s+/g,' ').trim()).join('\n');
    rows.forEach(row=>row.dataset.boardTip=row.textContent.replace(/\s+/g,' ').trim());
  });
  board.querySelectorAll('svg.construction-line:not(.construction-bar-chart),svg.outcome-trend,svg.home-service-chart,svg.home-rate-chart').forEach(svg=>{
    if(!svg.querySelector('polyline'))return;
    svg.querySelectorAll('circle').forEach(circle=>{
      if(circle.nextElementSibling?.classList.contains('service-bar-value'))return;
      const title=circle.querySelector('title')?.textContent||circle.parentElement?.querySelectorAll('[data-board-tip]')[Array.from(circle.parentElement.querySelectorAll('circle')).indexOf(circle)]?.dataset.boardTip||'';
      const value=title.match(/(-?\d[\d,.]*(?:%|\s*次\/人|\s*人次))\s*$/)?.[1];
      if(!value)return;
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('class','chart-point-value');label.setAttribute('x',circle.getAttribute('cx'));label.setAttribute('y',Number(circle.getAttribute('cy'))-8);label.setAttribute('text-anchor','middle');label.textContent=value;
      circle.parentNode.insertBefore(label,circle.nextSibling);
    });
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  });
  if(state.dashboardView==='construction'){
    board.querySelectorAll('.construction-line:not(.construction-bar-chart)').forEach(svg=>{
      svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      const circles=[...svg.querySelectorAll('circle')];
      if(circles.length<2)return;
      const xs=circles.map(circle=>Number(circle.getAttribute('cx'))),min=Math.min(...xs),max=Math.max(...xs);
      if(max<=min)return;
      const move=x=>65+(x-min)*230/(max-min);
      svg.querySelectorAll('polyline').forEach(line=>line.setAttribute('points',line.getAttribute('points').trim().split(/\s+/).map(pair=>{const [x,y]=pair.split(',');return `${move(Number(x))},${y}`}).join(' ')));
      svg.querySelectorAll('circle,.construction-month,.chart-point-value').forEach(el=>{const attr=el.tagName.toLowerCase()==='circle'?'cx':'x',x=Number(el.getAttribute(attr));if(Number.isFinite(x))el.setAttribute(attr,move(x));if(el.classList.contains('chart-point-value'))el.textContent=el.textContent.replace(/\s*(?:次\/人|%|人次)\s*$/,'')});
    });
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;

// Resolve the segment under the pointer instead of showing the entire legend.
document.addEventListener('pointermove',event=>{
  const ring=event.target.closest('.situation-ring,.home-coverage-ring');
  if(!ring)return;
  const rows=[...ring.parentElement.querySelectorAll('.situation-ring-legend>div,.home-coverage-legend>div')].filter(row=>row.querySelector('b'));
  const rect=ring.getBoundingClientRect(),x=event.clientX-(rect.left+rect.width/2),y=event.clientY-(rect.top+rect.height/2);
  let angle=(Math.atan2(x,-y)*180/Math.PI+360)%360, cumulative=0;
  const row=rows.find(item=>{cumulative+=(parseFloat(item.querySelector('b')?.textContent)||0)*3.6;return angle<cumulative});
  ring.dataset.boardTip=row?row.textContent.replace(/\s+/g,' ').trim():rows.map(item=>item.textContent.replace(/\s+/g,' ').trim()).join('\n');
},true);

function residentForNode(node){if(!node)return window.RESIDENT_POPULATION.province;const data=window.RESIDENT_POPULATION;if(node.cityName)return data.counties[`${node.cityName}/${node.name}`]||null;return data.cities[node.name]||null}
function showMetricDetail(el){
  const panel=el.closest('.board-panel,.board-kpi'),label=el.closest('.outcome-ring-item')?.querySelector('span')?.textContent||el.closest('.funnel-row')?.querySelector('.funnel-shape span')?.textContent||el.closest('.situation-ring-legend>div')?.querySelector('span')?.textContent||el.closest('.situation-filing-cards>div')?.querySelector('span')?.textContent||panel?.querySelector('h2,span')?.textContent||'指标';
  const text=(el.querySelector('title')?.textContent||el.textContent).trim().replace(/\s+/g,''),match=text.replace(/,/g,'').match(/-?\d+(?:\.\d+)?(?=\s*(?:%|万|家|次|人)|$)/),num=match?Number(match[0]):NaN;if(!Number.isFinite(num))return;
  const unit=text.includes('%')?'%':text.includes('万份')?'万份':text.includes('万人')?'万人':text.includes('万次')?'万次':text.includes('家')?'家':'';
  const dialog=document.createElement('dialog');dialog.className='metric-detail-dialog';document.body.append(dialog);
  let path=[],items=cities;const isResident=label==='常住人口';
  function draw(){
    const weightOf=item=>item.members?item.members.reduce((sum,x)=>sum+(populationFor(x).diagnosed||0),0):Math.max(0,populationFor(item).diagnosed||0),total=items.reduce((sum,item)=>sum+weightOf(item),0)||1,base=path.length?path[path.length-1].value:num;
    dialog.innerHTML=`<header><h2>${esc(label)} · 区域明细</h2><button type="button" data-detail-close aria-label="关闭">×</button></header><nav><button type="button" data-detail-back="-1">浙江省</button>${path.map((x,i)=>`<span> / </span><button type="button" data-detail-back="${i}">${esc(x.name)}</button>`).join('')}</nav><div class="metric-detail-table"><div class="metric-detail-row metric-detail-heading"><span>地区 / 机构</span><span>对应数值</span></div>${items.map((item,i)=>{let record=null;if(isResident){if(cities.includes(item))record=window.RESIDENT_POPULATION.cities[item.name];else if(counties.includes(item))record=window.RESIDENT_POPULATION.counties[`${path[0]?.name}/${item.name}`];else if(item.members)record=window.RESIDENT_POPULATION.towns[`${path[0]?.name}/${path[1]?.name}/${item.name}`]}const value=unit==='%'?num:base*weightOf(item)/total;const display=isResident?(record?`${record[0]} ${item.members?'人':'万人'}（${record[1]}）`:'待接入'):`${value.toFixed(unit==='家'?0:1)} ${unit}`;return `<button class="metric-detail-row" type="button" data-detail-index="${i}" data-detail-value="${value}"><span>${esc(item.name)}</span><strong>${esc(display)}</strong></button>`}).join('')}</div>`;
  }
  dialog.addEventListener('click',event=>{if(event.target.closest('[data-detail-close]'))return dialog.close();const back=event.target.closest('[data-detail-back]');if(back){const index=Number(back.dataset.detailBack);path=path.slice(0,index+1);items=path.length?path[path.length-1].children:cities;draw();return}const row=event.target.closest('[data-detail-index]');if(!row)return;const item=items[Number(row.dataset.detailIndex)];let children=[];if(cities.includes(item))children=counties.filter(x=>x.cityName===item.name);else if(counties.includes(item)){const groups=new Map();clinics.filter(x=>x.adcode===item.adcode).forEach(x=>{const name=x.name.match(/^.*?(?:街道|镇|乡)/)?.[0]||'街道待确认';if(!groups.has(name))groups.set(name,[]);groups.get(name).push(x)});if(isResident){const prefix=`${path[0]?.name}/${item.name}/`;Object.keys(window.RESIDENT_POPULATION.towns).filter(key=>key.startsWith(prefix)).forEach(key=>{const name=key.slice(prefix.length);if(!groups.has(name))groups.set(name,[])})}children=[...groups].map(([name,members])=>({name,members}))}else if(item.members)children=item.members;if(children.length){path.push({name:item.name,children,value:Number(row.dataset.detailValue)});items=children;draw()}});
  dialog.addEventListener('close',()=>dialog.remove());draw();dialog.showModal();
}
document.addEventListener('click',event=>{const el=event.target.closest('.metric-detail-trigger');if(el){event.stopPropagation();showMetricDetail(el)}});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('.metric-detail-trigger')){event.preventDefault();showMetricDetail(event.target)}});

let detailRingTick=0;
setInterval(()=>{
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  document.querySelectorAll('.situation-complication-list').forEach(list=>{
    if(list.matches(':hover,:focus-within')||list.scrollHeight<=list.clientHeight)return;
    const halfway=list.scrollHeight/2;
    list.scrollTop=list.scrollTop+1>=halfway?0:list.scrollTop+1;
  });
},60);
setInterval(()=>{if(document.querySelector('.metric-detail-dialog[open]'))return;detailRingTick++;document.querySelectorAll('.situation-ring-layout,.home-coverage-layout').forEach(layout=>{const rows=[...layout.querySelectorAll('.situation-ring-legend>div,.home-coverage-legend>div')].filter(row=>row.querySelector('b'));const ring=layout.querySelector('.situation-ring,.home-coverage-ring');if(!rows.length||!ring)return;const risk=layout.closest('.board-panel')?.querySelector('h2')?.textContent.includes('风险分布');const index=risk?(detailRingTick-1)%rows.length:(detailRingTick-1)%(rows.length+1)-1;rows.forEach((row,i)=>row.classList.toggle('ring-active',i===index));const center=ring.querySelector(':scope>div'),strong=center?.querySelector('strong'),label=center?.querySelector('span');if(!center||!strong||!label)return;if(!center.dataset.defaultValue){center.dataset.defaultValue=strong.innerHTML;center.dataset.defaultLabel=label.textContent}ring.classList.toggle('segment-selected',index>=0);if(index<0){strong.innerHTML=center.dataset.defaultValue;label.textContent=center.dataset.defaultLabel}else{const row=rows[index],percent=row.querySelector('b')?.textContent;strong.innerHTML=percent?percent.replace('%','<small>%</small>'):row.querySelector('strong')?.innerHTML||'';label.textContent=(row.querySelector('span')?.textContent||'')+(risk?'占比':'');const start=rows.slice(0,index).reduce((sum,item)=>sum+(parseFloat(item.querySelector('b')?.textContent)||0),0),end=start+(parseFloat(percent)||0),color=row.querySelector('i')?.style.backgroundColor||'#46c7f0';ring.style.setProperty('--segment-start',`${start}%`);ring.style.setProperty('--segment-end',`${end}%`);ring.style.setProperty('--segment-color',color)}})},4000);
const dashboardBeforeHomeLayout=dashboard;
dashboard=function(){
  const html=dashboardBeforeHomeLayout();
  if(!homeView())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),columns=board?.querySelector('.board-columns');
  const filingCard=board?.querySelectorAll('.board-kpi')[2];
  if(filingCard){const riskCard=document.createElement('div');riskCard.className='board-kpi home-risk-count';riskCard.title='专档患者中具备血压、血糖、血脂和糖化血红蛋白数据的人数。风险评估：最近3次血压、糖化、血脂任一项≥2次不达标为高风险；否则任一项1次不达标为中风险；全部达标为低风险。';riskCard.innerHTML='<span>风险分层人数</span><strong>330.0<em class="board-kpi-unit">万人</em></strong><small>可评估风险的专档患者去重人数</small>';filingCard.after(riskCard)}
  board?.querySelectorAll('.board-kpi:not(.home-risk-count)').forEach(card=>{const note=card.querySelector('small')?.textContent;if(note)card.title=note});
  const left=columns?.querySelector('.board-stack:first-child'),panels=left?[...left.children]:[];
  const control=columns?.querySelector('.outcome-rings')?.closest('.board-panel');
  if(panels.length===3){
    const combined=document.createElement('section');combined.className='board-panel home-disease-panel home-disease-combined';
    combined.innerHTML='<h2>三病患者底数 <span class="scope-tag" tabindex="0" data-scope-tip="全：三病去重后的全部重点慢病患者">全</span></h2><div class="home-disease-groups"></div><p class="home-disease-summary"></p>';
    const groups=combined.querySelector('.home-disease-groups');
    panels.forEach(panel=>{const group=document.createElement('div');group.className='home-disease-group';group.innerHTML=panel.innerHTML;group.querySelector('h2').textContent=group.querySelector('h2').textContent.replace('患者情况','');group.querySelectorAll('.funnel-row').forEach((row,i)=>{const ratio=row.querySelector('.funnel-ratio');if(i>0&&ratio){ratio.classList.add('step-transition');const label=ratio.querySelector('span');if(label)label.textContent=i===1?'建档率':'高风险占比'}});groups.append(group)});
    const sum=[...groups.querySelectorAll('.funnel-row:last-child .funnel-shape strong')].reduce((n,el)=>n+(parseFloat(el.textContent)||0),0);
    combined.querySelector('.home-disease-summary').textContent=`高风险合计 ${sum.toFixed(1)} 万人，去重后 ${homeRisk(currentNode()).high.toFixed(1)} 万人`;
    left.replaceChildren(combined);
  }
  if(control){
    control.classList.add('home-control-strip');
    const heading=control.querySelector('h2');heading.insertAdjacentHTML('afterbegin','核心指标控制率 × 目标差距 <span class="scope-tag" tabindex="0" data-scope-tip="一体化：通过一体化门诊进行管理的专档患者。">一体化</span>');
    [...heading.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.includes('核心指标控制率')&&!node.textContent.includes('目标差距')).forEach(node=>node.remove());
    const rings=control.querySelector('.outcome-rings'),targets=[70,65,55,60];
    rings.classList.add('home-target-bars');
    [...rings.children].forEach((item,i)=>{const value=item.querySelector('b'),label=item.querySelector('span')?.textContent||'',number=parseFloat(value?.textContent)||0,target=targets[i],difference=number-target;item.className='home-target-item';item.innerHTML=`<div class="home-target-label"><span>${esc(label)}控制率</span><small>差距 ${difference>=0?'+':'−'}${Math.abs(difference).toFixed(1)} 个百分点</small></div><div class="home-target-chart"><div class="home-target-track"><div class="home-target-goal" style="width:${target}%"></div><i style="width:${Math.max(0,Math.min(100,number))}%"></i></div><span class="home-target-goal-label">目标 ${target}%</span></div>`;item.querySelector('.home-target-track i').append(value)});
    board.append(control);
  }
  const ticker=board.querySelector('.board-ticker');if(ticker){ticker.setAttribute('role','button');ticker.setAttribute('tabindex','0');ticker.setAttribute('aria-label','查看预警总结')}
  return root.innerHTML;
};
pages.dashboard=dashboard;
function showHomeSummary(){
  const board=document.querySelector('#dashboardBoard'),ticker=board?.querySelector('.board-ticker');if(!ticker)return;
  const metrics=clinicMetrics(null), provinceCoverage=metrics.built/Math.max(1,metrics.eligible)*100;
  const provinceRisk=cities.reduce((n,city)=>n+homeRisk(city).high,0)/Math.max(1,cities.reduce((n,city)=>n+populationFor(city).managed,0))*100;
  const comparison=(title,key,benchmark,lowerIsBetter=false)=>{
    const rows=cities.map(city=>({name:city.name,value:homeMapValue(city,key)})).sort((a,b)=>b.value-a.value);
    const above=rows.filter(row=>row.value>benchmark+0.005),below=rows.filter(row=>row.value<benchmark-0.005),equal=rows.filter(row=>Math.abs(row.value-benchmark)<=0.005);
    const renderRows=list=>list.length?list.map(row=>`<li><span>${esc(row.name)}</span><strong>${row.value.toFixed(2)}%</strong><small>${row.value>=benchmark?'高于':'低于'} ${Math.abs(row.value-benchmark).toFixed(2)} 个百分点</small></li>`).join(''):'<li>无</li>';
    const best=lowerIsBetter?rows[rows.length-1]:rows[0],worst=lowerIsBetter?rows[0]:rows[rows.length-1];
    const names=value=>rows.filter(row=>Math.abs(row.value-value)<0.000001).map(row=>esc(row.name)).join('、');
    const isAverage=key==='construction'||key==='highRisk';
    const concern=lowerIsBetter?above:below, gap=Math.abs(worst.value-benchmark);
    const direction=worst.value>=benchmark?'高于':'低于';
    const provinceValue=homeMapValue(null,key);
    return `<section><h3>${title}</h3><div class="summary-benchmark">${isAverage?'省平均':'省级值'} <strong>${(isAverage?benchmark:provinceValue).toFixed(2)}%</strong>${isAverage?'':`<span>目标 ${benchmark.toFixed(2)}%</span>`}<span>需关注 <b>${concern.length}</b> 个地市</span></div><p class="summary-action">${concern.length?`重点关注 <strong>${names(worst.value)}</strong>：${worst.value.toFixed(2)}%，${direction}${isAverage?'省平均':'目标'} ${gap.toFixed(2)} 个百分点。${lowerIsBetter?'建议排查高风险人群及管理情况。':'建议分析差距原因，推进薄弱地区改进。'}`:'各地市均已达到参考水平。'}</p><details><summary>查看地市明细（最好：${names(best.value)} ${best.value.toFixed(2)}%）</summary><div class="summary-columns"><div><h4>高于 ${above.length} 个</h4><ul>${renderRows(above)}</ul></div><div><h4>低于 ${below.length} 个</h4><ul>${renderRows(below)}</ul></div>${equal.length?`<div><h4>持平 ${equal.length} 个</h4><ul>${renderRows(equal)}</ul></div>`:''}</div></details></section>`;
  };
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';
  dialog.innerHTML=`<header><h2>浙江省 · 首页数据总结</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body">${comparison('一体化门诊覆盖率','construction',provinceCoverage)}${comparison('高风险患者占比','highRisk',provinceRisk,true)}${[['血压控制率','bloodPressure',70],['血糖控制率','bloodGlucose',65],['血脂控制率','bloodLipids',55],['糖化血红蛋白控制率','hba1cTarget',60]].map(([title,key,target])=>comparison(title,key,target)).join('')}</div>`;
  document.body.append(dialog);dialog.addEventListener('click',event=>{if(event.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
document.addEventListener('click',event=>{if(homeView()&&event.target.closest('#dashboardBoard .board-ticker'))showHomeSummary()});
document.addEventListener('keydown',event=>{if(homeView()&&event.target.closest?.('#dashboardBoard .board-ticker')&&(event.key==='Enter'||event.key===' ')){event.preventDefault();showHomeSummary()}});
setInterval(()=>{const ticker=document.querySelector('#dashboardBoard .outcome-notice');if(!ticker)return;const items=JSON.parse(ticker.dataset.items||'[]');if(!items.length)return;const next=((Number(ticker.dataset.index)||0)+1)%items.length;ticker.dataset.index=next;ticker.querySelector('strong').textContent=items[next]},5000);
document.addEventListener('click',event=>{const ticker=event.target.closest?.('#dashboardBoard .outcome-notice');if(!ticker)return;const index=Math.max(0,['outcomeBpTarget','outcomeGlucoseTarget','outcomeLipidTarget','outcomeHba1cTarget'].indexOf(state.mapMetric));const title=['血压','血糖','血脂','糖化血红蛋白'][index],base=[74.5,62.1,54.3,49.6][index],names=['杭州','宁波','湖州','嘉兴','温州','绍兴','台州','金华','舟山','衢州','丽水'],deltas=[[3.9,2.5,1.8,.9,.7,.1,-1.3,-2.5,-3.6,-5.2,-5.9],[3.9,2.3,1.3,.6,.4,-.3,-.9,-2.1,-3.3,-4.7,-5.9],[3.5,2.3,1.2,.5,.3,-.4,-1.1,-1.5,-3.1,-4.7,-5.9],[3.3,2,1,.7,.2,-.1,-.8,-1.7,-2.6,-4.3,-5.1]][index],rows=names.map((name,i)=>({name,delta:deltas[i]})),below=rows.filter(row=>row.delta<0);const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';dialog.innerHTML=`<header><h2>浙江省 · 成效总结 <small>模拟数据</small></h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body"><section><h3>${esc(title)}</h3><div class="summary-benchmark">省级参考值 <strong>${base.toFixed(1)}%</strong><span>需关注 <b>${below.length}</b> 个地市</span></div><p class="summary-action">${below.length?`重点关注 <strong>${esc(below[below.length-1].name)}</strong>，低于省级参考值 ${Math.abs(below[below.length-1].delta).toFixed(1)} 个百分点。建议分析差距原因，推进薄弱地区改进。`:'各地市均达到省级参考值。'}</p><details><summary>查看地市明细</summary><div class="summary-columns"><div><h4>各地市与省级参考值比较</h4><ul>${rows.map(row=>`<li><span>${esc(row.name)}</span><strong>${(base+row.delta).toFixed(1)}%</strong><small>${row.delta>=0?'高于':'低于'} ${Math.abs(row.delta).toFixed(1)} 个百分点</small></li>`).join('')}</ul></div></div></details></section></div>`;document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal()});
function showScopeTip(tag){
  document.querySelector('.scope-floating-tip')?.remove();
  const tip=document.createElement('div');tip.className='scope-floating-tip';tip.textContent=tag.dataset.scopeTip;(document.fullscreenElement||document.body).append(tip);
  const rect=tag.getBoundingClientRect();tip.style.left=`${Math.max(8,Math.min(rect.left,innerWidth-tip.offsetWidth-8))}px`;tip.style.top=`${Math.min(rect.bottom+7,innerHeight-tip.offsetHeight-8)}px`;
}
document.addEventListener('mouseover',event=>{const tag=event.target.closest('.scope-tag');if(tag&&!tag.contains(event.relatedTarget))showScopeTip(tag)});
document.addEventListener('mouseout',event=>{const tag=event.target.closest('.scope-tag');if(tag&&!tag.contains(event.relatedTarget))document.querySelector('.scope-floating-tip')?.remove()});
document.addEventListener('focusin',event=>{if(event.target.matches('.scope-tag'))showScopeTip(event.target)});
document.addEventListener('focusout',event=>{if(event.target.matches('.scope-tag'))document.querySelector('.scope-floating-tip')?.remove()});
const dashboardBeforeClinicRevision=dashboard;
dashboard=function(){
  const html=dashboardBeforeClinicRevision();
  if(state.dashboardView!=='construction')return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),left=board.querySelector('.board-stack:first-child'),node=currentNode(),metrics=clinicMetrics(node);
  const counts=[...homeTierCounts(node),Math.max(0,metrics.eligible-metrics.built)],names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#40c6e9','#307dd9','#f1a94e','#38536b'];
  left.children[0].innerHTML=`<h2>一体化门诊覆盖情况</h2><div class="clinic-tier-chart"><div class="clinic-tier-bar" role="img" aria-label="覆盖分级结构，基层机构总数 ${metrics.eligible} 家">${counts.map((value,i)=>`<span class="${i===3?'unbuilt':''}" style="width:${value/Math.max(1,metrics.eligible)*100}%;${i===3?'':`background:${colors[i]}`}" title="${names[i]} ${value}家">${value/Math.max(1,metrics.eligible)>0.04?formatPct(value/Math.max(1,metrics.eligible)*100):''}</span>`).join('')}</div><div class="clinic-tier-legend">${counts.map((value,i)=>`<div><i style="background:${colors[i]}"></i><span>${names[i]} <strong>${value}家</strong><small>${i===3?'占全部':'占一体化'} ${formatPct(value/Math.max(1,i===3?metrics.eligible:metrics.built)*100)}</small></span></div>`).join('')}</div><div class="clinic-tier-summary">一体化门诊覆盖 <strong>${formatPct(metrics.built/Math.max(1,metrics.eligible)*100)}</strong> 的基层机构；已建设机构中基本保障类占 <strong>${formatPct(counts[0]/Math.max(1,metrics.built)*100)}</strong>，全部基层机构中仍有 <strong>${formatPct(counts[3]/Math.max(1,metrics.eligible)*100)}</strong> 未建设。</div></div>`;
  const groups=[['确诊',2.0,2.2],['专档',2.3,2.5],['一体化',2.4,2.6]], x=[135,270], y=v=>152-v/4*110, barColors=['#40c6e9','#307dd9','#f1a94e'];
  left.children[1].innerHTML=`<h2>人均就诊频率</h2><div class="clinic-frequency-note">单位：次 / 人 <span>${groups.map(([name],i)=>`<i style="background:${barColors[i]}"></i>${name}`).join(' ')}</span></div><svg class="clinic-frequency" viewBox="0 0 380 185" role="img" aria-label="确诊、专档、一体化人群2025年和2026年人均就诊频率，模拟数据"><g class="construction-grid">${[0,1,2,3,4].map(v=>`<line x1="42" x2="355" y1="${y(v)}" y2="${y(v)}"/><text x="34" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}</g>${x.map((pos,year)=>`${groups.map(([,a,b],i)=>{const v=year?b:a,bx=pos+(i-1)*24;return `<rect x="${bx-9}" y="${y(v)}" width="18" height="${152-y(v)}" fill="${barColors[i]}"/><text x="${bx}" y="${y(v)-5}" text-anchor="middle">${v.toFixed(1)}</text>`}).join('')}<text x="${pos}" y="175" text-anchor="middle">${2025+year}年</text>`).join('')}</svg>`;
  [...left.children].slice(2).forEach(el=>el.remove());
  const kpis=board.querySelector('.construction-kpis'),cards=kpis.querySelectorAll('.board-kpi');
  cards[0].insertAdjacentHTML('afterend',`<div class="board-kpi"><strong>${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}<em class="board-kpi-unit">%</em></strong><span>一体化门诊覆盖率</span><small>覆盖率 = 一体化门诊数 ÷ 基层机构总数</small></div>`);
  cards[3].querySelector('span').textContent='路径节点总执行率';cards[3].querySelector('strong').innerHTML=`${constructionValue(node,'monitoring').toFixed(1)}<em class="board-kpi-unit">%</em>`;cards[4].remove();
  board.querySelector('.construction-node-head')?.remove();
  const points=cities.map(city=>({name:city.name,x:constructionValue(city,'construction'),y:city.control})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  const sx=v=>90+v/100*1490,sy=v=>190-v/100*155;
  const meanX=points.reduce((sum,p)=>sum+p.x,0)/Math.max(1,points.length),meanY=points.reduce((sum,p)=>sum+p.y,0)/Math.max(1,points.length),variance=points.reduce((sum,p)=>sum+(p.x-meanX)**2,0),slope=variance?points.reduce((sum,p)=>sum+(p.x-meanX)*(p.y-meanY),0)/variance:0;
  const xMin=Math.min(...points.map(p=>p.x)),xMax=Math.max(...points.map(p=>p.x)),trendY=x=>Math.max(0,Math.min(100,meanY+slope*(x-meanX)));
  const scatter=document.createElement('section');scatter.className='board-panel clinic-scatter';
  scatter.innerHTML=`<h2>一体化门诊覆盖 × 成效</h2><svg viewBox="0 0 1650 230" preserveAspectRatio="none" role="img" aria-label="各地市一体化门诊覆盖率与血压控制率散点图，模拟数据"><g class="construction-grid">${[0,50,100].map(v=>`<line x1="90" x2="1580" y1="${sy(v)}" y2="${sy(v)}"/><text x="80" y="${sy(v)+4}" text-anchor="end">${v}%</text><text x="${sx(v)}" y="215" text-anchor="middle">${v}%</text>`).join('')}</g><text x="8" y="18">血压控制率</text><text x="1600" y="215">覆盖率</text>${points.length>1?`<line x1="${sx(xMin)}" y1="${sy(trendY(xMin))}" x2="${sx(xMax)}" y2="${sy(trendY(xMax))}" stroke="#f2b235" stroke-width="3" stroke-dasharray="12 9"/>`:''}${points.map(p=>`<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="6" fill="${p.y<trendY(p.x)-3?'#d64b30':'#09baf1'}"><title>${esc(p.name)}：覆盖率 ${p.x.toFixed(1)}%，血压控制率 ${p.y.toFixed(1)}%</title></circle>`).join('')}</svg>`;
  board.append(scatter);
  return root.innerHTML;
};
pages.dashboard=dashboard;
const dashboardBeforeSituationLayoutRevision=dashboard;
dashboard=function(){
  const html=dashboardBeforeSituationLayoutRevision();
  if(!situationActive())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child'),p=populationData();
  const card=board.querySelectorAll('.situation-kpis .board-kpi')[1];
  card.querySelector('span').textContent='专档患者数';card.querySelector('strong').innerHTML=`${p.managed.toFixed(1)}<em class="board-kpi-unit">万人</em>`;
  card.querySelector('strong').setAttribute('aria-label',`${p.managed.toFixed(1)}万人，点击查看区域明细`);card.querySelector('strong').title=`${p.managed.toFixed(1)}万人，点击查看区域明细`;
  const filing=left.querySelector('.situation-filing');filing?.remove();
  const population=[...left.children].find(panel=>panel.querySelector('h2')?.textContent==='专档患者人口构成');
  const disease=state.situationPopulationDisease||'高血压',count=disease==='糖尿病'?p.managedDiabetes:disease==='慢阻肺'?p.managedCopd:p.managedHigh,male=disease==='糖尿病'?.51:.53;
  const persons=value=>`${Math.round(value*10000).toLocaleString()}人`;
  const summary=population?.querySelector('.situation-legend');
  if(summary)summary.innerHTML=`<span>男 ${persons(count*male)}，${(male*100).toFixed(2)}%</span><span>女 ${persons(count*(1-male))}，${((1-male)*100).toFixed(2)}%</span><span>年龄峰值 55–64岁，共 ${persons(count*.27)}，27.00%</span>`;
  population?.querySelector('.situation-pyramid')?.remove();
  const risk=right.children[0];left.append(risk);
  risk.querySelector('.situation-risk-note')?.remove();
  const province=cities.reduce((sum,city)=>sum+homeRisk(city).high,0)/Math.max(.0001,cities.reduce((sum,city)=>sum+populationFor(city).managed,0))*100;
  const rows=cities.map(city=>({name:city.name,delta:homeMapValue(city,'highRisk')-province})).sort((a,b)=>b.delta-a.delta),max=Math.max(1,...rows.map(row=>Math.abs(row.delta)));
  const panel=document.createElement('section');panel.className='board-panel situation-panel situation-risk-ranking';
  panel.innerHTML=`<h2>高风险患者占比偏差榜</h2><div class="risk-ranking-caption">省平均 ${province.toFixed(2)}% <span>偏差（百分点） · 模拟数据</span></div><div class="risk-ranking-rows">${rows.map(row=>`<div class="risk-ranking-row"><span>${esc(row.name)}</span><div class="risk-ranking-track"><i class="${row.delta>=0?'above':'below'}" style="width:${Math.abs(row.delta)/max*45}%"></i></div><strong>${row.delta>=0?'+':''}${row.delta.toFixed(2)}</strong></div>`).join('')}</div>`;
  right.prepend(panel);
  return root.innerHTML;
};
pages.dashboard=dashboard;
const dashboardBeforeHomeComposition=dashboard;
dashboard=function(){
  const html=dashboardBeforeHomeComposition();if(!homeView())return html;
  const root=document.createElement('div');root.innerHTML=html;
  const board=root.querySelector('#dashboardBoard'),node=currentNode(),p=populationData(),risk=homeRisk(node),riskTotal=risk.low+risk.middle+risk.high;
  const left=board.querySelector('.board-stack:first-child'),panel=document.createElement('section');
  const levels=[['低风险',risk.low,'#2E86FF','low'],['中风险',risk.middle,'#FFB020','middle'],['高风险',risk.high,'#FF5A5A','high']],selected=state.homeRiskLevel||'high',selectedName=levels.find(item=>item[3]===selected)[0];
  const rate=risk[selected]/Math.max(.0001,p.managed),diseases=[['高血压',p.managedHigh*rate,'#2E86FF'],['糖尿病',p.managedDiabetes*rate,'#5FA9FF'],['慢阻肺',p.managedCopd*rate,'#8FD0FF']],sum=diseases.reduce((n,item)=>n+item[1],0);
  panel.className='board-panel home-risk-composition';
  panel.innerHTML=`<h2>风险分级与病种构成</h2><div class="home-risk-content"><div class="home-risk-segments">${levels.map(([name,value,color,key])=>`<button type="button" data-home-risk="${key}" aria-pressed="${selected===key}" style="width:${value/Math.max(.0001,riskTotal)*100}%;background:${color}" title="${name} ${value.toFixed(1)} 万人">${(value/Math.max(.0001,riskTotal)*100).toFixed(1)}%</button>`).join('')}</div><div class="home-risk-labels">${levels.map(([name,value,,key])=>`<button type="button" data-home-risk="${key}" aria-pressed="${selected===key}">${name} ${value.toFixed(1)} 万人</button>`).join('')}</div><div class="home-risk-subtitle"><span>${selectedName}患者病种构成</span></div><div class="home-risk-bars">${diseases.map(([name,value,color])=>`<div><span><i style="background:${color}"></i>${name}</span><div><b style="width:${value/Math.max(.0001,sum)*100}%;background:${color}"></b></div><strong>${value.toFixed(1)} 万人 <small>· ${(value/Math.max(.0001,sum)*100).toFixed(1)}%</small></strong></div>`).join('')}</div><small class="home-risk-note">按病种归集，合计${sum.toFixed(1)}万人，去重后${risk[selected].toFixed(1)}万人</small></div>`;
  left.append(panel);
  const capacity=board.querySelector('.board-stack:last-child > .board-panel:first-child'),metrics=clinicMetrics(node),counts=[...homeTierCounts(node),Math.max(0,metrics.eligible-metrics.built)],names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#2E86FF','#4DB8FF','#FFB020','#5A6B85'];
  capacity.innerHTML=`<h2>一体化门诊覆盖率</h2><div class="home-coverage-composition"><div class="coverage-head"><span>一体化门诊覆盖率</span><strong>${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%</strong></div><div class="coverage-segments">${counts.map((count,i)=>`<div class="${i===3?'unbuilt':''}" style="width:${count/Math.max(1,metrics.eligible)*100}%;${i===3?'':`background:${colors[i]}`}" title="${names[i]} ${count} 家，占全部 ${(count/Math.max(1,metrics.eligible)*100).toFixed(1)}%">${(count/Math.max(1,metrics.eligible)*100).toFixed(1)}%</div>`).join('')}</div><div class="coverage-composition-legend">${counts.map((count,i)=>`<div><span><i style="background:${colors[i]}"></i>${names[i]} <strong>${count}</strong> 家</span><small>占${i===3?'全部':'已建成'} ${(count/Math.max(1,i===3?metrics.eligible:metrics.built)*100).toFixed(1)}%</small></div>`).join('')}</div></div>`;
  const control=board.querySelector('.home-control-strip'),right=capacity.parentElement;if(control){right.querySelectorAll(':scope > .board-panel:not(:first-child)').forEach(item=>item.remove());right.append(control)}
  const mapHead=board.querySelector('.board-map .panel-head'),mapModes=board.querySelector('.board-map-modes');if(mapHead&&mapModes)mapHead.append(mapModes);
  return root.innerHTML;
};
pages.dashboard=dashboard;
const homeMapTooltipWithValue=mapTooltip;
mapTooltip=function(node){
  const html=homeMapTooltipWithValue(node);if(!homeView())return html;
  const average=homeMapValue(null),delta=homeMapValue(node)-average;
  return html.replace('<em>',`<div><span>省平均</span><b>${average.toFixed(2)}%</b></div><div><span>与省均差距</span><b>${delta>=0?'+':''}${delta.toFixed(2)} 个百分点</b></div><em>`);
};
// The bundled module exposes mount as a read-only getter; use a mutable facade
// so the dashboard's map adapters can be installed.
if(window.ZhejiangMap3D)window.ZhejiangMap3D={...window.ZhejiangMap3D};
const originalHomeMapMount=window.ZhejiangMap3D?.mount;
let homeMapExtent=1;
function mapHigherIsWorse(){if(state.dashboardView==='construction'||state.dashboardView==='outcomes')return false;return situationActive()||state.mapMetric==='comorbidity'||state.mapMetric==='highRisk'||state.mapMetric==='outcomeLost'||state.mapMetric==='outcomeComplication'}
function benchmarkLegend(){
  const label=document.querySelector('#mapMetricLabel')?.textContent?.trim()||'当前指标';
  const ends=state.dashboardView==='outcomes'?['控制率高','控制率低']:homeView()&&state.mapMetric==='comorbidity'?['共病负担小','共病负担大']:situationActive()?['高风险占比低','高风险占比高']:state.dashboardView==='construction'?['覆盖率高','覆盖率低']:mapHigherIsWorse()?['低于省均','高于省均']:['高于省均','低于省均'];
  const subject=homeView()?'共病负担':label;
  const direction=mapHigherIsWorse()?'越红区域数值越高，越蓝区域数值越低':'越红区域数值越低，越蓝区域数值越高';
  const explanation=homeView()?'当前指标赋色根据较省均偏差，越红区域共病负担越大，越蓝区域共病负担越小。':state.dashboardView==='construction'&&state.mapMetric==='construction'?'越红区域一体化门诊覆盖率越低，越蓝区域一体化门诊覆盖率越高。':`当前指标赋色根据较省均偏差，${direction}（${esc(subject)}）。`;
  return `<div class="benchmark-gradient" aria-hidden="true"></div><div class="benchmark-labels"><span>${ends[0]}</span><span>省均值</span><span>${ends[1]}</span></div><div class="benchmark-unknown"><b></b>未知</div>`;
}
if(originalHomeMapMount)window.ZhejiangMap3D.mount=function(host,geo,values,options){
  if(!homeView())return originalHomeMapMount(host,geo,values,options);
  const average=homeMapValue(null),extent=Math.max(.01,...values.map(item=>Math.abs(item.value-average)).filter(Number.isFinite));
  homeMapExtent=extent;
  const scale=document.querySelector('#mapStage .map-scale.home-benchmark-scale');if(scale)scale.innerHTML=benchmarkLegend(extent);
  return originalHomeMapMount(host,geo,[...values.map(item=>({...item,value:Number.isFinite(item.value)?(item.value-average)*(mapHigherIsWorse()?1:-1):item.value})),{name:'__min__',value:-extent},{name:'__max__',value:extent}],options);
};
const renderMapWithHomeBenchmark=renderProvinceMap;
renderProvinceMap=function(){
  renderMapWithHomeBenchmark();if(!homeView())return;
  if(state.mapView==='2d'&&provinceChart){const values=(provinceChart.getOption().series[0]?.data||[]).map(item=>item.value).filter(Number.isFinite),average=homeMapValue(null);homeMapExtent=Math.max(.01,...values.map(value=>Math.abs(value-average)));}
  const scale=document.querySelector('#mapStage .map-scale');if(scale){scale.classList.add('home-benchmark-scale');scale.innerHTML=benchmarkLegend(homeMapExtent);}
  const title=document.querySelector('#dashboardBoard .board-map .panel-head h2');if(title)title.textContent=`${currentNode()?.name||'浙江省'}${homeMapDefinitions[state.mapMetric]?.[0]||''}`;
  if(state.mapView==='2d'&&provinceChart){const values=(provinceChart.getOption().series[0]?.data||[]).map(item=>item.value).filter(Number.isFinite),average=homeMapValue(null),extent=Math.max(.01,...values.map(value=>Math.abs(value-average)));provinceChart.setOption({visualMap:{min:average-extent,max:average+extent,inRange:{color:['#218ed0','#29c3e6','#f4d467','#fb9a53','#f15c55']}}});}
};
document.addEventListener('click',event=>{const button=event.target.closest('[data-home-risk]');if(button&&(homeView()||situationActive())){state.homeRiskLevel=button.dataset.homeRisk;render()}});
const situationComorbidityRate=node=>{const p=node?populationFor(node):null,parts=node?diseaseCombinations(p):null;return node?(parts.slice(3).reduce((sum,x)=>sum+x.value,0)/Math.max(.0001,parts.reduce((sum,x)=>sum+x.value,0))*100):cities.reduce((sum,x)=>sum+diseaseCombinations(populationFor(x)).slice(3).reduce((n,v)=>n+v.value,0),0)/Math.max(.0001,cities.reduce((sum,x)=>sum+diseaseCombinations(populationFor(x)).reduce((n,v)=>n+v.value,0),0))*100};
const mapValueBeforeSituationBenchmark=mapValue;
mapValue=function(node){return situationActive()&&state.mapMetric==='comorbidity'?situationComorbidityRate(node):mapValueBeforeSituationBenchmark(node)};
const tooltipBeforeSituationBenchmark=mapTooltip;
mapTooltip=function(node){if(!situationActive()||state.mapMetric!=='comorbidity')return tooltipBeforeSituationBenchmark(node);const value=situationComorbidityRate(node),avg=situationComorbidityRate(null),delta=value-avg;return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>共病患者占比</span><b>${value.toFixed(2)}%</b></div><div><span>省平均</span><b>${avg.toFixed(2)}%</b></div><div><span>与省平均偏差</span><b>${delta>=0?'+':''}${delta.toFixed(2)} 个百分点</b></div></div>`};
const situationMapMount=window.ZhejiangMap3D?.mount;
if(situationMapMount)window.ZhejiangMap3D.mount=function(host,geo,values,options){if(!situationActive()||state.mapMetric!=='comorbidity')return situationMapMount(host,geo,values,options);const avg=situationComorbidityRate(null),extent=Math.max(.01,...values.map(x=>Math.abs(x.value-avg)).filter(Number.isFinite));return situationMapMount(host,geo,[...values.map(x=>({...x,value:Number.isFinite(x.value)?x.value-avg:x.value})),{name:'__min__',value:-extent},{name:'__max__',value:extent}],options)};
const renderMapBeforeSituationBenchmark=renderProvinceMap;
renderProvinceMap=function(){renderMapBeforeSituationBenchmark();if(!situationActive()||state.mapMetric!=='comorbidity')return;const avg=situationComorbidityRate(null),values=state.mapView==='2d'&&provinceChart?(provinceChart.getOption().series[0]?.data||[]).map(x=>x.value).filter(Number.isFinite):childUnits().map(situationComorbidityRate),extent=Math.max(.01,...values.map(x=>Math.abs(x-avg)));if(state.mapView==='2d'&&provinceChart)provinceChart.setOption({visualMap:{min:avg-extent,max:avg+extent,inRange:{color:['#218ed0','#29c3e6','#f4d467','#fb9a53','#f15c55']}}});const scale=document.querySelector('#mapStage .map-scale');if(scale){scale.classList.add('home-benchmark-scale');scale.innerHTML=benchmarkLegend(extent)}const title=document.querySelector('#dashboardBoard .board-map .panel-head h2');if(title)title.textContent=`${currentNode()?.name||'浙江省'}共病患者占比偏差热力图`};
const dashboardBeforeSituationVisualRevision=dashboard;
dashboard=function(){const html=dashboardBeforeSituationVisualRevision();if(!situationActive())return html;const root=document.createElement('div');root.innerHTML=html;const board=root.querySelector('#dashboardBoard'),left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child'),p=populationData(),parts=diseaseCombinations(p),risk=homeRisk(currentNode());
  const colors=['#3784f8','#9b8af4','#4dcbbb','#ffb74e','#f56c72'],names=['仅高血压','仅糖尿病','仅慢阻肺','2病共患','3病叠加'],groups=[...parts.slice(0,3).map(x=>x.value),parts.slice(3,6).reduce((n,x)=>n+x.value,0),parts[6].value],total=groups.reduce((a,b)=>a+b,0);
  board.querySelector('.situation-kpis .board-kpi:last-child span').textContent='并发症患病率';
  const mapLabel=board.querySelector('#mapMetricLabel');if(mapLabel&&state.mapMetric==='comorbidity')mapLabel.textContent='共病患者占比';
  const pathway=document.createElement('div');pathway.className='situation-pathway';pathway.textContent='确诊 → 专档 → 共病 → 风险 → 流向';board.querySelector('.situation-kpis').before(pathway);
  left.children[0].innerHTML=`<h2>重点慢病患者分布</h2><div class="situation-bars">${groups.map((v,i)=>`<div data-board-tip="${names[i]}；人数 ${v.toFixed(1)}万人；占重点慢病患者 ${(v/Math.max(.0001,total)*100).toFixed(2)}%"><span>${names[i]}</span><i><b style="width:${v/Math.max(.0001,total)*100}%;background:${colors[i]}"></b></i><strong>${v.toFixed(1)}万人</strong><em>${(v/Math.max(.0001,total)*100).toFixed(1)}%</em></div>`).join('')}<p>单病 ${(groups.slice(0,3).reduce((a,b)=>a+b,0)).toFixed(1)}万人　·　共病 ${(groups[3]+groups[4]).toFixed(1)}万人</p></div>`;
  left.children[1].remove();
  const levels=[['低风险',risk.low],['中风险',risk.middle],['高风险',risk.high]],types=[['3病叠加',groups[4]],['2病共患',groups[3]],['仅单病',groups.slice(0,3).reduce((a,b)=>a+b,0)]];
  left.children[1].innerHTML=`<h2>风险分层 × 叠加类型</h2><div class="situation-risk-matrix"><span></span>${levels.map(x=>`<b>${x[0]}</b>`).join('')}${types.map(([name,value])=>`<span>${name}</span>${levels.map(([level,n],i)=>`<div class="risk-cell risk-cell-${i}" data-board-tip="${name} · ${level}；人数 ${(value/Math.max(.0001,total)*n).toFixed(2)}万人；占${level} ${(value/Math.max(.0001,total)*100).toFixed(2)}%">${(value/Math.max(.0001,total)*n).toFixed(1)}万</div>`).join('')}`).join('')}</div>`;
  const complication=[...right.children].find(x=>x.querySelector('h2')?.textContent.includes('并发症'));if(complication){
    complication.querySelector('h2').textContent='并发疾病负担TOP5';
    const list=complication.querySelector('.situation-complication-list');
    if(list){const seen=new Set(),rows=[...list.children].filter(row=>{const name=row.querySelector('span')?.textContent;if(!name||seen.has(name))return false;seen.add(name);return true});const rate=row=>parseFloat(row.querySelector('strong')?.textContent.split('·').pop())||0;rows.sort((a,b)=>rate(b)-rate(a));list.replaceChildren(...rows.slice(0,5))}
  }
  const caption=right.querySelector('.risk-ranking-caption span');if(caption)caption.textContent='偏差（百分点）';
  const province=cities.reduce((sum,city)=>sum+homeRisk(city).high,0)/Math.max(.0001,cities.reduce((sum,city)=>sum+populationFor(city).managed,0))*100;
  right.querySelectorAll('.risk-ranking-row').forEach(row=>{const name=row.querySelector('span')?.textContent,city=cities.find(item=>item.name===name);if(!city)return;const value=homeMapValue(city,'highRisk'),delta=value-province;row.dataset.boardTip=`${name}；高风险患者占比 ${value.toFixed(2)}%；省平均 ${province.toFixed(2)}%；偏差 ${delta>=0?'+':''}${delta.toFixed(2)}个百分点`});
  const flow=[...right.children].find(panel=>panel.querySelector('h2')?.textContent==='就诊流向'),flowRing=flow?.querySelector('.construction-doughnut'),flowRows=flow?.querySelectorAll('.construction-coverage-legend>div');
  if(flowRing&&flowRows?.length>=2){const share=Number(flowRing.dataset.ringShare);flowRing.dataset.flowTips=JSON.stringify([0,1].map(i=>`${flowRows[i].textContent.trim()}；占总就诊次数 ${(i?100-share:share).toFixed(2)}%`));flowRing.dataset.boardTip=JSON.parse(flowRing.dataset.flowTips)[0];flowRows.forEach((row,i)=>{row.dataset.boardTip=i<2?JSON.parse(flowRing.dataset.flowTips)[i]:row.textContent.trim()})}
  const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT);let textNode;while((textNode=walker.nextNode()))textNode.nodeValue=textNode.nodeValue.replace(/\s*[·，、]?\s*(?:演示估算|演示数据|模拟数据)/g,'');
  board.querySelectorAll('[title],[aria-label]').forEach(el=>{['title','aria-label'].forEach(attr=>{const value=el.getAttribute(attr);if(value&&/(演示估算|演示数据|模拟数据)/.test(value))el.removeAttribute(attr)})});return root.innerHTML};
pages.dashboard=dashboard;
document.addEventListener('pointermove',event=>{const ring=event.target.closest('.construction-doughnut[data-flow-tips]');if(!ring)return;const rect=ring.getBoundingClientRect(),angle=(Math.atan2(event.clientX-rect.left-rect.width/2,-(event.clientY-rect.top-rect.height/2))*180/Math.PI+360)%360;ring.dataset.boardTip=JSON.parse(ring.dataset.flowTips)[angle<Number(ring.dataset.ringShare)*3.6?0:1]},true);
// Use the same province benchmark for both map modes and the displayed scale.
function dashboardMapBenchmark(){
  if(homeView())return homeMapValue(null);
  if(situationActive()){
    if(state.mapMetric==='comorbidity')return situationComorbidityRate(null);
    const rows=cities.map(city=>({value:mapValue(city),weight:populationFor(city).diagnosed})).filter(row=>Number.isFinite(row.value)&&Number.isFinite(row.weight));
    return rows.reduce((sum,row)=>sum+row.value*row.weight,0)/Math.max(.0001,rows.reduce((sum,row)=>sum+row.weight,0));
  }
  return provinceMetricValue();
}
function showDashboardMapScale(extent){
  const scale=document.querySelector('#mapStage .map-scale');if(!scale)return;
  scale.classList.add('home-benchmark-scale');
  scale.innerHTML=benchmarkLegend(extent);
}
const mapMountBeforeAllBenchmarks=window.ZhejiangMap3D?.mount;
if(mapMountBeforeAllBenchmarks)window.ZhejiangMap3D.mount=function(host,geo,values,options){
  if(state.page!=='dashboard'||homeView()||(situationActive()&&state.mapMetric==='comorbidity'))return mapMountBeforeAllBenchmarks(host,geo,values,options);
  const average=dashboardMapBenchmark(),extent=Math.max(.01,...values.map(item=>Math.abs(item.value-average)).filter(Number.isFinite));
  if(!Number.isFinite(average))return mapMountBeforeAllBenchmarks(host,geo,values,options);
  showDashboardMapScale(extent);
  return mapMountBeforeAllBenchmarks(host,geo,[...values.map(item=>({...item,value:Number.isFinite(item.value)?(item.value-average)*(mapHigherIsWorse()?1:-1):item.value})),{name:'__min__',value:-extent},{name:'__max__',value:extent}],options);
};
const mapRenderBeforeAllBenchmarks=renderProvinceMap;
renderProvinceMap=function(){
  mapRenderBeforeAllBenchmarks();if(state.page!=='dashboard'||homeView()||(situationActive()&&state.mapMetric==='comorbidity'))return;
  const average=dashboardMapBenchmark();if(!Number.isFinite(average))return;
  const values=state.mapView==='2d'&&provinceChart?(provinceChart.getOption().series[0]?.data||[]).map(item=>item.value).filter(Number.isFinite):childUnits().map(mapValue).filter(Number.isFinite);
  const extent=Math.max(.01,...values.map(value=>Math.abs(value-average)));showDashboardMapScale(extent);
  if(state.mapView==='2d'&&provinceChart)provinceChart.setOption({visualMap:{min:average-extent,max:average+extent,inRange:{color:['#218ed0','#29c3e6','#f4d467','#fb9a53','#f15c55']}}});
};
const tooltipBeforeAllBenchmarks=mapTooltip;
mapTooltip=function(node){
  const html=tooltipBeforeAllBenchmarks(node);if(state.page!=='dashboard'||homeView()||(situationActive()&&state.mapMetric==='comorbidity'))return html;
  const average=dashboardMapBenchmark(),value=mapValue(node);if(!Number.isFinite(average)||!Number.isFinite(value))return html;
  const delta=value-average;return html.replace('</div></div>',`</div><div><span>省平均</span><b>${average.toFixed(2)}%</b></div><div><span>与省平均偏差</span><b>${delta>=0?'+':''}${delta.toFixed(2)} 个百分点</b></div></div>`);
};
render();
document.body.classList.remove('dashboard-booting');

const dashboardBeforeReadabilityRevision=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeReadabilityRevision();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(state.dashboardView==='construction'){
    board.querySelector('.clinic-tier-summary')?.remove();
    board.querySelectorAll('.board-stack:last-child .construction-panel:first-child .construction-line').forEach(svg=>svg.setAttribute('preserveAspectRatio','none'));
    const frequency=board.querySelector('.clinic-frequency');if(frequency){frequency.setAttribute('preserveAspectRatio','none');frequency.querySelectorAll('rect').forEach((rect,i)=>{const name=['确诊','专档','一体化'][i%3],year=2025+Math.floor(i/3),value=rect.nextElementSibling?.textContent;if(value)rect.setAttribute('data-board-tip',`${year}年 ${name}人均就诊频率：${value} 次/人`)})}
    const old=board.querySelector('.clinic-scatter');if(old){
      const options=[['bloodPressure','血压控制率'],['bloodGlucose','血糖控制率'],['hba1cTarget','糖化血红蛋白控制率'],['bloodLipids','血脂控制率']],selected=options.find(([key])=>key===state.clinicScatterMetric)||options[0];
      const points=clinicScatterPoints(selected[0]);
      const sx=v=>70+v*8.1,sy=v=>175-v*1.48,meanX=points.reduce((n,p)=>n+p.x,0)/points.length,meanY=points.reduce((n,p)=>n+p.y,0)/points.length;
      const variance=points.reduce((n,p)=>n+(p.x-meanX)**2,0),slope=variance?points.reduce((n,p)=>n+(p.x-meanX)*(p.y-meanY),0)/variance:0,minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),trend=x=>Math.max(0,Math.min(100,meanY+slope*(x-meanX)));
      const highLow=points.filter(p=>p.x>=meanX&&p.y<meanY).sort((a,b)=>a.y-b.y), lowHigh=points.filter(p=>p.x<meanX&&p.y>=meanY);
      const relation=slope>0.05?'覆盖率较高的地区控制率总体也较高，呈正向关联':slope<-.05?'覆盖率较高的地区控制率总体偏低':'覆盖率与控制率的关系暂不明显';
      const advice=highLow.length?`${highLow.map(p=>p.name).join('、')}覆盖率高于地市平均、控制率低于平均，建议排查规范诊疗与持续管理情况。`:lowHigh.length?`${lowHigh.map(p=>p.name).join('、')}覆盖率低于地市平均但控制率较高，可关注覆盖拓展。`:'建议结合各地诊疗质量与持续管理情况进一步分析。';
      old.innerHTML=`<h2>一体化门诊覆盖 × 成效</h2><div class="clinic-scatter-tabs">${options.map(([key,name])=>`<button type="button" data-clinic-scatter="${key}" aria-pressed="${key===selected[0]}">${name}</button>`).join('')}</div><div class="clinic-scatter-body"><svg viewBox="0 0 930 215" preserveAspectRatio="none" role="img" aria-label="各地市一体化门诊覆盖率与${selected[1]}散点图"><g class="construction-grid">${[0,50,100].map(v=>`<line x1="70" x2="880" y1="${sy(v)}" y2="${sy(v)}"/><text x="60" y="${sy(v)+5}" text-anchor="end">${v}%</text><text x="${sx(v)}" y="200" text-anchor="middle">${v}%</text>`).join('')}</g><text x="70" y="16">${selected[1]}</text><text x="820" y="213">覆盖率</text><line x1="${sx(minX)}" y1="${sy(trend(minX))}" x2="${sx(maxX)}" y2="${sy(trend(maxX))}" stroke="#f2b235" stroke-width="3" stroke-dasharray="10 7"/>${points.map((p,i)=>`<g data-board-tip="${esc(p.name)}｜覆盖率 ${p.x.toFixed(1)}%；${selected[1]} ${p.y.toFixed(1)}%"><circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="10" fill="#09baf1" stroke="#003657" stroke-width="2"/><text x="${sx(p.x)}" y="${sy(p.y)+4}" text-anchor="middle" class="clinic-point-number">${i+1}</text></g>`).join('')}</svg><div class="clinic-scatter-details"><div class="clinic-scatter-legend"><span>编号对应地市</span><span>┄ 趋势线</span><span>覆盖率 / ${selected[1]}</span></div><div class="clinic-scatter-values">${points.map((p,i)=>`<div><span><em>${i+1}</em> ${esc(p.name)}</span><b>${p.x.toFixed(1)}% / ${p.y.toFixed(1)}%</b></div>`).join('')}</div></div></div><p class="clinic-scatter-summary">${relation}；${advice} 关联不代表因果。</p>`;
    }
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-clinic-scatter]');if(!button)return;state.clinicScatterMetric=button.dataset.clinicScatter;render()});
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-region-mode]');if(!button)return;state.outcomeRegionModes=state.outcomeRegionModes||{};state.outcomeRegionModes[button.dataset.regionIndex]=button.dataset.regionMode;render()});
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-rank-mode]');if(!button)return;state.outcomeRankMetric=state.outcomeRankMetric||{};state.outcomeRankMetric[button.dataset.rankMode]=Number(button.dataset.rankMetric);render()});
const renderBeforeReadabilityTips=render;
render=function(){renderBeforeReadabilityTips();const board=document.querySelector('#dashboardBoard');if(!board)return;
  board.querySelectorAll('svg rect,svg circle,svg path').forEach(shape=>{const title=shape.querySelector('title');if(title&&!shape.hasAttribute('data-board-tip'))shape.setAttribute('data-board-tip',title.textContent)});
  board.querySelectorAll('.risk-bar-line').forEach(line=>{const row=line.closest('.risk-bar-row'),name=row?.querySelector('span')?.textContent,value=line.querySelector('b')?.textContent,group=line.classList.contains('integrated')?'一体化管理患者':line.classList.contains('recorded')?'专档患者':'确诊患者';if(name&&value)line.dataset.boardTip=`${name}｜${group} ${value}`});
  board.querySelectorAll('.outcome-region-list>div').forEach(row=>{const name=row.querySelector('span')?.textContent,value=row.querySelector('b')?.textContent,title=row.closest('section')?.querySelector('h2')?.childNodes[0]?.textContent;if(name&&value)row.dataset.boardTip=`${name}｜${title}与省级参考值偏差 ${value} 个百分点`});
  board.querySelectorAll('.funnel-shape').forEach(shape=>{const name=shape.closest('.home-disease-group')?.querySelector('h2')?.textContent,value=shape.textContent.replace(/\s+/g,' ').trim();if(name&&value)shape.dataset.boardTip=`${name}｜${value}`});
};
render();

// Final chart presentation for the dashboard views.
const dashboardBeforeChartPresentation=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeChartPresentation();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const node=currentNode(),metrics=clinicMetrics(node);
  const counts=[...homeTierCounts(node),Math.max(0,metrics.eligible-metrics.built)],names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#2E86FF','#4DB8FF','#FFB020','#5A6B85'];
  const ring=()=>{let sum=0;const stops=counts.map((n,i)=>{const start=sum;sum+=n/Math.max(1,metrics.eligible)*100;return `${colors[i]} ${start}% ${sum}%`}).join(',');return `<div class="chart-coverage-ring" style="background:conic-gradient(${stops})" role="img" aria-label="一体化门诊覆盖率 ${formatPct(metrics.built/Math.max(1,metrics.eligible)*100)}"><div><strong>${formatPct(metrics.built/Math.max(1,metrics.eligible)*100)}</strong><span>覆盖率</span></div></div>`};
  if(homeView()){
    const panel=board.querySelector('.home-disease-combined'),groups=[...panel.querySelectorAll('.home-disease-group')].map(group=>({name:group.querySelector('h2').textContent.trim(),values:[...group.querySelectorAll('.funnel-shape strong')].map(el=>parseFloat(el.textContent)||0)}));
    const max=Math.max(1,...groups.flatMap(g=>g.values)),ceiling=Math.ceil(max/100)*100||100,base=180,y=v=>base-v/ceiling*140,barColors=['#2E86FF','#8FD0FF','#FFB020'];
    panel.querySelector('.home-disease-groups').outerHTML=`<div class="home-grouped-chart"><div class="home-chart-legend">${['确诊','专档','高风险'].map((label,i)=>`<span><i style="background:${barColors[i]}"></i>${label}</span>`).join('')}<small>单位：万人</small></div><svg viewBox="0 0 400 210" preserveAspectRatio="none" role="img" aria-label="三病患者确诊、专档及高风险人数分组柱状图">${[0,.25,.5,.75,1].map(t=>`<line x1="42" x2="390" y1="${y(ceiling*t)}" y2="${y(ceiling*t)}" stroke="#24435f"/><text x="36" y="${y(ceiling*t)+4}" text-anchor="end">${Math.round(ceiling*t)}</text>`).join('')}${groups.map((g,j)=>{const cx=100+j*110;return `${g.values.map((v,i)=>`<rect x="${cx+(i-1)*25-10}" y="${y(v)}" width="20" height="${base-y(v)}" rx="2" fill="${barColors[i]}" data-board-tip="${g.name}｜${['确诊','专档','高风险'][i]} ${v.toFixed(1)}万人"/>`).join('')}<text x="${cx}" y="202" text-anchor="middle">${g.name}</text>`}).join('')}</svg></div>`;
    const coverage=board.querySelector('.home-coverage-composition');if(coverage){coverage.querySelector('.coverage-head')?.remove();coverage.querySelector('.coverage-segments')?.remove();coverage.insertAdjacentHTML('afterbegin',ring())}
  }
  if(situationActive()){
    const risk=homeRisk(node),total=risk.low+risk.middle+risk.high;
    board.querySelectorAll('.risk-cell').forEach((cell,i)=>{const pct=[risk.low,risk.middle,risk.high][i%3]/Math.max(.0001,total)*100;cell.innerHTML=`<strong>${cell.textContent}</strong><small>${pct.toFixed(1)}%</small>`;cell.dataset.boardTip+=`；占该叠加类型 ${pct.toFixed(1)}%`});
    board.querySelector('.situation-risk-matrix')?.insertAdjacentHTML('beforebegin','<div class="risk-matrix-caption">百分比为各叠加类型内占比</div>');
  }
  if(state.dashboardView==='construction'){
    const coverage=board.querySelector('.clinic-tier-chart');if(coverage){coverage.querySelector('.clinic-tier-bar')?.remove();coverage.insertAdjacentHTML('afterbegin',ring())}
    const svg=board.querySelector('.board-stack:last-child .construction-panel:first-child .construction-line');
    if(svg){const points=[...svg.querySelectorAll('circle')].map(c=>{const match=c.querySelector('title')?.textContent.match(/([\d.]+)%/);return match?Number(match[1]):NaN}).filter(Number.isFinite),labels=[...svg.querySelectorAll('.construction-month')].map(t=>t.textContent);if(points.length){const top=Math.max(70,Math.ceil(Math.max(...points)/10)*10),x=i=>62+i*244/Math.max(1,points.length-1),y=v=>150-v/top*125,coords=points.map((v,i)=>`${x(i)},${y(v)}`).join(' ');svg.setAttribute('viewBox','0 0 360 185');svg.innerHTML=`<g class="construction-grid">${Array.from({length:top/10+1},(_,i)=>`<line x1="42" x2="340" y1="${y(i*10)}" y2="${y(i*10)}"/><text x="35" y="${y(i*10)+4}" text-anchor="end">${i*10}%</text>`).join('')}</g><polygon points="${x(0)},150 ${coords} ${x(points.length-1)},150" fill="#f3a533" opacity=".1"/><polyline points="${coords}" fill="none" stroke="#ffa72e" stroke-width="3"/>${points.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#fff" stroke="#ffa72e" stroke-width="3" data-board-tip="${labels[i]||''} ${v.toFixed(1)}%"/><text x="${x(i)}" y="${y(v)-10}" text-anchor="middle">${v.toFixed(1)}%</text><text x="${x(i)}" y="174" text-anchor="middle">${labels[i]||''}</text>`).join('')}`}}
    const scatter=board.querySelector('.clinic-scatter svg');if(scatter){const key=state.clinicScatterMetric||'bloodPressure',points=cities.map(city=>({name:city.name,x:constructionValue(city,'construction'),y:homeMapValue(city,key)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(points.length){const xmin=Math.floor(Math.min(...points.map(p=>p.x))/10)*10-5,xmax=Math.ceil(Math.max(...points.map(p=>p.x))/10)*10+5,ymin=Math.max(0,Math.floor(Math.min(...points.map(p=>p.y))/10)*10-5),ymax=Math.min(100,Math.ceil(Math.max(...points.map(p=>p.y))/10)*10+5),sx=v=>65+(v-xmin)/(xmax-xmin)*810,sy=v=>175-(v-ymin)/(ymax-ymin)*145,mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length,variance=points.reduce((s,p)=>s+(p.x-mx)**2,0),slope=variance?points.reduce((s,p)=>s+(p.x-mx)*(p.y-my),0)/variance:0,trend=x=>Math.max(ymin,Math.min(ymax,my+slope*(x-mx)));scatter.innerHTML=`<g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="65" x2="875" y1="${sy(ymin+t*(ymax-ymin))}" y2="${sy(ymin+t*(ymax-ymin))}"/><line x1="${sx(xmin+t*(xmax-xmin))}" x2="${sx(xmin+t*(xmax-xmin))}" y1="30" y2="175"/><text x="55" y="${sy(ymin+t*(ymax-ymin))+5}" text-anchor="end">${Math.round(ymin+t*(ymax-ymin))}%</text><text x="${sx(xmin+t*(xmax-xmin))}" y="200" text-anchor="middle">${Math.round(xmin+t*(xmax-xmin))}%</text>`).join('')}</g><line x1="${sx(mx)}" x2="${sx(mx)}" y1="30" y2="175" stroke="#477ca2" stroke-dasharray="5 4"/><line x1="65" x2="875" y1="${sy(my)}" y2="${sy(my)}" stroke="#477ca2" stroke-dasharray="5 4"/><line x1="65" x2="875" y1="${sy(trend(xmin))}" y2="${sy(trend(xmax))}" stroke="#ffa72e" stroke-width="2" stroke-dasharray="8 5"/>${points.map((p,i)=>`<g data-board-tip="${esc(p.name)}｜覆盖率 ${p.x.toFixed(1)}%；控制率 ${p.y.toFixed(1)}%"><circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="10" fill="#2878b9" stroke="#81caff"/><text class="clinic-point-number" x="${sx(p.x)}" y="${sy(p.y)+4}" text-anchor="middle">${i+1}</text></g>`).join('')}`}}
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const outcomeMapValueBeforeReview=mapValue;
const outcomeProvinceValueBeforeReview=provinceMetricValue;
const outcomeMapReviewKeys=['outcomeBpTarget','outcomeGlucoseTarget','outcomeHba1cTarget','outcomeLipidTarget'];
const outcomeMapReviewBases=[74.5,62.1,49.6,26.8];
const outcomeMapReviewNames=['杭州','宁波','湖州','嘉兴','温州','绍兴','台州','金华','舟山','衢州','丽水'];
const outcomeMapReviewOffsets=[[3.9,2.5,1.8,.9,.7,.1,-1.3,-2.5,-3.6,-5.2,-5.9],[3.9,2.3,1.3,.6,.4,-.3,-.9,-2.1,-3.3,-4.7,-5.9],[3.3,2,1,.7,.2,-.1,-.8,-1.7,-2.6,-4.3,-5.1],[2.6,2.1,1.5,1,.4,-.2,-.8,-1.5,-2.3,-3.1,-4.2]];
function outcomeRegionValue(node,metric,high){
  if(!node)return high?[62.3,47.8,40.2,25.4][metric]:outcomeMapReviewBases[metric];
  const name=(node.cityName||node.name||'').replace(/市$/,''),index=outcomeMapReviewNames.indexOf(name),city=cities.find(item=>item.name.replace(/市$/,'')===name);
  if(index<0||!city)return NaN;
  const local=node.cityName?outcomeMapValueBeforeReview(node)-outcomeMapValueBeforeReview(city):0;
  return Math.max(0,Math.min(100,(high?[62.3,47.8,40.2,25.4][metric]:outcomeMapReviewBases[metric])+outcomeMapReviewOffsets[metric][index]+local));
}
mapValue=function(node){
  const metric=outcomeMapReviewKeys.indexOf(state.mapMetric);
  if(state.dashboardView!=='outcomes'||metric<0||!node)return outcomeMapValueBeforeReview(node);
  const name=(node.cityName||node.name||'').replace(/市$/,''),index=outcomeMapReviewNames.indexOf(name);
  if(index<0)return outcomeMapValueBeforeReview(node);
  const city=cities.find(item=>item.name.replace(/市$/,'')===name),local=node.cityName?outcomeMapValueBeforeReview(node)-outcomeMapValueBeforeReview(city):0;
  return Math.max(0,Math.min(100,outcomeMapReviewBases[metric]+outcomeMapReviewOffsets[metric][index]+local));
};
provinceMetricValue=function(){const i=outcomeMapReviewKeys.indexOf(state.mapMetric);return state.dashboardView==='outcomes'&&i>=0?outcomeMapReviewBases[i]:outcomeProvinceValueBeforeReview()};
render();






document.addEventListener('click',event=>{
  if(!event.target.closest?.('[data-open-clinic-photos]'))return;
  const node=currentNode(),level=scopeLevel();
  const items=(window.CLINIC_PHOTOS||[]).filter(item=>{
    if(!node)return true;
    if(level==='city')return item.city===node.name;
    if(level==='clinic')return item.name===node.name;
    if(level==='consortium')return false;
    return item.city===node.cityName&&item.name.includes(node.name);
  });
  const dialog=document.createElement('dialog');dialog.className='clinic-gallery-dialog';
  dialog.innerHTML=`<header><div><h2>${esc(regionLabel())} · 机构照片</h2><p>仅展示已收录照片的机构，照片资料未覆盖全部机构。</p></div><button type="button" data-gallery-close aria-label="关闭">×</button></header><div class="clinic-gallery-view"><aside class="clinic-gallery-side"><div class="clinic-gallery-search"><label for="clinicGallerySearch">机构名称</label><input id="clinicGallerySearch" type="search" placeholder="搜索机构" autocomplete="off"><small></small></div><div class="clinic-gallery-list"></div><div class="clinic-gallery-pager"><span></span><div><button type="button" data-gallery-page="-1" aria-label="上一页">‹</button><button type="button" data-gallery-page="1" aria-label="下一页">›</button></div></div></aside><div class="clinic-gallery-main"></div></div>`;
  (document.fullscreenElement||document.body).append(dialog);
  let selected=0,photoIndex=0,page=0,filtered=items;const pageSize=8;
  const draw=()=>{
    const pages=Math.ceil(filtered.length/pageSize),item=filtered[selected],photos=item?clinicImages(item):[],main=dialog.querySelector('.clinic-gallery-main');
    main.innerHTML=item&&photos.length?`<div class="clinic-gallery-photo-stage"><img src="${esc(photos[photoIndex])}" alt="${esc(item.name)}，第${photoIndex+1}张照片">${photos.length>1?`<button type="button" class="gallery-prev" data-gallery-step="-1" aria-label="上一张照片">‹</button><button type="button" class="gallery-next" data-gallery-step="1" aria-label="下一张照片">›</button>`:''}</div><div class="clinic-gallery-caption"><span class="clinic-gallery-name">${esc(item.name)}</span><span>${photoIndex+1} / ${photos.length}</span></div><div class="clinic-gallery-photo-nav">${photos.map((photo,i)=>`<button type="button" data-gallery-photo="${i}" aria-label="查看第${i+1}张照片" aria-pressed="${i===photoIndex}"><img src="${esc(photo)}" alt=""></button>`).join('')}</div>`:`<div class="clinic-gallery-empty">${items.length?'没有找到匹配的机构':'当前区域暂无已收录的机构照片'}</div>`;
    dialog.querySelector('.clinic-gallery-search small').textContent=`${filtered.length} 家机构`;
    dialog.querySelector('.clinic-gallery-list').innerHTML=filtered.slice(page*pageSize,(page+1)*pageSize).map((entry,i)=>{const index=page*pageSize+i;return `<button type="button" class="clinic-gallery-item" data-gallery-item="${index}" aria-pressed="${index===selected}"><span>${esc(entry.name)}</span><small>${clinicImages(entry).length} 张</small></button>`}).join('');
    dialog.querySelector('.clinic-gallery-pager span').textContent=pages?`${page+1} / ${pages}`:'0 / 0';
    dialog.querySelector('[data-gallery-page="-1"]').disabled=page===0;dialog.querySelector('[data-gallery-page="1"]').disabled=page>=pages-1;
  };
  dialog.querySelector('#clinicGallerySearch').addEventListener('input',e=>{const query=e.target.value.trim().toLocaleLowerCase();filtered=items.filter(item=>item.name.toLocaleLowerCase().includes(query));page=0;selected=0;photoIndex=0;draw()});
  dialog.addEventListener('click',e=>{const target=e.target.closest('button');if(!target)return;if(target.hasAttribute('data-gallery-close'))dialog.close();else if(target.hasAttribute('data-gallery-page')){page+=Number(target.dataset.galleryPage);selected=page*pageSize;photoIndex=0;draw()}else if(target.hasAttribute('data-gallery-item')){selected=Number(target.dataset.galleryItem);photoIndex=0;draw()}else if(target.hasAttribute('data-gallery-photo')){photoIndex=Number(target.dataset.galleryPhoto);draw()}else if(target.hasAttribute('data-gallery-step')){const photos=clinicImages(filtered[selected]);photoIndex=(photoIndex+Number(target.dataset.galleryStep)+photos.length)%photos.length;draw()}});
  draw();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
});
render();


function openClinicSummary(){
  const values=[['一体化门诊覆盖率',node=>constructionValue(node,'construction')],['医防融合入径率',node=>dashboardRate(node,'entry')],['路径节点执行率',node=>constructionValue(node,'monitoring')]];
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';
  dialog.innerHTML=`<header><h2>一体化门诊总结</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body">${values.map(([label,get])=>{const average=get(null),rows=cities.map(city=>({name:city.name,value:get(city)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);if(!Number.isFinite(average))return '';const above=rows.filter(row=>row.value>average),below=rows.filter(row=>row.value<average);return `<section><h3>${label}<span class="summary-average">省均值：${average.toFixed(2)}%</span></h3><p class="summary-action">高于省均值 ${above.length} 个地市，低于省均值 ${below.length} 个地市。</p><details><summary>查看具体明细</summary><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>地市</th><th>省均值</th><th>区域值</th><th>与省均值偏差</th></tr></thead><tbody>${rows.map(row=>{const delta=row.value-average;return `<tr><td>${esc(row.name)}</td><td>${average.toFixed(2)}%</td><td>${row.value.toFixed(2)}%</td><td>${delta>=0?'+':''}${delta.toFixed(2)} 个百分点</td></tr>`}).join('')}</tbody></table></div></details></section>`}).join('')}</div>`;
  document.body.append(dialog);dialog.addEventListener('click',event=>{if(event.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
document.addEventListener('click',event=>{if(event.target.closest?.('.clinic-summary'))openClinicSummary()});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.clinic-summary')){event.preventDefault();openClinicSummary()}});


const mapTooltipBeforeOverviewComorbidity=mapTooltip;
mapTooltip=function(node){
  if(homeView()&&state.mapMetric==='comorbidity'){
    const value=homeMapValue(node),average=homeMapValue(null),delta=value-average;
    return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>共病患者占比</span><b>${value.toFixed(2)}%</b></div><div><span>省平均</span><b>${average.toFixed(2)}%</b></div><div><span>与省均差距</span><b>${delta>=0?'+':''}${delta.toFixed(2)} 个百分点</b></div><p>共病患者数 ÷ 重点慢病患者数</p></div>`;
  }
  return mapTooltipBeforeOverviewComorbidity(node);
};


// Place population and risk analysis on their corresponding views.
const dashboardBeforeRiskReorganization=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeRiskReorganization();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const left=board.querySelector('.board-columns .board-stack:first-child'),p=populationData();
  if(homeView()&&left){
    left.querySelector('.home-risk-composition')?.remove();
    const parts=diseaseCombinations(p),groups=[...parts.slice(0,3).map(x=>x.value),parts.slice(3,6).reduce((n,x)=>n+x.value,0),parts[6].value],total=groups.reduce((a,b)=>a+b,0);
    const names=['仅高血压','仅糖尿病','仅慢阻肺','2病共患','3病叠加'],colors=['#3784f8','#9b8af4','#4dcbbb','#ffb74e','#f56c72'];
    const panel=document.createElement('section');panel.className='board-panel home-population-distribution';
    panel.innerHTML=`<h2>重点慢病患者共病情况 <span class="scope-tag" tabindex="0" data-scope-tip="全口径：全部确诊患者">全</span></h2><div class="situation-bars">${[4,3,0,1,2].map(i=>{const v=groups[i];return `<div data-board-tip="${names[i]}；人数 ${v.toFixed(1)}万人；占重点慢病患者 ${(v/Math.max(.0001,total)*100).toFixed(2)}%"><span>${names[i]}</span><i><b style="width:${v/Math.max(.0001,total)*100}%;background:${colors[i]}"></b></i><strong>${v.toFixed(1)}万人</strong><em>${(v/Math.max(.0001,total)*100).toFixed(1)}%</em></div>`}).join('')}<p>单病 ${groups.slice(0,3).reduce((a,b)=>a+b,0).toFixed(1)}万人　·　共病 ${(groups[3]+groups[4]).toFixed(1)}万人</p></div>`;
    left.append(panel);
  }
  if(situationActive()&&left){
    [...left.children].find(panel=>panel.querySelector('h2')?.textContent==='重点慢病患者分布')?.remove();
    const risk=homeRisk(currentNode()),total=risk.high+risk.middle+risk.low,selected=state.homeRiskLevel||'high';
    const levels=[['高风险',risk.high,'#FF5A5A','high'],['中风险',risk.middle,'#FFB020','middle'],['低风险',risk.low,'#2E86FF','low']];
    const name=levels.find(item=>item[3]===selected)?.[0]||'高风险',rate=risk[selected]/Math.max(.0001,p.managed);
    const diseases=[['高血压',p.managedHigh*rate,'#2E86FF'],['糖尿病',p.managedDiabetes*rate,'#5FA9FF'],['慢阻肺',p.managedCopd*rate,'#8FD0FF']],sum=diseases.reduce((n,item)=>n+item[1],0);
    const panel=document.createElement('section');panel.className='board-panel home-risk-composition';
    panel.innerHTML=`<h2>风险分级与病种构成</h2><div class="home-risk-content"><div class="home-risk-segments">${levels.map(([label,value,color,key])=>`<button type="button" data-home-risk="${key}" aria-pressed="${selected===key}" style="width:${value/Math.max(.0001,total)*100}%;background:${color}" title="${label} ${value.toFixed(1)}万人">${(value/Math.max(.0001,total)*100).toFixed(1)}%</button>`).join('')}</div><div class="home-risk-labels">${levels.map(([label,value,,key])=>`<button type="button" data-home-risk="${key}" aria-pressed="${selected===key}">${label} ${value.toFixed(1)}万</button>`).join('')}<span>未知风险 待接入</span></div><div class="home-risk-subtitle">${name}患者病种构成</div><div class="home-risk-bars">${diseases.map(([label,value,color])=>`<div><span><i style="background:${color}"></i>${label}</span><div><b style="width:${value/Math.max(.0001,sum)*100}%;background:${color}"></b></div><strong>${value.toFixed(1)}万人 <small>· ${(value/Math.max(.0001,sum)*100).toFixed(1)}%</small></strong></div>`).join('')}</div><small class="home-risk-note">已知风险分布为演示数据；未知风险人数待接入</small></div>`;
    left.prepend(panel);
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const renderMapBeforeSemanticColors=renderProvinceMap;
renderProvinceMap=function(){
  renderMapBeforeSemanticColors();
  if(state.page!=='dashboard')return;
  const scale=document.querySelector('#mapStage .map-scale');
  if(scale){scale.classList.add('home-benchmark-scale');scale.innerHTML=benchmarkLegend()}
  if(state.mapView==='2d'&&provinceChart){
    const colors=['#2186d0','#55a8df','#f2a54a','#ed7b46','#e65c58'];
    provinceChart.setOption({visualMap:{inRange:{color:mapHigherIsWorse()?colors:colors.slice().reverse()}}});
    provinceChart.setOption({visualMap:{outOfRange:{color:'#758393'}},series:[{itemStyle:{areaColor:'#758393'}}]});
  }
};
render();

// Reflow the clinic trend horizontally without stretching its labels.
const clinicTrendSelector='.construction-board .board-stack:last-child .construction-panel:first-child svg.construction-line';
const clinicTrendOriginals=new WeakMap();
const clinicTrendResize=new ResizeObserver(entries=>entries.forEach(({target,contentRect})=>{
  if(!contentRect.width||!contentRect.height)return;
  let originals=clinicTrendOriginals.get(target);
  if(!originals){
    originals=[...target.querySelectorAll('line,text,circle,polyline,polygon')].map(el=>({el,attrs:Object.fromEntries(['x','x1','x2','cx','points'].filter(name=>el.hasAttribute(name)).map(name=>[name,el.getAttribute(name)]))}));
    clinicTrendOriginals.set(target,originals);
  }
  const width=Math.max(360,185*contentRect.width/contentRect.height),mapX=x=>42+(Number(x)-42)*(width-62)/298;
  originals.forEach(({el,attrs})=>Object.entries(attrs).forEach(([name,value])=>{
    if(name==='points')el.setAttribute(name,value.trim().split(/\s+/).map(pair=>{const [x,y]=pair.split(',');return `${mapX(x)},${y}`}).join(' '));
    else if(name!=='x'||Number(value)>42)el.setAttribute(name,mapX(value));
  }));
  target.setAttribute('viewBox',`-22 0 ${width+22} 185`);
}));
function observeClinicTrend(){document.querySelectorAll(clinicTrendSelector).forEach(svg=>clinicTrendResize.observe(svg))}
new MutationObserver(observeClinicTrend).observe(document.body,{childList:true,subtree:true});
observeClinicTrend();

const dashboardBeforeFollowupCharts=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeFollowupCharts();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(homeView()){
    board.querySelectorAll('.home-grouped-chart rect[data-board-tip]').forEach(bar=>{
      const match=bar.dataset.boardTip.match(/([\d.]+)万人/);if(!match)return;
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.setAttribute('x',Number(bar.getAttribute('x'))+Number(bar.getAttribute('width'))/2);
      label.setAttribute('y',Math.max(12,Number(bar.getAttribute('y'))-5));
      label.setAttribute('text-anchor','middle');label.setAttribute('class','home-bar-value');label.textContent=match[1];bar.after(label);
    });
    board.querySelectorAll('.coverage-composition-legend > div').forEach(row=>{
      const small=row.querySelector('small'),span=row.querySelector('span');if(!small||!span)return;
      const percent=small.textContent.match(/[\d.]+%/);if(percent){small.textContent=percent[0];span.append(small)}
    });
  }
  if(situationActive()){
    const panel=board.querySelector('.situation-risk-ranking'),rows=panel?.querySelectorAll('.risk-ranking-row');
    rows?.forEach(row=>{const city=cities.find(c=>c.name===row.querySelector('span')?.textContent);if(!city)return;const value=document.createElement('small');value.className='risk-ranking-value';value.textContent=`${homeMapValue(city,'highRisk').toFixed(2)}%`;row.querySelector('span').after(value)});
    const complication=board.querySelector('.situation-complication-panel');
    if(complication){const heading=complication.querySelector('h2');if(heading)heading.textContent='并发疾病负担TOP3';const list=complication.querySelector('.situation-complication-list');if(list)[...list.children].slice(3).forEach(row=>row.remove())}
  }
  if(state.dashboardView==='construction'){
    const panel=board.querySelector('.clinic-scatter');
    if(panel){
      const options=[['bloodPressure','血压控制率'],['bloodGlucose','血糖控制率'],['hba1cTarget','糖化血红蛋白控制率'],['bloodLipids','血脂控制率']];
      const selected=options.find(([key])=>key===state.clinicScatterMetric)||options[0];
      const points=clinicScatterPoints(selected[0]);
      if(points.length){
        const mx=constructionValue(null,'construction'),my=clinicScatterValue(null,selected[0]);
        const range=(values)=>{const low=Math.min(...values),high=Math.max(...values),padding=Math.max(1,(high-low)*.08);let min=Math.max(0,Math.floor(low-padding)),max=Math.min(100,Math.ceil(high+padding));if(max-min<2){min=Math.max(0,min-1);max=Math.min(100,max+1)}return [min,max]};
        const [xmin,xmax]=range([mx,...points.map(p=>p.x)]),[ymin,ymax]=range([my,...points.map(p=>p.y)]);
        const sx=v=>65+(v-xmin)/Math.max(1,xmax-xmin)*820,sy=v=>175-(v-ymin)/Math.max(1,ymax-ymin)*145;
        const variance=points.reduce((sum,p)=>sum+(p.x-mx)**2,0),slope=variance?points.reduce((sum,p)=>sum+(p.x-mx)*(p.y-my),0)/variance:0;
        const trend=x=>Math.max(ymin,Math.min(ymax,my+slope*(x-mx)));
        const highLow=points.filter(p=>p.x>=mx&&p.y<my).map(p=>p.name),low=points.filter(p=>p.x<80).map(p=>p.name);
        const relation=slope>.05?'覆盖率较高的地区，控制率总体较高':slope<-.05?'覆盖率较高的地区，控制率总体偏低':'覆盖率与控制率的关联暂不明显';
        panel.innerHTML=`<h2>一体化门诊覆盖 × 慢病控制成效 <small>横轴覆盖率 · 纵轴控制率 · 气泡为地市</small></h2><div class="clinic-scatter-tabs">${options.map(([key,name])=>`<button type="button" data-clinic-scatter="${key}" aria-pressed="${key===selected[0]}">${name}</button>`).join('')}</div><div class="clinic-scatter-body"><svg viewBox="0 0 920 205" preserveAspectRatio="none" role="img" aria-label="各地市一体化门诊覆盖率与${selected[1]}散点图"><g class="construction-grid">${[0,.25,.5,.75,1].map(t=>`<line x1="65" x2="885" y1="${sy(ymin+t*(ymax-ymin))}" y2="${sy(ymin+t*(ymax-ymin))}"/><line x1="${sx(xmin+t*(xmax-xmin))}" x2="${sx(xmin+t*(xmax-xmin))}" y1="30" y2="175"/><text x="58" y="${sy(ymin+t*(ymax-ymin))+4}" text-anchor="end">${(ymin+t*(ymax-ymin)).toFixed(0)}%</text><text x="${sx(xmin+t*(xmax-xmin))}" y="195" text-anchor="middle">${(xmin+t*(xmax-xmin)).toFixed(0)}%</text>`).join('')}</g><line x1="${sx(mx)}" x2="${sx(mx)}" y1="30" y2="175" stroke="#4c7394" stroke-dasharray="4 4"/><line x1="65" x2="885" y1="${sy(my)}" y2="${sy(my)}" stroke="#4c7394" stroke-dasharray="4 4"/><line x1="65" x2="885" y1="${sy(trend(xmin))}" y2="${sy(trend(xmax))}" stroke="#f5a52f" stroke-width="2" stroke-dasharray="7 4"/>${points.map((p,i)=>`<g data-board-tip="${esc(p.name)}｜覆盖率 ${p.x.toFixed(1)}%；${selected[1]} ${p.y.toFixed(1)}%"><circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="9" fill="#2165a9" stroke="#8acbff"/><text class="clinic-point-number" x="${sx(p.x)}" y="${sy(p.y)+4}" text-anchor="middle">${i+1}</text></g>`).join('')}</svg><div class="clinic-scatter-details"><div class="clinic-scatter-values">${points.map((p,i)=>`<div><span><em>${i+1}</em> ${esc(p.name)}</span><b>${p.x.toFixed(1)}% <small>/ ${p.y.toFixed(1)}%</small></b></div>`).join('')}</div></div></div><div class="clinic-scatter-insights"><p><i></i><strong>整体关联：</strong>${relation}。</p><p><i></i><strong>高覆盖、低成效：</strong>${highLow.length?`${highLow.map(esc).join('、')}覆盖率高于地市均值，控制率低于均值。`:'暂无地市符合该条件。'}</p><p><i></i><strong>低覆盖待提升：</strong>${low.length?`${low.map(esc).join('、')}覆盖率不足 80%。`:'暂无地市覆盖率低于 80%。'}</p><p class="clinic-scatter-note">散点为相关性观察，不代表因果关系；需结合规范诊疗与持续管理情况进一步核查。</p></div>`;
      }
    }
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Keep the two coverage legends and the clinic comparison in sync.
const dashboardBeforeClinicDetailUpdate=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeClinicDetailUpdate();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const node=currentNode(),metrics=clinicMetrics(node);
  const counts=[...homeTierCounts(node),Math.max(0,metrics.eligible-metrics.built)];
  const names=['基本保障','强化功能','鼓励探索','未建设'],colors=['#2E86FF','#4DB8FF','#FFB020','#5A6B85'];
  const legend=()=>`<div class="coverage-composition-legend unified-coverage-legend">${counts.map((count,i)=>`<div><i style="background:${colors[i]}"></i><span class="coverage-name">${names[i]}</span><span class="coverage-count"><strong>${count}</strong>家</span><small>${(count/Math.max(1,i===3?metrics.eligible:metrics.built)*100).toFixed(2)}%</small></div>`).join('')}</div>`;
  board.querySelector('.home-coverage-composition .coverage-composition-legend')?.insertAdjacentHTML('afterend',legend());
  const homeLegend=board.querySelector('.home-coverage-composition .coverage-composition-legend:not(.unified-coverage-legend)');homeLegend?.remove();
  const clinicLegend=board.querySelector('.clinic-tier-legend');if(clinicLegend)clinicLegend.outerHTML=legend();
  board.querySelector('.clinic-tier-summary')?.remove();
  if(state.dashboardView==='construction'){
    const trend=board.querySelector('.board-stack:last-child .construction-panel:first-child .construction-line');
    if(trend)trend.setAttribute('preserveAspectRatio','xMidYMid meet');
    const panel=board.querySelector('.clinic-scatter'),svg=panel?.querySelector('svg'),details=panel?.querySelector('.clinic-scatter-details');
    if(panel){
      panel.querySelector('.clinic-scatter-insights')?.remove();
      const heading=panel.querySelector('h2'),tabs=panel.querySelector('.clinic-scatter-tabs');
      if(heading&&tabs){const title=document.createElement('span');title.className='clinic-scatter-title';title.textContent=heading.firstChild.textContent.trim();heading.firstChild.replaceWith(title);title.after(tabs)}
      svg?.setAttribute('preserveAspectRatio','xMidYMid meet');
    }
    if(svg&&details){
      const key=state.clinicScatterMetric||'bloodPressure';
      const points=cities.map(city=>({name:city.name,x:constructionValue(city,'construction'),y:homeMapValue(city,key)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
      if(points.length){
        const mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length;
        const groups=[{name:'高覆盖 · 低成效预警',color:'#FFB020',items:points.filter(p=>p.x>=mx&&p.y<my)},{name:'覆盖待提升',color:'#87A8C8',items:points.filter(p=>p.x<mx)},{name:'成效良好 · 高覆盖高成效',color:'#2E9DDD',items:points.filter(p=>p.x>=mx&&p.y>=my)}];
        const category=p=>groups.find(g=>g.items.includes(p));
        svg.querySelectorAll('g[data-board-tip]').forEach((g,i)=>{const p=points[i];if(!p)return;const circle=g.querySelector('circle'),label=g.querySelector('text');circle?.setAttribute('fill',category(p).color);if(label){label.textContent=p.x<mx||p.y<my?p.name.replace(/市$/,''):'';label.setAttribute('y',Number(circle.getAttribute('cy'))-13);label.setAttribute('class','clinic-point-label')}});
        details.innerHTML=groups.map(g=>`<div class="clinic-scatter-group" style="--group-color:${g.color}"><div class="clinic-group-heading"><strong>${g.name}</strong><span>${g.items.length} 地市</span></div><div class="clinic-group-cities">${g.items.length?g.items.map(p=>`<div><span>${esc(p.name.replace(/市$/,''))}</span><b>${p.x.toFixed(1)}% <small>/ ${p.y.toFixed(1)}%</small></b></div>`).join(''):'<span>暂无</span>'}</div></div>`).join('');
      }
    }
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeScopeLegend=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeScopeLegend();
  const board=root.querySelector('#dashboardBoard');if(!board||!homeView())return root.innerHTML;
  const legend=document.createElement('div');legend.className='board-scope-legend';
  legend.innerHTML='<span><b>全口径</b> 全部确诊患者</span><span><b>专档口径</b> 有专档的患者</span><span><b>一体化口径</b> 一体化管理的专档患者</span>';
  board.querySelector('.board-title')?.append(legend);
  const tags={'重点慢病人数':['全','全口径：全部确诊患者'],'专档患者数':['专','专档口径：有专档的患者'],'风险分层人数':['专','专档口径：有专档的患者'],'高风险患者数':['专','专档口径：有专档的患者']};
  board.querySelectorAll('.board-kpis > .board-kpi').forEach(card=>{
    const label=card.querySelector(':scope > span'),tag=tags[label?.textContent.trim()];if(!tag)return;
    label.insertAdjacentHTML('beforeend',` <b class="metric-scope-tag" title="${tag[1]}">${tag[0]}</b>`);
  });
  const coverage=board.querySelector('.home-coverage-composition');
  if(coverage)coverage.querySelector('.chart-coverage-ring')?.remove();
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();


const dashboardBeforeNovemberDetails=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeNovemberDetails();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const scope='<span><b>全</b> 全部确诊患者</span><span><b>专</b> 有专档的患者</span><span><b>一体化</b> 一体化管理的专档患者</span>';
  if(homeView()){
    const legend=board.querySelector('.board-scope-legend');if(legend)legend.innerHTML=scope;
    const p=populationData(),risk=homeRisk(currentNode()),rate=risk.high/Math.max(.0001,p.managed);
    const columns=[['高血压',p.high,p.managedHigh,.901],['糖尿病',p.diabetes,p.managedDiabetes,.883],['慢阻肺',p.copd,p.managedCopd,.856]];
    const chart=board.querySelector('.home-grouped-chart');
    if(chart){const original=[...chart.querySelectorAll('rect[data-board-tip]')];const values=columns.map(([name,diagnosed,managed,assess],i)=>{const a=Number(original[i*3]?.dataset.boardTip.match(/([\d.]+)万人/)?.[1]);const h=Number(original[i*3+2]?.dataset.boardTip.match(/([\d.]+)万人/)?.[1]);return {name,diagnosed:Number.isFinite(a)?a:diagnosed,managed,assessed:managed*assess,high:Number.isFinite(h)?h:managed*rate}});chart.outerHTML=`<div class="home-disease-table"><div class="disease-table-head"><span>层级</span>${values.map(x=>`<span>${x.name}</span>`).join('')}</div>${[['确诊人数','diagnosed',null],['已建专档','managed','diagnosed'],['可评估风险','assessed','managed'],['高风险','high','assessed']].map(([label,key,base],row)=>`<div class="disease-table-row row-${row}"><span>${label}</span>${values.map(x=>`<div><strong>${x[key].toFixed(1)}</strong><small>万</small>${base?`<em>${base==='diagnosed'?'建档率':base==='managed'?'占专档':'占比'} ${(x[key]/Math.max(.0001,x[base])*100).toFixed(1)}%</em>`:''}</div>`).join('')}</div>`).join('')}<small class="disease-table-note">可评估风险人数为演示值</small></div>`}
    board.querySelectorAll('.home-coverage-composition .unified-coverage-legend>div').forEach(row=>{const percent=parseFloat(row.querySelector('small')?.textContent)||0;row.querySelector('.coverage-name')?.insertAdjacentHTML('afterend',`<i class="coverage-bar"><b style="width:${Math.min(100,percent)}%"></b></i>`)});
  }
  if(situationActive()){
    const p=populationData(),risk=homeRisk(currentNode()),assessed=p.managed*.5;
    const cards=[['专档患者数',p.managed.toFixed(1),'万人'],['风险分层人数',assessed.toFixed(1),'万人'],['高风险患者数',risk.high.toFixed(1),'万人'],['高风险患者占比',(risk.high/Math.max(.0001,p.managed)*100).toFixed(1),'%']];
    const kpis=board.querySelector('.situation-kpis');if(kpis)kpis.innerHTML=cards.map(([name,value,unit])=>`<div class="board-kpi"><strong>${value}<em class="board-kpi-unit">${unit}</em></strong><span>${name} <b class="metric-scope-tag">专</b></span></div>`).join('');
    const pathway=board.querySelector('.situation-pathway');if(pathway){pathway.className='situation-pathway situation-scope';pathway.innerHTML=scope}
    const left=board.querySelector('.board-stack:first-child'),right=board.querySelector('.board-stack:last-child'),matrix=left?.querySelector('.situation-risk-matrix')?.closest('.board-panel');
    [...(right?.children||[])].find(panel=>panel.querySelector('h2')?.textContent.trim()==='就诊流向')?.remove();
    if(matrix&&right)right.insertBefore(matrix,right.children[1]||null);
    const title=board.querySelector('.board-map .panel-head h2');if(title)title.textContent=`${currentNode()?.name||'浙江省'}高风险患者占比`;
    const label=board.querySelector('#mapMetricLabel');if(label)label.textContent='高风险患者占比';
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Final dashboard refinements shared by all four views.
const dashboardBeforeNovemberScopeUpdate=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeNovemberScopeUpdate();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const scope='<span><b>全</b> 全部确诊患者</span><span><b>专</b> 有专档的患者</span><span><b>一体化</b> 一体化管理的专档患者</span>';
  board.querySelector('.situation-scope')?.remove();
  let legend=board.querySelector('.board-scope-legend');
  if(!legend){legend=document.createElement('div');legend.className='board-scope-legend';board.querySelector('.board-title')?.append(legend)}
  legend.innerHTML=scope;
  const tag='<span class="metric-scope-tag">专</span>';
  if(situationActive()){
    const risk=board.querySelector('.home-risk-composition');
    if(risk){
      const content=risk.querySelector('.home-risk-content'),second=document.createElement('section');
      second.className='board-panel risk-disease-panel';second.innerHTML=`<h2>不同风险分级的病种分布 ${tag}</h2><div class="risk-disease-content"></div>`;
      const destination=second.querySelector('.risk-disease-content');
      ['.home-risk-subtitle','.home-risk-bars','.home-risk-note'].forEach(selector=>{const item=content.querySelector(selector);if(item)destination.append(item)});
      risk.querySelector('h2').innerHTML=`风险分级 ${tag}`;risk.after(second);
    }
    board.querySelectorAll('.board-stack:last-child .board-panel').forEach(panel=>{
      const h=panel.querySelector('h2');if(!h)return;
      if(h.textContent.includes('并发疾病负担'))panel.remove();
      else if(h.textContent.includes('高风险患者占比偏差榜'))h.insertAdjacentHTML('beforeend',` ${tag}`);
      else if(h.textContent.includes('风险分层')&&h.textContent.includes('叠加类型'))h.innerHTML=`风险 × 共病 ${tag}`;
    });
  }
  if(state.dashboardView==='construction'){
    const tier=board.querySelector('.clinic-tier-chart');
    if(tier){tier.querySelector('.chart-coverage-ring')?.remove();tier.querySelectorAll('.unified-coverage-legend>div').forEach(row=>{const percent=parseFloat(row.querySelector('small')?.textContent)||0;row.querySelector('.coverage-name')?.insertAdjacentHTML('afterend',`<i class="coverage-bar"><b style="width:${Math.min(100,percent)}%"></b></i>`)})}
    const frequency=board.querySelector('.clinic-frequency');
    if(frequency){const values=[2.2,2.5,2.6],labels=['全口径','专档','一体化'],colors=['#43bde1','#2e86dd','#f5ab4d'],y=v=>152-v*30;frequency.setAttribute('aria-label','三类人群人均就诊频率对比，演示数据');frequency.innerHTML=`<g class="construction-grid">${[0,1,2,3,4].map(v=>`<line x1="42" x2="355" y1="${y(v)}" y2="${y(v)}"/><text x="34" y="${y(v)+4}" text-anchor="end">${v}</text>`).join('')}</g>${values.map((v,i)=>{const x=100+i*100;return `<rect x="${x-16}" y="${y(v)}" width="32" height="${152-y(v)}" fill="${colors[i]}" data-board-tip="${labels[i]}人均就诊频率：${v.toFixed(1)} 次/人"/><text x="${x}" y="${y(v)-5}" text-anchor="middle">${v.toFixed(1)}</text><text x="${x}" y="175" text-anchor="middle">${labels[i]}</text>`}).join('')}`;board.querySelector('.clinic-frequency-note span')?.remove()}
    const scatter=board.querySelector('.clinic-scatter'),details=scatter?.querySelector('.clinic-scatter-details');
    scatter?.querySelectorAll('.clinic-scatter-tabs button').forEach(button=>button.textContent=button.textContent.replace('控制率',''));
    const svg=scatter?.querySelector('svg');if(svg){svg.setAttribute('viewBox','0 0 920 225');svg.insertAdjacentHTML('beforeend','<text class="scatter-axis-label" x="13" y="103" text-anchor="middle" transform="rotate(-90 13 103)">控制率</text><text class="scatter-axis-label" x="475" y="220" text-anchor="middle">一体化门诊覆盖率</text>')}
    if(details){const key=state.clinicScatterMetric||'bloodPressure',points=cities.map(city=>({name:city.name,x:constructionValue(city,'construction'),y:homeMapValue(city,key)})).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));if(points.length){const mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length;const groups=[['高覆盖低成效','#FFB020',p=>p.x>=mx&&p.y<my],['高覆盖高成效','#2E9DDD',p=>p.x>=mx&&p.y>=my],['低覆盖高成效','#69bdd7',p=>p.x<mx&&p.y>=my],['低覆盖低成效','#87A8C8',p=>p.x<mx&&p.y<my]];details.innerHTML=groups.map(([name,color,test])=>{const items=points.filter(test);return `<div class="clinic-scatter-group" style="--group-color:${color}"><div class="clinic-group-heading"><strong>${name}</strong><span>${items.length} 地市</span></div><div class="clinic-group-cities">${items.length?items.map(p=>`<div><span>${esc(p.name.replace(/市$/,''))}</span><b>${p.x.toFixed(1)}% <small>/ ${p.y.toFixed(1)}%</small></b></div>`).join(''):'<span>暂无</span>'}</div></div>`}).join('')}}
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Keep scope tags and the risk charts consistent across dashboard views.
const dashboardBeforeRiskChartUpdate=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeRiskChartUpdate();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.metric-scope-tag,.scope-tag,.board-scope-legend b').forEach(el=>{
    const value=el.textContent.trim();el.classList.add('scope-color-'+(value.startsWith('专')?'record':value.startsWith('一体化')?'integrated':'all'));
  });
  board.querySelector('.disease-table-note')?.remove();
  if(situationActive()){
    const p=populationData(),risk=homeRisk(currentNode());
    const levels=[['高风险',risk.high,'#ff5a5a'],['中风险',risk.middle,'#ffb020'],['低风险',risk.low,'#2e86ff']];
    const total=levels.reduce((sum,row)=>sum+row[1],0),content=board.querySelector('.home-risk-composition .home-risk-content');
    if(content){let offset=0;const stops=levels.map(([,value,color])=>{const start=offset;offset+=value/Math.max(total,.0001)*100;return `${color} ${start}% ${offset}%`}).join(',');content.innerHTML=`<div class="risk-donut" style="background:conic-gradient(${stops})" role="img" aria-label="风险分级占比"><div>风险分级</div></div><div class="risk-legend">${levels.map(([name,value,color])=>`<div><i style="background:${color}"></i><span>${name}</span><strong>${value.toFixed(1)} 万人</strong><b>${(value/Math.max(total,.0001)*100).toFixed(1)}%</b></div>`).join('')}<div><i style="background:#8190a3"></i><span>未知风险</span><strong>待接入</strong><b>--</b></div></div>`}
    const panel=board.querySelector('.risk-disease-panel');
    if(panel){const diseases=[['高血压',p.managedHigh,'#2e86ff'],['糖尿病',p.managedDiabetes,'#5fa9ff'],['慢阻肺',p.managedCopd,'#8fd0ff']],max=Math.max(...levels.map(([,v])=>diseases.reduce((s,d)=>s+d[1]*v/Math.max(p.managed,.0001),0)))*1.15,y=v=>150-v/Math.max(max,.0001)*120;
      panel.innerHTML=`<h2>风险 × 病种 <span class="metric-scope-tag scope-color-record">专</span></h2><div class="risk-chart-legend">${diseases.map(([name,,color])=>`<span><i style="background:${color}"></i>${name}</span>`).join('')}</div><svg class="risk-stacked-chart" viewBox="0 0 400 185" preserveAspectRatio="xMidYMid meet" role="img" aria-label="各风险分级的病种人数，单位万人，演示数据"><text x="4" y="12">万人</text>${[0,.5,1].map(t=>`<line x1="40" x2="385" y1="${y(max*t)}" y2="${y(max*t)}" stroke="#285675"/><text x="35" y="${y(max*t)+4}" text-anchor="end">${(max*t).toFixed(0)}</text>`).join('')}${levels.map(([name,value],i)=>{let acc=0;const sum=diseases.reduce((s,d)=>s+d[1]*value/Math.max(p.managed,.0001),0);return diseases.map(([d,v,color])=>{const amount=v*value/Math.max(p.managed,.0001),bottom=y(acc);acc+=amount;return `<rect x="${70+i*90}" y="${y(acc)}" width="36" height="${bottom-y(acc)}" fill="${color}" data-board-tip="${name} · ${d}：${amount.toFixed(1)}万人，占该风险病种人数 ${(amount/Math.max(sum,.0001)*100).toFixed(1)}%"><title>${name} · ${d}：${amount.toFixed(1)}万人，占比 ${(amount/Math.max(sum,.0001)*100).toFixed(1)}%</title></rect>`}).join('')}).join('')}${['高风险','中风险','低风险','未知'].map((name,i)=>`<text x="${88+i*90}" y="174" text-anchor="middle">${name}</text>`).join('')}<text x="358" y="142" text-anchor="middle">待接入</text></svg>`;
    }
  }
  if(state.dashboardView==='construction'){
    board.querySelectorAll('.clinic-frequency,.construction-line').forEach(svg=>svg.setAttribute('preserveAspectRatio','xMidYMid meet'));
    board.querySelector('.board-stack:last-child .construction-panel:first-child .construction-key')?.remove();
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();


let savedOutcomeMapHTML='';
const dashboardBeforeDecemberLayout=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeDecemberLayout();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(situationActive()){
    const p=populationData(),risk=homeRisk(currentNode()),assessed=p.managed*.5;
    const levels=[['高风险',risk.high,'#ef5358','需重点干预'],['中风险',risk.middle,'#ff9245','需随访管理'],['低风险',Math.max(0,assessed-risk.high-risk.middle),'#3385eb','常规管理'],['未知风险',Math.max(0,p.managed-assessed),'#637d95','未完成风险评估']];
    const content=board.querySelector('.home-risk-composition .home-risk-content');
    if(content)content.innerHTML=`<div class="risk-composition-strip">${levels.map(([name,v,c,note])=>`<div style="width:${v/p.managed*100}%;background:${c}" data-board-tip="${name}：${v.toFixed(1)}万人，占专档患者 ${(v/p.managed*100).toFixed(1)}%；${note}" title="${name}：${v.toFixed(1)}万人，占比 ${(v/p.managed*100).toFixed(1)}%">${(v/p.managed*100).toFixed(1)}%</div>`).join('')}</div><div class="risk-composition-rows">${levels.map(([name,v,c,note])=>`<div class="risk-composition-row" data-board-tip="${name}：${v.toFixed(1)}万人，占专档患者 ${(v/p.managed*100).toFixed(1)}%；${note}"><strong>${v.toFixed(1)}<small>万人</small></strong><div><span><i style="background:${c}"></i>${name} · ${note}</span><div class="risk-composition-track"><b style="width:${v/p.managed*100}%;background:${c}"></b></div></div><em>${(v/p.managed*100).toFixed(1)}%</em></div>`).join('')}</div>`;
    const chart=board.querySelector('.risk-stacked-chart');
    if(chart){const diseases=[['高血压',p.managedHigh,'#2e86ff'],['糖尿病',p.managedDiabetes,'#5fa9ff'],['慢阻肺',p.managedCopd,'#8fd0ff']],max=Math.max(...levels.map(([,v])=>diseases.reduce((s,d)=>s+d[1]*v/p.managed,0)))*1.15;chart.outerHTML=`<div class="responsive-risk-chart" role="img" aria-label="各风险分级的病种人数，单位万人"><div class="risk-chart-axis"><span>万人</span><span>${max.toFixed(0)}</span><span>${(max/2).toFixed(0)}</span><span>0</span></div><div class="risk-chart-plot">${levels.map(([name,v])=>`<div class="risk-chart-column"><div class="risk-chart-stack">${diseases.map(([d,n,c])=>{const amount=n*v/p.managed,sum=diseases.reduce((s,item)=>s+item[1]*v/p.managed,0);return `<div style="height:${amount/max*100}%;background:${c}" data-board-tip="${name} · ${d}：${amount.toFixed(1)}万人，占比 ${(amount/Math.max(sum,.0001)*100).toFixed(1)}%" title="${name} · ${d}：${amount.toFixed(1)}万人，占比 ${(amount/Math.max(sum,.0001)*100).toFixed(1)}%"></div>`}).reverse().join('')}</div><span>${name.replace('风险','')}</span></div>`).join('')}</div></div>`}
    const map=board.querySelector('.board-map .map-panel');if(map){const items=[`专档患者 ${p.managed.toFixed(1)} 万人，高风险患者 ${risk.high.toFixed(1)} 万人。`,`已完成风险评估 ${assessed.toFixed(1)} 万人，待评估 ${(p.managed-assessed).toFixed(1)} 万人。`,`高风险患者占专档患者 ${(risk.high/p.managed*100).toFixed(1)}%，请关注重点干预。`];map.insertAdjacentHTML('afterend',`<div class="situation-summary" data-items='${JSON.stringify(items)}'><b>慢病态势总结</b><span>${items[0]}</span></div>`)}
  }
  if(state.dashboardView==='construction'){
    const cards=board.querySelector('.construction-kpis');const service=[...cards.querySelectorAll('.board-kpi')].find(x=>x.textContent.includes('一体化门诊服务人次'));
    if(service){const primary=visitsForSelection().primary,integrated=parseFloat(service.querySelector('strong')?.textContent)||0;service.insertAdjacentHTML('beforeend',`<small class="clinic-visit-share">占基层就诊人次 ${primary? (integrated/primary*100).toFixed(2):'0.00'}%</small>`);service.insertAdjacentHTML('afterend',`<div class="board-kpi"><strong>${(primary/Math.max(populationData().diagnosed,.0001)).toFixed(2)}<em class="board-kpi-unit">次/人</em></strong><span>人均就诊频率</span></div>`)}
    const svg=board.querySelector('.clinic-frequency');if(svg){const values=[2.2,2.5,2.6],names=['全口径','专档','一体化'],colors=['#43bde1','#2e86dd','#f5ab4d'];svg.outerHTML=`<div class="frequency-responsive" role="img" aria-label="三类人群人均就诊频率对比，单位次每人"><div class="frequency-scale"><span>4</span><span>3</span><span>2</span><span>1</span><span>0</span></div><div class="frequency-plot">${values.map((v,i)=>`<div><section><b style="height:${v/4*100}%;background:${colors[i]}"><span>${v.toFixed(1)}</span></b></section><span>${names[i]}</span></div>`).join('')}</div></div>`}
    const scatter=board.querySelector('.clinic-scatter'),map=board.querySelector('.board-columns>.board-map');if(scatter&&map){map.classList.add('clinic-map-column');map.append(scatter)}
  }
  if(state.dashboardView==='outcomes'){
    board.querySelectorAll('.outcome-region-benchmark').forEach(el=>el.remove());
    const cols=board.querySelector('.outcome-layout'),comparison=cols?.querySelector('.outcome-comparison'),risk=cols?.querySelector('.outcome-risk'),regions=cols?.querySelector('.outcome-regions'),savedMap=cols?.querySelector('.board-map')?.outerHTML||'';
    savedOutcomeMapHTML=savedMap;
    if(cols&&comparison&&risk&&regions){const rows=[...comparison.children],metrics=[['血压',[88.6,92.3,95.7],[62.4,68.9,74.5]],['血糖',[82.4,89.1,93.6],[48.7,55.3,62.1]],['糖化血红蛋白',[65.3,74.8,83.4],[36.5,42.6,49.6]],['血脂',[76.8,84.5,90.2],[41.2,47.6,54.3]]],groups=['全','专','一体化'];rows.forEach((row,index)=>{row.className='outcome-metric-column';row.innerHTML=metrics.map(([name,detection,control])=>`<section class="outcome-detail-panel outcome-mini-panel"><h2>${name}${index?'控制率':'检测率'}</h2><div class="outcome-mini-bars">${(index?control:detection).map((v,i)=>`<div><span class="metric-scope-tag scope-color-${['all','record','integrated'][i]}">${groups[i]}</span><div class="outcome-mini-track"><i class="bar-${i}" style="width:${v}%"></i></div><strong>${v.toFixed(1)}%</strong></div>`).join('')}</div></section>`).join('')});regions.querySelectorAll('.outcome-rank-chart').forEach(chart=>{chart.classList.remove('auto-scroll');const track=chart.querySelector('.scroll-track');[...track.children].slice(11).forEach(el=>el.remove())});cols.replaceChildren(rows[0],rows[1],risk,regions);cols.classList.add('outcome-four-columns')}
  }
  if(state.dashboardView==='outcomes'&&savedOutcomeMapHTML)root.querySelector('.outcome-layout')?.insertAdjacentHTML('beforeend',`<template class="saved-outcome-map">${savedOutcomeMapHTML}</template>`);
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();
setInterval(()=>{const el=document.querySelector('.situation-summary');if(!el)return;const items=JSON.parse(el.dataset.items||'[]');if(!items.length)return;const i=(Number(el.dataset.index||0)+1)%items.length;el.dataset.index=i;el.querySelector('span').textContent=items[i]},5000);

const dashboardBeforeNovemberFeedback=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeNovemberFeedback();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(situationActive()){
    const ranking=board.querySelector('.situation-risk-ranking');
    if(ranking){ranking.querySelector('.risk-ranking-caption')?.remove();ranking.querySelector('h2')?.insertAdjacentHTML('afterend','<div class="risk-ranking-heading"><span>地市</span><span>← 低于均值　|　高于均值 →</span><span>偏差 / 值</span></div>');ranking.querySelectorAll('.risk-ranking-row').forEach(row=>{const value=row.querySelector('.risk-ranking-value');if(value)row.append(value)})}
    const p=populationData(),risk=homeRisk(currentNode()),assessed=p.managed*.5;
    const levels=[risk.high,risk.middle,Math.max(0,assessed-risk.high-risk.middle),Math.max(0,p.managed-assessed)];
    const diseases=[['高血压',p.managedHigh],['糖尿病',p.managedDiabetes],['慢阻肺',p.managedCopd]];
    board.querySelectorAll('.risk-chart-stack').forEach((stack,i)=>{
      const total=diseases.reduce((sum,item)=>sum+item[1]*levels[i]/p.managed,0);
      const tip=`${['高风险','中风险','低风险','未知风险'][i]}病种分布\n`+diseases.map(([name,value])=>{const amount=value*levels[i]/p.managed;return `${name}：${Math.round(amount*10000).toLocaleString()}人，${(amount/Math.max(total,.0001)*100).toFixed(2)}%`}).join('\n');
      stack.dataset.boardTip=tip;stack.title=tip;stack.querySelectorAll('[data-board-tip]').forEach(el=>{el.removeAttribute('data-board-tip');el.removeAttribute('title')});
      [...stack.children].forEach((segment,index)=>{segment.innerHTML=`<span>${(diseases[diseases.length-1-index][1]*levels[i]/p.managed).toFixed(1)}</span>`});
    });
  }
  if(state.dashboardView==='construction'){
    board.querySelectorAll('.construction-panel .home-map-link').forEach(button=>button.remove());
    const nodes=board.querySelector('.construction-nodes');
    if(nodes){const rows=[...nodes.children],monitor=rows.find(row=>row.textContent.includes('规范监测率')),follow=rows.find(row=>row.textContent.includes('诊中随访完成率'));if(monitor&&follow){follow.querySelector('span').textContent='诊中随访率';nodes.insertBefore(follow,monitor)}}
    const panel=board.querySelector('.clinic-scatter'),svg=panel?.querySelector('svg'),details=panel?.querySelector('.clinic-scatter-details');
    if(svg&&details){
      const title=panel.querySelector('.clinic-scatter-title');
      if(title) title.textContent='一体化门诊覆盖率 × 控制率';
      panel.querySelector('h2 small')?.remove();
      svg.querySelector('line[stroke="#f5a52f"]')?.remove();
      const key=state.clinicScatterMetric||'bloodPressure',points=clinicScatterPoints(key);
      const mx=constructionValue(null,'construction'),my=clinicScatterValue(null,key);
      const groups=[['高覆盖低成效','#f4a64c',p=>p.x>=mx&&p.y<my],['低覆盖高成效','#75bff2',p=>p.x<mx&&p.y>=my],['高覆盖高成效','#4dcbbb',p=>p.x>=mx&&p.y>=my],['低覆盖低成效','#91a9c1',p=>p.x<mx&&p.y<my]];
      svg.querySelectorAll('g[data-board-tip]').forEach((g,i)=>{const p=points[i],circle=g.querySelector('circle'),label=g.querySelector('text');if(!p)return;circle?.setAttribute('fill',groups.find(group=>group[2](p))[1]);if(label){label.textContent=p.name.replace(/(?:街道|镇)社区卫生服务中心$/,'').replace(/市$/,'');label.setAttribute('y',Number(circle.getAttribute('cy'))-13)}});
      details.className='clinic-quadrant-legend';
      const unit=clinicScatterUnitLabel();
      details.innerHTML=groups.map(([name,color,test],index)=>`<button type="button" data-clinic-quadrant="${index}"><i style="background:${color}"></i><span>${name}</span><b>${points.filter(test).length} ${unit}</b></button>`).join('');
    }
  }
  board.querySelector('.home-control-strip .home-map-link')?.remove();
  if(state.dashboardView==='outcomes'){
    board.querySelectorAll('.outcome-mini-bars .metric-scope-tag').forEach(tag=>{tag.textContent=({'全':'确诊患者','全口径':'确诊患者','专':'专档患者','专档':'专档患者','一体化':'一体化管理患者'})[tag.textContent]||tag.textContent;tag.classList.add('outcome-population-label')});
    board.querySelectorAll('.outcome-mini-panel h2').forEach(heading=>heading.insertAdjacentHTML('beforeend','<span class="outcome-goal-caption">目标 80%</span>'));
    board.querySelectorAll('.outcome-rank-chart-row').forEach(row=>{const match=row.title.match(/较省平均 ([+-]?[\d.]+)/);if(match){const delta=Number(match[1]);row.querySelector('strong').insertAdjacentHTML('beforebegin',`<b class="rank-delta ${delta>=0?'positive':'negative'}">${delta>=0?'+':''}${delta.toFixed(1)}</b>`)}});
    board.querySelectorAll('.outcome-regions .outcome-rank-chart').forEach(chart=>{chart.insertAdjacentHTML('beforebegin','<div class="outcome-rank-heading"><span>地市</span><span>← 低于均值　|　高于均值 →</span><span>偏差 / 值</span></div>')});
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Keep metric scope labels next to the corresponding construction headings.
const dashboardBeforeClinicScopeTags=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeClinicScopeTags();
  if(state.dashboardView==='construction'){
    root.querySelectorAll('.construction-panel h2').forEach(heading=>{
      if(/^(医防融合入径率|路径节点执行率)/.test(heading.textContent.trim())&&!heading.querySelector('.metric-scope-tag')) heading.insertAdjacentHTML('beforeend','<span class="metric-scope-tag scope-color-integrated">一体化</span>');
    });
    const scatter=root.querySelector('.clinic-scatter');
    const frequency=root.querySelector('.frequency-responsive')?.closest('.construction-panel');
    if(scatter&&frequency) frequency.replaceWith(scatter);
    const title=root.querySelector('.clinic-scatter-title');
    if(title&&!title.querySelector('.metric-scope-tag'))title.insertAdjacentHTML('beforeend','<span class="metric-scope-tag scope-color-record">专</span>');
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Only show regional values that come from the same metric as the selected total.
showMetricDetail=function(el){
  const panel=el.closest('.board-panel,.board-kpi');
  const labelNode=el.closest('.board-kpi')?.querySelector('span')||el.closest('.construction-nodes > div')?.querySelector('span')||panel?.querySelector('h2');
  const labelCopy=labelNode?.cloneNode(true);labelCopy?.querySelectorAll('.metric-scope-tag,.scope-tag,button').forEach(node=>node.remove());
  const label=labelCopy?.textContent.trim()||'指标';
  const resolver=item=>{
    const report=clinicReportRow(item);
    if(label.includes('一体化门诊总数'))return report?`${report[1]+report[2]+report[3]} 家`:null;
    if(label.includes('一体化门诊覆盖率'))return report?`${constructionValue(item,'construction').toFixed(2)}%`:null;
    if(label.includes('常住人口')){const record=residentForNode(item);return record?`${record[0]} 万人（${record[1]}）`:null}
    if(label==='医防融合入径率')return `${dashboardRate(item,'entry').toFixed(1)}%`;
    if(label==='路径节点总执行率')return `${constructionValue(item,'monitoring').toFixed(1)}%`;
    return null;
  };
  const dialog=document.createElement('dialog');dialog.className='metric-detail-dialog';document.body.append(dialog);
  dialog.innerHTML=`<header><h2>${esc(label)} · 地市明细</h2><button type="button" data-detail-close aria-label="关闭">×</button></header><div class="metric-detail-table"><div class="metric-detail-row metric-detail-heading"><span>地市</span><span>对应数值</span></div>${cities.map(city=>`<div class="metric-detail-row"><span>${esc(city.name)}</span><strong>${esc(resolver(city)||'待接入')}</strong></div>`).join('')}</div>`;
  dialog.querySelector('[data-detail-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
};

// Reflow chart coordinates to the available space without stretching labels or markers.
const chartGeometry = new WeakMap();
const chartResizeObserver = new ResizeObserver(entries => entries.forEach(({target: svg, contentRect}) => {
  if (!contentRect.width || !contentRect.height) return;
  let source = chartGeometry.get(svg);
  if (!source) {
    if(svg.closest('.clinic-scatter'))svg.querySelectorAll('.construction-grid text[text-anchor="middle"]').forEach(text=>text.dataset.scatterTick='x');
    const box = svg.getAttribute('viewBox').trim().split(/\s+/).map(Number);
    const elements = [...svg.querySelectorAll('line, text, circle, rect, polyline, polygon')].map(el => ({el, attrs: Object.fromEntries(['x','x1','x2','cx','width','y','y1','y2','cy','height','points'].filter(name => el.hasAttribute(name)).map(name => [name, el.getAttribute(name)]))}));
    source = {box, elements}; chartGeometry.set(svg, source);
  }
  const [left, top, width, height] = source.box, sx = contentRect.width / width, sy = contentRect.height / height;
  svg.setAttribute('viewBox', `0 0 ${contentRect.width} ${contentRect.height}`);
  source.elements.forEach(({el, attrs}) => Object.entries(attrs).forEach(([name, value]) => {
    if (name === 'points') {
      el.setAttribute(name, value.trim().split(/\s+/).map(pair => {const [x,y] = pair.split(',').map(Number); return `${(x-left)*sx},${(y-top)*sy}`}).join(' '));
    } else if (['x','x1','x2','cx'].includes(name)) el.setAttribute(name, svg.closest('.clinic-scatter')?80+(Number(value)-left)*(contentRect.width-80)/width:(Number(value)-left)*sx);
    else if (['y','y1','y2','cy'].includes(name)) el.setAttribute(name, svg.closest('.clinic-scatter')?32+(Number(value)-30)*Math.max(.1,(contentRect.height-82)/145):(Number(value)-top)*sy);
    else el.setAttribute(name, Number(value)*(svg.closest('.clinic-scatter')?(name === 'width'?(contentRect.width-46)/width:Math.max(.1,(contentRect.height-82)/145)):(name === 'width' ? sx : sy)));
  }));
  svg.querySelectorAll('path').forEach(path => path.setAttribute('transform', `scale(${sx} ${sy}) translate(${-left} ${-top})`));
  const axisLabels=svg.querySelectorAll('.scatter-axis-label');
  if(axisLabels.length===2){
    const y=axisLabels[0], x=axisLabels[1];
    const axisX=20,axisY=contentRect.height*.45;
    y.setAttribute('x', String(axisX)); y.setAttribute('y', String(axisY));
    y.removeAttribute('transform');
    x.setAttribute('y', String(contentRect.height-4));
  }
  if(svg.closest('.clinic-scatter')){
    const gridLine=svg.querySelector('.construction-grid line');
    const gridX=Number(gridLine?.getAttribute('x1'));
    const yTicks=[...svg.querySelectorAll('.construction-grid text:not([data-scatter-tick="x"])')];
    let yTickRight=Number.isFinite(gridX)?gridX-8:0;
    if(axisLabels[0]){
      const label=axisLabels[0],panel=svg.closest('.clinic-scatter'),matrix=svg.getScreenCTM();
      label.setAttribute('text-anchor','start');
      label.textContent='控制率';
      label.setAttribute('y','0');
      label.setAttribute('dominant-baseline','hanging');
      if(panel && matrix){
        const panelRect=panel.getBoundingClientRect();
        const desiredX=panelRect.left+12*panelRect.width/panel.offsetWidth;
        const localX=(desiredX-matrix.e)/matrix.a;
        label.setAttribute('x',String(localX));
        const correction=localX-label.getBBox().x;
        label.setAttribute('x',String(localX+correction));
        const yValues=[...yTicks,svg.querySelectorAll('.scatter-benchmark-label')[1]].filter(Boolean);
        const widest=Math.max(0,...yValues.map(text=>text.getBBox().width));
        yTickRight=localX+widest;
      }
    }
    yTicks.forEach(text=>{text.setAttribute('text-anchor','end');text.setAttribute('x',String(yTickRight))});
    if(Number.isFinite(gridX)){
      const newLeft=yTickRight+8, right=contentRect.width;
      const scale=(right-newLeft)/Math.max(1,right-gridX);
      const mapX=value=>newLeft+(Number(value)-gridX)*scale;
      const excluded=new Set([...yTicks,...axisLabels,svg.querySelectorAll('.scatter-benchmark-label')[1]]);
      svg.querySelectorAll('line,text,circle,rect,polyline,polygon').forEach(el=>{
        if(excluded.has(el))return;
        ['x','x1','x2','cx'].forEach(attr=>{if(el.hasAttribute(attr))el.setAttribute(attr,String(mapX(el.getAttribute(attr))))});
        if(el.hasAttribute('width'))el.setAttribute('width',String(Number(el.getAttribute('width'))*scale));
        if(el.hasAttribute('points'))el.setAttribute('points',el.getAttribute('points').trim().split(/\s+/).map(pair=>{const [x,y]=pair.split(',');return `${mapX(x)},${y}`}).join(' '));
      });
    }
    svg.querySelectorAll('g[data-board-tip]').forEach(group=>{const circle=group.querySelector('circle'),label=group.querySelector('text');if(!circle||!label)return;const cx=Number(circle.getAttribute('cx')),cy=Number(circle.getAttribute('cy'));label.setAttribute('x',cx);label.setAttribute('text-anchor',cx>contentRect.width-55?'end':cx<75?'start':'middle');label.setAttribute('y',cy<30?cy+18:cy-13)});
    const ticks=[...svg.querySelectorAll('.construction-grid text[data-scatter-tick="x"]')];
    if(ticks.length){
      ticks[0].setAttribute('text-anchor','start');ticks[ticks.length-1].setAttribute('text-anchor','end');
      const bottom=Math.max(...[...svg.querySelectorAll('.construction-grid line')].map(line=>Number(line.getAttribute('y1'))));
      ticks.forEach(t=>{t.removeAttribute('dy');t.setAttribute('dominant-baseline','hanging');t.setAttribute('y',String(bottom+8))});
      const benchmarks=svg.querySelectorAll('.scatter-benchmark-label');
      if(benchmarks[0]){benchmarks[0].setAttribute('y',String(bottom+8));benchmarks[0].setAttribute('dominant-baseline','hanging')}
      if(benchmarks[1]){benchmarks[1].setAttribute('x',String(yTickRight));benchmarks[1].setAttribute('text-anchor','end')}
      if(axisLabels[1]){const tickBottom=Math.max(...[...ticks,benchmarks[0]].filter(Boolean).map(t=>{const box=t.getBBox();return box.y+box.height}));axisLabels[1].setAttribute('x',String((Number(ticks[0].getAttribute('x'))+Number(ticks[ticks.length-1].getAttribute('x')))/2));axisLabels[1].setAttribute('y',String(tickBottom+8));axisLabels[1].setAttribute('dominant-baseline','hanging');axisLabels[1].setAttribute('text-anchor','middle')}
    }
  } else {
    svg.querySelectorAll('.construction-grid text').forEach(text=>{text.setAttribute('text-anchor','start');text.setAttribute('x','12')});
  }
}));
function observeClinicCharts() {
  document.querySelectorAll('.construction-board .clinic-scatter-body svg, .construction-board .board-stack:last-child .construction-panel:first-child .construction-line').forEach(svg => chartResizeObserver.observe(svg));
}
new MutationObserver(observeClinicCharts).observe(document.querySelector('#app') || document.body, {childList:true, subtree:true});
observeClinicCharts();

// Keep map annotations and summary comparisons tied to the province benchmark.
const renderMapBeforeNovemberReview=renderProvinceMap;
renderProvinceMap=function(){
  renderMapBeforeNovemberReview();
  if(state.page!=='dashboard')return;
  const avg=dashboardMapBenchmark(),head=document.querySelector('#dashboardBoard .board-map .panel-head');
  if(!head||!Number.isFinite(avg))return;
  const title=head.querySelector('h2');
  if(title)title.textContent=title.textContent.replace(/(?:偏差热力图|（VS省均值偏差）)$/,'');
  let note=head.parentElement.querySelector('.map-benchmark-note');
  if(!note){note=document.createElement('div');note.className='map-benchmark-note';head.after(note)}
  note.innerHTML=`<span>各区域值VS省均值偏差</span><small>省均值为 ${avg.toFixed(2)}%</small>`;
  if(homeView()&&state.mapMetric==='comorbidity')document.querySelector('#mapStage .benchmark-explanation')?.remove();
};
const dashboardBeforeNovemberReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeNovemberReview();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  if(homeView()){
    board.querySelectorAll('.board-kpi > span').forEach(el=>{if(el.firstChild?.nodeType===Node.TEXT_NODE)el.firstChild.nodeValue=el.firstChild.nodeValue.replace('重点慢病人数','全口径患者数')});
    board.querySelectorAll('.board-ticker span').forEach(el=>el.textContent='概览总结');
    board.querySelectorAll('.board-scope-legend span').forEach(el=>{el.innerHTML=el.innerHTML.replace('全部确诊患者','全口径患者')});
    const table=board.querySelector('.home-disease-table');if(table)table.innerHTML=table.innerHTML.replace(/已建档 · 专档/g,'已建专档').replace(/占确诊/g,'建档率').replace(/占可评估/g,'占比');
    const bars=board.querySelector('.situation-bars'),summary=bars?.querySelector('p');
    if(summary){const m=summary.textContent.match(/单病\s*([\d.]+万人).*共病\s*([\d.]+万人)/);if(m){summary.textContent=`共病 ${m[2]}，单病 ${m[1]}`;bars.prepend(summary)}}
    board.querySelectorAll('.home-target-item').forEach(item=>{const goal=item.querySelector('.home-target-goal'),track=item.querySelector('.home-target-track');if(goal&&track){goal.style.left=goal.style.width;goal.style.width='2px';goal.setAttribute('aria-hidden','true')}});
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
showHomeSummary=function(){
  const names=rows=>rows.length?rows.map(row=>esc(row.name)).join('、'):'无';
  const section=(title,key,highest)=>{
    const average=homeMapValue(null,key),rows=cities.map(city=>({name:city.name,value:homeMapValue(city,key)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>highest?b.value-a.value:a.value-b.value);
    const delta=row=>Math.round((row.value-average)*100),below=rows.filter(r=>delta(r)<0),equal=rows.filter(r=>delta(r)===0),above=rows.filter(r=>delta(r)>0),focus=highest?above:below,other=highest?below:above;
    return `<section><h3>${title}<span class="summary-average">省均值：${average.toFixed(2)}%</span></h3><p class="summary-action">${title}${highest?'最大':'最低'}的 ${focus.length} 个区域，${highest?'高于':'低于'}省均值${focus.length?`，分别是<span class="summary-highlight">${names(focus)}</span>`:''}；等于省均值 ${equal.length} 个区域；${highest?'低于':'高于'}省均值 ${other.length} 个区域。</p><details><summary>查看具体明细</summary><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>区域名称</th><th>省均值</th><th>区域${key==='comorbidity'?'共病患者占比':'一体化门诊覆盖率'}</th><th>与省均值偏差</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td><td>${average.toFixed(2)}%</td><td>${r.value.toFixed(2)}%</td><td>${delta(r)>0?'+':''}${(delta(r)/100).toFixed(2)} PP</td></tr>`).join('')}</tbody></table></div></details></section>`;
  };
  const controls=[['血压控制率','bloodPressure'],['血糖控制率','bloodGlucose'],['血脂控制率','bloodLipids'],['糖化血红蛋白控制率','hba1cTarget']];
  const chart=(label,key)=>{const avg=homeMapValue(null,key),rows=cities.map(city=>({name:city.name,value:homeMapValue(city,key)})).sort((a,b)=>b.value-a.value),max=Math.max(1,...rows.map(r=>Math.abs(r.value-avg))),extent=max/0.96;return `<details ${key==='bloodPressure'?'open':''}><summary>${label} · 省均 ${avg.toFixed(2)}%</summary><div class="summary-rank-head"><span>地市</span><span>低于省均　│　高于省均</span><span>偏差</span><span>区域值</span></div>${rows.map(r=>{const d=r.value-avg;return `<div class="summary-rank-row"><span>${esc(r.name)}</span><div class="summary-rank-track" title="${esc(r.name)}：${r.value.toFixed(2)}%，省均 ${avg.toFixed(2)}%，偏差 ${d>=0?'+':''}${d.toFixed(2)} 个百分点"><i class="${d>=0?'above':'below'}" style="width:${Math.abs(d)/max*48}%"></i></div><b class="${d>=0?'above':'below'}">${d>=0?'+':''}${d.toFixed(2)}</b><strong>${r.value.toFixed(2)}%</strong></div>`}).join('')}<div class="summary-rank-axis"><span></span><div>${[0,.25,.5,.75,1].map(t=>`<span>${(avg-extent+2*extent*t).toFixed(2)}%</span>`).join('')}</div></div></details>`};
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';dialog.innerHTML=`<header><h2>浙江省 · 概览总结</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body">${section('共病负担','comorbidity',true)}${section('一体化门诊覆盖率','construction',false)}<section><h3>控制率</h3>${controls.map(([label,key])=>chart(label,key)).join('')}</section></div>`;
  document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
};
render();


// Apply one province-relative color scale to both map renderers.
if(originalHomeMapMount) window.ZhejiangMap3D.mount=function(host,geo,values,options){
  if(state.page!=='dashboard')return originalHomeMapMount(host,geo,values,options);
  const average=dashboardMapBenchmark();
  if(!Number.isFinite(average))return originalHomeMapMount(host,geo,values,options);
  const extent=Math.max(.01,...values.map(item=>Math.abs(item.value-average)).filter(Number.isFinite));
  const direction=mapHigherIsWorse()?1:-1;
  return originalHomeMapMount(host,geo,[...values.map(item=>({...item,value:Number.isFinite(item.value)?(item.value-average)*direction:item.value})),{name:'__min__',value:-extent},{name:'__max__',value:extent}],options);
};
const renderMapForConsistentColors=renderProvinceMap;
renderProvinceMap=function(){
  renderMapForConsistentColors();
  if(state.page==='dashboard'&&state.mapView==='2d'&&provinceChart){
    const average=dashboardMapBenchmark(),values=(provinceChart.getOption().series[0]?.data||[]).map(x=>x.value).filter(Number.isFinite);
    if(Number.isFinite(average)&&values.length){const extent=Math.max(.01,...values.map(v=>Math.abs(v-average))),colors=['#2186d0','#55a8df','#c3d3cf','#ed9d64','#e65c58'];provinceChart.setOption({visualMap:{min:average-extent,max:average+extent,inRange:{color:mapHigherIsWorse()?colors:colors.slice().reverse()}}});}
  }
};
const dashboardForNovemberGrid=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardForNovemberGrid();
  const board=root.querySelector('#dashboardBoard');
  if(board&&situationActive()){
    const p=populationData(),risk=homeRisk(currentNode()),assessed=p.managed*.5,low=Math.max(0,assessed-risk.high-risk.middle);
    const cards=board.querySelector('.situation-kpis'),fourth=cards?.children[3];
    if(fourth){fourth.querySelector('strong').innerHTML=`${risk.middle.toFixed(1)}<em class="board-kpi-unit">万人</em>`;fourth.querySelector('span').innerHTML='中风险患者数 <b class="metric-scope-tag">专</b>';fourth.insertAdjacentHTML('afterend',`<div class="board-kpi"><strong>${low.toFixed(1)}<em class="board-kpi-unit">万人</em></strong><span>低风险患者数 <b class="metric-scope-tag">专</b></span></div>`)}
    const chart=board.querySelector('.responsive-risk-chart');
    if(chart){const diseases=[['高血压',p.managedHigh],['糖尿病',p.managedDiabetes],['慢阻肺',p.managedCopd]],levels=[['高风险',risk.high],['中风险',risk.middle],['低风险',low]];chart.previousElementSibling?.classList.contains('risk-chart-legend')&&chart.previousElementSibling.remove();chart.outerHTML=`<div class="situation-risk-matrix risk-disease-matrix"><span></span>${levels.map(([name])=>`<b>${name}</b>`).join('')}${diseases.map(([name,total])=>`<span>${name}</span>${levels.map(([level,n],i)=>{const value=total*n/Math.max(p.managed,.0001),pct=value/Math.max(total,.0001)*100;return `<div class="risk-cell risk-cell-${i}" title="${name} · ${level}：${value.toFixed(1)}万人，占该病种专档患者 ${pct.toFixed(1)}%"><strong>${value.toFixed(1)}万</strong><small>${pct.toFixed(1)}%</small></div>`}).join('')}`).join('')}</div>`}
    board.querySelectorAll('.risk-composition-row span').forEach(el=>{el.innerHTML=el.innerHTML.replace(/ · (需重点干预|需随访管理|常规管理|未完成风险评估)/,'')});
    const ranking=board.querySelector('.situation-risk-ranking'),rows=ranking?.querySelector('.risk-ranking-rows');
    if(rows){const avg=homeMapValue(null,'highRisk'),deltas=[...rows.querySelectorAll('.risk-ranking-row strong')].map(el=>Math.abs(parseFloat(el.textContent)||0)),extent=Math.max(.01,...deltas)/.9;rows.insertAdjacentHTML('afterend',`<div class="risk-ranking-axis"><span></span><div>${[0,.25,.5,.75,1].map(t=>`<span>${(avg-extent+2*extent*t).toFixed(1)}%</span>`).join('')}</div></div>`)}
  }
  root.querySelectorAll('.metric-scope-tag,.scope-tag,.board-scope-legend b').forEach(tag=>{if(tag.textContent.trim()==='专')tag.classList.add('scope-color-record')});
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Apply the same detail and comparison conventions across dashboard views.
const dashboardBeforeDetailReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeDetailReview();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.home-target-item').forEach(row=>{const value=row.querySelector('.home-target-actual'),name=row.querySelector('.home-target-label span')?.textContent.trim();if(value&&name){value.classList.add('metric-detail-trigger');value.dataset.detailLabel=`${name}控制率`;value.setAttribute('role','button');value.setAttribute('tabindex','0');value.setAttribute('aria-label',`${name}控制率，查看区域明细`)}});
  board.querySelectorAll('.home-population-distribution .situation-bars > div').forEach((row,i)=>{const value=row.querySelector('strong');if(value&&i===0)value.dataset.detailLabel='3病叠加人数'});
  board.querySelectorAll('.unified-coverage-legend > div').forEach(row=>{const name=row.querySelector('.coverage-name,.clinic-photo-link')?.textContent.trim(),value=row.querySelector('.coverage-count strong');if(value&&name)value.dataset.detailLabel=name});
  const key=state.clinicScatterMetric||'bloodPressure',points=clinicScatterPoints(key),provinceX=constructionValue(null,'construction'),provinceY=clinicScatterValue(null,key);
  board.querySelectorAll('.clinic-scatter svg g[data-board-tip]').forEach((g,i)=>{const p=points[i];if(!p){g.remove();return}g.dataset.tipRows=JSON.stringify([p.name,['覆盖率',`${p.x.toFixed(2)}%`],['覆盖率省均值',`${provinceX.toFixed(2)}%`],['控制率',`${p.y.toFixed(2)}%`],['控制率省均值',`${provinceY.toFixed(2)}%`]]);const label=g.querySelector('text');if(label&&/第\d+(?:社区卫生服务中心|乡镇卫生院)/.test(p.name))label.textContent=p.name.replace(/^.*?(?:市|区|县)/,'').replace(/（演示）/,'')});
  return root.innerHTML;
};
pages.dashboard=dashboard;
const showModalBeforeDetailReview=HTMLDialogElement.prototype.showModal;
HTMLDialogElement.prototype.showModal=function(){
  if(this.matches('.home-summary-dialog:not(.clinic-quadrant-dialog)')){
    this.querySelectorAll('.summary-detail-table').forEach(table=>{const headers=[...table.querySelectorAll('thead th')],index=headers.findIndex(th=>th.textContent.trim()==='省均值');if(index>=0)table.querySelectorAll('tr').forEach(row=>row.children[index]?.remove())});
    this.querySelectorAll('section').forEach(section=>{const table=section.querySelector('.summary-detail-table'),average=Number(section.querySelector('.summary-average')?.textContent.match(/[\d.]+/)?.[0]),action=section.querySelector('.summary-action');if(!table||!action||!Number.isFinite(average))return;const rows=[...table.querySelectorAll('tbody tr')].map(row=>({name:row.cells[0]?.textContent.trim(),value:parseFloat(row.cells[1]?.textContent)})).filter(row=>row.name&&Number.isFinite(row.value));const groups=[['高于',rows.filter(r=>Math.round((r.value-average)*100)>0)],['等于',rows.filter(r=>Math.round((r.value-average)*100)===0)],['低于',rows.filter(r=>Math.round((r.value-average)*100)<0)]];action.innerHTML=groups.map(([name,items])=>`${name}省均值的有 ${items.length} 个区域${items.length?`，分别是 ${items.map(item=>esc(item.name)).join('、')}`:''}。`).join('<br>')});
    this.querySelectorAll('h3').forEach(h=>{if(h.firstChild?.nodeType===Node.TEXT_NODE)h.firstChild.nodeValue=h.firstChild.nodeValue.replace('共病负担','共病患者占确诊患者的比例')});
  }
  return showModalBeforeDetailReview.call(this);
};
render();

// Apply the latest dashboard annotations after the existing view-specific renderers.
const dashboardBeforeLatestAnnotations=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeLatestAnnotations();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.board-kpis .board-kpi').forEach(card=>{
    const label=card.querySelector(':scope > span'),value=card.querySelector(':scope > strong');
    if(label&&value)card.insertBefore(label,value);
    const tag=label?.querySelector('.metric-scope-tag,.scope-tag');if(tag)card.append(tag);
  });
  board.querySelectorAll('.situation-risk-matrix:not(.risk-disease-matrix)').forEach(matrix=>{
    const children=[...matrix.children];
    if(children.length===16){matrix.replaceChildren(...[children[0],children[3],children[2],children[1],...Array.from({length:3},(_,i)=>{const row=children.slice(4+i*4,8+i*4);return [row[0],row[3],row[2],row[1]]}).flat()]);}
  });
  if(state.dashboardView==='construction'){
    const title=board.querySelector('.clinic-scatter-title');if(title){const tag=title.querySelector('.metric-scope-tag');title.textContent='覆盖率 × 控制率';if(tag)title.append(tag)}
    const map=board.querySelector('.board-map .map-panel'),metrics=clinicMetrics(currentNode());
    if(map){const items=[`一体化门诊 ${metrics.built} 家，覆盖基层机构 ${(metrics.built/Math.max(1,metrics.eligible)*100).toFixed(2)}%。`,`一体化门诊服务 ${(visitsForSelection().primary*.6).toFixed(1)} 万人次。`,`基本保障类门诊 ${homeTierCounts(currentNode())[0]} 家。`];map.insertAdjacentHTML('afterend',`<div class="situation-summary clinic-summary" data-items='${JSON.stringify(items)}'><b>一体化门诊总结</b><span>${items[0]}</span></div>`)}
    const svg=board.querySelector('.board-stack:last-child .construction-panel:first-child .construction-line');
    if(svg){const circles=[...svg.querySelectorAll('circle')],points=circles.map(c=>Number(c.dataset.boardTip?.match(/([\d.]+)%/)?.[1])).filter(Number.isFinite);if(points.length){const min=Math.min(...points),max=Math.max(...points),step=Math.max(1,Math.ceil(Math.max(max-min,5)/4/5)*5),bottom=Math.max(0,Math.floor((min-step)/step)*step),top=Math.min(100,Math.max(bottom+step,Math.ceil((max+step)/step)*step)),x=i=>62+i*244/Math.max(1,points.length-1),y=v=>150-(v-bottom)/(top-bottom)*125,coords=points.map((v,i)=>`${x(i)},${y(v)}`).join(' '),labels=circles.map(c=>c.dataset.boardTip?.replace(/\s*[\d.]+%.*/,''));svg.innerHTML=`<g class="construction-grid">${Array.from({length:Math.round((top-bottom)/step)+1},(_,i)=>{const v=bottom+i*step;return `<line x1="42" x2="340" y1="${y(v)}" y2="${y(v)}"/><text x="35" y="${y(v)+4}" text-anchor="end">${v}%</text>`}).join('')}</g><polygon points="${x(0)},150 ${coords} ${x(points.length-1)},150" fill="#f3a533" opacity=".1"/><polyline points="${coords}" fill="none" stroke="#ffa72e" stroke-width="3"/>${points.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="5" fill="#fff" stroke="#ffa72e" stroke-width="3" data-board-tip="${esc(labels[i]||'')} ${v.toFixed(1)}%"/><text x="${x(i)}" y="${y(v)-10}" text-anchor="middle">${v.toFixed(1)}%</text><text x="${x(i)}" y="174" text-anchor="middle">${esc(labels[i]||'')}</text>`).join('')}`}}
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeTypographyReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeTypographyReview();
  root.querySelectorAll('.home-population-distribution .situation-bars > div > strong').forEach(el=>{
    if(!el.querySelector('small'))el.innerHTML=el.textContent.replace(/(万人|万|人)\s*$/, '<small>$1</small>');
  });
  root.querySelectorAll('.coverage-count').forEach(el=>{
    for(const node of [...el.childNodes])if(node.nodeType===Node.TEXT_NODE && node.textContent.trim()==='家'){
      const unit=document.createElement('small');unit.className='coverage-count-unit';unit.textContent='家';node.replaceWith(unit);
    }
  });
  root.querySelectorAll('.risk-matrix-caption').forEach(el=>el.remove());
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeOutcomeGrouping=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOutcomeGrouping();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const shortNotes={'高血压/糖尿病/慢阻肺患者去重人数':'三病患者去重人数','任一疾病确诊且有专档患者去重数':'确诊且建专档的去重人数','可评估风险的专档患者去重人数':'可评估风险的专档人数','专档患者中高风险患者去重数':'专档中高风险去重人数'};
  board.querySelectorAll('.board-kpi>small').forEach(note=>{const original=note.textContent.trim();if(shortNotes[original]){note.title=original;note.textContent=shortNotes[original]}});
  if(state.dashboardView==='outcomes'){
    board.querySelectorAll('.outcome-metric-column').forEach((column,index)=>{
      const title=document.createElement('h2');title.className='outcome-group-title';title.textContent=index?'控制率':'检测率';column.prepend(title);
      column.querySelectorAll('.outcome-mini-panel h2').forEach(heading=>{const goal=heading.querySelector('.outcome-goal-caption');heading.firstChild.textContent=heading.firstChild.textContent.replace(/检测率|控制率/,'');if(goal)heading.append(goal)});
      column.querySelectorAll('.outcome-mini-bars .metric-scope-tag').forEach(tag=>{tag.textContent=tag.classList.contains('scope-color-record')?'专':tag.classList.contains('scope-color-integrated')?'一体化':'全';tag.classList.remove('outcome-population-label')});
    });
    board.querySelectorAll('.outcome-risk .risk-bars').forEach(bars=>{const rows=[...bars.children];if(rows.length===4)bars.insertBefore(rows[3],rows[2])});
    board.querySelectorAll('.outcome-region-tabs').forEach(tabs=>{const buttons=[...tabs.children];if(buttons.length===4)tabs.insertBefore(buttons[3],buttons[2])});
    board.querySelectorAll('.outcome-risk .risk-legend span').forEach((el,i)=>{el.textContent=['■ 全','■ 专','■ 一体化'][i]});
  }
  root.querySelectorAll('.metric-scope-tag,.scope-tag,.board-scope-legend b').forEach(tag=>{const value=tag.textContent.trim();if(['全','专','一体化'].includes(value)){tag.classList.remove('scope-color-all','scope-color-record','scope-color-integrated');tag.classList.add('scope-color-'+({'全':'all','专':'record','一体化':'integrated'}[value]))}});
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeOutcomeAnnotationUpdate=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOutcomeAnnotationUpdate();
  root.querySelectorAll('.outcome-metric-column .outcome-mini-panel').forEach(panel=>{
    const heading=panel.querySelector('h2'),bars=panel.querySelector('.outcome-mini-bars');
    if(!heading||!bars)return;
    const name=heading.firstChild.textContent.trim();heading.remove();
    bars.insertAdjacentHTML('afterbegin',`<div class="outcome-measure-name">${esc(name)}<small>目标 80%</small></div>`);
  });
  root.querySelectorAll('.outcome-risk .risk-bar-row').forEach(row=>{
    row.querySelectorAll('.risk-bar-line').forEach(line=>line.insertAdjacentHTML('beforeend','<span class="risk-goal-marker" title="目标 80%"></span>'));
    row.querySelector(':scope > span')?.insertAdjacentHTML('beforeend','<small class="risk-goal-label">目标 80%</small>');
  });
  const summary=root.querySelector('.clinic-summary');if(summary){summary.setAttribute('role','button');summary.setAttribute('tabindex','0');summary.setAttribute('aria-label','查看一体化门诊总结');}
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeMatrixReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeMatrixReview();
  const legend=root.querySelector('.board-scope-legend'), fullscreen=root.querySelector('#boardFullscreen');
  if(legend && fullscreen){const divider=document.createElement('span');divider.className='board-legend-divider';divider.setAttribute('aria-hidden','true');legend.append(divider,fullscreen)}
  if(state.dashboardView==='outcomes'){
    const column=root.querySelector('.outcome-metric-column');
    if(column){const legend=document.createElement('div');legend.className='risk-legend outcome-metric-legend';legend.innerHTML='<span>■ 全</span><span>■ 专</span><span>■ 一体化</span>';column.querySelector('.outcome-group-title')?.after(legend)}
  }
  root.querySelectorAll('.board-stack > .board-panel, .situation-bottom > .board-panel, .outcome-metric-column, .outcome-risk > .outcome-detail-panel, .outcome-regions > .outcome-detail-panel').forEach(panel=>{
    if(!panel.querySelector(':scope > h2, :scope > .situation-panel-title'))return;
    const frame=document.createElement('div');frame.className='dashboard-content-frame';frame.setAttribute('aria-hidden','true');panel.prepend(frame);
  });
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const tooltipBeforeFirstLineComparison=mapTooltip;
mapTooltip=function(node){
  const html=tooltipBeforeFirstLineComparison(node);
  if(state.page!=='dashboard')return html;
  const value=mapValue(node),average=dashboardMapBenchmark();
  if(!Number.isFinite(value)||!Number.isFinite(average))return html;
  const root=document.createElement('div');root.innerHTML=html;
  const tip=root.querySelector('.map-tooltip');if(!tip)return html;
  if(homeView()&&!tip.classList.contains('home-map-tooltip')){const title=tip.querySelector(':scope > strong');if(title){tip.classList.add('home-map-tooltip');title.classList.add('home-map-tooltip-title');const body=document.createElement('div');body.className='home-map-tooltip-body';while(title.nextSibling)body.append(title.nextSibling);tip.append(body)}}
  tip.querySelectorAll('div').forEach(row=>{if(!row.querySelector('div')&&/^(与省均差距|与省平均偏差|与省均偏差|与省均值差)/.test(row.textContent.trim()))row.remove()});
  const delta=value-average,line=document.createElement('div'),unit=(document.querySelector('#mapMetricLabel')?.textContent||'').includes('人数')?'万人':'个百分点';line.className='map-tooltip-comparison';const caption=document.createElement('span'),amount=document.createElement('b');caption.textContent='与省均值差';amount.textContent=`${delta>=0?'+':''}${delta.toFixed(2)} ${unit}`;line.append(caption,amount);const body=tip.querySelector('.home-map-tooltip-body');if(body)body.prepend(line);else tip.querySelector(':scope > strong')?.after(line);
  return root.innerHTML;
};

// Keep region colors identical in both map renderers for the same values.
const dashboardHeatStops=[[33,134,208],[85,168,223],[195,211,207],[237,157,100],[230,92,88]];
function dashboardHeatColor(value,average,extent){
  if(!Number.isFinite(value))return '#758393';
  const direction=mapHigherIsWorse()?1:-1,delta=Math.max(-1,Math.min(1,(value-average)*direction/extent)),t=.5+.5*delta,scaled=Math.min(3.999999,t*4),i=Math.floor(scaled);
  return '#'+dashboardHeatStops[i].map((v,j)=>Math.round(v+(dashboardHeatStops[i+1][j]-v)*(scaled-i)).toString(16).padStart(2,'0')).join('');
}
const mountBeforeUnifiedHeat=window.ZhejiangMap3D?.mount;
if(mountBeforeUnifiedHeat)window.ZhejiangMap3D.mount=function(host,geo,values,options){
  if(state.page!=='dashboard')return originalHomeMapMount(host,geo,values,options);
  const average=dashboardMapBenchmark(),extent=Math.max(.01,...values.map(x=>Math.abs(x.value-average)).filter(Number.isFinite));
  if(!Number.isFinite(average))return originalHomeMapMount(host,geo,values,options);
  return originalHomeMapMount(host,geo,values.map(x=>({...x,color:dashboardHeatColor(x.value,average,extent)})),options);
};
const renderBeforeUnifiedHeat=renderProvinceMap;
renderProvinceMap=function(){
  renderBeforeUnifiedHeat();
  if(state.page!=='dashboard'||state.mapView!=='2d'||!provinceChart)return;
  const series=provinceChart.getOption().series?.[0],values=series?.data;if(!values?.length)return;
  const average=dashboardMapBenchmark();if(!Number.isFinite(average))return;
  const extent=Math.max(.01,...values.map(x=>Math.abs(x.value-average)).filter(Number.isFinite));
  const colors=dashboardHeatStops.map(stop=>'#'+stop.map(v=>v.toString(16).padStart(2,'0')).join(''));
  provinceChart.setOption({visualMap:{show:false,min:average-extent,max:average+extent,inRange:{color:mapHigherIsWorse()?colors:colors.slice().reverse()}},series:[{data:values.map(x=>({...x,itemStyle:{...(x.itemStyle||{}),areaColor:dashboardHeatColor(x.value,average,extent)}}))}]});
};
const dashboardBeforeChartDetailReview=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeChartDetailReview();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.outcome-rank-chart').forEach(chart=>{
    const rows=[...chart.querySelectorAll('.outcome-rank-chart-row')],max=Math.max(1,...rows.map(row=>Math.abs(Number(row.querySelector('.rank-delta')?.textContent)||0)));
    const extent=max/.96,first=rows[0],base=parseFloat(first?.querySelector('strong')?.textContent)-parseFloat(first?.querySelector('.rank-delta')?.textContent),axis=document.createElement('div');axis.className='outcome-rank-axis';axis.innerHTML=`<span></span><div>${[-1,-.5,0,.5,1].map(t=>`<span>${(base+t*extent).toFixed(1)}%</span>`).join('')}</div><span></span>`;chart.after(axis);
  });
  board.querySelectorAll('.clinic-scatter g[data-board-tip]').forEach(point=>{point.setAttribute('tabindex','0');const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=point.dataset.boardTip;point.append(title)});
  board.querySelectorAll('.situation-risk-matrix:not(.risk-disease-matrix) .risk-cell[data-board-tip]').forEach(cell=>{cell.dataset.boardTip=cell.dataset.boardTip.replace(/；占(?:高|中|低)风险\s*[\d.]+%/g,'')});
  const scatterAxis=board.querySelector('.clinic-scatter .scatter-axis-label');if(scatterAxis)scatterAxis.textContent=({bloodPressure:'血压控制率',bloodGlucose:'血糖控制率',hba1cTarget:'糖化血红蛋白控制率',bloodLipids:'血脂控制率'})[state.clinicScatterMetric]||'血压控制率';
  const situationSummary=board.querySelector('.situation-summary:not(.clinic-summary)');if(situationSummary){situationSummary.setAttribute('role','button');situationSummary.tabIndex=0}
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeTooltipFormatting=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeTooltipFormatting();
  root.querySelectorAll('#dashboardBoard [title],#dashboardBoard [aria-label]').forEach(el=>{
    for(const attr of ['title','aria-label']){const value=el.getAttribute(attr);if(value?.includes('点击查看区域明细'))el.setAttribute(attr,value.replace(/[,，]?点击查看区域明细/g,''));}
  });
  root.querySelectorAll('.situation-bars > div[data-board-tip],.risk-composition-row[data-board-tip],.risk-composition-strip > div[data-board-tip],.situation-risk-matrix .risk-cell').forEach(el=>{
    const raw=el.dataset.boardTip||el.getAttribute('title')||'',name=raw.split(/[；：]/)[0].trim();
    const count=raw.match(/(?:人数\s*|：)([\d,.]+\s*万?人)/)?.[1];
    const percent=raw.match(/(?:占[^\d；，]*|占比\s*)([\d.]+)%/)?.[1];
    if(!name||!count||percent==null)return;
    const category=el.closest('.situation-bars')?'占重点慢病患者占比':el.closest('.risk-disease-matrix')?'占该病种专档患者':el.closest('.situation-risk-matrix')?'占该叠加类型':'占比';
    el.dataset.boardTip=raw;el.dataset.tipRows=JSON.stringify(el.closest('.risk-disease-matrix')?[name,['人数',count]]:[name,['人数',count],[category,Number(percent).toFixed(2)+'%']]);
    if(el.closest('.risk-disease-matrix'))el.removeAttribute('title');
    const matrixColors=el.closest('.risk-disease-matrix')?['#75344c','#967949','#275fae']:['#275fae','#967949','#75344c'];
    const matrixIndex=[0,1,2].find(i=>el.classList.contains(`risk-cell-${i}`));
    el.dataset.tipColor=el.querySelector('i b, .risk-composition-track b, i[style]')?.style.backgroundColor||el.style.backgroundColor||(matrixIndex==null?'#63baff':matrixColors[matrixIndex]);
  });
  const scatter=root.querySelector('.clinic-scatter svg');
  scatter?.querySelectorAll(':scope > line[stroke-dasharray]').forEach(line=>line.setAttribute('stroke','#4b87ae'));
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

document.addEventListener('pointermove',event=>{
  const point=event.target.closest?.('.clinic-scatter g[data-board-tip]');if(!point||!boardChartTooltip.classList.contains('visible'))return;
  const color=point.querySelector('circle')?.getAttribute('fill')||'#72cbed';boardChartTooltip.style.setProperty('--scatter-point-color',color);boardChartTooltip.classList.add('scatter-point-tooltip');
});
document.addEventListener('pointerover',event=>{if(!event.target.closest?.('.clinic-scatter g[data-board-tip]'))boardChartTooltip.classList.remove('scatter-point-tooltip')});
function openSituationSummary(){
  const metrics=[['高风险患者占比',node=>node?homeMapValue(node,'highRisk'):cities.reduce((n,city)=>n+homeRisk(city).high,0)/Math.max(.0001,cities.reduce((n,city)=>n+populationFor(city).managed,0))*100],['共病患者占比',node=>situationComorbidityRate(node)]];
  const sections=metrics.map(([label,get])=>{const average=get(null),rows=cities.map(city=>({name:city.name,value:get(city)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value);if(!Number.isFinite(average))return '';const above=rows.filter(row=>row.value>average),below=rows.filter(row=>row.value<average);return `<section><h3>${label}<span class="summary-average">省均值：${average.toFixed(2)}%</span></h3><p class="summary-action">高于省均值 ${above.length} 个地市，低于省均值 ${below.length} 个地市。</p><details><summary>查看具体明细</summary><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>区域名称</th><th>省均值</th><th>区域值</th><th>与省均值偏差</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.name)}</td><td>${average.toFixed(2)}%</td><td>${row.value.toFixed(2)}%</td><td>${row.value>=average?'+':''}${(row.value-average).toFixed(2)} 个百分点</td></tr>`).join('')}</tbody></table></div></details></section>`}).join('');
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';dialog.innerHTML=`<header><h2>浙江省 · 慢病态势总结</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body">${sections}</div>`;document.body.append(dialog);dialog.addEventListener('click',event=>{if(event.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
document.addEventListener('click',event=>{if(event.target.closest?.('.situation-summary:not(.clinic-summary)'))openSituationSummary()});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.situation-summary:not(.clinic-summary)')){event.preventDefault();openSituationSummary()}});

const dashboardBeforeOutcomeInsights=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOutcomeInsights();
  const layout=root.querySelector('.outcome-layout.outcome-four-columns');
  if(layout){const insights=document.createElement('section');insights.className='outcome-insights';insights.innerHTML='<h2>成效洞察</h2><p><strong>控制率仍有提升空间：</strong>全口径血脂控制率为 41.2%，糖化血红蛋白控制率为 36.5%。</p><p><strong>高风险人群需要关注：</strong>血压检测率为 74.5%，低于全口径的 88.6%。</p><p><strong>一体化管理人群控制率较高：</strong>血压控制率为 74.5%，全口径为 62.4%。</p>';layout.append(insights)}
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforeFinalPhotoLink=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeFinalPhotoLink();
  root.querySelectorAll('.coverage-name').forEach(label=>{
    if(label.textContent.trim()!=='鼓励探索')return;
    const button=document.createElement('button');button.type='button';button.className='clinic-photo-link';button.textContent=label.textContent;button.dataset.openClinicPhotos='';label.replaceWith(button);
  });
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

// Use reported values where available and reproducible demonstration values elsewhere.
function metricDetailLabel(el){
  if(el.dataset.detailLabel)return el.dataset.detailLabel;
  const kpi=el.closest('.board-kpi'),row=el.closest('.construction-nodes > div,.situation-filing-cards > div,.situation-ring-legend > div,.coverage-composition-legend > div,.outcome-ring-item,.funnel-row');
  const source=kpi?.querySelector(':scope > span')||row?.querySelector('span')||el.closest('.board-panel,.outcome-detail-panel,.outcome-metric-column')?.querySelector('h2')||el.parentElement;
  const copy=source?.cloneNode(true);copy?.querySelectorAll('.metric-scope-tag,.scope-tag,button,strong,b,small').forEach(node=>node.remove());
  return copy?.textContent.replace(/\s+/g,' ').trim()||'指标';
}
function metricDetailValue(label,region){
  const data=window.RESIDENT_POPULATION||{},node=region.node;
  if(label.includes('常住人口')){
    const record=region.level==='city'?data.cities?.[region.name]:region.level==='county'?data.counties?.[`${region.city}/${region.name}`]:data.towns?.[`${region.city}/${region.county}/${region.name}`];
    return record?`${Number(record[0]).toLocaleString()} ${region.level==='town'?'人':'万人'}（${record[1]}）`:null;
  }
  if(!node)return null;
  const report=clinicReportRow(node);
  if(label==='基本保障')return report?`${report[1]} 家`:null;
  if(label==='专档患者数')return `${populationFor(node).managed.toFixed(2)} 万人`;
  if(label==='风险分层人数')return `${(populationFor(node).managed*.5).toFixed(2)} 万人`;
  if(label==='3病叠加人数')return `${diseaseCombinations(populationFor(node))[6].value.toFixed(2)} 万人`;
  const controlKeys={'血压控制率':'bloodPressure','血糖控制率':'bloodGlucose','血脂控制率':'bloodLipids','糖化血红蛋白控制率':'hba1cTarget'};
  if(controlKeys[label])return `${homeMapValue(node,controlKeys[label]).toFixed(2)}%`;
  if(/一体化门诊(?:总数|机构数)|已建成一体化门诊机构数/.test(label))return report?`${report[1]+report[2]+report[3]} 家`:null;
  if(label.includes('一体化门诊覆盖率'))return report?`${((report[1]+report[2]+report[3])/report[0]*100).toFixed(2)}%`:null;
  if(label==='基层机构总数')return report?`${report[0]} 家`:null;
  if(label==='医防融合入径率')return `${dashboardRate(node,'entry').toFixed(1)}%`;
  if(label==='路径节点总执行率')return `${constructionValue(node,'monitoring').toFixed(1)}%`;
  return null;
}
showMetricDetail=function(el){
  if(state.page==='dashboard'&&state.mapScope==='town'&&scopeLevel()==='county')return;
  const cell=el.closest('.situation-risk-matrix .risk-cell'),matrix=cell?.closest('.situation-risk-matrix'),cells=matrix?[...matrix.children]:[],index=cell?cells.indexOf(cell):-1;
  const riskContext=index>=5?{category:cells[4+Math.floor((index-5)/4)*4]?.textContent.trim(),level:cells[1+(index-5)%4]?.textContent.trim(),disease:matrix.classList.contains('risk-disease-matrix')}:null;
  const label=riskContext?`${riskContext.category} · ${riskContext.level}`:metricDetailLabel(el),data=window.RESIDENT_POPULATION||{},dialog=document.createElement('dialog');
  dialog.className='metric-detail-dialog';document.body.append(dialog);
  const selectedText=(el.dataset.detailValue||el.querySelector('title')?.textContent||el.textContent||'').replace(/,/g,''),match=selectedText.match(/-?\d+(?:\.\d+)?/),provinceValues={'全口径患者数':1850,'专档患者数':748.5,'风险分层人数':374.25,'高风险患者数':149.7,'中风险患者数':135,'低风险患者数':89.55},selectedValue=!currentNode()&&provinceValues[label]!=null?provinceValues[label]:match?Number(match[0]):50;
  const isRate=!selectedText.includes('pp')&&(selectedText.includes('%')||/率|占比|比例/.test(label)),unit=isRate?'%':(selectedText.match(/万人|万次|万份|人次|pp|家|人|次|万/)||[''])[0];
  let path=[];
  if(currentNode()){
    const node=currentNode();
    if(node.cityName)path=[{name:node.cityName,detailValue:selectedValue},{name:node.name,detailValue:selectedValue}];
    else if(cities.some(city=>city.name===node.name))path=[{name:node.name,detailValue:selectedValue}];
  }
  if(el.dataset.detailRegion){const city=cities.find(item=>item.name===el.dataset.detailRegion||item.name===`${el.dataset.detailRegion}市`);if(city)path=[{name:city.name,detailValue:selectedValue}]}
  function rows(){
    if(!path.length)return cities.map(node=>({level:'city',name:node.name,node}));
    const city=path[0].name;
    if(path.length===1){
      const names=new Set([...counties.filter(node=>node.cityName===city).map(node=>node.name),...Object.keys(data.counties||{}).filter(key=>key.startsWith(city+'/')).map(key=>key.slice(city.length+1))]);
      names.delete('西湖风景名胜区');
      return [...names].map(name=>({level:'county',city,name,node:counties.find(node=>node.cityName===city&&node.name===name)}));
    }
    const county=path[1].name,prefix=`${city}/${county}/`,names=new Set(Object.keys(data.towns||{}).filter(key=>key.startsWith(prefix)).map(key=>key.slice(prefix.length)));
    const features=[...(window.ZHEJIANG_TOWNSHIPS?.features||[]),...(window.YUHANG_TOWNSHIPS?.features||[]),...(townshipFeatures||[])];
    features.forEach(feature=>{const p=feature.properties||{},name=p['县']==='临安市'?'临安区':p['县'];if(p['市']===city&&name===county&&p['乡'])names.add(p['乡'])});
    return [...names].map(name=>({level:'town',city,county,name}));
  }
  function numericWeight(item){
    const record=item.level==='city'?data.cities?.[item.name]:item.level==='county'?data.counties?.[`${item.city}/${item.name}`]:data.towns?.[`${item.city}/${item.county}/${item.name}`];
    return record?Math.max(1,Number(record[0])*(item.level==='town'?1:10000)):null;
  }
  function stableVariation(name){let hash=0;for(const c of `${label}/${name}`)hash=(hash*31+c.charCodeAt(0))>>>0;return (hash%2001)/1000-1}
  function valuesFor(items){
    const parent=path.length?path[path.length-1].detailValue:selectedValue,rawWeights=items.map(numericWeight),knownWeights=rawWeights.filter(Number.isFinite),fallbackWeight=knownWeights.length?knownWeights.reduce((a,b)=>a+b,0)/knownWeights.length:1,weights=rawWeights.map(value=>value??fallbackWeight),total=weights.reduce((a,b)=>a+b,0)||1;
    const variations=items.map(item=>stableVariation(`${item.city||''}/${item.county||''}/${item.name}`)),mean=variations.reduce((sum,v,i)=>sum+v*weights[i]/total,0);
    const ratioBase={'全口径患者数':1850/6700.9,'专档患者数':748.5/1850,'风险分层人数':374.25/748.5,'高风险患者数':149.7/374.25,'中风险患者数':135/374.25,'低风险患者数':89.55/374.25}[label];
    const adjusted=weights.map((weight,i)=>weight*(1+.16*(variations[i]-mean))),adjustedTotal=adjusted.reduce((a,b)=>a+b,0)||1;
    return items.map((item,i)=>{
      if(ratioBase){const denominator=(path.length?path[path.length-1].detailDenominator:selectedValue/ratioBase)*weights[i]/total,value=parent*adjusted[i]/adjustedTotal;return {value,denominator,display:`${value.toFixed(2)} 万人`}}
      if(riskContext&&!item.node){const value=parent*adjusted[i]/adjustedTotal;return {value,display:`${value.toFixed(2)} 万人`}}
      if(riskContext&&item.node){
        const p=populationFor(item.node),risk=homeRisk(item.node),parts=diseaseCombinations(p),total=parts.reduce((sum,part)=>sum+part.value,0);
        const group=riskContext.disease?({'高血压':p.managedHigh,'糖尿病':p.managedDiabetes,'慢阻肺':p.managedCopd}[riskContext.category]||0):riskContext.category==='3病叠加'?parts[6].value:riskContext.category==='2病共患'?parts.slice(3,6).reduce((sum,part)=>sum+part.value,0):parts.slice(0,3).reduce((sum,part)=>sum+part.value,0);
        const level=({'高风险':risk.high,'中风险':risk.middle,'低风险':risk.low})[riskContext.level]||0;
        const denominator=riskContext.disease?p.managed:total,value=group*level/Math.max(.0001,denominator),pct=value/Math.max(.0001,group)*100;
        return {value,display:`${value.toFixed(2)} 万人`};
      }
      if(label.includes('血脂')&&isRate&&unit!=='pp'){
        const value=Math.max(20,Math.min(30,parent+(variations[i]-mean)*2));
        return {value,display:`${value.toFixed(2)} %`};
      }
      const known=metricDetailValue(label,item);
      if(known){const value=Number(known.replace(/,/g,'').match(/-?\d+(?:\.\d+)?/)?.[0]);return {display:known,value:Number.isFinite(value)?value:parent}}
      const value=unit==='pp'?parent+(variations[i]-mean)*2:isRate?Math.max(0,Math.min(100,parent+(variations[i]-mean)*Math.min(8,parent*.18,(100-parent)*.18))):parent*weights[i]/total;
      const townResident=label.includes('常住人口')&&item.level==='town',shown=townResident?value*10000:value,shownUnit=townResident?'人':unit;
      const digits=isRate?2:shownUnit==='家'||shownUnit==='人'||shownUnit==='人次'?0:2;
      return {value,display:`${shown.toFixed(digits)}${shownUnit?' '+shownUnit:''}`};
    });
  }
  function draw(){
    const items=rows(),values=valuesFor(items),ratioLabel=({'全口径患者数':'占常住人口比例','专档患者数':'建档率','风险分层人数':'占专档比例','高风险患者数':'占风险分层比例','中风险患者数':'占风险分层比例','低风险患者数':'占风险分层比例'})[label]||null;
    const ratios=items.map((item,i)=>ratioLabel?values[i].value/Math.max(.000001,values[i].denominator)*100:values[i].value);
    const order=items.map((_,i)=>i).sort((a,b)=>ratios[b]-ratios[a]);
    const resident=label.includes('常住人口'),level=path.length===0?'地市':path.length===1?'区县':'乡镇街道',max=Math.max(1,...values.map(item=>item.value)),periods=[...new Set(values.map(item=>item.display.match(/（(.+)）$/)?.[1]).filter(Boolean))],period=periods.length===1?periods[0]:'',displayUnit=resident?(path.length===2?'人':'万人'):unit;
    const rowMarkup=(item,i)=>{const entry=values[i],number=resident?entry.display.replace(/\s*(?:万人|人)\s*(?:（.+）)?$/,'').replace(/,/g,''):entry.display,bar=Math.max(0,Math.min(100,ratioLabel?ratios[i]:entry.value/max*100)),name=`<span class="metric-region-name">${esc(item.name)}</span><span class="metric-value-track" aria-label="${ratioLabel||'数值规模'} ${bar.toFixed(2)}%"><i style="width:${bar}%"></i>${ratioLabel?`<small>${ratios[i].toFixed(2)}%</small>`:''}</span><strong>${esc(number)}${resident&&!period&&entry.display.match(/（(.+)）$/)?`<small>${esc(entry.display.match(/（(.+)）$/)[1])}</small>`:''}</strong>`;return item.level!=='town'?`<button class="metric-detail-row" type="button" data-detail-index="${i}" aria-label="${esc(item.name)} ${esc(entry.display)}，查看下级区域">${name}</button>`:`<div class="metric-detail-row">${name}</div>`};
    dialog.innerHTML=`<header><h2><b>${esc(label)}</b><span>${level}明细</span></h2><button type="button" data-detail-close aria-label="关闭">×</button></header><div class="metric-detail-content">${path.length?`<div class="metric-detail-meta"><nav aria-label="区域层级"><button type="button" data-detail-back="0">浙江省</button>${path.map((item,i)=>`<span> / </span><button type="button" data-detail-back="${i+1}">${esc(item.name)}</button>`).join('')}</nav></div>`:''}<div class="metric-detail-section-title"><strong>${level}明细</strong>${displayUnit&&!riskContext?`<span>单位：${esc(displayUnit)}</span>`:''}</div><div class="metric-detail-table"><div class="metric-detail-row metric-detail-heading"><span>${level}</span><span>${ratioLabel|| (resident?'人口规模':'数值规模')}</span><span>${riskContext?'人数':esc(label)}</span></div>${items.length?order.map(i=>rowMarkup(items[i],i)).join(''):'<p class="metric-detail-empty">暂无下级区域数据</p>'}</div><footer class="metric-detail-footer"><span>${riskContext?`演示数据：${esc(riskContext.category)}专档患者中${esc(riskContext.level)}人数`:`演示数据：${esc(label)}`}</span><span>已展示全部 ${items.length} 个${level}</span></footer></div>`;
    if(period)dialog.querySelector('.metric-detail-footer span')?.append(`；数据年份：${period}`);
    dialog.querySelector('.metric-detail-table').scrollTop=0;
  }
  dialog.addEventListener('click',event=>{
    if(event.target.closest('[data-detail-close]')){dialog.close();return}
    const back=event.target.closest('[data-detail-back]');if(back){path=path.slice(0,Number(back.dataset.detailBack));draw();return}
    const row=event.target.closest('[data-detail-index]');if(row){const items=rows(),index=Number(row.dataset.detailIndex),item=items[index];if(item){const entry=valuesFor(items)[index];item.detailValue=entry.value;item.detailDenominator=entry.denominator;path.push(item);draw()}}
  });
  dialog.addEventListener('close',()=>dialog.remove());draw();dialog.showModal();
};
const dashboardBeforeAllMetricDetails=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeAllMetricDetails();
  root.querySelectorAll('#dashboardBoard .situation-risk-matrix .risk-cell').forEach(cell=>{cell.querySelectorAll('.metric-detail-trigger').forEach(child=>{child.classList.remove('metric-detail-trigger');child.removeAttribute('role');child.removeAttribute('tabindex')});cell.classList.add('metric-detail-trigger');cell.setAttribute('role','button');cell.setAttribute('tabindex','0')});
  root.querySelectorAll('#dashboardBoard .board-panel strong,#dashboardBoard .board-panel b,#dashboardBoard .board-kpi > strong,#dashboardBoard .outcome-detail-panel strong,#dashboardBoard .outcome-metric-column strong,#dashboardBoard .board-panel span').forEach(el=>{
    if(!/\d/.test(el.textContent)||el.closest('button,a,.metric-help,[data-tier],[data-open-clinic-photos]')||el.closest('.metric-detail-trigger'))return;
    if(el.tagName==='SPAN'&&(!/^\s*[-+]?\d[\d,.]*(?:\s*(?:%|万人|人|家|次|万次|万份))?\s*$/.test(el.textContent)||el.children.length))return;
    el.classList.add('metric-detail-trigger');el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${metricDetailLabel(el)}，查看区域明细`);
  });
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

const dashboardBeforePrecisionAndHover=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforePrecisionAndHover();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const percentText=text=>text.replace(/(-?\d+(?:\.\d+)?)\s*%/g,(_,number)=>`${Number(number).toFixed(2)}%`);
  const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    if(!node.parentElement.closest('style,script'))node.nodeValue=percentText(node.nodeValue);
  }
  board.querySelectorAll('.board-kpi strong').forEach(value=>{
    const unit=value.querySelector('.board-kpi-unit');
    if(unit?.textContent.trim()==='%'&&value.firstChild?.nodeType===Node.TEXT_NODE){
      const number=value.firstChild.nodeValue.trim();if(/^[-+]?\d+(?:\.\d+)?$/.test(number))value.firstChild.nodeValue=Number(number).toFixed(2);
    }
  });
  board.querySelectorAll('[data-board-tip]').forEach(el=>el.dataset.boardTip=percentText(el.dataset.boardTip));
  board.querySelectorAll('.unified-coverage-legend > div').forEach(row=>{
    const bar=row.querySelector('.coverage-bar'),name=row.querySelector('.coverage-name,.clinic-photo-link')?.textContent.trim(),count=row.querySelector('.coverage-count')?.textContent.trim(),value=row.querySelector(':scope > small')?.textContent.trim();
    if(bar&&name){bar.dataset.boardTip=`${name}：${count}；占比 ${value}`;bar.dataset.tipRows=JSON.stringify([`${name}：${count}`,['占比',value]]);bar.dataset.tipColor=row.querySelector(':scope > i:not(.coverage-bar)')?.style.backgroundColor||'#51c8ef'}
  });
  board.querySelectorAll('.home-target-item').forEach(row=>{
    const track=row.querySelector('.home-target-track'),name=row.querySelector('.home-target-label span')?.textContent.trim(),value=track?.querySelector('b')?.textContent.trim();
    if(track&&name&&value)track.dataset.boardTip=`${name}｜${value}`;
  });
  board.querySelectorAll('.outcome-mini-panel').forEach(panel=>{
    const name=panel.querySelector('.outcome-measure-name')?.firstChild?.textContent.trim()||'';
    const column=panel.closest('.outcome-metric-column');
    const metric=column?.querySelector('.outcome-group-title')?.textContent.trim()||'';
    panel.querySelectorAll('.outcome-mini-bars > div').forEach(row=>{
      const track=row.querySelector('.outcome-mini-track'),value=row.querySelector('strong')?.textContent.trim(),group=row.querySelector('.metric-scope-tag')?.textContent.trim();
      if(track&&value)track.dataset.boardTip=`${name}${metric}｜${group} ${value}`;
    });
  });
  board.querySelectorAll('.risk-ranking-row[data-board-tip]').forEach(row=>{
    const parts=row.dataset.boardTip.split('；');
    if(parts.length>=4)row.dataset.boardTip=[parts[0],parts[3],parts[1],parts[2]].join('；');
  });
  board.querySelectorAll('.construction-nodes > div').forEach(row=>{
    const bar=row.querySelector('i'),name=row.querySelector('span')?.textContent.trim(),value=row.querySelector('strong')?.textContent.trim();
    if(bar&&name&&value)bar.dataset.boardTip=`${name}；执行率 ${value}`;
  });
  board.querySelectorAll('.outcome-rank-chart-row').forEach(row=>{
    const track=row.querySelector('.outcome-rank-track'),name=row.querySelector(':scope > span')?.textContent.trim(),value=row.querySelector(':scope > strong')?.textContent.trim(),delta=row.querySelector('.rank-delta')?.textContent.trim(),metric=row.closest('.outcome-detail-panel')?.querySelector('.outcome-region-title')?.textContent.trim()||'排序';
    if(track&&name&&value)track.dataset.boardTip=`${name}；${metric.replace(/^各地市|排序$/g,'')} ${value}；较省平均 ${delta||'0.00'} 个百分点`;
  });
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();

function clinicScatterUnits(){
  const node=currentNode();
  if(!node)return cities;
  if(state.city.startsWith('city:'))return counties.filter(item=>item.cityName===node.name);
  if(state.city.startsWith('county:')){
    const prefix=`${node.cityName}/${node.name}/`;
    return Object.keys(window.RESIDENT_POPULATION?.towns||{}).filter(key=>key.startsWith(prefix)).map(key=>({name:key.slice(prefix.length),adcode:node.adcode,cityName:node.cityName,countyName:node.name}));
  }
  if(state.city.startsWith('consortium:'))return clinics.filter(item=>item.consortiumName===node.name);
  return [node];
}
function clinicScatterUnitLabel(){
  return !currentNode()?'市':state.city.startsWith('city:')?'区县':'乡镇街道';
}
function clinicScatterValue(node,key){const value=homeMapValue(node,key);return key==='bloodLipids'?Math.max(0,26.8+(value-homeMapValue(null,key))*.45):value}
function clinicScatterPoints(key){
  const units=clinicScatterUnits(),isClinicLevel=!!currentNode()&&(state.city.startsWith('county:')||state.city.startsWith('consortium:'));
  return units.map((node,i)=>{
    if(!isClinicLevel)return {name:node.name,x:constructionValue(node,'construction'),y:clinicScatterValue(node,key)};
    const parent=counties.find(county=>county.adcode===node.adcode),base=clinicScatterValue(parent||node,key);
    return {name:node.name,x:Math.max(0,Math.min(100,88+(i%4)*3.2+Math.floor(i/4)*.5)),y:Math.max(0,Math.min(100,base-5+((i*5)%12)*.9))};
  }).filter(point=>Number.isFinite(point.x)&&Number.isFinite(point.y));
}
document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-clinic-quadrant]');
  if(!button)return;
  const key=state.clinicScatterMetric||'bloodPressure',points=clinicScatterPoints(key),mx=constructionValue(null,'construction'),my=clinicScatterValue(null,key);
  const groups=[['高覆盖低成效',p=>p.x>=mx&&p.y<my],['低覆盖高成效',p=>p.x<mx&&p.y>=my],['高覆盖高成效',p=>p.x>=mx&&p.y>=my],['低覆盖低成效',p=>p.x<mx&&p.y<my]];
  const group=groups[Number(button.dataset.clinicQuadrant)];if(!group)return;
  const items=points.filter(group[1]).sort((a,b)=>b.x-a.x),metric=({bloodPressure:'血压',bloodGlucose:'血糖',hba1cTarget:'糖化血红蛋白',bloodLipids:'血脂'})[key]||'血压';
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog clinic-quadrant-dialog';
  dialog.innerHTML=`<header><h2>${esc(group[0])} · ${esc(regionLabel())}明细</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body"><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>区域名称</th><th>一体化门诊覆盖率</th><th>${esc(metric)}控制率</th></tr></thead><tbody>${items.length?items.map(item=>`<tr><td>${esc(item.name)}</td><td>${item.x.toFixed(2)}%</td><td>${item.y.toFixed(2)}%</td></tr>`).join(''):'<tr><td colspan="3">暂无符合条件的区域</td></tr>'}</tbody></table></div></div>`;
  (document.fullscreenElement||document.body).append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
  const headers=dialog.querySelectorAll('th');let sortKey='x',descending=true;
  [1,2].forEach((column)=>{const button=document.createElement('button');button.type='button';button.className='summary-sort';button.textContent=' ↕';button.setAttribute('aria-label',`按${headers[column].textContent}排序`);headers[column].append(button);button.addEventListener('click',()=>{const next=column===1?'x':'y';descending=sortKey===next?!descending:true;sortKey=next;const body=dialog.querySelector('tbody');if(!items.length)return;items.sort((a,b)=>(descending?b[sortKey]-a[sortKey]:a[sortKey]-b[sortKey]));body.innerHTML=items.map(item=>`<tr><td>${esc(item.name)}</td><td>${item.x.toFixed(2)}%</td><td>${item.y.toFixed(2)}%</td></tr>`).join('')})});
});

// Keep dashboard dialogs within the visible screen, including fullscreen mode.
{
  const nativeShowModal=HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal=function(){
    if(!this.matches('.metric-detail-dialog,.home-summary-dialog,.clinic-gallery-dialog,.town-clinic-dialog'))return nativeShowModal.call(this);
    if(document.fullscreenElement&&!document.fullscreenElement.contains(this))document.fullscreenElement.append(this);
    const dialog=this;
    const position=()=>{
      const board=$('dashboardBoard')?.getBoundingClientRect();
      let left=Math.max(0,board?.left??0),top=Math.max(0,board?.top??0);
      let right=Math.min(innerWidth,board?.right??innerWidth),bottom=Math.min(innerHeight,board?.bottom??innerHeight);
      if(right<=left||bottom<=top){left=0;top=0;right=innerWidth;bottom=innerHeight}
      dialog.style.setProperty('--dialog-x',`${(left+right)/2}px`);
      dialog.style.setProperty('--dialog-y',`${(top+bottom)/2}px`);
      const scale=Math.min(1,(right-left)/1920,(bottom-top)/1080),padding=24*scale;
      dialog.style.setProperty('--dialog-scale',`${Math.max(.01,scale)}`);
      dialog.style.setProperty('--dialog-max-width',`${Math.max(0,(right-left-2*padding)/Math.max(.01,scale))}px`);
      dialog.style.setProperty('--dialog-max-height',`${Math.max(0,(bottom-top-2*padding)/Math.max(.01,scale))}px`);
    };
    nativeShowModal.call(dialog);position();
    window.addEventListener('resize',position);window.addEventListener('scroll',position,true);document.addEventListener('fullscreenchange',position);
    dialog.addEventListener('close',()=>{window.removeEventListener('resize',position);window.removeEventListener('scroll',position,true);document.removeEventListener('fullscreenchange',position)},{once:true});
  };
}

// Province overview values requested for the demonstration.
const dashboardBeforeOverviewCorrections=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOverviewCorrections();
  const board=root.querySelector('#dashboardBoard');if(!board||!homeView())return root.innerHTML;
  const targetBars=board.querySelector('.home-control-strip .home-target-bars');
  if(targetBars)targetBars.insertAdjacentHTML('afterbegin','<div class="home-target-heading"><span>控制率</span><span>偏差 / 个百分点</span></div>');
  board.querySelectorAll('.home-target-item').forEach(item=>{
    const label=item.querySelector('.home-target-label'),difference=label?.querySelector('small'),goal=item.querySelector('.home-target-goal-label'),chart=item.querySelector('.home-target-chart');
    if(label&&difference&&goal&&chart){chart.append(goal);difference.textContent=difference.textContent.replace(/差距\s*/, '').replace(/\s*个百分点/, '');item.append(difference);difference.classList.add('home-target-difference')}
  });
  board.querySelectorAll('.board-kpis > .board-kpi').forEach(card=>{
    const label=card.querySelector(':scope > span');
    if(label&&/基层就诊人次|一体化门诊服务人次/.test(label.textContent)&&!card.querySelector('.metric-scope-tag')){const all=label.textContent.includes('基层就诊人次');card.insertAdjacentHTML('beforeend',all?'<b class="metric-scope-tag scope-color-all" title="全口径患者">全</b>':'<b class="metric-scope-tag scope-color-integrated" title="一体化口径：一体化管理的专档患者">一体化</b>')}
  });
  const legend=board.querySelector('.board-scope-legend'),fullscreen=legend?.querySelector('.board-fullscreen');
  if(legend&&fullscreen){const year=document.createElement('select');year.className='board-year';year.setAttribute('aria-label','选择年份');year.innerHTML=['2025','2026'].map(y=>`<option value="${y}" ${state.year===y?'selected':''}>${y}年</option>`).join('');legend.insertBefore(year,fullscreen)}
  const node=currentNode(),weight=node?node.should/sum(cities,'should'):1,yearFactor=state.year==='2025'?.91:1,factor=weight*yearFactor;
  const display=(n,digits=2)=>node||yearFactor!==1?(n*factor).toFixed(digits).replace(/\.?0+$/,''):String(n);
  const values={'全口径患者数':display(1850),'专档患者数':display(748.5),'风险分层人数':display(374.25),'高风险患者数':display(149.7),'基层就诊人次':display(1800),'一体化门诊服务人次':display(1000)};
  board.querySelectorAll('.board-kpis > .board-kpi').forEach(card=>{
    const label=card.querySelector(':scope > span')?.childNodes[0]?.textContent.trim(),value=values[label],strong=card.querySelector(':scope > strong');
    if(value&&strong&&strong.firstChild?.nodeType===Node.TEXT_NODE)strong.firstChild.nodeValue=value;
    if(label==='一体化门诊服务人次')card.classList.add('integrated-service-kpi');
  });
  const data=[['1579.8','690','400'],['552.94','171.94','80'],['360.25','120','12.25'],['137.00','54.00','8.70']].map(row=>row.map(n=>factor===1?n:(Number(n)*factor).toFixed(2)));
  board.querySelectorAll('.home-disease-table .disease-table-row').forEach((row,i)=>{
    row.querySelectorAll(':scope > div').forEach((cell,j)=>{
      const value=cell.querySelector('strong'),unit=cell.querySelector(':scope > small'),ratio=cell.querySelector('em');
      if(value)value.textContent=data[i][j];
      if(unit)unit.textContent='万人';
      if(ratio&&i>0)ratio.textContent=`${['','建档率','占专档','占比'][i]} ${(Number(data[i][j])/Number(data[i-1][j])*100).toFixed(2)}%`;
    });
  });
  const summary=board.querySelector('.home-disease-summary');
  if(summary)summary.textContent=`高风险合计 ${data[3].reduce((sum,n)=>sum+Number(n),0).toFixed(2)} 万人，去重后 ${display(149.7)} 万人`;
  const bars=board.querySelector('.home-population-distribution .situation-bars'),groups=[170,479.8,950,100.2,150],total=1850;
  bars?.querySelectorAll(':scope > div').forEach((row,i)=>{
    const amount=groups[i]*factor,pct=groups[i]/total*100,strong=row.querySelector('strong'),percent=row.querySelector('em'),bar=row.querySelector('i>b'),name=row.querySelector('span')?.textContent.trim()||'';
    if(strong)strong.innerHTML=`${amount.toFixed(node?2:1)}<small>万人</small>`;
    if(percent)percent.textContent=`${pct.toFixed(2)}%`;
    if(bar)bar.style.width=`${pct}%`;
    row.dataset.boardTip=`${name}；人数 ${amount.toFixed(2)}万人；占全口径患者 ${pct.toFixed(2)}%`;
  });
  const groupSummary=bars?.querySelector('p');if(groupSummary)groupSummary.textContent=`共病 ${((170+479.8)*factor).toFixed(1)}万人，单病 ${((950+100.2+150)*factor).toFixed(1)}万人`;
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('change',event=>{if(event.target.matches('.board-year')){state.year=event.target.value;const year=document.getElementById('year');if(year)year.value=state.year;render()}});

// Shared demonstration totals for the overview and situation views.
const populationForBeforeOverviewAlignment=populationFor;
const populationDataBeforeOverviewAlignment=populationData;
const homeRiskBeforeOverviewAlignment=homeRisk;
const diseaseCombinationsBeforeOverviewAlignment=diseaseCombinations;
function overviewDemoFactor(node){return (node?node.should/sum(cities,'should'):1)*(state.year==='2025'?.91:1)}
function demoLocalDeviation(node){
  if(!node)return 0;
  const city=cities.find(c=>c.name===(node.cityName||node.name));
  if(!city)return 0;
  const centered=(items,item,score)=>{const total=items.reduce((s,x)=>s+x.should,0);return score(item)-items.reduce((s,x)=>s+x.should*score(x),0)/Math.max(1,total)};
  const cityScore=c=>(cities.indexOf(c)%6-2.5)*.035;
  let result=centered(cities,city,cityScore);
  if(node.cityName){const siblings=counties.filter(c=>c.cityName===node.cityName),county=siblings.find(c=>c.adcode===node.adcode);if(county){const countyScore=c=>(siblings.indexOf(c)%5-2)*.025;result+=centered(siblings,county,countyScore)}}
  if(node.clinicIndex||node.consortiumName){const members=scopeDescendants(node),siblings=clinics.filter(c=>c.adcode===node.adcode),score=c=>(c.clinicIndex%7-3)*.012;const mean=members.reduce((s,c)=>s+centered(siblings,c,score),0)/Math.max(1,members.length);result+=mean}
  return result;
}
function alignedOverviewPopulation(node,original){
  const f=overviewDemoFactor(node);
  return {...original,diagnosed:1850*f,managed:748.5*f,high:1579.8*f,diabetes:690*f,copd:400*f,
    managedHigh:552.94*f,managedDiabetes:171.94*f,managedCopd:80*f,overlap:649.8*f,coverage:748.5/1850*100,demoDeviation:demoLocalDeviation(node)};
}
populationFor=function(node){const original=populationForBeforeOverviewAlignment(node);return state.page==='dashboard'&&(homeView()||situationActive())?alignedOverviewPopulation(node,original):original};
populationData=function(){const original=populationDataBeforeOverviewAlignment();return state.page==='dashboard'&&(homeView()||situationActive())?alignedOverviewPopulation(currentNode(),original):original};
homeRisk=function(node){
  if(state.page!=='dashboard'||(!homeView()&&!situationActive()))return homeRiskBeforeOverviewAlignment(node);
  const f=overviewDemoFactor(node);
  const high=(149.7+748.5*demoLocalDeviation(node)*.45)*f,middle=135*f;
  return {high,middle,low:374.25*f-high-middle};
};
diseaseCombinations=function(p){
  if(state.page!=='dashboard'||(!homeView()&&!situationActive()))return diseaseCombinationsBeforeOverviewAlignment(p);
  const f=p.diagnosed/1850;
  const deviation=p.demoDeviation||0,comorbid=1+deviation,single=1-deviation*649.8/1200.2;
  return [['仅高血压',1,950],['仅糖尿病',2,100.2],['仅慢阻肺',4,150],['仅高血压+糖尿病',3,300],['仅高血压+慢阻肺',5,100],['仅糖尿病+慢阻肺',6,79.8],['高糖慢合并',7,170]].map(([name,bits,value])=>({name,bits,value:value*f*(bits===1||bits===2||bits===4?single:comorbid)}));
};
const dashboardBeforeRegionalPolish=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeRegionalPolish();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const legend=board.querySelector('.board-scope-legend'),fullscreen=legend?.querySelector('.board-fullscreen');
  if(legend){const labels=['全口径患者','有专档患者','一体化管理的专档患者'];legend.querySelectorAll(':scope > span:not(.board-legend-divider)').forEach((el,i)=>{if(labels[i]){const tag=el.querySelector('b');el.replaceChildren(tag,document.createTextNode(' '+labels[i]))}});
    if(fullscreen&&!legend.querySelector('.board-year')){const year=document.createElement('select');year.className='board-year';year.setAttribute('aria-label','选择年份');year.innerHTML=['2025','2026'].map(y=>`<option value="${y}" ${state.year===y?'selected':''}>${y}年</option>`).join('');legend.insertBefore(year,fullscreen)}}
  if(homeView()){
    const p=populationData(),risk=homeRisk(currentNode()),f=overviewDemoFactor(currentNode());
    const values={'全口径患者数':p.diagnosed,'专档患者数':p.managed,'风险分层人数':p.managed*.5,'高风险患者数':risk.high};
    board.querySelectorAll('.board-kpis > .board-kpi').forEach(card=>{const key=card.querySelector(':scope > span')?.childNodes[0]?.textContent.trim(),strong=card.querySelector(':scope > strong');if(values[key]!=null&&strong?.firstChild?.nodeType===Node.TEXT_NODE)strong.firstChild.nodeValue=Number(values[key].toFixed(2)).toString()});
    const rows=board.querySelectorAll('.home-population-distribution .situation-bars > div'),parts=diseaseCombinations(p),groups=[parts[6].value,parts.slice(3,6).reduce((s,x)=>s+x.value,0),...parts.slice(0,3).map(x=>x.value)];
    rows.forEach((row,i)=>{const n=groups[i],pct=n/p.diagnosed*100,strong=row.querySelector('strong'),em=row.querySelector('em'),bar=row.querySelector('i>b');if(strong)strong.innerHTML=`${n.toFixed(currentNode()?2:1)}<small>万人</small>`;if(em)em.textContent=`${pct.toFixed(2)}%`;if(bar)bar.style.width=`${pct}%`;row.dataset.boardTip=`${row.querySelector('span')?.textContent.trim()}；人数 ${n.toFixed(2)}万人；占全口径患者 ${pct.toFixed(2)}%`});
    const summary=board.querySelector('.home-population-distribution .situation-bars p');if(summary)summary.textContent=`共病 ${(groups[0]+groups[1]).toFixed(1)}万人，单病 ${(groups[2]+groups[3]+groups[4]).toFixed(1)}万人`;
    const highSummary=board.querySelector('.home-disease-summary');if(highSummary)highSummary.textContent=`高风险合计 ${(199.7*f).toFixed(2)} 万人，去重后 ${Number(risk.high.toFixed(2))} 万人`;
    const heading=board.querySelector('.home-target-heading');if(heading)heading.innerHTML='<span>控制率</span><span>当前值</span><span>目标值</span><span>偏差 (pp)</span>';
    board.querySelectorAll('.home-target-item').forEach(row=>{const chart=row.querySelector('.home-target-chart'),track=row.querySelector('.home-target-track'),goal=row.querySelector('.home-target-goal-label'),actual=track?.querySelector('b'),label=row.querySelector('.home-target-label span');if(label)label.textContent=label.textContent.replace(/控制率/g,'');if(chart&&track&&goal&&actual){const block=document.createElement('div');block.className='home-target-current';goal.textContent=goal.textContent.replace(/目标\s*/,'');block.append(goal);chart.after(block);const value=document.createElement('strong');value.className='home-target-actual';value.textContent=actual.textContent;chart.append(value)}});
  }
  if(situationActive()){
    board.querySelectorAll('.situation-risk-matrix .risk-cell small').forEach(el=>el.remove());
    const matrix=board.querySelector('.situation-risk-matrix:not(.risk-disease-matrix)');
    if(matrix){const cells=[...matrix.children],risk=homeRisk(currentNode()),totals=[0,1,2].map(i=>cells.slice(5+i*4,8+i*4).reduce((s,c)=>s+(parseFloat(c.textContent)||0),0)),sum=totals.reduce((s,n)=>s+n,0);if(sum>0){const high=[totals[0]*.7,totals[1]*.5,0];high[2]=Math.max(0,risk.high-high[0]-high[1]);const remaining=totals.map((n,i)=>Math.max(0,n-high[i])),remainingTotal=remaining.reduce((s,n)=>s+n,0);totals.forEach((n,i)=>{const values=[high[i],remaining[i]*risk.middle/Math.max(.0001,remainingTotal),remaining[i]*risk.low/Math.max(.0001,remainingTotal)];cells.slice(5+i*4,8+i*4).forEach((cell,j)=>{const label=cells[4+i*4].textContent.trim(),level=['高风险','中风险','低风险'][j],value=values[j];cell.innerHTML=`<strong>${value.toFixed(1)}万</strong>`;cell.dataset.boardTip=`${label} · ${level}；人数 ${value.toFixed(2)}万人`;cell.dataset.tipRows=JSON.stringify([`${label} · ${level}`,['人数',`${value.toFixed(2)}万人`]])})})}}
    const ranking=board.querySelector('.situation-risk-ranking');const title=ranking?.querySelector('.risk-ranking-heading span:last-child');if(title)title.textContent='偏差';
    ranking?.querySelectorAll('.risk-ranking-row').forEach(row=>{const value=row.querySelector('.risk-ranking-value'),difference=row.querySelector(':scope > strong');if(value&&difference)row.insertBefore(value,difference)});
    ranking?.querySelectorAll('.risk-ranking-axis > div').forEach(axis=>{const labels=[...axis.children],middle=labels[Math.floor(labels.length/2)];if(middle)axis.replaceChildren(middle)});
  }
  if(state.dashboardView==='construction'){
    board.querySelector('.clinic-scatter-title .metric-scope-tag')?.remove();
    const scatter=board.querySelector('.clinic-scatter svg');if(scatter){const axes=scatter.querySelectorAll('.scatter-axis-label');if(axes[0]){axes[0].textContent='';axes[0].removeAttribute('transform');axes[0].setAttribute('x','14');axes[0].setAttribute('y','85');['控','制','率'].forEach((ch,i)=>{const span=document.createElementNS('http://www.w3.org/2000/svg','tspan');span.setAttribute('x','14');span.setAttribute('dy',i?'1.1em':'0');span.textContent=ch;axes[0].append(span)})}if(axes[1])axes[1].textContent='覆盖率'}
    const f=overviewDemoFactor(currentNode()),primary=1800*f,integrated=1000*f,cards=[...board.querySelectorAll('.construction-kpis > .board-kpi')],service=cards.find(c=>c.querySelector(':scope > span')?.textContent.includes('一体化门诊服务人次')),frequency=cards.find(c=>c.querySelector(':scope > span')?.textContent.includes('人均就诊频率'));
    if(service){const strong=service.querySelector(':scope > strong'),share=service.querySelector('.clinic-visit-share');if(strong?.firstChild?.nodeType===Node.TEXT_NODE)strong.firstChild.nodeValue=Number(integrated.toFixed(2)).toString();if(share)share.textContent=`基层就诊总人次 ${Number(primary.toFixed(2))} 万人次，占比 ${(integrated/primary*100).toFixed(2)}%`}
    if(frequency){const label=frequency.querySelector(':scope > span'),strong=frequency.querySelector(':scope > strong'),unit=strong?.querySelector('em');if(label)label.textContent='年人均就诊次数';if(unit)unit.textContent='次/人年';if(strong?.firstChild?.nodeType===Node.TEXT_NODE)strong.firstChild.nodeValue=(1800/1850).toFixed(2)}
    board.querySelectorAll('.construction-kpis > .board-kpi').forEach(card=>{if(!card.querySelector(':scope > .metric-scope-tag'))card.insertAdjacentHTML('beforeend','<b class="metric-scope-tag scope-color-integrated">一体化</b>')});
    board.querySelectorAll('svg.construction-line:not(.construction-bar-chart)').forEach(svg=>{const box=(svg.getAttribute('viewBox')||'').split(/\s+/).map(Number);if(box.length===4&&box.every(Number.isFinite))svg.setAttribute('viewBox',`${box[0]-25} ${box[1]} ${box[2]+25} ${box[3]}`)});
  }
  if(state.dashboardView==='outcomes'){const layout=board.querySelector('.outcome-layout'),insights=layout?.querySelector('.outcome-insights');if(insights)layout.prepend(insights)}
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();
const dashboardAfterDetailReview=dashboard;
dashboard=function(){const root=document.createElement('div');root.innerHTML=dashboardAfterDetailReview();const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  board.querySelectorAll('.home-target-item').forEach(row=>{const value=row.querySelector('.home-target-actual'),name=row.querySelector('.home-target-label span')?.textContent.trim();if(value&&name){value.classList.add('metric-detail-trigger');value.dataset.detailLabel=`${name}控制率`;value.setAttribute('role','button');value.setAttribute('tabindex','0')}});
  board.querySelectorAll('.home-population-distribution .situation-bars > div').forEach((row,i)=>{if(i===0&&row.querySelector('strong'))row.querySelector('strong').dataset.detailLabel='3病叠加人数'});
  board.querySelectorAll('.risk-composition-row').forEach(row=>{const name=row.querySelector('span')?.textContent.trim(),value=row.querySelector('strong');if(value&&['高风险','中风险','低风险'].includes(name))value.dataset.detailLabel=`${name}患者数`});
  return root.innerHTML};
pages.dashboard=dashboard;
render();

// Keep the risk ranking scoped to the area selected on the map.
function riskRankingChildren(node){
  if(!node)return cities;
  if(state.city.startsWith('city:'))return counties.filter(item=>item.cityName===node.name&&item.name!=='西湖风景名胜区');
  if(state.city.startsWith('county:')){
    const city=node.cityName,county=node.name,prefix=`${city}/${county}/`;
    return Object.keys(window.RESIDENT_POPULATION?.towns||{}).filter(key=>key.startsWith(prefix)).map(key=>({name:key.slice(prefix.length),cityName:city,countyName:county}));
  }
  return [];
}
function riskRankingValue(node){
  if(!node.countyName)return homeMapValue(node,'highRisk');
  let hash=0;for(const c of `${node.cityName}/${node.countyName}/${node.name}`)hash=(hash*31+c.charCodeAt(0))>>>0;
  const parent=counties.find(item=>item.cityName===node.cityName&&item.name===node.countyName);
  return Math.max(0,Math.min(100,homeMapValue(parent,'highRisk')+((hash%1001)/1000-.5)*8));
}
const dashboardBeforeScopedRiskRanking=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeScopedRiskRanking();
  const board=root.querySelector('#dashboardBoard'),panel=board?.querySelector('.situation-risk-ranking');
  if(panel&&situationActive()){
    const province=homeMapValue(null,'highRisk'),items=riskRankingChildren(currentNode()).map(node=>({node,value:riskRankingValue(node)})).filter(item=>Number.isFinite(item.value)).sort((a,b)=>b.value-a.value),extent=Math.max(1,...items.map(item=>Math.abs(item.value-province)));
    const heading=panel.querySelector('.risk-ranking-heading span');if(heading)heading.textContent=!currentNode()?'地市':state.city.startsWith('city:')?'区县':'乡镇街道';
    const rows=panel.querySelector('.risk-ranking-rows');if(rows)rows.innerHTML=items.map(({node,value})=>{const delta=value-province;return `<div class="risk-ranking-row" data-risk-region="${esc(node.name)}"><span>${esc(node.name)}</span><div class="risk-ranking-track"><i class="${delta>=0?'above':'below'}" style="width:${Math.abs(delta)/extent*45}%"></i></div><small class="risk-ranking-value">${value.toFixed(2)}%</small><strong class="risk-region-detail" role="button" tabindex="0" aria-label="${esc(node.name)}高风险患者占比，查看下级区域">${delta>=0?'+':''}${delta.toFixed(2)}</strong></div>`}).join('');
  }
  const scatter=board?.querySelector('.clinic-scatter svg');
  if(scatter){scatter.querySelectorAll(':scope > line[stroke-dasharray]').forEach(line=>line.setAttribute('stroke','#369cff'));scatter.querySelectorAll('.construction-grid text[text-anchor="middle"]').forEach(text=>text.setAttribute('dy','6'))}
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();
document.addEventListener('click',event=>{
  const target=event.target.closest?.('.risk-region-detail');if(!target)return;
  const name=target.closest('.risk-ranking-row')?.dataset.riskRegion,node=riskRankingChildren(currentNode()).find(item=>item.name===name);if(!node)return;
  let children=[];
  if(!currentNode())children=counties.filter(item=>item.cityName===name&&item.name!=='西湖风景名胜区');
  else if(state.city.startsWith('city:')){const prefix=`${node.cityName}/${name}/`;children=Object.keys(window.RESIDENT_POPULATION?.towns||{}).filter(key=>key.startsWith(prefix)).map(key=>({name:key.slice(prefix.length),cityName:node.cityName,countyName:name}))}
  const rows=children.map(item=>({name:item.name,value:riskRankingValue(item)})).filter(item=>Number.isFinite(item.value)).sort((a,b)=>b.value-a.value);
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';dialog.innerHTML=`<header><h2>${esc(name)} · 高风险患者占比</h2><button type="button" data-close-risk aria-label="关闭">×</button></header><div class="home-summary-body"><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>区域名称</th><th>高风险患者占比</th></tr></thead><tbody>${rows.length?rows.map(row=>`<tr><td>${esc(row.name)}</td><td>${row.value.toFixed(2)}%</td></tr>`).join(''):'<tr><td colspan="2">暂无下级区域数据</td></tr>'}</tbody></table></div></div>`;
  (document.fullscreenElement||document.body).append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-close-risk]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
});

// The outcome groups keep independent detection/control selections.
const outcomeModes={core:'control',risk:'control'};
const dashboardBeforeOutcomeThreeColumns=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOutcomeThreeColumns();
  const layout=root.querySelector('.outcome-layout');if(state.dashboardView!=='outcomes'||!layout)return root.innerHTML;
  const originalMap=layout.querySelector('.saved-outcome-map')?.content.querySelector('.board-map')?.outerHTML||'';
  const metrics=[
    ['血压',[88.6,92.3,95.7],[62.4,68.9,74.5],[74.5,81.4,88.2],[48.6,55.5,62.3]],
    ['血糖',[82.4,89.1,93.6],[48.7,55.3,62.1],[59.3,69.5,79.6],[33.1,40.5,47.8]],
    ['血脂',[22.4,25.1,28.3],[21.6,24.2,26.8],[21.2,23.8,26.4],[20.8,23.1,25.4]],
    ['糖化血红蛋白',[65.3,74.8,83.4],[36.5,42.6,49.6],[35.2,46.8,58.3],[27.8,34.0,40.2]]
  ];
  const selectedRegion=currentNode();
  if(selectedRegion){
    const metricIndexes=[0,1,3,2];
    metrics.forEach((metric,i)=>{const index=metricIndexes[i],delta=outcomeRegionValue(selectedRegion,index,false)-outcomeMapReviewBases[index];for(let j=1;j<metric.length;j++)metric[j]=metric[j].map(value=>Math.max(0,Math.min(100,value+delta)))});
  }
  const group=(key,title)=>{const control=outcomeModes[key]==='control',index=key==='core'?(control?2:1):(control?4:3);return `<section class="outcome-new-panel outcome-group"><header><h2>${title} ｜ ${control?'控制率':'检测率'}</h2><button type="button" data-outcome-toggle="${key}">${control?'检测率':'控制率'}</button></header><p>三口径对照，黄线为 80% 目标</p><div class="outcome-new-grid">${metrics.map(metric=>`<div class="outcome-new-tile"><h3>${metric[0]}</h3>${metric[index].map((value,i)=>`<div class="outcome-new-bar"><span>${['全','专','一体化'][i]}</span><div><i style="width:${value}%;background:${['#3885f6','#ff873c','#65c5ff'][i]}"></i><b></b></div><strong>${value.toFixed(1)}%</strong></div>`).join('')}</div>`).join('')}</div></section>`};
  const names=['杭州','宁波','湖州','嘉兴','温州','绍兴','台州','金华','舟山','衢州','丽水'],offsets=[3.9,2.5,1.8,.9,.7,.1,-1.3,-2.5,-3.6,-5.2,-5.9],base=74.5;
  const ranking=`<section class="outcome-new-panel outcome-new-ranking"><header><h2>各地市控制率与省均值偏差 · 血压</h2></header><p>以省均值 ${base.toFixed(1)}% 为基准，绿色高于、红色低于省均值</p><div class="outcome-new-ranks">${names.map((name,i)=>`<div><span>${name}</span><div class="outcome-new-rank-track"><i class="${offsets[i]>=0?'positive':'negative'}" style="width:${Math.abs(offsets[i])/6*48}%"></i></div><strong>${offsets[i]>0?'+':''}${offsets[i].toFixed(1)} pp · ${(base+offsets[i]).toFixed(1)}%</strong></div>`).join('')}</div></section>`;
  const flows=[[58,24,10],[12,120,35],[0,7,92]],colors=['#fb5361','#ffbd4e','#4bc695'],source=[0,92,259],target=[0,70,221],sourceUsed=[0,0,0],targetUsed=[0,0,0],scale=0.73,top=15,gap=12;
  const sy=i=>top+source[i]*scale+i*gap,ty=i=>top+target[i]*scale+i*gap;
  const paths=flows.flatMap((row,i)=>row.map((value,j)=>{if(!value)return '';const y1=sy(i)+sourceUsed[i]*scale,y2=ty(j)+targetUsed[j]*scale,h=value*scale;sourceUsed[i]+=value;targetUsed[j]+=value;return `<path d="M 95 ${y1} C 260 ${y1}, 290 ${y2}, 455 ${y2} L 455 ${y2+h} C 290 ${y2+h}, 260 ${y1+h}, 95 ${y1+h} Z" fill="${colors[i]}" opacity=".34"><title>Q1 ${['高','中','低'][i]}风险 → Q2 ${['高','中','低'][j]}风险：${value} 万人</title></path>`})).join('');
  const sankey=`<section class="outcome-new-panel outcome-new-sankey"><header><h2>风险等级迁移（Q1 → Q2）</h2></header><p>流带宽度代表人数（万人），模拟数据</p><svg viewBox="0 0 550 310" role="img" aria-label="风险等级迁移桑基图，演示数据">${paths}${[92,167,99].map((v,i)=>`<rect x="82" y="${sy(i)}" width="13" height="${v*scale}" fill="${colors[i]}"/><text x="99" y="${sy(i)+v*scale/2}">Q1 ${['高','中','低'][i]}风险</text>`).join('')}${[70,151,137].map((v,i)=>`<rect x="455" y="${ty(i)}" width="13" height="${v*scale}" fill="${colors[i]}"/><text x="473" y="${ty(i)+v*scale/2}">Q2 ${['高','中','低'][i]}风险</text>`).join('')}</svg></section>`;
  const series=[[58.1,59.6,61,62.4],[63.2,65.5,67.3,68.9],[68.4,70.8,72.9,74.5]],lineColors=['#3885f6','#ff873c','#65c5ff'],x=i=>55+i*145,y=v=>660-(v-50)*18;
  const trend=`<section class="outcome-new-panel outcome-new-trend"><header><h2>管理成效趋势 · 血压控制率</h2></header><p>分季度三口径控制率趋势，模拟数据</p><div class="outcome-trend-legend">${['全口径','专档','一体化'].map((name,i)=>`<span style="color:${lineColors[i]}">● ${name}</span>`).join('')}</div><svg viewBox="0 0 540 710" preserveAspectRatio="none" role="img" aria-label="季度血压控制率趋势">${[50,55,60,65,70,75,80].map(v=>`<line x1="55" x2="490" y1="${y(v)}" y2="${y(v)}" stroke="#25436b"/><text x="48" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('')}<line x1="55" x2="490" y1="${y(80)}" y2="${y(80)}" stroke="#e4ad4c" stroke-dasharray="5 4"/>${series.map((values,j)=>`<polyline fill="none" stroke="${lineColors[j]}" stroke-width="2.5" points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"/>${values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${lineColors[j]}"/><text x="${x(i)}" y="${y(v)-10}" text-anchor="middle">${v.toFixed(1)}%</text>`).join('')}`).join('')}${['Q1','Q2','Q3','Q4'].map((q,i)=>`<text x="${x(i)}" y="690" text-anchor="middle">${q}</text>`).join('')}</svg></section>`;
  layout.className='board-columns outcome-layout outcome-three-columns';
  layout.innerHTML=`<div class="outcome-new-insights"><div><strong>一体化管理成效更显著</strong><span>一体化管理人群血压控制率 74.5%，全口径 62.4%；检测率 95.7%，全口径 88.6%。</span></div><div><strong>风险持续下沉</strong><span>Q1 → Q2 高风险由 92.0 万降至 70.0 万，其中 24.0 万转中风险、10.0 万转低风险。</span></div><div><strong>短板仍需重点追踪</strong><span>全口径血脂控制率 41.2%、糖化血红蛋白控制率 36.5%；高风险人群血压检测率 74.5%。</span></div></div><div class="outcome-new-left">${group('core','核心指标')}${group('risk','高风险人群')}</div><div class="outcome-new-middle">${ranking}${sankey}</div>${trend}<template class="outcome-map-template">${originalMap}</template>`;
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-outcome-toggle]');if(!button)return;const key=button.dataset.outcomeToggle;outcomeModes[key]=outcomeModes[key]==='control'?'detection':'control';render()});
render();

const dashboardBeforeScatterQuadrants=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeScatterQuadrants();
  const svg=root.querySelector('.clinic-scatter svg');
  if(svg){
    const lines=[...svg.querySelectorAll(':scope > line[stroke-dasharray]')];
    const vertical=lines.find(line=>line.getAttribute('x1')===line.getAttribute('x2'));
    const horizontal=lines.find(line=>line.getAttribute('y1')===line.getAttribute('y2'));
    if(vertical&&horizontal){
      const x=Number(vertical.getAttribute('x1')),y=Number(horizontal.getAttribute('y1'));
      const left=65,right=885,top=30,bottom=175;
      const ns='http://www.w3.org/2000/svg';
      [[x,top,right-x,y-top,'#40c8a2'],[left,y,x-left,bottom-y,'#e65b72']].forEach(([rx,ry,width,height,color])=>{
        const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',rx);rect.setAttribute('y',ry);rect.setAttribute('width',Math.max(0,width));rect.setAttribute('height',Math.max(0,height));rect.setAttribute('fill',color);rect.setAttribute('fill-opacity','.11');rect.setAttribute('pointer-events','none');svg.insertBefore(rect,svg.firstChild);
      });
      [vertical,horizontal].forEach(line=>{line.setAttribute('stroke','#65baff');line.setAttribute('stroke-width','2');line.setAttribute('opacity','.95')});
    }
  }
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();


const outcomeMetricChoice={overall:0,high:0,trend:0};
const dashboardBeforeOutcomeRankingTabs=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeOutcomeRankingTabs();
  const layout=root.querySelector('.outcome-three-columns');if(!layout)return root.innerHTML;
  const labels=['血压','血糖','糖化血红蛋白','血脂'];
  const baseValues=[[74.5,62.1,49.6,26.8],[62.3,47.8,40.2,25.4]];
  const offsets=[[3.9,2.5,1.8,.9,.7,.1,-1.3,-2.5,-3.6,-5.2,-5.9],[3.9,2.3,1.3,.6,.4,-.3,-.9,-2.1,-3.3,-4.7,-5.9],[3.3,2,1,.7,.2,-.1,-.8,-1.7,-2.6,-4.3,-5.1],[2.6,2.1,1.5,1,.4,-.2,-.8,-1.5,-2.3,-3.1,-4.2]];
  const names=['杭州','宁波','湖州','嘉兴','温州','绍兴','台州','金华','舟山','衢州','丽水'];
  const tabs=(key)=>`<div class="outcome-metric-tabs" role="group" aria-label="选择指标">${labels.map((label,i)=>`<button type="button" data-outcome-metric="${key}" data-metric-index="${i}" aria-pressed="${outcomeMetricChoice[key]===i}">${label}</button>`).join('')}</div>`;
  const ranking=(key,title)=>{const index=outcomeMetricChoice[key],base=baseValues[key==='high'?1:0][index],node=currentNode(),level=state.city==='all'?'province':state.city.split(':')[0];let units=level==='province'?(state.mapScope==='county'?counties:cities):level==='city'?counties.filter(item=>item.cityName===node.name):[];let rows=units.map(item=>({name:item.name,value:outcomeRegionValue(item,index,key==='high')}));if(level==='county'){const prefix=`${node.cityName}/${node.name}/`;rows=Object.keys(window.RESIDENT_POPULATION?.towns||{}).filter(name=>name.startsWith(prefix)).map(name=>{const town=name.slice(prefix.length),seed=[...town].reduce((sum,char)=>sum+char.charCodeAt(0),0);return {name:town,value:Math.max(0,Math.min(100,outcomeRegionValue(node,index,key==='high')+(seed%101-50)/20))}})}rows=rows.filter(row=>Number.isFinite(row.value)).map(row=>({...row,delta:row.value-base})).sort((a,b)=>b.delta-a.delta);const extent=Math.max(1,...rows.map(row=>Math.abs(row.delta))),regionLabel=level==='city'?'区县':level==='county'?'乡镇街道':state.mapScope==='county'?'区县':'地市';return `<section class="outcome-new-panel outcome-new-ranking situation-risk-ranking"><header><h2>${title}</h2>${tabs(key)}</header><div class="outcome-ranking-heading"><span>${regionLabel}</span><span>← 低于均值　|　高于均值 →</span><span>控制率</span><span>偏差</span></div><div class="outcome-ranking-rows" style="grid-template-rows:repeat(${Math.max(11,rows.length)},minmax(0,1fr))">${rows.map(({name,value,delta})=>`<div class="risk-ranking-row"><span>${esc(name.replace(/市$/,''))}</span><div class="risk-ranking-track"><i class="${delta>=0?'above':'below'}" style="width:${Math.abs(delta)/extent*48}%"></i></div><small class="risk-ranking-value">${value.toFixed(2)}%</small><strong>${delta>=0?'+':''}${delta.toFixed(2)}</strong></div>`).join('')||'<div>暂无下级区域数据</div>'}</div><div class="outcome-ranking-average">省均值 ${base.toFixed(2)}%</div></section>`};
  const middle=layout.querySelector('.outcome-new-middle'),sankey=middle.querySelector('.outcome-new-sankey'),trend=layout.querySelector('.outcome-new-trend');
  middle.innerHTML=ranking('overall','控制率与省均值偏差')+ranking('high','高风险人群控制率与省均值偏差');
  sankey.querySelector('h2').textContent='风险等级迁移';sankey.querySelector('svg').setAttribute('preserveAspectRatio','xMidYMid meet');
  trend.querySelector('h2').textContent='控制率趋势';trend.querySelector('header').insertAdjacentHTML('beforeend',tabs('trend'));
  const finalValues=[[62.4,68.9,74.5],[48.7,55.3,62.1],[36.5,42.6,49.6],[21.6,24.2,26.8]][outcomeMetricChoice.trend],series=finalValues.map(value=>outcomeMetricChoice.trend===3?[Math.max(20,value-1.5),Math.max(20,value-1),Math.max(20,value-.5),value]:[value-6.1,value-3.8,value-1.7,value]);
  const min=Math.max(0,Math.floor((Math.min(...series.flat())-3)/5)*5),step=Math.ceil((Math.max(...series.flat())+3-min)/4),max=min+step*4,x=i=>70+i*140,y=v=>285-(v-min)/(max-min)*240,colors=['#3885f6','#ff873c','#65c5ff'];
  trend.querySelector('svg').outerHTML=`<svg viewBox="0 0 540 320" preserveAspectRatio="none" role="img" aria-label="${labels[outcomeMetricChoice.trend]}控制率季度趋势，演示数据">${Array.from({length:5},(_,i)=>{const v=min+step*i;return `<line x1="85" x2="490" y1="${y(v)}" y2="${y(v)}" stroke="#25436b"/><text class="outcome-axis-label" x="76" y="${y(v)}" text-anchor="end">${v}%</text>`}).join('')}${series.map((values,j)=>`<polyline fill="none" stroke="${colors[j]}" stroke-width="2.5" points="${values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}"/>${values.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${colors[j]}"/><text class="outcome-point-label" x="${x(i)}" y="${y(v)-12}" text-anchor="${i===0?'start':i===3?'end':'middle'}">${v.toFixed(2)}%</text>`).join('')}`).join('')}${['Q1','Q2','Q3','Q4'].map((q,i)=>`<text class="outcome-axis-label" x="${x(i)}" y="310" text-anchor="middle">${q}</text>`).join('')}</svg>`;
  const right=document.createElement('div');right.className='outcome-new-right';right.append(sankey,trend);layout.append(right);
  trend.querySelectorAll('svg > line').forEach(line=>{line.setAttribute('x1','55');line.setAttribute('x2','510')});
  trend.querySelectorAll('svg > .outcome-axis-label[text-anchor="end"]').forEach(label=>label.setAttribute('x','48'));
  layout.querySelectorAll('.outcome-group > p, .outcome-new-sankey > p, .outcome-new-trend > p').forEach(el=>el.remove());
  layout.querySelectorAll('.outcome-new-tile h3').forEach(el=>el.insertAdjacentHTML('beforeend','<span class="outcome-tile-target">目标 80.00%</span>'));
  const sankeySvg=sankey.querySelector('svg');
  const node=currentNode(),factor=overviewDemoFactor(node),high=(149.7+748.5*demoLocalDeviation(node)*.45)*factor,middleRisk=135*factor;
  const totals=[high,middleRisk,Math.max(0,374.25*factor-high-middleRisk)];
  const weights=[[.8,.12,.04],[.16,.78,.14],[.04,.10,.82]],flows=weights.map(row=>row.map((weight,j)=>weight*totals[j]));
  const sources=flows.map(row=>row.reduce((a,b)=>a+b,0)),total=totals.reduce((a,b)=>a+b,0),scale=total?230/total:0,gap=10,top=48,levels=['高风险','中风险','低风险'],flowColors=['#ed465b','#e9b437','#22bd79'];
  const positions=values=>values.map((_,i)=>top+values.slice(0,i).reduce((a,b)=>a+b,0)*scale+i*gap),starts=positions(sources),ends=positions(totals),usedSource=[0,0,0],usedTarget=[0,0,0];
  const paths=flows.flatMap((row,i)=>row.map((value,j)=>{const a=starts[i]+usedSource[i]*scale,b=ends[j]+usedTarget[j]*scale,h=value*scale;usedSource[i]+=value;usedTarget[j]+=value;const tip=`上期${levels[i]} → 本期${levels[j]}；迁移人数 ${value.toFixed(2)} 万人`;return `<path class="outcome-flow" data-board-tip="${tip}" d="M 115 ${a} C 225 ${a}, 295 ${b}, 405 ${b} L 405 ${b+h} C 295 ${b+h}, 225 ${a+h}, 115 ${a+h} Z" fill="${flowColors[i]}" opacity=".42"/>`})).join('');
  const nodes=(values,ys,side)=>values.map((value,i)=>{const x=side==='上期'?5:405,center=ys[i]+value*scale/2;return `<rect class="outcome-risk-node" x="${x}" y="${ys[i]}" width="110" height="${value*scale}" rx="6" fill="${flowColors[i]}" data-board-tip="${side}${levels[i]}；人数 ${value.toFixed(2)} 万人"/><text class="outcome-risk-node-label" x="${x+55}" y="${center-10}" text-anchor="middle">${levels[i].replace('风险','')}</text><text class="outcome-risk-node-value" x="${x+55}" y="${center+13}" text-anchor="middle">${value.toFixed(2)}</text>`}).join('');
  sankeySvg.setAttribute('viewBox','0 45 520 255');sankeySvg.setAttribute('preserveAspectRatio','xMidYMin meet');sankeySvg.innerHTML=`<text class="outcome-risk-period" x="5" y="20">上期（高风险 ${sources[0].toFixed(2)} 万人）</text><text class="outcome-risk-period" x="515" y="20" text-anchor="end">本期（高风险 ${totals[0].toFixed(2)} 万人）</text>`+paths+nodes(sources,starts,'上期')+nodes(totals,ends,'本期');
  [...sankeySvg.querySelectorAll('.outcome-flow')].slice(0,3).forEach(path=>sankeySvg.insertBefore(path,sankeySvg.querySelector('rect')));
  const insight=layout.querySelector('.outcome-new-insights > div:nth-child(2) span');if(insight){insight.previousElementSibling.textContent='风险等级迁移';insight.textContent=`${(flows[0][1]+flows[0][2]).toFixed(2)} 万高风险人群成功降级；抵消 ${(flows[1][0]+flows[2][0]).toFixed(2)} 万人群风险反弹带来的负向影响。`}
  layout.querySelectorAll('.outcome-new-bar').forEach(row=>{const group=row.closest('.outcome-group'),metric=row.closest('.outcome-new-tile')?.querySelector('h3')?.childNodes[0]?.textContent.trim(),population=row.querySelector('span')?.textContent.trim(),value=row.querySelector('strong')?.textContent.trim(),mode=group?.querySelector('h2')?.textContent.trim();row.querySelector('i')?.setAttribute('data-board-tip',`${mode}；${metric}；${population} ${value}`)});
  layout.querySelectorAll('.outcome-new-ranking .risk-ranking-row').forEach(row=>{const section=row.closest('section'),name=row.querySelector('span')?.textContent.trim(),value=row.querySelector('small')?.textContent.trim(),delta=row.querySelector('strong')?.textContent.trim(),title=section?.querySelector('h2')?.textContent.trim(),average=section?.querySelector('.outcome-ranking-average')?.textContent.trim().replace('省均值','').trim();row.querySelector('i')?.setAttribute('data-board-tip',`${name}；${title}；偏差 ${delta} 个百分点；控制率 ${value}；省均值 ${average}`)});
  const shortfall=layout.querySelector('.outcome-new-insights > div:nth-child(3) span');if(shortfall)shortfall.textContent='全口径血脂检测率 22.40%、控制率 21.60%，糖化血红蛋白控制率 36.50%；高风险人群血压检测率 74.50%。';
  const quarterTip=i=>[`${labels[outcomeMetricChoice.trend]}控制率 · Q${i+1}`,...['全口径','专档','一体化'].map((scope,j)=>[scope,`${series[j][i].toFixed(2)}%`])];
  const trendSvg=trend.querySelector('svg'),svgNS='http://www.w3.org/2000/svg';
  [0,1,2,3].forEach(i=>{const hit=document.createElementNS(svgNS,'rect');hit.setAttribute('x',i===0?'55':String(x(i)-70));hit.setAttribute('y','35');hit.setAttribute('width',i===0?'85':i===3?'90':'140');hit.setAttribute('height','250');hit.setAttribute('fill','transparent');hit.dataset.boardTip=`Q${i+1}`;hit.dataset.tipRows=JSON.stringify(quarterTip(i));trendSvg.insertBefore(hit,trendSvg.firstChild)});
  trend.querySelectorAll('circle').forEach((circle,index)=>{const i=index%4;circle.setAttribute('data-board-tip',`Q${i+1}`);circle.dataset.tipRows=JSON.stringify(quarterTip(i));circle.setAttribute('r','6')});
  trend.querySelectorAll('polyline').forEach(line=>{line.setAttribute('stroke-width','5');line.setAttribute('pointer-events','none')});
  layout.querySelectorAll('.outcome-new-group, .outcome-group').forEach(group=>group.querySelectorAll('.outcome-new-bar strong').forEach(el=>{const value=parseFloat(el.textContent);if(Number.isFinite(value))el.textContent=`${value.toFixed(2)}%`}));
  layout.querySelectorAll('.outcome-group > p').forEach(el=>{el.textContent=el.textContent.replace(/(\d+(?:\.\d+)?)%/g,(_,value)=>`${Number(value).toFixed(2)}%`)});
  layout.querySelectorAll('.outcome-new-insights span').forEach(el=>{el.textContent=el.textContent.replace(/(\d+(?:\.\d+)?)%/g,(_,value)=>`${Number(value).toFixed(2)}%`)});
  const detail=(el,label,value)=>{if(!el)return;el.classList.add('metric-detail-trigger');el.dataset.outcomeDetail='1';el.dataset.detailLabel=label;el.dataset.detailValue=value;el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`${label} ${value}，查看区域明细`)};
  layout.querySelectorAll('.outcome-new-bar').forEach(row=>{const group=row.closest('.outcome-group'),metric=row.closest('.outcome-new-tile').querySelector('h3').firstChild.textContent.trim(),scope=row.querySelector('span').textContent.trim(),mode=group.querySelector('h2').textContent.split('｜')[1].trim();detail(row.querySelector('strong'),`${group.querySelector('h2').textContent.split('｜')[0].trim()} · ${scope} · ${metric}${mode}`,row.querySelector('strong').textContent.trim())});
  trend.querySelectorAll('circle,.outcome-point-label').forEach(el=>{const list=el.tagName.toLowerCase()==='circle'?[...trend.querySelectorAll('circle')]:[...trend.querySelectorAll('.outcome-point-label')],index=list.indexOf(el),j=Math.floor(index/4),i=index%4;detail(el,`${labels[outcomeMetricChoice.trend]}控制率 · ${['全口径','专档','一体化'][j]} · Q${i+1}`,`${series[j][i].toFixed(2)}%`)});
  layout.querySelectorAll('.outcome-ranking-rows .risk-ranking-row').forEach(row=>{const section=row.closest('section'),key=section.querySelector('[data-outcome-metric]').dataset.outcomeMetric,metric=labels[outcomeMetricChoice[key]],region=row.querySelector('span').textContent.trim(),rate=row.querySelector('small');detail(rate,`${region} · ${key==='high'?'高风险人群 · ':''}${metric}控制率`,rate.textContent.trim());rate.dataset.detailRegion=region;const value=row.querySelector('strong');detail(value,`${region} · ${key==='high'?'高风险人群 · ':''}${metric}控制率偏差`,`${value.textContent.trim()} pp`);value.dataset.detailRegion=region});
  layout.querySelectorAll('.outcome-new-insights span').forEach(span=>{span.innerHTML=span.textContent.replace(/(-?\d+(?:\.\d+)?\s*(?:%|万人))/g,value=>`<b class="outcome-insight-number">${value}</b>`);span.querySelectorAll('.outcome-insight-number').forEach(el=>detail(el,`${span.previousElementSibling.textContent} · ${span.textContent.slice(0,span.textContent.indexOf(el.textContent)).split(/[，；、]/).pop().trim()}`,el.textContent.trim()))});
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-outcome-metric]');if(!button)return;outcomeMetricChoice[button.dataset.outcomeMetric]=Number(button.dataset.metricIndex);render()});
render();

// Apply the November 17 dashboard review.
let outcomeHighOnly=false;
let outcomeRankingHigh=false;
function dashboardLowRegionSummary(label,getValue,average){
  const node=currentNode(),level=state.city==='all'?'province':state.city.split(':')[0];
  const units=level==='province'?(state.mapScope==='county'?counties:cities):level==='city'?counties.filter(item=>item.cityName===node?.name):node?[node]:[];
  const rows=units.map(item=>({name:item.name,value:getValue(item)})).filter(item=>Number.isFinite(item.value)).sort((a,b)=>a.value-b.value);
  if(!rows.length||!Number.isFinite(average))return `${label}暂无可比较的区域数据。`;
  const row=rows[0],status=row.value<average?'偏低':'未低于省均值';
  return `${row.name}${label}${status}，为 ${row.value.toFixed(2)}%，省均值 ${average.toFixed(2)}%。`;
}
const dashboardBeforeNovember17Review=dashboard;
dashboard=function(){
  outcomeMetricChoice.high=outcomeMetricChoice.overall;
  const root=document.createElement('div');root.innerHTML=dashboardBeforeNovember17Review();
  const board=root.querySelector('#dashboardBoard');if(!board)return root.innerHTML;
  const table=board.querySelector('.home-disease-table');
  board.querySelectorAll('.risk-composition-strip > div').forEach(segment=>{segment.textContent=(segment.getAttribute('title').match(/占比\s*([\d.]+%)/)||[])[1]||''});
  if(table){
    table.closest('.home-disease-combined')?.querySelector('h2')?.insertAdjacentHTML('beforeend','<small class="disease-unit">单位：万人</small>');
    table.querySelectorAll('.disease-table-row').forEach((row,i)=>row.querySelectorAll(':scope > div').forEach(cell=>{
      cell.querySelector(':scope > small')?.remove();
      const ratio=cell.querySelector('em');if(ratio&&i){ratio.textContent='↓ '+(ratio.textContent.match(/[\d.]+%/)||[''])[0];cell.prepend(ratio)}
    }));
  }
  const scatter=board.querySelector('.clinic-scatter svg');
  if(scatter){
    scatter.querySelectorAll('.construction-grid text').forEach(t=>{const v=parseFloat(t.textContent);if(Number.isFinite(v))t.textContent=`${Math.round(v)}%`});
    const axis=scatter.querySelectorAll('.scatter-axis-label')[1];if(axis){axis.setAttribute('x','55');axis.setAttribute('y','195');axis.setAttribute('text-anchor','end')}
    const lines=[...scatter.querySelectorAll(':scope > line[stroke-dasharray]')],vertical=lines.find(l=>l.getAttribute('x1')===l.getAttribute('x2')),horizontal=lines.find(l=>l.getAttribute('y1')===l.getAttribute('y2'));
    const key=state.clinicScatterMetric||'bloodPressure',ns='http://www.w3.org/2000/svg';
    [[vertical,constructionValue(null,'construction'),'x'],[horizontal,clinicScatterValue(null,key),'y']].forEach(([line,value,direction])=>{if(!line||!Number.isFinite(value))return;const text=document.createElementNS(ns,'text');text.setAttribute('class','scatter-benchmark-label');text.setAttribute('x',direction==='x'?line.getAttribute('x1'):'61');text.setAttribute('y',direction==='x'?'211':String(Number(line.getAttribute('y1'))-4));text.setAttribute('text-anchor',direction==='x'?'middle':'end');text.textContent=`${value.toFixed(2)}%`;scatter.append(text)});
    board.querySelectorAll('[data-clinic-quadrant] span').forEach(el=>{el.textContent=el.textContent.replace(/^(高覆盖|低覆盖)(高成效|低成效)$/,'$1-$2')});
  }
  const layout=board.querySelector('.outcome-three-columns');
  if(layout){
    const middle=layout.querySelector('.outcome-new-middle'),right=layout.querySelector('.outcome-new-right'),template=layout.querySelector('.outcome-map-template');
    const rankings=[...middle.querySelectorAll('.outcome-new-ranking')],map=template?.content.querySelector('.board-map');
    if(map){
      middle.replaceChildren(map);
      const title=map.querySelector('.panel-head h2');if(title)title.textContent='浙江省控制率';
      map.querySelector('.outcome-map-tabs')?.remove();
      const panel=map.querySelector('.map-panel');
      title?.insertAdjacentHTML('afterend',`<div class="outcome-population-tabs" role="group" aria-label="选择人群"><button type="button" data-outcome-population="all" aria-pressed="${!outcomeHighOnly}">全部</button><button type="button" data-outcome-population="high" aria-pressed="${outcomeHighOnly}">高风险</button></div>`);
      panel?.insertAdjacentHTML('beforeend',`<div class="outcome-metric-tabs outcome-map-metric-tabs" role="group" aria-label="选择地图指标">${['血压','血糖','糖化血红蛋白','血脂'].map((label,i)=>`<button type="button" data-outcome-metric="overall" data-metric-index="${i}" aria-pressed="${outcomeMetricChoice.overall===i}">${label}</button>`).join('')}</div>`);
      const notice=map.querySelector('.outcome-notice');
      if(notice){notice.className='outcome-summary-ticker board-ticker';notice.innerHTML=`<span>管理成效总结</span><strong></strong>`;notice.querySelector('strong').textContent=dashboardLowRegionSummary(`${outcomeHighOnly?'高风险人群':''}${['血压','血糖','糖化血红蛋白','血脂'][outcomeMetricChoice.overall]}控制率`,node=>mapValue(node),provinceMetricValue())}
    }
    right.querySelector('.outcome-new-trend')?.remove();
    const selectedRanking=rankings[outcomeRankingHigh?1:0];
    right.append(selectedRanking);
    selectedRanking.querySelector('header .outcome-metric-tabs')?.replaceWith(Object.assign(document.createElement('div'),{className:'outcome-population-tabs outcome-ranking-population-tabs',innerHTML:`<button type="button" data-ranking-population="all" aria-pressed="${!outcomeRankingHigh}">全部</button><button type="button" data-ranking-population="high" aria-pressed="${outcomeRankingHigh}">高风险</button>`}));
    const left=layout.querySelector('.outcome-new-left'),groups=left.querySelectorAll('.outcome-group');
    groups[outcomeHighOnly?0:1]?.remove();
    const group=left.querySelector('.outcome-group');
    if(group){const key=outcomeHighOnly?'risk':'core',button=group.querySelector('[data-outcome-toggle]');button?.insertAdjacentHTML('beforebegin',`<div class="outcome-mode-tabs">${[['control','控制率'],['detection','检测率']].map(([value,label])=>`<button type="button" data-outcome-mode="${value}" aria-pressed="${outcomeModes[key]===value}">${label}</button>`).join('')}</div>`);button?.remove()}
    group?.querySelectorAll('.outcome-tile-target,.outcome-new-bar b').forEach(el=>el.remove());
    const grid=group?.querySelector('.outcome-new-grid');if(grid){const tiles=[...grid.children];if(tiles.length===4)grid.append(tiles[3],tiles[2])}
    if(currentNode()&&group){const insight=layout.querySelector('.outcome-new-insights > div:first-child'),pressure=group.querySelector('.outcome-new-tile');if(insight&&pressure){const values=[...pressure.querySelectorAll('strong')].map(el=>el.textContent.trim());insight.querySelector('strong').textContent=`${currentNode().name}管理成效`;insight.querySelector('span').textContent=`${outcomeHighOnly?'高风险人群':'核心指标'}血压${outcomeModes[outcomeHighOnly?'risk':'core']==='control'?'控制率':'检测率'}：全 ${values[0]}，专 ${values[1]}，一体化 ${values[2]}。`}}
    const sankey=right.querySelector('.outcome-new-sankey'),paths=[...sankey.querySelectorAll('.outcome-flow')];
    sankey.querySelector('header')?.insertAdjacentHTML('beforeend','<div class="outcome-sankey-unit">单位：万人</div>');
    sankey.querySelectorAll('.outcome-risk-period').forEach(el=>el.remove());
    const flow=(from,to)=>Number(paths.find(path=>path.dataset.boardTip.startsWith(`上期${from}风险 → 本期${to}风险`))?.dataset.boardTip.match(/([\d.]+) 万人/)?.[1]||0);
    const hm=flow('高','中'),hl=flow('高','低'),mh=flow('中','高'),lh=flow('低','高');
    if(paths.length===9)sankey.querySelector('svg').insertAdjacentHTML('beforebegin',`<div class="outcome-migration-summary"><div><b>${(hm+hl).toFixed(2)}</b> 万人风险下降：高→中 <b>${hm.toFixed(2)}</b> 万人、高→低 <b>${hl.toFixed(2)}</b> 万人</div><div><b>${(mh+lh).toFixed(2)}</b> 万人风险上升：中→高 <b>${mh.toFixed(2)}</b> 万人、低→高 <b>${lh.toFixed(2)}</b> 万人</div></div>`);
    if(outcomeHighOnly&&!currentNode()){const insights=layout.querySelectorAll('.outcome-new-insights > div');insights[0].querySelector('strong').textContent='高风险人群管理成效';insights[0].querySelector('span').textContent='高风险人群一体化血压控制率 62.30%，全口径 48.60%；检测率 88.20%，全口径 74.50%。';insights[2].querySelector('span').textContent='高风险人群全口径血脂控制率 20.80%，糖化血红蛋白控制率 27.80%。'}
    template?.remove();
  }
  if(state.dashboardView==='construction'){
    const title=board.querySelector('.board-map .panel-head h2');if(title)title.textContent='浙江省一体化门诊覆盖率';
    const summary=board.querySelector('.clinic-summary');if(summary){const message=dashboardLowRegionSummary('一体化门诊覆盖率',node=>constructionValue(node,'construction'),constructionValue(null,'construction'));summary.dataset.items=JSON.stringify([message]);summary.querySelector('span').textContent=message}
    board.querySelectorAll('.board-stack:last-child .construction-panel:first-child .construction-grid text').forEach(el=>{const n=parseFloat(el.textContent);if(Number.isFinite(n))el.textContent=`${Math.round(n)}%`});
  }
  const mapModes=board.querySelector('.board-map-modes'),mapZoomControls=board.querySelector('.board-map .map-zoom');
  if(mapModes&&mapZoomControls)mapModes.append(mapZoomControls);
  const mapMetricTabs=board.querySelector('.outcome-map-metric-tabs');if(mapModes&&mapMetricTabs)mapModes.append(mapMetricTabs);
  const populationTabs=board.querySelector('.outcome-population-tabs'),outcomeModeTabs=board.querySelector('.outcome-group .outcome-mode-tabs');if(populationTabs&&outcomeModeTabs)outcomeModeTabs.before(populationTabs);
  const walker=document.createTreeWalker(board,NodeFilter.SHOW_TEXT),unitNodes=[];
  while(walker.nextNode())unitNodes.push(walker.currentNode);
  unitNodes.forEach(node=>{
    if(node.parentElement.closest('style,script,title,option'))return;
    if(/^(万人次|万份|万次|万人|次\/人年|次\/人|人次|家|人|次|万)$/.test(node.nodeValue.trim())&&node.parentElement.textContent.trim()===node.nodeValue.trim()){node.parentElement.classList.add('dashboard-unit');return}
    const text=node.nodeValue,pattern=/(?<=\d)(\s*)(万人次|万份|万次|万人|次\/人年|次\/人|人次|(?:家|人|次|万)(?![\u4e00-\u9fff]))/g;
    if(!pattern.test(text))return;
    pattern.lastIndex=0;const fragment=document.createDocumentFragment();let last=0,match;
    while((match=pattern.exec(text))){fragment.append(document.createTextNode(text.slice(last,match.index)+match[1]));const unit=node.parentElement.namespaceURI==='http://www.w3.org/2000/svg'?document.createElementNS('http://www.w3.org/2000/svg','tspan'):document.createElement('span');unit.setAttribute('class','dashboard-unit');unit.textContent=match[2];fragment.append(unit);last=pattern.lastIndex}
    fragment.append(document.createTextNode(text.slice(last)));node.replaceWith(fragment);
  });
  return root.innerHTML;
};
pages.dashboard=dashboard;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-ranking-population]');if(!button)return;outcomeRankingHigh=button.dataset.rankingPopulation==='high';render()});
const outcomeMapBeforeRiskFilter=mapValue,outcomeProvinceBeforeRiskFilter=provinceMetricValue;
const outcomeHighBases=[62.3,47.8,40.2,25.4];
mapValue=function(node){const value=outcomeMapBeforeRiskFilter(node),i=outcomeMapReviewKeys.indexOf(state.mapMetric);return state.dashboardView==='outcomes'&&outcomeHighOnly&&i>=0&&Number.isFinite(value)?value-outcomeMapReviewBases[i]+outcomeHighBases[i]:value};
provinceMetricValue=function(){const i=outcomeMapReviewKeys.indexOf(state.mapMetric);return state.dashboardView==='outcomes'&&outcomeHighOnly&&i>=0?outcomeHighBases[i]:outcomeProvinceBeforeRiskFilter()};
const outcomeTooltipBeforeRiskFilter=mapTooltip;
mapTooltip=function(node){if(state.dashboardView!=='outcomes'||!outcomeHighOnly)return outcomeTooltipBeforeRiskFilter(node);const value=mapValue(node),average=provinceMetricValue(),i=outcomeMapReviewKeys.indexOf(state.mapMetric);if(!Number.isFinite(value)||i<0)return outcomeTooltipBeforeRiskFilter(node);return `<div class="map-tooltip"><strong>${esc(fullName(node))}</strong><div><span>高风险人群${['血压','血糖','糖化血红蛋白','血脂'][i]}控制率</span><b>${value.toFixed(2)}%</b></div><div><span>省均值</span><b>${average.toFixed(2)}%</b></div><div><span>与省均值差</span><b>${value>=average?'+':''}${(value-average).toFixed(2)} 个百分点</b></div></div>`};
document.addEventListener('click',event=>{
  const filter=event.target.closest?.('[data-outcome-population]');if(filter){outcomeHighOnly=filter.dataset.outcomePopulation==='high';render();return}
  const mode=event.target.closest?.('[data-outcome-mode]');if(mode){outcomeModes[outcomeHighOnly?'risk':'core']=mode.dataset.outcomeMode;render();return}
  const tab=event.target.closest?.('[data-outcome-metric]');if(tab&&state.dashboardView==='outcomes'){const i=Number(tab.dataset.metricIndex);outcomeMetricChoice.overall=i;outcomeMetricChoice.high=i;state.mapMetric=outcomeMapReviewKeys[i]}
},true);
document.addEventListener('click',event=>{
  if(!event.target.closest?.('.outcome-summary-ticker'))return;
  const index=outcomeMapReviewKeys.indexOf(state.mapMetric),label=['血压','血糖','糖化血红蛋白','血脂'][index]||'血压',average=provinceMetricValue(),rows=cities.map(city=>({name:city.name,value:mapValue(city)})).filter(row=>Number.isFinite(row.value)).sort((a,b)=>b.value-a.value),above=rows.filter(row=>row.value>average),below=rows.filter(row=>row.value<average);
  const dialog=document.createElement('dialog');dialog.className='home-summary-dialog';dialog.innerHTML=`<header><h2>浙江省 · 管理成效总结</h2><button type="button" data-summary-close aria-label="关闭">×</button></header><div class="home-summary-body"><section><h3>${outcomeHighOnly?'高风险人群':''}${label}控制率<span class="summary-average">省均值：${average.toFixed(2)}%</span></h3><p class="summary-action">高于省均值 ${above.length} 个地市，低于省均值 ${below.length} 个地市。</p><details><summary>查看具体明细</summary><div class="summary-table-wrap"><table class="summary-detail-table"><thead><tr><th>区域名称</th><th>控制率</th><th>与省均值偏差</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.name)}</td><td>${row.value.toFixed(2)}%</td><td>${row.value>=average?'+':''}${(row.value-average).toFixed(2)} 个百分点</td></tr>`).join('')}</tbody></table></div></details></section></div>`;(document.fullscreenElement||document.body).append(dialog);dialog.addEventListener('click',e=>{if(e.target.closest('[data-summary-close]'))dialog.close()});dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
});
render();
document.addEventListener('click',event=>{
  const point=event.target.closest?.('.clinic-scatter svg g[data-board-tip]');
  if(!point||!['all','city'].includes(state.city==='all'?'all':state.city.split(':')[0]))return;
  const points=[...point.parentNode.querySelectorAll('g[data-board-tip]')],node=clinicScatterUnits()[points.indexOf(point)];
  if(!node)return;
  state.city=nodeKey(node);state.mapScope=state.city.startsWith('city:')?'county':'town';mapZoom=1;render();
});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches?.('.clinic-scatter svg g[data-board-tip]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}))}});
const dashboardBeforeLeafDetailState=dashboard;
dashboard=function(){
  const root=document.createElement('div');root.innerHTML=dashboardBeforeLeafDetailState();
  if(state.mapScope==='town'&&scopeLevel()==='county')root.querySelectorAll('#dashboardBoard .metric-detail-trigger').forEach(el=>{el.classList.remove('metric-detail-trigger');el.removeAttribute('role');el.removeAttribute('tabindex');el.removeAttribute('aria-label');el.removeAttribute('title')});
  return root.innerHTML;
};
pages.dashboard=dashboard;
render();
