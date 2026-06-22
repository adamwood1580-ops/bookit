const STORAGE_KEY = "bells-texasscramble-round";

const course = BELLS_COURSE;

const teeSelect = document.getElementById("teeSelect");
const scoringModeSelect = document.getElementById("scoringMode");
const roundDateInput = document.getElementById("roundDate");

const teamNameInput = document.getElementById("teamName");

const playerCountSelect =
    document.getElementById("playerCount");

const player1NameInput =
    document.getElementById("player1Name");

const player2NameInput =
    document.getElementById("player2Name");

const player3NameInput =
    document.getElementById("player3Name");

const player4NameInput =
    document.getElementById("player4Name");

const player1IndexInput =
    document.getElementById("player1Index");

const player2IndexInput =
    document.getElementById("player2Index");

const player3IndexInput =
    document.getElementById("player3Index");

const player4IndexInput =
    document.getElementById("player4Index");

const manualOverride =
    document.getElementById("manualOverride");

const manualHandicap =
    document.getElementById("manualHandicap");
const teamPlayingDisplay = document.getElementById("teamPlaying");

const courseInfo = document.getElementById("courseInfo");

const frontNine = document.getElementById("frontNine");
const backNine = document.getElementById("backNine");

const outPar = document.getElementById("outPar");
const inPar = document.getElementById("inPar");

const outGross = document.getElementById("outGross");
const inGross = document.getElementById("inGross");
const outNett = document.getElementById("outNett");
const inNett = document.getElementById("inNett");
const outPoints = document.getElementById("outPoints");
const inPoints = document.getElementById("inPoints");

const outGrossSummary = document.getElementById("outGrossSummary");
const inGrossSummary = document.getElementById("inGrossSummary");
const outNettSummary = document.getElementById("outNettSummary");
const inNettSummary = document.getElementById("inNettSummary");

const totalGross = document.getElementById("totalGross");
const totalNett = document.getElementById("totalNett");
const totalPoints = document.getElementById("totalPoints");

const resetRoundBtn = document.getElementById("resetRoundBtn");
const shareScorecardBtn = document.getElementById("shareScorecardBtn");

let selectedTee = null;
let playerACourseHandicap = 0;
let playerBCourseHandicap = 0;
let teamPlayingHandicap = 0;

function initialiseApp() {
    populateTees();

    const savedRound = loadSavedRound();

    teeSelect.value = savedRound?.tee || "Yellow";
    scoringModeSelect.value = savedRound?.scoringMode || "stableford";
    selectedTee = course.tees[teeSelect.value];

    roundDateInput.value = savedRound?.roundDate || getTodayDate();
    playerANameInput.value = savedRound?.playerAName || "";
    playerBNameInput.value = savedRound?.playerBName || "";
    playerAIndexInput.value = savedRound?.playerAIndex || "";
    playerBIndexInput.value = savedRound?.playerBIndex || "";

    updateTeeColour();
    renderCourse();

    if (savedRound?.scores) restoreScores(savedRound.scores);
    if (savedRound?.drives) restoreDrives(savedRound.drives);

    updateHandicapsAndScores();

    teeSelect.addEventListener("change", handleTeeChange);
    scoringModeSelect.addEventListener("change", handleDetailsChange);
    roundDateInput.addEventListener("input", saveRound);
    playerANameInput.addEventListener("input", saveRound);
    playerBNameInput.addEventListener("input", saveRound);
    playerAIndexInput.addEventListener("input", handleDetailsChange);
    playerBIndexInput.addEventListener("input", handleDetailsChange);

    resetRoundBtn?.addEventListener("click", resetRound);
    shareScorecardBtn?.addEventListener("click", saveOrShareScorecard);
}

playerCountSelect.addEventListener(
    "change",
    () => {

        updatePlayerVisibility();

        updateHandicapsAndScores();

        saveRound();

    }
);

