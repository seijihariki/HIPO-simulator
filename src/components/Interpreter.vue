<template>
  <div class="container vert">
    <div class="container">
      <div class="container vert third">
        <codemirror ref="editor_r" v-model="code" :options="cmOptions" class="editor"></codemirror>
        <textarea placeholder="Input" class="textfield inp" v-model="inp"></textarea>
        <textarea placeholder="Output" class="textfield out" v-model="out"></textarea>
      </div>
      <div class="container vert two_thirds">
        <div class="valbar">
          <div>IPS (Instructions per second): <input type="number" class="register" v-model.number="ips"></div>
          <div>IP (Instruction pointer): <input type="number" class="register" v-model.number="ip"></div>
          <div>ACC (Accumulator): <input type="number" class="register" v-model.number="acc"></div>
          <div>RP (Reading pointer): <input type="number" class="register" v-model.number="rp"></div>
        </div>
        <div class="btnbar">
          <button class="control" v-on:click="translate" :disabled="running">Translate</button>
          <button class="control" v-on:click="run" :disabled="running" :isrunning="running">Run</button>
          <button class="control" v-on:click="stop" :disabled="!running">Stop</button>
          <button class="control" v-on:click="step" :disabled="running">Step</button>
          <button class="control" v-on:click="reset" :disabled="running">Reset</button>
        </div>
        <div class="memorytable">
          <table class="tg">
            <tr>
              <td>
              </td>
              <td class="tg tg-header" v-for="unit in 10" :key="unit">
                {{unit - 1}}
              </td>
            </tr>
            <tr v-for="ten in 10" :key="ten">
              <td class="tg tg-header">
                {{(ten - 1) * 10}}
              </td>
              <td class="tg tg-item" v-for="unit in 10" :key="unit" :pointed="(ten - 1) * 10 + (unit - 1) == ip">
                {{memory_s[(ten - 1) * 10 + (unit - 1)]}}
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// CodeMirror imports
import { codemirror } from "vue-codemirror";
import CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";

import "codemirror/mode/javascript/javascript.js";
import "codemirror/theme/monokai.css";

// Reserved keywords (Translates to key in cmds)
var lang = {
  // English version
  LDA: "LDA",
  STA: "STA",
  ADD: "ADD",
  SUB: "SUB",
  MUL: "MUL",
  DIV: "DIV",
  REM: "REM",
  REV: "REV",
  INN: "INN",
  PRN: "PRN",
  NOP: "NOP",
  JMP: "JMP",
  JLE: "JLE",
  JDZ: "JDZ",
  JGT: "JGT",
  JEQ: "JEQ",
  JLT: "JLT",
  DPI: "DPI",
  STP: "STP",

  // Portuguese version
  CEA: "LDA",
  CAE: "STA",
  Som: "ADD",
  Sub: "SUB",
  Mul: "MUL",
  Div: "DIV",
  Rem: "REM",
  Rev: "REV",
  Lei: "INN",
  Imp: "PRN",
  Nop: "NOP",
  Des: "JMP",
  DNI: "JLE",
  DDZ: "JDZ",
  DPo: "JGT",
  DZe: "JEQ",
  DNe: "JLT",
  DPI: "JGE",
  Par: "STP"
};

// Reverse command dictionary
var rev = {
  "11XX": "LDA",
  "12XX": "STA",
  "21XX": "ADD",
  "22XX": "SUB",
  "23XX": "MUL",
  "24XX": "DIV",
  "25XX": "REM",
  "29XX": "REV",
  "31XX": "INN",
  "41XX": "PRN",
  "50XX": "NOP",
  "51XX": "JMP",
  "52XX": "JLE",
  "53XX": "JDZ",
  "54XX": "JGT",
  "55XX": "JEQ",
  "56XX": "JLT",
  "57XX": "JGE",
  "70XX": "STP"
};

// Defines CodeMirror mode (syntax highlighting)
CodeMirror.defineMode("hipo", () => {
  return {
    token(stream, state) {
      var rules = [
        // Comments
        { regex: /\[.*\]/, token: "comment" },
        { regex: /;.*/, token: "comment" },
        // Labels
        { regex: /[a-zA-Z_]+/, token: "variable" },
        // Numbers
        { regex: /(\+|\-)?[0-9]{1,4}/, token: "number" }
      ];

      for (var keyword in lang) if (stream.match(keyword)) return "keyword";

      for (var rule in rules)
        if (stream.match(rules[rule].regex)) return rules[rule].token;

      stream.next();
      return null;
    }
  };
});

