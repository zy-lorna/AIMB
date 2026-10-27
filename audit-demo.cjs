const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)][0][1]
  .replace(/\nrender\(\);\s*$/, '\nglobalThis.audit = {db, TODAY, addDays, reviewPlanProgress, linkedReviewOrder, examTagState};');
const storage = new Map();
const context = {
  document: {addEventListener() {}},
  window: {addEventListener() {}},
  localStorage: {getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value)},
  structuredClone,
  console
};
vm.runInNewContext(script, context);
const {db, TODAY, addDays, reviewPlanProgress, linkedReviewOrder, examTagState} = context.audit;
const issues = [];
const tagReports = [
  {id:'old',identity:'test',exam:'2025-12-10',report:'2025-12-12',category:'C',notify:{date:'2025-12-25'},followDue:'2026-03-25',closedDate:null},
  {id:'new',identity:'test',exam:'2026-02-01',report:'2026-02-03',category:'B',notify:null,followDue:null,closedDate:null}
];
const tagCases = [
  ['跨年待跟踪','2026-01-01',[tagReports[0]],'C'],
  ['跨年已结束','2026-01-20',[{...tagReports[0],closedDate:'2026-01-15'}],'closed'],
  ['期限当天','2026-03-25',[{...tagReports[0],closedDate:'2026-01-15'}],'closed'],
  ['期限过后','2026-03-26',[tagReports[0]],null],
  ['本年待告知','2026-02-10',tagReports,'B'],
  ['最新报告优先','2026-02-10',[{...tagReports[0],closedDate:'2026-01-15'},tagReports[1]],'B'],
  ['未检无标签','2026-02-10',[] ,null]
];
for(const [label,date,reports,expected] of tagCases){
  const actual=examTagState({identity:'test'},date,reports)?.kind||null;
  if(actual!==expected)issues.push(`${label}: 检字标签应为 ${expected||'不显示'}，实际为 ${actual||'不显示'}`);
}
const checkActual = (record, label, value) => {
  if (value && value.slice(0, 10) > TODAY) issues.push(`${record.id}: ${label} ${value} 晚于演示日期 ${TODAY}`);
};

for (const record of db.records) {
  if (record.exam > record.report) issues.push(`${record.id}: 体检日期晚于总检日期`);
  if (record.notify && record.notify.date < record.report) issues.push(`${record.id}: 告知日期早于总检日期`);
  const highest = record.items.map(item => item.category).filter(Boolean).sort((a, b) => 'ABC'.indexOf(a) - 'ABC'.indexOf(b))[0];
  if (highest && record.category !== highest && !record.correctionReason) issues.push(`${record.id}: 报告类别与最高指标类别不符`);
  if (record.due !== addDays(record.report, record.category === 'A' ? 1 : 15)) issues.push(`${record.id}: 告知期限与类别不符`);
  if (record.notify && record.followDue !== addDays(record.notify.date, record.category === 'A' ? 10 : record.category === 'B' ? 30 : 90)) issues.push(`${record.id}: 跟踪期限与类别不符`);
  for (const [label, value] of Object.entries({体检: record.exam, 总检: record.report, 告知: record.notify?.date, 首次跟踪: record.firstFollowDate, 最近跟踪: record.followDate, 转诊: record.referral?.date, 跟踪结束: record.closedDate})) checkActual(record, label, value);
  for (const visit of record.reviewVisits || []) {
    checkActual(record, '检验检查记录', visit.date);
    if (record.notify && (visit.date.slice(0, 10) < record.notify.date || visit.date.slice(0, 10) > addDays(record.report, 365))) issues.push(`${record.id}: 检验检查记录超出报告复查时间范围`);
  }
  for (const visit of record.referralVisits || []) checkActual(record, '就诊记录', visit.date);
  for (const call of record.calls || []) checkActual(record, '拨号记录', call.date);
  for (const event of record.history || []) checkActual(record, '操作历史', event.date);
  const plannedItems = new Set();
  for (const group of record.groups || []) {
    checkActual(record, '复查计划创建', group.createdAt);
    if (record.notify && group.createdAt && group.createdAt.slice(0, 10) < record.notify.date) issues.push(`${record.id}: 复查计划早于告知创建`);
    if (record.notify && group.date && (group.date < record.notify.date || group.date > addDays(record.report, 365))) issues.push(`${record.id}: 应复查日期超出有效范围`);
    if (!group.cancelled) for (const id of group.items || []) {
      if (plannedItems.has(id)) issues.push(`${record.id}: 异常指标 ${id} 同时进入多条有效复查计划（包括 ${group.id}）`);
      plannedItems.add(id);
    }
    if (linkedReviewOrder(record, group) && reviewPlanProgress(record, group).label !== '已复查') issues.push(`${record.id}: 已关联项目仍可取消`);
  }
}
for (const recall of db.recalls) {
  if (recall.notifiedDate && recall.notifiedDate.slice(0, 10) > TODAY) issues.push(`${recall.recordId}: 未来的召回通知 ${recall.notifiedDate}`);
}

if (issues.length) {
  console.error(`演示数据检查失败：${issues.length} 项\n${issues.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`演示数据检查通过：${db.records.length} 份体检报告，${db.recalls.length} 条召回记录`);
}
