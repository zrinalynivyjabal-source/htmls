const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const keypad = document.querySelector(".keypad");
const converterElements = {
  category: document.getElementById("conversion-category"),
  fromUnit: document.getElementById("conversion-from"),
  toUnit: document.getElementById("conversion-to"),
  value: document.getElementById("conversion-value"),
  output: document.getElementById("conversion-output"),
  swapButton: document.getElementById("conversion-swap"),
};

const calculatorState = {
  displayValue: "0",
  expression: "",
  operator: null,
  firstOperand: null,
  waitingForSecondOperand: false,
};

const conversionCatalog = {
  length: {
    label: "Length",
    baseUnit: "meter",
    units: {
      millimeter: { label: "Millimeters", factor: 0.001 },
      centimeter: { label: "Centimeters", factor: 0.01 },
      meter: { label: "Meters", factor: 1 },
      kilometer: { label: "Kilometers", factor: 1000 },
      inch: { label: "Inches", factor: 0.0254 },
      foot: { label: "Feet", factor: 0.3048 },
      yard: { label: "Yards", factor: 0.9144 },
      mile: { label: "Miles", factor: 1609.344 },
    },
  },
  mass: {
    label: "Mass",
    baseUnit: "kilogram",
    units: {
      milligram: { label: "Milligrams", factor: 0.000001 },
      gram: { label: "Grams", factor: 0.001 },
      kilogram: { label: "Kilograms", factor: 1 },
      metricTon: { label: "Metric Tons", factor: 1000 },
      ounce: { label: "Ounces", factor: 0.028349523125 },
      pound: { label: "Pounds", factor: 0.45359237 },
      stone: { label: "Stones", factor: 6.35029318 },
    },
  },
  temperature: {
    label: "Temperature",
    baseUnit: "celsius",
    units: {
      celsius: {
        label: "Celsius",
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      fahrenheit: {
        label: "Fahrenheit",
        toBase: (value) => (value - 32) * (5 / 9),
        fromBase: (value) => value * (9 / 5) + 32,
      },
      kelvin: {
        label: "Kelvin",
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15,
      },
    },
  },
  volume: {
    label: "Volume",
    baseUnit: "liter",
    units: {
      milliliter: { label: "Milliliters", factor: 0.001 },
      liter: { label: "Liters", factor: 1 },
      cubicMeter: { label: "Cubic Meters", factor: 1000 },
      teaspoon: { label: "Teaspoons (US)", factor: 0.00492892159375 },
      tablespoon: { label: "Tablespoons (US)", factor: 0.01478676478125 },
      cup: { label: "Cups (US)", factor: 0.2365882365 },
      pint: { label: "Pints (US)", factor: 0.473176473 },
      quart: { label: "Quarts (US)", factor: 0.946352946 },
      gallon: { label: "Gallons (US)", factor: 3.785411784 },
    },
  },
};

const converterState = {
  category: "length",
  fromUnit: null,
  toUnit: null,
  inputValue: "",
};

const conversionFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 6,
  useGrouping: true,
});

function updateDisplay() {
  resultEl.textContent = calculatorState.displayValue;
  expressionEl.textContent = calculatorState.expression;
}

function inputDigit(digit) {
  const { displayValue, waitingForSecondOperand } = calculatorState;

  if (waitingForSecondOperand) {
    calculatorState.displayValue = digit;
    calculatorState.waitingForSecondOperand = false;
  } else if (displayValue === "0" || displayValue === "Error") {
    calculatorState.displayValue = digit;
  } else {
    calculatorState.displayValue += digit;
  }

  calculatorState.expression = buildExpression();
}

