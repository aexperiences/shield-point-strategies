/* THE FIRST NINETY — Shield Point Strategies. The scroll clock on the home page, and the live drill: spoken call,
   a ninety-second ring, haptics, screen kept awake, splits, and a role card drawn on canvas to save or share. */
(function () {
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  var SPS = window.SPS || {}, RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function chips(id) { var g = $(id); if (!g) return null; $$(id + ' button').forEach(function (b) { b.addEventListener('click', function () { $$(id + ' button').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); }); g.dispatchEvent(new Event('change')); if (SPS.buzz) SPS.buzz(8); }); }); return g; }
  function val(id) { var b = $(id + ' button[aria-checked=true]'); return b ? b.dataset.v : null; }
  function setVal(id, v) { $$(id + ' button').forEach(function (x) { x.setAttribute('aria-checked', String(x.dataset.v === v)); }); }
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  /* ---------- the opening: 90 races to 0 ---------- */
  var on = $('#opNum'); if (on && !RM && !window.__WM_SHOT) { var t0 = performance.now(); (function tk() { var k = Math.min(1, (performance.now() - t0) / 1150); on.textContent = String(Math.round(90 * (1 - k * k))).padStart(2, '0'); if (k < 1) requestAnimationFrame(tk); })(); }

  /* ---------- home: the clock runs as you scroll ---------- */
  var cs = $('#cs');
  if (cs) {
    var lines = $$('#csLines li'), head = $('.cs-h');
    var paint = function () {
      var r = cs.getBoundingClientRect(), span = cs.offsetHeight - innerHeight, k = Math.min(1, Math.max(0, -r.top / Math.max(1, span)));
      var el = Math.round(k * 90); $('#csMin').textContent = Math.floor((90 - el) / 60); $('#csSec').textContent = String((90 - el) % 60).padStart(2, '0');
      $('#csBar').style.width = (k * 100) + '%'; lines.forEach(function (li) { li.classList.toggle('on', el >= +li.dataset.at); }); head.classList.toggle('on', k > 0.97);
    };
    addEventListener('scroll', paint, { passive: true }); paint();
    chips('#hS'); chips('#hR');
    var go = $('#hGo'); var link = function () { go.href = go.getAttribute('href').split('?')[0] + '?s=' + val('#hS') + '&r=' + val('#hR'); };
    $('#hS').addEventListener('change', link); $('#hR').addEventListener('change', link); link();
  }

  /* ---------- the drill ---------- */
  var DATA = $('#ninety-data') ? JSON.parse($('#ninety-data').textContent) : null; if (!DATA) return;
  chips('#dS'); chips('#dR');
  var q = new URLSearchParams(location.search); if (q.get('s')) setVal('#dS', q.get('s')); if (q.get('r')) setVal('#dR', q.get('r'));
  var LIMIT = 90, run = null;
  function stepsFor(sc, role) { return sc.steps[role] || sc.steps.all; }
  function voice() { return $('#tVoice').checked; } function buzz(p) { if ($('#tBuzz').checked && SPS.buzz) SPS.buzz(p); }

  $('#dGo').addEventListener('click', start);
  function start() {
    var sc = DATA.scenarios.filter(function (s) { return s.id === val('#dS'); })[0], role = DATA.roles.filter(function (r) { return r.id === val('#dR'); })[0];
    var steps = stepsFor(sc, role.id);
    run = { sc: sc, role: role, steps: steps, i: 0, t0: 0, splits: [], done: false, raf: 0, lastTick: -1 };
    $('#cScen').textContent = sc.name + ' · ' + role.name; $('#cCall').textContent = sc.call;
    $('#cDots').innerHTML = steps.map(function () { return '<i></i>'; }).join('');
    $('#result').hidden = true; $('#console').hidden = false; document.body.style.overflow = 'hidden';
    if (document.documentElement.requestFullscreen && matchMedia('(pointer:coarse)').matches) document.documentElement.requestFullscreen().catch(function () {});
    SPS.wake && SPS.wake(true); buzz([60, 60, 60]);
    if (voice() && SPS.speak) SPS.speak(sc.call + ' Go.');
    run.t0 = performance.now(); showStep(); tick(); $('#cDone').focus();
  }
  function showStep() {
    var s = $('#cStep'); s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
    $('#cN').textContent = 'Step ' + (run.i + 1) + ' of ' + run.steps.length; $('#cTxt').textContent = run.steps[run.i];
    $$('#cDots i').forEach(function (d, k) { d.className = k < run.i ? 'ok' : k === run.i ? 'now' : ''; });
    if (run.i > 0 && voice() && SPS.speak) SPS.speak(run.steps[run.i]);
  }
  function tick() {
    if (!run || run.done) return;
    var el = (performance.now() - run.t0) / 1000, left = LIMIT - el;
    $('#cTime').textContent = fmt(left); $('#cArc').style.strokeDashoffset = String(553 * Math.min(1, el / LIMIT));
    var s = Math.ceil(left); if (s <= 10 && s !== run.lastTick && s > 0) { run.lastTick = s; buzz(25); $('#console').classList.add('alarm'); }
    if (left <= 0) return finish(true);
    run.raf = requestAnimationFrame(tick);
  }
  $('#cDone').addEventListener('click', doneStep);
  addEventListener('keydown', function (e) { if (run && !run.done && !$('#console').hidden && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); doneStep(); } });
  function doneStep() {
    if (!run || run.done) return; var el = (performance.now() - run.t0) / 1000; run.splits.push(el); buzz(18);
    run.i++; if (run.i >= run.steps.length) return finish(false); showStep();
  }
  $('#cQuit').addEventListener('click', function () { if (run) { run.done = true; cancelAnimationFrame(run.raf); } closeConsole(); });
  function closeConsole() { $('#console').hidden = true; $('#console').classList.remove('alarm'); document.body.style.overflow = ''; SPS.wake && SPS.wake(false); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); try { speechSynthesis.cancel(); } catch (e) {} }

  function finish(timeUp) {
    run.done = true; cancelAnimationFrame(run.raf); closeConsole();
    var total = run.splits.length ? run.splits[run.splits.length - 1] : LIMIT, n = run.splits.length, all = run.steps.length;
    $('#rKick').textContent = timeUp ? 'Time' : 'Done'; $('#rHead').innerHTML = timeUp ? 'Ninety <em>gone.</em>' : (total < 60 ? String(Math.max(1, Math.round(total))) + ' <em>seconds.</em>' : fmt(total) + ' <em>flat.</em>');
    $('#rLine').textContent = timeUp ? 'You got ' + n + ' of ' + all + ' steps in ninety seconds. That gap is what practice closes.' : 'All ' + all + ' steps, with ' + Math.round(LIMIT - total) + ' seconds to spare. Now do it with your whole team.';
    var prev = 0; $('#rSplits').innerHTML = run.steps.map(function (st, k) { var t = run.splits[k]; var li = '<li' + (t == null ? ' class="miss"' : '') + '><span>' + (k + 1) + '. ' + SPS.esc(st) + '</span><b>' + (t == null ? 'missed' : '+' + (t - prev).toFixed(1) + 's') + '</b></li>'; if (t != null) prev = t; return li; }).join('');
    var msg = 'Hi Brian — I ran the Shield Point "' + run.sc.name + '" drill as ' + run.role.name + ': ' + (timeUp ? n + ' of ' + all + ' steps in ninety seconds.' : 'all ' + all + ' steps in ' + Math.round(total) + ' seconds.') + ' I want you to run it with our team.';
    $('#rSms').href = 'sms:' + SPS.sms + '?&body=' + encodeURIComponent(msg);
    $('#result').hidden = false; drawCard(timeUp, total, n); $('#result').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    if (voice() && SPS.speak) SPS.speak(timeUp ? 'Time.' : 'Done. ' + Math.round(total) + ' seconds.');
  }
  $('#rAgain').addEventListener('click', function () { $('#result').hidden = true; scrollTo(0, 0); start(); });

  /* ---------- the role card: drawn on canvas, saved as a picture ---------- */
  var logo = new Image(); logo.src = (SPS.root || '/') + 'assets/logo-shield.png';
  function wrap(g, text, x, y, w, lh) { var words = text.split(' '), line = ''; for (var i = 0; i < words.length; i++) { var t = line + words[i] + ' '; if (g.measureText(t).width > w && line) { g.fillText(line.trim(), x, y); line = words[i] + ' '; y += lh; } else line = t; } g.fillText(line.trim(), x, y); return y + lh; }
  function drawCard(timeUp, total, n) {
    var c = $('#card'), g = c.getContext('2d'), W = c.width, H = c.height;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.fillStyle = '#ff1e2d'; g.fillRect(0, 0, W, 18);
    var draw = function () {
      if (logo.complete && logo.naturalWidth) g.drawImage(logo, 70, 80, 150, 150 * logo.naturalHeight / logo.naturalWidth);
      g.fillStyle = '#fff'; g.font = '400 92px Anton, Impact, sans-serif'; g.fillText('MY FIRST NINETY', 250, 170);
      g.fillStyle = '#ff1e2d'; g.font = '600 30px "JetBrains Mono", monospace'; g.fillText((run.sc.name + ' · ' + run.role.name).toUpperCase(), 254, 220);
      g.fillStyle = '#fff'; g.font = '500 40px "Inter Tight", system-ui, sans-serif'; var y = 360;
      run.steps.forEach(function (st, k) { g.fillStyle = '#ff1e2d'; g.fillText(String(k + 1), 80, y); g.fillStyle = '#fff'; y = wrap(g, st, 140, y, W - 220, 50) + 22; });
      g.fillStyle = '#1c1c20'; g.fillRect(70, H - 250, W - 140, 2);
      g.fillStyle = '#a1a1a8'; g.font = '600 28px "JetBrains Mono", monospace'; g.fillText(timeUp ? n + ' OF ' + run.steps.length + ' STEPS IN 90 SECONDS' : 'ALL STEPS IN ' + Math.round(total) + ' SECONDS', 70, H - 190);
      g.fillStyle = '#fff'; g.font = '400 46px Anton, Impact, sans-serif'; g.fillText('SHIELD POINT STRATEGIES', 70, H - 120);
      g.fillStyle = '#a1a1a8'; g.font = '500 28px "Inter Tight", sans-serif'; g.fillText('Preparedness · Planning · Protection · ' + (SPS.phone || ''), 70, H - 74);
      try { $('#rSave').href = c.toDataURL('image/png'); } catch (e) {}
      c.toBlob && c.toBlob(function (bl) { if (!bl || !navigator.canShare) return; var f = new File([bl], 'my-first-ninety.png', { type: 'image/png' }); if (navigator.canShare({ files: [f] })) { var sh = $('#rShare'); sh.hidden = false; sh.onclick = function () { navigator.share({ files: [f], title: 'My first ninety — Shield Point Strategies' }).catch(function () {}); }; } });
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { if (logo.complete) draw(); else { logo.onload = draw; logo.onerror = draw; } });
  }
})();
