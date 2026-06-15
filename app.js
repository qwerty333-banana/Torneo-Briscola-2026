let archivioSquadre = [];
let tabelloneInCorso = {};
let numeroSquadreScelte = 4;

document.addEventListener("DOMContentLoaded", () => {
    const torneoSalvato = localStorage.getItem('torneo_briscola_salvato');
    const squadreSalvate = localStorage.getItem('squadre_briscola_salvate');

    if (torneoSalvato && squadreSalvate) {
        document.getElementById('schermata-iniziale').style.display = 'none';
        tabelloneInCorso = JSON.parse(torneoSalvato);
        archivioSquadre = JSON.parse(squadreSalvate);
        gestisciVisibilitaColonne(tabelloneInCorso.faseIniziale);
        costruisciTabelloneGrafico();
    } else {
        document.getElementById('schermata-iniziale').style.display = 'flex';
    }

    // Ascolta il caricamento del file JSON se l'elemento esiste nell'HTML
    const inputFile = document.getElementById('input-file-json');
    if (inputFile) {
        inputFile.addEventListener('change', importaTorneoDaJSON);
    }
});

// Mostra i campi di testo per inserire i nomi reali delle squadre
function mostraFormIscrizione(numeroSquadre) {
    numeroSquadreScelte = numeroSquadre;
    document.getElementById('fase-scelta-squadre').style.display = 'none';
    document.getElementById('fase-inserimento-nomi').style.display = 'block';

    const contenitoreCampi = document.getElementById('lista-campi-squadre');
    contenitoreCampi.innerHTML = ""; 

    for (let i = 1; i <= numeroSquadre; i++) {
        const divSquadra = document.createElement('div');
        divSquadra.className = "blocco-inserimento-squadra";
        divSquadra.innerHTML = `
            <h3>Iscrizione Squadra ${i}</h3>
            <input type="text" id="nome-sq-${i}" placeholder="Nome della Squadra" required class="input-testo-config">
            <div class="coppia-giocatori-inputs">
                <input type="text" id="g-a-${i}" placeholder="Giocatore 1 (Nome e Cognome)" required class="input-testo-config">
                <input type="text" id="g-b-${i}" placeholder="Giocatore 2 (Nome e Cognome)" required class="input-testo-config">
            </div>
        `;
        contenitoreCampi.appendChild(divSquadra);
    }
}

// Raccoglie i dati inseriti e fa partire l'albero di gioco
function confermaEIniziaTorneo(event) {
    event.preventDefault(); 
    archivioSquadre = [];

    for (let i = 1; i <= numeroSquadreScelte; i++) {
        const nomeSq = document.getElementById(`nome-sq-${i}`).value;
        const g1 = document.getElementById(`g-a-${i}`).value;
        const g2 = document.getElementById(`g-b-${i}`).value;

        archivioSquadre.push({
            id_squadra: 100 + i,
            nome_squadra: nomeSq,
            giocatori: `${g1} - ${g2}`
        });
    }

    tabelloneInCorso = {
        faseIniziale: numeroSquadreScelte,
        ottavi: [],
        quarti: [],
        semifinali: [],
        finale: []
    };

    let indicePartita = 1;
    if (numeroSquadreScelte === 16) {
        for (let i = 0; i < 16; i += 2) {
            tabelloneInCorso.ottavi.push({ partita: indicePartita++, squadra1: archivioSquadre[i].id_squadra, squadra2: archivioSquadre[i+1].id_squadra, punti1: null, punti2: null });
        }
        for (let i = 1; i <= 4; i++) tabelloneInCorso.quarti.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
        for (let i = 1; i <= 2; i++) tabelloneInCorso.semifinali.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
        tabelloneInCorso.finale.push({ partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null });
    } 
    else if (numeroSquadreScelte === 8) {
        for (let i = 0; i < 8; i += 2) {
            tabelloneInCorso.quarti.push({ partita: indicePartita++, squadra1: archivioSquadre[i].id_squadra, squadra2: archivioSquadre[i+1].id_squadra, punti1: null, punti2: null });
        }
        for (let i = 1; i <= 2; i++) tabelloneInCorso.semifinali.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
        tabelloneInCorso.finale.push({ partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null });
    } 
    else if (numeroSquadreScelte === 4) {
        for (let i = 0; i < 4; i += 2) {
            tabelloneInCorso.semifinali.push({ partita: indicePartita++, squadra1: archivioSquadre[i].id_squadra, squadra2: archivioSquadre[i+1].id_squadra, punti1: null, punti2: null });
        }
        tabelloneInCorso.finale.push({ partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null });
    }

    salvaDatiSuBrowser();
    
    document.getElementById('schermata-iniziale').style.display = 'none';
    gestisciVisibilitaColonne(numeroSquadreScelte);
    costruisciTabelloneGrafico();
}

