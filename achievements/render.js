
async function loadJSONL(path){
  const resp = await fetch(path, {cache:"no-store"});
  if(!resp.ok) throw new Error(`fetch ${path} -> ${resp.status}`);
  const txt = await resp.text();
  return txt.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
}

function entryToPaper(obj){
  // researchmap: published papers are marked by insert.type === "published_papers"
  if(obj?.insert?.type !== "published_papers") return null;
  const m = obj.merge || {};

  // --- English-only pickers ---
  const title   = (m.paper_title && m.paper_title.en) || (m.title && m.title.en) || "(no title)";
  const journal = (m.publication_name && m.publication_name.en) || "";
  const date    = m.publication_date || "";
  const year    = parseInt(date.slice(0,4) || "0", 10);

  // authors: {en:[{name:""}]}
  let authors = "";
  const a = (m.authors && m.authors.en) || [];
  if(Array.isArray(a)) authors = a.map(x=>x && x.name).filter(Boolean).join(", ");

  // DOI
  let doi = "";
  if (Array.isArray(m.identifiers?.doi) && m.identifiers.doi.length) {
    doi = m.identifiers.doi[0];
  }
  const doiURL = doi ? `https://doi.org/${doi}` : "";

  // Build one paragraph (authors. <b>title</b>. journal (YYYY-MM-DD). DOI: ...)
  let line = "";
  if(authors) line += authors + ". ";
  line += `<b>${title}</b>.`;
  if(journal) line += " " + journal + ".";
  if(date) line += " " + date.slice(0,10) + ".";
  if(doi) line += ` DOI: <a href="${doiURL}" target="_blank" rel="noreferrer">${doi}</a>`;

  return { year, html: `<p>${line}</p>` };
}

(async ()=>{
  try{
    const recs = await loadJSONL("/data/rm_achievements.jsonl");
    const papers = recs.map(entryToPaper).filter(Boolean)
                       .sort((a,b)=> (b.year)-(a.year));

    // group by year (desc)
    const groups = new Map();
    for(const p of papers){
      const y = p.year || "Unknown";
      if(!groups.has(y)) groups.set(y, []);
      groups.get(y).push(p.html);
    }
    const years = Array.from(groups.keys()).sort((a,b)=> (b - a));

    let out = "";
    for(const y of years){
      out += `<h2>${y}</h2>\n`;
      out += groups.get(y).join("\n");
      out += `\n<hr>\n`;
    }
    document.getElementById("pubs").innerHTML = out || "No publications.";
  }catch(e){
    document.getElementById("pubs").textContent = "Error: "+e.message;
  }
})();
