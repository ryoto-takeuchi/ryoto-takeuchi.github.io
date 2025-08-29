async function loadJSONL(path){
  const txt = await (await fetch(path, {cache:"no-store"})).text();
  return txt.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
}

function pickLang(obj){
  if(!obj) return "";
  if(typeof obj === "string") return obj;
  if(obj.en) return obj.en;
  if(obj.ja) return obj.ja;
  return "";
}

function entryToPaper(obj){
  if(obj?.insert?.type !== "published_papers") return null;
  const m = obj.merge || {};

  const title   = pickLang(m.paper_title) || "(no title)";
  const journal = pickLang(m.publication_name);
  const date    = m.publication_date || "";
  const year    = parseInt(date.slice(0,4) || "0", 10);

  let authors = "";
  const a = m.authors?.en || m.authors?.ja || [];
  if(Array.isArray(a)) authors = a.map(x=>x.name).join(", ");

  const doi = Array.isArray(m.identifiers?.doi) ? m.identifiers.doi[0] : "";
  const url = doi ? `https://doi.org/${doi}` : "";

  let line = "";
  if(authors) line += authors + ". ";
  line += `<b>${title}</b>.`;
  if(journal) line += " " + journal;
  if(date) line += " (" + date.slice(0,10) + ")";
  if(doi) line += ` DOI: <a href="${url}" target="_blank">${doi}</a>`;

  return {year, html: `<p>${line}</p>`};
}

(async ()=>{
  try{
    const recs = await loadJSONL("/data/rm_achievements.jsonl");
    const papers = recs.map(entryToPaper).filter(Boolean)
                       .sort((a,b)=> (b.year)-(a.year));

    // 年ごとにまとめる
    const groups = {};
    for(const p of papers){
      groups[p.year] = groups[p.year] || [];
      groups[p.year].push(p.html);
    }

    let out = "";
    for(const year of Object.keys(groups).sort((a,b)=>b-a)){
      out += `<h2>${year}</h2>\n${groups[year].join("\n")}\n<hr>`;
    }

    document.getElementById("pubs").innerHTML = out || "No publications.";
  }catch(e){
    document.getElementById("pubs").textContent = "Error: "+e.message;
  }
})();
