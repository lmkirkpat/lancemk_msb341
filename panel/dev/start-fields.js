// Dev and tests only (spec 013 T020): add fields to the option A helper's start command from
// outside the adapter, which never sends them (contracts/helper-protocol.md: base_url is test-only
// and "the adapter never sends it"). drive.js uses this for --fixture (fixture_env) and --fault
// (base_url pointing at T005's local fake service, a stand-in key, a broken mcp_config). Never
// loaded by the panel.
"use strict";

// spawn → a spawn whose child's first start command gets `fields` merged in.
function withStartFields(spawn, fields) {
  return (cmd, args, opts) => {
    const child = spawn(cmd, args, opts);
    const write = child.stdin.write.bind(child.stdin);
    let done = false;
    child.stdin.write = (chunk, ...rest) => {
      if (!done) {
        try {
          const obj = JSON.parse(String(chunk));
          if (obj && obj.type === "start") {
            done = true;
            return write(JSON.stringify(Object.assign(obj, fields)) + "\n", ...rest);
          }
        } catch (e) {}
      }
      return write(chunk, ...rest);
    };
    return child;
  };
}

module.exports = { withStartFields };
