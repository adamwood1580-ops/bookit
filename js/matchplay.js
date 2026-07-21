"use strict";

const STORAGE_KEY = "bells-matchplay-round";
const course = BELLS_COURSE;

const PLAYER_IDS = ["a", "b", "c", "d"];

const PLAYER_TEAMS = {
    a: "A",
    c: "A",
    b: "B",
    d: "B"
};

const PLAYER_DEFAULT_NAMES = {
    a: "Player A",
    b: "Player B",
    c: "Player C",
    d: "Player D"
};

const matchFormatSelect = document.getElementById("matchFormat");
const scoringModeSelect = document.getElementById("scoringMode");
const teeSelect = document.getElementById("teeSelect");
const roundDateInput = document.getElementById("roundDate");

const courseInfo = document.getElementById("courseInfo");
const frontNine = document.getElementById("frontNine");
const backNine = document.getElementById("backNine");

const matchStatus = document.getElementById("matchStatus");
const matchProgress = document.getElementById("matchProgress");

const teamAHolesDisplay = document.getElementById("teamAHoles");
const teamBHolesDisplay = document.getElementById("teamBHoles");
const halvedHolesDisplay = document.getElementById("halvedHoles");
const finalResultDisplay = document.getElementById("finalResult");

const outResultDisplay = document.getElementById("outResult");
const outStatusDisplay = document.getElementById("outStatus");
const inResultDisplay = document.getElementById("inResult");
const inStatusDisplay = document.getElementById("inStatus");

const resetRoundBtn = document.getElementById("resetRoundBtn");
const shareScorecardBtn = document.getElementById("shareScorecardBtn");

let selectedTee = null;

let playerHandicaps = {
    a: {
        course: 0,
        allowance: 0,
        strokes: 0
    },
    b: {
        course: 0,
        allowance: 0,
        strokes: 0
    },
    c: {
        course: 0,
        allowance: 0,
        strokes: 0
    },
    d: {
        course: 0,
        allowance: 0,
        strokes: 0
    }
};

let calculatedMatch = createEmptyMatchState();


function initialiseApp() {
    populateTees();

    const savedRound = loadSavedRound();

    matchFormatSelect.value = savedRound?.matchFormat || "singles";
    scoringModeSelect.value = savedRound?.scoringMode || "handicap";

    teeSelect.value = savedRound?.tee || "Yellow";
    selectedTee = course.tees[teeSelect.value];

    roundDateInput.value =
        savedRound?.roundDate ||
        getTodayDate();

    restorePlayerDetails(savedRound);

    updateTeeColour();
    updateFormatDisplay();
    renderCourse();

    if (savedRound?.scores) {
        restoreScores(savedRound.scores);
    }

    updateMatch();

    matchFormatSelect.addEventListener(
        "change",
        handleFormatChange
    );

    scoringModeSelect.addEventListener(
        "change",
        handleScoringModeChange
    );

    teeSelect.addEventListener(
        "change",
        handleTeeChange
    );

    roundDateInput.addEventListener(
        "input",
        saveRound
    );

    PLAYER_IDS.forEach(playerId => {
        getPlayerNameInput(playerId).addEventListener(
            "input",
            saveRound
        );

        getPlayerIndexInput(playerId).addEventListener(
            "input",
            handlePlayerDetailsChange
        );
    });

    resetRoundBtn.addEventListener(
        "click",
        resetRound
    );

    shareScorecardBtn.addEventListener(
        "click",
        saveOrShareMatch
    );
}


function populateTees() {
    teeSelect.innerHTML = "";

    Object.keys(course.tees).forEach(teeName => {
        teeSelect.add(
            new Option(teeName, teeName)
        );
    });
}


function restorePlayerDetails(savedRound) {
    PLAYER_IDS.forEach(playerId => {
        const upperId = playerId.toUpperCase();

        const nameKey = `player${upperId}Name`;
        const indexKey = `player${upperId}Index`;

        getPlayerNameInput(playerId).value =
            savedRound?.[nameKey] || "";

        getPlayerIndexInput(playerId).value =
            savedRound?.[indexKey] || "";
    });
}


function handleFormatChange() {
    updateFormatDisplay();
    renderCourse();
    updateMatch();
    saveRound();
}


function handleScoringModeChange() {
    updateMatch();
    saveRound();
}


