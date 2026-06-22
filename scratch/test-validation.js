const { tryValidateByType } = require("./src/lib/validators/section.js");

const payload1 = {
  content: {
    title: "Welcome to Our Platform",
    subtitle: "Creating high-fidelity digital solutions that work.",
    alignment: "center",
    backgroundUrl: ""
  }
};

const payload2 = {
  content: {
    title: "Welcome to Our Platform",
    subtitle: "Creating high-fidelity digital solutions that work.",
    alignment: "center",
    backgroundUrl: undefined
  }
};

console.log("Validation with empty string:", tryValidateByType("HERO", payload1));
console.log("Validation with undefined:", tryValidateByType("HERO", payload2));
