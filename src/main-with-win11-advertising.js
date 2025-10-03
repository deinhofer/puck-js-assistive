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

//NRF.setAdvertising must be called additionally in case we are connected to Windows 11
NRF.setAdvertising([
{}, // include original Advertising packet
[   // second packet containing 'appearance'
2, 1, 6,  // standard Bluetooth flags
3,3,0x12,0x18, // HID Service
3, 0x19, 0xc0 ,0x03 // : 0xc0 Generic HID, 0xC1 Keyboard, 0xC2 Mouse, 0xc3 Joystick
]
]);

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
            try {
                // 如果是 F1 到 F12 之间的功能键
                if (key.startsWith("F") && key.length === 2 && !isNaN(parseInt(key[1]))) {
                    let fKey = parseInt(key[1]); // 提取 F 键的数字部分
                    if (fKey >= 1 && fKey <= 12) {
                        console.log(`Simulating F${fKey} key...`);
                        HID.tapKey(HID.KEY[`F${fKey}`]);  // 动态模拟 F1 到 F12 键
                        console.log(`F${fKey} key simulated!`);
                    } else {
                        console.log("Invalid F key:", key);
                    }
                } else {
                    // 处理其他普通按键
                    if (!HID.KEY[key]) {
                        console.log("Unknown key:", key);
                        return;
                    }
                    HID.tapKey(HID.KEY[key]);
                    console.log("Key pressed:", key);
                }
            } catch (e) {
                console.log("Error pressing key:", e);
            }
        } else if (parts[1] === "CL") {
            try {
                HID.clickButton(1);  // 左键点击
            } catch (e) {
                console.log("Error in clickButton(1):", e);
            }
        } else if (parts[1] === "CR") {
            try {
                HID.clickButton(2);  // 右键点击
            } catch (e) {
                console.log("Error in clickButton(2):", e);
            }
        } else if (parts[1] === "CM") {
            try {
                console.log("Simulating middle button scroll...");
                let direction = Math.random() > 0.5 ? 1 : -1;  // 随机选择 1 或 -1
                HID.scroll(direction);  // 向上或向下滚动
                console.log("Middle button scroll simulated!");
            } catch (e) {
                console.log("Error in middle button scroll:", e); // 打印错误
            }
        } else if (parts[1] === "CD") {
            try {
                HID.clickButton(1);  // 左键双击
                setTimeout(() => HID.clickButton(1), 100);  // 延迟双击
            } catch (e) {
                console.log("Error in double click:", e);
            }
        } else if (parts[1] === "WU") {
            try {
                HID.scroll(1);  // 向上滚动
            } catch (e) {
                console.log("Error in mouse scroll up:", e);
            }
        } else if (parts[1] === "WD") {
            try {
                HID.scroll(-1); // 向下滚动
            } catch (e) {
                console.log("Error in mouse scroll down:", e);
            }
        } else if (parts[1] === "DRAG") {
            try {
                console.log("Holding left mouse button..."); // Debug log
                HID.holdButton(1); 
                setTimeout(() => {
                    console.log("Moving mouse..."); // Debug log
                    let randomX = Math.floor(Math.random() * 400) - 200;  // 随机数，范围从 -200 到 200
                    let randomY = Math.floor(Math.random() * 400) - 200;  // 随机数，范围从 -200 到 200
                    HID.moveMouse(randomX, randomY, 0);  // 使用随机的 x 和 y 值

                    setTimeout(() => {
                        console.log("Releasing left mouse button..."); // Debug log
                        HID.releaseButton(1);  
                    }, 500);  // 延迟500毫秒，确保拖动完成
                }, 500);  // 延迟500毫秒，确保按下鼠标左键后有时间进行移动

            } catch (e) {
                console.log("Error in mouse drag:", e);
            }
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