function handleTeeChange() {
    selectedTee = course.tees[teeSelect.value];

    updateTeeColour();
    renderCourse();
    updateMatch();
    saveRound();
}


function handlePlayerDetailsChange() {
    updateMatch();
    saveRound();
}


function updateFormatDisplay() {
    const isFourball = isFourballMatch();

    document
        .querySelectorAll(".fourball-player")
        .forEach(element => {
            element.classList.toggle(
                "is-hidden",
                !isFourball
            );
        });

    document
        .querySelectorAll(".fourball-column")
        .forEach(element => {
            element.classList.toggle(
                "is-hidden",
                !isFourball
            );
        });
}


function updateTeeColour() {
    teeSelect.classList.remove(
        "tee-white",
        "tee-yellow",
        "tee-red"
    );

    teeSelect.classList.add(
        `tee-${teeSelect.value.toLowerCase()}`
    );
}


function renderCourse() {
    const savedScores = collectCurrentScores();

    frontNine.innerHTML = "";
    backNine.innerHTML = "";

    selectedTee.holes.forEach((par, index) => {
        const row = createHoleRow(index);

        if (index < 9) {
            frontNine.appendChild(row);
        } else {
            backNine.appendChild(row);
        }
    });

    document
        .querySelectorAll(".score-input")
        .forEach(input => {
            input.addEventListener(
                "input",
                handleScoreInput
            );

            input.addEventListener(
                "focus",
                event => event.target.select()
            );
        });

    restoreScores(savedScores);
    updateFormatDisplay();

    const allowance =
        scoringModeSelect.value === "gross"
            ? "No handicap strokes"
            : isFourballMatch()
                ? "Fourball allowance: 90%"
                : "Singles allowance: 100%";

    courseInfo.innerHTML = `
        ⚑ Par ${selectedTee.par}
        ★ Course Rating ${selectedTee.rating}
        ⌁ Slope ${selectedTee.slope}
        ${allowance}
    `;
}


function createHoleRow(index) {
    const row = document.createElement("tr");

    row.id = `hole-row-${index}`;

    row.innerHTML = `
        <td>${index + 1}</td>

        <td>${selectedTee.yards[index]}</td>

        <td>${selectedTee.holes[index]}</td>

        <td class="si">
            ${selectedTee.si[index]}
        </td>

        ${createPlayerScoreCell("a", index)}

        <td class="fourball-column">
            ${createScoreInput("c", index)}
            <span
                id="shot-c-${index}"
                class="match-shot-marker"
            ></span>
        </td>

        ${createPlayerScoreCell("b", index)}

        <td class="fourball-column">
            ${createScoreInput("d", index)}
            <span
                id="shot-d-${index}"
                class="match-shot-marker"
            ></span>
        </td>

        <td
            id="hole-result-${index}"
            class="hole-result"
        >
            -
        </td>

        <td id="running-status-${index}">
            AS
        </td>
    `;

    return row;
}


function createPlayerScoreCell(playerId, index) {
    return `
        <td>
            ${createScoreInput(playerId, index)}

            <span
                id="shot-${playerId}-${index}"
                class="match-shot-marker"
            ></span>
        </td>
    `;
}


function createScoreInput(playerId, index) {
    return `
        <input
            type="number"
            min="1"
            max="20"
            step="1"
            inputmode="numeric"
            class="score-input player-${playerId}-score"
            data-player="${playerId}"
            data-hole="${index}"
            aria-label="${getPlayerDisplayName(playerId)} score on hole ${index + 1}"
        >
    `;
}


function handleScoreInput(event) {
    updateMatch();
    saveRound();

    const input = event.target;
    const score = parseInt(input.value, 10);

    if (Number.isInteger(score) && score > 0) {
        moveToNextScoreInput(input);
    }
}


function moveToNextScoreInput(currentInput) {
    const inputs = Array.from(
        document.querySelectorAll(
            ".score-input:not(.is-hidden)"
        )
    ).filter(input => {
        const cell = input.closest("td");

        return !cell?.classList.contains("is-hidden");
    });

    const currentIndex = inputs.indexOf(currentInput);

    if (
        currentIndex >= 0 &&
        currentIndex < inputs.length - 1
    ) {
        setTimeout(() => {
            inputs[currentIndex + 1].focus();
        }, 80);
    }
}


