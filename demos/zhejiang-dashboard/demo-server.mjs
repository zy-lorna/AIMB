import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.DEMO_PORT||8766);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};

http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/analysis'&&req.method==='POST'){
    let body='';
    for await(const chunk of req){body+=chunk;if(body.length>30000){res.writeHead(413).end();return}}
    if(!process.env.OPENAI_API_KEY){res.writeHead(503,{'Content-Type':'application/json'}).end(JSON.stringify({error:'ChatGPT 未配置'}));return}
    try{
      const {question,context}=JSON.parse(body);
      if(typeof question!=='string'||question.length>1000||!context||typeof context!=='object')throw Error('请求无效');
      const upstream=await fetch('https://api.openai.com/v1/responses',{
        method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
        body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',instructions:'你是浙江省慢病监管平台的数据分析助手。先识别用户问题中的机构和具体主题；target 是该机构的数据，page 是当前页面。针对问题给出该机构的数据事实、需要关注的差异和可执行的下一步。只依据提供的统计期和演示数据回答，明确数值为模拟；不能用其他机构的数据替代提问机构，不能把同期平均值说成考核线，不把相关性说成因果，不编造未提供的数据。用简洁中文回答。',input:`当前页面上下文：${JSON.stringify(context)}\n用户问题：${question}`})
      });
      const data=await upstream.json();
      if(!upstream.ok)throw Error(data.error?.message||'AI 服务暂不可用');
      const answer=(data.output||[]).flatMap(item=>item.content||[]).filter(item=>item.type==='output_text').map(item=>item.text).join('\n');
      res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({answer:answer||'暂无分析结果'}));
    }catch(error){res.writeHead(502,{'Content-Type':'application/json'}).end(JSON.stringify({error:error.message}))}
    return;
  }
  if(req.method!=='GET'){res.writeHead(405).end();return}
  const name=decodeURIComponent(url.pathname==='/'?'/demo.html':url.pathname).slice(1);
  const filePath=path.resolve(root,name);
  if(!name||name.includes('\\')||!filePath.startsWith(root+path.sep)){res.writeHead(404).end();return}
  try{const file=await readFile(filePath);res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','Cache-Control':'no-store'}).end(file)}
  catch{res.writeHead(404).end()}
}).listen(port,'127.0.0.1',()=>console.log(`Demo: http://127.0.0.1:${port}/`));
