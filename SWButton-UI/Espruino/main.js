var HID = require("ble_hid_combo");
var SWBtn = eval(require("Storage").read("SWButton.js"));

var storeCommands = { "S": "", "SS": "", "L": "" };

// 存储按键模式的命令
function loadStoredCommands() {
    var stored = require("Storage").read("storeCommands");
    if (stored) {
        storeCommands = JSON.parse(stored);

        // 确保所有存储的值都是字符串
        Object.keys(storeCommands).forEach(key => {
            if (Array.isArray(storeCommands[key])) {
                storeCommands[key] = storeCommands[key][0]; // 取第一个元素
            }
            storeCommands[key] = String(storeCommands[key]).trim(); // 强制转字符串
        });

        // 格式化输出，确保和你的 UI 格式一致
        console.log("storeCommands = {\n" +
        `    "S": "${storeCommands.S}",\n` +
        `    "SS": "${storeCommands.SS}",\n` +
        `    "L": "${storeCommands.L}"\n` +
        "};");

    } else {
        storeCommands = { "S": "", "SS": "", "L": "" };
    }
}


// 确保 `storeCommands` 存在
function checkStoredCommandIntegrity() {
    if (!require("Storage").read("storeCommands")) {
        console.log("storeCommands missing, restoring last known state.");
        require("Storage").write("storeCommands", JSON.stringify(storeCommands));
    }
}

// 存储新的命令，覆盖之前的
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

// 处理收到的命令
var receivedCmd = "";
NRF.setServices({
    0xBCDE: {
        0xABCD: {
            value: "test message",
            writable: true,
            onWrite: function (evt) {
                receivedCmd = "";  // 每次接收清空
                var n = new Uint8Array(evt.data);
                n.forEach((elem) => receivedCmd += String.fromCharCode(elem));
                receivedCmd = receivedCmd.trim();

                if (!receivedCmd) {
                    console.log("Empty command received, ignoring.");
                    return;
                }

                //解析格式：S: AT KP A
                if (!receivedCmd.includes(":")) {
                    console.log("Invalid command format (missing ':'):", receivedCmd);
                    return;
                }

                let parts = receivedCmd.split(":");
                if (parts.length === 2) {
                    let pressType = parts[0].trim();
                    let command = parts[1].trim();

                    if (!["S", "SS", "L"].includes(pressType)) {
                        console.log("Unknown press type:", pressType);
                        return;
                    }

                    //存储最新命令
                    storeCommand(command, pressType);
                } else {
                    console.log("Invalid command format:", receivedCmd);
                }
            }
        }
    }
}, {
    hid: HID.report,
    advertise: [0xBCDE]
});


// 监听连接状态
NRF.on('connect', function(addr) {
    console.log("Connected to:", addr);
    NRF.setSecurity({ mitm: false, display: false, keyboard: false });
});

// 执行存储的命令
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
            let key = parts.slice(2).join(" ").toUpperCase(); // 统一转换为大写

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


// 监听按钮按键模式
var myButton = new SWBtn(function(k) {
    console.log("Button press pattern detected:", k);
    executeNextCommand(k);
});

// 启动加载
loadStoredCommands();
setInterval(checkStoredCommandIntegrity, 10000);
console.log("Puck.js is ready.");