function updateMatch() {
    updateCourseInformation();
    calculatePlayerHandicaps();
    updateHandicapDisplays();
    updateShotMarkers();

    calculatedMatch = calculateMatchState();

    updateHoleDisplays(calculatedMatch);
    updateGrossTotals();
    updateSummaryDisplays(calculatedMatch);
}


function updateCourseInformation() {
    const allowance =
        scoringModeSelect.value === "gross"
            ? "No handicap strokes"
            : isFourballMatch()
                ? "Fourball allowance: 90%"
                : "Singles allowance: 100%";

    courseInfo.innerHTML = `
        ⚑ Par ${selectedTee.par}
        ★ Course Rating ${selectedTee.rating}
        ⌁ Slope ${selectedTee.slope}
        ${allowance}
    `;
}


function calculatePlayerHandicaps() {
    const activePlayers = getActivePlayers();
    const isGross = scoringModeSelect.value === "gross";

    PLAYER_IDS.forEach(playerId => {
        const courseHandicap =
            calculateCourseHandicap(
                getPlayerIndexInput(playerId).value
            );

        playerHandicaps[playerId].course =
            courseHandicap;

        playerHandicaps[playerId].allowance =
            isGross
                ? 0
                : calculateAllowanceHandicap(
                    courseHandicap
                );

        playerHandicaps[playerId].strokes = 0;
    });

    if (isGross) {
        return;
    }

    const lowestAllowance = Math.min(
        ...activePlayers.map(
            playerId =>
                playerHandicaps[playerId].allowance
        )
    );

    activePlayers.forEach(playerId => {
        playerHandicaps[playerId].strokes =
            playerHandicaps[playerId].allowance -
            lowestAllowance;
    });
}


function calculateCourseHandicap(indexValue) {
    const handicapIndex = parseFloat(indexValue);

    if (
        Number.isNaN(handicapIndex) ||
        !selectedTee
    ) {
        return 0;
    }

    const exactCourseHandicap =
        (
            handicapIndex *
            selectedTee.slope /
            113
        ) +
        (
            selectedTee.rating -
            selectedTee.par
        );

    return Math.round(exactCourseHandicap);
}


function calculateAllowanceHandicap(courseHandicap) {
    const percentage =
        isFourballMatch()
            ? 0.9
            : 1;

    return Math.round(
        courseHandicap * percentage
    );
}


function updateHandicapDisplays() {
    PLAYER_IDS.forEach(playerId => {
        const courseDisplay =
            document.getElementById(
                `player${playerId.toUpperCase()}Course`
            );

        const strokesDisplay =
            document.getElementById(
                `player${playerId.toUpperCase()}Strokes`
            );

        courseDisplay.textContent =
            formatHandicap(
                playerHandicaps[playerId].course
            );

        strokesDisplay.textContent =
            scoringModeSelect.value === "gross"
                ? "0"
                : formatHandicap(
                    playerHandicaps[playerId].strokes
                );
    });
}


function updateShotMarkers() {
    selectedTee.si.forEach((strokeIndex, index) => {
        PLAYER_IDS.forEach(playerId => {
            const marker =
                document.getElementById(
                    `shot-${playerId}-${index}`
                );

            if (!marker) {
                return;
            }

            const shots = getShotsReceived(
                playerHandicaps[playerId].strokes,
                strokeIndex
            );

            marker.textContent =
                shots > 0
                    ? `+${shots}`
                    : shots < 0
                        ? `${shots}`
                        : "";
        });
    });
}


function calculateMatchState() {
    const state = createEmptyMatchState();

    selectedTee.holes.forEach((par, index) => {
        const holeState =
            calculateHoleState(index, par);

        state.holes.push(holeState);

        if (!holeState.complete) {
            return;
        }

        state.completedHoles += 1;

        if (holeState.winner === "A") {
            state.teamAHoles += 1;
            state.balance += 1;
        } else if (holeState.winner === "B") {
            state.teamBHoles += 1;
            state.balance -= 1;
        } else {
            state.halvedHoles += 1;
        }

        const holesRemaining =
            18 - state.completedHoles;

        holeState.runningBalance = state.balance;
        holeState.runningStatus =
            formatRunningStatus(
                state.balance,
                holesRemaining
            );

        if (
            !state.matchComplete &&
            Math.abs(state.balance) > holesRemaining
        ) {
            state.matchComplete = true;
            state.completionHole =
                state.completedHoles;

            state.finalResult =
                formatCompletedResult(
                    state.balance,
                    holesRemaining
                );
        }
    });

    if (
        !state.matchComplete &&
        state.completedHoles === 18
    ) {
        state.matchComplete = true;
        state.completionHole = 18;

        state.finalResult =
            state.balance === 0
                ? "Match Halved"
                : state.balance > 0
                    ? "Team A 1 UP"
                    : "Team B 1 UP";
    }

    if (!state.matchComplete) {
        const holesRemaining =
            18 - state.completedHoles;

        state.finalResult =
            formatRunningStatus(
                state.balance,
                holesRemaining
            );
    }

    return state;
}


