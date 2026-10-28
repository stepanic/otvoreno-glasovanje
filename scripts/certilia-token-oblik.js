// Mjerenje oblika Certilijina id_tokena bez ijedne osobne vrijednosti (F1, zadatak 1.1).
//
// Upotreba: na https://maksimir.domovina.ai otvori DevTools → Console, zalijepi cijelu
// datoteku, zatim se prijavi Certilijom na /glasaj. Kad proxy vrati token, u konzoli se
// ispiše tablica oblika i kopira u clipboard kao JSON. Token se ne sprema nigdje.
//
// Vrijednosti se ispisuju samo za polja s popisa JAVNO (algoritam, izdavatelj, razina
// pouzdanosti, vrsta dokumenta). Za sve ostalo: tip, duljina i abeceda.
(() => {
  const JAVNO = new Set([
    "alg", "typ", "kid", "iss", "aud", "acr", "amr",
    "documentType", "documentIssuingCountry",
  ]);

  const b64urlToBytes = (s) => {
    const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
    return Uint8Array.from(b, (c) => c.charCodeAt(0));
  };
  const abeceda = (v) =>
    /^[0-9]+$/.test(v) ? "dec" : /^[0-9a-f]+$/i.test(v) ? "hex" : /^[A-Za-z0-9_-]+$/.test(v) ? "base64url" : "ostalo";

  const opis = (k, v) => {
    if (JAVNO.has(k)) return { kljuc: k, tip: typeof v, vrijednost: v };
    if (typeof v === "string") return { kljuc: k, tip: "string", duljina: v.length, abeceda: abeceda(v) };
    if (typeof v === "number") return { kljuc: k, tip: "number" };
    if (Array.isArray(v)) return { kljuc: k, tip: "array", duljina: v.length };
    if (v && typeof v === "object") return { kljuc: k, tip: "object", kljucevi: Object.keys(v) };
    return { kljuc: k, tip: typeof v };
  };

  function izmjeri(token) {
    const [h, p, s] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)));
    const payloadJson = new TextDecoder().decode(b64urlToBytes(p));
    const payload = JSON.parse(payloadJson);
    const rezultat = {
      izmjereno: new Date().toISOString().slice(0, 10),
      duljina_tokena_znakova: token.length,
      duljina_header_payload_bajtova: h.length + 1 + p.length,
      sha256_blokova_64B: Math.ceil((h.length + 1 + p.length + 9) / 64),
      duljina_potpisa_bajtova: b64urlToBytes(s).length,
      header: Object.entries(header).map(([k, v]) => opis(k, v)),
      payload_redoslijed: Object.keys(payload),
      payload: Object.entries(payload).map(([k, v]) => opis(k, v)),
      vijek_exp_minus_iat_s: typeof payload.exp === "number" && typeof payload.iat === "number" ? payload.exp - payload.iat : null,
      ima_nonce: "nonce" in payload,
      ima_birthdate: "birthdate" in payload,
      ima_thumbnail: "thumbnail" in payload,
    };
    console.table(rezultat.payload);
    console.log("[certilia-oblik]", rezultat);
    navigator.clipboard?.writeText(JSON.stringify(rezultat, null, 2)).catch(() => {});
    return rezultat;
  }

  const izvorni = window.fetch;
  window.fetch = async (...args) => {
    const res = await izvorni(...args);
    const url = String(args[0]?.url ?? args[0]);
    if (url.includes("/api/auth/exchange")) {
      res.clone().json().then((j) => j?.idToken && izmjeri(j.idToken)).catch(() => {});
    }
    return res;
  };
  console.log("[certilia-oblik] spremno, prijavi se Certilijom");
})();
