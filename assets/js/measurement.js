const BASE_URL = "http://localhost:8080";
const TOKEN_KEY = "qm_access_token";
const USER_KEY = "qm_user";

const measurementConfig = {
  length: {
    measurementType: "LengthUnit",
    units: [
      { label: "Feet", value: "FEET" },
      { label: "Inches", value: "INCHES" },
      { label: "Yards", value: "YARDS" },
      { label: "Centimeters", value: "CENTIMETERS" }
    ]
  },
  weight: {
    measurementType: "WeightUnit",
    units: [
      { label: "Kilogram", value: "KILOGRAM" },
      { label: "Gram", value: "GRAM" },
      { label: "Pound", value: "POUND" }
    ]
  },
  temperature: {
    measurementType: "TemperatureUnit",
    units: [
      { label: "Celsius", value: "CELSIUS" },
      { label: "Fahrenheit", value: "FAHRENHEIT" },
      { label: "Kelvin", value: "KELVIN" }
    ]
  },
  volume: {
    measurementType: "VolumeUnit",
    units: [
      { label: "Litre", value: "LITRE" },
      { label: "Millilitre", value: "MILLILITRE" },
      { label: "Gallon", value: "GALLON" }
    ]
  }
};

const typeButtons = document.querySelectorAll(".type-card");
const actionButtons = document.querySelectorAll(".action-button");
const layouts = document.querySelectorAll(".calculator-layout");
const form = document.getElementById("calculatorForm");
const resultPanel = document.getElementById("resultPanel");
const resultValue = document.getElementById("resultValue");
const resultUnit = document.getElementById("resultUnit");
const statusText = document.getElementById("statusText");
const logoutButton = document.getElementById("logoutButton");

let selectedType = "length";
let selectedAction = "comparison";

const unitSelectIds = [
  "comparisonFromUnit",
  "comparisonToUnit",
  "conversionFromUnit",
  "conversionToUnit",
  "arithmeticUnit1",
  "arithmeticUnit2",
  "arithmeticResultUnit",
  "resultUnit"
];

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function populateUnits(type) {
  const units = measurementConfig[type].units;

  unitSelectIds.forEach((id) => {
    const select = document.getElementById(id);
    select.innerHTML = units.map((unit) => `<option value="${unit.value}">${unit.label}</option>`).join("");
  });

  document.getElementById("comparisonFromUnit").value = units[0].value;
  document.getElementById("comparisonToUnit").value = (units[1] || units[0]).value;
  document.getElementById("conversionFromUnit").value = units[0].value;
  document.getElementById("conversionToUnit").value = (units[1] || units[0]).value;
  document.getElementById("arithmeticUnit1").value = units[0].value;
  document.getElementById("arithmeticUnit2").value = (units[1] || units[0]).value;
  document.getElementById("arithmeticResultUnit").value = units[0].value;
  resultUnit.value = units[0].value;
}

function setType(type) {
  selectedType = type;
  typeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.type === type);
  });
  populateUnits(type);
  hideResult();
  statusText.textContent = "";
}

function setAction(action) {
  selectedAction = action;
  actionButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.action === action);
  });
  layouts.forEach((layout) => {
    layout.classList.toggle("active", layout.dataset.layout === action);
  });
  hideResult();
  statusText.textContent = "";
}

function hideResult() {
  resultPanel.classList.add("hidden");
  resultValue.textContent = "";
}

function getMeasurementType() {
  return measurementConfig[selectedType].measurementType;
}

function buildQuantityDTO(value, unit) {
  return {
    value: Number(value),
    unit,
    measurementType: getMeasurementType()
  };
}

