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

    const inputFile = document.getElementById('input-file-json');
    if (inputFile) {
        inputFile.addEventListener('change', importaTorneoDaJSON);
    }
});

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
                <input type="text" id="g-a-${i}" placeholder="Giocatore 1" required class="input-testo-config">
                <input type="text" id="g-b-${i}" placeholder="Giocatore 2" required class="input-testo-config">
            </div>
        `;
        contenitoreCampi.appendChild(divSquadra);
    }
}

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
        sedicesimi: [],
        ottavi: [],
        quarti: [],
        semifinali: [],
        finale: []
    };

    for (let i = 1; i <= 16; i++) tabelloneInCorso.sedicesimi.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
    for (let i = 1; i <= 8; i++) tabelloneInCorso.ottavi.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
    for (let i = 1; i <= 4; i++) tabelloneInCorso.quarti.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
    for (let i = 1; i <= 2; i++) tabelloneInCorso.semifinali.push({ partita: i, squadra1: null, squadra2: null, punti1: null, punti2: null });
    tabelloneInCorso.finale.push({ partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null });

    if (numeroSquadreScelte === 32) {
        for (let i = 0; i < 32; i += 2) {
            let p = tabelloneInCorso.sedicesimi[Math.floor(i / 2)];
            p.squadra1 = archivioSquadre[i].id_squadra;
            p.squadra2 = archivioSquadre[i+1].id_squadra;
        }
    } 
    else if (numeroSquadreScelte === 16) {
        for (let i = 0; i < 16; i += 2) {
            let p = tabelloneInCorso.ottavi[Math.floor(i / 2)];
            p.squadra1 = archivioSquadre[i].id_squadra;
            p.squadra2 = archivioSquadre[i+1].id_squadra;
        }
    } 
    else if (numeroSquadreScelte === 8) {
        for (let i = 0; i < 8; i += 2) {
            let p = tabelloneInCorso.quarti[Math.floor(i / 2)];
            p.squadra1 = archivioSquadre[i].id_squadra;
            p.squadra2 = archivioSquadre[i+1].id_squadra;
        }
    } 
    else if (numeroSquadreScelte === 4) {
        for (let i = 0; i < 4; i += 2) {
            let p = tabelloneInCorso.semifinali[Math.floor(i / 2)];
            p.squadra1 = archivioSquadre[i].id_squadra;
            p.squadra2 = archivioSquadre[i+1].id_squadra;
        }
    }

    salvaDatiSuBrowser();
    document.getElementById('schermata-iniziale').style.display = 'none';
    gestisciVisibilitaColonne(numeroSquadreScelte);
    costruisciTabelloneGrafico();
}

function gestisciVisibilitaColonne(numeroSquadre) {
    document.getElementById('col-sedicesimi-sx').style.display = numeroSquadre === 32 ? 'flex' : 'none';
    document.getElementById('col-sedicesimi-dx').style.display = numeroSquadre === 32 ? 'flex' : 'none';
    document.getElementById('col-ottavi-sx').style.display = numeroSquadre >= 16 ? 'flex' : 'none';
    document.getElementById('col-ottavi-dx').style.display = numeroSquadre >= 16 ? 'flex' : 'none';
    document.getElementById('col-quarti-sx').style.display = numeroSquadre >= 8 ? 'flex' : 'none';
    document.getElementById('col-quarti-dx').style.display = numeroSquadre >= 8 ? 'flex' : 'none';
    document.getElementById('col-semifinali-sx').style.display = numeroSquadre >= 4 ? 'flex' : 'none';
    document.getElementById('col-semifinali-dx').style.display = numeroSquadre >= 4 ? 'flex' : 'none';
}

function costruisciTabelloneGrafico() {
    const mappaSquadre = new Map(archivioSquadre.map(s => [s.id_squadra, s]));

    const distribuisciFase = (nomeFase, partiteTotali) => {
        const meta = partiteTotali.length / 2;
        const sottomatchSx = partiteTotali.slice(0, meta);
        const sottomatchDx = partiteTotali.slice(meta);
        
        renderizzaFaseHtml(`fase-${nomeFase}-sx`, sottomatchSx, mappaSquadre, nomeFase, false);
        renderizzaFaseHtml(`fase-${nomeFase}-dx`, sottomatchDx, mappaSquadre, nomeFase, true);
    };

    if (tabelloneInCorso.faseIniziale === 32) distribuisciFase('sedicesimi', tabelloneInCorso.sedicesimi);
    if (tabelloneInCorso.faseIniziale >= 16) distribuisciFase('ottavi', tabelloneInCorso.ottavi);
    if (tabelloneInCorso.faseIniziale >= 8) distribuisciFase('quarti', tabelloneInCorso.quarti);
    if (tabelloneInCorso.faseIniziale >= 4) distribuisciFase('semifinali', tabelloneInCorso.semifinali);
    
    renderizzaFaseHtml('fase-finale-centro', tabelloneInCorso.finale, mappaSquadre, 'finale', false);

    aggiornaCampioneGrafico(mappaSquadre);
}

function renderizzaFaseHtml(idContenitore, partite, mappaSquadre, nomeFaseOriginale, specchiato) {
    const contenitore = document.getElementById(idContenitore);
    if (!contenitore) return;
    contenitore.innerHTML = "";

    partite.forEach(p => {
        const sq1 = mappaSquadre.get(p.squadra1) || { nome_squadra: "Da Definire", giocatori: "" };
        const sq2 = mappaSquadre.get(p.squadra2) || { nome_squadra: "Da Definire", giocatori: "" };
        
        const blocco = document.createElement('div');
        blocco.className = `blocco-partita-grafica ${specchiato ? 'partita-specchiata' : ''}`;
        blocco.innerHTML = `
            <div class="etichetta-match">Match ${p.partita}</div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti1 > p.punti2 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq1.giocatori}">${sq1.nome_squadra}</span>
                <input type="number" class="input-punti" value="${p.punti1 !== null ? p.punti1 : ''}" placeholder="-" onchange="aggiornaPunteggioIncontro('${nomeFaseOriginale}', ${p.partita}, 1, this.value)">
            </div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti2 > p.punti1 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq2.giocatori}">${sq2.nome_squadra}</span>
                <input type="number" class="input-punti" value="${p.punti2 !== null ? p.punti2 : ''}" placeholder="-" onchange="aggiornaPunteggioIncontro('${nomeFaseOriginale}', ${p.partita}, 2, this.value)">
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
    if (faseAttuale === 'sedicesimi') faseSuccessiva = 'ottavi';
    else if (faseAttuale === 'ottavi') faseSuccessiva = 'quarti';
    else if (faseAttuale === 'quarti') faseSuccessiva = 'semifinali';
    else if (faseAttuale === 'semifinali') faseSuccessiva = 'finale';

    if (faseSuccessiva) {
        const prossimoIncontroIndice = Math.floor((numeroPartita - 1) / 2);
        const slotSquadra = (numeroPartita - 1) % 2 === 0 ? 'squadra1' : 'squadra2';
        
        const prossimoIncontro = tabelloneInCorso[faseSuccessiva][prossimoIncontroIndice];
        if (!prossimoIncontro) return;

        const vecchioInviato = prossimoIncontro[slotSquadra];
        
        if (idVincente === null) {
            prossimoIncontro[slotSquadra] = null;
            if (vecchioInviato !== null) {
                prossimoIncontro.punti1 = null;
                prossimoIncontro.punti2 = null;
                applicaProgressioneOReset(faseSuccessiva, prossimoIncontroIndice + 1, null);
            }
        } else {
            prossimoIncontro[slotSquadra] = idVincente;
        }
    }
}

