const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

const STORAGE_KEYS = {
  settings: "leblanc-settings",
  comments: "leblanc-comments",
  adminSession: "leblanc-admin-session",
};

const ADMIN_PASSWORD = "admin123";

const defaultSettings = {
  phone: "07 56 82 89 88",
  email: "contact@leblancexpress.fr",
  address: "3255 Rte de Strasbourg, 69140 Rillieux-la-Pape",
  heroTitle: "Votre expert en assainissement disponible 24h/24, 7j/7",
  heroDescription:
    "LE BLANC EXPRESS intervient pour le debouchage, le curage et les urgences d'assainissement avec une approche rapide, propre et professionnelle.",
  heroImage:
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  aboutTitle: "Une entreprise locale réactive au service de vos besoins",
  aboutImage:
    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80",
  serviceImage1:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  serviceImage2:
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=900&q=80",
  serviceImage3:
    "https://images.unsplash.com/photo-1628177142898-93e36e4e3f9a?auto=format&fit=crop&w=900&q=80",
  serviceImage4:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80",
  galleryImage1:
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  galleryImage2:
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80",
  galleryImage3:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  galleryImage4:
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
  galleryImage5:
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=900&q=80",
  galleryImage6:
    "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=900&q=80",
};

const defaultComments = [
  {
    name: "Client local",
    rating: 5,
    message: "Intervention rapide, equipe professionnelle et resultat propre. Je recommande.",
  },
  {
    name: "Particulier a Rillieux-la-Pape",
    rating: 5,
    message: "Tres bon contact et excellente reactivite pour une demande urgente.",
  },
];

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : JSON.parse(JSON.stringify(fallback));
  } catch (error) {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function writeStorage(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function toTelHref(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned.startsWith("+") ? `tel:${cleaned}` : `tel:+33${cleaned.replace(/^0/, "")}`;
}

function updateText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
}

function updateLink(selector, value, prefix) {
  document.querySelectorAll(selector).forEach((element) => {
    element.setAttribute("href", `${prefix}${value}`);
  });
}

function updateImage(id, src) {
  const image = document.getElementById(id);

  if (image && src) {
    image.src = src;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function applyBusinessSettings(settings) {
  const merged = { ...defaultSettings, ...settings };
  const heroTitle = document.getElementById("hero-title");
  const heroDescription = document.getElementById("hero-description");
  const aboutTitle = document.getElementById("about-title");

  if (heroTitle) {
    heroTitle.textContent = merged.heroTitle;
  }

  if (heroDescription) {
    heroDescription.textContent = merged.heroDescription;
  }

  if (aboutTitle) {
    aboutTitle.textContent = merged.aboutTitle;
  }

  updateText("[data-phone-text]", merged.phone);
  updateText("[data-email-text]", merged.email);
  updateText("[data-address-text]", merged.address);

  document.querySelectorAll("[data-phone-link]").forEach((element) => {
    element.setAttribute("href", toTelHref(merged.phone));
  });

  updateLink("[data-email-link]", merged.email, "mailto:");

  updateImage("hero-image", merged.heroImage);
  updateImage("about-image", merged.aboutImage);
  updateImage("service-image-1", merged.serviceImage1);
  updateImage("service-image-2", merged.serviceImage2);
  updateImage("service-image-3", merged.serviceImage3);
  updateImage("service-image-4", merged.serviceImage4);
  updateImage("gallery-image-1", merged.galleryImage1);
  updateImage("gallery-image-2", merged.galleryImage2);
  updateImage("gallery-image-3", merged.galleryImage3);
  updateImage("gallery-image-4", merged.galleryImage4);
  updateImage("gallery-image-5", merged.galleryImage5);
  updateImage("gallery-image-6", merged.galleryImage6);
}

function fillAdminForm(settings) {
  const form = document.getElementById("admin-settings-form");

  if (!form) {
    return;
  }

  const merged = { ...defaultSettings, ...settings };

  Object.entries(merged).forEach(([key, value]) => {
    if (form.elements[key]) {
      form.elements[key].value = value;
    }
  });
}

function renderComments(comments) {
  const list = document.getElementById("comments-list");

  if (!list) {
    return;
  }

  if (!comments.length) {
    list.innerHTML = '<p class="empty-comments">Aucun commentaire pour le moment.</p>';
    return;
  }

  list.innerHTML = comments
    .map((comment) => {
      const stars = "★".repeat(comment.rating) + "☆".repeat(5 - comment.rating);

      return `
        <article class="comment-card">
          <div class="comment-card-header">
            <strong>${escapeHtml(comment.name)}</strong>
            <span class="comment-rating">${stars}</span>
          </div>
          <p>${escapeHtml(comment.message)}</p>
        </article>
      `;
    })
    .join("");
}

function setAdminState(isLoggedIn) {
  const loginForm = document.getElementById("admin-login-form");
  const adminPanel = document.getElementById("admin-panel");

  if (!loginForm || !adminPanel) {
    return;
  }

  loginForm.classList.toggle("is-hidden", isLoggedIn);
  adminPanel.classList.toggle("is-hidden", !isLoggedIn);
}

function setAdminModalState(isOpen) {
  const modal = document.getElementById("admin-modal");

  if (!modal) {
    return;
  }

  modal.classList.toggle("is-hidden", !isOpen);
  modal.setAttribute("aria-hidden", String(!isOpen));
  document.body.style.overflow = isOpen ? "hidden" : "";
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const savedSettings = readStorage(STORAGE_KEYS.settings, defaultSettings);
const savedComments = readStorage(STORAGE_KEYS.comments, defaultComments);
const adminSession = readStorage(STORAGE_KEYS.adminSession, false);

applyBusinessSettings(savedSettings);
fillAdminForm(savedSettings);
renderComments(savedComments);
setAdminState(adminSession);
setAdminModalState(false);

const commentForm = document.getElementById("comment-form");

if (commentForm) {
  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(commentForm);
    const comments = readStorage(STORAGE_KEYS.comments, defaultComments);
    const newComment = {
      name: String(formData.get("name") || "").trim(),
      rating: Number(formData.get("rating") || 5),
      message: String(formData.get("message") || "").trim(),
    };

    if (!newComment.name || !newComment.message) {
      return;
    }

    comments.unshift(newComment);
    writeStorage(STORAGE_KEYS.comments, comments);
    renderComments(comments);
    commentForm.reset();
  });
}

const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginMessage = document.getElementById("admin-login-message");

if (adminLoginForm && adminLoginMessage) {
  adminLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(adminLoginForm);
    const password = String(formData.get("password") || "");

    if (password !== ADMIN_PASSWORD) {
      adminLoginMessage.textContent = "Mot de passe incorrect.";
      return;
    }

    adminLoginMessage.textContent = "";
    writeStorage(STORAGE_KEYS.adminSession, true);
    setAdminState(true);
    fillAdminForm(readStorage(STORAGE_KEYS.settings, defaultSettings));
  });
}

