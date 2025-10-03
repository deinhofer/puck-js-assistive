let puckDevice = null;
let gattServer = null;
let characteristic = null;

// 确保 `showError()` 和 `hideError()` 是全局可访问的
window.showError = function(message) {
    const errorBox = document.getElementById("error-message");
    if (!errorBox) {
        console.error("Error message div not found!");
        return;
    }
    errorBox.innerText = "Fehler: " + message;
    errorBox.style.display = "block"; // 显示错误
}

window.hideError = function() {
    const errorBox = document.getElementById("error-message");
    if (!errorBox) return;
    errorBox.style.display = "none";
}

// 连接到 Puck.js
async function connectToPuck() {
    try {
        console.log("Requesting Puck.js device...");
        puckDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [0xBCDE]
        });

        if (!puckDevice) throw new Error("No device selected");

        puckDevice.addEventListener("gattserverdisconnected", handleDisconnect);

        console.log("Connecting to GATT Server...");
        gattServer = await puckDevice.gatt.connect();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const service = await gattServer.getPrimaryService(0xBCDE);
        characteristic = await service.getCharacteristic(0xABCD);

        document.getElementById("status").textContent = "Status: Connected";
        document.getElementById("status").classList.add("connected");
        document.getElementById("disconnect").disabled = false;
        document.getElementById("connect").disabled = true;
        hideError(); // 连接成功后隐藏错误信息
        console.log("Connected to Puck.js");

    } catch (error) {
        console.error("Connection failed:", error);
        showError("Verbindung fehlgeschlagen! Bitte prüfen Sie Ihr Gerät.");
        document.getElementById("status").textContent = "Status: Connection Failed";
    }
}

async function disconnectFromPuck() {
    if (!puckDevice || !puckDevice.gatt) {  // 检查 puckDevice 是否存在
        console.warn("No device to disconnect.");
        showError("Kein Gerät verbunden!");
        return;
    }

    try {
        console.log("Disconnecting from Puck.js...");

        if (puckDevice.gatt.connected) {  
            await puckDevice.gatt.disconnect();  // 断开连接
            console.log("Successfully disconnected from Puck.js.");
        } else {
            console.warn("Puck.js was already disconnected.");
        }

        // 更新 UI 状态
        document.getElementById("status").textContent = "Status: Disconnected";
        document.getElementById("status").classList.remove("connected");
        document.getElementById("disconnect").disabled = true;
        document.getElementById("connect").disabled = false;

        showError("Kein Gerät verbunden!");  // 断开后显示错误消息

    } catch (error) {
        console.error("Error while disconnecting:", error);
        showError("Fehler beim Trennen der Verbindung!");
    }
}

// 处理断开连接
function handleDisconnect() {
    console.warn("Puck.js Disconnected!");
    document.getElementById("status").textContent = "Status: Disconnected";
    document.getElementById("status").classList.remove("connected");
    document.getElementById("disconnect").disabled = true;
    document.getElementById("connect").disabled = false;
    hideError(); // 断开连接后隐藏错误
}

async function sendATCommand(command, pressType) {
    try {
        console.log(`Sending command: ${command} (${pressType})`);

        if (!puckDevice || !puckDevice.gatt.connected) {
            console.warn("Device not connected.");
            showError("Puck.js ist nicht verbunden! Bitte zuerst verbinden.");
            return;
        }
        
        if (!characteristic) {
            console.error("Characteristic is NULL, cannot send command!");
            showError("Fehler: Keine gültige Verbindung zum Gerät.");
            return;
        }

        let encoder = new TextEncoder();
        let formattedCommand = `${pressType}: ${command}\n`; //确保格式正确

        try {
            await characteristic.writeValue(encoder.encode(formattedCommand));
            console.log("Command sent to Puck.js:", formattedCommand);
            hideError();
        } catch (gattError) {
            console.error("GATT Write Error:", gattError);
            showError("Fehler beim Senden des Befehls (GATT Fehler).");
            return;
        }

        //本地存储最新的 storeCommands（以防网页端断连后仍可读取）
        let storeCommands = JSON.parse(localStorage.getItem("storeCommands")) || {};
        storeCommands[pressType] = command;
        localStorage.setItem("storeCommands", JSON.stringify(storeCommands));
        console.log("Updated local storeCommands:", storeCommands);

        document.getElementById("log").innerText = `Command sent: ${command} (${pressType})`;
        document.getElementById("log").style.color = "green";

    } catch (error) {
        console.error("Error sending command:", error);
        showError("Fehler beim Senden des Befehls!");
        document.getElementById("log").textContent = "Error sending command!";
        document.getElementById("log").style.color = "red";
    }
}


