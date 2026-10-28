# 01 Oblik Certilijina `id_token`a

**Stanje:** mobile.ID izmjeren 28. 10. 2026.; eOsobna i JWKS čekaju.
**Kako:** [`scripts/certilia-token-oblik.js`](../../scripts/certilia-token-oblik.js) na
`maksimir.domovina.ai/glasaj`, produkcijski OIDC klijent stadiona
(scope `openid profile eid email offline_access`). Bilježi se samo oblik.

## Zaključak

**ZK dokaz nad cijelim tokenom je izvediv.** Token nema fotografiju (`thumbnail` nije u
`id_token`u), pa je E-01 za mobile.ID zatvoren bez grane iz F01 1.7. Fotografija koju
proxy loguje dolazi iz drugog odgovora, ne iz tokena koji bi krug provjeravao.

| Mjera | mobile.ID | eOsobna |
|---|---|---|
| `amr` | `BasicAuthenticator`, `MobileIdCustomAuthenticator` | |
| `acr` | `urn:oid:LoA3` | |
| zaglavlje + tijelo (ulaz u SHA-256) | 1086 B, ovisi o duljini imena i e-maila | |
| blokova SHA-256 po 64 B | 18 | |
| potpis | RS256, 256 B (RSA-2048) | |
| vijek `exp − iat` | 3600 s | |
| `nonce` | prisutan, 43 znaka base64url (32 B, generira proxy) | |
| `birthdate` | prisutan, 20 znakova, format čeka uzorak | |
| `thumbnail` | **nema** | |
| `documentType`, `documentIssuingCountry` | **nema** | |

**Zaglavlje:** `x5t`, `kid` (`YTc3…Y2JlQ_RS256`, javno u JWKS-u), `alg: RS256`.

**Tijelo, redoslijed claimova:** `at_hash, sub, country, birthdate, amr, iss, given_name,
nonce, sid, aud, acr, c_hash, nbf, azp, exp, iat, family_name, email`. Redoslijed nije
abecedni, pa krug mora tražiti claimove po položaju (kao `noir-jwt` i zkLogin), a ne
pretpostavljati raspored.

**Ostalo:** `iss = https://idp.certilia.com/oauth2/token`; `aud` i `azp` su `client_id`
(40 hex znakova); `sub` je 11 znamenki, dakle **OIB** (potvrđuje i edge funkcija
`domovina-api/supabase/functions/certilia/index.ts:81`); imena i e-mail su promjenjive
duljine.

## Posljedice za krug i plan

1. **Veličina.** 18 blokova × ~25–30 k ograničenja (procjena iz E-01 za circom) ≈ 0,5 M
   za SHA-256, plus RSA-2048. To je red veličine zkLogina, koji radi u pregledniku. Prava
   mjera je F4.
2. **Gornja granica ulaza.** Krug s fiksnim maksimumom; kandidat 1536 B (24 bloka), da stanu
   duga imena i e-mail. Najmanji scope bez `profile` i `email` (pitanje AKD-u) skratio bi
   token, ali nije nužan.
3. **Oznaka osobe.** `sub` je OIB, pa krug uzima `H(sub)` izravno; nema posebnog claima.
4. **`nonce`.** Danas 32 B u base64url. `Poseidon(c, r)` kodiran kao 32 B base64url ima istu
   duljinu i abecedu, pa ga IdP prihvaća bez promjene oblika. Krug mora usporediti
   base64url zapis, ne broj.
5. **Svježina.** Vijek od sat vremena ostavlja dovoljno vremena za dokaz na mobitelu i
   relayer; E-11 za vijek je zatvoren. Granicu svježine (npr. 10 min od `iat`) postavlja krug.
6. **Punoljetnost.** `birthdate` postoji i za mobile.ID. Format se potvrđuje uzorkom u
   sljedećem mjerenju.
7. **Državljanstvo.** Nema `documentType` ni `documentIssuingCountry`; jedini kandidat je
   `country` (2 znaka). Što znači (državljanstvo ili izdavatelj), treba pitati AKD.
8. **Razina.** mobile.ID je `LoA3`. Ako je eOsobna `LoA4`, glasovanje može tražiti razinu
   preko `acr` u definiciji.

## Otvoreno

- [ ] eOsobna: **nije ponuđena našem klijentu.** Certilijin zaslon za prijavu nudi samo mobile.ID
      (28. 10. 2026.). Imena autentikatora u `amr` (`BasicAuthenticator`, `MobileIdCustomAuthenticator`)
      upućuju na WSO2 Identity Server, gdje korake prijave postavlja AKD po klijentu. Discovery ne
      objavljuje `acr_values_supported`. Pitanje za AKD: može li se za klijent glasanja uključiti
      prijava osobnom iskaznicom i koji `acr`/`amr` tada dolazi.
- [ ] Proxy traži `pin` kroz parametar `claims` (`certiliaService.js:97`), ali `pin` ne dolazi u
      token; OIB stiže kao `sub`.
- [ ] JWKS: broj ključeva, eksponent, `kid`; ponoviti za tjedan dana
- [ ] AKD: značenje `country`, javni PKCE klijent, najmanji scope