function inputDecimal(dot) {
  if (calculatorState.displayValue === "Error") {
    calculatorState.displayValue = "0" + dot;
    calculatorState.waitingForSecondOperand = false;
    calculatorState.expression = buildExpression();
    return;
  }

  if (calculatorState.waitingForSecondOperand) {
    calculatorState.displayValue = "0" + dot;
    calculatorState.waitingForSecondOperand = false;
    calculatorState.expression = buildExpression();
    return;
  }

  if (!calculatorState.displayValue.includes(dot)) {
    calculatorState.displayValue += dot;
    calculatorState.expression = buildExpression();
  }
}

function handleOperator(nextOperator) {
  const { firstOperand, displayValue, operator, waitingForSecondOperand } =
    calculatorState;
  const inputValue = parseFloat(displayValue);

  if (displayValue === "Error") {
    return;
  }

  if (operator && waitingForSecondOperand) {
    calculatorState.operator = nextOperator;
    calculatorState.expression = buildExpression();
    return;
  }

  if (firstOperand === null && !Number.isNaN(inputValue)) {
    calculatorState.firstOperand = inputValue;
  } else if (operator) {
    const result = calculate(firstOperand, inputValue, operator);
    if (!Number.isFinite(result)) {
      calculatorState.displayValue = "Error";
      calculatorState.firstOperand = null;
      calculatorState.operator = null;
      calculatorState.waitingForSecondOperand = false;
      calculatorState.expression = "";
      return;
    }

    calculatorState.displayValue = formatResult(result);
    calculatorState.firstOperand = result;
  }

  calculatorState.waitingForSecondOperand = true;
  calculatorState.operator = nextOperator;
  calculatorState.expression = buildExpression();
}

function calculate(firstOperand, secondOperand, operator) {
  switch (operator) {
    case "+":
      return firstOperand + secondOperand;
    case "-":
      return firstOperand - secondOperand;
    case "*":
      return firstOperand * secondOperand;
    case "/":
      return secondOperand === 0 ? NaN : firstOperand / secondOperand;
    default:
      return secondOperand;
  }
}

function formatResult(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const stringValue = value.toString();
  if (stringValue.length > 12) {
    return value.toPrecision(10).replace(/\.0+$/, "");
  }

  return stringValue;
}

function resetCalculator() {
  calculatorState.displayValue = "0";
  calculatorState.expression = "";
  calculatorState.firstOperand = null;
  calculatorState.operator = null;
  calculatorState.waitingForSecondOperand = false;
}

function toggleSign() {
  if (calculatorState.displayValue === "0" || calculatorState.displayValue === "Error") {
    return;
  }

  if (calculatorState.displayValue.startsWith("-")) {
    calculatorState.displayValue = calculatorState.displayValue.substring(1);
  } else {
    calculatorState.displayValue = "-" + calculatorState.displayValue;
  }

  calculatorState.expression = buildExpression();
}

function applyPercent() {
  const currentValue = parseFloat(calculatorState.displayValue);
  if (Number.isNaN(currentValue)) {
    return;
  }

  const newValue = currentValue / 100;
  calculatorState.displayValue = formatResult(newValue);

  if (!calculatorState.waitingForSecondOperand && calculatorState.operator) {
    calculatorState.firstOperand = newValue;
  }

  calculatorState.expression = buildExpression();
}

function handleEquals() {
  const { firstOperand, displayValue, operator } = calculatorState;
  const secondOperand = parseFloat(displayValue);

  if (operator === null || Number.isNaN(firstOperand) || Number.isNaN(secondOperand)) {
    return;
  }

  const result = calculate(firstOperand, secondOperand, operator);

  if (!Number.isFinite(result)) {
    calculatorState.displayValue = "Error";
    calculatorState.expression = "";
    calculatorState.firstOperand = null;
    calculatorState.operator = null;
    calculatorState.waitingForSecondOperand = false;
    return;
  }

  calculatorState.displayValue = formatResult(result);
  calculatorState.expression = "";
  calculatorState.firstOperand = result;
  calculatorState.operator = null;
  calculatorState.waitingForSecondOperand = false;
}

