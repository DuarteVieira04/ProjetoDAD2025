
import { io } from "socket.io-client";

const opts = {
    auth: {
        token: "test-token",
        userId: 12345, // Fake user ID
    },
    forceNew: true
};

const socket1 = io("http://localhost:3000", opts);

let gameId = null;

socket1.on("connect", () => {
    console.log("[Socket1] Connected");

    // Create Bot Game
    socket1.emit("createGame", { variant: "bot-9" }, (response) => {
        if (response.error) {
            console.error("Error creating:", response.error);
            process.exit(1);
        }
        gameId = response.gameId;
        console.log("[Socket1] Game Created:", gameId);

        // Disconnect immediately to simulate refresh/navigation
        socket1.disconnect();

        setTimeout(() => {
            startRejoin();
        }, 1000);
    });
});

function startRejoin() {
    console.log("[Socket2] Connecting to rejoin...");
    const socket2 = io("http://localhost:3000", opts);

    socket2.on("connect", () => {
        console.log("[Socket2] Connected. Attempting joinGame...");
        socket2.emit("joinGame", { gameId }, (res) => {
            console.log("[Socket2] Join response:", res);
        });
    });

    socket2.on("gameStarted", (data) => {
        console.log("[Socket2] Received gameStarted!", {
            handSize: data.yourHand.length,
            opponentHand: data.opponentHandSize
        });
        console.log("SUCCESS: Rejoin triggered game update.");
        process.exit(0);
    });

    setTimeout(() => {
        console.log("TIMEOUT: Did not receive gameStarted in 5s.");
        process.exit(1);
    }, 5000);
}
