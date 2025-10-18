// SWButton-UI main.js
// This code sets up a BLE HID device that can execute stored commands based on button press patterns.
// Commands can be configured via a custom BLE service.
// Supported commands include key presses and mouse actions.

// Load necessary modules
// ble_hid_combo provides combined keyboard and mouse HID functionality
var HID = require("ble_hid_combo");

//needed for adversting eddystone URL: URL to configuration website
var eddystone=require("ble_eddystone");

// SWButton.js is a custom javascript module and handles button press patterns (single, double, long press).
// SWButton.js must be stored in the device's storage with the name 'SWButton' using the Espruino IDE.
var SWBtn = require("SWButton");

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

//NRF.setAdvertising must be called additionally in case we are connected to Windows 11
NRF.setAdvertising([
{}, // include original Advertising packet
[   // second packet containing 'appearance'
2, 1, 6,  // standard Bluetooth flags
3,3,0x12,0x18, // HID Service
3, 0x19, 0xc0 ,0x03 // : 0xc0 Generic HID, 0xC1 Keyboard, 0xC2 Mouse, 0xc3 Joystick
],
  // URL to configuration website
  [eddystone.get("https://l1nq.com/jtNjc")]
]);


//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

// Move mouse action with error handling
function moveMouseAction(x, y, b) {
    try {
        HID.moveMouse(x, y, b);
    } catch (err) {
        console.log("Cannot send mouse function, connected as HID device? Reason: " + err.message);
    }
}

function clickButtonAction(b) {
    try {
        HID.clickButton(b);
    } catch (err) {
        console.log("Cannot send mouse click, connected as HID device? Reason: " + err.message);
    }
}

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
        try {
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
                clickButtonAction(HID.BUTTON.LEFT);
            } else if (parts[1] === "CR") {
                clickButtonAction(HID.BUTTON.RIGHT);
            } else if (parts[1] === "CM") {
                clickButtonAction(HID.BUTTON.MIDDLE);
            } else if (parts[1] === "CD") {
                clickButtonAction(HID.BUTTON.LEFT);
                setTimeout(() => clickButtonAction(HID.BUTTON.LEFT), 100);
            } else if (parts[1] === "WU") {
                HID.scroll(1);
            } else if (parts[1] === "WD") {
                HID.scroll(-1);
            } else if (parts[1] === "DRAG") {
                moveMouseAction(10, 10, 0);
            } else {
                console.log("Unknown AT command:", command);
            }
        } catch (err) {
            console.log("Cannot send HID function, connected as HID device? Reason: " + err.message);
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

// Function to handle accelerometer (tilt) events
function onAccel(a) {
    let x = 0, y = 0;
    const sensitivity = 1500; // Adjust sensitivity as needed (lower value = higher sensitivity)
    const speed = 10; // Adjust speed for faster movement

    console.log("x=" + a.acc.x);
    console.log("y=" + a.acc.y);

    // Use accelerometer data to control mouse movement
    if (a.acc.y > sensitivity) {
        LED2.set();
        y = speed;
    }
    else if (a.acc.y < -sensitivity) {
        LED2.set();
        y = -speed;
    }
    if (a.acc.x > sensitivity) {
        LED1.set();
        x = -speed;
    }
    else if (a.acc.x < -sensitivity) {
        LED1.set();
        x = speed;
    }
    if(x!=0 || y!=0) {
      moveMouseAction(x, y, 0);
    }

    LED1.reset();
    LED2.reset();
    LED3.reset();
}

hz=26;

// Handle BLE connection events
NRF.on('connect', function (addr) {
    console.log("Connected to:", addr);
    // Disable security for simplicity
    NRF.setSecurity({ mitm: false, display: false, keyboard: false });

    // Enable accelerometer with default frequency (26Hz) only when connected
    digitalPulse(LED1, 1, 500);
    Puck.accelOn(hz);
    // Listen for accelerometer data
    //Puck.on('accel', onAccel);
});

// Handle BLE disconnection events
NRF.on('disconnect', function (reason) {
    console.log("Disconnected, reason:", reason);
    // Turn off accelerometer to save power when not connected
    digitalPulse(LED2, 1, 500);
    Puck.accelOff();
});

// Enable accelerometer with default frequency (26Hz) only when connected
digitalPulse(LED3, 1, 500);

// Accelerometer (tilt) handling
//require("puckjsv2-accel-tilt").on();
// turn off with require("puckjsv2-accel-tilt").off();

Puck.accelOn(hz);



// Listen for accelerometer data
Puck.on('accel', onAccel);
console.log("Puck.js is ready.");