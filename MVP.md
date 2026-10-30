# MVP

## Probleem ja kasutaja

Projekt on mõeldud õpilastele, tudengitele ja inimestele, kellel on raske end igapäevaste ülesannete täitmiseks motiveerida. Tavalised ülesannete nimekirjad võivad tunduda igavad ja tekitada stressi või süütunnet, kui kõik ülesanded ei saa tehtud. Meie rakendus muudab ülesannete täitmise mängulisemaks, pakkudes preemiaks münte ja armsaid pikslikunsti stiilis loomi, kes pakuvad töölaual rõõmu ja visuaalset motivatsiooni.

## Kes mida teeb

| Tiimiliige      | Vastutusala                                                  |
| --------------- | ------------------------------------------------------------ |
| Mona-Marii Kokk | Disain, kunstiline juhtimine, frontend, testimine            |
| Johanna Okas    | Algne prototüüp, frontend, backend, testimine                |
| Berit Ruut      | Ülesannete jagamine, töö progressi jälgimine, tiimi aitamine |

## MVP funktsioonid

### Implementeeritud funktsioonid

#### Üldine

- Rakendusel on esialgu **kaks vaadet** - üks ülesannete nimekirja jaoks, teine rakenduse poe jaoks, kus on näha saadaval olevad virtuaalsed loomad
- Rakenduse akent saab ekraanil liigutada, haarates vasaku hiireklõpsuga akna ülemisest äärest
- Rakenduse jaoks on ikoon tegumiribal ning süsteemisalves (*system tray*)
- Süsteemisalve ikoonist on võimalik muuta rakenduse akna nähtavust ning seda, kas ülesannete nimekirja aken on alati teiste akende peal (always on top)
- Virtuaalse looma aken on alati teiste programmide peal
- Rakendust on võimalik sulgeda kombinatsiooniga **Ctrl+Q**, tegumiribalt ning süsteemisalve ikoonist valides “Quit”
- Rakenduse põhiaknal on fikseeritud suurus 365x520 px
- Aktiivse looma aken on põhiaknast eraldiseisev üksus

#### Taskid/ülesanded

- Ülesannete nimekirja lisamine, tehtuks märkimine ning kustutamine
- Ülesande saab tehtuks märkida ülesande kõrval oleva checkbox’iga
- Ülesande tehtuks märkimine annab kasutajale N koguses tokeneid
- Sama ülesannet mitu korda tehtuks märkimine **ei** anna mitu korda tokeneid
- Kokku kogutud tokenite arv on kasutajale rakenduses kuvatud
- Kirja pandud ülesanded ei kao ära programmi sulgedes

#### Virtuaalsed loomad

- Kogumit saadaval olevatest loomadest on võimalik poe lehel näha
- Loomi on võimalik rakenduse poe lehelt tokenite eest lunastada
- Lunastatud looma on võimalik aktiveerida ning see hakkab töölaual iseseisvalt ringi liikuma
- Aktiivset looma on võimalik teise looma vastu vahetada
- Ringi liikuva looma asukohta saab vahetada selle peal vasakut hiireklõpsu all hoides ning seda mujale tirides

---

### Miks jäid need MVP-sse?

MVP-sse jäid asjad, mis vastavad kolmele kriteeriumile:

1. Moodustavad põhitsükli: ülesanne -> token -> loom -> loom töölaual
2. Teevad rakenduse töölauarakendusena kasutatavaks: aknahaldus, püsivus, süsteemisalv, sulgemine
3. Kaitsevad süsteemi terviklikkust: topelttokenite vältimine

---

### Hiljem lisanduvad

Hiljem lisanduvad funktsionaalsused/visuaalsed elemendid, mis teevad kasutadakogemuse paremaks, kuid ei ole hädavajalikud rakenduse kasutatavaks muutmise jaoks:

