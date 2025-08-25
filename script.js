// Manifest file that lists all available JSON configs
const manifestPath = "configs.json";

async function loadManifest() {
  const response = await fetch(manifestPath);
  const configs = await response.json();
  const listEl = document.getElementById("configList");
  listEl.innerHTML = "";

  configs.forEach(name => {
    const li = document.createElement("li");
    li.textContent = name;
    li.addEventListener("click", () => loadConfig(name));
    listEl.appendChild(li);
  });
}

async function loadConfig(fileName) {
  const app = document.getElementById("app");
  app.innerHTML = "Loading " + fileName + "...";

  const response = await fetch(fileName);
  const config = await response.json();

  app.innerHTML = "";
  const state = {};

  // Create input fields
  config.inputs.forEach(name => {
    const div = document.createElement("div");
    div.className = "field";
    div.innerHTML = `<label>${name}:</label><input type="number" id="input_${name}" />`;
    app.appendChild(div);
    state[name] = 0;

    div.querySelector("input").addEventListener("input", e => {
      state[name] = parseFloat(e.target.value) || 0;
      update();
    });
  });

  // Create outputs container
  const outputDiv = document.createElement("div");
  app.appendChild(outputDiv);

  function evaluateExpressions() {
    const values = { ...state };
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
    config.outputs.forEach(name => {
      const val = values[name];
      const div = document.createElement("div");
      div.className = "field";
      div.innerHTML = `<label>${name}:</label><span>${isNaN(val) ? "" : val}</span>`;
      outputDiv.appendChild(div);
    });
  }

  update(); // initial render
}

// Start
loadManifest();

