async function loadJSONL(path){
  const txt = await (await fetch(path, {cache:"no-store"})).text();
  return txt.trim().split(/\r?\n/).map(l => JSON.parse(l));
}

function entryToPaper(obj){
  const data = obj.insert ?? obj.merge ?? {};
  if (!data || (data.type !== "paper" && data.kind !== "paper")) return null;

  const title   = data.title || data.name || "(no title)";
  const year    = data.year || data.published_year || "";
  const authors = Array.isArray(data.authors) ? data.authors.join(", ")
                 : (data.authors || data.creator || "");
  const journal = data.journal || data.publication_name || data.book_title || "";
  const volume  = data.volume || "";
  const pages   = data.pages || "";
  const doi     = data.doi || "";
  const url     = data.url  || "";

  const right = [year, journal, volume, pages].filter(Boolean).join(" • ");
  const link  = doi ? ` <a href="https://doi.org/${doi}" target="_blank" rel="noreferrer">doi:${doi}</a>`
                    : (url ? ` <a href="${url}" target="_blank" rel="noreferrer">link</a>` : "");
  const left  = [authors, `<b>${title}</b>`].filter(Boolean).join(". ");

  return { year: parseInt(year||"0",10), html: `<li><div class="left">${left}</div><div class="right">${right}${link? " ·"+link:""}</div></li>` };
}

(async ()=>{
  try{
    const recs = await loadJSONL("/data/rm_achievements.jsonl");
    const papers = recs.map(entryToPaper).filter(Boolean)
                       .sort((a,b)=> (b.year|0)-(a.year|0));

    document.getElementById("pubs").innerHTML =
      papers.length ? `<ol class="list">${papers.map(p=>p.html).join("\n")}</ol>`
                    : "No publications found.";
  }catch(e){
    document.getElementById("pubs").textContent = "読み込みエラー: " + e;
  }
})();
