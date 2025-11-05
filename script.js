const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const keypad = document.querySelector(".keypad");

const calculatorState = {
  displayValue: "0",
  expression: "",
  operator: null,
  firstOperand: null,
  waitingForSecondOperand: false,
};

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

updateDisplay();
