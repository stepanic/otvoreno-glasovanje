# F01 Preduvjeti

**Predano:** 28. 10. 2026., nakon [F00](F00-pokretanje.md).
**Cilj:** znati je li ZK dokaz nad Certilia tokenom izvediv u pregledniku i zatvoriti
odluke prije prvog retka koda ugovora (F2).

## Polazno stanje

- Stadion V1 radi na Gnosisu (`0x812960FA1120121DEd82A8806aECE93dcf49E869`), upis preko
  operaterova registrara. Kod glasanja u repou stadiona nije mijenjan od 9. 10. 2026.
- Certilia tok danas:
  - web klijent: stadion `web/src/glasanje.ts`, `signInWithCertilia` (oko retka 354);
    `authorization_url` dolazi od proxyja i otvara se bez provjere;
  - proxy: `stepanic/flutter_certilia`, `certilia-server/src/controllers/authController.js`:
    `nonce` generira proxy (oko retka 100), provjerava ga samo „ako postoji” (oko 285);
    scope `openid profile eid email offline_access` (`config/index.js:26`); logovi `allFields`,
    `hasThumbnail` (oko 304);
  - edge funkcija: `domovinatv/domovina-api`, `supabase/functions/certilia/index.ts`, provjerava
    samo potpis, `iss` i `aud` (oko 71–74).
- Nalazi koji se ovdje zatvaraju: [review E-01…E-15](https://github.com/stepanic/stadion-maksimir-natjecaj-2026/blob/main/docs/review/2026-10-09-neovisni-review-opci-model-i-v2.md),
  E-01, E-02, E-03, E-04, E-11, E-12. Plan: [P0](https://github.com/stepanic/stadion-maksimir-natjecaj-2026/blob/main/docs/blockchain/09-v2-plan.md).

## Zadaci redom

1. **Mjerenje tokena (1.1), treba korisnika.**
   - Prvo bez prijave: imena polja iz logova proxyja (`allFields`, `hasThumbnail`,
     `thumbnailSize`). Ako tamo već piše da `thumbnail` postoji i koliko je velik, E-01 je
     potvrđen bez ikakve prijave.
   - Zatim korisnik na https://maksimir.domovina.ai u DevTools konzolu zalijepi
     [`scripts/certilia-token-oblik.js`](../../scripts/certilia-token-oblik.js) i prijavi se na
     `/glasaj`: jednom eOsobnom, jednom mobile.ID-om. Skripta ispiše samo oblik i kopira JSON
     u clipboard. Prijava je stvarna; ne predaje se novi listić.
   - Rezultat: `docs/istrazivanja/01-certilia-token.md` s tablicom iz E-11 (duljina, blokovi
     SHA-256, vijek, `nonce`, `kid`, `acr`, `birthdate`, `thumbnail`, redoslijed claimova,
     eOsobna prema mobile.ID-u) i zaključkom za krug. Isto kratko u
     [zajedno `docs/11`](https://github.com/domovinatv/zajedno.domovina.ai/blob/main/docs/11-certilia-identitet.md) §2/§6, s poveznicom ovamo.
   - JWKS: `kid`, eksponent i broj ključeva s Certilijina `jwks_uri`; zapisati datum, pa
     ponoviti za tjedan dana (rotacija).
2. **Broj popunjenog `dob` (1.2).** Jedan `select count(*)` po `dob is not null` nad
   `identity_verifications`; samo brojevi.
3. **E-02 u stadionu (1.3).** U `signInWithCertilia`, prije `popup.location.href`: parsirati
   `authorization_url`; host mora biti Certilijin, `client_id` očekivani, `redirect_uri` jednak
   poslanom, `state` jednak `init.state`, `nonce` prisutan. Inače zatvoriti prozor i javiti
   „Poslužitelj za prijavu je promijenio parametre”. Test s lažnim proxyjem koji vraća tuđi
   `nonce` ili `client_id`. Prije izmjene `cd web && npm run test:paritet`; deploy po
   `docs/2026-09-25-regresijske-provjere.md` (preview kao „prije”, produkcija kao baseline).
   Ako je u proxyju jednostavno, isti potez: `initialize` prima `nonce` od klijenta i provjerava
   ga strogo; tada klijent provjerava i jednakost `nonce`a. Inače to ostaje za F7.
4. **Upit AKD-u (1.4), treba korisnika.** Nacrt pitanja: javni PKCE klijent bez secreta;
   zaseban klijent za glasanje s najmanjim scopeom (`openid eid`); može li se `thumbnail`
   isključiti po klijentu ili parametrom `claims`. Korisnik šalje; odgovor u
   `docs/istrazivanja/01`.
5. **ADR 0002 oznaka osobe (1.5).** `t_e = Poseidon(t, glasovanjeId)` na lancu umjesto `t` (E-04);
   `K` nepromjenjiv po glasovanju, prag samo proaktivnim dijeljenjem istog `k` (E-03); ZK dokaz
   uz OPRF upit kao jedina obrana od rječničkog napada (E-12); prozor konačnosti upisa (E-02 t. 4).
6. **ADR 0003 i 0004 (1.6).** Alati (solc, Hardhat 2 kao stadion ili Foundry, Semaphore v4.14) i
   sučelja `IBallotModule` (`validate`, `deltas`), `IGatekeeper`, sadržaj `configHash`
   (pet osi iz zajedno `docs/10` §2).
7. **Grana za fotografiju (1.7).** Ako mjerenje pokaže `thumbnail` i token preko ~2 KB, ADR 0002
   dobiva odjeljak s tri puta iz E-01 t. 3 i preporukom prije F4.

## Gotovo kad

- `docs/istrazivanja/01-certilia-token.md` popunjen za eOsobnu i mobile.ID;
- ADR 0002, 0003, 0004 u `docs/adr/` sa stanjem „prihvaćeno” nakon korisnikove potvrde;
- E-02 na produkciji stadiona, `npm run check` u oba repoa zelen;
- u [TODO.md](../../TODO.md) F01 ✅, F02 ▶, i napisana predaja `F02-jezgra-ugovora.md`.

## Ne dirati

- Ugovor V1 i podatke na Gnosisu.
- U repo ne ide nijedna vrijednost iz tokena, OIB, ime ni fotografija; samo oblik.
- Korisnikov `localStorage` na produkciji (ključ glasanja): prije testa backup ili lokalno.
