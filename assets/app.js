/* Boussole IA — logique de l'application
   Navigation par URL (#/...) : le bouton « retour » du navigateur fonctionne
   et chaque fiche peut être partagée par lien. */
(function () {
    'use strict';

    let data = null;
    let query = '';
    let lastBesoin = null;
    const checks = {};          // état des checklists : { "slug:etape": [bool, ...] }
    const app = document.getElementById('app');

    // ---------- Utilitaires ----------
    const icon = (name, cls = 'i') => {
        const body = (window.ICONS || {})[name];
        return body ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>` : '';
    };
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const slug = s => norm(s).replace(/&/g, 'et').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Les données utilisent des emojis (⚠️ ❌ ✅) en tête de certaines mentions : on les remplace par une icône cohérente.
    function confLine(text) {
        let t = String(text || ''), ic = 'lock';
        if (/^⚠/.test(t)) ic = 'shield-alert';
        else if (/^❌/.test(t)) ic = 'circle-x';
        else if (/^✅/.test(t)) ic = 'shield-check';
        t = t.replace(/^[☀-➿\u{1F300}-\u{1FAFF}]️?\s*/u, '');
        return `<p class="conf">${icon(ic)}<span>${esc(t)}</span></p>`;
    }

    function familyOf(besoin) { return data.familles.find(f => f.besoins.includes(besoin)); }
    function besoinBySlug(s) { return Object.keys(data.recommandations).find(b => slug(b) === s); }

    let toastTimer;
    function toast(msg) {
        const el = document.getElementById('toast');
        el.innerHTML = icon('check') + esc(msg);
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
    }

    function hydrateIcons(root = document) {
        root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); el.removeAttribute('data-icon'); });
    }

    function setNav(key) {
        document.querySelectorAll('.topnav a').forEach(a => {
            if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
    }

    // ---------- Accueil ----------
    function renderHome() {
        setNav('home');
        const actus = (data.actualites || []).slice(0, 3);
        const total = Object.keys(data.recommandations).length;

        app.innerHTML = `
        <section class="hero">
            <div class="wrap hero-grid">
                <div>
                    <p class="eyebrow">Formation IA · agents des collectivités</p>
                    <h1>De quoi avez-vous <em>besoin</em> aujourd'hui&nbsp;?</h1>
                    <p class="lede">${total} situations de travail. Pour chacune : l'outil le plus adapté, une alternative, une option européenne, les garde-fous et un prompt prêt à copier.</p>
                    <div class="search" role="search">
                        ${icon('search')}
                        <label class="sr-only" for="q">Rechercher un besoin ou un outil</label>
                        <input id="q" type="search" autocomplete="off" placeholder="Ex. : compte-rendu, budget, affiche, Claude…" value="${esc(query)}">
                    </div>
                </div>
                ${compassSVG()}
            </div>
            <div class="wrap">
                <aside class="newsbar" aria-labelledby="news-title">
                    <h2 id="news-title">${icon('newspaper')} Ce qui a changé</h2>
                    <ul>${actus.map(a => `<li><span class="when">${esc(a.date)} · ${esc(a.outil)}</span><span class="what">${esc(a.titre)}</span></li>`).join('')}</ul>
                    <a class="link-arrow" href="#/nouveautes">Tout voir ${icon('arrow-right')}</a>
                </aside>
            </div>
        </section>

        <nav class="famnav" aria-label="Familles de besoins">
            <div class="wrap">
                ${data.familles.map(f => `<a class="chip t-${f.teinte}" href="#fam-${f.id}" data-fam="${f.id}"><span class="dot"></span>${esc(f.titre)} <span class="n">${f.besoins.length}</span></a>`).join('')}
            </div>
        </nav>

        <div class="families wrap" id="families"></div>`;

        renderFamilies();
        const input = document.getElementById('q');
        input.addEventListener('input', e => { query = e.target.value; renderFamilies(); });

        document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', e => {
            e.preventDefault();
            const target = document.getElementById('fam-' + c.dataset.fam);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

        observeFamilies();

        if (lastBesoin) {
            const tile = document.querySelector(`.tile[data-slug="${slug(lastBesoin)}"]`);
            if (tile) { tile.scrollIntoView({ block: 'center' }); tile.focus({ preventScroll: true }); }
            lastBesoin = null;
        } else {
            window.scrollTo(0, 0);
        }
    }

    // ---------- Boussole décorative (l'aiguille suit le curseur) ----------
    function compassSVG() {
        let ticks = '';
        for (let i = 0; i < 72; i++) {
            const a = i * 5 * Math.PI / 180, major = i % 9 === 0;
            const r1 = major ? 80 : 84, r2 = 90;
            ticks += `<line class="tick${major ? ' major' : ''}" x1="${100 + r1 * Math.sin(a)}" y1="${100 - r1 * Math.cos(a)}" x2="${100 + r2 * Math.sin(a)}" y2="${100 - r2 * Math.cos(a)}"/>`;
        }
        return `<div class="hero-compass" aria-hidden="true"><svg viewBox="0 0 200 200">
            <defs><radialGradient id="glow"><stop offset="0" stop-color="#f0895c" stop-opacity=".28"/><stop offset="1" stop-color="#f0895c" stop-opacity="0"/></radialGradient></defs>
            <circle class="glow" cx="100" cy="100" r="70"/>
            <circle class="ring-b" cx="100" cy="100" r="96"/>
            <circle class="ring" cx="100" cy="100" r="91"/>
            <circle class="ring" cx="100" cy="100" r="62"/>
            ${ticks}
            <text class="n" x="100" y="70">N</text><text x="130" y="100">E</text><text x="100" y="130">S</text><text x="70" y="100">O</text>
            <g class="needle idle">
                <path d="M100 30 L108 100 L100 94 L92 100 Z" fill="#f0895c"/>
                <path d="M100 170 L108 100 L100 106 L92 100 Z" fill="rgba(247,239,227,.5)"/>
                <circle cx="100" cy="100" r="5" fill="#1f1815" stroke="#f7efe3" stroke-width="1.5"/>
            </g></svg></div>`;
    }

    const canAnimate = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let needleAngle = 0, needleRaf = null;
    document.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || !canAnimate()) return;
        const needle = document.querySelector('.hero-compass .needle');
        if (!needle || needleRaf) return;
        needleRaf = requestAnimationFrame(() => {
            needleRaf = null;
            const box = needle.ownerSVGElement.getBoundingClientRect();
            const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
            const target = Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
            let delta = ((target - needleAngle) % 360 + 540) % 360 - 180; // chemin le plus court
            needleAngle += delta;
            needle.classList.remove('idle');
            needle.style.transform = `rotate(${needleAngle}deg)`;
        });
    });

    // ---------- Tuiles : inclinaison vers le curseur ----------
    function bindTiles(root) {
        if (!finePointer() || !canAnimate()) return;
        root.querySelectorAll('.tile').forEach(t => {
            t.addEventListener('pointermove', e => {
                const r = t.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
                t.classList.add('tilting');
                t.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
                t.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg');
                t.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                t.style.setProperty('--my', (y * 100).toFixed(1) + '%');
            });
            t.addEventListener('pointerleave', () => {
                t.classList.remove('tilting');
                t.style.setProperty('--rx', '0deg');
                t.style.setProperty('--ry', '0deg');
            });
        });
    }

    // ---------- Tuiles : apparition au défilement ----------
    let revealObs;
    function revealTiles(root) {
        if (!('IntersectionObserver' in window) || !canAnimate()) return;
        if (revealObs) revealObs.disconnect();
        revealObs = new IntersectionObserver(entries => {
            entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } });
        }, { rootMargin: '0px 0px -8% 0px' });
        root.querySelectorAll('.tiles').forEach(grid => {
            grid.querySelectorAll('.tile').forEach((t, i) => { t.style.setProperty('--d', i); t.classList.add('reveal'); revealObs.observe(t); });
        });
    }

    function renderFamilies() {
        const box = document.getElementById('families');
        const q = norm(query.trim());
        let shown = 0;
        const html = data.familles.map((f, fi) => {
            const items = f.besoins.filter(b => {
                if (!q) return true;
                const r = data.recommandations[b];
                return norm([b, r.description, r.principal.nom, r.alternative.nom, r.souverain?.nom, f.titre].join(' ')).includes(q);
            });
            if (!items.length) return '';
            shown += items.length;
            return `
            <section class="family t-${f.teinte}" id="fam-${f.id}" aria-labelledby="h-${f.id}">
                <div class="family-head">
                    <span class="family-num" aria-hidden="true">${String(fi + 1).padStart(2, '0')}</span>
                    <div><h2 id="h-${f.id}">${esc(f.titre)}</h2><p>${esc(f.description)}</p></div>
                </div>
                <div class="tiles">
                    ${items.map(b => {
                        const r = data.recommandations[b];
                        return `<a class="tile" href="#/besoin/${slug(b)}" data-slug="${slug(b)}">
                            ${r.nouveau ? '<span class="tag-new">Nouveau</span>' : ''}
                            <span class="tile-icon">${icon(r.picto)}</span>
                            <h3>${esc(b)}</h3>
                            <p>${esc(r.description)}</p>
                            <span class="tile-foot"><span>Conseillé : <strong>${esc(r.principal.nom)}</strong></span>${icon('arrow-right')}</span>
                        </a>`;
                    }).join('')}
                </div>
            </section>`;
        }).join('');
        box.innerHTML = shown ? html : `<p class="empty">Aucun besoin ne correspond à « ${esc(query)} ». Essayez un mot plus simple (ex. : « mail », « réunion », « image »).</p>`;
        observeFamilies();
        bindTiles(box);
        revealTiles(box);
    }

    let observer;
    function observeFamilies() {
        if (observer) observer.disconnect();
        if (!('IntersectionObserver' in window)) return;
        observer = new IntersectionObserver(entries => {
            entries.forEach(en => {
                if (!en.isIntersecting) return;
                const id = en.target.id.replace('fam-', '');
                document.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-active', c.dataset.fam === id));
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        document.querySelectorAll('.family').forEach(s => observer.observe(s));
    }

    // ---------- Fiche besoin ----------
    function renderBesoin(besoin) {
        setNav('home');
        lastBesoin = besoin;
        const r = data.recommandations[besoin];
        const f = familyOf(besoin);
        const s = slug(besoin);

        const list = (items, ic) => (items || []).map(x => `<li>${icon(ic)}<span>${esc(x)}</span></li>`).join('');

        const defs = (r.definitions || []).map(k => data.glossaire[k]).filter(Boolean).map(d =>
            `<div class="note note-info">${icon('lightbulb')}<div><h4>${esc(d.terme)}</h4><p>${esc(d.definition)}</p></div></div>`).join('');

        const methode = r.methode ? `
            <section class="section">
                <h2 class="section-title">${icon('target')} ${esc(r.methode.titre)}</h2>
                <div class="steps">${r.methode.etapes.map(e => `
                    <div class="step-card"><span class="num">${e.numero}</span><h4>${esc(e.titre)}</h4><p>${esc(e.description)}</p><q>${esc(e.exemple)}</q></div>`).join('')}
                </div>
                <ul class="tips">${list(r.methode.conseils, 'lightbulb')}</ul>
            </section>` : '';

        const alt = r.alternative;
        const sv = r.souverain;
        const p = r.promptExemple;

        app.innerHTML = `
        <div class="page wrap t-${f.teinte}">
            <nav class="crumbs" aria-label="Fil d'Ariane">
                <a href="#/">Besoins</a>${icon('chevron-right')}<a href="#/" data-fam-link="${f.id}">${esc(f.titre)}</a>${icon('chevron-right')}<span aria-current="page">${esc(besoin)}</span>
            </nav>

            <header class="page-head">
                <span class="big-icon">${icon(r.picto)}</span>
                <div class="txt">
                    <span class="fam-tag">${esc(f.titre)}</span>
                    <h1>${esc(besoin)}</h1>
                    <p class="sub">${esc(r.description)}</p>
                </div>
            </header>

            <div class="layout">
                <div>
                    <section class="section" aria-labelledby="t-tools">
                        <h2 class="section-title" id="t-tools">${icon('compass')} Quel outil utiliser&nbsp;?</h2>
                        <article class="pick pick-main">
                            <span class="pick-label">${icon('star')} Notre recommandation</span>
                            <h3>${esc(r.principal.nom)}</h3>
                            <p class="eco">${esc(r.principal.ecosysteme)}</p>
                            <p class="why">${esc(r.principal.pourquoi)}</p>
                            ${confLine(r.principal.modeConfidentiel)}
                            ${(r.principal.forces || r.principal.limites) ? `
                            <div class="pros-cons">
                                <div class="pros"><h4>Points forts</h4><ul>${list(r.principal.forces, 'circle-check')}</ul></div>
                                <div class="cons"><h4>Limites</h4><ul>${list(r.principal.limites, 'circle-x')}</ul></div>
                            </div>` : ''}
                        </article>
                        <div class="picks-row">
                            <article class="pick">
                                <span class="pick-label">Alternative</span>
                                <h3>${esc(alt.nom)}</h3>
                                <p class="eco">${esc(alt.ecosysteme)}</p>
                                <p class="why">${esc(alt.pourquoi)}</p>
                                ${confLine(alt.modeConfidentiel)}
                            </article>
                            ${sv ? `
                            <article class="pick pick-fr">
                                <span class="pick-label">Option européenne</span>
                                <h3>${esc(sv.nom)}</h3>
                                <p class="eco">${esc(sv.ecosysteme)}</p>
                                <p class="why">${esc(sv.pourquoi)}</p>
                                ${confLine(sv.modeConfidentiel)}
                            </article>` : `
                            <article class="pick pick-none"><p>Pas d'alternative européenne satisfaisante identifiée à ce jour pour ce besoin.</p></article>`}
                        </div>
                    </section>

                    ${defs ? `<section class="section"><h2 class="section-title">${icon('lightbulb')} À savoir</h2>${defs}</section>` : ''}
                    ${methode}

                    <section class="section" aria-labelledby="t-safe">
                        <h2 class="section-title" id="t-safe">${icon('shield-check')} Les garde-fous</h2>
                        <div class="note note-warn">${icon('triangle-alert')}<div><h4>Quand éviter</h4><p>${esc(r.quandEviter)}</p></div></div>
                        ${r.legalInfo ? `<div class="note note-legal">${icon('scale')}<div><h4>Point juridique</h4><p>${esc(r.legalInfo)}</p></div></div>` : ''}
                        <div class="data-cols">
                            <div class="data-col data-ok"><h4>${icon('circle-check')} Données acceptables</h4><ul>${(r.donneesAcceptables || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
                            <div class="data-col data-ko"><h4>${icon('circle-x')} Données interdites</h4><ul>${(r.donneesInterdites || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
                        </div>
                    </section>

                    <section class="section" aria-labelledby="t-prompt">
                        <h2 class="section-title" id="t-prompt">${icon('message-square-text')} Un prompt prêt à l'emploi</h2>
                        <div class="prompt">
                            <div class="prompt-head">
                                <span class="lvl">Méthode RCTI · niveau ${esc(p.niveau)}</span>
                                <button class="btn btn-copy" id="copy">${icon('copy')} Copier le prompt</button>
                            </div>
                            <div class="rcti">
                                <div><span class="letter">R</span><div><span class="lbl">Rôle</span><p>${esc(p.role)}</p></div></div>
                                <div><span class="letter">C</span><div><span class="lbl">Contexte</span><p>${esc(p.contexte)}</p></div></div>
                                <div><span class="letter">T</span><div><span class="lbl">Tâche</span><p>${esc(p.tache)}</p></div></div>
                                <div><span class="letter">I</span><div><span class="lbl">Instructions</span><p>${esc(p.instructions)}</p></div></div>
                            </div>
                        </div>
                    </section>
                </div>

                <aside class="aside">
                    <div class="cta-card">
                        <h3>Passer à la pratique</h3>
                        <p>Un déroulé en 6 étapes, de la préparation à la capitalisation, avec une checklist à chaque étape.</p>
                        <a class="btn btn-block" href="#/besoin/${s}/etape/1">${icon('rocket')} Workflow guidé</a>
                    </div>
                    <div class="mini-card">
                        <h4>${icon('lock')} Réflexe confidentialité</h4>
                        <p>Activez le mode temporaire ou incognito de l'outil avant d'y coller un document de travail. <a href="#/nouveautes">Voir les modes par outil</a>.</p>
                    </div>
                </aside>
            </div>
        </div>`;

        document.getElementById('copy').addEventListener('click', () => {
            const text = `RÔLE : ${p.role}\n\nCONTEXTE : ${p.contexte}\n\nTÂCHE : ${p.tache}\n\nINSTRUCTIONS : ${p.instructions}`;
            const done = () => toast('Prompt copié dans le presse-papier');
            if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
            else fallbackCopy(text, done);
        });
        const famLink = app.querySelector('[data-fam-link]');
        famLink.addEventListener('click', e => { e.preventDefault(); lastBesoin = null; location.hash = '#/'; setTimeout(() => document.getElementById('fam-' + f.id)?.scrollIntoView(), 30); });
        window.scrollTo(0, 0);
    }

    function fallbackCopy(text, done) {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* rien */ }
        ta.remove();
    }

    // ---------- Workflow guidé ----------
    function renderWorkflow(besoin, stepNum) {
        setNav('home');
        const r = data.recommandations[besoin];
        const f = familyOf(besoin);
        const s = slug(besoin);
        const etapes = data.workflow.etapes;
        const n = etapes.length;
        const finished = stepNum === 'fin';
        const idx = finished ? n : Math.min(Math.max(parseInt(stepNum, 10) || 1, 1), n) - 1;

        const isDone = i => { const c = checks[s + ':' + i]; return c && c.length && c.every(Boolean); };

        const progress = `<div class="progress" role="list">${etapes.map((e, i) => {
            const cls = i === idx ? 'current' : (isDone(i) ? 'done' : '');
            return `<button role="listitem" class="${cls}" data-go="${i + 1}" ${i === idx ? 'aria-current="step"' : ''}><span class="bar"></span>${e.numero}. ${esc(e.titre)}</button>`;
        }).join('')}</div>`;

        let body;
        if (finished) {
            body = `<div class="wf-card done-card">
                <span class="big-icon">${icon('party-popper')}</span>
                <h2>Workflow terminé</h2>
                <p>Dernier réflexe : notez dans un document partagé le prompt qui a fonctionné et ce que vous avez dû corriger. C'est ce qui fait progresser toute l'équipe.</p>
                <div class="btns">
                    <a class="btn" href="#/besoin/${s}">${icon('arrow-left')} Retour à la fiche</a>
                    <a class="btn btn-ghost" href="#/">Choisir un autre besoin</a>
                </div>
            </div>`;
        } else {
            const e = etapes[idx];
            const key = s + ':' + idx;
            if (!checks[key]) checks[key] = e.checklist.map(() => false);
            body = `<div class="wf-card">
                <div class="wf-head"><span class="bignum">${e.numero}</span><div><h2>${esc(e.titre)}</h2><p>${esc(e.description)}</p></div></div>
                ${e.alerte ? `<div class="note note-warn">${icon('triangle-alert')}<div><p>${esc(e.alerte)}</p></div></div>` : ''}
                ${idx === 1 ? `<div class="tool-reminder">${icon('star')}<div><strong>Outil conseillé : ${esc(r.principal.nom)}</strong><p>${esc(r.principal.pourquoi)}</p></div></div>` : ''}
                <div class="wf-grid">
                    <div class="wf-box"><h4>${icon('flag')} Consignes</h4><ul>${e.consignes.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>
                    <div class="wf-box"><h4>${icon('info')} Questions à se poser</h4><ul>${e.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></div>
                </div>
                <div class="checklist">
                    <h4>${icon('circle-check')} Checklist de validation</h4>
                    ${e.checklist.map((c, i) => `<label class="check"><input type="checkbox" data-c="${i}" ${checks[key][i] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}
                </div>
            </div>
            <div class="wf-nav">
                ${idx > 0 ? `<a class="btn btn-ghost" href="#/besoin/${s}/etape/${idx}">${icon('arrow-left')} Précédent</a>` : `<a class="btn btn-ghost" href="#/besoin/${s}">${icon('arrow-left')} Fiche</a>`}
                <a class="btn btn-accent" href="#/besoin/${s}/${idx === n - 1 ? 'fin' : 'etape/' + (idx + 2)}">${idx === n - 1 ? 'Terminer' : 'Étape suivante'} ${icon(idx === n - 1 ? 'check' : 'arrow-right')}</a>
            </div>`;
        }

        app.innerHTML = `
        <div class="page wrap t-${f.teinte}">
            <nav class="crumbs" aria-label="Fil d'Ariane">
                <a href="#/">Besoins</a>${icon('chevron-right')}<a href="#/besoin/${s}">${esc(besoin)}</a>${icon('chevron-right')}<span aria-current="page">Workflow guidé</span>
            </nav>
            ${progress}
            ${body}
        </div>`;

        app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { location.hash = `#/besoin/${s}/etape/${b.dataset.go}`; }));
        app.querySelectorAll('.check input').forEach(inp => inp.addEventListener('change', () => {
            const key = s + ':' + idx;
            checks[key][+inp.dataset.c] = inp.checked;
            const btn = app.querySelector(`[data-go="${idx + 1}"]`);
            if (checks[key].every(Boolean)) { btn.classList.add('done'); toast('Étape validée'); }
        }));
        window.scrollTo(0, 0);
    }

    // ---------- Glossaire ----------
    function renderGlossaire() {
        setNav('gloss');
        const items = Object.values(data.glossaire).sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
        app.innerHTML = `
        <div class="page wrap">
            <header class="page-head"><span class="big-icon" style="--tint:#b4471f;--tint-soft:#f8e3d7">${icon('book-a')}</span>
                <div class="txt"><h1>Glossaire</h1><p class="sub">Les mots de l'IA, expliqués simplement, avec un exemple concret.</p></div></header>
            <div class="gloss">${items.map(g => `
                <article><h2>${esc(g.terme)}</h2><p>${esc(g.definition)}</p><p class="ex"><b>Exemple</b>${esc(g.exemple)}</p></article>`).join('')}
            </div>
        </div>`;
        window.scrollTo(0, 0);
    }

    // ---------- Nouveautés ----------
    function renderNews() {
        setNav('news');
        const m = data.meta || {};
        const modes = data.modesConfidentiels;
        const badge = v => v === true ? `<span class="badge b-yes">${icon('check')}Oui</span>` : v === false ? `<span class="badge b-no">${icon('x')}Non</span>` : `<span class="badge b-part">${icon('info')}Partiel</span>`;
        app.innerHTML = `
        <div class="page wrap">
            <header class="page-head"><span class="big-icon" style="--tint:#b4471f;--tint-soft:#f8e3d7">${icon('newspaper')}</span>
                <div class="txt"><h1>Quoi de neuf&nbsp;?</h1><p class="sub">Ce qui a changé dans les outils, et ce que ça change pour vous${m.derniereVerification ? ` · vérifié en ${esc(m.derniereVerification)}` : ''}.</p></div></header>
            <div class="layout">
                <div>
                    <div class="timeline">${(data.actualites || []).map((a, i) => `
                        <article class="tl-item" style="--i:${i}">
                            <p class="tl-meta"><span class="who">${esc(a.outil)}</span><span class="when">${esc(a.date)}</span></p>
                            <h2>${esc(a.titre)}</h2>
                            <p>${esc(a.detail)}</p>
                            <p class="impact">${icon('arrow-right')}<span><strong>Pour vous :</strong> ${esc(a.impact)}</span></p>
                        </article>`).join('')}
                    </div>
                    ${modes ? `
                    <section class="section" style="margin-top:40px" aria-labelledby="t-modes">
                        <h2 class="section-title" id="t-modes">${icon('lock')} Modes confidentiels, outil par outil</h2>
                        <div class="note note-warn">${icon('triangle-alert')}<div><p>${esc(modes.info)}</p></div></div>
                        <table class="modes">
                            <thead><tr><th scope="col">Outil</th><th scope="col">Mode à activer</th><th scope="col">Disponible</th></tr></thead>
                            <tbody>${Object.entries(modes.outils).map(([nom, x]) => `<tr><td>${esc(nom)}</td><td>${esc(x.nom)}</td><td>${badge(x.disponible)}</td></tr>`).join('')}</tbody>
                        </table>
                    </section>` : ''}
                </div>
                <aside class="aside">
                    <div class="mini-card"><h4>${icon('info')} Pourquoi cette page&nbsp;?</h4><p>${esc(m.avertissement || '')}</p></div>
                </aside>
            </div>
        </div>`;
        window.scrollTo(0, 0);
    }

    // ---------- Routeur ----------
    function route() {
        if (!data) return;
        const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
        if (parts[0] === 'besoin' && parts[1]) {
            const b = besoinBySlug(parts[1]);
            if (!b) return renderHome();
            if (parts[2] === 'etape') return renderWorkflow(b, parts[3]);
            if (parts[2] === 'fin') return renderWorkflow(b, 'fin');
            return renderBesoin(b);
        }
        if (parts[0] === 'glossaire') return renderGlossaire();
        if (parts[0] === 'nouveautes') return renderNews();
        if (parts[0] && parts[0].startsWith('fam-')) return; // ancre interne
        renderHome();
    }

    function afterRoute() {
        // Focus sur le contenu pour les lecteurs d'écran (sauf à l'accueil, pour ne pas voler le focus du champ de recherche)
        if (location.hash && location.hash !== '#/') app.focus({ preventScroll: true });
    }

    window.addEventListener('hashchange', () => { route(); afterRoute(); });

    hydrateIcons();
    fetch('data.json')
        .then(r => r.json())
        .then(d => {
            data = d;
            const m = d.meta || {};
            document.getElementById('meta-info').textContent = m.derniereVerification ? `Informations vérifiées en ${m.derniereVerification}. ${m.avertissement || ''}` : '';
            document.getElementById('news-count').textContent = (d.actualites || []).length || '';
            route();
        })
        .catch(err => {
            console.error(err);
            app.innerHTML = '<div class="wrap page"><p class="empty">Impossible de charger les données (data.json). Si vous ouvrez le fichier en local, lancez un petit serveur web.</p></div>';
        });
})();
