(function () {
  function $(id) {
    return document.getElementById(id);
  }

  var P = ["07", "43", "60", "63", "44"];
  var bar = $("callbar");
  var numEl = $("callNum");
  var btn = $("callBtn");
  if (!bar || !numEl || !btn) return;

  function number() {
    return P.join("");
  }

  function pretty() {
    return P.join(" ");
  }

  var revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    numEl.textContent = pretty();
    ["pointerdown", "mousemove", "keydown", "scroll", "touchstart"].forEach(function (ev) {
      window.removeEventListener(ev, reveal);
    });
  }

  ["pointerdown", "mousemove", "keydown", "scroll", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, reveal, { passive: true });
  });

  btn.addEventListener("click", function () {
    reveal();
    try {
      window.location.href = "tel:+33" + number().slice(1);
    } catch (e) {
      /* ignore */
    }
  });

  function setBodyPad(on) {
    document.body.classList.toggle("callbar-shd-active", on);
  }

  var closed = false;
  try {
    closed = sessionStorage.getItem("callbar-closed") === "1";
  } catch (e) {
    closed = false;
  }

  if (closed) {
    bar.hidden = true;
    setBodyPad(false);
  } else {
    setBodyPad(true);
  }

  var closeBtn = $("callClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      bar.hidden = true;
      setBodyPad(false);
      try {
        sessionStorage.setItem("callbar-closed", "1");
      } catch (e) {
        /* ignore */
      }
    });
  }
})();
