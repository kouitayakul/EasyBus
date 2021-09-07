import * as functions from "firebase-functions";
import fetch from "node-fetch";
import { dialogflow, SimpleResponse } from "actions-on-google";

const app = dialogflow({ debug: true });

app.intent("Get Next Bus Time", async (conv) => {
  const busTimes = await getNextBusTimes();
  const busNoWithTime = processBusTimesToSpeech(busTimes);

  conv.close(
    new SimpleResponse({
      text: `${busNoWithTime}`,
      speech: `${busNoWithTime}`,
    })
  );
});

//API Key
const API_KEY = "Your API Key";

async function getNextBusTimes() {
  const busesInfoAPI = await fetch(
    `https://api.translink.ca/rttiapi/v1/stops/50268/estimates?apikey=${API_KEY}&count=3&timeframe=120`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  const busesInfoJson = await busesInfoAPI.json();

  return busesInfoJson;
}

function processBusTimesToSpeech(busTimes: any[]) {
  let speech: string = "";

  for (let i = busTimes.length - 1; i >= 0; i--) {
    let { RouteNo, Schedules } = busTimes[i];
    let { ExpectedCountdown, ScheduleStatus } = Schedules[0];

    RouteNo = toWords(RouteNo);

    if (ScheduleStatus === "-" || ExpectedCountdown < 0) {
      ExpectedCountdown = Math.abs(ExpectedCountdown);
      let delay = `Bus ${RouteNo} is late by ${ExpectedCountdown} minutes. `;
      speech += delay;
    } else if (ScheduleStatus === "+") {
      let ahead = `Bus ${RouteNo} is ahead of schedule by ${ExpectedCountdown} minutes. `;
      speech += ahead;
    } else {
      speech += `Bus ${RouteNo} is leaving in ${ExpectedCountdown} minutes. `;
    }
  }

  return speech;
}

function toWords(number: number) {
  let words = "";
  let stringNumber: string;
  let ones: any = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
  };
  let tens: any = {
    "2": "twenty",
    "3": "thirdy",
    "4": "fourty",
    "5": "fifty",
    "6": "sixty",
    "7": "seventy",
    "8": "eighty",
    "9": "ninety",
  };
  let teens: any = {
    "0": "ten",
    "1": "eleven",
    "2": "twelve",
    "3": "thirteen",
    "4": "fourteen",
    "5": "fifteen",
    "6": "sixteen",
    "7": "seventeen",
    "8": "eighteen",
    "9": "nineteen",
  };

  stringNumber = number.toString();

  if (stringNumber[1] === "0") {
    return ones[stringNumber[2]];
  } else if (stringNumber[1] === "1") {
    return teens[stringNumber[2]];
  } else {
    words += `${tens[stringNumber[1]]}-${ones[stringNumber[2]]}`;
  }

  return words;
}

//Export Cloud Functions
export const fulfillment = functions.https.onRequest(app);
