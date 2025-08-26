// Manifest file that lists all available JSON configs
const manifestPath = "configs.json";

async function loadManifest() {
  const response = await fetch(manifestPath);
  const configs = await response.json();
  const listEl = document.getElementById("configList");
  listEl.innerHTML = "";

  for (const [key, value] of Object.entries(configs)) {
    const li = document.createElement("li");
    li.textContent = key;
    li.addEventListener("click", () => loadConfig(value));
    listEl.appendChild(li);
  }
}

async function loadConfig(fileName) {
  const app = document.getElementById("app");
  app.innerHTML = "Loading " + fileName + "...";

  const response = await fetch(fileName);
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
    div.innerHTML = `<label>${displayName}:</label><input type="number" id="input_${key}" />`;
    app.appendChild(div);
    state[key] = 0;

    div.querySelector("input").addEventListener("input", e => {
      state[key] = parseFloat(e.target.value) || 0;
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
      div.innerHTML = `<label>${displayName}:</label><span>${isNaN(val) ? "" : val}</span>`;
      outputDiv.appendChild(div);
    }
  }

  update();
}

loadManifest();

