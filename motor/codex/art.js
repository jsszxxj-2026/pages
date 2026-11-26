(() => {
  "use strict";
  const ink = "#202e4c", white = "#fff9e9", sky = "#a2c9f4";
  const blue = "#385ccf", red = "#f17b61", gold = "#ffcc59";
  const mint = "#7ed6bc", purple = "#c3aeff", slate = "#7085ad";
  const tau = Math.PI * 2;
  let ctx;

  function paint(fill, stroke, width) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function drawing(x, y, angle, scale, draw) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    draw();
    ctx.restore();
  }

  function rect(x, y, w, h, r, fill, stroke = ink, width = 3) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    paint(fill, stroke, width);
  }

  function circle(x, y, r, fill, stroke = ink, width = 3) {
    oval(x, y, r, r, fill, stroke, width);
  }

  function oval(x, y, rx, ry, fill, stroke = null, width = 3) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, tau);
    paint(fill, stroke, width);
  }

  function path(commands, fill = null, stroke = ink, width = 3) {
    ctx.beginPath();
    for (const [command, ...points] of commands) ctx[command](...points);
    paint(fill, stroke, width);
  }

  function line(points, color = ink, width = 3) {
    path(points.map(([x, y], i) => [i ? "lineTo" : "moveTo", x, y]), null, color, width);
  }

  function polygon(points, fill, stroke = ink, width = 3) {
    path([...points.map(([x, y], i) => [i ? "lineTo" : "moveTo", x, y]), ["closePath"]], fill, stroke, width);
  }

  function arc(x, y, r, start, end, color, width = 4) {
    ctx.beginPath();
    ctx.arc(x, y, r, start, end);
    paint(null, color, width);
  }

  function label(value, x, y, size = 24, color = ink) {
    ctx.font = `800 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function spark(x, y, size, color = gold) {
    polygon([[x, y-size], [x+size*.25, y-size*.24], [x+size, y], [x+size*.25, y+size*.24],
      [x, y+size], [x-size*.25, y+size*.24], [x-size, y], [x-size*.25, y-size*.24]], color, null);
  }

  function arrow(x, y, angle, color) {
    drawing(x, y, angle, 1, () => polygon([[0, 0], [-15, -7], [-15, 7]], color, null));
  }

  function wheel(x, y, radius, time) {
    circle(x, y, radius, ink, ink, 4);
    circle(x, y, radius * .64, slate, white, 3);
    drawing(x, y, time, radius / 33, () => {
      line([[-18, 0], [18, 0]], ink, 4);
      line([[0, -18], [0, 18]], ink, 4);
    });
    circle(x, y, radius * .18, gold);
  }

  function motor(x, y, time, scale = 1, angle = 0) {
    drawing(x, y, angle, scale, () => {
      rect(26, -5, 36, 10, 4, white);
      rect(-44, -24, 72, 48, 10, "#a5bde9");
      oval(26, 0, 13, 24, "#dbe7ff", ink);
      rect(-42, -18, 57, 36, 8, "#293858");
      for (let i = 0; i < 4; i++) {
        const phase = time * 4 + i * 1.55;
        const height = Math.sin(phase) * 14;
        if (Math.cos(phase) > -.3) line([[-34, height], [9, height]], i % 2 ? gold : red, 5);
      }
      oval(29, 0, 3, 6, blue);
      rect(-52, -15, 10, 7, 2, red, ink, 2);
      rect(-52, 8, 10, 7, 2, gold, ink, 2);
    });
  }

  function car(time, preview) {
    oval(0, 101, 216, 13, "#a8c5ee");
    path([["moveTo", -202, 38], ["quadraticCurveTo", -197, 10, -155, 1],
      ["lineTo", -114, -13], ["lineTo", -72, -66], ["quadraticCurveTo", -61, -80, -39, -80],
      ["lineTo", 57, -80], ["quadraticCurveTo", 78, -80, 96, -61], ["lineTo", 146, -13],
      ["lineTo", 186, -1], ["quadraticCurveTo", 206, 7, 206, 33], ["lineTo", 206, 58],
      ["quadraticCurveTo", 206, 74, 190, 74], ["lineTo", -181, 74],
      ["quadraticCurveTo", -207, 74, -205, 49], ["closePath"]], red, ink, 5);
    polygon([[-101,-13], [-61,-61], [-12,-61], [-12,-13]], "#e0f5ff", ink, 4);
    polygon([[3,-61], [57,-61], [81,-48], [117,-13], [3,-13]], sky, ink, 4);
    line([[-195, 55], [194, 55]], "#b44941", 5);
    rect(-203, 26, 28, 15, 5, "#ffc1a3");
    rect(179, 23, 28, 17, 5, gold);
    rect(-77, 4, 157, 57, 16, white, ink, 4);
    motor(0, 32, time, .83);
    wheel(-128, 70, 34, time * 3);
    wheel(129, 70, 34, time * 3);
    if (!preview) {
      line([[-246, 27], [-219, 27]], blue, 4);
      line([[-258, 52], [-224, 52]], blue, 4);
    }
  }

  function fan(time) {
    oval(0, 152, 149, 13, "#a8c5ee");
    rect(-17, 9, 34, 124, 14, blue, ink, 4);
    rect(-92, 118, 184, 28, 14, blue, ink, 4);
    rect(-42, 122, 28, 12, 5, gold, ink, 2);
    circle(0, -37, 105, white, ink, 4);
    circle(0, -37, 92, "#d9eeff", blue, 3);
    drawing(0, -37, time * 3.6, 1, () => {
      for (let n = 0; n < 3; n++) drawing(0, 0, n * tau / 3, 1, () => {
        path([["moveTo", 0, 0], ["quadraticCurveTo", 5, -88, 55, -68],
          ["quadraticCurveTo", 82, -58, 57, -28], ["quadraticCurveTo", 25, -15, 0, 0]], mint);
      });
    });
    circle(0, -37, 35, white, ink, 3);
    motor(0, -37, time, .54);
  }

  function washer(time) {
    oval(0, 142, 142, 13, "#a8c5ee");
    rect(-105, 112, 38, 26, 5, ink);
    rect(67, 112, 38, 26, 5, ink);
    rect(-119, -133, 238, 257, 21, white, ink, 5);
    rect(-119, -133, 238, 46, [21, 21, 0, 0], purple, ink, 4);
    rect(-98, -119, 65, 17, 5, "#263957");
    circle(86, -110, 10, gold);
    circle(-3, 8, 76, slate, ink, 4);
    circle(-3, 8, 62, "#c4e8fc", ink, 3);
    drawing(-3, 8, time * 2.1, 1, () => {
      rect(-36, -35, 59, 32, 10, red, ink, 2);
      rect(-11, 4, 49, 36, 12, mint, ink, 2);
      rect(-38, 4, 27, 35, 10, gold, ink, 2);
    });
    rect(30, 73, 77, 40, 10, "#edaeec", ink, 3);
    motor(65, 93, time, .56);
  }

  function brush(time) {
    oval(0, 110, 204, 12, "#a8c5ee");
    drawing(0, 0, -.32, 1, () => {
      rect(-16, -12, 174, 24, 11, white, ink, 4);
      drawing(157, 0, Math.sin(time * 16) * .13, 1, () => {
        rect(-10, -38, 66, 36, 12, white, ink, 4);
        for (let i = 0; i < 5; i++) rect(-4 + 11 * i, -56, 9, 23, 4, i % 2 ? mint : sky, ink, 1.5);
      });
      rect(-199, -34, 216, 68, 30, mint, ink, 5);
      rect(-180, -22, 95, 44, 12, white, ink, 3);
      motor(-135, 0, time, .67);
      circle(-27, 0, 14, blue, ink, 3);
    });
  }

  function drone(time) {
    oval(0, 112, 149, 13, "#a8c5ee");
    line([[-65, 14], [-184, -26]], blue, 21);
    line([[65, 14], [184, -26]], blue, 21);
    line([[-52, 47], [-73, 83], [-97, 83]], ink, 8);
    line([[52, 47], [73, 83], [97, 83]], ink, 8);
    for (const x of [-155, 155]) {
      const width = 39 + Math.abs(Math.cos(time * 8)) * 47;
      oval(x, -52, width, 6, "#779cdb", ink, 2.5);
      rect(x - 24, -48, 48, 42, 10, gold, ink, 4);
      motor(x, -27, time, .47);
    }
    rect(-88, -12, 176, 70, 30, purple, ink, 4);
    rect(-42, -4, 84, 22, 9, "#283b66", ink, 2);
    circle(0, 51, 22, blue, ink, 4);
    circle(0, 51, 9, sky, ink, 2);
  }

  function dryer(time) {
    oval(0, 145, 172, 12, "#a8c5ee");
    polygon([[-11, -5], [70, -5], [52, 129], [5, 129], [-13, 112]], red, ink, 5);
    rect(44, 43, 23, 33, 7, gold, ink, 3);
    path([["moveTo", 28, 131], ["quadraticCurveTo", 36, 168, 69, 150]], null, ink, 6);
    polygon([[-162,-54], [-63,-70], [-63,4], [-162,-12]], blue, ink, 5);
    rect(-88, -87, 220, 107, 43, red, ink, 5);
    rect(-104, -47, 22, 34, 6, gold, ink, 3);
    rect(-22, -68, 119, 70, 22, white, ink, 4);
    motor(32, -34, time, .93);
    for (let i = 0; i < 3; i++) {
      const shift = Math.sin(time * 4 + i) * 9;
      line([[-222 + shift, -58 + 23 * i], [-182 + shift, -58 + 23 * i]], blue, 4);
    }
  }

  const objects = [car, fan, washer, brush, drone, dryer];
  const windowPoints = [[0, 32], [0, -37], [65, 93], [-127, 42], [155, -27], [32, -34]];

  function scene(index, time, preview) {
    objects[index](time, preview);
    if (preview) return;
    const [x, y] = windowPoints[index];
    const guides = [
      [[38, 10], [111, -102], [175, -102]],
      [[24, -54], [122, -110], [177, -110]],
      [[94, 83], [133, 38], [178, 38]],
      [[-152, 20], [-184, -53], [-212, -53]],
      [[175, -18], [205, 28], [241, 28]],
      [[60, -64], [98, -112], [160, -112]]
    ];
    const coords = guides[index];
    ctx.setLineDash([5, 6]);
    line(coords, blue, 3);
    ctx.setLineDash([]);
    circle(coords[0][0], coords[0][1], 5, gold, blue, 2);
    const [endX, endY] = coords[2];
    const tagX = endX + (endX < x ? -39 : 39);
    rect(tagX - 40, endY - 21, 80, 42, 15, gold, ink, 2.5);
    label("马达", tagX, endY + 1, 24);
    spark(-231, -102, 17);
    spark(229, 111, 14, "#fffdf5");
    spark(-192, 120, 9, "#fffdf5");
  }

  function pole(x, y, color, text, flip = 1) {
    drawing(x, y, 0, 1, () => {
      ctx.scale(flip, 1);
      path([["moveTo", -25,-87], ["quadraticCurveTo", -79, -55, -79, 0],
        ["quadraticCurveTo", -79, 56, -25, 87], ["lineTo", -5, 59],
        ["quadraticCurveTo", -39, 33, -39, 0], ["quadraticCurveTo", -39, -32, -5, -59], ["closePath"]], color, ink, 4);
      ctx.scale(flip, 1);
      if (text) label(text, -57 * flip, 1, 25, text === "N" ? ink : "#fff");
    });
  }

  function tag(text, x, y, width, fill = white) {
    rect(x - width / 2, y - 21, width, 42, 15, fill, ink, 2.5);
    label(text, x, y, 24);
  }

  function coil(reversed, powered = true) {
    const north = reversed ? -1 : 1;
    rect(-67, -19, 134, 38, 10, powered ? (north === 1 ? blue : red) : slate, ink, 3);
    if (powered) {
      rect(0, -19, 67, 38, [0, 10, 10, 0], north === 1 ? red : blue, ink, 3);
    }
    for (const x of [-21, -10, 1, 12]) {
      rect(x - 5, -23, 14, 46, 6, null, x % 2 ? "#bf5134" : gold, 4);
    }
  }

  function poleLabel(x, y, north, size = 22) {
    label(north ? "北" : "南", x, y, size, north ? ink : "#fff");
  }

  function electromagnet(cue, time, moving) {
    const powered = cue >= 2;
    line([[-188, -46], [-188, -96], [-128, -96]], ink, 5);
    line([[-65, -96], [181, -96], [181, 4], [138, 4]], ink, 5);
    line([[4, 4], [-15, 4], [-15, 110], [-188, 110], [-188, 80]], ink, 5);
    line([[-128, -96], [-65, powered ? -96 : -121]], powered ? "#ad5039" : ink, 6);
    circle(-128, -96, 6, gold, ink, 2);
    circle(-65, -96, 6, gold, ink, 2);
    rect(-229, -48, 82, 132, 13, gold, ink, 4);
    rect(-205, -56, 34, 8, 3, white, ink, 3);
    label("＋", -188, -24, 29);
    label("－", -188, 63, 29);
    label("电池", -188, 19, 24);
    if (powered) {
      for (let i = 0; i < 6; i++) {
        const phase = ((moving ? time * .65 : 0) + i / 6) % 1;
        circle(-49 + phase * 220, -96, 4, "#ffe297", null);
        circle(-20 - phase * 160, 110, 4, "#ffe297", null);
      }
    }
    drawing(71, 4, 0, 1, () => {
      coil(false, powered);
      if (powered) {
        poleLabel(-44, 0, false);
        poleLabel(44, 0, true);
      }
    });
    const ironY = powered ? -57 + 29 * (moving ? Math.min(1, time * 2.5) : 1) : -57;
    rect(104, ironY - 5, 24, 10, 3, "#c1c9da", ink, 2);
    label("小铁片", 228, -49, 24);
    line([[187, -49], [155, -49], [132, ironY]], "#54708b", 2);
    tag(powered ? "通电 · 吸住啦" : "断电 · 没吸住", 71, 69, 208, powered ? gold : white);
    if (cue === 3) tag("电磁铁", 71, 141, 120, mint);
  }

  function rotor(angle, reversed, powered = true) {
    circle(0, 0, 117, "#f7fdf6", ink, 4);
    pole(-32, 0, red, "");
    pole(32, 0, blue, "", -1);
    poleLabel(-92, 0, true, 25);
    poleLabel(92, 0, false, 25);
    drawing(0, 0, angle, 1, () => coil(reversed, powered));
    const north = reversed ? -1 : 1;
    circle(0, 0, 12, white, ink, 3.5);
    // Keep the characters upright as the colored poles turn.
    if (powered) {
      for (const side of [-1, 1]) {
        poleLabel(side * 46 * Math.cos(angle), side * 46 * Math.sin(angle), side === north);
      }
    }
  }

  function vector(x, y, length, color) {
    line([[x, y], [x + length, y]], color, 5);
    arrow(x + length, y, length < 0 ? Math.PI : 0, color);
  }

  function turningArrow(x, y, radius, color) {
    arc(x, y, radius, -1.58, -.54, color, 5);
    arrow(x + Math.cos(-.54) * radius, y + Math.sin(-.54) * radius, Math.PI / 2 - .54, color);
  }

  function forces(angle, pulling) {
    const color = pulling ? "#2453b6" : "#a33e32";
    for (const side of [-1, 1]) {
      const x = side * 49 * Math.cos(angle);
      const y = side * 49 * Math.sin(angle) + Math.sign(side * Math.sin(angle)) * 34;
      vector(x, y, (pulling ? 1 : -1) * Math.sign(x) * 35, color);
    }
  }

  function magnets(cue, time, moving) {
    if (cue === 1) {
      for (const [x, title, pulling] of [[-150, "同极推开", false], [150, "异极拉近", true]]) {
        tag(title, x, 97, 172, pulling ? mint : gold);
        const shift = moving ? 13 * Math.min(time / 1.3, 1) : 0;
        for (const side of [-1, 1]) {
          const northOnLeft = side === 1 && !pulling;
          const px = x + side * (66 + (pulling ? -shift : shift));
          rect(px - 43, -49, 86, 69, 12, northOnLeft ? red : blue, ink, 3);
          rect(px, -49, 43, 69, [0, 12, 12, 0], northOnLeft ? blue : red, ink, 3);
          poleLabel(px - 21, -14, northOnLeft, 25);
          poleLabel(px + 21, -14, !northOnLeft, 25);
          vector(px, 47, side * (pulling ? -29 : 29), pulling ? "#2453b6" : "#a33e32");
        }
      }
      return;
    }
    const angle = cue === 2 && moving ? -.93 + .68 * Math.min(time / 2, 1) : -.93;
    rotor(angle, false);
    if (cue === 2) {
      forces(angle, true);
      turningArrow(0, 0, 145, blue);
      tag("推拉一起，轴跟着转", 0, 158, 273, gold);
    } else {
      tag("固定磁铁", -217, 0, 130);
      tag("固定磁铁", 217, 0, 130);
      line([[-151, 0], [-119, 0]], ink, 3);
      line([[119, 0], [151, 0]], ink, 3);
      tag("转轴", 0, 151, 97);
    }
  }

  function contacts(angle, live, reversed) {
    const copper = "#ffc46f", bronze = "#ad5e39";
    drawing(0, 0, angle, 1, () => {
      arc(0, 0, 49, .08, Math.PI - .08, copper, 17);
      arc(0, 0, 49, Math.PI + .08, tau - .08, bronze, 17);
      circle(0, 0, 15, white, ink, 3);
    });
    for (const side of [-1, 1]) {
      const color = (side === 1) === (Math.sin(angle) >= 0) ? bronze : copper;
      line([[side * 98, 0], [side * 73, 0]], ink, 5);
      rect(side * 63 - 11, -8, 22, 16, 4, live ? color : slate, ink, 3);
    }
    label("＋", -103, -2, 23);
    label("－", 103, -2, 23);
    label("线圈里的电流", 0, 78, 23);
    if (live) vector(reversed ? 30 : -30, 103, reversed ? -60 : 60, blue);
    else label("换接中", 0, 106, 22);
  }

  function commutation(cue, time, duration, moving) {
    const progress = moving ? Math.min(1, time / duration) : cue === 4 ? .12 : .55;
    if (cue === 0) {
      rotor(moving ? -.94 * (1 - Math.min(progress * 3, 1)) ** 2 : 0, false);
      tag("电流不换：转到正对就停", 0, 149, 340);
      return;
    }
    // Each crossing of a horizontal split changes the brush-to-segment pairing.
    const angles = [-.64, .58, Math.PI + .58, tau + .3, 3 * Math.PI + .58];
    const angle = cue === 5
      ? angles[4] + (moving ? time * 1.8 : 0)
      : angles[cue - 1] + (angles[cue] - angles[cue - 1]) * progress;
    const reversed = Math.floor(angle / Math.PI) % 2 === 0;
    const live = Math.abs(Math.sin(angle)) > .12;
    drawing(-152, -4, 0, 1, () => {
      rotor(angle, reversed, live);
      turningArrow(0, 0, 132, blue);
      if (cue === 4 && live) forces(angle, Math.sin(2 * angle) < 0);
    });
    if (cue === 4 && live) {
      tag(Math.sin(2 * angle) < 0 ? "拉近" : "推开", -152, 146, 102, gold);
    }
    drawing(153, -20, 0, 1, () => {
      rect(-132, -100, 264, 240, 22, "#f7fdf6", "#8cb7aa", 3);
      label("电刷", -81, -74, 24);
      label("两块金属片", 52, -74, 23);
      line([[-76, -55], [-63, -17]], "#54708b", 2);
      line([[42, -55], [31, -43]], "#54708b", 2);
      contacts(angle, live, reversed);
    });
    tag("换向器", 153, 149, 129, gold);
  }

  function principle(index, cue, time, duration, moving) {
    if (index === 0) electromagnet(cue, time, moving);
    if (index === 1) magnets(cue, time, moving);
    if (index === 2) commutation(cue, time, duration, moving);
  }

  function shell(x, y) {
    rect(x - 63, y - 51, 109, 102, 15, "#9eafd6", ink, 4);
    oval(x + 45, y, 20, 51, "#cbd8f2", ink, 4);
    oval(x + 46, y, 13, 37, "#39476b", ink, 3);
    line([[x - 51, y - 37], [x + 16, y - 37]], "#ecf1ff", 5);
    rect(x - 71, y - 16, 12, 9, 2, gold, ink, 2);
    rect(x - 71, y + 8, 12, 9, 2, red, ink, 2);
  }

  function exploded(amount, time) {
    const spread = Math.max(0, Math.min(1, amount));
    const positions = [-231, -82, 78, 221];
    const [housing, magnet, rotor, shaft] = positions.map(x => x * spread);
    oval(0, 111, 99 + 176 * spread, 14, "#d1c0ed");
    ctx.setLineDash([7, 8]);
    line([[-255 * spread, 0], [270 * spread, 0]], "#8472bc", 3);
    ctx.setLineDash([]);

    drawing(shaft, 0, 0, 1, () => {
      rect(-42, -8, 101, 16, 7, "#eef4fc", ink, 4);
      line([[29, -6], [29, 6]], slate, 3);
    });
    drawing(rotor, 0, 0, 1, () => {
      rect(-46, -28, 88, 56, 10, slate, ink, 4);
      for (let i = 0; i < 6; i++) rect(-34 + i * 11, -31, 14, 62, 7, null, i % 2 ? gold : "#d3714d", 5);
      oval(41, 0, 10, 25, slate, ink, 3);
    });
    for (const offset of [-1, 1]) {
      drawing(magnet, offset * 36 * spread, 0, .66, () => {
        drawing(0, 0, -Math.PI / 2 * offset, 1, () => {
          pole(57, 0, offset === 1 ? blue : red, "");
        });
      });
    }
    if (spread > .5) {
      label("N", magnet, -36 * spread, 17);
      label("S", magnet, 36 * spread, 17, "#fff");
    }
    shell(housing, 0);

    ctx.save();
    ctx.globalAlpha = 1 - spread;
    motor(4, 0, time, 1.38);
    ctx.restore();
    if (spread > .15) {
      ctx.save();
      ctx.globalAlpha = spread;
      for (let i = 0; i < positions.length; i++) {
        const x = positions[i] * spread;
        const bottom = i % 2 === 0;
        const y = bottom ? 88 : -105;
        const edge = [49, -52, 35, -12][i];
        line([[x, edge], [x, bottom ? 69 : -86]], "#775eaf", 2.5);
        rect(x - 42, y - 20, 84, 40, 12, white, "#775eaf", 2.5);
        label(["外壳", "磁铁", "线圈", "转轴"][i], x, y, 25);
      }
      ctx.restore();
    }
    spark(-262, -90, 15);
    spark(254, 94, 15, gold);
    spark(302, -101, 9, "#fff");
  }

  function prepare(canvas, width, height) {
    ctx = canvas.getContext("2d");
    ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  window.motorArt = {
    stage(canvas, chapter, index, time, amount, storyBeat) {
      prepare(canvas, 720, 430);
      if (chapter === 0) drawing(353, 229, 0, 1.11, () => scene(index, time, false));
      if (chapter === 1) drawing(360, 223, 0, 1.1, () => principle(index, storyBeat.index, storyBeat.time, storyBeat.duration, storyBeat.moving));
      if (chapter === 2) drawing(360, 224, 0, 1.13, () => exploded(amount, time));
    },
    thumbnail(canvas, index) {
      prepare(canvas, 142, 102);
      const scales = [.27, .27, .27, .24, .23, .23];
      const heights = [49, 49, 49, 42, 43, 42];
      drawing(70, heights[index], 0, scales[index], () => scene(index, 0, true));
    }
  };
})();
