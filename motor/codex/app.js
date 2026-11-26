(() => {
  "use strict";
  const chapters = [
    {
      kicker: "给兜兜和融融",
      title: ["小马达，", "转起来！"],
      description: ["玩具会跑，风扇会吹风。", "有个小家伙，藏在里面转呀转！"],
      heading: "马达躲在哪里？",
      hint: "点一点，找一找",
      pages: [
        { id: "car", name: "电动玩具车", image: "透过玩具车上的小窗，可以看到转动的马达和滚动的车轮。" },
        { id: "fan", name: "电风扇", image: "扇叶绕着中间的小马达转动。" },
        { id: "washer", name: "洗衣机", image: "马达藏在洗衣机右下角，圆桶里的衣服翻来翻去。" },
        { id: "brush", name: "电动牙刷", image: "小马达藏在牙刷握柄里，牙刷头来回摆动。" },
        { id: "drone", name: "遥控飞机", image: "遥控飞机的旋翼下各藏着一个转动的小马达。" },
        { id: "dryer", name: "吹风机", image: "吹风机里的小马达转动，前方画着吹出来的风。" }
      ]
    },
    {
      kicker: "马达的秘密",
      title: ["它怎么", "转起来？"],
      description: ["给小马达接上电池。", "看，里面发生了什么？"],
      heading: "跟着马达转三步",
      hint: "点一步，边看边听",
      pages: [
        { id: "power", name: "线圈变磁铁", image: "开关从断开到接通。通电后，线圈亮出南极和北极，小铁片被吸到线圈上。" },
        { id: "push", name: "磁铁推和拉", image: "两块磁铁固定在外壳上，同极会推开，异极会拉近。两边的磁力把中间的线圈和转轴拧着转。" },
        { id: "shaft", name: "半圈换一换", image: "电流保持原向时，线圈转到正对的位置就停住。接上换向器后，每半圈电刷换一块金属片，线圈里的电流掉头，南北极互换，接着往同一个方向转。" }
      ]
    },
    {
      kicker: "马达里面有什么？",
      title: ["拆开看，", "再合上！"],
      description: ["像打开一个小盒子。", "来找找里面的四样零件！"],
      heading: "跟零件打个招呼",
      hint: "可以一遍遍看",
      pages: [
        { id: "open", name: "拆开再合上", image: "外壳、磁铁、线圈和转轴依次排开，带有中文标签，最后再合起来。" },
        { id: "inspect", name: "停在拆开", image: "从左往右能看到外壳、磁铁、线圈和转轴，每个零件都标了名字。" }
      ]
    }
  ];

  const el = id => document.getElementById(id);
  const voice = el("voice");
  const stage = el("stage");
  const cards = el("cards");
  const captions = el("captions");
  const nav = [...document.querySelectorAll(".chapter")];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const story = chapters.flatMap((chapter, i) =>
    chapter.pages.slice(0, i === 2 ? 1 : undefined).map((_, j) => [i, j]));
  let chapterIndex = -1;
  let pageIndex = -1;
  let storyIndex = -1;
  let generation = 0;
  let readyToFinish = false;
  let animationStarted = performance.now();
  let activeCaption = -2;
  let currentPage;
  let cues = [];

  function setLines(node, lines, accent = false) {
    const finalLine = accent ? document.createElement("em") : document.createTextNode(lines[1]);
    if (accent) finalLine.textContent = lines[1];
    node.replaceChildren(lines[0], document.createElement("br"), finalLine);
  }

  function drawCards(chapter) {
    cards.className = "cards " + ["scenes", "steps", "parts"][chapterIndex];
    cards.replaceChildren(...chapter.pages.map((page, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "card";
      const icon = document.createElement(chapterIndex === 0 ? "canvas" : "span");
      icon.setAttribute("aria-hidden", "true");
      if (chapterIndex === 0) {
        icon.width = 142;
        icon.height = 102;
        motorArt.thumbnail(icon, i);
      } else {
        icon.className = "step-marker";
        icon.textContent = chapterIndex === 1 ? String(i + 1) : ["↔", "⊙"][i];
      }
      button.append(icon, page.name);
      button.addEventListener("click", () => manual(chapterIndex, i));
      return button;
    }));
  }

  function updateCaption(index) {
    if (index === activeCaption) return;
    activeCaption = index;
    [...captions.children].forEach((cue, i) => {
      cue.classList.toggle("active", i === index);
      if (i === index) cue.setAttribute("aria-current", "true");
      else cue.removeAttribute("aria-current");
    });
  }

  function show(chapterNumber, index, shouldPlay) {
    const chapter = chapters[chapterNumber];
    const changedChapter = chapterNumber !== chapterIndex;
    chapterIndex = chapterNumber;
    pageIndex = index;
    currentPage = chapter.pages[index];
    cues = window.motorCues[currentPage.id];
    animationStarted = performance.now();

    if (changedChapter) {
      el("picture").dataset.chapter = chapterNumber;
      el("eyebrow").textContent = chapter.kicker;
      setLines(el("title"), chapter.title, true);
      setLines(el("description"), chapter.description);
      el("picker-title").textContent = chapter.heading;
      el("picker-hint").textContent = chapter.hint;
      nav.forEach((button, i) => {
        if (i === chapterNumber) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      drawCards(chapter);
    }

    [...cards.children].forEach((button, i) => button.setAttribute("aria-pressed", String(index === i)));
    stage.setAttribute("aria-label", currentPage.image);
    el("stage-tag").textContent = currentPage.name;
    el("stage-index").textContent = chapterNumber === 0 ? `${String(index + 1).padStart(2, "0")} / 06` : "";
    captions.replaceChildren(...cues.map(cue => {
      const span = document.createElement("span");
      span.className = "cue";
      span.textContent = cue.text;
      return span;
    }));
    activeCaption = -2;
    updateCaption(chapterNumber === 1 ? 0 : -1);
    el("message").textContent = "";
    if (shouldPlay) play();
  }

  function updateStoryButton() {
    const running = storyIndex >= 0;
    el("story").setAttribute("aria-pressed", String(running));
    el("story-icon").textContent = running ? "■" : "▶";
    el("story-label").textContent = running ? "停止讲解" : "自动讲解";
  }

  function updateListenButton(playing) {
    el("listen-label").textContent = playing || voice.currentTime > 0 ? "再听一遍" : "听一听";
    el("listen-icon").textContent = playing || voice.currentTime > 0 ? "↻" : "▶";
  }

  function manual(chapterNumber, index) {
    storyIndex = -1;
    updateStoryButton();
    show(chapterNumber, index, true);
  }

  function play() {
    const token = ++generation;
    readyToFinish = false;
    voice.pause();
    if (voice.dataset.track !== currentPage.id) {
      voice.dataset.track = currentPage.id;
      voice.src = `assets/audio/${currentPage.id}.mp3`;
    }
    voice.currentTime = 0;
    animationStarted = performance.now();
    el("message").textContent = "";
    voice.play().then(() => {
      if (token !== generation) return;
      readyToFinish = true;
      updateListenButton(true);
    }).catch(error => {
      if (token !== generation || error.name === "AbortError") return;
      storyIndex = -1;
      updateStoryButton();
      updateListenButton(false);
      el("message").textContent = "配音暂时没播出来。请再点一次「听一听」。";
    });
  }

  voice.addEventListener("ended", () => {
    if (!readyToFinish || !voice.ended) return;
    readyToFinish = false;
    updateCaption(-1);
    updateListenButton(false);
    if (storyIndex < 0) return;
    storyIndex += 1;
    if (story[storyIndex]) {
      show(...story[storyIndex], true);
    } else {
      storyIndex = -1;
      updateStoryButton();
      el("message").textContent = "绘本讲完啦！可以再听一遍。";
    }
  });

  nav.forEach((button, i) => button.addEventListener("click", () => manual(i, 0)));
  el("listen").addEventListener("click", play);
  el("sound").addEventListener("click", () => {
    voice.muted = !voice.muted;
    el("sound").setAttribute("aria-pressed", String(voice.muted));
    el("sound-label").textContent = voice.muted ? "已静音" : "声音开";
    el("sound-icon").textContent = voice.muted ? "×" : "♪";
  });

  el("story").addEventListener("click", () => {
    if (storyIndex >= 0) {
      generation += 1;
      storyIndex = -1;
      voice.pause();
      updateListenButton(false);
    } else {
      storyIndex = 0;
      show(...story[0], true);
    }
    updateStoryButton();
  });

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    stage.width = Math.max(1, Math.round(stage.clientWidth * ratio));
    stage.height = Math.max(1, Math.round(stage.clientHeight * ratio));
  }

  function smooth(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }

  function separatedAt(time) {
    if (chapterIndex !== 2) return 0;
    if (pageIndex === 1) return 1;
    const closeAt = cues[2].start;
    if (reduceMotion.matches) return Number(time >= .35 && time < closeAt);
    return smooth((time - .35) / 1.15) * (1 - smooth((time - closeAt) / 1.2));
  }

  function frame(now) {
    const elapsed = reduceMotion.matches ? 0 : (now - animationStarted) / 1000;
    const narratedTime = voice.dataset.track === currentPage.id ? voice.currentTime : 0;
    const speaking = !voice.ended && narratedTime > 0;
    const captionIndex = cues.findIndex(cue => narratedTime >= cue.start && narratedTime < cue.end);
    const beatIndex = captionIndex >= 0 ? captionIndex : cues.length - 1;
    const beat = cues[beatIndex];
    updateCaption(chapterIndex === 1 ? beatIndex : speaking ? captionIndex : -1);
    motorArt.stage(stage, chapterIndex, pageIndex, elapsed, separatedAt(narratedTime), {
      index: beatIndex,
      time: narratedTime - beat.start,
      duration: beat.end - beat.start,
      moving: !reduceMotion.matches
    });
    requestAnimationFrame(frame);
  }

  voice.dataset.track = "car";
  show(0, 0, false);
  resize();
  new ResizeObserver(resize).observe(stage);
  requestAnimationFrame(frame);
})();