function gestisciVisibilitaColonne(numeroSquadre) {
    document.getElementById('col-ottavi').style.display = numeroSquadre === 16 ? 'flex' : 'none';
    document.getElementById('col-quarti').style.display = numeroSquadre >= 8 ? 'flex' : 'none';
    document.getElementById('col-semifinali').style.display = numeroSquadre >= 4 ? 'flex' : 'none';
}

function costruisciTabelloneGrafico() {
    const mappaSquadre = new Map(archivioSquadre.map(s => [s.id_squadra, s]));

    if (tabelloneInCorso.faseIniziale === 16) renderizzaFaseHtml('ottavi', tabelloneInCorso.ottavi, mappaSquadre);
    if (tabelloneInCorso.faseIniziale >= 8) renderizzaFaseHtml('quarti', tabelloneInCorso.quarti, mappaSquadre);
    if (tabelloneInCorso.faseIniziale >= 4) renderizzaFaseHtml('semifinali', tabelloneInCorso.semifinali, mappaSquadre);
    renderizzaFaseHtml('finale', tabelloneInCorso.finale, mappaSquadre);

    aggiornaCampioneGrafico(mappaSquadre);
}

function renderizzaFaseHtml(nomeFase, partite, mappaSquadre) {
    const contenitore = document.getElementById(`fase-${nomeFase}`);
    if (!contenitore) return;
    contenitore.innerHTML = "";

    partite.forEach(p => {
        const sq1 = mappaSquadre.get(p.squadra1) || { nome_squadra: "Da Definire", giocatori: "" };
        const sq2 = mappaSquadre.get(p.squadra2) || { nome_squadra: "Da Definire", giocatori: "" };
        
        const blocco = document.createElement('div');
        blocco.className = "blocco-partita-grafica";
        blocco.innerHTML = `
            <div class="etichetta-match">Match ${p.partita}</div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti1 > p.punti2 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq1.giocatori}">${sq1.nome_squadra}</span>
                <input type="number" class="input-punti" value="${p.punti1 !== null ? p.punti1 : ''}" placeholder="-" onchange="aggiornaPunteggioIncontro('${nomeFase}', ${p.partita}, 1, this.value)">
            </div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti2 > p.punti1 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq2.giocatori}">${sq2.nome_squadra}</span>
                <input type="number" class="input-punti" value="${p.punti2 !== null ? p.punti2 : ''}" placeholder="-" onchange="aggiornaPunteggioIncontro('${nomeFase}', ${p.partita}, 2, this.value)">
            </div>
        `;
        contenitore.appendChild(blocco);
    });
}

function aggiornaPunteggioIncontro(fase, numeroPartita, numeroSquadra, valore) {
    let valoreNumerico = valore === "" ? null : parseInt(valore);
    
    if (valoreNumerico !== null && (valoreNumerico < 0 || valoreNumerico > 4)) {
        valoreNumerico = null; 
    }

    const incontro = tabelloneInCorso[fase].find(p => p.partita === numeroPartita);
    if (!incontro) return;
    
    if (numeroSquadra === 1) incontro.punti1 = valoreNumerico;
    else incontro.punti2 = valoreNumerico;

    let idVincente = null;
    if (incontro.punti1 === 4) {
        idVincente = incontro.squadra1;
    } else if (incontro.punti2 === 4) {
        idVincente = incontro.squadra2;
    }

    applicaProgressioneOReset(fase, numeroPartita, idVincente);

    salvaDatiSuBrowser();
    costruisciTabelloneGrafico();
}

