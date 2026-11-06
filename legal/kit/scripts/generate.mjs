import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import {resolve,dirname,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
export function load(id){
 if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(id))throw Error('Identifiant application invalide');
 const company=read(join(ROOT,'config/company.json'));
 const app=read(join(ROOT,'apps',id+'.json'));
 if(app.id!==id)throw Error('Identifiant incohérent');
 const catPath=resolve(ROOT,app.catalog);
 if(relative(ROOT,catPath).startsWith('..')||isAbsolute(relative(ROOT,catPath)))throw Error('Catalogue hors dossier interdit');
 const catalog=read(catPath);
 const {review,...facts}=app;
 return {company,app,catalog,digest:hash({company,app:facts,catalog,templates:Object.fromEntries(['confidentialite','conditions-utilisation','conditions-vente','mentions-legales','droits-rgpd'].map(n=>[n,readFileSync(join(ROOT,'templates',n+'.md'),'utf8')]))})};
}
const esc=s=>String(s??'').replace(/[|\r\n]/g,' ');
function table(head,rows){return '| '+head.join(' | ')+' |\n| '+head.map(()=> '---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(esc).join(' | ')+' |').join('\n');}
export function validate(d){
 const e=[];const {app:a,catalog:c}=d;
 function scan(v,path='config'){if(typeof v==='string'&&(/À COMPLÉTER/.test(v)||v.trim()===''))e.push(path+' : à renseigner');else if(Array.isArray(v))v.forEach((x,i)=>scan(x,path+'.'+i));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,x])=>scan(x,path+'.'+k));}
 scan(d.company,'company');
 const enabled={ads:a.features.ads,analytics:a.features.analytics,accounts:a.features.accounts,minors:a.features.minors,userContent:a.features.userContent,ai:a.features.ai,cancellation:a.features.subscriptions,b2bProcessor:a.features.b2bProcessor,billing:a.features.paid,withdrawal:a.features.paid,withdrawalAction:a.features.paid,guarantees:a.features.paid,updates:a.features.paid};
 const clauses=Object.fromEntries(Object.entries(a.clauses).filter(([k])=>!(k in enabled)||enabled[k]));
 const {review,clauses:unused,...rest}=a;scan({...rest,clauses},'app');
 if(a.language!=='fr-FR'||a.audience!=='B2C')e.push('Version initiale limitée à France/français et B2C ; adapter les modèles pour autre périmètre');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(a.effectiveDate))e.push('Date effective invalide');
 for(const u of [a.url,...[a.features.paid?a.clauses.withdrawalAction:null].filter(Boolean)])if(!/^https:\/\//.test(u))e.push('URL HTTPS requise : '+u);
 if(!Array.isArray(a.processing)||!a.processing.length)e.push('Inventaire traitements requis (décrire aussi le fonctionnement local le cas échéant)');
 if(!c.offers||!Array.isArray(c.offers))e.push('Catalogue invalide');
 for(const o of c.offers??[]){
  if(!['planned','active'].includes(o.status))e.push('Statut offre invalide : '+o.id);
  if(o.status!=='active')continue;
  scan(o,'offer.'+o.id);
  if(o.priceSource==='catalog'&&(!Number.isSafeInteger(o.amountMinor)||o.amountMinor<0))e.push('Prix en centimes invalide : '+o.id);
  if(!['store','catalog'].includes(o.priceSource))e.push('Source de prix invalide : '+o.id);
  if(o.priceSource==='store'&&!o.storeProductId)e.push('Identifiant store requis : '+o.id);
 }
 if(a.features.paid&&!(c.offers??[]).some(o=>o.status==='active'))e.push('Aucune offre active : CGV commerciales à finaliser avant publication');
 return e;
}
export function render(d,name){
 const {app:a,company:b,catalog:c}=d;
 const prices=table(['Offre','Contenu','Type / canal','Prix'],c.offers.map(o=>[o.name,o.description,o.type+' / '+o.channel,o.status!=='active'?'Non commercialisée':o.priceSource==='store'?'Prix localisé présenté par le store avant validation de la commande':new Intl.NumberFormat(a.language,{style:'currency',currency:c.currency}).format(o.amountMinor/100)+' '+o.taxDisplay+(o.period?' / '+o.period:'')]));
 const processing=table(['Finalité','Données','Base légale','Nécessité / refus','Destinataires','Conservation','Provenance'],a.processing.map(x=>[x.purpose,x.data,x.basis,x.required,x.recipients,x.retention,x.source]));
 const providers=table(['Prestataire','Rôle','Données','Localisation','Transferts et garanties'],a.providers.map(x=>[x.name,x.role,x.data,x.location,x.transfers]));
 const variables={appName:a.name,appUrl:a.url,description:a.description,version:a.version,date:a.effectiveDate,support:a.supportEmail,legalName:b.legalName,brand:b.brand,legalForm:b.legalForm,address:b.address,email:b.email,phone:b.phone,registration:b.registration,vat:b.vat,capital:b.capital,publicationDirector:b.publicationDirector,privacyEmail:b.privacyEmail,hostingName:a.hosting.name,hostingAddress:a.hosting.address,hostingPhone:a.hosting.phone,hostingRegions:a.hosting.regions,mediatorName:b.mediator.name,mediatorAddress:b.mediator.address,mediatorUrl:b.mediator.url,prices,processing,providers,...a.clauses};
 let s=readFileSync(join(ROOT,'templates',name+'.md'),'utf8');
 while(/\{\{#/.test(s)){
  const before=s;
  s=s.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,(_,key,body)=>a.features[key]?body:'');
  if(s===before)throw Error('Bloc conditionnel invalide');
 }
 s=s.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in variables))throw Error('Variable inconnue : '+key);return String(variables[key]);});
 return s;
}
export function generate(id,publish=false){
 const d=load(id),errors=validate(d),names=['confidentialite','conditions-utilisation','conditions-vente','mentions-legales','droits-rgpd'];
 if(publish&&(errors.length||!d.app.review.approved||!d.app.review.reviewer||!d.app.review.reviewedAt||d.app.review.configurationSha256!==d.digest))throw Error('Publication bloquée. Compléter les informations et faire valider cette empreinte : '+d.digest+'\n'+errors.join('\n'));
 const texts=Object.fromEntries(names.map(n=>[n,render(d,n)]));
 const dir=join(ROOT,'dist',id,d.app.version+(publish?'-reviewed':'-draft'));
 if(existsSync(dir))throw Error('Version déjà générée : conserver les archives et incrémenter version');
 mkdirSync(dir,{recursive:true});
 const notice=publish?'':' > BROUILLON — informations et clauses à compléter et valider avant publication.\n\n';
 for(const [n,s] of Object.entries(texts))writeFileSync(join(dir,n+'.md'),notice+s);
 writeFileSync(join(dir,'rapport.json'),JSON.stringify({app:id,version:d.app.version,mode:publish?'reviewed':'draft',generatedAt:new Date().toISOString(),configurationSha256:d.digest,errors,review:d.app.review},null,2));
 writeFileSync(join(dir,'snapshot.json'),JSON.stringify(d,null,2));
 console.log('Documents : '+dir+'\nEmpreinte à valider : '+d.digest+'\nPoints à compléter : '+errors.length);
 return dir;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const flag=process.argv.indexOf('--app');if(flag<0)throw Error('Usage: npm run generate -- --app cubelyo [--publish]');generate(process.argv[flag+1],process.argv.includes('--publish'));}catch(e){console.error(e.message);process.exitCode=1;}
}
