// Spec 014's build phases, in one place. Go deeper needs the go_deeper tool and the lesson screens
// (phase 2, T041 to T057); until then the panel draws no Go deeper and a press does nothing, even if
// the server offers a skill on A. The answer's closing offer still shows. Phase 2 turns this on.
"use strict";

const FLAGS = { go_deeper: false };

module.exports = { FLAGS };