function buildExpression() {
  const { firstOperand, operator, displayValue, waitingForSecondOperand } =
    calculatorState;

  const firstPart =
    firstOperand !== null && operator
      ? `${formatResult(firstOperand)} ${operator}`
      : "";

  const secondPart = waitingForSecondOperand ? "" : ` ${displayValue}`;

  return `${firstPart}${secondPart}`.trim();
}

function isConverterReady() {
  return (
    converterElements.category &&
    converterElements.fromUnit &&
    converterElements.toUnit &&
    converterElements.value &&
    converterElements.output &&
    converterElements.swapButton
  );
}

function populateCategorySelect() {
  if (!converterElements.category) {
    return;
  }

  converterElements.category.innerHTML = "";

  Object.entries(conversionCatalog).forEach(([key, category]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = category.label;
    if (key === converterState.category) {
      option.selected = true;
    }
    converterElements.category.append(option);
  });
}

function populateUnitSelect(selectEl, units, selectedKey) {
  if (!selectEl) {
    return;
  }

  selectEl.innerHTML = "";

  Object.entries(units).forEach(([key, unit]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = unit.label;
    if (key === selectedKey) {
      option.selected = true;
    }
    selectEl.append(option);
  });
}

function ensureUnitSelection(categoryKey) {
  const category = conversionCatalog[categoryKey];

  if (!category) {
    converterState.fromUnit = null;
    converterState.toUnit = null;
    return;
  }

  const unitKeys = Object.keys(category.units);

  if (unitKeys.length === 0) {
    converterState.fromUnit = null;
    converterState.toUnit = null;
    return;
  }

  if (!unitKeys.includes(converterState.fromUnit)) {
    [converterState.fromUnit] = unitKeys;
  }

  if (!unitKeys.includes(converterState.toUnit)) {
    converterState.toUnit = unitKeys[Math.min(1, unitKeys.length - 1)];
  }

  if (unitKeys.length > 1 && converterState.fromUnit === converterState.toUnit) {
    const alternative = unitKeys.find((key) => key !== converterState.fromUnit);
    if (alternative) {
      converterState.toUnit = alternative;
    }
  }
}

function renderUnitOptions() {
  const category = conversionCatalog[converterState.category];

  if (!category) {
    return;
  }

  ensureUnitSelection(converterState.category);

  populateUnitSelect(
    converterElements.fromUnit,
    category.units,
    converterState.fromUnit
  );
  populateUnitSelect(converterElements.toUnit, category.units, converterState.toUnit);
}

function performConversion() {
  if (!isConverterReady()) {
    return;
  }

  ensureUnitSelection(converterState.category);

  const rawValue = converterElements.value.value.trim();
  converterState.inputValue = rawValue;

  if (rawValue === "") {
    converterElements.output.textContent = "Enter a value to convert.";
    return;
  }

  const numericValue = Number.parseFloat(rawValue);

  if (!Number.isFinite(numericValue)) {
    converterElements.output.textContent = "Enter a valid number.";
    return;
  }

  const convertedValue = convertValue(
    converterState.category,
    numericValue,
    converterState.fromUnit,
    converterState.toUnit
  );

  if (convertedValue === null || Number.isNaN(convertedValue)) {
    converterElements.output.textContent = "Conversion not available.";
    return;
  }

  const category = conversionCatalog[converterState.category];
  const fromLabel = category.units[converterState.fromUnit].label;
  const toLabel = category.units[converterState.toUnit].label;

  const formattedInput = formatConversionResult(numericValue);
  const formattedOutput = formatConversionResult(convertedValue);

  converterElements.output.textContent = `${formattedInput} ${fromLabel} → ${formattedOutput} ${toLabel}`;
}

