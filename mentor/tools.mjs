// The mentor's six tools, as defined in specs/002-easing-slice/contracts/mentor-tools.md. This is
// the entire set: there is no tool that runs arbitrary ExtendScript (FR-013). Handlers are filled
// in by US1 (T024) and US2 (T031).

const notImplemented = (name) => async () => {
  throw new Error(`${name} is not implemented yet (specs/002-easing-slice/tasks.md).`);
};

export const TOOLS = [
  {
    name: "snapshot_project",
    title: "Snapshot the active comp",
    description:
      "Read the active comp and start or continue the lesson for it. Returns findings (linear keyframe pairs by layer and " +
      "property), skipped properties, hidden and precomp layers, the lesson's targets and demo_target, and whether the " +
      "lesson is new, continued or resumed. Pass focus_layers to limit the lesson to a manageable chunk.",
    inputSchema: {
      type: "object",
      properties: {
        focus_layers: {
          type: "array",
          items: { type: "string" },
          description: "Layer names to focus the lesson on, exactly as they appear in the findings. Omit for all layers.",
        },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: notImplemented("snapshot_project"),
  },
  {
    name: "preview_frame",
    title: "Preview a frame",
    description: "Render one frame of the active comp as an image, to show the learner their own animation. Defaults to the current time.",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number", minimum: 0, description: "Seconds from the start of the comp." } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    handler: notImplemented("preview_frame"),
  },
  {
    name: "set_ease",
    title: "Demonstrate easing on one pair",
    description:
      "The lesson's one demonstration: apply Easy Ease to the demo_target keyframe pair, as one undo step. Works once per " +
      "lesson and only on demo_target; the learner eases the rest.",
    inputSchema: {
      type: "object",
      properties: { segment_id: { type: "string", description: "Must equal the lesson's demo_target." } },
      required: ["segment_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: notImplemented("set_ease"),
  },
  {
    name: "diff_since_last",
    title: "Check the learner's attempt",
    description:
      "Compare the comp now with the lesson's baseline. Reports each target as eased_by_learner, eased_by_demo, " +
      "still_linear or removed, plus other changes, and whether the lesson passed. Doesn't change the baseline.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: notImplemented("diff_since_last"),
  },
  {
    name: "read_learner_record",
    title: "Read the learner record",
    description: "What the learner has practiced before, and what to review or do next. Read it before opening a lesson.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: notImplemented("read_learner_record"),
  },
  {
    name: "record_lesson",
    title: "Record the lesson",
    description:
      "Save what happened in this lesson to the learner record, in plain language. Never include names, emails or phone numbers.",
    inputSchema: {
      type: "object",
      properties: {
        skill: { type: "string", enum: ["easing.basic"] },
        project: { type: "string" },
        comp: { type: "string" },
        attempted: { type: "string" },
        result: { type: "string", enum: ["passed", "partial", "not_checked"] },
        demo_used: { type: "boolean" },
        summary: { type: "string" },
        next: { type: "string" },
      },
      required: ["skill", "project", "comp", "attempted", "result", "demo_used", "summary", "next"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
    handler: notImplemented("record_lesson"),
  },
];
