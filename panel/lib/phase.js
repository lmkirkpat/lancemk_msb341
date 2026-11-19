// Spec 014's build phases, in one place. Go deeper needs the go_deeper tool and the lesson screens
// (phase 2, T041 to T057), built: it's on. Turning it off draws no Go deeper and a press does nothing,
// even if the server offers a skill on A; the answer's closing offer still shows. B1 never draws one
// (SC-011), whatever this says.
"use strict";

const FLAGS = { go_deeper: true };

module.exports = { FLAGS };
