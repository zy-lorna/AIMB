import json
import re
import sys
import openpyxl

book = openpyxl.load_workbook(sys.argv[1], data_only=True)
data = {'province': [6700.9, '2025年末'], 'cities': {}, 'counties': {}, 'towns': {}}
for _, name, value, year, *_ in list(book.worksheets[1].values)[1:]:
    if name and name != '全省合计' and isinstance(value, (int, float)):
        data['cities'][name] = [value, year]
city = None
for name, value, year, *_ in list(book.worksheets[2].values)[1:]:
    if isinstance(name, str) and name.startswith('●'):
        city = re.search(r'●\s*(\S+?市)', name).group(1)
    elif city and isinstance(value, (int, float)) and name and '小计' not in name:
        data['counties'][city + '/' + name] = [value, year]
city = None
for county, town, value, year, *_ in list(book.worksheets[3].values)[1:]:
    if isinstance(county, str) and county.startswith('●'):
        city = re.search(r'●\s*(\S+?市)', county).group(1)
    elif city and county and town and isinstance(value, (int, float)):
        data['towns'][city + '/' + county + '/' + town] = [value, year]
with open('resident-population-data.js', 'w', encoding='utf-8') as out:
    out.write('window.RESIDENT_POPULATION = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
