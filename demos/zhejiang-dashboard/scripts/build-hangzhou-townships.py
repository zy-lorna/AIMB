#!/usr/bin/env python3
"""Build Hangzhou township map data from supplied and legacy boundaries.
Historical polygons are reassigned only where the former township is wholly
identified in the supplied name lists; they are not current surveyed boundaries.
"""
import json, sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]) if len(sys.argv)>1 else root/'zhejiang-townships.geojson'
legacy=json.loads(source.read_text())['features']
text=(root/'hangzhou-wenzhou-townships.js').read_text()
existing=json.loads(text.removeprefix('window.HANGZHOU_WENZHOU_TOWNSHIPS=').rstrip(';\n'))
changes={'彭埠镇':'彭埠街道','笕桥镇':'笕桥街道','九堡镇':'九堡街道','丁桥镇':'丁兰街道'}
def pick(county,names,target,renames=None):
    out=[]
    for feature in legacy:
        p=feature.get('properties',{});name=p.get('乡')
        if p.get('市')!='杭州市' or p.get('县')!=county or name not in names:continue
        name=(renames or {}).get(name,name)
        out.append({'type':'Feature','geometry':feature['geometry'],'properties':{'市':'杭州市','县':target,'乡':name,'name':name,'boundarySource':'历史乡镇边界，仅供演示'}})
    missing=set(names)-{f['properties'].get('乡') for f in legacy if f.get('properties',{}).get('市')=='杭州市' and f.get('properties',{}).get('县')==county}
    if missing:raise ValueError(f'{county}: missing {missing}')
    return out
old_up=['采荷街道','凯旋街道','四季青街道','彭埠镇','闸弄口街道','丁桥镇','九堡镇','笕桥镇']
old_gong=['文晖街道','武林街道','潮鸣街道','东新街道','天水街道','朝晖街道','石桥街道','长庆街道']
old_lin=['塘栖镇','运河街道','东湖街道','临平街道','乔司街道','南苑街道','崇贤街道','星桥街道']
old_qian=['河庄街道','义蓬街道','新湾街道','临江街道','前进街道','围垦区']
out={}
for county in ['上城区','拱墅区','西湖区','滨江区','萧山区','富阳区','临安区','桐庐县','淳安县','建德市']:
    out['杭州市|'+county]=existing['杭州市|'+county]
out['杭州市|上城区']+=pick('江干区',old_up,'上城区',changes)
out['杭州市|拱墅区']+=pick('下城区',old_gong,'拱墅区')
out['杭州市|临平区']=pick('余杭区',old_lin,'临平区')
out['杭州市|钱塘区']=pick('江干区',['下沙街道','白杨街道'],'钱塘区')+pick('萧山区',old_qian,'钱塘区')
out['杭州市|萧山区']=[f for f in out['杭州市|萧山区'] if f['properties']['乡'] not in old_qian]
for key,features in out.items():
    names=[f['properties']['乡'] for f in features]
    if len(set(names))!=len(names):raise ValueError(f'duplicate in {key}')
    if any(f.get('geometry',{}).get('type') not in ('Polygon','MultiPolygon') for f in features):raise ValueError(f'invalid geometry in {key}')
    print(key,len(features))
(root/'hangzhou-townships-current.js').write_text('// 历史边界按行政区调整整理，不能替代现行官方测绘边界。\nwindow.HANGZHOU_TOWNSHIPS_CURRENT='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
