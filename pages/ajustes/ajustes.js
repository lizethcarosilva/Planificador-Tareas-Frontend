(() => {
  "use strict";

  const settingsForm = document.getElementById("settingsForm");
  const nameInput = document.getElementById("settingsName");
  const emailInput = document.getElementById("settingsEmail");
  const birthDateInput = document.getElementById("settingsBirthDate");
  const successBox = document.getElementById("settingsSuccess");
  const errorBox = document.getElementById("settingsError");
  const settingsSubmitBtn = settingsForm.querySelector("button[type='submit']");

  const passwordForm = document.getElementById("passwordForm");
  const passwordInput = document.getElementById("settingsPassword");
  const passwordSuccess = document.getElementById("passwordSuccess");
  const passwordError = document.getElementById("passwordError");
  const passwordSubmitBtn = passwordForm.querySelector("button[type='submit']");

  const avatarEl = document.getElementById("settingsAvatar");
  const currentNameEl = document.getElementById("settingsCurrentName");
  const currentEmailEl = document.getElementById("settingsCurrentEmail");

  let currentUser = window.Auth.getUser();

  function fillFromUser(user) {
    currentUser = user;
    nameInput.value = user.name || "";
    emailInput.value = user.email || "";
    birthDateInput.value = user.birthDate || "";
    avatarEl.textContent = (user.name || "?").charAt(0).toUpperCase();
    currentNameEl.textContent = user.name || "";
    currentEmailEl.textContent = user.email || "";
  }

  function updateNavbar(user) {
    const navUserName = document.getElementById("navUserName");
    const navUserInitial = document.getElementById("navUserInitial");
    if (navUserName) navUserName.textContent = user.name;
    if (navUserInitial) navUserInitial.textContent = user.name.charAt(0).toUpperCase();
  }

  async function init() {
    if (currentUser) fillFromUser(currentUser);

    try {
      const fresh = await window.Api.getProfile(currentUser.id);
      window.Auth.setUser(fresh);
      fillFromUser(fresh);
    } catch (error) {
      // Si falla, seguimos mostrando los datos guardados localmente.
    }
  }

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorBox.hidden = true;
    successBox.hidden = true;
    settingsSubmitBtn.disabled = true;
    settingsSubmitBtn.textContent = "GUARDANDO...";

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      birthDate: birthDateInput.value || null,
    };

    try {
      const updated = await window.Auth.updateProfile(payload);
      fillFromUser(updated);
      updateNavbar(updated);
      successBox.hidden = false;
    } catch (error) {
      errorBox.textContent = error.message || "No se pudieron guardar los cambios.";
      errorBox.hidden = false;
    } finally {
      settingsSubmitBtn.disabled = false;
      settingsSubmitBtn.textContent = "GUARDAR CAMBIOS";
    }
  });

  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    if (password.length < 5) {
      passwordError.textContent = "La contraseña debe tener al menos 5 caracteres.";
      passwordError.hidden = false;
      passwordSuccess.hidden = true;
      return;
    }

    passwordError.hidden = true;
    passwordSuccess.hidden = true;
    passwordSubmitBtn.disabled = true;
    passwordSubmitBtn.textContent = "GUARDANDO...";

    try {
      const updated = await window.Auth.updateProfile({
        name: currentUser.name,
        email: currentUser.email,
        birthDate: currentUser.birthDate || null,
        password,
      });
      fillFromUser(updated);
      passwordForm.reset();
      passwordSuccess.hidden = false;
    } catch (error) {
      passwordError.textContent = error.message || "No se pudo actualizar la contraseña.";
      passwordError.hidden = false;
    } finally {
      passwordSubmitBtn.disabled = false;
      passwordSubmitBtn.textContent = "ACTUALIZAR CONTRASEÑA";
    }
  });

  init();
})();
