# 02 Prijava osobnom iskaznicom (eOI) na macOS-u

**Stanje:** istraženo 28. 10. 2026. iz Certilijinih uputa i stanja jednog Maca
(macOS 26.5.1, Apple Silicon); prijava karticom još nije isprobana.

## Zaključak

Na macOS-u se karticom eOI može **prijaviti samo u Firefoxu**, uz PKCS#11 modul iz
Certilia Middlewarea. Safari, Chrome i Brave karticu koriste samo za potpisivanje
dokumenata, ne za prijavu, jer macOS za eOI nema CryptoTokenKit upravljački program, pa
kartica nije u Keychainu.

Izvor, [Certilia Middleware, upute za macOS 1.2](https://www.certilia.com/uploads/Certilia_Middleware_Upute_za_Mac_OS_instalaciju_1_2_8bf7accc6e.pdf)
(22. 7. 2025.): „Certilia Middleware omogućava autentifikaciju pomoću PKCS#11 biblioteke
unutar Firefox internet preglednika [i] potpisivanje dokumenata unutar Chrome, Firefox,
Safari preglednika.”

Neovisno o pregledniku, Certilijin zaslon za prijavu klijenta stadiona nudi samo mobile.ID
([01](01-certilia-token.md)). Popis metoda postavlja AKD po klijentu, pa se eOI za
glasanje može dobiti samo preko AKD-a.

## Što treba

| Stavka | Detalj |
|---|---|
| kartica | eOI i sigurnosna omotnica s početnim PIN-om |
| čitač | ugrađen ili vanjski USB; macOS ga vidi preko `ifd-ccid` |
| softver | [Certilia Middleware](https://www.certilia.com/preuzimanja) 3.9.12, macOS 13+, Intel i Apple Silicon, jedan `.pkg` |
| preglednik | Firefox s učitanim PKCS#11 modulom |

## Koraci

1. Instalirati Certilia Middleware. Ako macOS blokira paket: System Settings → Privacy &
   Security → „Open Anyway”.
2. Aktivirati karticu, jednom: pokrenuti CertiliaMiddleware → „Aktiviraj karticu” → početni
   PIN iz omotnice → postaviti identifikacijski PIN (PIN1), potpisni PIN (PIN2) i PUK.
   Šest krivih PIN-ova zaključava karticu (otključava se PUK-om), šest krivih PUK-ova je
   blokira (otključava se samo u policijskoj upravi) ([gov.hr, Aktiviraj eOI](https://www.gov.hr/hr/aktiviraj-eoi/2419)).
3. Firefox → Settings → Privacy & Security → Security Devices… → Load:
   ime `Certilia`, datoteka
   `/Applications/CertiliaMiddleware.app/Contents/pkcs11/libCertiliaPkcs11.dylib`
   ([upute za Firefox 1.3](https://www.certilia.com/uploads/Certilia_Middleware_Upute_za_Firefox_HR_1_3_fe6aef6974.pdf)).
   Modul tada prikazuje čitač i karticu.
4. Kartica u čitaču, zatim prijava na uslugu (npr. [Korisnički pretinac](https://pretinac.gov.hr/korisnicki-pretinac/))
   → odabir osobne iskaznice → Firefox traži PIN1. Pretinac se aktivira prvom prijavom i
   prihvaćanjem uvjeta ([gov.hr](https://gov.hr/hr/sto-je-korisnicki-pretinac-i-kako-ga-aktivirati-2096/2096)).

## Provjera stanja na Macu

```bash
defaults read /Applications/CertiliaMiddleware.app/Contents/Info.plist CFBundleShortVersionString
ls /Applications/CertiliaMiddleware.app/Contents/pkcs11/   # libCertiliaPkcs11.dylib
system_profiler SPSmartCardsDataType                       # čitač i ATR kartice
security list-smartcards                                   # eOI ovdje NE piše, i to je očekivano
```

Na izmjerenom Macu: middleware 3.9.12, čitač „Generic Smart Card Reader Interface” s
karticom (ATR sadrži `AKDe`), `security list-smartcards` → „No smartcards found”, Firefox
nije instaliran.

## Posljedice za glasanje

- Sučelje mora prije prijave reći: „Osobnom iskaznicom na Macu prijavite se u Firefoxu.”
  Bez toga korisnik Safarija ili Chromea ne vidi zašto kartica ne radi.
- Starije upute na eid.hr (NIAS) pokrivaju samo Windows i Internet Explorer; ne koristiti
  ih kao izvor za macOS.
- Pitanje za AKD (`helpdesk@certilia.com`): može li klijent glasanja dobiti prijavu eOI i
  koji `acr`/`amr` tada dolazi.

## Otvoreno

- [ ] 👤 Firefox + PKCS#11, prijava na pretinac, pa ista proba na `maksimir.domovina.ai/glasaj`
      sa [skriptom](../../scripts/certilia-token-oblik.js): nudi li Certilia tada osobnu iskaznicu
