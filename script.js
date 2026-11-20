let transmissionType = "text";

let senderData = "";
let receiverData = "";

let senderCRCValue = 0;
let fileName = "";

let totalTransmitted = 0;
let verified = 0;
let failed = 0;

let historyNumber = 0;


/* =========================
   CRC-32
========================= */

function calculateCRC(data) {

    let bytes;

    if (typeof data === "string") {

        bytes = new TextEncoder().encode(data);

    } else {

        bytes = new Uint8Array(data);

    }

    let crc = 0xffffffff;

    for (let byte of bytes) {

        crc ^= byte;

        for (let i = 0; i < 8; i++) {

            crc =
                (crc >>> 1) ^
                (0xedb88320 & -(crc & 1));

        }
    }

    return (crc ^ 0xffffffff) >>> 0;
}


/* =========================
   SELECT TEXT
========================= */

function selectText() {

    transmissionType = "text";

    document.getElementById("textArea")
        .classList.remove("hidden");

    document.getElementById("fileArea")
        .classList.add("hidden");

    document.getElementById("textButton")
        .classList.add("active");

    document.getElementById("fileButton")
        .classList.remove("active");
}


/* =========================
   SELECT FILE
========================= */

function selectFile() {

    transmissionType = "file";

    document.getElementById("fileArea")
        .classList.remove("hidden");

    document.getElementById("textArea")
        .classList.add("hidden");

    document.getElementById("fileButton")
        .classList.add("active");

    document.getElementById("textButton")
        .classList.remove("active");
}


/* =========================
   TRANSMIT
========================= */

async function transmit() {

    if (transmissionType === "text") {

        senderData =
            document.getElementById("message").value;

        if (senderData.trim() === "") {

            document.getElementById("senderMessage").innerHTML =
                `<div class="error">
                    Please enter a message.
                </div>`;

            return;
        }

        receiverData = senderData;

        senderCRCValue =
            calculateCRC(senderData);

        showTextReceiver();

    }


    else {

        let file =
            document.getElementById("file").files[0];

        if (!file) {

            document.getElementById("senderMessage").innerHTML =
                `<div class="error">
                    Please select a file.
                </div>`;

            return;
        }

        senderData =
            await file.arrayBuffer();

        receiverData =
            senderData.slice(0);

        fileName = file.name;

        senderCRCValue =
            calculateCRC(senderData);

        showFileReceiver();
    }


    totalTransmitted++;

    document.getElementById("totalTransmitted")
        .textContent = totalTransmitted;


    document.getElementById("senderCRC")
        .textContent = senderCRCValue;

    document.getElementById("receiverCRC")
        .textContent = calculateCRC(receiverData);

    document.getElementById("crcStatus")
        .textContent = "Waiting for verification";


    document.getElementById("senderMessage").innerHTML =
        `<div class="success">
            📤 Data transmitted successfully.
        </div>`;
}


/* =========================
   TEXT RECEIVER
========================= */

function showTextReceiver() {

    document.getElementById("receiver").innerHTML = `

        <label>Received Message</label>

        <div class="received-box" id="receivedMessage">
            ${escapeHTML(receiverData)}
        </div>

        <button
            class="receiver-button error-button"
            onclick="createError()">

            ⚠️ CREATE ERROR

        </button>

        <button
            class="receiver-button"
            onclick="verify()">

            🔍 VERIFY

        </button>

        <div id="verifyResult"></div>
    `;
}


/* =========================
   FILE RECEIVER
========================= */

function showFileReceiver() {

    document.getElementById("receiver").innerHTML = `

        <label>Received File</label>

        <div class="received-box">

            📄 <b>${escapeHTML(fileName)}</b>

        </div>

        <button
            class="receiver-button error-button"
            onclick="createError()">

            ⚠️ CREATE ERROR

        </button>

        <button
            class="receiver-button"
            onclick="verify()">

            🔍 VERIFY

        </button>

        <div id="verifyResult"></div>
    `;
}


/* =========================
   CREATE ERROR
========================= */

function createError() {

    if (transmissionType === "text") {

        if (receiverData.length === 1) {

            receiverData =
                receiverData === "!" ? "?" : "!";

        } else {

            let position =
                receiverData.length - 1;

            let changedCharacter =
                receiverData[position] === "!"
                ? "?"
                : "!";

            receiverData =
                receiverData.substring(0, position) +
                changedCharacter;
        }


        document.getElementById("receivedMessage")
            .textContent = receiverData;
    }


    else {

        let data =
            new Uint8Array(receiverData);

        if (data.length > 0) {

            data[0] = data[0] ^ 1;

        }

        receiverData = data.buffer;
    }


    let newCRC =
        calculateCRC(receiverData);

    document.getElementById("receiverCRC")
        .textContent = newCRC;

    document.getElementById("crcStatus")
        .textContent = "⚠ Error Created";
}


/* =========================
   VERIFY
========================= */

function verify() {

    let receiverCRCValue =
        calculateCRC(receiverData);

    document.getElementById("receiverCRC")
        .textContent = receiverCRCValue;


    if (receiverCRCValue === senderCRCValue) {

        verified++;

        document.getElementById("verified")
            .textContent = verified;

        document.getElementById("crcStatus")
            .textContent = "✓ DATA MATCHED";


        document.getElementById("verifyResult").innerHTML = `
            <div class="success">

                ✓ MATCHED

                <br><br>

                Sender and Receiver CRC are the same.

            </div>
        `;

        addHistory(
            "MATCHED",
            receiverCRCValue
        );

    }


    else {

        failed++;

        document.getElementById("failed")
            .textContent = failed;

        document.getElementById("crcStatus")
            .textContent = "✕ DATA NOT MATCHED";


        document.getElementById("verifyResult").innerHTML = `
            <div class="error">

                ✕ NOT MATCHED

                <br><br>

                The received data has been altered.

            </div>
        `;

        addHistory(
            "NOT MATCHED",
            receiverCRCValue
        );
    }
}


/* =========================
   HISTORY
========================= */

function addHistory(status, receiverCRCValue) {

    historyNumber++;

    let dataDisplay;


    if (transmissionType === "text") {

        dataDisplay =
            senderData.substring(0, 25);

    } else {

        dataDisplay = fileName;

    }


    let statusHTML;

    if (status === "MATCHED") {

        statusHTML =
            `<span class="matched">✓</span>`;

    } else {

        statusHTML =
            `<span class="not-matched">✕</span>`;

    }


    document.getElementById("history").innerHTML += `

        <tr>

            <td>${historyNumber}</td>

            <td>
                ${transmissionType === "text"
                    ? "Text"
                    : "File"}
            </td>

            <td>${escapeHTML(dataDisplay)}</td>

            <td>${senderCRCValue}</td>

            <td>${receiverCRCValue}</td>

            <td>${statusHTML}</td>

        </tr>
    `;
}


/* =========================
   SECURITY
========================= */

function escapeHTML(text) {

    let div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}