function convertValue(categoryKey, value, fromUnitKey, toUnitKey) {
  const category = conversionCatalog[categoryKey];

  if (!category) {
    return null;
  }

  if (fromUnitKey === toUnitKey) {
    return value;
  }

  const fromUnit = category.units[fromUnitKey];
  const toUnit = category.units[toUnitKey];

  if (!fromUnit || !toUnit) {
    return null;
  }

  const toBase =
    typeof fromUnit.toBase === "function"
      ? fromUnit.toBase
      : (val) => val * fromUnit.factor;

  const fromBase =
    typeof toUnit.fromBase === "function"
      ? toUnit.fromBase
      : (val) => val / toUnit.factor;

  const baseValue = toBase(value);

  if (!Number.isFinite(baseValue)) {
    return NaN;
  }

  return fromBase(baseValue);
}

function formatConversionResult(value) {
  if (!Number.isFinite(value)) {
    return "Error";
  }

  const absValue = Math.abs(value);

  if (absValue !== 0 && (absValue < 1e-6 || absValue >= 1e9)) {
    const [mantissa, exponent] = value.toExponential(6).split("e");
    const normalizedMantissa = Number(mantissa);
    return `${normalizedMantissa}e${exponent}`;
  }

  const roundedValue = Number.parseFloat(value.toFixed(6));
  return conversionFormatter.format(roundedValue);
}

function initializeConverter() {
  if (!isConverterReady()) {
    return;
  }

  populateCategorySelect();
  renderUnitOptions();

  if (converterState.inputValue) {
    converterElements.value.value = converterState.inputValue;
  }

  converterElements.category.addEventListener("change", (event) => {
    converterState.category = event.target.value;
    renderUnitOptions();
    performConversion();
  });

  converterElements.fromUnit.addEventListener("change", (event) => {
    converterState.fromUnit = event.target.value;
    performConversion();
  });

  converterElements.toUnit.addEventListener("change", (event) => {
    converterState.toUnit = event.target.value;
    performConversion();
  });

  converterElements.value.addEventListener("input", (event) => {
    converterState.inputValue = event.target.value;
    performConversion();
  });

  converterElements.swapButton.addEventListener("click", () => {
    if (!converterState.fromUnit || !converterState.toUnit) {
      return;
    }

    const previousFrom = converterState.fromUnit;
    converterState.fromUnit = converterState.toUnit;
    converterState.toUnit = previousFrom;

    renderUnitOptions();
    performConversion();
  });

  performConversion();
}

keypad.addEventListener("click", (event) => {
  const target = event.target;
  if (!target.classList.contains("btn")) {
    return;
  }

  const action = target.dataset.action;
  const value = target.dataset.value;

  if (action) {
    switch (action) {
      case "clear":
        resetCalculator();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        applyPercent();
        break;
      case "equals":
        handleEquals();
        break;
      default:
        break;
    }

    updateDisplay();
    return;
  }

  if (target.classList.contains("btn-operator") && value) {
    handleOperator(value);
    updateDisplay();
    return;
  }

  if (value) {
    if (value === ".") {
      inputDecimal(".");
    } else {
      inputDigit(value);
    }
    updateDisplay();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented) {
    return;
  }

  const { key } = event;
  if (/^[0-9]$/.test(key)) {
    inputDigit(key);
  } else if (key === ".") {
    inputDecimal(key);
  } else if (["+", "-", "*", "/"].includes(key)) {
    handleOperator(key);
  } else if (key === "Enter" || key === "=") {
    handleEquals();
  } else if (key === "Escape") {
    resetCalculator();
  } else if (key === "%") {
    applyPercent();
  } else if (key === "Backspace") {
    const { displayValue } = calculatorState;
    if (displayValue === "Error") {
      resetCalculator();
    } else if (displayValue.length > 1) {
      calculatorState.displayValue = displayValue.slice(0, -1);
    } else {
      calculatorState.displayValue = "0";
    }
    calculatorState.expression = buildExpression();
  } else if (key === "F9") {
    toggleSign();
  } else {
    return;
  }

  updateDisplay();
  event.preventDefault();
});

initializeConverter();

updateDisplay();