function getRequestConfig() {
  if (selectedAction === "comparison") {
    return {
      endpoint: `${BASE_URL}/api/v1/quantities/compare`,
      payload: {
        thisQuantityDTO: buildQuantityDTO(
          document.getElementById("comparisonFromValue").value,
          document.getElementById("comparisonFromUnit").value
        ),
        thatQuantityDTO: buildQuantityDTO(
          document.getElementById("comparisonToValue").value,
          document.getElementById("comparisonToUnit").value
        )
      }
    };
  }

  if (selectedAction === "conversion") {
    return {
      endpoint: `${BASE_URL}/api/v1/quantities/convert`,
      payload: {
        thisQuantityDTO: buildQuantityDTO(
          document.getElementById("conversionValue").value,
          document.getElementById("conversionFromUnit").value
        ),
        thatQuantityDTO: buildQuantityDTO(
          0,
          document.getElementById("conversionToUnit").value
        )
      }
    };
  }

  const operatorEndpointMap = {
    "+": "add",
    "-": "subtract",
    "/": "divide"
  };
  const operator = document.getElementById("arithmeticOperator").value;

  return {
    endpoint: `${BASE_URL}/api/v1/quantities/${operatorEndpointMap[operator]}`,
    payload: {
      thisQuantityDTO: buildQuantityDTO(
        document.getElementById("arithmeticValue1").value,
        document.getElementById("arithmeticUnit1").value
      ),
      thatQuantityDTO: buildQuantityDTO(
        document.getElementById("arithmeticValue2").value,
        document.getElementById("arithmeticUnit2").value
      )
    }
  };
}

function getUnitLabel(unitValue) {
  return measurementConfig[selectedType].units.find((unit) => unit.value === unitValue)?.label || unitValue;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Math.abs(value) < 1e-12) {
    return "0";
  }

  return Number(value.toFixed(6)).toString();
}

function toBaseUnit(value, unit, type) {
  const numericValue = Number(value);

  if (type === "length") {
    const lengthFactor = {
      FEET: 30.48,
      INCHES: 2.54,
      YARDS: 91.44,
      CENTIMETERS: 1
    };
    return numericValue * (lengthFactor[unit] || 1);
  }

  if (type === "weight") {
    const weightFactor = {
      KILOGRAM: 1000,
      GRAM: 1,
      POUND: 453.59237
    };
    return numericValue * (weightFactor[unit] || 1);
  }

  if (type === "volume") {
    const volumeFactor = {
      LITRE: 1,
      MILLILITRE: 0.001,
      GALLON: 3.785411784
    };
    return numericValue * (volumeFactor[unit] || 1);
  }

  if (type === "temperature") {
    if (unit === "FAHRENHEIT") {
      return ((numericValue - 32) * 5) / 9;
    }
    if (unit === "KELVIN") {
      return numericValue - 273.15;
    }
    return numericValue;
  }

  return numericValue;
}

function fromBaseUnit(baseValue, unit, type) {
  if (type === "length") {
    const lengthFactor = {
      FEET: 30.48,
      INCHES: 2.54,
      YARDS: 91.44,
      CENTIMETERS: 1
    };
    return baseValue / (lengthFactor[unit] || 1);
  }

  if (type === "weight") {
    const weightFactor = {
      KILOGRAM: 1000,
      GRAM: 1,
      POUND: 453.59237
    };
    return baseValue / (weightFactor[unit] || 1);
  }

  if (type === "volume") {
    const volumeFactor = {
      LITRE: 1,
      MILLILITRE: 0.001,
      GALLON: 3.785411784
    };
    return baseValue / (volumeFactor[unit] || 1);
  }

  if (type === "temperature") {
    if (unit === "FAHRENHEIT") {
      return (baseValue * 9) / 5 + 32;
    }
    if (unit === "KELVIN") {
      return baseValue + 273.15;
    }
    return baseValue;
  }

  return baseValue;
}

function compareValues(fromValue, fromUnit, toValue, toUnit, type) {
  const fromBase = toBaseUnit(fromValue, fromUnit, type);
  const toBase = toBaseUnit(toValue, toUnit, type);
  const diff = fromBase - toBase;
  const epsilon = 1e-9;

  if (Math.abs(diff) <= epsilon) {
    return "Equal";
  }

  return diff > 0 ? "Greater" : "Smaller";
}

