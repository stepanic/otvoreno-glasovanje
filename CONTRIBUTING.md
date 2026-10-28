# Doprinos

Rad ide linearno, fazu po fazu, po [TODO.md](TODO.md). U tijeku je uvijek točno jedna
faza; na kraju svake nastaje predaja u [`docs/handoff/`](docs/handoff/README.md) s kojom
počinje sljedeća.

Pravila koja vrijede za cijeli repo:

- **Ugovori i klijent:** 100 % pokrivenost naredbi, grana, funkcija i linija, i
  mutacijski testovi u kojima je svaki mutant ubijen. Isti prag kao stadion V1.
- **Ništa osobno u repou:** ni OIB, ni tokeni, ni vrijednosti iz Certilia odgovora.
  Mjerenja bilježe samo oblik (imena polja, duljine, prisutnost).
- **Odluke u ADR-ove:** sve što mijenja model povjerenja ide u [`docs/adr/`](docs/adr/README.md).
- **Dokumenti na hrvatskom**, kratko i činjenično. Tvrdnje o vanjskim sustavima
  (Certilia, Semaphore, MACI) uz izvor.
- Prije commita `npm run check`.
