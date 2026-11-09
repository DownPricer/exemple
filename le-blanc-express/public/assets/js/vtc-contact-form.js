(function () {
  var api = window.SiteReadyContact;
  if (!api) return;

  var form = document.getElementById("vtc-contact-form");
  if (!form) return;

  var labels = {
    submit: "Envoyer ma demande",
    sending: "Envoi en cours…",
    success:
      "Bien reçu — votre demande est envoyée. Si vous avez indiqué un e-mail, un accusé de réception vient de vous être envoyé.",
    errorFields: "Vérifiez les champs en rouge.",
    errorSend:
      "L’envoi a échoué. Réessayez dans un instant ou utilisez le bandeau d’appel en bas de page.",
    errorNetwork:
      "Connexion impossible. Réessayez ou utilisez le bandeau d’appel en bas de page.",
  };

  function validateClient() {
    var data = new FormData(form);
    var errors = {};
    var name = String(data.get("name") || "").trim();
    var phone = String(data.get("phone") || "").trim();
    var email = String(data.get("email") || "").trim();

    if (name.length < 2) {
      errors.name = "Indiquez votre nom ou celui de votre entreprise.";
    }

    var telDigits = phone.replace(/[\s.\-]/g, "");
    var telOk = /^(\+33|0033|0)[1-9]\d{8}$/.test(telDigits);
    var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

    if (!phone && !email) {
      errors.phone =
        "Indiquez un téléphone ou un e-mail pour qu'on puisse vous répondre.";
    } else if (phone && !telOk) {
      errors.phone = "Ce numéro n'a pas l'air valide (ex. 06 12 34 56 78).";
    }

    if (email && !mailOk) {
      errors.email = "Cette adresse e-mail n'a pas l'air valide.";
    }

    if (!form.querySelector('[name="consent"]')?.checked) {
      errors.consent = "Cochez la case pour accepter d’être recontacté.";
    }

    ["name", "phone", "email", "consent"].forEach(function (field) {
      api.showFieldError(form, field, errors[field]);
    });

    return Object.keys(errors).length === 0;
  }

  function buildPayload() {
    var data = new FormData(form);
    var sujetEl = form.querySelector('input[name="sujet"]:checked');
    return {
      formVariant: "vtc",
      name: String(data.get("name") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      email: String(data.get("email") || "").trim(),
      sujet: sujetEl ? sujetEl.value : "demo",
      message: String(data.get("message") || "").trim(),
      consent: true,
      company_website: String(data.get("company_website") || "").trim(),
    };
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = document.getElementById("form-status");
    var submitBtn = form.querySelector('[type="submit"]');

    if (!validateClient()) {
      if (status) {
        status.className = "form-status form-status--error";
        status.textContent = labels.errorFields;
      }
      return;
    }

    if (String(new FormData(form).get("company_website") || "").trim()) {
      return;
    }

    api.postContact({
      form: form,
      payload: buildPayload(),
      statusEl: status,
      submitBtn: submitBtn,
      labels: labels,
      onSuccess: function () {
        form.reset();
        var demo = form.querySelector('input[name="sujet"][value="demo"]');
        if (demo) demo.checked = true;
      },
    });
  });

  form.querySelectorAll("input, textarea").forEach(function (field) {
    field.addEventListener("blur", function () {
      validateClient();
    });
  });
})();
