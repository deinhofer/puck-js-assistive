// SWButton-UI main.js
// This code sets up a BLE HID device that can execute stored commands based on button press patterns.
// Commands can be configured via a custom BLE service.
// Supported commands include key presses and mouse actions.

// Load necessary modules
// ble_hid_combo provides combined keyboard and mouse HID functionality
var HID = require("ble_hid_combo");
// SWButton.js is a custom javascript module and handles button press patterns (single, double, long press).
// SWButton.js must be stored in the device's storage with the name 'SWButton.js' using the Espruino IDE.
var SWBtn = eval(require("Storage").read("SWButton.js"));

var storeCommands = { "S": "", "SS": "", "L": "" };

// Read stored commands for each button press pattern from persistent storage
function loadStoredCommands() {
    var stored = require("Storage").read("storeCommands");
    if (stored) {
        storeCommands = JSON.parse(stored);

        Object.keys(storeCommands).forEach(key => {
            if (Array.isArray(storeCommands[key])) {
                storeCommands[key] = storeCommands[key][0];
            }
            storeCommands[key] = String(storeCommands[key]).trim();
        });

        console.log("storeCommands = {\n" +
            `    "S": "${storeCommands.S}",\n` +
            `    "SS": "${storeCommands.SS}",\n` +
            `    "L": "${storeCommands.L}"\n` +
            "};");

    } else {
        storeCommands = { "S": "", "SS": "", "L": "" };
    }
}

function checkStoredCommandIntegrity() {
    if (!require("Storage").read("storeCommands")) {
        console.log("storeCommands missing, restoring last known state.");
        require("Storage").write("storeCommands", JSON.stringify(storeCommands));
    }
}

// Stores a command for a given button press pattern
function storeCommand(command, pressType) {
    if (!["S", "SS", "L"].includes(pressType)) {
        console.log("Invalid pressType:", pressType);
        return;
    }

    storeCommands[pressType] = String(command).trim();

    try {
        require("Storage").write("storeCommands", JSON.stringify(storeCommands));
        console.log("Successfully updated storeCommands:", JSON.stringify(storeCommands));
    } catch (e) {
        console.log("Storage write failed:", e);
    }
}

// Create additional BLE service for receiving commands
// Command format: S: AT KP A
// S - single press, SS - double press, L - long press
// Example commands: "AT KP A", "AT CL", "AT WU"
// Supported commands: KP (key press), CL (left click), CR (right click), CM (middle click), CD (double click), WU (wheel up), WD (wheel down), DRAG (mouse drag)
var receivedCmd = "";
NRF.setServices({
    0xBCDE: {
        0xABCD: {
            value: "test message",
            writable: true,
            onWrite: function (evt) {
                receivedCmd = "";
                // Convert received data to string
                var n = new Uint8Array(evt.data);
                n.forEach((elem) => receivedCmd += String.fromCharCode(elem));
                receivedCmd = receivedCmd.trim();

                if (!receivedCmd) {
                    console.log("Empty command received, ignoring.");
                    return;
                }

                // Basic validation of command format
                if (!receivedCmd.includes(":")) {
                    console.log("Invalid command format (missing ':'):", receivedCmd);
                    return;
                }

                // Split into press type and command
                let parts = receivedCmd.split(":");
                if (parts.length === 2) {
                    let pressType = parts[0].trim();
                    let command = parts[1].trim();

                    if (!["S", "SS", "L"].includes(pressType)) {
                        console.log("Unknown press type:", pressType);
                        return;
                    }

                    // Store the command
                    storeCommand(command, pressType);
                } else {
                    console.log("Invalid command format:", receivedCmd);
                }
            }
        }
    }
}, {// Add HID service
    // Advertise 0xBCDE service alongside HID
    hid: HID.report,
    advertise: [0xBCDE]
});


// Handle BLE connection events
NRF.on('connect', function (addr) {
    console.log("Connected to:", addr);
    // Disable security for simplicity
    NRF.setSecurity({ mitm: false, display: false, keyboard: false });
});

// Execute the command associated with the button press pattern
function executeNextCommand(mode) {
    var command = storeCommands[mode];

    if (!command || typeof command !== "string") {
        console.log("Invalid command format:", JSON.stringify(command));
        return;
    }

    console.log("Executing command:", command);

    let parts = command.split(" ");
    if (parts[0] === "AT") {
        if (parts[1] === "KP") {
            let key = parts.slice(2).join(" ").toUpperCase();

            if (!HID.KEY[key]) {
                console.log("Unknown key:", key);
                return;
            }

            try {
                HID.tapKey(HID.KEY[key]);
                console.log("Key pressed:", key);
            } catch (e) {
                console.log("Error pressing key:", e);
            }
        } else if (parts[1] === "CL") {
            HID.mouseClick(1);
        } else if (parts[1] === "CR") {
            HID.mouseClick(2);
        } else if (parts[1] === "CM") {
            HID.mouseClick(4);
        } else if (parts[1] === "CD") {
            HID.mouseClick(1);
            setTimeout(() => HID.mouseClick(1), 100);
        } else if (parts[1] === "WU") {
            HID.mouseWheel(1);
        } else if (parts[1] === "WD") {
            HID.mouseWheel(-1);
        } else if (parts[1] === "DRAG") {
            HID.mouseMove(10, 10, 0);
        } else {
            console.log("Unknown AT command:", command);
        }
    } else {
        console.log("Invalid command format:", command);
    }
}


// Instantiate SWButton object and initialize it with callback for press patterns
var myButton = new SWBtn(function (k) {
    console.log("Button press pattern detected:", k);
    executeNextCommand(k);
});

// Initial load of stored commands and integrity check setup
loadStoredCommands();
setInterval(checkStoredCommandIntegrity, 10000);
console.log("Puck.js is ready.");