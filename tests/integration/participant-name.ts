import { normalizeParticipantName } from "../../app/predicciones/[round]/resolveParticipant";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

assert(normalizeParticipantName(undefined) === null, "undefined -> null");
assert(normalizeParticipantName("") === null, "empty -> null");
assert(normalizeParticipantName("   ") === null, "whitespace -> null");
assert(normalizeParticipantName("ZenonHuertas") === "ZenonHuertas", "name preserved");
assert(normalizeParticipantName(" Iván ") === "Iván", "trimmed");
assert(normalizeParticipantName(["AndresH"]) === "AndresH", "array first element");
assert(normalizeParticipantName(["", "x"]) === null, "array with empty first -> null");
assert(normalizeParticipantName(123 as unknown) === null, "non-string -> null");

console.log("All participant-name tests passed.");