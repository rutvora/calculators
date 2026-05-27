// Manifest file that lists all available JSON configs
const manifestPath = "configs.json";
const list = document.getElementById("configContainer");
const app = document.getElementById("app");
const initialListDisplay = getComputedStyle(list).display;

async function loadManifest() {
  const response = await fetch(manifestPath);
  const configs = await response.json();
  const listEl = document.getElementById("configList");
  listEl.innerHTML = "";

  for (const [key, value] of Object.entries(configs)) {
    const li = document.createElement("li");
    li.textContent = key;
    li.addEventListener("click", () => {
        loadConfig(value);
        hideList();
    });
    listEl.appendChild(li);
  }
}

async function loadConfig(fileName) {
  const app = document.getElementById("app");
  app.innerHTML = "Loading " + fileName + "...";

  const response = await fetch("configs/"+fileName);
  const config = await response.json();

  app.innerHTML = "";
  const state = {};

  // Load constants first
  if (config.constants) {
    for (const [key, value] of Object.entries(config.constants)) {
      state[key] = value;
    }
  }

  // Create input fields
  for (const [key, displayName] of Object.entries(config.inputs)) {
    const div = document.createElement("div");
    div.className = "field";
    div.innerHTML = `<label>${displayName}:</label><input inputmode="numeric" pattern="[0-9,]*" id="input_${key}" />`;
    app.appendChild(div);
    state[key] = 0;

    div.querySelector("input").addEventListener("input", e => {
      const el = e.target;

      // Remove commas
      let raw = el.value.replace(/,/g, '');
      if (/^\d*(\.\d*)?$/.test(raw)) {
        let [intPart, decPart] = raw.split('.');
        let formattedInt = intPart ? Number(intPart).toLocaleString() : '';
        el.value = decPart !== undefined ? formattedInt + '.' + decPart : formattedInt;
        // el.value = raw !== '' ? Number(raw).toLocaleString() : '';
      } else {
        // Revert to last valid value
        el.value = el.dataset.lastValid || '';
      }

      // Save current valid value
      el.dataset.lastValid = el.value;
      state[key] = parseFloat(el.value.replace(/,/g, '')) || 0;
      update();
    });
  }

  // Create outputs container
  const outputDiv = document.createElement("div");
  app.appendChild(outputDiv);

  function evaluateExpressions() {
    const values = { ...state }; // include constants
    for (const [key, expr] of Object.entries(config.intermediates)) {
      try {
        const func = new Function(...Object.keys(values), `return ${expr};`);
        values[key] = func(...Object.values(values));
      } catch {
        values[key] = NaN;
      }
    }
    return values;
  }

  function update() {
    const values = evaluateExpressions();
    outputDiv.innerHTML = "";
    for (const [key, displayName] of Object.entries(config.outputs)) {
      const val = values[key];
      const div = document.createElement("div");
      div.className = "field";
      div.innerHTML = `<label>${displayName}:</label><span>${isNaN(val) ? "0" : Number(Math.round(val * 100) / 100).toLocaleString()}</span>`;
      outputDiv.appendChild(div);
    }
  }

  update();
}

function hideList() {

  list.style.display = "none";
  app.style.display = "block";
  history.pushState({ showList: false }, "");
}

// Hide the calculator part of the site
document.getElementById("app").style.display = "none";

loadManifest();

// Initially, mark the list visible (and the calculator invisible)
history.replaceState({ showList: true }, "");

// handle back/forward
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.showList) {
    list.style.display = initialListDisplay;
    app.style.display = "none";
  } else {
    list.style.display = "none";
    app.style.display = "block";
  }
});