manualOverride.addEventListener(
    "change",
    () => {

        manualHandicap.disabled =
            !manualOverride.checked;

        updateHandicapsAndScores();

    }
);

manualHandicap.addEventListener(
    "input",
    updateHandicapsAndScores
);
updatePlayerVisibility();

function populateTees() {
    Object.keys(course.tees).forEach(teeName => {
        teeSelect.add(new Option(teeName, teeName));
    });
}

function handleDetailsChange() {
    updateHandicapsAndScores();
    saveRound();
}

function handleTeeChange() {
    selectedTee = course.tees[teeSelect.value];

    updateTeeColour();
    renderCourse();
    updateHandicapsAndScores();
    saveRound();
}

function updateTeeColour() {
    teeSelect.classList.remove("tee-white", "tee-yellow", "tee-red");
    teeSelect.classList.add(`tee-${teeSelect.value.toLowerCase()}`);
}

function renderCourse() {
    frontNine.innerHTML = "";
    backNine.innerHTML = "";

    selectedTee.holes.forEach((_, index) => {
        const row = createHoleRow(index);
        index < 9 ? frontNine.appendChild(row) : backNine.appendChild(row);
    });

    document.querySelectorAll(".score-input").forEach(input => {
        input.addEventListener("input", handleScoreInput);
        input.addEventListener("focus", event => event.target.select());
    });

    document.querySelectorAll(".drive-select").forEach(select => {
        select.addEventListener("change", () => {
            saveRound();
        });
    });

    outPar.textContent = selectedTee.holes.slice(0, 9).reduce((a, b) => a + b, 0);
    inPar.textContent = selectedTee.holes.slice(9).reduce((a, b) => a + b, 0);

    courseInfo.innerHTML = `
        <span>⚑ Par ${selectedTee.par}</span>
        <span>★ Course Rating ${selectedTee.rating}</span>
        <span>⌁ Slope ${selectedTee.slope}</span>
        
        function calculateTexasScrambleHandicap() {

    const playerCount =
        parseInt(playerCountSelect.value, 10);

    const handicaps = [];

    const p1 = calculateCourseHandicap(
        player1IndexInput.value
    );

    const p2 = calculateCourseHandicap(
        player2IndexInput.value
    );

    handicaps.push(p1, p2);

    if (playerCount >= 3) {
        handicaps.push(
            calculateCourseHandicap(
                player3IndexInput.value
            )
        );
    }

    if (playerCount >= 4) {
        handicaps.push(
            calculateCourseHandicap(
                player4IndexInput.value
            )
        );
    }

    handicaps.sort((a, b) => a - b);

    let teamHcp = 0;

    if (playerCount === 2) {

        teamHcp =
            (handicaps[0] * 0.35) +
            (handicaps[1] * 0.15);

    } else if (playerCount === 3) {

        teamHcp =
            (handicaps[0] * 0.30) +
            (handicaps[1] * 0.20) +
            (handicaps[2] * 0.10);

    } else {

        teamHcp =
            (handicaps[0] * 0.25) +
            (handicaps[1] * 0.20) +
            (handicaps[2] * 0.15) +
            (handicaps[3] * 0.10);

    }

    return Math.round(teamHcp);

}
function getTeamHandicap() {

    if (
        manualOverride.checked &&
        manualHandicap.value
    ) {
        return parseInt(
            manualHandicap.value,
            10
        );
    }

    return calculateTexasScrambleHandicap();

}
        
    `;

    resetTotals();
    highlightShotHoles();
}

