/* ===== KEYS ===== */
var LS_CLIENTS='v1_clients',LS_ART='v1_articles',LS_DEVIS='v1_devis',LS_FACT='v1_factures',LS_PAY='v1_paiements',LS_COMP='v1_company';

/* ===== HELPERS ===== */
var $=function(s){return document.querySelector(s)}
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
function load(k){try{return JSON.parse(localStorage.getItem(k)||'[]')}catch(e){return[]}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function today(){return new Date().toISOString().slice(0,10)}
function nf(n){return (Number(n)||0).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function sum(a){return a.reduce(function(s,x){return s+(+x||0)},0)}
function esc(s){s=(s==null)?'':String(s);return s.replace(/[&<>\"']/g,function(m){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'})[m]})}
function autoNumber(prefix){var y=new Date().getFullYear();var key='auto_'+prefix+'_'+y;var n=Number(localStorage.getItem(key)||0)+1;localStorage.setItem(key,n);return prefix+'-'+y+'-'+String(n).padStart(3,'0')}
function setTitle(t){$('#title').textContent=t}
function company(){var d={nom:'Ma Société',adresse:'12 rue Exemple\\n75000 Paris',tel:'',email:'',siret:'',tva:'',logo:''};try{var x=JSON.parse(localStorage.getItem(LS_COMP)||'{}'); for(var k in x){d[k]=x[k]}}catch(e){} return d}

/* ===== ROUTER ===== */
function render(){
  var page=(location.hash.replace('#/','')||'dash');
  var titles={dash:'📊 Tableau de bord',clients:'👥 Clients',articles:'📦 Articles',devis:'📝 Devis',factures:'📑 Factures',paiements:'💳 Paiements',outils:'🧰 Outils',societe:'🏢 Société'};
  setTitle(titles[page]||'');
  (page==='clients')?Clients():
  (page==='articles')?Articles():
  (page==='devis')?Devis():
  (page==='factures')?Factures():
  (page==='paiements')?Paiements():
  (page==='outils')?Outils():
  (page==='societe')?Societe():
  Dash();
}
window.addEventListener('hashchange',render);
window.addEventListener('DOMContentLoaded',render);

/* ===== DASH ===== */
function Dash(){
  var f=load(LS_FACT), p=load(LS_PAY);
  var ca=sum(f.map(function(x){return +x.totalTTC||0}));
  var enc=sum(p.filter(function(x){return x.statut==='Reçu'}).map(function(x){return +x.montant||0}));
  var imp=Math.max(0,ca-enc);
  $('#root').innerHTML=
    '<div class="grid">'+
      '<div class="card"><h3>CA TTC cumulé</h3><div class="kpi">'+nf(ca)+' €</div></div>'+
      '<div class="card"><h3>Encaissements</h3><div class="kpi">'+nf(enc)+' €</div></div>'+
      '<div class="card"><h3>Impayés estimés</h3><div class="kpi" style="color:var(--danger)">'+nf(imp)+' €</div></div>'+
    '</div>'+
    '<div class="card"><div class="muted">Crée des <b>articles</b> et des <b>clients</b>, puis fais un <b>devis</b> et transforme-le en <b>facture</b>. Bouton “Imprimer” pour PDF.</div></div>';
}

/* ===== CLIENTS ===== */
function Clients(){
  var c=load(LS_CLIENTS);
  $('#root').innerHTML=
  '<div class="card"><h3>Nouveau client</h3>'+
    '<div class="row">'+
      '<div><label>Nom / Raison sociale</label><input id="c_nom"></div>'+
      '<div><label>Email</label><input id="c_mail"></div>'+
      '<div><label>Tél</label><input id="c_tel"></div>'+
      '<div><label>TVA</label><input id="c_tva"></div>'+
    '</div><div class="toolbar"><button onclick="saveClient()">Enregistrer</button></div></div>'+
  '<div class="card"><h3>Clients</h3><table><thead><tr><th>Nom</th><th>Email</th><th>Tél</th><th>TVA</th><th class="right"></th></tr></thead><tbody id="c_tbl"></tbody></table></div>';
  $('#c_tbl').innerHTML=c.map(function(x,i){
    return '<tr><td>'+esc(x.nom)+'</td><td>'+esc(x.mail||'')+'</td><td>'+esc(x.tel||'')+'</td><td>'+esc(x.tva||'')+
           '</td><td class="right"><button class="ghost" onclick="delClient('+i+')">Suppr</button></td></tr>';
  }).join('')||'<tr><td colspan="5">Aucun</td></tr>';
}
function saveClient(){
  var x={nom:$('#c_nom').value.trim(),mail:$('#c_mail').value,tel:$('#c_tel').value,tva:$('#c_tva').value};
  if(!x.nom){alert('Nom requis');return}
  var a=load(LS_CLIENTS); a.push(x); save(LS_CLIENTS,a); Clients();
}
function delClient(i){var a=load(LS_CLIENTS); a.splice(i,1); save(LS_CLIENTS,a); Clients()}

/* ===== ARTICLES ===== */
function Articles(){
  var a=load(LS_ART);
  $('#root').innerHTML=
  '<div class="card"><h3>Nouvel article</h3>'+
    '<div class="row">'+
      '<div><label>Réf</label><input id="a_ref"></div>'+
      '<div><label>Désignation</label><input id="a_desc"></div>'+
      '<div><label>PU HT (€)</label><input id="a_pu" type="number" step="0.01"></div>'+
      '<div><label>TVA %</label><input id="a_tva" type="number" step="0.1" value="20"></div>'+
    '</div><div class="toolbar"><button onclick="saveArt()">Ajouter</button></div></div>'+
  '<div class="card"><h3>Catalogue</h3><table><thead><tr><th>Réf</th><th>Désignation</th><th class="right">PU HT</th><th class="right">TVA</th><th class="right"></th></tr></thead><tbody id="a_tbl"></tbody></table></div>';
  $('#a_tbl').innerHTML=a.map(function(x,i){
    return '<tr><td>'+esc(x.ref)+'</td><td>'+esc(x.desc)+'</td><td class="right">'+nf(x.pu)+'</td><td class="right">'+(x.tva||20)+'%</td>'+
           '<td class="right"><button class="ghost" onclick="delArt('+i+')">Suppr</button></td></tr>';
  }).join('')||'<tr><td colspan="5">Aucun article</td></tr>';
}
function saveArt(){
  var x={ref:$('#a_ref').value.trim(),desc:$('#a_desc').value,pu:+$('#a_pu').value||0,tva:+$('#a_tva').value||20};
  if(!x.ref){alert('Réf requise');return}
  var a=load(LS_ART); a.push(x); save(LS_ART,a); Articles();
}
function delArt(i){var a=load(LS_ART); a.splice(i,1); save(LS_ART,a); Articles()}

/* ===== LIGNES COMMUNES ===== */
function lineHTML(idx,L){
  return '<tr>'+
    '<td class="right">'+(idx+1)+'</td>'+
    '<td><input value="'+esc(L.ref||'')+'" placeholder="Réf" oninput="onRef(this)" style="width:120px;display:inline-block"> '+
        '<input value="'+esc(L.desc||'')+'" placeholder="Désignation" style="width:64%;display:inline-block"></td>'+
    '<td><input type="number" step="0.01" value="'+(L.qte||1)+'" oninput="recalc()"></td>'+
    '<td><input type="number" step="0.01" value="'+(L.pu||0)+'" oninput="recalc()"></td>'+
    '<td><input type="number" step="0.1" value="'+(L.tva||20)+'" oninput="recalc()"></td>'+
    '<td class="right totalL">0,00</td>'+
    '<td class="right"><button class="ghost" onclick="delLine(this)">×</button></td>'+
  '</tr>';
}
function addLine(){var b=$('#doc_body'); b.insertAdjacentHTML('beforeend',lineHTML(b.children.length,{qte:1,pu:0,tva:20})); recalc()}
function delLine(btn){btn.closest('tr').remove(); recalc()}
function onRef(el){
  var ref=el.value.trim(); if(!ref)return;
  var st=load(LS_ART); var it=st.find(function(x){return x.ref===ref});
  var tr=el.closest('tr'), i=tr.querySelectorAll('input');
  if(it){ if(!i[1].value) i[1].value=it.desc||''; i[3].value=it.pu||0; i[4].value=it.tva||20;}
  recalc();
}
function recalc(){
  var rows=$$('#doc_body tr'), ht=0,tva=0;
  rows.forEach(function(tr){
    var i=tr.querySelectorAll('input'); var q=+i[2].value||0, pu=+i[3].value||0, t=+i[4].value||0;
    var lht=q*pu; tr.querySelector('.totalL').textContent=nf(lht); ht+=lht; tva+=lht*(t/100);
  });
  $('#d_ht').textContent=nf(ht); $('#d_tva').textContent=nf(tva); $('#d_ttc').textContent=nf(ht+tva);
}
function docData(extra){ if(!extra) extra={};
  var rows=$$('#doc_body tr').map(function(tr){
    var i=tr.querySelectorAll('input'); return {ref:i[0].value,desc:i[1].value,qte:+i[2].value||0,pu:+i[3].value||0,tva:+i[4].value||0};
  });
  return Object.assign({
    num:$('#doc_num').value, date:$('#doc_date').value, client:$('#doc_client').value,
    lignes:rows,
    totalHT:+$('#d_ht').textContent.replace(/\s/g,'').replace(',','.')||0,
    totalTVA:+$('#d_tva').textContent.replace(/\s/g,'').replace(',','.')||0,
    totalTTC:+$('#d_ttc').textContent.replace(/\s/g,'').replace(',','.')||0
  }, extra);
}

/* ===== DEVIS ===== */
function Devis(){
  var devis=load(LS_DEVIS), clients=load(LS_CLIENTS);
  $('#root').innerHTML=
  '<div class="card"><h3>Nouveau devis</h3>'+
    '<div class="row">'+
      '<div><label>N°</label><input id="doc_num" placeholder="DEV-'+new Date().getFullYear()+'-001"></div>'+
      '<div><label>Date</label><input id="doc_date" type="date" value="'+today()+'"></div>'+
      '<div><label>Client</label><input list="cl" id="doc_client" placeholder="Choisir…"><datalist id="cl">'+
        clients.map(function(c){return '<option value="'+esc(c.nom)+'">'}).join('')+
      '</datalist></div>'+
    '</div>'+
    '<table><thead><tr><th>#</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>TVA %</th><th class="right">Total HT</th><th></th></tr></thead>'+
      '<tbody id="doc_body"></tbody>'+
      '<tfoot><tr><td colspan="5" class="right">Sous-total HT</td><td class="right" id="d_ht">0,00</td><td></td></tr>'+
             '<tr><td colspan="5" class="right">TVA</td><td class="right" id="d_tva">0,00</td><td></td></tr>'+
             '<tr><td colspan="5" class="right"><b>Total TTC</b></td><td class="right" id="d_ttc">0,00</td><td></td></tr></tfoot>'+
    '</table>'+
    '<div class="toolbar"><button class="ghost" onclick="addLine()">+ Ligne</button><button onclick="saveDevis()">Enregistrer</button><button class="ghost" onclick="printCurrent(\'DEVIS\')">Imprimer</button></div>'+
  '</div>'+
  '<div class="card"><h3>Devis</h3><table><thead><tr><th>N°</th><th>Date</th><th>Client</th><th class="right">TTC</th><th class="right">Actions</th></tr></thead><tbody id="dv_tbl"></tbody></table></div>';
  addLine();
  $('#dv_tbl').innerHTML=devis.map(function(d,i){
    return '<tr><td>'+esc(d.num)+'</td><td>'+esc(d.date)+'</td><td>'+esc(d.client)+'</td><td class="right">'+nf(d.totalTTC)+'</td>'+
    '<td class="right"><button class="ghost" onclick="dvToFact('+i+')">→ Facture</button> <button class="ghost" onclick="delDv('+i+')">Suppr</button></td></tr>';
  }).join('')||'<tr><td colspan="5">Aucun devis</td></tr>';
}
function saveDevis(){
  var d=docData(); if(!d.num) d.num=autoNumber('DEV'); d.statut='En cours';
  var a=load(LS_DEVIS); a.push(d); save(LS_DEVIS,a); alert('Devis '+d.num+' enregistré'); Devis();
}
function delDv(i){var a=load(LS_DEVIS); a.splice(i,1); save(LS_DEVIS,a); Devis()}
function dvToFact(i){
  var a=load(LS_DEVIS), d=a[i]; if(!d)return;
  var f=load(LS_FACT); var num=autoNumber('FACT');
  f.push({num:num,date:today(),client:d.client,lignes:d.lignes,totalHT:d.totalHT,totalTVA:d.totalTVA,totalTTC:d.totalTTC,statut:'Envoyée',source:d.num,paid:0});
  save(LS_FACT,f); a.splice(i,1); save(LS_DEVIS,a); alert('Transformé en '+num); Devis();
}

/* ===== FACTURES ===== */
function Factures(){
  var f=load(LS_FACT), clients=load(LS_CLIENTS);
  $('#root').innerHTML=
  '<div class="card"><h3>Nouvelle facture</h3>'+
    '<div class="row">'+
      '<div><label>N°</label><input id="doc_num" placeholder="auto (FACT-'+new Date().getFullYear()+'-###)"></div>'+
      '<div><label>Date</label><input id="doc_date" type="date" value="'+today()+'"></div>'+
      '<div><label>Client</label><input list="cl" id="doc_client"><datalist id="cl">'+
        clients.map(function(c){return '<option value="'+esc(c.nom)+'">'}).join('')+
      '</datalist></div>'+
    '</div>'+
    '<table><thead><tr><th>#</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>TVA %</th><th class="right">Total HT</th><th></th></tr></thead>'+
      '<tbody id="doc_body"></tbody>'+
      '<tfoot><tr><td colspan="5" class="right">Sous-total HT</td><td class="right" id="d_ht">0,00</td><td></td></tr>'+
             '<tr><td colspan="5" class="right">TVA</td><td class="right" id="d_tva">0,00</td><td></td></tr>'+
             '<tr><td colspan="5" class="right"><b>Total TTC</b></td><td class="right" id="d_ttc">0,00</td><td></td></tr></tfoot>'+
    '</table>'+
    '<div class="toolbar"><button class="ghost" onclick="addLine()">+ Ligne</button><button onclick="saveFact()">Enregistrer</button><button class="ghost" onclick="printCurrent(\'FACTURE\')">Imprimer</button></div>'+
  '</div>'+
  '<div class="card"><h3>Factures</h3><table><thead><tr><th>N°</th><th>Date</th><th>Client</th><th class="right">HT</th><th class="right">TVA</th><th class="right">TTC</th><th class="right">Payé</th><th class="right">Reste</th><th>Statut</th><th>Source</th><th class="right">Actions</th></tr></thead><tbody id="fa_tbl"></tbody></table></div>';
  addLine();
  $('#fa_tbl').innerHTML=f.map(function(x,i){
    var paid=+x.paid||0, reste=Math.max(0,(+x.totalTTC||0)-paid);
    return '<tr><td>'+esc(x.num)+'</td><td>'+esc(x.date)+'</td><td>'+esc(x.client)+'</td>'+
      '<td class="right">'+nf(x.totalHT)+'</td><td class="right">'+nf(x.totalTVA)+'</td><td class="right">'+nf(x.totalTTC)+'</td>'+
      '<td class="right">'+nf(paid)+'</td><td class="right">'+nf(reste)+'</td>'+
      '<td>'+(reste>0?'<span class="small">Impayée</span>':'<span style="color:var(--ok)">Payée</span>')+'</td>'+
      '<td>'+esc(x.source||'')+'</td>'+
      '<td class="right"><button class="ghost" onclick="openPay(\''+x.num+'\')">Régler</button> <button class="ghost" onclick="delFact('+i+')">Suppr</button></td></tr>';
  }).join('')||'<tr><td colspan="11">Aucune facture</td></tr>';
}
function saveFact(){
  var d=docData(); if(!d.num) d.num=autoNumber('FACT'); d.statut='Envoyée'; d.paid=0;
  var a=load(LS_FACT); a.push(d); save(LS_FACT,a); alert('Facture '+d.num+' enregistrée'); Factures();
}
function delFact(i){var a=load(LS_FACT); a.splice(i,1); save(LS_FACT,a); Factures()}

/* ===== PAIEMENTS ===== */
function Paiements(){
  var p=load(LS_PAY).sort(function(a,b){return b.date.localeCompare(a.date)}), f=load(LS_FACT);
  $('#root').innerHTML=
  '<div class="card"><h3>Nouveau paiement</h3>'+
    '<div class="row">'+
      '<div><label>Facture N°</label><input list="fa" id="p_fact"><datalist id="fa">'+
        f.map(function(x){return '<option value="'+esc(x.num)+'">'}).join('')+
      '</datalist></div>'+
      '<div><label>Date</label><input id="p_date" type="date" value="'+today()+'"></div>'+
      '<div><label>Montant (€)</label><input id="p_m" type="number" step="0.01"></div>'+
      '<div><label>Mode</label><select id="p_mode"><option>CB</option><option>Virement</option><option>Chèque</option><option>Espèces</option></select></div>'+
      '<div><label>Statut</label><select id="p_stat"><option>Reçu</option><option>En attente</option><option>Rejeté</option></select></div>'+
    '</div><div class="toolbar"><button onclick="savePay()">Enregistrer</button></div></div>'+
  '<div class="card"><h3>Historique</h3><table><thead><tr><th>Date</th><th>Facture</th><th>Mode</th><th class="right">Montant</th><th>Statut</th><th class="right">Actions</th></tr></thead><tbody id="p_tbl"></tbody></table></div>';
  $('#p_tbl').innerHTML=p.map(function(x,i){
    return '<tr><td>'+esc(x.date)+'</td><td>'+esc(x.fact)+'</td><td>'+esc(x.mode)+'</td><td class="right">'+nf(x.montant)+'</td><td>'+esc(x.statut)+'</td>'+
           '<td class="right"><button class="ghost" onclick="delPay('+i+')">Suppr</button></td></tr>';
  }).join('')||'<tr><td colspan="6">Aucun paiement</td></tr>';
}
function openPay(num){location.hash='#/paiements'; setTimeout(function(){var el=$('#p_fact'); if(el) el.value=num;},10)}
function savePay(){
  var facts=load(LS_FACT), fact=facts.find(function(x){return x.num===$('#p_fact').value});
  if(!fact){alert('Facture introuvable');return}
  var p={fact:fact.num,date:$('#p_date').value,montant:+$('#p_m').value||0,mode:$('#p_mode').value,statut:$('#p_stat').value};
  var arr=load(LS_PAY); arr.push(p); save(LS_PAY,arr);
  if(p.statut==='Reçu'){ fact.paid=(+fact.paid||0)+p.montant; save(LS_FACT,facts); }
  alert('Paiement enregistré'); Paiements(); Factures();
}
function delPay(i){
  var arr=load(LS_PAY), p=arr[i]; if(!p){Paiements();return}
  if(p.statut==='Reçu'){
    var facts=load(LS_FACT), f=facts.find(function(x){return x.num===p.fact});
    if(f){ f.paid=Math.max(0,(+f.paid||0)-(+p.montant||0)); save(LS_FACT,facts); }
  }
  arr.splice(i,1); save(LS_PAY,arr); Paiements(); Factures();
}

/* ===== OUTILS ===== */
function Outils(){
  $('#root').innerHTML=
  '<div class="card"><h3>Outils</h3>'+
    '<div class="toolbar">'+
      '<button class="ghost" onclick="localStorage.clear(); alert(\'Données effacées\'); location.reload()">⚠️ Vider toutes les données</button>'+
      '<button class="ghost" onclick="printLast()">Imprimer le dernier devis/facture</button>'+
    '</div>'+
    '<div class="small muted">Cette v1 est 100% locale (offline). On ajoutera Agenda, ODR, Cloud (Supabase) et Factur-X ensuite.</div>'+
  '</div>';
}

/* ===== SOCIETE ===== */
function Societe(){
  var s=company();
  $('#root').innerHTML=
  '<div class="card"><h3>Paramètres société</h3>'+
    '<div class="row">'+
      '<div><label>Nom</label><input id="sn" value="'+esc(s.nom)+'"></div>'+
      '<div><label>Email</label><input id="se" value="'+esc(s.email)+'"></div>'+
      '<div><label>Téléphone</label><input id="st" value="'+esc(s.tel)+'"></div>'+
      '<div><label>SIRET</label><input id="ss" value="'+esc(s.siret)+'"></div>'+
      '<div><label>TVA</label><input id="sv" value="'+esc(s.tva)+'"></div>'+
      '<div><label>Logo (URL)</label><input id="sl" value="'+esc(s.logo)+'"></div>'+
    '</div>'+
    '<label>Adresse</label><textarea id="sa" rows="3">'+esc(s.adresse)+'</textarea>'+
    '<div class="toolbar"><button onclick="saveSoc()">Enregistrer</button></div>'+
  '</div>';
}
function saveSoc(){
  var v={nom:$('#sn').value,email:$('#se').value,tel:$('#st').value,siret:$('#ss').value,tva:$('#sv').value,logo:$('#sl').value,adresse:$('#sa').value};
  localStorage.setItem(LS_COMP,JSON.stringify(v)); alert('Enregistré');
}

/* ===== Impression ===== */
function buildPrintable(kind,d){
  var s=company();
  var logo=s.logo?'<img src="'+esc(s.logo)+'" style="max-height:64px">':'';
  var rows=(d.lignes||[]).map(function(L,i){
    return '<tr><td>'+(i+1)+'</td><td>'+esc(L.ref||'')+'</td><td>'+esc(L.desc||'')+'</td>'+
           '<td class="right">'+nf(L.qte)+'</td><td class="right">'+nf(L.pu)+'</td><td class="right">'+nf(L.tva)+'%</td>'+
           '<td class="right">'+nf((+L.qte||0)*(+L.pu||0))+'</td></tr>';
  }).join('');
  return '<div class="print-sheet">'+
    '<div class="print-header">'+
      '<div class="print-brand">'+logo+'<h2>'+esc(s.nom)+'</h2><div>'+esc(s.adresse).replace(/\n/g,"<br>")+'</div><div>'+esc(s.tel)+' – '+esc(s.email)+'</div><div>'+esc(s.siret)+' – '+esc(s.tva)+'</div></div>'+
      '<div class="print-meta"><div class="doctype">'+kind+'</div><div><b>N°</b> '+esc(d.num||'')+'</div><div><b>Date</b> '+esc(d.date||'')+'</div></div>'+
    '</div>'+
    '<table class="print-table"><thead><tr><th>#</th><th>Réf</th><th>Désignation</th><th>Qté</th><th>PU HT</th><th>TVA</th><th>Total HT</th></tr></thead><tbody>'+rows+'</tbody></table>'+
    '<table class="totaux" style="margin-top:10px"><tr><td>Sous-total HT</td><td class="right">'+nf(d.totalHT)+'</td></tr><tr><td>TVA</td><td class="right">'+nf(d.totalTVA)+'</td></tr><tr><td><b>Total TTC</b></td><td class="right"><b>'+nf(d.totalTTC)+'</b></td></tr></table>'+
  '</div>';
}
function printCurrent(kind){
  var d=docData();
  var holder=document.createElement('div'); holder.innerHTML=buildPrintable(kind,d); document.body.appendChild(holder); window.print(); holder.remove();
}
function printLast(){
  var f=load(LS_FACT), d=load(LS_DEVIS), last=f[f.length-1]||d[d.length-1];
  if(!last){alert('Aucun devis/facture');return}
  var holder=document.createElement('div'); holder.innerHTML=buildPrintable(last.statut?'FACTURE':'DEVIS',last); document.body.appendChild(holder); window.print(); holder.remove();
}
