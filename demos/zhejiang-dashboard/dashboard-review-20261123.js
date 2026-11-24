// 2026-11-23 大屏会议批注：新增指标使用演示口径。
(function () {
  const previousRender = render;
  render = function () {
    previousRender();
    const board = document.querySelector('#dashboardBoard');
    const kpi = board?.querySelector('.situation-reference .reference-kpi:nth-child(4)');
    if (!kpi) return;
    const metrics = clinicMetrics(currentNode());
    const coverage = metrics.eligible ? metrics.built / metrics.eligible * 100 : 0;
    kpi.classList.remove('is-risk');
    kpi.querySelector(':scope > span').innerHTML = '<svg class="reference-kpi-icon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M6 1h4v4h4v4h-4v4H6V9H2V5h4z"/></svg>一体化门诊覆盖率';
    const value = kpi.querySelector('strong');
    value.innerHTML = `${coverage.toFixed(1)}<small>%</small>`;
    value.dataset.detailLabel = '一体化门诊覆盖率';
    value.setAttribute('aria-label', `一体化门诊覆盖率 ${coverage.toFixed(1)}%，查看机构详情`);
    const filing = board.querySelector('.reference-filing-panel');
    if (filing) {
      filing.classList.add('prevention-panel');
      filing.innerHTML = `<h2>综合防控情况</h2><div class="prevention-visual"><div class="prevention-total"><div class="prevention-total-label"><span>综合防控率</span><div class="prevention-total-note">知晓 × 治疗 × 控制</div></div><strong aria-label="33.6%">${[...'33.6'].map(c=>`<i class="${c==='.'?'metric-decimal':'metric-digit'}">${c}</i>`).join('')}<small>%</small></strong></div><div class="prevention-bars">${[['知晓率',80],['治疗率',70],['控制率',60]].map(([label,pct],i)=>`<div><span>${label}</span><i><b style="width:${pct}%;--fill:${['#075ac5','#087df2','#00b8ed'][i]}"></b></i><strong>${pct.toFixed(1)}<small>%</small></strong></div>`).join('')}</div></div>`;
    }
    const cards = board.querySelector('.reference-control-cards');
    if (cards) {
      cards.parentElement.querySelector('h2').textContent = '控制情况';
      const total = populationData().managed;
      cards.classList.add('control-achievement');
      cards.innerHTML = [30,20,10].map((pct,i)=>`<div class="achievement-row"><span>${i+1}项达标</span><i><b style="width:${pct}%;--fill:${['#00b8ed','#087df2','#075ac5'][i]}"></b></i><strong>${(total*pct/100).toFixed(1)}<small>万人</small></strong><em>${pct.toFixed(1)}%</em></div>`).join('') + '<p class="achievement-note">血压、糖化、血脂；占专档患者比例</p>';
    }
  };
  const previousDetail = showMetricDetail;
  showMetricDetail = function(el) {
    if (el.closest('.situation-reference .reference-kpi:nth-child(4)')) {
      const proxy = document.createElement('div');
      proxy.className = 'clinic-meeting-coverage';
      proxy.innerHTML = '<div class="clinic-chart-total"><strong></strong></div>';
      return previousDetail(proxy.querySelector('strong'));
    }
    return previousDetail(el);
  };
  const previousShow = HTMLDialogElement.prototype.showModal;
  HTMLDialogElement.prototype.showModal = function () {
    if (this.querySelector('header h2 b')?.textContent.trim() === '专档患者数') {
      const p = populationData(), total = Math.max(.0001, p.diagnosed);
      const section = document.createElement('section'); section.className = 'filing-dialog-summary';
      section.innerHTML = `<h3>建档纳管情况</h3><div class="filing-dialog-cards"><div><span>专档人数（去重）</span><strong>${p.managed.toFixed(1)}<small>万人</small></strong></div><div><span>专档建档率</span><strong>${(p.managed/total*100).toFixed(1)}<small>%</small></strong></div></div><div class="filing-dialog-rows">${[['高血压',p.managedHigh,'万份'],['糖尿病',p.managedDiabetes,'万份'],['慢阻肺',p.managedCopd,'万份'],['未建专档',Math.max(0,p.diagnosed-p.managed),'万人']].map(([name,n,unit])=>`<div><span>${name}</span><strong>${Number(n||0).toFixed(1)}<small>${unit}</small></strong></div>`).join('')}</div>`;
      this.querySelector('.metric-detail-section-title')?.before(section);
    }
    return previousShow.call(this);
  };
  render();
})();

// 清理界面中的数据性质提示，保留指标口径与业务说明。
(function(){
  const clean = value => value.replace(/[，、·]?\s*(?:演示数据|模拟数据|模拟值|演示估算|模拟数距)[：:，、；;。]?\s*/g, '');
  function update(root){
    if (!root || !root.isConnected) return;
    if (root.nodeType === Node.TEXT_NODE) { if (!root.parentElement?.closest('script,style,textarea,input')) { const v=clean(root.nodeValue); if(v!==root.nodeValue) root.nodeValue=v; } return; }
    if (root.nodeType !== Node.ELEMENT_NODE || root.matches('script,style,textarea,input')) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); let node;
    while ((node=walker.nextNode())) { if(node.parentElement?.closest('script,style,textarea,input')) continue; const v=clean(node.nodeValue); if(v!==node.nodeValue) node.nodeValue=v; }
    [root,...root.querySelectorAll('[title],[aria-label],[data-tip],[data-board-tip]')].forEach(el=>{ for(const attr of ['title','aria-label','data-tip','data-board-tip']) { const old=el.getAttribute(attr); if(old) { const v=clean(old); if(v!==old) el.setAttribute(attr,v); } } });
  }
  new MutationObserver(records=>records.forEach(record=>{if(record.type==='characterData') update(record.target); else if(record.type==='attributes') update(record.target); else record.addedNodes.forEach(update)})).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','data-tip','data-board-tip']});
  update(document.body);
})();
