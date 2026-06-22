let archivioSquadre = [];
let tabelloneInCorso = {};
const numeroSquadreScelte = 8;
let idTorneoCloud = null;
let modoSolaLettura = false;

const BUCKET_URL = "https://api.npoint.io/7097e224e5ffcf7ddcce"; // Database Cloud condiviso gratuito


async function verificaAdmin() {
    const psw = prompt("Inserisci Password Admin:");
    if (psw === "PdorFiglioDiKmer") {
        localStorage.setItem('admin_token', 'valido');
        location.reload();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const parametriUrl = new URLSearchParams(window.location.search);
    idTorneoCloud = parametriUrl.get('torneo');

    // 1. Se c'è un ID torneo, scarichiamo sempre i dati dal cloud
    if (idTorneoCloud) {
        await caricaDatiDalCloud();
        // Sincronizzazione automatica ogni 5 secondi per entrambi
        setInterval(caricaDatiDalCloud, 5000); 
    }

    // 2. Carichiamo i dati locali (se esistono)
    const torneoSalvato = localStorage.getItem('torneo_gironi_salvato');
    const squadreSalvate = localStorage.getItem('squadre_gironi_salvate');

    if (torneoSalvato && squadreSalvate) {
        document.getElementById('schermata-iniziale').style.display = 'none';
        tabelloneInCorso = JSON.parse(torneoSalvato);
        archivioSquadre = JSON.parse(squadreSalvate);
        costruisciTabelloneGrafico();
    } else {
        document.getElementById('schermata-iniziale').style.display = 'flex';
    }
});

async function caricaDatiDalCloud() {
    if (!idTorneoCloud) return; // Assicurati che idTorneoCloud sia impostato
    try {
        // Usa direttamente BUCKET_URL (che contiene già l'ID)
        const risp = await fetch(BUCKET_URL + "?nocache=" + new Date().getTime());; 
        if (risp.ok) {
            const dati = await risp.json();
            if (dati && dati.tabelloneInCorso) {
                tabelloneInCorso = dati.tabelloneInCorso;
                archivioSquadre = dati.archivioSquadre;
                costruisciTabelloneGrafico();
            }
        }
    } catch (e) { console.error("Errore download:", e); }
}

async function salvaDatiSuCloud() {
    // Rimosso il controllo "modoSolaLettura" che impediva il salvataggio
    if (!idTorneoCloud) {
        console.warn("ID Torneo mancante, salvataggio non possibile.");
        return;
    }
    
    try {
        const risp = await fetch(BUCKET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ archivioSquadre: archivioSquadre, tabelloneInCorso: tabelloneInCorso })
        });
        
        if (risp.ok) {
            console.log("Dati sincronizzati con il cloud!");
        }
    } catch (e) { 
        console.error("Errore di sincronizzazione:", e); 
    }
}

