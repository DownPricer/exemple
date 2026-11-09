/** Formulaire contact VTC — mêmes conventions que l’accueil (noms, erreurs, API). */
export function buildVtcContactFormHtml() {
  return `
  <section class="vtc-contact" id="contact" aria-labelledby="h-contact">
    <div class="vtc-contact__grid">
      <div class="vtc-contact__intro">
        <span class="eyebrow">Contact</span>
        <h2 id="h-contact">Une démo ou une question ? Écrivez-nous.</h2>
        <p>Dites-nous ce qui vous intéresse. Nous vous répondons par téléphone ou par SMS, comme vous préférez.</p>
        <ul class="vtc-contact__bullets">
          <li>Démo de 15 minutes avec vos propres tarifs</li>
          <li>Sans engagement pour la démo</li>
          <li>Réponse rapide</li>
        </ul>
      </div>

      <form class="vtc-form" id="vtc-contact-form" novalidate>
        <fieldset class="vtc-form__choices">
          <legend>Je souhaite</legend>
          <label><input type="radio" name="sujet" value="demo" checked><span>Une démo</span></label>
          <label><input type="radio" name="sujet" value="infos"><span>Plus d'informations</span></label>
          <label><input type="radio" name="sujet" value="refonte"><span>Refaire mon site</span></label>
        </fieldset>

        <div class="vtc-form__row">
          <div class="vtc-field">
            <label for="vtc-name">Nom ou entreprise</label>
            <input type="text" id="vtc-name" name="name" autocomplete="name" maxlength="80" required>
            <p class="field-error" data-error-for="name" role="alert"></p>
          </div>
          <div class="vtc-field">
            <label for="vtc-phone">Téléphone</label>
            <input type="tel" id="vtc-phone" name="phone" autocomplete="tel" inputmode="tel" maxlength="20">
            <p class="field-error" data-error-for="phone" role="alert"></p>
          </div>
        </div>

        <div class="vtc-field">
          <label for="vtc-email">E-mail <span class="vtc-opt">(si vous préférez être recontacté ainsi)</span></label>
          <input type="email" id="vtc-email" name="email" autocomplete="email" maxlength="120">
          <p class="field-error" data-error-for="email" role="alert"></p>
        </div>

        <div class="vtc-field">
          <label for="vtc-message">Votre message <span class="vtc-opt">(facultatif)</span></label>
          <textarea id="vtc-message" name="message" maxlength="1000" rows="4"></textarea>
        </div>

        <div class="vtc-hp" aria-hidden="true">
          <label for="company_website">Ne pas remplir</label>
          <input type="text" id="company_website" name="company_website" tabindex="-1" autocomplete="off">
        </div>

        <div class="vtc-field">
          <label class="vtc-consent" for="consent">
            <input type="checkbox" id="consent" name="consent" value="true" required>
            <span>J'accepte que mes informations soient utilisées pour me recontacter, conformément à la <a href="politique-confidentialite.html">politique de confidentialité</a>.</span>
          </label>
          <p class="field-error" data-error-for="consent" role="alert"></p>
        </div>

        <button class="btn btn-amber vtc-form__submit" type="submit">Envoyer ma demande</button>
        <p id="form-status" class="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>`;
}
