
async function loadJSONL(path){
  const resp = await fetch(path, {cache:"no-store"});
  if(!resp.ok) throw new Error(`fetch ${path} -> ${resp.status}`);
  const txt = await resp.text();
  return txt.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
}
function toPaper(obj){
  if(obj?.insert?.type !== "published_papers") return null;
  const m = obj.merge || {};
  const title   = (m.paper_title && m.paper_title.en) || "(no title)";
  const journal = (m.publication_name && m.publication_name.en) || "";
  const date    = m.publication_date || "";
  const year    = parseInt(date.slice(0,4) || "0", 10);
  const a = (m.authors && m.authors.en) || [];
  const authors = Array.isArray(a) ? a.map(x=>x?.name).filter(Boolean).join(", ") : "";
  const doi = Array.isArray(m.identifiers?.doi) && m.identifiers.doi[0] ? m.identifiers.doi[0] : "";
  const doiURL = doi ? `https://doi.org/${doi}` : "";
  let line = "";
  if(authors) line += authors + ". ";
  line += `<b>${title}</b>.`;
  if(journal) line += " " + journal + ".";
  if(date) line += " " + date.slice(0,10) + ".";
  if(doi) line += ` DOI: <a href="${doiURL}" target="_blank" rel="noreferrer">${doi}</a>`;
  return {year, html:`<p>${line}</p>`};
}
(async ()=>{
  try{
    const recs = await loadJSONL("/data/rm_achievements.jsonl");
    const papers = recs.map(toPaper).filter(Boolean).sort((a,b)=>b.year - a.year);
    const groups = {};
    for(const p of papers){ (groups[p.year] ||= []).push(p.html); }
    let out = "";
    Object.keys(groups).sort((a,b)=>b-a).forEach(y=>{
      out += `<h2>${y}</h2>\n` + groups[y].join("\n") + "\n<hr>\n";
    });
    document.getElementById("pubs").innerHTML = out || "No publications.";
  }catch(e){
    document.getElementById("pubs").textContent = "Error: " + e.message;
  }
})();
