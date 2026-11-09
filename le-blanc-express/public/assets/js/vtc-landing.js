(function () {
  function $(id) {
    return document.getElementById(id);
  }

  var boot = window.__VTC_LANDING__ || {};
  var PRICE =
    typeof boot.subscriptionEur === "number" && !Number.isNaN(boot.subscriptionEur)
      ? boot.subscriptionEur
      : 200;

  var km = $("km");
  var mv = $("meterVal");
  var kl = $("kmLbl");
  var ko = $("kmOut");
  var road = $("rdOn");
  var shown = 0;
  var target = 0;
  var raf = null;

  function priceFor(k) {
    return Math.round(12 + 2.1 * k);
  }

  function paint() {
    mv.innerHTML = Math.round(shown) + "<small>€</small>";
  }

  function tick() {
    var d = target - shown;
    if (Math.abs(d) < 0.6) {
      shown = target;
      paint();
      raf = null;
      return;
    }
    shown += d * 0.22;
    paint();
    raf = requestAnimationFrame(tick);
  }

  function setKm() {
    var k = +km.value;
    kl.textContent = k + " km";
    ko.textContent = k + " km";
    target = priceFor(k);
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      shown = target;
      paint();
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
    try {
      road.style.strokeDasharray = "6 8";
      road.style.opacity = (0.35 + 0.65 * (k - 3) / 117).toFixed(2);
    } catch (e) {
      /* SVG optionnel */
    }
  }

  if (km && mv) {
    km.addEventListener("input", setKm);
    setKm();
  }

  var lost = $("lost");
  var basket = $("basket");

  function fmt(n) {
    return Math.round(n).toLocaleString("fr-FR") + " €";
  }

  function roi() {
    var l = +lost.value;
    var b = +basket.value;
    $("lostLbl").textContent = l;
    $("basketLbl").textContent = b + " €";
    $("lostMonth").textContent = fmt(l * b * 4);
    var subEl = $("subPrice");
    var subRow = $("subPriceRow");
    if (subEl && boot.showSubscriptionInRoi) {
      subEl.textContent = fmt(PRICE);
      if (subRow) subRow.hidden = false;
    } else if (subRow) {
      subRow.hidden = true;
    }
    var breakEl = $("breakEven");
    var breakRow = $("breakEvenRow");
    if (breakEl && boot.showSubscriptionInRoi) {
      breakEl.textContent = Math.ceil(PRICE / b);
      if (breakRow) breakRow.hidden = false;
    } else if (breakRow) {
      breakRow.hidden = true;
    }
  }

  if (lost && basket) {
    lost.addEventListener("input", roi);
    basket.addEventListener("input", roi);
    roi();
  }
})();