// 选项列表，包含鼠标功能、所有字母、数字、功能键、导航键和特殊字符
const actionOptions = [];

// 添加鼠标功能
const mouseActions = ["CL", "CR", "CM", "CD", "WU", "WD", "DRAG"];
mouseActions.forEach(action => {
    actionOptions.push({ value: `AT ${action}`, text: action.replace("CL", "Left Click").replace("CR", "Right Click").replace("CM", "Middle Click").replace("CD", "Double Click").replace("WU", "Scroll Up").replace("WD", "Scroll Down").replace("DRAG", "Drag") });
});

// 添加所有字母（A-Z, a-z）
for (let i = 65; i <= 90; i++) {
    actionOptions.push({ value: `AT KP ${String.fromCharCode(i)}`, text: `Press Key ${String.fromCharCode(i)}` });
    actionOptions.push({ value: `AT KP ${String.fromCharCode(i).toLowerCase()}`, text: `Press Key ${String.fromCharCode(i).toLowerCase()}` });
}

// 添加数字 0-9
for (let i = 0; i <= 9; i++) {
    actionOptions.push({ value: `AT KP ${i}`, text: `Press Key ${i}` });
}

// 添加特殊字符
const specialChars = [
    "ENTER", "ESC", "BACKSPACE", "TAB", "SPACE", "-", "=", "[", "]", "\\",
    "NUMBER", ";", "'", "~", ",", ".", "/"
];
specialChars.forEach(char => {
    actionOptions.push({ value: `AT KP ${char}`, text: `Press ${char}` });
});

// 添加功能键（F1-F12）
for (let i = 1; i <= 12; i++) {
    actionOptions.push({ value: `AT KP F${i}`, text: `Press F${i}` });
}
// 添加系统键
const systemKeys = ["PRINTSCREEN", "SCROLL_LOCK", "PAUSE", "INSERT", "HOME", "PAGE_UP",
    "DELETE", "END", "PAGE_DOWN", "CAPS_LOCK"];
systemKeys.forEach(key => {
    actionOptions.push({ value: `AT KP ${key}`, text: `Press ${key}` });
});

// 添加方向键
const navigationKeys = ["RIGHT", "LEFT", "DOWN", "UP"];
navigationKeys.forEach(key => {
    actionOptions.push({ value: `AT KP ${key}`, text: `Press ${key}` });
});

// 添加数字键盘 (Numpad) 按键
const numPadKeys = ["NUM_LOCK", "PAD_SLASH", "PAD_ASTERIX", "PAD_MINUS", "PAD_PLUS",
    "PAD_ENTER", "PAD_1", "PAD_2", "PAD_3", "PAD_4", "PAD_5", "PAD_6",
    "PAD_7", "PAD_8", "PAD_9", "PAD_0", "PAD_PERIOD"];
numPadKeys.forEach(key => {
    actionOptions.push({ value: `AT KP ${key}`, text: `Press ${key}` });
});

// 输出最终的 actionOptions
console.log("Updated actionOptions:", actionOptions);
window.onload = function () {
    // 填充所有 select 选项
    document.querySelectorAll(".actionSelect").forEach(select => {
        actionOptions.forEach(option => {
            let newOption = document.createElement("option");
            newOption.value = option.value;
            newOption.textContent = option.text;
            select.appendChild(newOption);
        });
    });

    // 确保按钮绑定事件
    document.getElementById("connect").addEventListener("click", connectToPuck);
    document.getElementById("disconnect").addEventListener("click", disconnectFromPuck);

    // 绑定 "Send Action" 按钮，使其调用 sendATCommand()
    document.querySelectorAll(".sendAction").forEach(button => {
        button.addEventListener("click", function () {
            let pressType = this.getAttribute("data-type");
            let selectId = `actionSelect${pressType}`;
            let selectedCommand = document.getElementById(selectId).value;
            console.log(`Send Action Clicked: ${pressType}, Command: ${selectedCommand}`); // 调试信息
            sendATCommand(selectedCommand, pressType);
        });
    });

    console.log("Event listeners for connect/disconnect/sendAction buttons added.");
};