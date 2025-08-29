
async function loadJSONL(path){
  const resp = await fetch(path, {cache:"no-store"});
  if(!resp.ok) throw new Error(`fetch ${path} -> ${resp.status}`);
  const txt = await resp.text();
  return txt.trim().split(/\r?\n/).filter(Boolean).map(l => JSON.parse(l));
}

// helpers for multi-lang fields like {ja:{}, en:{}} or simple string
function pickLang(obj, keys){
  // try nested .en, then .ja, then raw
  for(const k of keys){
    const v = obj?.[k];
    if(!v) continue;
    if(typeof v === "string") return v;
    if(typeof v === "object"){
      if(v.en) return v.en;
      if(v.ja) return v.ja;
    }
  }
  return "";
}
function first(arr){ return Array.isArray(arr) && arr.length ? arr[0] : undefined; }

function entryToPaper(obj){
  const typ = obj?.insert?.type;
  if(typ !== "published_papers") return null; // only papers

  const m = obj.merge ?? {};

  const title   = pickLang(m, ["paper_title", "title", "name"]) || "(no title)";
  const journal = pickLang(m, ["publication_name"]) || "";
  const ystr    = (m.publication_date || "").slice(0,4);
  const year    = parseInt(ystr || "0", 10);

  // authors: {en:[{name:""}], ja:[...]}
  let authors = "";
  const a_en = m.authors?.en;
  const a_ja = m.authors?.ja;
  const a_any = Array.isArray(a_en) ? a_en : (Array.isArray(a_ja) ? a_ja : []);
  if(a_any.length){
    authors = a_any.map(x => x?.name).filter(Boolean).join(", ");
  }

  // doi
  let doi = "";
  const doiList = m.identifiers?.doi;
  if(Array.isArray(doiList) && doiList.length) doi = doiList[0];

  // url fallback (see_also with label doi or first link)
  let url = "";
  const sa = m.see_also;
  if(Array.isArray(sa) && sa.length){
    const doiEntry = sa.find(x => x?.label === "doi" && x?.["@id"]);
    url = (doiEntry && doiEntry["@id"]) || (sa[0] && sa[0]["@id"]) || "";
  }

  const right = [ystr, journal].filter(Boolean).join(" • ");
  const link  = doi ? ` <a href="https://doi.org/${doi}" target="_blank" rel="noreferrer">doi:${doi}</a>`
                    : (url ? ` <a href="${url}" target="_blank" rel="noreferrer">link</a>` : "");
  const left  = [authors, `<b>${title}</b>`].filter(Boolean).join(". ");

  return { year, html: `<li><div class="left">${left}</div><div class="right">${right}${link? " ·"+link:""}</div></li>` };
}

(async ()=>{
  try{
    // NOTE: file name is fixed here
    const recs = await loadJSONL("/data/rm_achievements.jsonl");
    const papers = recs.map(entryToPaper).filter(Boolean)
                       .sort((a,b)=> (b.year|0)-(a.year|0));

    document.getElementById("pubs").innerHTML =
      papers.length ? `<ol class="list">${papers.map(p=>p.html).join("\n")}</ol>`
                    : "No publications found.";
  }catch(e){
    document.getElementById("pubs").textContent = "読み込みエラー: " + e.message;
  }
})();
