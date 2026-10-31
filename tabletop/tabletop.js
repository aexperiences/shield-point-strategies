/* THE TABLETOP — Shield Point Strategies. A tabletop exercise in the browser: deal inject cards, read them aloud,
   a discussion clock per card, answers typed or dictated (speech recognition), "we don't know" flags, TV mode
   (full screen + screen kept awake), and an after-action report that prints clean. Nothing leaves the device unless sent. */
(function () {
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var SPS = window.SPS || {}, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* home: the fan leans toward your finger or the phone's tilt */
  var fan = $('#fan');
  if (fan && !RM) {
    var lean = function (x, y) { $$('.fcard').forEach(function (c) { c.style.setProperty('--ty', (x * 14).toFixed(1) + 'deg'); c.style.setProperty('--tx', (8 - y * 12).toFixed(1) + 'deg'); }); };
    addEventListener('pointermove', function (e) { lean(e.clientX / innerWidth - .5, e.clientY / innerHeight - .5); }, { passive: true });
    addEventListener('deviceorientation', function (e) { if (e.gamma != null) lean(Math.max(-.5, Math.min(.5, e.gamma / 60)), Math.max(-.5, Math.min(.5, (e.beta - 40) / 80))); });
  }

  var D = $('#tt-data') ? JSON.parse($('#tt-data').textContent) : null; if (!D) return;
  function pick(id) { $$(id + ' button').forEach(function (b) { b.addEventListener('click', function () { $$(id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); SPS.buzz && SPS.buzz(8); }); }); }
  function val(id) { var b = $(id + ' button[aria-pressed=true]'); return b ? b.dataset.v : null; }
  pick('#tV'); pick('#tS');
  var G = null, CLOCK = 180, timer = null;
  function fill(t, v) { return t.replace(/\{place\}/g, v.place).replace(/\{people\}/g, v.people).replace(/\{lead\}/g, v.lead); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  $('#tGo').addEventListener('click', function () {
    var v = D.venues.filter(function (x) { return x.id === val('#tV'); })[0], s = D.scenarios.filter(function (x) { return x.id === val('#tS'); })[0];
    G = { v: v, s: s, i: -1, notes: s.injects.map(function () { return { a: '', flag: false }; }), started: new Date() };
    $('#setup').hidden = true; $('#aar').hidden = true; $('#table').hidden = false; $('#slot').innerHTML = ''; $('#work').hidden = true;
    $('#tTitle').textContent = s.name + ' · ' + v.name; $('#deck').classList.remove('empty', 'used'); prog();
    if ($('#oTV').checked) tv(true); scrollTo(0, 0); SPS.wake && SPS.wake(true);
    setTimeout(deal, RM ? 0 : 450);
  });
  function prog() { $('#tProg').textContent = 'Card ' + Math.max(1, G.i + 1) + ' of ' + G.s.injects.length; }
  function tv(on) { var t = $('#table'); if (on && t.requestFullscreen) t.requestFullscreen().catch(function () { t.classList.add('tv'); }); else if (on) t.classList.add('tv'); }

  function save() { if (G && G.i >= 0) { G.notes[G.i].a = $('#tAns').value.trim(); } }
  function deal() {
    save(); if (G.i + 1 >= G.s.injects.length) return report();
    G.i++; var inj = G.s.injects[G.i]; prog(); $('#deck').classList.add('used'); if (G.i + 1 >= G.s.injects.length) $('#deck').classList.add('empty');
    var text = cap(fill(inj.text, G.v));
    $('#slot').innerHTML = '<article class="icard"><div class="face"><span class="stamp">' + (G.i === 0 ? 'START' : 'UPDATE') + '</span><div class="n">INJECT 0' + (G.i + 1) + ' · ' + SPS.esc(inj.t) + '</div><div class="t">' + SPS.esc(G.s.name) + '</div><p class="txt">' + SPS.esc(text) + '</p><ul>' +
      inj.q.map(function (q) { return '<li>' + SPS.esc(cap(fill(q, G.v))) + '</li>'; }).join('') + '</ul></div></article>';
    $('#work').hidden = false; $('#tAns').value = G.notes[G.i].a; $('#tFlag').setAttribute('aria-pressed', String(G.notes[G.i].flag));
    $('#tNext').textContent = G.i + 1 >= G.s.injects.length ? 'Debrief →' : 'Next card →';
    SPS.buzz && SPS.buzz(14); startClock();
    if ($('#oRead').checked && SPS.speak) SPS.speak(inj.t.replace('T+', 'Time plus ') + '. ' + text + ' ' + inj.q.map(function (q) { return cap(fill(q, G.v)); }).join(' '));
  }
  $('#deck').addEventListener('click', function () { if (G && !$('#deck').classList.contains('empty')) deal(); });
  $('#tNext').addEventListener('click', deal);
  $('#tFlag').addEventListener('click', function () { var n = G.notes[G.i]; n.flag = !n.flag; $('#tFlag').setAttribute('aria-pressed', String(n.flag)); });
  addEventListener('keydown', function (e) { if (!G || $('#table').hidden || e.target.tagName === 'TEXTAREA') return; if (e.key === 'ArrowRight') deal(); if (e.key === ' ') { e.preventDefault(); toggleClock(); } });

  /* the discussion clock: three minutes a card */
  var left = CLOCK, running = false, last = 0;
  function startClock() { left = CLOCK; running = true; last = performance.now(); paintClock(); clearInterval(timer); timer = setInterval(stepClock, 250); }
  function stepClock() { if (!running) return; var now = performance.now(); left -= (now - last) / 1000; last = now; if (left <= 0) { left = 0; running = false; SPS.buzz && SPS.buzz([80, 60, 80]); } paintClock(); }
  function toggleClock() { running = !running; last = performance.now(); paintClock(); }
  function paintClock() { var s = Math.ceil(left); $('#tClock').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + (running || left <= 0 ? '' : ' ‖'); $('#tArc').style.strokeDashoffset = String(163.4 * (1 - left / CLOCK)); }
  $('#tClock').addEventListener('click', toggleClock);

  /* say it: speech recognition writes the team's answer down */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null;
  if (SR) { $('#tMic').hidden = false;
    $('#tMic').addEventListener('click', function () {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true; var base = $('#tAns').value ? $('#tAns').value + ' ' : '';
      rec.onresult = function (e) { var t = ''; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; $('#tAns').value = base + t; };
      rec.onend = function () { rec = null; $('#tMic').classList.remove('on'); $('#tMic').textContent = '🎙 Say it'; };
      try { speechSynthesis.cancel(); } catch (e) {} rec.start(); $('#tMic').classList.add('on'); $('#tMic').textContent = '■ Stop'; });
  }

  $('#tExit').addEventListener('click', function () { save(); report(); });
  function endTable() { clearInterval(timer); if (rec) rec.stop(); try { speechSynthesis.cancel(); } catch (e) {} SPS.wake && SPS.wake(false); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); $('#table').classList.remove('tv'); $('#table').hidden = true; }

  /* the after-action report */
  function report() {
    save(); endTable();
    var done = G.s.injects.slice(0, G.i + 1), open = [], d = G.started;
    var html = '<p class="meta">AFTER-ACTION REPORT · ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' · ' + SPS.esc(G.v.name) + '</p><h2>' + SPS.esc(G.s.name) + '</h2><p class="meta">A tabletop exercise run with Shield Point Strategies\' table · ' + done.length + ' of ' + G.s.injects.length + ' cards played</p>';
    html += done.map(function (inj, k) { var n = G.notes[k]; if (n.flag) open.push(inj); return '<div class="inj"><b>INJECT 0' + (k + 1) + ' · ' + SPS.esc(inj.t) + '</b>' + (n.flag ? '<span class="flag">OPEN ITEM</span>' : '') + '<p>' + SPS.esc(cap(fill(inj.text, G.v))) + '</p><div class="a' + (n.a ? '' : ' empty') + '">' + (n.a ? SPS.esc(n.a) : 'No answer written.') + '</div></div>'; }).join('');
    html += '<h3>Open items — what the team could not answer</h3>' + (open.length ? '<ol>' + open.map(function (inj) { return '<li>' + SPS.esc(cap(fill(inj.q[0], G.v))) + '</li>'; }).join('') + '</ol>' : '<p>None marked. Mark a card "we don\'t know" during the exercise and it lands here.</p>');
    html += '<p class="foot">Shield Point Strategies · ' + SPS.esc(SPS.tagline || '') + ' · ' + SPS.esc(SPS.phone || '') + ' · This exercise is a starting point; Brian facilitates full tabletop exercises on site.</p>';
    $('#aarDoc').innerHTML = html; $('#aar').hidden = false; scrollTo(0, 0);
    var body = 'Hi Brian — we ran the Shield Point tabletop "' + G.s.name + '" (' + G.v.name + '). Open items: ' + (open.length ? open.map(function (i) { return cap(fill(i.q[0], G.v)); }).join(' | ') : 'none marked') + '.\n\n' + done.map(function (inj, k) { return 'INJECT ' + (k + 1) + ': ' + (G.notes[k].a || '(no answer)'); }).join('\n') + '\n\nWe would like you to run a full one with us.';
    $('#aMail').href = 'mailto:' + SPS.email + '?subject=' + encodeURIComponent('Tabletop after-action report — ' + G.s.name) + '&body=' + encodeURIComponent(body.slice(0, 1800));
  }
  $('#aPrint').addEventListener('click', function () { print(); });
  $('#aAgain').addEventListener('click', function () { $('#aar').hidden = true; $('#setup').hidden = false; scrollTo(0, 0); });
})();