const adminSettingsForm = document.getElementById("admin-settings-form");
const adminSettingsMessage = document.getElementById("admin-settings-message");
const adminLogoutButton = document.getElementById("admin-logout");
const adminResetButton = document.getElementById("admin-reset");
const adminToggleButton = document.getElementById("admin-toggle");
const adminCloseButton = document.getElementById("admin-close");
const adminImageUploads = document.querySelectorAll("[data-image-upload]");

if (adminToggleButton) {
  adminToggleButton.addEventListener("click", () => {
    setAdminModalState(true);
  });
}

if (adminCloseButton) {
  adminCloseButton.addEventListener("click", () => {
    setAdminModalState(false);
  });
}

document.querySelectorAll("[data-close-admin]").forEach((element) => {
  element.addEventListener("click", () => {
    setAdminModalState(false);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setAdminModalState(false);
  }
});

if (adminSettingsForm && adminSettingsMessage) {
  adminSettingsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(adminSettingsForm);
    const currentSettings = readStorage(STORAGE_KEYS.settings, defaultSettings);
    const mergedCurrent = { ...defaultSettings, ...currentSettings };
    const nextSettings = { ...mergedCurrent };

    Object.keys(defaultSettings).forEach((key) => {
      const value = String(formData.get(key) || "").trim();
      if (value) {
        nextSettings[key] = value;
      }
    });

    writeStorage(STORAGE_KEYS.settings, nextSettings);
    applyBusinessSettings(nextSettings);
    adminSettingsMessage.textContent = "Modifications enregistrees sur cet appareil.";
  });
}

if (adminLogoutButton) {
  adminLogoutButton.addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.adminSession, false);
    setAdminState(false);
    setAdminModalState(false);
  });
}

if (adminResetButton && adminSettingsMessage) {
  adminResetButton.addEventListener("click", () => {
    writeStorage(STORAGE_KEYS.settings, defaultSettings);
    fillAdminForm(defaultSettings);
    applyBusinessSettings(defaultSettings);
    adminSettingsMessage.textContent = "Les informations du site ont ete reinitialisees.";
  });
}

function persistImageSetting(settingKey, dataUrl) {
  const currentSettings = readStorage(STORAGE_KEYS.settings, defaultSettings);
  const nextSettings = { ...defaultSettings, ...currentSettings, [settingKey]: dataUrl };
  writeStorage(STORAGE_KEYS.settings, nextSettings);
  applyBusinessSettings(nextSettings);
  fillAdminForm(nextSettings);
}

adminImageUploads.forEach((input) => {
  input.addEventListener("change", () => {
    const settingKey = input.getAttribute("data-image-upload");
    const file = input.files && input.files[0];

    if (!settingKey || !file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      if (adminSettingsMessage) {
        adminSettingsMessage.textContent = "Veuillez selectionner une image valide.";
      }
      input.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        return;
      }
      persistImageSetting(settingKey, result);
      if (adminSettingsMessage) {
        adminSettingsMessage.textContent = "Image importee et enregistree sur cet appareil.";
      }
      input.value = "";
    };
    reader.readAsDataURL(file);
  });
});