function applicaProgressioneOReset(faseAttuale, numeroPartita, idVincente) {
    let faseSuccessiva = null;
    if (faseAttuale === 'ottavi') faseSuccessiva = 'quarti';
    else if (faseAttuale === 'quarti') faseSuccessiva = 'semifinali';
    else if (faseAttuale === 'semifinali') faseSuccessiva = 'finale';

    if (faseSuccessiva) {
        const prossimoIncontroIndice = Math.floor((numeroPartita - 1) / 2);
        const slotSquadra = (numeroPartita - 1) % 2 === 0 ? 'squadra1' : 'squadra2';
        
        const vecchioInviato = tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice][slotSquadra];
        
        if (idVincente === null) {
            tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice][slotSquadra] = null;
            if (vecchioInviato !== null) {
                tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice].punti1 = null;
                tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice].punti2 = null;
                applicaProgressioneOReset(faseSuccessiva, prossimoIncontroIndice + 1, null);
            }
        } else {
            tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice][slotSquadra] = idVincente;
        }
    }
}

function aggiornaCampioneGrafico(mappaSquadre) {
    const f = tabelloneInCorso.finale;
    const container = document.getElementById('zona-vincitore');
    if (!container) return;
    container.innerHTML = "";

    if (f && f[0] && (f[0].punti1 === 4 || f[0].punti2 === 4)) {
        const idVincente = f[0].punti1 === 4 ? f[0].squadra1 : f[0].squadra2;
        const vincitore = mappaSquadre.get(idVincente);
        if (vincitore) {
            container.innerHTML = `
                <div class="🏆">🏆 CAMPIONI 🏆</div>
                <div class="nome-campione">${vincitore.nome_squadra}</div>
            `;
        }
    }
}

function salvaDatiSuBrowser() {
    localStorage.setItem('torneo_briscola_salvato', JSON.stringify(tabelloneInCorso));
    localStorage.setItem('squadre_briscola_salvate', JSON.stringify(archivioSquadre));
}

function cancellaTorneoEsistente() {
    localStorage.clear();
    location.reload();
}


/* ========================================================
   NUOVE FUNZIONI: SALVATAGGIO E CARICAMENTO FILE .JSON
   ======================================================== */

// 1. Funzione per SCARICARE il torneo attuale in un file JSON fisco
function esportaTorneoInJSON() {
    if (!tabelloneInCorso.faseIniziale) {
        alert("Nessun torneo attivo da esportare!");
        return;
    }

    // Uniamo i dati in un unico oggetto globale
    const datiDatiTorneo = {
        archivioSquadre: archivioSquadre,
        tabelloneInCorso: tabelloneInCorso
    };

    // Creiamo il file JSON virtuale
    const stringaJson = JSON.stringify(datiDatiTorneo, null, 2);
    const blob = new Blob([stringaJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Generiamo un link invisibile e lo clicchiamo via codice per scaricare il file
    const linkDownload = document.createElement("a");
    linkDownload.href = url;
    linkDownload.download = `torneo_briscola_${tabelloneInCorso.faseIniziale}_squadre.json`;
    document.body.appendChild(linkDownload);
    linkDownload.click();
    
    // Pulizia memoria
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
}

// 2. Funzione per CARICARE il file JSON precedentemente scaricato
function importaTorneoDaJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const lettoreFile = new FileReader();
    lettoreFile.onload = function(e) {
        try {
            const datiImportati = JSON.parse(e.target.result);

            // Controllo validità minimale del file
            if (datiImportati.archivioSquadre && datiImportati.tabelloneInCorso) {
                archivioSquadre = datiImportati.archivioSquadre;
                tabelloneInCorso = datiImportati.tabelloneInCorso;

                // Sincronizziamo anche il localStorage (così al refresh resta salvato)
                salvaDatiSuBrowser();

                // Nascondiamo la schermata iniziale e carichiamo la grafica
                document.getElementById('schermata-iniziale').style.display = 'none';
                gestisciVisibilitaColonne(tabelloneInCorso.faseIniziale);
                costruisciTabelloneGrafico();
                
                alert("Torneo importato con successo!");
            } else {
                alert("Il file caricato non è nel formato corretto.");
            }
        } catch (errore) {
            alert("Errore nella lettura del file JSON.");
            console.error(errore);
        }
    };
    lettoreFile.readAsText(file);
}