function createHoleRow(index) {
    const row = document.createElement("tr");
    row.id = `hole-row-${index}`;

    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${selectedTee.yards[index]}</td>
        <td>${selectedTee.holes[index]}</td>
        <td class="si">${selectedTee.si[index]}</td>
        <td>
            <select class="drive-select" data-hole="${index}">
                <option value="">-</option>
                <option value="A">A</option>
                <option value="B">B</option>
            </select>
        </td>
        <td>
            <input class="score-input" type="number" min="1" inputmode="numeric" data-hole="${index}" />
            <div class="shot-marker" id="shot-${index}"></div>
        </td>
        <td id="nett-${index}">-</td>
        <td id="points-${index}">-</td>
    `;

    return row;
}

function handleScoreInput(event) {
    calculateGreensomes();
    saveRound();

    const input = event.target;

    if (input.value.length >= 1 && Number(input.value) > 0) {
        moveToNextScoreInput(input);
    }
}

function moveToNextScoreInput(currentInput) {
    const inputs = Array.from(document.querySelectorAll(".score-input"));
    const currentIndex = inputs.indexOf(currentInput);

    if (currentIndex >= 0 && currentIndex < inputs.length - 1) {
        setTimeout(() => inputs[currentIndex + 1].focus(), 80);
    }
}

function updateHandicapsAndScores() {
    updateHandicaps();
    highlightShotHoles();
    calculateGreensomes();
}

function updateHandicaps() {
    playerACourseHandicap = calculateCourseHandicap(playerAIndexInput.value);
    playerBCourseHandicap = calculateCourseHandicap(playerBIndexInput.value);

    const lower = Math.min(playerACourseHandicap || 0, playerBCourseHandicap || 0);
    const higher = Math.max(playerACourseHandicap || 0, playerBCourseHandicap || 0);

    if (!playerACourseHandicap && !playerBCourseHandicap) {
        teamPlayingHandicap = 0;
    } else {
        teamPlayingHandicap = Math.round((lower * 0.6) + (higher * 0.4));
    }

    playerACourseDisplay.textContent = playerACourseHandicap || "-";
    playerBCourseDisplay.textContent = playerBCourseHandicap || "-";
    teamPlayingDisplay.textContent = teamPlayingHandicap || "-";
}

function calculateCourseHandicap(indexValue) {
    const handicapIndex = parseFloat(indexValue);

    if (isNaN(handicapIndex) || !selectedTee) return 0;

    const rawCourseHandicap =
        (handicapIndex * selectedTee.slope / 113) +
        (selectedTee.rating - selectedTee.par);

    return Math.round(rawCourseHandicap);
}

function highlightShotHoles() {
    selectedTee.holes.forEach((_, index) => {
        const marker = document.getElementById(`shot-${index}`);
        const shots = getShotsReceived(teamPlayingHandicap, selectedTee.si[index]);

        if (marker) {
            marker.textContent = shots ? `+${shots}` : "";
        }
    });
}

function calculateGreensomes() {
    const isStableford = scoringModeSelect.value === "stableford";

    let outGrossTotal = 0;
    let inGrossTotal = 0;
    let outNettTotal = 0;
    let inNettTotal = 0;
    let outPointsTotal = 0;
    let inPointsTotal = 0;

    selectedTee.holes.forEach((par, index) => {
        const grossInput = document.querySelector(`.score-input[data-hole="${index}"]`);
        const gross = parseInt(grossInput?.value, 10);

        const nettCell = document.getElementById(`nett-${index}`);
        const pointsCell = document.getElementById(`points-${index}`);

        if (!gross) {
            nettCell.textContent = "-";
            pointsCell.textContent = "-";
            return;
        }

        const shots = getShotsReceived(teamPlayingHandicap, selectedTee.si[index]);
        const nett = gross - shots;
        const points = isStableford ? getStablefordPoints(nett, par) : 0;

        nettCell.textContent = nett;
        pointsCell.textContent = isStableford ? points : "-";

        if (index < 9) {
            outGrossTotal += gross;
            outNettTotal += nett;
            outPointsTotal += points;
        } else {
            inGrossTotal += gross;
            inNettTotal += nett;
            inPointsTotal += points;
        }
    });

    const grossTotal = outGrossTotal + inGrossTotal;
    const nettTotal = outNettTotal + inNettTotal;
    const pointsTotal = outPointsTotal + inPointsTotal;

    outGross.textContent = outGrossTotal || "-";
    inGross.textContent = inGrossTotal || "-";
    outNett.textContent = outNettTotal || "-";
    inNett.textContent = inNettTotal || "-";
    outPoints.textContent = isStableford ? (outPointsTotal || "-") : "-";
    inPoints.textContent = isStableford ? (inPointsTotal || "-") : "-";

    outGrossSummary.textContent = outGrossTotal || "-";
    inGrossSummary.textContent = inGrossTotal || "-";
    outNettSummary.textContent = outNettTotal || "-";
    inNettSummary.textContent = inNettTotal || "-";

    totalGross.textContent = grossTotal || "-";
    totalNett.textContent = nettTotal || "-";
    totalPoints.textContent = isStableford ? (pointsTotal || "-") : "-";
}

function getShotsReceived(playingHandicap, strokeIndex) {
    if (playingHandicap <= 0) return 0;

    const baseShots = Math.floor(playingHandicap / 18);
    const extraShots = playingHandicap % 18;

    return strokeIndex <= extraShots ? baseShots + 1 : baseShots;
}

function getStablefordPoints(nett, par) {
    const difference = nett - par;

    if (difference <= -3) return 5;
    if (difference === -2) return 4;
    if (difference === -1) return 3;
    if (difference === 0) return 2;
    if (difference === 1) return 1;

    return 0;
}

function resetTotals() {
    [
        outGross, inGross, outNett, inNett, outPoints, inPoints,
        outGrossSummary, inGrossSummary, outNettSummary, inNettSummary,
        totalGross, totalNett, totalPoints
    ].forEach(el => el.textContent = "-");
}

function resetRound() {
    if (!confirm("Clear all scores and drive selections for this round?")) return;

    document.querySelectorAll(".score-input").forEach(input => {
        input.value = "";
    });

    document.querySelectorAll(".drive-select").forEach(select => {
        select.value = "";
    });

    document.querySelectorAll('[id^="nett-"], [id^="points-"]').forEach(cell => {
        cell.textContent = "-";
    });

    resetTotals();
    highlightShotHoles();
    saveRound();
}

function saveRound() {
    const scores = {};
    const drives = {};

    document.querySelectorAll(".score-input").forEach(input => {
        scores[input.dataset.hole] = input.value;
    });

    document.querySelectorAll(".drive-select").forEach(select => {
        drives[select.dataset.hole] = select.value;
    });

    const roundData = {
        tee: teeSelect.value,
        scoringMode: scoringModeSelect.value,
        roundDate: roundDateInput.value,
        playerAName: playerANameInput.value,
        playerBName: playerBNameInput.value,
        playerAIndex: playerAIndexInput.value,
        playerBIndex: playerBIndexInput.value,
        scores,
        drives
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(roundData));
}

function loadSavedRound() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch {
        return null;
    }
}

function restoreScores(scores) {
    document.querySelectorAll(".score-input").forEach(input => {
        const hole = input.dataset.hole;

        if (scores[hole]) {
            input.value = scores[hole];
        }
    });
}

function restoreDrives(drives) {
    document.querySelectorAll(".drive-select").forEach(select => {
        const hole = select.dataset.hole;

        if (drives[hole]) {
            select.value = drives[hole];
        }
    });
}

function buildShareCard() {
    const isStableford = scoringModeSelect.value === "stableford";
    const modeLabel = isStableford ? "Stableford" : "Medal";

    document.getElementById("shareTitle").textContent = `Greensomes ${modeLabel} Scorecard`;
    document.getElementById("shareDate").textContent = roundDateInput.value || "-";
    document.getElementById("shareMode").textContent = modeLabel;
    document.getElementById("shareTee").textContent = teeSelect.value || "-";
    document.getElementById("sharePlayer1").textContent = player1NameInput.value || "Player 1";
    document.getElementById("sharePlayer2").textContent = player2NameInput.value || "Player 2";
    document.getElementById("sharePlayer3").textContent = player3NameInput.value || "Player 3";
    document.getElementById("sharePlayer4").textContent = player4NameInput.value || "Player 4";
    document.getElementById("shareTeam").textContent = teamPlayingHandicap || "-";

    document.getElementById("shareTeamHcp").textContent = teamPlayingHandicap || "-";

    const frontBody = document.querySelector("#shareFront tbody");
    const backBody = document.querySelector("#shareBack tbody");

    frontBody.innerHTML = "";
    backBody.innerHTML = "";

    let grossTotal = 0;
    let nettTotal = 0;
    let pointsTotal = 0;

    selectedTee.holes.forEach((par, index) => {
        const grossInput = document.querySelector(`.score-input[data-hole="${index}"]`);
        const driveSelect = document.querySelector(`.drive-select[data-hole="${index}"]`);

        const gross = parseInt(grossInput?.value, 10);
        const drive = driveSelect?.value || "-";

        const shots = getShotsReceived(teamPlayingHandicap, selectedTee.si[index]);
        const nett = gross ? gross - shots : 0;
        const points = gross && isStableford ? getStablefordPoints(nett, par) : 0;

        if (gross) {
            grossTotal += gross;
            nettTotal += nett;
            pointsTotal += points;
        }

        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${selectedTee.yards[index]}</td>
                <td>${par}</td>
                <td>${selectedTee.si[index]}</td>
                <td>${drive}</td>
                <td>${gross || "-"}</td>
                <td>${gross ? nett : "-"}</td>
                <td>${isStableford && gross ? points : "-"}</td>
            </tr>
        `;

        if (index < 9) {
            frontBody.insertAdjacentHTML("beforeend", row);
        } else {
            backBody.insertAdjacentHTML("beforeend", row);
        }
    });

    document.getElementById("shareGross").textContent = grossTotal || "-";
    document.getElementById("shareNett").textContent = nettTotal || "-";
    document.getElementById("sharePoints").textContent = isStableford ? (pointsTotal || "-") : "-";
}