- Eraldi kolmas *inventory* vaade omatud loomakeste haldamiseks
- Loomadele isikustatud nimede andmine
- Kasutaja aktiivsusperioodi (_streak_) arvestamine ja sellega seonduvad preemiad (nt. ekstra tokenid, erilised loomad)
- Ajutiste visuaalide asendamine õigete kunstielementidega
- Looma deaktiveerimine (praegu saab ainult looma aktiveerida või aktiveeritud looma vahetada)
- Erinevad olekud ringi liikuvatele loomadele (*idle/resting*, *crawling/walking*, *curled/peeking*)
- Võimalikud muudatused rakenduse kujunduses
- ...ning võib-olla veel mõned huvitavad asjad, mille peale me veel pole tulnud 

## Kasutajalood

Hinnanguks on valitud T-särgi suurused

|   #   |                                          Kasutajalugu                                          | Prioriteet  | Hinnang |
| :---: | :--------------------------------------------------------------------------------------------: | :---------: | :-----: |
|   1   |             Kasutajana tahan, et saaks lisada, korrigeerida ja kustutada ülesannet             |  Must Have  |   XL    |
|   2   |         Kasutajana tahan, et näeksin kõiki oma lisatud ülesandeid ja kogutud tokeneid          |  Must Have  |    S    |
|   3   |      Kasutajana tahan, et saaksin ülesande märkida tehtuks ning tehtuks märkimisel tokeni      |  Must Have  |    M    |
|   4   |        Kasutajana tahan, et programmi taasavamisel oleksid minu lisatud ülesanded alles        |  Must Have  |   XL    |
|   5   | Kasutajana tahan, et saaksin minna rakenduse poodi, näha valikut ning kasutada tokeneid ostuks |  Must Have  |   XL    |
|   6   |          Kasutajana tahan, et saaksin aktiveerida ja deaktiveerida loomasid töölaual           |  Must Have  |    L    |
|   7   |               Kasutajana tahan, et saaksin ostetud loomasid näha oma inventaris                | Should Have |    L    |
|   8   |   Kasutajana tahan, et oleks ülevaade tehtud ülesannetest ning aktiivsus perioodist (streak)   | Should Have |    M    |
|   9   |                      Kasutajana tahan, et saaksin oma loomadele nime anda                      | Could Have  |    S    |

## Sprint 0

Mona ja Johanna tegelesid prototüüpimisega. Algselt oli kavas kasutada GDScript ning Godot, millega katsetas Mona.\
Johanna proovis Tauri 2 toolkit'i koos TypeScript'i ja minimaalse Rust'iga.\
Berit jälgis edenemist ning koordineeris kahe paralleelse prototüübi tööd, et hoida tiim ühise MVP poole.

### Struktuur & "*potentially shippable*" baas

| Teema | Tehtud töö |
| :-: | :----: |
| Arhitektuur | Vastutusalade lahusus on teostatud (`game.ts` on puhas loogika, `ui.ts` ainult vaade, `main.ts` kontroller). Vitest on `game.ts` jaoks seadistatud. |
| Tauri seadistus | *Multi-window* konfiguratsioon (`main` ja `pet-*`), õigused failis `capabilities/default.json`, Vite on seadistatud `index.html` ja `pet.html` jaoks, store plugin on integreeritud ja versioonitud `STATE_VERSION` abil. |
| Aknahaldus | *Frameless* & *transparent* ülesannete nimekirja aken, esmakäivitusel akna asukoht all paremas nurgas koos asukoha salvestamisega, *always-on-top* lüliti, *system tray* ikoon valikutega Show/Hide/Always on top/Quit ning Ctrl+Q kogu rakenduse sulgemiseks |
| Püsivus | `tauri-plugin-store` on realiseeritud ning `normalizeState()` käsitleb vanu või katkisi salvestusi. Kõiki vajalikke andmeid (ülesanded, tokenid, loomad, akna sätted) saab salvestada ja taastada. |

### Baasfunktsionaalsused