// Vue
export default {
  name: "Interpreter",
  components: {
    codemirror
  },
  data() {
    return {
      // CodeMirror options
      cmOptions: {
        tabSize: 4,
        mode: "hipo",
        theme: "monokai",
        foldGutter: true,
        styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
        line: true
      },
      // Timeout obj
      timeout: null,
      running: false,
      // Instruction and Reading pointer
      ip: 0,
      rp: 0,
      // Instructions per sec and accumulator
      ips: 50,
      acc: 0,
      // Interpreter memory
      memory: Array(100),
      memory_s: Array(100),

      // Commands
      cmds: {},

      // Code editor value
      code: `1 CEA Zero
CAE Sum
Back Lei Num
Imp Num
CEA Num
DNe End
CEA Sum
Som Num
CAE Sum
Des Back
End Imp Sum
Par 00
30 Zero 00
40 Sum 00
45 Num 00`,

      // Input and output field values
      inp: "",
      out: "",

      // Label dictionary
      labels: {}
    };
  },
  watch: {
    memory: {
      handler: function(val, oldval) {
        for (var i = 0; i < 100; i++)
          this.$set(this.memory_s, i, this.formatNumber(this.memory[i]));
      },
      deep: true
    },
    timeout: function(val, oldval) {
      this.running = val != null;
    }
  },
  beforeMount() {
    for (var i = 0; i < 100; i++) this.memory[i] = 0;
    for (var i = 0; i < 100; i++) this.memory_s[i] = this.formatNumber(0);

    // Defines commands
    this.cmds = {
      LDA: {
        code: 1100,
        func: addr => {
          this.acc = this.memory[addr];
          this.ip++;
          return true;
        }
      },
      STA: {
        code: 1200,
        func: addr => {
          this.$set(this.memory, addr, this.acc);
          this.ip++;
          return true;
        }
      },
      ADD: {
        code: 2100,
        func: addr => {
          this.acc += this.memory[addr];
          this.ip++;
          return true;
        }
      },
      SUB: {
        code: 2200,
        func: addr => {
          this.acc -= this.memory[addr];
          this.ip++;
          return true;
        }
      },
      MUL: {
        code: 2300,
        func: addr => {
          this.acc *= this.memory[addr];
          this.ip++;
          return true;
        }
      },
      DIV: {
        code: 2400,
        func: addr => {
          this.acc = Math.floor(this.acc / this.memory[addr]);
          this.ip++;
          return true;
        }
      },
      REM: {
        code: 2500,
        func: addr => {
          this.acc %= this.memory[addr];
          this.ip++;
          return true;
        }
      },
      REV: {
        code: 2900,
        func: addr => {
          this.$set(this.memory, addr, -this.acc);
          this.ip++;
          return true;
        }
      },
      INN: {
        code: 3100,
        func: addr => {
          var val = parseInt(this.inp.split("\n")[this.rp]);
          if (isNaN(val)) {
            // ERROR: INVALID INPUT
            console.error("ERROR: INVALID INPUT")
            return false;
          } else {
            console.log("Reading " + val + " into " + addr)
            this.$set(this.memory, addr, val);
            this.rp++;
            this.ip++;
            return true;
          }
          return false;
        }
      },
      PRN: {
        code: 4100,
        func: addr => {
          this.out += this.memory[addr] + "\n";
          this.ip++;
          return true;
        }
      },
      NOP: {
        code: 5000,
        func: addr => {
          this.ip++;
          return true;
        }
      },
      JMP: {
        code: 5100,
        func: addr => {
          this.ip = addr;
          return true;
        }
      },
      JLE: {
        code: 5200,
        func: addr => {
          if (this.acc <= 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      JDZ: {
        code: 5300,
        func: addr => {
          if (this.acc != 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      JGT: {
        code: 5400,
        func: addr => {
          if (this.acc > 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      JEQ: {
        code: 5500,
        func: addr => {
          if (this.acc == 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      JLT: {
        code: 5600,
        func: addr => {
          if (this.acc < 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      JGE: {
        code: 5700,
        func: addr => {
          if (this.acc >= 0) this.ip = addr;
          else this.ip++;
          return true;
        }
      },
      STP: {
        code: 7000,
        func: addr => {
          console.log("Program ended!");
          return false;
        }
      }
    };
  },
  methods: {
    /**
     * Runs program at ips
     */
    run: function() {
      if (!this.timeout) {
        this.out = "";
        this.loop();
      }
    },
    /**
     * Loop for run
     */
    loop: function() {
      clearTimeout(this.timeout);
      if (this.step())
        this.timeout = setTimeout(() => {
          this.loop();
        }, 1000 / this.ips);
      else this.timeout = null;
    },

    /**
     * Stops program from running
     */
    stop: function() {
      console.log("Stop");
      clearTimeout(this.timeout);
      this.timeout = null;
    },

    /**
     * Resets registers and memory
     */
    reset: function() {
      for (var i = 0; i < 100; i++) this.$set(this.memory, i, 0);
      this.acc = this.rp = this.ip = 0;
      this.out = "";
    },

    /**
     * Runs one step of the simulation
     */
    step: function() {
      var instr = this.memory[this.ip];

      // Gets address
      var addr = instr % 100;

      // Gets command
      var cmval = (instr - addr) / 100;
      var cmd = rev[cmval.toString() + "XX"];

      // Check if instruction is valid
      if (!cmd) {
        console.log(cmval.toString() + "XX")
        // TODO: Handle errors
        console.error("ERROR: INVALID INSTRUCTION");
        return false;
      }

      return this.cmds[cmd].func(addr);
    },

    /**
     * Generates number string in (+|-)XXXX format from integer
     */
    formatNumber: function(number) {
      var numstr = Math.abs(number).toString();
      while (numstr.length < 4) numstr = "0" + numstr;

      if (number < 0) numstr = "-" + numstr;
      else numstr = "+" + numstr;

      return numstr;
    },

    /**
     * Translates to machine code
     */
    translate: function() {
      console.log("Translating...");
      var code = this.code;

      var curr_addr = 0;

      this.labels = {};

      var split = code.split("\n");

      var lines = [];

      // Preprocess lines
      for (var raw_line_i in split) {
        // Remove any comments
        var line = split[raw_line_i];
        line = line.replace(/\[[^\]]*\]/g, "");
        line = line.replace(/;.*/g, "");
        // Collapse spaces
        line = line.replace(/\s+/g, " ").trim();

        // If line is empty go to next instruction
        if (!line.length) continue;
        
        lines.push(line)
      }

      // Load labels      
      for (var line_i in lines) {
        var line = lines[line_i];

        console.log("Searching for labels in: " + line);

        // Split instruction components
        var parts = line.split(" ");

        var p_index = 0;

        // Check if next is address
        var addr = parseInt(parts[p_index]);
        if (/^[0-9]+$/.test(parts[p_index]) && !isNaN(addr)) {
          if (addr > 99) {
            // ERROR: INVALID ADDRESS
            console.error("ERROR: INVALID ADDRESS");
            return;
          }
          curr_addr = addr;
          console.log("Address is now " + addr);
          p_index++;
        }

        // Check if next is label
        var label = parts[p_index];
        console.log(label)
        if (/^[a-zA-Z_]\w*$/.test(label) && !lang[label]) {
          console.log("Is label!")
          if (this.labels[label]) {
            // ERROR: ALREADY EXISTING
            console.error("ERROR: ALREADY EXISTING");
            return;
          } else {
            console.log("Registering label " + label + " at " + curr_addr)
            // Save label
            this.labels[label] = curr_addr;
          }
          p_index++;
        }
        curr_addr++;
      }

      curr_addr = 0;
      // For each line
      for (var line_i in lines) {
        var line = lines[line_i];

        console.log("Processing line: " + line);

        // Split instruction components
        var parts = line.split(" ");

        var p_index = 0;

        var format = [];

        // Check if next is address
        var addr = parseInt(parts[p_index]);
        if (/^[0-9]+$/.test(parts[p_index]) && !isNaN(addr)) {
          if (addr > 99) {
            // ERROR: INVALID ADDRESS
            console.error("ERROR: INVALID ADDRESS");
            return;
          }
          curr_addr = addr;
          console.log("Address is now " + addr);
          format.push("addr");
          p_index++;
        }

        // Check if next is label
        var label = parts[p_index];
        if (/^[a-zA-Z_]\w*$/.test(label) && !lang[label] && this.labels[label]) {
          format.push("label");
          p_index++;
        }

        console.log(parts[p_index])

        // Next must be command or value
        if (/^(\+|\-)?[0-9]{1,4}$/.test(parts[p_index])) {
          // If value
          var val = parts[p_index];
          val = val.replace("+", "");

          if (parts[p_index + 1]) {
            // ERROR: UNKNOWN INSTRUCTION FORMAT
            console.error("ERROR: UNKNOWN INSTRUCTION FORMAT");
            return;
          }
          format.push("value");

          console.log(
            "At " + curr_addr + " is " + this.formatNumber(parseInt(val))
          );

          this.$set(this.memory, curr_addr++, parseInt(val));
        } else if (lang[parts[p_index]]) {
          var val = 0;
          var cmd = this.cmds[lang[parts[p_index]]];
          val += cmd.code;

          format.push("command");

          console.log(val)

          // If there is another argument (address)
          if (parts[p_index + 1]) {
            console.log()
            // Is it a label?
            if (this.labels[parts[p_index + 1]])
              // If so, get value from label
              val += this.labels[parts[p_index + 1]];
            else {
              // If not, just try to read as number
              var address = parseInt(parts[p_index + 1]);
              if (isNaN(address)) {
                // ERROR: INVALID LABEL OR ADDRESS
                console.error("ERROR: INVALID LABEL OR ADDRESS");
                return;
              }

              if (address > 99) {
                // ERROR: INVALID ADDRESS
                console.error("ERROR: INVALID ADDRESS");
                return;
              }

              val += address;
              format.push("address");
            }
          }

          // If there is yet another argument
          if (parts[p_index + 2]) {
            // ERROR: UNKNOWN INSTRUCTION FORMAT
            console.error("ERROR: UNKNOWN INSTRUCTION FORMAT");
            return;
          }
          console.log("At " + curr_addr + " is " + this.formatNumber(val));

          this.$set(this.memory, curr_addr++, val);
        } else {
          // ERROR: INVALID VALUE OR COMMAND
          console.error("ERROR: INVALID VALUE OR COMMAND");
          return;
        }

        console.log(format);
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  flex: 1;
  display: flex;
  width: 100%;
}

.container.vert {
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.container.vert.third {
  flex: 1;
  padding: 1em;
  height: calc(100% - 2em);
}

.container.vert.two_thirds {
  flex: 2;
  padding: 1em;
  height: calc(100% - 2em);
}

.editor {
  display: flex;
  flex-direction: column;
  flex: 2;
}
.textfield {
  flex: 1;
  resize: none;
}

.textfield.inp {
  background-color: rgb(206, 240, 206);
}

.textfield.out {
  background-color: rgb(235, 190, 190);
}

.btnbar {
  margin-top: 1em;
  height: 2em;
}

.valbar {
  display: flex;
}

input.register {
  margin-right: 1em;
  width: 3em;
}

.control {
  border-radius: 28px;
  font-family: Arial;
  color: black;
  font-size: 16px;
  padding: 6px 14px 6px 14px;
  border: solid #1bc700 2px;
  background: #fff;
  cursor: pointer;
  text-decoration: none;
  transition-duration: 0.4s;
}

.control:hover {
  background: #b9ffad;
  text-decoration: none;
}

.control:active {
  background: #88ff73;
  color: black;
}

.control[isrunning="true"] {
  background: #88ff73;
  color: black;
}

.control:disabled {
  cursor: default;
  border: solid #adadad 2px;
}

.control .text {
  flex: 1;
}

.control .icon {
  flex: 1;
  height: 1.5em;
}

.memorytable {
  padding: 2em;
  display: flex;
  vertical-align: auto;
}

.tg {
  border-collapse: collapse;
  border-spacing: 0;
  flex: 1;
}

.tg td {
  font-family: Arial, sans-serif;
  font-size: 14px;
  font-weight: normal;
  padding: 10px 5px;
  border-style: solid;
  border-width: 1px;
  overflow: hidden;
  word-break: normal;
}

.tg .tg-item {
  background-color: #e2e3ff;
  text-align: center;
}

.tg .tg-item[pointed="true"] {
  background-color: #ffb3b3;
  text-align: center;
}

.tg .tg-header {
  font-weight: bold;
  background-color: #cdcfff;
  text-align: center;
  vertical-align: top;
}
</style>

<style>
.CodeMirror {
  flex: 1;
  border: 1px solid #eee;
  height: 100%;
  max-height: 100%;
}
</style>