let coriandoliGiaLanciati = false;

function aggiornaCampioneGrafico(mappaSquadre) {
    const f = tabelloneInCorso.finale;
    const container = document.getElementById('zona-vincitore');
    const modale = document.getElementById('modale-vincitore');
    const nomeSquadraCampione = document.getElementById('nome-squadra-campione');
    
    if (!container) return;

    if (f && f[0] && (f[0].punti1 === 4 || f[0].punti2 === 4)) {
        const idVincente = f[0].punti1 === 4 ? f[0].squadra1 : f[0].squadra2;
        const vincitore = mappaSquadre.get(idVincente);
        
        if (vincitore) {
            // Aggiorna il testo e la visualizzazione del box inferiore elastico
            container.innerHTML = `
                <div style="font-size: 0.9rem; color: #aaa;">🏆 CAMPIONI 🏆</div>
                <div class="nome-campione">${vincitore.nome_squadra}</div>
            `;
            container.classList.add('attivo');

            // Imposta il nome della squadra nella finestra centrale pop-up
            if (nomeSquadraCampione) {
                nomeSquadraCampione.textContent = vincitore.nome_squadra;
            }
            
            // Lancia i coriandoli ed apre la modale solo al momento della proclamazione vera e propria
            if (!coriandoliGiaLanciati) {
                coriandoliGiaLanciati = true; 
                
                if (modale) {
                    modale.classList.add('mostra');
                }

                // --- EFFETTO CELEBRAZIONE AD ESPLOSIONI MULTIPLE ---
                var durata = 3 * 1000; // 3 secondi
                var fine = Date.now() + durata;

                (function fotogramma() {
                    // Esplosione da sinistra
                    confetti({
                        particleCount: 4,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.7 }
                    });
                    // Esplosione da destra
                    confetti({
                        particleCount: 4,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.7 }
                    });

                    if (Date.now() < fine) {
                        requestAnimationFrame(fotogramma);
                    }
                }());
            }
        }
    } else {
        // Se il punteggio viene rimosso, resetta lo stato ed elimina le classi attive
        container.innerHTML = "";
        container.classList.remove('attivo');
        if (modale) {
            modale.classList.remove('mostra');
        }
        coriandoliGiaLanciati = false;
    }
}

function chiudiModaleVittoria() {
    const modale = document.getElementById('modale-vincitore');
    if (modale) {
        modale.classList.remove('mostra');
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

function esportaTorneoInJSON() {
    if (!tabelloneInCorso.faseIniziale) {
        alert("Nessun torneo attivo da esportare!");
        return;
    }

    const datiDatiTorneo = {
        archivioSquadre: archivioSquadre,
        tabelloneInCorso: tabelloneInCorso
    };

    const stringaJson = JSON.stringify(datiDatiTorneo, null, 2);
    const blob = new Blob([stringaJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const linkDownload = document.createElement("a");
    linkDownload.href = url;
    linkDownload.download = `torneo_briscola_${tabelloneInCorso.faseIniziale}_squadre.json`;
    document.body.appendChild(linkDownload);
    linkDownload.click();
    
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
}

function importaTorneoDaJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const lettoreFile = new FileReader();
    lettoreFile.onload = function(e) {
        try {
            const datiImportati = JSON.parse(e.target.result);

            if (datiImportati.archivioSquadre && datiImportati.tabelloneInCorso) {
                archivioSquadre = datiImportati.archivioSquadre;
                tabelloneInCorso = datiImportati.tabelloneInCorso;

                salvaDatiSuBrowser();

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