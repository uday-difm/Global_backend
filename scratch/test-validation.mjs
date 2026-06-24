import { tryValidateByType } from "../src/lib/validators/section.js";

const contentToSave = {
  title: "Welcome to Our Platform",
  subtitle: "Creating high-fidelity digital solutions that work.",
  backgroundUrl: "",
  alignment: "center",
};

const v = tryValidateByType("HERO", { content: contentToSave });
console.log("Validation Result:", v);
if (!v.ok) {
  console.log("Errors:", JSON.stringify(v.error.errors, null, 2));
}
