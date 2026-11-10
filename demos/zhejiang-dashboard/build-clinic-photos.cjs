const fs=require('fs');
const path=require('path');
const {execFileSync}=require('child_process');
const base='/Users/mac/Desktop/01.张雅恺睿/2026-11-02浙江省慢病一体化管理监管平台';
const sources=[['1/杭州-市','杭州市'],['1/丽水市','丽水市'],['2/温州市','温州市'],['2/衢州市','衢州市']];
const output=path.join(__dirname,'clinic-photos');
fs.mkdirSync(output,{recursive:true});
const entries=[];
function visit(dir,city){
  const children=fs.readdirSync(dir,{withFileTypes:true});
  const files=children.filter(x=>x.isFile()&&/\.(jpe?g|png)$/i.test(x.name));
  const folder=path.basename(dir);
  const match=folder.match(/([^（）()—]+?(?:社区卫生服务中心|中心卫生院|卫生院))/);
  if(match&&files.length){
    const name=match[1].replace(/^\d+[、.． ]*/,''),photos=[];
    for(const file of files.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'))){
      const target=`source-${entries.length}-${photos.length}.jpg`;
      try{execFileSync('sips',['-s','format','jpeg','-s','formatOptions','75','-Z','1200',path.join(dir,file.name),'--out',path.join(output,target)],{stdio:'ignore'});photos.push('clinic-photos/'+target)}catch(error){console.error('Skipped',path.join(dir,file.name))}
    }
    if(photos.length)entries.push({name:name.startsWith(city)?name:city+name,city,photos});
  }
  for(const child of children)if(child.isDirectory())visit(path.join(dir,child.name),city);
}
for(const [dir,city] of sources)visit(path.join(base,dir),city);
fs.writeFileSync(path.join(__dirname,'clinic-photo-data.js'),'window.CLINIC_PHOTOS='+JSON.stringify(entries)+';\n');
console.log(`${entries.length} institutions, ${entries.reduce((n,x)=>n+x.photos.length,0)} photos`);
