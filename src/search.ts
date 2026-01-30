import { chromium, expect, Page } from "@playwright/test";
import inquirer from "inquirer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { splitBySlots } from "./splitTimeBySlot";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const getFacilitiesName = () => {
  const facilities = process.env.FACILITIES;
  if (!facilities) {
    throw Error(
      ".envに体育館の施設名をcsv形式でFACILITIESに定義してください, １施設の場合カンマは不要です"
    );
  }
  if (facilities.includes(",")) {
    return facilities.split(",");
  } else {
    return [facilities];
  }
};

const getPendingReleaseFacilities = async () => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://www.shisetsu.city.yokohama.lg.jp/user/Home");
  await page.getByRole("link", { name: "抽選・空き施設予約" }).click();
  await page.getByRole("tab", { name: "室場種類から探す" }).click();
  await page.getByLabel("室場種類から探す").getByText("体育室").click();
  await page.getByRole("button", { name: "検索" }).click();
  await page.getByRole("button", { name: "さらに読み込む" }).click();
  await page.waitForTimeout(1000);
  getFacilitiesName().forEach(async (name, _) => {
    await page.getByText(name).click();
  });
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "次へ進む" }).click();
  await page.getByText("1日").click();
  await page.getByRole("button", { name: "表示の変更" }).click();
  await page.waitForTimeout(2000);

  const checkButtons = page.locator("div.mb-4 label.btn");
  const checkButtonCount = await checkButtons.count();
  for (let i = 0; i < checkButtonCount; i++) {
    await checkButtons.nth(i).click();
  }

  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "次へ進む" }).click();

  await page.waitForTimeout(2000);

  const facilities = await getFacilitiesNameFromSite(page);
  const date = await getTargetDate(page);
  const timebox = await getTimeboxList(page);
  const slotCount = await getSlotCount(page);
  console.log(splitBySlots(timebox[0], timebox[timebox.length - 1], slotCount));
  const pendingEvents = await getPendingEvents(page);

  const list = createSelectBox(
    facilities,
    date,
    timebox,
    slotCount,
    pendingEvents
  );
  await page.close();
  return list;
};

const createSelectBox = async (
  facilities: string[],
  date: string,
  timebox: string[],
  slotCount: number,
  pendingEvents: Map<string, number[]>
) => {
  var result: string[] = [];
  const timeSlot = splitBySlots(
    timebox[0],
    timebox[timebox.length - 1],
    slotCount
  );
  pendingEvents.forEach((value, key) => {
    value.forEach((slotIndex) => {
      result.push(
        `${facilities[0]} ${key} ${date} ${timeSlot[slotIndex].start} ~ ${timeSlot[slotIndex].end}`
      );
    });
  });
  return result;
};

const getFacilitiesNameFromSite = async (page: Page) => {
  const locator = page.locator("h3.facility-title");
  const locatorCount = await locator.count();
  var facilities: string[] = [];
  for (let i = 0; i < locatorCount; i++) {
    const time = await locator.nth(i).textContent();
    if (time) {
      facilities.push(time);
    }
  }
  return Array.from(new Set(facilities));
};

const getTargetDate = async (page: Page) => {
  const locator = page.locator("div.events > ul > li.events-date > span");
  const locatorCount = await locator.count();
  var date = "";
  for (let i = 0; i < locatorCount; i++) {
    const text = await locator.nth(i).textContent();
    if (text) {
      date = date + text;
    }
  }
  return date;
};

const getTimeboxList = async (page: Page) => {
  const locator = page.locator("div.timeline > ul.custom-ul-modal > li > span");
  const locatorCount = await locator.count();
  var timebox: string[] = [];
  for (let i = 0; i < locatorCount; i++) {
    const time = await locator.nth(i).textContent();
    if (time) {
      timebox.push(time);
    }
  }
  return Array.from(new Set(timebox));
};

const getSlotCount = async (page: Page) => {
  const locator = page
    .locator("div.events > ul > li.events-group")
    .first()
    .locator("label.btn");
  return await locator.count();
};

const getPendingEvents = async (page: Page) => {
  const locator = page.locator("div.events > ul > li.events-group");
  const locatorCount = await locator.count();
  var info: Map<string, number[]> = new Map();
  for (let i = 0; i < locatorCount; i++) {
    const roomName =
      (await locator
        .nth(i)
        .locator("span.room-name > span")
        .first()
        .textContent()) ?? "unkwon";
    const reservationSlot = locator.nth(i).locator("label.btn");
    const count = await reservationSlot.count();
    var slotIndexList: number[] = [];
    for (let i = 0; i < count; i++) {
      const html = await reservationSlot.locator("svg").nth(i).innerHTML();
      const isPending = html.includes("reload");
      if (isPending) {
        slotIndexList.push(i);
      }
    }
    info.set(roomName, slotIndexList);
  }
  return info;
};

async function main() {
  const spinner = ora("本日7時解放予定の施設情報を取得中...").start();
  const choices = await getPendingReleaseFacilities();
  if (choices.length === 0) {
    spinner.fail("本日解放予定の施設はありませんでした");
    process.exit(0);
  } else {
    spinner.succeed("取得完了");
  }

  const answer = await inquirer.prompt([
    {
      type: "checkbox",
      name: "search result",
      message: "本日7時から解放される施設は以下です。1つだけ選択してください",
      loop: false,
      choices,
    },
  ]);

  console.log(answer);
  process.exit(0);
}

main();
