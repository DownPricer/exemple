/** Envoi formulaire contact — partagé accueil et page VTC */
(function () {
  function showFieldError(form, name, message) {
    var el = form.querySelector('[data-error-for="' + name + '"]');
    var input = form.querySelector('[name="' + name + '"]');
    if (el) el.textContent = message || "";
    if (input && input.type !== "radio" && input.type !== "checkbox") {
      input.classList.toggle("is-invalid", Boolean(message));
    }
  }

  function clearFormStatus(statusEl) {
    if (!statusEl) return;
    statusEl.className = "form-status";
    statusEl.textContent = "";
  }

  /**
   * @param {object} opts
   * @param {HTMLFormElement} opts.form
   * @param {object} opts.payload
   * @param {HTMLElement|null} opts.statusEl
   * @param {HTMLButtonElement|null} opts.submitBtn
   * @param {object} opts.labels
   */
  async function postContact(opts) {
    var form = opts.form;
    var payload = opts.payload;
    var statusEl = opts.statusEl;
    var submitBtn = opts.submitBtn;
    var labels = opts.labels || {};
    var submitLabel = labels.submit || "Envoyer ma demande";
    var sendingLabel = labels.sending || "Envoi en cours…";
    var successText =
      labels.success ||
      "Bien reçu. On vous recontacte rapidement.";
    var errorFields = labels.errorFields || "Vérifiez les champs en rouge.";
    var errorSend =
      labels.errorSend ||
      "L’envoi a échoué. Réessayez ou écrivez-nous par e-mail.";
    var errorNetwork =
      labels.errorNetwork ||
      "Connexion impossible. Réessayez ou écrivez-nous par e-mail.";

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = sendingLabel;
    }
    clearFormStatus(statusEl);

    try {
      var res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      var body = await res.json().catch(function () {
        return {};
      });

      if (res.ok && body.ok) {
        if (typeof opts.onSuccess === "function") {
          opts.onSuccess();
        } else {
          form.reset();
        }
        if (statusEl) {
          statusEl.className = "form-status form-status--success";
          statusEl.textContent = successText;
        }
        return { ok: true };
      }

      if (body.errors) {
        Object.keys(body.errors).forEach(function (key) {
          if (key !== "_spam") showFieldError(form, key, body.errors[key]);
        });
        if (statusEl) {
          statusEl.className = "form-status form-status--error";
          statusEl.textContent = body.error || errorFields;
        }
        return { ok: false, errors: body.errors };
      }

      if (statusEl) {
        statusEl.className = "form-status form-status--error";
        statusEl.textContent = body.error || errorSend;
      }
      return { ok: false };
    } catch (err) {
      if (statusEl) {
        statusEl.className = "form-status form-status--error";
        statusEl.textContent = errorNetwork;
      }
      return { ok: false };
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }
    }
  }

  window.SiteReadyContact = {
    showFieldError: showFieldError,
    postContact: postContact,
  };
})();
