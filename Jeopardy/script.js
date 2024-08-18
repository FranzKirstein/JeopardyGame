const BASE_API_URL = "https://rithm-jeopardy.herokuapp.com/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  // ask for 100 categories [most we can ask for], so we can pick random
  let response = await axios.get(`${BASE_API_URL}categories`, {
    params: { count: 100 },
  });
  let catIds = response.data.map((c) => c.id);
  return _.sampleSize(catIds, NUM_CATEGORIES);
}

async function getCategory(catId) {
  let response = await axios.get(`${BASE_API_URL}category`, {
    params: { id: catId },
  });
  let cat = response.data;
  let randomClues = _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map((c) => ({
    question: c.question,
    answer: c.answer,
    showing: null,
  }));
  return { title: cat.title, clues: randomClues };
}

async function fillTable() {
  hideLoadingView();

  // Add row with headers for categories
  let headerHtml = "<tr>";
  for (let category of categories) {
    headerHtml += `<th>${category.title}</th>`;
  }
  headerHtml += "</tr>";
  $("#jeopardy thead").html(headerHtml);

  // Add rows with point values for each category
  let bodyHtml = "";
  for (let clueIdx = 0; clueIdx < NUM_CLUES_PER_CAT; clueIdx++) {
    let rowHtml = "<tr>";
    let pointValue = (clueIdx + 1) * 100; // Calculate point value from 100 to 500
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      rowHtml += `<td id="${catIdx}-${clueIdx}" class="point-value">${pointValue}</td>`;
    }
    rowHtml += "</tr>";
    bodyHtml += rowHtml;
  }
  $("#jeopardy tbody").html(bodyHtml);
}

function handleClick(evt) {
  let $tgt = $(evt.target).closest("td");
  let id = $tgt.attr("id");
  let [catId, clueId] = id.split("-");
  let clue = categories[catId]?.clues[clueId];

  if (!clue) return;

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
    $tgt.addClass("disabled");
  } else {
    // already showing answer; ignore
    return;
  }

  // Update text of cell
  $tgt.html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  // clear the board
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();

  // show the loading icon
  $("#spin-container").show();
  $("#start").addClass("disabled").text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#start").removeClass("disabled").text("Restart!");
  $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  let isLoading = $("#start").text() === "Loading...";

  if (!isLoading) {
    showLoadingView();

    let catIds = await getCategoryIds();

    categories = [];

    for (let catId of catIds) {
      categories.push(await getCategory(catId));
    }

    fillTable();
  }
}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function () {
  $("#jeopardy").on("click", "td", handleClick);
});