function calculateHoleState(index, par) {
    const activePlayers = getActivePlayers();

    const grossScores = {};

    activePlayers.forEach(playerId => {
        grossScores[playerId] =
            getPlayerHoleScore(playerId, index);
    });

    const complete =
        activePlayers.every(
            playerId =>
                Number.isInteger(
                    grossScores[playerId]
                )
        );

    if (!complete) {
        return {
            index,
            complete: false,
            winner: null,
            teamANett: null,
            teamBNett: null,
            runningBalance: null,
            runningStatus: "-"
        };
    }

    const nettScores = {};

    activePlayers.forEach(playerId => {
        nettScores[playerId] =
            grossScores[playerId] -
            getShotsReceived(
                playerHandicaps[playerId].strokes,
                selectedTee.si[index]
            );
    });

    let teamANett;
    let teamBNett;

    if (isFourballMatch()) {
        teamANett = Math.min(
            nettScores.a,
            nettScores.c
        );

        teamBNett = Math.min(
            nettScores.b,
            nettScores.d
        );
    } else {
        teamANett = nettScores.a;
        teamBNett = nettScores.b;
    }

    let winner = "H";

    if (teamANett < teamBNett) {
        winner = "A";
    } else if (teamBNett < teamANett) {
        winner = "B";
    }

    return {
        index,
        complete: true,
        winner,
        teamANett,
        teamBNett,
        par,
        runningBalance: 0,
        runningStatus: "AS"
    };
}


function updateHoleDisplays(state) {
    let matchWasCompleted = false;

    state.holes.forEach((holeState, index) => {
        const row =
            document.getElementById(
                `hole-row-${index}`
            );

        const resultCell =
            document.getElementById(
                `hole-result-${index}`
            );

        const statusCell =
            document.getElementById(
                `running-status-${index}`
            );

        row.classList.remove(
            "match-complete-row"
        );

        resultCell.classList.remove(
            "team-a-win",
            "team-b-win",
            "halved"
        );

        if (!holeState.complete) {
            resultCell.textContent = "-";
            statusCell.textContent = "-";

            if (matchWasCompleted) {
                row.classList.add(
                    "match-complete-row"
                );
            }

            return;
        }

        if (holeState.winner === "A") {
            resultCell.textContent = "Team A";
            resultCell.classList.add(
                "team-a-win"
            );
        } else if (holeState.winner === "B") {
            resultCell.textContent = "Team B";
            resultCell.classList.add(
                "team-b-win"
            );
        } else {
            resultCell.textContent = "Halved";
            resultCell.classList.add(
                "halved"
            );
        }

        statusCell.textContent =
            holeState.runningStatus;

        if (
            state.matchComplete &&
            state.completionHole === index + 1
        ) {
            matchWasCompleted = true;
        } else if (matchWasCompleted) {
            row.classList.add(
                "match-complete-row"
            );
        }
    });

    updateNineHoleResults(state);
}


function updateNineHoleResults(state) {
    const frontCompleted = state.holes
        .slice(0, 9)
        .filter(hole => hole.complete);

    const backCompleted = state.holes
        .slice(9, 18)
        .filter(hole => hole.complete);

    outResultDisplay.textContent =
        formatNineResult(frontCompleted);

    inResultDisplay.textContent =
        formatNineResult(backCompleted);

    outStatusDisplay.textContent =
        getStatusAfterHole(state, 8);

    inStatusDisplay.textContent =
        getStatusAfterHole(state, 17);
}


function formatNineResult(holes) {
    if (!holes.length) {
        return "-";
    }

    let balance = 0;

    holes.forEach(hole => {
        if (hole.winner === "A") {
            balance += 1;
        } else if (hole.winner === "B") {
            balance -= 1;
        }
    });

    if (balance === 0) {
        return "AS";
    }

    return balance > 0
        ? `A +${balance}`
        : `B +${Math.abs(balance)}`;
}