| Teema | Tehtud töö |
| :-: | :----: |
| Ülesanded | Lisamine, kustutamine, tehtuks märkimine ja märke eemaldamine, lohistamisega ümberjärjestamine. Ülesande lõpetamine annab 5 tokenit ainult ühe korra (*rewarded* lipu kaudu), vältides topeltväljamakseid. Säilib taaskäivitusel. |
| Tokenid | Saldo on jälgitav ja kuvatud päises. Tokeneid kulutatakse loomade ostmisele ning neid tagasi ei saa võtta |
| Loomad | Loomade kataloog failis `pets.ts`, loomade ruudustik lukustatud/avatud olekute ja hindadega, ostmine tokenitega ning aktiivse looma valimise võimalus (korraga ainult üks aktiivne). |
| Ringi liikuv loom | Eraldi läbipaistev, raamita, *always on top* loomaaken, mis liigub suvalises suunas ringi, mida saab lohistada (lohistamise lõpp tuvastatakse `onMoved` + *debounce* abil)|

## Järgmine sprint

Järgmine eesmärk peaks olema põhitsükli stabiliseerimine ja selle läbi­testimine algusest lõpuni. Praegu on suurte uute funktsioonide lisamisest olulisem integratsiooniprobleemide parandamine, sest enamik MVP “Must Have” punkte on juba realiseeritud.

## Valmis-definitsioon (Definition of Done)

Kasutajalugu loetakse meie tiimi jaoks valmis olevaks siis, kui kõik kokkulepitud tingimused on täidetud ja funktsioon on valmis kasutamiseks.

- Kõik Must have punktid on täidetud: kõik funktsiooni toimimiseks hädavajalikud nõuded on täidetud. Näiteks peab kasutaja saama ülesande lõpetatuks märkida ja teenima selle eest kokkulepitud arvu münte.
- Funktsionaalsus töötab: arendatud funktsioon töötab ootuspäraselt ja täidab oma eesmärki. Näiteks uuendatakse müntide saldot pärast ülesande lõpetamist õigesti.
- Kood on repos: kogu vajalik kood on salvestatud ühisesse GitHubi koodihoidlasse, et kõik tiimiliikmed saaksid sellele ligi.
- Kood on üle vaadatud: vähemalt üks teine tiimiliige on koodi kontrollinud, et leida võimalikud vead ja tagada selle arusaadavus.
- Testimine on tehtud: funktsiooni on testitud erinevates olukordades ning leitud vead on parandatud. Näiteks kontrollitakse, et sama ülesande eest ei saaks münte korduvalt, kui see pole ette nähtud.
- Kasutajaliides on arusaadav: funktsiooni on lihtne kasutada, tekstid on selged ja kujundus sobib rakenduse üldise stiiliga.
- Andmed säilivad: kasutaja ülesanded, müntide saldo ja kogutud loomad salvestatakse nii, et need ei kao rakenduse sulgemisel või taaskäivitamisel, kui vastav funktsioon on arendatud.
- Dokumentatsioon on vajadusel täiendatud: funktsiooni kohta on lisatud vajalikud selgitused, et teised tiimiliikmed mõistaksid selle toimimist.
- Tiim on tulemuse üle vaadanud: tiim kontrollib, et kasutajaloo nõuded on täidetud ja funktsioon vastab kokkulepitud tingimustele.

Kasutajalugu ei loeta valmis olevaks, kui mõni Must have nõue on täitmata, oluline funktsioon ei tööta, testimine on tegemata või kood pole GitHubi lisatud. Could have funktsioonide valmimine ei ole kohustuslik, sest need on lisavõimalused, mida arendatakse ainult siis, kui aega jääb üle.

Seda valmis-definitsiooni järgime kõigis sprintides. Vajadusel täiendame seda projekti käigus, et tagada rakenduse kvaliteet ja tiimiliikmete ühine arusaam sellest, millal töö on valmis.
