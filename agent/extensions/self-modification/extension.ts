import selfModification from "eve/extensions/self-modification/local";

// The dev-only self-modification subagent is the template's only just-bash user; with it on, eve dev installs just-bash.
export default selfModification({ local: { enabled: false } });