function getStatusAfterHole(state, holeIndex) {
    const hole = state.holes[holeIndex];

    if (!hole?.complete) {
        const latestComplete = state.holes
            .slice(0, holeIndex + 1)
            .filter(item => item.complete)
            .at(-1);

        return latestComplete?.runningStatus || "AS";
    }

    return hole.runningStatus;
}


function updateGrossTotals() {
    PLAYER_IDS.forEach(playerId => {
        const frontTotal =
            sumPlayerScores(
                playerId,
                0,
                9
            );

        const backTotal =
            sumPlayerScores(
                playerId,
                9,
                18
            );

        const upperId =
            playerId.toUpperCase();

        const outDisplay =
            document.getElementById(
                `out${upperId}Gross`
            );

        const inDisplay =
            document.getElementById(
                `in${upperId}Gross`
            );

        if (outDisplay) {
            outDisplay.textContent =
                frontTotal || "-";
        }

        if (inDisplay) {
            inDisplay.textContent =
                backTotal || "-";
        }
    });
}


function sumPlayerScores(playerId, start, end) {
    let total = 0;

    for (let index = start; index < end; index += 1) {
        const score =
            getPlayerHoleScore(
                playerId,
                index
            );

        if (Number.isInteger(score)) {
            total += score;
        }
    }

    return total;
}


function updateSummaryDisplays(state) {
    teamAHolesDisplay.textContent =
        state.teamAHoles;

    teamBHolesDisplay.textContent =
        state.teamBHoles;

    halvedHolesDisplay.textContent =
        state.halvedHoles;

    finalResultDisplay.textContent =
        state.finalResult;

    matchStatus.textContent =
        state.finalResult;

    if (state.completedHoles === 0) {
        matchProgress.textContent =
            "No holes completed";
    } else if (state.matchComplete) {
        matchProgress.textContent =
            `Match completed after ${state.completionHole} holes`;
    } else {
        matchProgress.textContent =
            `${state.completedHoles} of 18 holes completed`;
    }
}


function formatRunningStatus(balance, holesRemaining) {
    if (balance === 0) {
        return "All Square";
    }

    const leadingTeam =
        balance > 0
            ? "Team A"
            : "Team B";

    const lead = Math.abs(balance);

    if (
        holesRemaining > 0 &&
        lead === holesRemaining
    ) {
        return `${leadingTeam} Dormie`;
    }

    return `${leadingTeam} ${lead} UP`;
}


function formatCompletedResult(
    balance,
    holesRemaining
) {
    const winner =
        balance > 0
            ? "Team A"
            : "Team B";

    return `${winner} ${Math.abs(balance)} & ${holesRemaining}`;
}


function getShotsReceived(
    matchStrokes,
    strokeIndex
) {
    if (matchStrokes === 0) {
        return 0;
    }

    if (matchStrokes > 0) {
        const baseShots =
            Math.floor(matchStrokes / 18);

        const remainingShots =
            matchStrokes % 18;

        return strokeIndex <= remainingShots
            ? baseShots + 1
            : baseShots;
    }

    const absoluteStrokes =
        Math.abs(matchStrokes);

    const baseShots =
        Math.floor(absoluteStrokes / 18);

    const remainingShots =
        absoluteStrokes % 18;

    const shotsGiven =
        strokeIndex <= remainingShots
            ? baseShots + 1
            : baseShots;

    return -shotsGiven;
}


function getPlayerHoleScore(
    playerId,
    holeIndex
) {
    const input = document.querySelector(
        `.player-${playerId}-score[data-hole="${holeIndex}"]`
    );

    const value = parseInt(
        input?.value,
        10
    );

    return Number.isInteger(value) && value > 0
        ? value
        : null;
}


function getActivePlayers() {
    return isFourballMatch()
        ? ["a", "b", "c", "d"]
        : ["a", "b"];
}


function isFourballMatch() {
    return matchFormatSelect.value === "fourball";
}


function getPlayerNameInput(playerId) {
    return document.getElementById(
        `player${playerId.toUpperCase()}Name`
    );
}


function getPlayerIndexInput(playerId) {
    return document.getElementById(
        `player${playerId.toUpperCase()}Index`
    );
}


function getPlayerDisplayName(playerId) {
    return (
        getPlayerNameInput(playerId)?.value.trim() ||
        PLAYER_DEFAULT_NAMES[playerId]
    );
}