async function saveOrShareScorecard() {
    const shareCard = document.getElementById("shareCard");

    if (!shareCard || typeof html2canvas === "undefined") {
        alert("Sharing tool is still loading. Please try again.");
        return;
    }

    buildShareCard();

    shareScorecardBtn.textContent = "Preparing...";
    shareScorecardBtn.disabled = true;

    shareCard.classList.add("share-card-exporting");

    await new Promise(resolve => setTimeout(resolve, 150));

    try {
        const canvas = await html2canvas(shareCard, {
            backgroundColor: "#fbf8ee",
            scale: 2,
            useCORS: true,
            width: 1200,
            windowWidth: 1200
        });

        canvas.toBlob(async blob => {
            if (!blob) throw new Error("Image could not be created.");

            const file = new File([blob], "bells-greensomes-scorecard.png", {
                type: "image/png"
            });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "Bells Greensomes Scorecard",
                    text: "My Greensomes scorecard",
                    files: [file]
                });
            } else {
                const link = document.createElement("a");
                link.download = "bells-greensomes-scorecard.png";
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }, "image/png");
    } catch (error) {
        console.error(error);
        alert("Unable to create scorecard image.");
    } finally {
        shareCard.classList.remove("share-card-exporting");
        shareScorecardBtn.textContent = "Save / Share Scorecard";
        shareScorecardBtn.disabled = false;
    }
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
    
    function updatePlayerVisibility() {

    const count =
        parseInt(
            playerCountSelect.value,
            10
        );

    document.getElementById(
        "player3Block"
    ).style.display =
        count >= 3 ? "" : "none";

    document.getElementById(
        "player3IndexBlock"
    ).style.display =
        count >= 3 ? "" : "none";

    document.getElementById(
        "player4Block"
    ).style.display =
        count >= 4 ? "" : "none";

    document.getElementById(
        "player4IndexBlock"
    ).style.display =
        count >= 4 ? "" : "none";

}
}

initialiseApp();