function mostraFormIscrizione() {
    document.getElementById('fase-scelta-squadre').style.display = 'none';
    document.getElementById('fase-inserimento-nomi').style.display = 'block';

    const contenitoreCampi = document.getElementById('lista-campi-squadre');
    contenitoreCampi.innerHTML = ""; 

    for (let i = 1; i <= numeroSquadreScelte; i++) {
        const divSquadra = document.createElement('div');
        divSquadra.className = "blocco-inserimento-squadra";
        divSquadra.innerHTML = `
            <h3>Squadra ${i}</h3>
            <input type="text" id="nome-sq-${i}" placeholder="Nome Squadra / Coppia (es. I Rossi)" required class="input-testo-config">
            <div class="coppia-giocatori-inputs">
                <input type="text" id="g-a-${i}" placeholder="Nome Giocatore 1" required class="input-testo-config">
                <input type="text" id="g-b-${i}" placeholder="Nome Giocatore 2" required class="input-testo-config">
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

        archivioSquadre.push({ id_squadra: 100 + i, nome_squadra: nomeSq, giocatori: `${g1} e ${g2}` });
    }

    tabelloneInCorso = {
        faseIniziale: 8,
        gironi: {
            A: { squadre: [101, 102, 103, 104], partite: [] },
            B: { squadre: [105, 106, 107, 108], partite: [] }
        },
        semifinali: [
            { partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null, info: "1ª Girone A vs 2ª Girone B" },
            { partita: 2, squadra1: null, squadra2: null, punti1: null, punti2: null, info: "1ª Girone B vs 2ª Girone A" }
        ],
        finale: [ { partita: 1, squadra1: null, squadra2: null, punti1: null, punti2: null } ]
    };

    tabelloneInCorso.gironi.A.partite = [
        { id: 1, giornata: 1, squadra1: 101, squadra2: 104, punti1: null, punti2: null }, 
        { id: 2, giornata: 1, squadra1: 102, squadra2: 103, punti1: null, punti2: null }, 
        { id: 3, giornata: 2, squadra1: 101, squadra2: 102, punti1: null, punti2: null }, 
        { id: 4, giornata: 2, squadra1: 103, squadra2: 104, punti1: null, punti2: null }, 
        { id: 5, giornata: 3, squadra1: 101, squadra2: 103, punti1: null, punti2: null }, 
        { id: 6, giornata: 3, squadra1: 102, squadra2: 104, punti1: null, punti2: null }  
    ];

    tabelloneInCorso.gironi.B.partite = [
        { id: 1, giornata: 1, squadra1: 105, squadra2: 108, punti1: null, punti2: null }, 
        { id: 2, giornata: 1, squadra1: 106, squadra2: 107, punti1: null, punti2: null }, 
        { id: 3, giornata: 2, squadra1: 105, squadra2: 106, punti1: null, punti2: null }, 
        { id: 4, giornata: 2, squadra1: 107, squadra2: 108, punti1: null, punti2: null }, 
        { id: 5, giornata: 3, squadra1: 106, squadra2: 108, punti1: null, punti2: null }, 
        { id: 6, giornata: 3, squadra1: 105, squadra2: 107, punti1: null, punti2: null }  
    ];

    salvaDatiSuBrowser();
    document.getElementById('schermata-iniziale').style.display = 'none';
    costruisciTabelloneGrafico();
}

function costruisciTabelloneGrafico() {
    const mappaSquadre = new Map(archivioSquadre.map(s => [s.id_squadra, s]));

    renderizzaGironeHtml('fase-girone-A', 'A', tabelloneInCorso.gironi.A.partite, mappaSquadre);
    renderizzaGironeHtml('fase-girone-B', 'B', tabelloneInCorso.gironi.B.partite, mappaSquadre);

    aggiornaClassifica('A', mappaSquadre);
    aggiornaClassifica('B', mappaSquadre);

    if (!modoSolaLettura) controllaQualificateSemifinali();

    renderizzaFaseEliminazioneHtml('fase-semifinali', tabelloneInCorso.semifinali, mappaSquadre, 'semifinali');
    renderizzaFaseEliminazioneHtml('fase-finale', tabelloneInCorso.finale, mappaSquadre, 'finale');

    aggiornaCampioneGrafico(mappaSquadre);
}

function renderizzaGironeHtml(idContenitore, lettragirone, partite, mappaSquadre) {
    const contenitore = document.getElementById(idContenitore);
    if (!contenitore) return;
    contenitore.innerHTML = "";
    let giornataCorrente = 0;

    partite.forEach(p => {
        if (p.giornata !== giornataCorrente) {
            giornataCorrente = p.giornata;
            const t = document.createElement('div');
            t.className = "giornata-titolo";
            t.innerText = `Giornata ${giornataCorrente}`;
            contenitore.appendChild(t);
        }
        const sq1 = mappaSquadre.get(p.squadra1);
        const sq2 = mappaSquadre.get(p.squadra2);
        const disAbilitato = modoSolaLettura ? 'disabled' : '';

        const blocco = document.createElement('div');
        blocco.className = 'blocco-partita-grafica';
        blocco.innerHTML = `
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti1 > p.punti2 ? 'vincitore' : ''}">
                <span class="team-nome" title="Giocatori: ${sq1.giocatori}">${sq1.nome_squadra}</span>
                <input type="number" class="input-punti" ${disAbilitato} value="${p.punti1 !== null ? p.punti1 : ''}" placeholder="-" onchange="aggiornaPunteggioGirone('${lettragirone}', ${p.id}, 1, this.value)">
            </div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti2 > p.punti1 ? 'vincitore' : ''}">
                <span class="team-nome" title="Giocatori: ${sq2.giocatori}">${sq2.nome_squadra}</span>
                <input type="number" class="input-punti" ${disAbilitato} value="${p.punti2 !== null ? p.punti2 : ''}" placeholder="-" onchange="aggiornaPunteggioGirone('${lettragirone}', ${p.id}, 2, this.value)">
            </div>
        `;
        contenitore.appendChild(blocco);
    });
}

function renderizzaFaseEliminazioneHtml(idContenitore, partite, mappaSquadre, nomeFase) {
    const contenitore = document.getElementById(idContenitore);
    if (!contenitore) return;
    contenitore.innerHTML = "";

    partite.forEach(p => {
        const sq1 = mappaSquadre.get(p.squadra1) || { nome_squadra: "Da Definire", giocatori: "" };
        const sq2 = mappaSquadre.get(p.squadra2) || { nome_squadra: "Da Definire", giocatori: "" };
        const infoSub = p.info ? `<div class="etichetta-match">${p.info}</div>` : `<div class="etichetta-match">Finalissima</div>`;
        const disAbilitato = modoSolaLettura ? 'disabled' : '';

        const blocco = document.createElement('div');
        blocco.className = 'blocco-partita-grafica';
        blocco.innerHTML = `
            ${infoSub}
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti1 > p.punti2 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq1.giocatori}">${sq1.nome_squadra}</span>
                <input type="number" class="input-punti" ${disAbilitato} value="${p.punti1 !== null ? p.punti1 : ''}" placeholder="-" onchange="aggiornaPunteggioEliminazione('${nomeFase}', ${p.partita}, 1, this.value)">
            </div>
            <div class="team-riga ${p.punti1 !== null && p.punti2 !== null && p.punti2 > p.punti1 ? 'vincitore' : ''}">
                <span class="team-nome" title="${sq2.giocatori}">${sq2.nome_squadra}</span>
                <input type="number" class="input-punti" ${disAbilitato} value="${p.punti2 !== null ? p.punti2 : ''}" placeholder="-" onchange="aggiornaPunteggioEliminazione('${nomeFase}', ${p.partita}, 2, this.value)">
            </div>
        `;
        contenitore.appendChild(blocco);
    });
}

function aggiornaPunteggioGirone(lettragirone, idPartita, numeroSquadra, valore) {
    let valoreNumerico = valore === "" ? null : parseInt(valore);
    const partita = tabelloneInCorso.gironi[lettragirone].partite.find(p => p.id === idPartita);
    if (!partita) return;

    if (numeroSquadra === 1) partita.punti1 = valoreNumerico;
    else partita.punti2 = valoreNumerico;

    salvaDatiSuBrowser();
    salvaDatiSuCloud();
    costruisciTabelloneGrafico();
}

function aggiornaPunteggioEliminazione(fase, numeroPartita, numeroSquadra, valore) {
    let valoreNumerico = valore === "" ? null : parseInt(valore);
    const incontro = tabelloneInCorso[fase].find(p => p.partita === numeroPartita);
    if (!incontro) return;

    if (numeroSquadra === 1) incontro.punti1 = valoreNumerico;
    else incontro.punti2 = valoreNumerico;

    let idVincente = null;
    if (incontro.punti1 === 4) idVincente = incontro.squadra1;
    else if (incontro.punti2 === 4) idVincente = incontro.squadra2;

    if (fase === 'semifinali') {
        const indexFinaleSlot = (numeroPartita === 1) ? 'squadra1' : 'squadra2';
        if (idVincente === null) {
            tabelloneInCorso.finale[0][indexFinaleSlot] = null;
            tabelloneInCorso.finale[0].punti1 = null;
            tabelloneInCorso.finale[0].punti2 = null;
        } else { tabelloneInCorso.finale[0][indexFinaleSlot] = idVincente; }
    }

    salvaDatiSuBrowser();
    salvaDatiSuCloud();
    costruisciTabelloneGrafico();
}

function calcolaClassificaDati(lettragirone) {
    const girone = tabelloneInCorso.gironi[lettragirone];
    const classifica = {};

    girone.squadre.forEach(id => { classifica[id] = { id: id, punti: 0, vittorie: 0, matchVinti: 0 }; });

    girone.partite.forEach(p => {
        if (p.punti1 !== null && p.punti2 !== null) {
            classifica[p.squadra1].matchVinti += p.punti1;
            classifica[p.squadra2].matchVinti += p.punti2;

            if (p.punti1 === 4) { classifica[p.squadra1].punti += 2; classifica[p.squadra1].vittorie += 1; }
            else if (p.punti2 === 4) { classifica[p.squadra2].punti += 2; classifica[p.squadra2].vittorie += 1; }
        }
    });

    return Object.values(classifica).sort((a, b) => {
        if (b.punti !== a.punti) return b.punti - a.punti;
        return b.matchVinti - a.matchVinti;
    });
}

function aggiornaClassifica(lettragirone, mappaSquadre) {
    const listaOrdinata = calcolaClassificaDati(lettragirone);
    const containerCorpo = document.getElementById(`corpo-classifica-${lettragirone}`);
    if (!containerCorpo) return;

    containerCorpo.innerHTML = "";
    listaOrdinata.forEach((pos, index) => {
        const sq = mappaSquadre.get(pos.id);
        const tr = document.createElement('tr');
        if(index < 2) tr.className = "riga-qualificata";
        tr.innerHTML = `
            <td>${index + 1}°</td>
            <td class="classifica-nome" title="Coppia: ${sq.giocatori}">${sq.nome_squadra}</td>
            <td><b>${pos.punti}</b></td>
            <td>${pos.vittorie}</td>
            <td>${pos.matchVinti}</td>
        `;
        containerCorpo.appendChild(tr);
    });
}

function controllaQualificateSemifinali() {
    const gironeA = tabelloneInCorso.gironi.A.partite;
    const gironeB = tabelloneInCorso.gironi.B.partite;
    
    const gironeACompletato = gironeA.every(p => p.punti1 === 4 || p.punti2 === 4);
    const gironeBCompletato = gironeB.every(p => p.punti1 === 4 || p.punti2 === 4);

    if (gironeACompletato && gironeBCompletato) {
        const ordA = calcolaClassificaDati('A');
        const ordB = calcolaClassificaDati('B');

        tabelloneInCorso.semifinali[0].squadra1 = ordA[0].id;
        tabelloneInCorso.semifinali[0].squadra2 = ordB[1].id;
        tabelloneInCorso.semifinali[1].squadra1 = ordB[0].id;
        tabelloneInCorso.semifinali[1].squadra2 = ordA[1].id;
    } else {
        tabelloneInCorso.semifinali[0].squadra1 = null; tabelloneInCorso.semifinali[0].squadra2 = null;
        tabelloneInCorso.semifinali[1].squadra1 = null; tabelloneInCorso.semifinali[1].squadra2 = null;
        tabelloneInCorso.finale[0].squadra1 = null; tabelloneInCorso.finale[0].squadra2 = null;
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
            container.innerHTML = `<div style="font-size: 0.85rem; color: #888;">🏆 CAMPIONE BRISCOLA 🏆</div><div class="nome-campione">${vincitore.nome_squadra}</div>`;
            container.classList.add('attivo');
            if (nomeSquadraCampione) nomeSquadraCampione.textContent = vincitore.nome_squadra;
            
            if (!coriandoliGiaLanciati) {
                coriandoliGiaLanciati = true; 
                if (modale) modale.classList.add('mostra');
                var end = Date.now() + 3000;
                (function frame() {
                    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
                    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
                    if (Date.now() < end) requestAnimationFrame(frame);
                }());
            }
        }
    } else {
        container.innerHTML = ""; container.classList.remove('attivo');
        if (modale) modale.classList.remove('mostra'); coriandoliGiaLanciati = false;
    }
}

function chiudiModaleVittoria() { document.getElementById('modale-vincitore').classList.remove('mostra'); }

function salvaDatiSuBrowser() {
    if (modoSolaLettura) return;
    localStorage.setItem('torneo_gironi_salvato', JSON.stringify(tabelloneInCorso));
    localStorage.setItem('squadre_gironi_salvate', JSON.stringify(archivioSquadre));
    if(idTorneoCloud) localStorage.setItem('id_torneo_attivo', idTorneoCloud);
}

function cancellaTorneoEsistente() { localStorage.clear(); window.location.href = window.location.href.split('?')[0]; }

async function generaLinkFissoSpettatori() {
    if (!tabelloneInCorso.gironi) { alert("Inizia prima il torneo!"); return; }
    if (!idTorneoCloud) {
        idTorneoCloud = "gironi_" + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('id_torneo_attivo', idTorneoCloud);
    }
    await salvaDatiSuCloud();
    const linkFinale = `${window.location.href.split('?')[0]}?torneo=${idTorneoCloud}`;
    navigator.clipboard.writeText(linkFinale).then(() => {
        alert("Link Spettatori Copiato! Mandalo su WhatsApp una sola volta. Aggiornerà le classifiche da solo!");
        mostraBottoneCondivisionePronto();
    }).catch(() => { prompt("Copia manualmente il link:", linkFinale); });
}

function mostraBottoneCondivisionePronto() {
    const btn = document.getElementById('btn-condividi-cloud');
    if(btn) { btn.innerText = "🔗 Copia Link Spettatori (Pronto)"; btn.style.borderColor = "#00ffcc"; btn.style.color = "#00ffcc"; }
}

function esportaTorneoInJSON() {
    const blob = new Blob([JSON.stringify({ archivioSquadre, tabelloneInCorso }, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `torneo_gironi.json`; link.click();
}