(function () {
  "use strict";

  const GAP_MS = 400;
  const STORAGE_MUTE = "motor-explainer-muted";

  const VISUAL = {
    intro: { view: "intro" },
    "scenes-grid": { view: "grid" },
    "scene-car": { view: "scene", scene: "car" },
    "scene-fan": { view: "scene", scene: "fan" },
    "scene-washer": { view: "scene", scene: "washer" },
    "scene-brush": { view: "scene", scene: "brush" },
    "scene-dryer": { view: "scene", scene: "dryer" },
    "scene-plane": { view: "scene", scene: "plane" },
    "principle-0": { view: "principle", step: "0" },
    "principle-1": { view: "principle", step: "1" },
    "principle-2": { view: "principle", step: "2" },
    "principle-3": { view: "principle", step: "3" },
    "principle-comm": { view: "principle", step: "comm" },
    "explode-0": { view: "explode", explode: "0" },
    "explode-shell": { view: "explode", explode: "shell" },
    "explode-magnets": { view: "explode", explode: "magnets" },
    "explode-coil": { view: "explode", explode: "coil" },
    "explode-shaft": { view: "explode", explode: "shaft" },
    "explode-together": { view: "explode", explode: "together" },
    ending: { view: "ending" },
  };

  const CHAPTERS = [
    { id: "intro", label: "见面", first: "intro-1", match: (s) => s.group === "intro" },
    { id: "scenes", label: "生活里", first: "scenes-intro", match: (s) => s.group.startsWith("scene") },
    { id: "principle", label: "为什么转", first: "principle-intro", match: (s) => s.group === "principle" },
    { id: "explode", label: "拆开看", first: "explode-intro", match: (s) => s.group === "explode" },
  ];

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const app = $("#app");
  const captionEl = $("#caption");
  const captionWrap = $(".caption-wrap");
  const progressBar = $("#progress-bar");
  const btnMute = $("#btn-mute");
  const btnPrev = $("#btn-prev");
  const btnNext = $("#btn-next");
  const btnPlay = $("#btn-play");
  const btnReplay = $("#btn-replay");
  const btnStory = $("#btn-story");
  const btnExplore = $("#btn-explore");
  const btnStoryAgain = $("#btn-story-again");
  const btnExploreAgain = $("#btn-explore-again");
  const btnBack = $("#btn-back");

  const segments = (window.NARRATION && window.NARRATION.segments) || [];
  const byId = Object.fromEntries(segments.map((s) => [s.id, s]));
  const storyIds = segments.map((s) => s.id);

  const state = {
    mode: "idle", // idle | story | explore
    index: 0,
    playing: false,
    paused: false,
    muted: localStorage.getItem(STORAGE_MUTE) === "1",
    timer: null,
    ready: false,
  };

  const player = new Audio();
  player.preload = "auto";

  function showView(name, extra) {
    const vis = VISUAL[name] || { view: "intro" };
    app.dataset.view = vis.view;
    if (vis.scene) app.dataset.scene = vis.scene;
    else app.removeAttribute("data-scene");
    if (vis.step) app.dataset.step = vis.step;
    else app.removeAttribute("data-step");
    if (vis.explode) app.dataset.explode = vis.explode;
    else app.removeAttribute("data-explode");

    $$(".view").forEach((v) => v.classList.remove("is-on"));
    if (name === "cover") {
      app.dataset.view = "cover";
      const cover = document.getElementById("view-cover");
      if (cover) cover.classList.add("is-on");
    } else {
      let id = "view-" + vis.view;
      if (vis.view === "grid" || vis.view === "scene") id = "view-scenes";
      if (vis.view === "principle" || vis.view === "explode") id = "view-motor";
      const el = document.getElementById(id);
      if (el) el.classList.add("is-on");
    }

    $$(".chip").forEach((c) => {
      const on =
        (vis.view === "principle" && c.dataset.step === vis.step) ||
        (vis.view === "explode" && c.dataset.explode === vis.explode);
      c.classList.toggle("is-on", !!on);
    });

    if (extra && extra.seg) app.dataset.seg = extra.seg;
    else app.removeAttribute("data-seg");

    updateChapters(name);
  }

  function updateChapters(visualName) {
    const seg = visualName && byId[storyIds[state.index]];
    const vis = visualName || (seg && seg.visual);
    $$(".chapters button").forEach((btn) => {
      const ch = CHAPTERS.find((c) => c.id === btn.dataset.chapter);
      let on = false;
      if (ch && vis) {
        if (ch.id === "intro") on = vis === "intro" || vis === "cover";
        if (ch.id === "scenes") on = vis === "scenes-grid" || String(vis).startsWith("scene-");
        if (ch.id === "principle") on = String(vis).startsWith("principle");
        if (ch.id === "explode") on = String(vis).startsWith("explode");
      }
      btn.classList.toggle("is-on", on);
    });
  }

  function setCaption(text) {
    captionEl.classList.remove("is-in");
    void captionEl.offsetWidth;
    captionEl.textContent = text || "";
    captionWrap.classList.toggle("is-empty", !text);
    if (text) captionEl.classList.add("is-in");
  }

  function setProgress() {
    const n = storyIds.length || 1;
    const pct = state.mode === "idle" ? 0 : ((state.index + (state.playing ? 0.15 : 0)) / n) * 100;
    progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
  }

  function setMuted(muted) {
    state.muted = muted;
    player.muted = muted;
    localStorage.setItem(STORAGE_MUTE, muted ? "1" : "0");
    btnMute.setAttribute("aria-pressed", muted ? "true" : "false");
    btnMute.setAttribute("aria-label", muted ? "打开声音" : "关掉声音");
    btnMute.title = muted ? "打开声音" : "关掉声音";
    btnMute.querySelector(".icon-on").hidden = muted;
    btnMute.querySelector(".icon-off").hidden = !muted;
  }

  function updatePlayButton() {
    const paused = state.paused || !state.playing;
    btnPlay.setAttribute("aria-label", paused ? "播放" : "暂停");
    btnPlay.title = paused ? "播放" : "暂停";
    btnPlay.querySelector(".icon-play").hidden = !paused;
    btnPlay.querySelector(".icon-pause").hidden = paused;
  }

  function stopAudio() {
    if (state.timer) {
      clearTimeout(state.timer);
      state.timer = null;
    }
    player.pause();
    state.playing = false;
    state.paused = false;
    updatePlayButton();
  }

  function playIndex(i, opts) {
    const options = opts || {};
    if (i < 0 || i >= storyIds.length) {
      stopAudio();
      if (state.mode === "story") finishStory();
      return;
    }
    state.index = i;
    const seg = byId[storyIds[i]];
    showView(seg.visual, { seg: seg.id });
    setCaption(seg.text);
    setProgress();

    player.src = seg.file;
    player.muted = state.muted;
    state.playing = true;
    state.paused = false;
    updatePlayButton();
    const p = player.play();
    if (p && p.catch) {
      p.catch(() => {
        /* autoplay might fail if not unlocked; caption still shows */
        state.playing = false;
        updatePlayButton();
      });
    }

    if (options.exploreOneGroup) {
      state._exploreGroup = seg.group;
    }
  }

  function playGroup(group) {
    const i = segments.findIndex((s) => s.group === group);
    if (i < 0) return;
    state.mode = state.mode === "idle" ? "explore" : state.mode;
    playIndex(i, { exploreOneGroup: true });
  }

  function nextInMode() {
    if (state.mode === "explore" && state._exploreGroup) {
      const next = state.index + 1;
      const seg = segments[next];
      if (seg && seg.group === state._exploreGroup) {
        playIndex(next, { exploreOneGroup: true });
        return;
      }
      stopAudio();
      setProgress();
      return;
    }
    if (state.index + 1 >= storyIds.length) {
      finishStory();
      return;
    }
    playIndex(state.index + 1);
  }

  function finishStory() {
    stopAudio();
    state.mode = "done";
    showView("ending");
    setCaption("");
    progressBar.style.width = "100%";
    const last = segments[segments.length - 1];
    if (last) setCaption(last.text);
  }

  player.addEventListener("ended", () => {
    state.playing = false;
    updatePlayButton();
    state.timer = setTimeout(() => {
      state.timer = null;
      if (state.mode === "story" || (state.mode === "explore" && state._exploreGroup)) {
        nextInMode();
      }
    }, GAP_MS);
  });

  function startStory() {
    state.mode = "story";
    state._exploreGroup = null;
    playIndex(0);
  }

  function startExplore() {
    state.mode = "explore";
    state._exploreGroup = null;
    stopAudio();
    showView("scenes-grid");
    setCaption("点一个会动的东西看看吧。");
    setProgress();
  }

  function jumpChapter(id) {
    const ch = CHAPTERS.find((c) => c.id === id);
    if (!ch) return;
    if (state.mode === "idle") state.mode = "explore";
    const i = storyIds.indexOf(ch.first);
    if (state.mode === "story") {
      playIndex(i);
    } else {
      const seg = byId[ch.first];
      playIndex(i, { exploreOneGroup: true });
      // For scenes chapter in explore, land on the grid after the intro line
      if (id === "scenes") {
        /* play scenes-intro, then stay on grid */
      }
    }
  }

  function togglePause() {
    if (!player.src) {
      if (state.mode === "idle") startStory();
      else playIndex(state.index);
      return;
    }
    if (state.playing && !player.paused) {
      player.pause();
      state.playing = false;
      state.paused = true;
    } else {
      player.play().catch(() => {});
      state.playing = true;
      state.paused = false;
    }
    updatePlayButton();
  }

  function replay() {
    if (!storyIds[state.index] && state.mode === "idle") return;
    const i = state.mode === "done" ? storyIds.length - 1 : state.index;
    const group = state.mode === "explore";
    playIndex(i, { exploreOneGroup: group });
  }

  function preload() {
    const jobs = segments.map(
      (seg) =>
        new Promise((resolve) => {
          const a = new Audio();
          a.preload = "auto";
          a.src = seg.file;
          const done = () => resolve();
          a.addEventListener("canplaythrough", done, { once: true });
          a.addEventListener("error", done, { once: true });
          setTimeout(done, 10000);
        })
    );
    return Promise.all(jobs);
  }

  function unlock() {
    // First play() is called in the same click as startStory/startExplore.
    player.muted = state.muted;
  }

  function markReady() {
    if (state.ready) return;
    state.ready = true;
    btnStory.disabled = false;
    btnExplore.disabled = false;
    btnStory.textContent = "开始听故事";
    btnExplore.textContent = "我自己点着看";
  }

  btnStory.addEventListener("click", () => {
    unlock();
    startStory();
  });
  btnExplore.addEventListener("click", () => {
    unlock();
    startExplore();
  });
  if (btnStoryAgain) {
    btnStoryAgain.addEventListener("click", () => {
      unlock();
      startStory();
    });
  }
  if (btnExploreAgain) {
    btnExploreAgain.addEventListener("click", () => {
      unlock();
      startExplore();
    });
  }

  btnMute.addEventListener("click", () => setMuted(!state.muted));
  btnPlay.addEventListener("click", togglePause);
  btnReplay.addEventListener("click", replay);
  btnPrev.addEventListener("click", () => {
    if (state.mode === "idle") return;
    playIndex(Math.max(0, state.index - 1), { exploreOneGroup: state.mode === "explore" });
  });
  btnNext.addEventListener("click", () => {
    if (state.mode === "idle") {
      startStory();
      return;
    }
    if (state.index + 1 >= storyIds.length) {
      finishStory();
      return;
    }
    playIndex(state.index + 1, { exploreOneGroup: false });
    if (state.mode === "explore") state.mode = "explore";
  });

  btnBack.addEventListener("click", () => {
    stopAudio();
    state.mode = "explore";
    showView("scenes-grid");
    setCaption("再点一个看看吧。");
  });

  $$(".chapters button").forEach((btn) => {
    btn.addEventListener("click", () => jumpChapter(btn.dataset.chapter));
  });

  $$(".scene-card").forEach((card) => {
    card.addEventListener("click", () => {
      if (app.dataset.view === "scene" && app.dataset.scene === card.dataset.scene) return;
      state.mode = "explore";
      playGroup("scene-" + card.dataset.scene);
    });
  });

  $$(".chip[data-step]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = "explore";
      const map = { "0": "principle-intro", "1": "principle-1a", "2": "principle-2a", "3": "principle-3a", comm: "commutator" };
      const id = map[chip.dataset.step];
      if (id) playIndex(storyIds.indexOf(id), { exploreOneGroup: true });
    });
  });

  $$(".chip[data-explode]").forEach((chip) => {
    chip.addEventListener("click", () => {
      state.mode = "explore";
      const map = {
        "0": "explode-intro",
        shell: "explode-shell",
        magnets: "explode-magnets",
        coil: "explode-coil",
        shaft: "explode-shaft",
        together: "reassemble",
      };
      const id = map[chip.dataset.explode];
      if (id) playIndex(storyIds.indexOf(id), { exploreOneGroup: true });
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      togglePause();
    } else if (e.key === "ArrowRight") {
      btnNext.click();
    } else if (e.key === "ArrowLeft") {
      btnPrev.click();
    } else if (e.key === "m" || e.key === "M") {
      setMuted(!state.muted);
    } else if (e.key === "Escape" && app.dataset.view === "scene") {
      btnBack.click();
    }
  });

  // landing
  showView("cover");
  setCaption("");
  setMuted(state.muted);
  updatePlayButton();
  setProgress();

  if (!segments.length) {
    btnStory.textContent = "配音还没准备好";
    return;
  }

  const watch = setTimeout(markReady, 2500);
  preload().then(() => {
    clearTimeout(watch);
    markReady();
  });
})();