function formatHandicap(value) {
    if (!Number.isFinite(value)) {
        return "-";
    }

    return value > 0
        ? value.toString()
        : value.toString();
}


function resetRound() {
    const confirmed = window.confirm(
        "Clear all scores for this match?"
    );

    if (!confirmed) {
        return;
    }

    document
        .querySelectorAll(".score-input")
        .forEach(input => {
            input.value = "";
        });

    updateMatch();
    saveRound();
}


function collectCurrentScores() {
    const scores = {};

    document
        .querySelectorAll(".score-input")
        .forEach(input => {
            const key =
                `${input.dataset.player}-${input.dataset.hole}`;

            scores[key] = input.value;
        });

    return scores;
}


function saveRound() {
    const roundData = {
        matchFormat: matchFormatSelect.value,
        scoringMode: scoringModeSelect.value,
        tee: teeSelect.value,
        roundDate: roundDateInput.value,
        scores: collectCurrentScores()
    };

    PLAYER_IDS.forEach(playerId => {
        const upperId =
            playerId.toUpperCase();

        roundData[`player${upperId}Name`] =
            getPlayerNameInput(playerId).value;

        roundData[`player${upperId}Index`] =
            getPlayerIndexInput(playerId).value;
    });

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(roundData)
    );
}


function loadSavedRound() {
    try {
        const savedRound =
            localStorage.getItem(
                STORAGE_KEY
            );

        return savedRound
            ? JSON.parse(savedRound)
            : null;
    } catch (error) {
        console.error(
            "Unable to load saved match:",
            error
        );

        return null;
    }
}


function restoreScores(scores = {}) {
    document
        .querySelectorAll(".score-input")
        .forEach(input => {
            const key =
                `${input.dataset.player}-${input.dataset.hole}`;

            input.value =
                scores[key] || "";
        });
}


function buildShareCard() {
    const formatLabel =
        isFourballMatch()
            ? "Fourball"
            : "Singles";

    const scoringLabel =
        scoringModeSelect.value === "gross"
            ? "Gross"
            : "Handicap";

    const allowanceLabel =
        scoringModeSelect.value === "gross"
            ? "None"
            : isFourballMatch()
                ? "90%"
                : "100%";

    document.getElementById(
        "shareSubtitle"
    ).textContent =
        `${formatLabel} ${scoringLabel} Match`;

    document.getElementById(
        "shareDate"
    ).textContent =
        roundDateInput.value || "-";

    document.getElementById(
        "shareTee"
    ).textContent =
        teeSelect.value || "-";

    document.getElementById(
        "shareFormat"
    ).textContent =
        formatLabel;

    document.getElementById(
        "shareScoring"
    ).textContent =
        scoringLabel;

    document.getElementById(
        "shareAllowance"
    ).textContent =
        allowanceLabel;

    document.getElementById(
        "shareResult"
    ).textContent =
        calculatedMatch.finalResult;

    buildSharePlayers();
    buildShareTables();

    document.getElementById(
        "shareTeamAHoles"
    ).textContent =
        calculatedMatch.teamAHoles;

    document.getElementById(
        "shareHalvedHoles"
    ).textContent =
        calculatedMatch.halvedHoles;

    document.getElementById(
        "shareTeamBHoles"
    ).textContent =
        calculatedMatch.teamBHoles;

    document.getElementById(
        "shareFinalResult"
    ).textContent =
        calculatedMatch.finalResult;
}


function buildSharePlayers() {
    const container =
        document.getElementById(
            "sharePlayers"
        );

    container.innerHTML = "";

    getActivePlayers().forEach(playerId => {
        const card =
            document.createElement("div");

        const team =
            PLAYER_TEAMS[playerId];

        card.className =
            `match-share-player team-${team.toLowerCase()}-share`;

        card.innerHTML = `
            <strong>
                Team ${team}
            </strong>

            <span>
                ${escapeHtml(
                    getPlayerDisplayName(playerId)
                )}
            </span>

            <small>
                CH ${formatHandicap(
                    playerHandicaps[playerId].course
                )}
                · Strokes ${formatHandicap(
                    playerHandicaps[playerId].strokes
                )}
            </small>
        `;

        container.appendChild(card);
    });
}


