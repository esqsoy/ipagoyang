'use strict';
/* 발음고양 기록 옮기기: 실제 저장 키가 맞는 종류로 가는지(공통 규칙은 pipeline/record-transfer/test.cjs). */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const dir=path.join(__dirname,'..','record-transfer');
cp.execFileSync(process.execPath,[path.join(dir,'test.cjs')],{stdio:'inherit'});
const cfg=JSON.parse(fs.readFileSync(path.join(dir,'config.json'),'utf8'));
const ctx={RT_CONFIG:cfg};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(dir,'merge.js'),'utf8'),ctx);
const want={'ipagoyang-seoul-v1':'progress','ipagoyang-seoul-v1-saved-cards-v1':'saved','ipagoyang-learned-words-v1':'learned',
  'ipagoyang-missed-words-v1':'missed','ipagoyang-milestone-v1':'milestone','ipagoyang-pace-ksat-v1':'pace','ipagoyang-pace-meta-ksat-v1':'paceMeta',
  'ipagoyang-seoul-last-v1':'keep','ipagoyang-mode-v1':'keep','ipagoyang-uni-v1':'keep','ipagoyang-langs':'keep','ipagoyang-palette':'keep','ipagoyang-guide-v1':'keep'};
for(const [k,v] of Object.entries(want))assert.equal(ctx.rtKind(k),v,k);
// 틀·덧붙임 코드에 위 목록에 없는 저장 키가 생기면 알린다(새 키는 종류를 정해 이 목록에 넣는다)
const src=['frame.html','ipa_extra.js'].map(f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8')).join('\n');
const used=new Set([...src.matchAll(/["'](ipagoyang-[a-z0-9-]+)["']/g)].map(m=>m[1]));
for(const k of used){const known=Object.keys(want).some(w=>w===k||w.startsWith(k));assert.ok(known,'종류를 안 정한 저장 키: '+k);}
console.log('record-transfer ipagoyang: '+Object.keys(want).length+' keys OK');