function getEquivalentStatement(fromValue, fromUnit, toUnit, type) {
  const fromBase = toBaseUnit(fromValue, fromUnit, type);
  const converted = fromBaseUnit(fromBase, toUnit, type);
  return `${formatNumber(fromValue)} ${getUnitLabel(fromUnit)} = ${formatNumber(converted)} ${getUnitLabel(toUnit)}`;
}

function getComparisonSentence(fromValue, fromUnit, toValue, toUnit, type) {
  const relation = compareValues(fromValue, fromUnit, toValue, toUnit, type);
  const relationText = relation === "Equal" ? "is equal to" : relation === "Greater" ? "is greater than" : "is smaller than";

  return `${formatNumber(fromValue)} ${getUnitLabel(fromUnit).toLowerCase()} ${relationText} ${formatNumber(toValue)} ${getUnitLabel(toUnit).toLowerCase()}`;
}

function showComparisonResult() {
  const fromValue = Number(document.getElementById("comparisonFromValue").value);
  const toValue = Number(document.getElementById("comparisonToValue").value);
  const fromUnit = document.getElementById("comparisonFromUnit").value;
  const toUnit = document.getElementById("comparisonToUnit").value;

  resultValue.textContent = getComparisonSentence(fromValue, fromUnit, toValue, toUnit, selectedType);
  resultUnit.innerHTML = `<option value="">Comparison</option>`;
  resultPanel.classList.remove("hidden");
  statusText.textContent = `Equivalent: ${getEquivalentStatement(fromValue, fromUnit, toUnit, selectedType)}`;
}

function showBackendResult(data) {
  if (data.error) {
    hideResult();
    statusText.textContent = data.errorMessage || "Backend reported an error.";
    return;
  }

  if (data.resultValue === undefined || data.resultValue === null) {
    hideResult();
    statusText.textContent = data.errorMessage || "Backend response did not include a result.";
    return;
  }

  resultValue.textContent = data.resultValue;
  if (data.resultUnit) {
    resultUnit.innerHTML = `<option value="${data.resultUnit}">${getUnitLabel(data.resultUnit)}</option>`;
  } else {
    resultUnit.innerHTML = `<option value="">Result</option>`;
  }
  resultPanel.classList.remove("hidden");
  statusText.textContent = "";
}

async function ensureAuthenticated() {
  const token = getToken();
  if (!token) {
    window.location.href = "../auth/index.html";
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      clearAuth();
      window.location.href = "../auth/index.html";
      return false;
    }

    const data = await response.json();
    if (!data.authenticated) {
      clearAuth();
      window.location.href = "../auth/index.html";
      return false;
    }
  } catch {
    clearAuth();
    window.location.href = "../auth/index.html";
    return false;
  }

  return true;
}

typeButtons.forEach((button) => {
  button.addEventListener("click", () => setType(button.dataset.type));
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => setAction(button.dataset.action));
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideResult();
  const { endpoint, payload } = getRequestConfig();
  const token = getToken();

  if (!token) {
    statusText.textContent = "Please login first.";
    window.location.href = "../auth/index.html";
    return;
  }

  statusText.textContent = "Calculating...";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      clearAuth();
      throw new Error("Your session expired. Please login again.");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || data.errorMessage || `Request failed with status ${response.status}`);
    }

    if (selectedAction === "comparison") {
      showComparisonResult();
    } else {
      showBackendResult(data);
    }
  } catch (error) {
    hideResult();
    statusText.textContent = error.message || "Unable to fetch calculation from backend.";
    if (statusText.textContent.includes("Please login")) {
      window.location.href = "../auth/index.html";
    }
  }
});

logoutButton.addEventListener("click", () => {
  clearAuth();
  window.location.href = "../auth/index.html";
});

setType(selectedType);
setAction(selectedAction);
ensureAuthenticated();