function buildShareTables() {
    const activePlayers =
        getActivePlayers();

    const frontHeader =
        document.getElementById(
            "shareFrontHeader"
        );

    const backHeader =
        document.getElementById(
            "shareBackHeader"
        );

    const headerHtml =
        createShareHeader(activePlayers);

    frontHeader.innerHTML = headerHtml;
    backHeader.innerHTML = headerHtml;

    const frontBody =
        document.querySelector(
            "#shareFront tbody"
        );

    const backBody =
        document.querySelector(
            "#shareBack tbody"
        );

    frontBody.innerHTML = "";
    backBody.innerHTML = "";

    selectedTee.holes.forEach(
        (par, index) => {
            const holeState =
                calculatedMatch.holes[index];

            const playerCells =
                activePlayers.map(playerId => {
                    const score =
                        getPlayerHoleScore(
                            playerId,
                            index
                        );

                    return `<td>${score || "-"}</td>`;
                }).join("");

            const result =
                !holeState?.complete
                    ? "-"
                    : holeState.winner === "A"
                        ? "Team A"
                        : holeState.winner === "B"
                            ? "Team B"
                            : "Halved";

            const runningStatus =
                holeState?.complete
                    ? holeState.runningStatus
                    : "-";

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${selectedTee.holes[index]}</td>
                    <td>${selectedTee.si[index]}</td>

                    ${playerCells}

                    <td>${result}</td>
                    <td>${runningStatus}</td>
                </tr>
            `;

            if (index < 9) {
                frontBody.insertAdjacentHTML(
                    "beforeend",
                    row
                );
            } else {
                backBody.insertAdjacentHTML(
                    "beforeend",
                    row
                );
            }
        }
    );
}


function createShareHeader(activePlayers) {
    const playerHeaders =
        activePlayers.map(playerId => `
            <th>
                ${escapeHtml(
                    getPlayerDisplayName(playerId)
                )}
            </th>
        `).join("");

    return `
        <th>Hole</th>
        <th>Par</th>
        <th>SI</th>

        ${playerHeaders}

        <th>Hole</th>
        <th>Match</th>
    `;
}


async function saveOrShareMatch() {
    const shareCard =
        document.getElementById(
            "shareCard"
        );

    if (
        !shareCard ||
        typeof html2canvas === "undefined"
    ) {
        alert(
            "The sharing tool is still loading. Please try again."
        );

        return;
    }

    buildShareCard();

    shareScorecardBtn.textContent =
        "Preparing...";

    shareScorecardBtn.disabled = true;

    shareCard.classList.add(
        "share-card-exporting"
    );

    await new Promise(resolve => {
        setTimeout(resolve, 150);
    });

    try {
        const canvas = await html2canvas(
            shareCard,
            {
                backgroundColor: "#fbf8ee",
                scale: 2,
                useCORS: true,
                width: 1200,
                windowWidth: 1200
            }
        );

        const blob = await canvasToBlob(canvas);

        const file = new File(
            [blob],
            "bells-matchplay-scorecard.png",
            {
                type: "image/png"
            }
        );

        if (
            navigator.canShare?.({
                files: [file]
            })
        ) {
            await navigator.share({
                title: "Bells Match Play",
                text: calculatedMatch.finalResult,
                files: [file]
            });
        } else {
            downloadBlob(
                blob,
                "bells-matchplay-scorecard.png"
            );
        }
    } catch (error) {
        if (error?.name !== "AbortError") {
            console.error(error);

            alert(
                "Unable to create the match scorecard."
            );
        }
    } finally {
        shareCard.classList.remove(
            "share-card-exporting"
        );

        shareScorecardBtn.textContent =
            "Save / Share Match";

        shareScorecardBtn.disabled = false;
    }
}


function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(
                    new Error(
                        "Image could not be created."
                    )
                );
            }
        }, "image/png");
    });
}


function downloadBlob(blob, filename) {
    const link =
        document.createElement("a");

    const objectUrl =
        URL.createObjectURL(blob);

    link.download = filename;
    link.href = objectUrl;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(objectUrl);
}


function createEmptyMatchState() {
    return {
        holes: [],
        completedHoles: 0,
        teamAHoles: 0,
        teamBHoles: 0,
        halvedHoles: 0,
        balance: 0,
        matchComplete: false,
        completionHole: null,
        finalResult: "All Square"
    };
}


function getTodayDate() {
    return new Date()
        .toISOString()
        .split("T")[0];
}


function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


initialiseApp();