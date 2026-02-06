import { chromium, expect, Page } from "@playwright/test";
import inquirer from "inquirer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { splitBySlots } from "./splitTimeBySlot";
import ora from "ora";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type EnvInfo = {
  userId: string;
  password: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  targetDayOfWeek: string[];
};

type RowInfo = {
  facility: string;
  room: string;
  date: string;
  time: string;
  releaseDate: string;
};

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const getPendingReleaseFacilities = async ({
  startDate,
  endDate,
  startTime,
  endTime,
  targetDayOfWeek,
}: EnvInfo) => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://www.shisetsu.city.yokohama.lg.jp/user/Home");
  await page
    .getByRole("tab", { name: "日時から探す （抽選申込は除く）" })
    .click();
  await page
    .getByLabel("日時から探す（抽選申込は除く）")
    .getByText("バスケットボール")
    .click();
  await page.locator('input[name="HomeModel.DateFrom"]').fill(startDate);
  await page.locator('input[name="HomeModel.DateTo"]').fill(endDate);
  await page.locator("#HomeModel_TimeFrom").selectOption(startTime);
  await page.locator("#HomeModel_TimeTo").selectOption(endTime);
  for (const date of targetDayOfWeek) {
    await page.getByText(date).click();
  }
  await page.getByText("開放待ち").click();
  await page.getByRole("button", { name: "検索" }).click();
  await page.waitForTimeout(2000);
  const isNoHit = await page
    .getByText("条件に該当する施設はありません。")
    .isVisible();
  if (isNoHit) {
    return [];
  }
  const rows = await getRowsInfo(page);
  return rows;
};

const getRowsInfo = async (page: Page): Promise<RowInfo[]> => {
  var rowsInfo: RowInfo[] = [];

  const locator = page.locator("table > tbody > tr");
  const locatorCount = await locator.count();
  for (let i = 0; i < locatorCount; i++) {
    const tds = locator.nth(i).locator("td");
    const facility = (await tds.nth(1).textContent()) ?? "";
    const room = (await tds.nth(2).textContent()) ?? "";
    const date = (await tds.nth(3).textContent()) ?? "";
    const time = (await tds.nth(4).textContent()) ?? "";
    const releaseDate = (await tds.nth(5).textContent()) ?? "";
    rowsInfo.push({
      facility,
      room,
      date,
      time,
      releaseDate,
    });
  }

  await page.close();
  return rowsInfo;
};

const getEnvInfo = (): EnvInfo => {
  const errors: string[] = [];
  const userId = process.env.USER_ID;
  if (!userId) {
    errors.push(
      ".envにUSER_IDの情報がありません。予約の際に使用するIDを設定してください。"
    );
  }
  const password = process.env.PASSWORD;
  if (!password) {
    errors.push(
      ".envにPASSWORDの情報がありません。予約の際に使用するPASSWORDを設定してください。"
    );
  }
  const startDate = process.env.START_DATE;
  if (!startDate) {
    errors.push(
      ".envにSTART_DATEの情報がありません。フォーマットはyyyy-MM-ddで設定してください。例: 2026-02-06"
    );
  }
  const endDate = process.env.END_DATE;
  if (!endDate) {
    errors.push(
      ".envにEND_DATEの情報がありません。フォーマットはyyyy-MM-ddで設定してください。例: 2026-02-06"
    );
  }
  const startTime = process.env.START_TIME;
  if (!startTime) {
    errors.push(
      ".envにSTART_TIMEの情報がありません。フォーマットはhhmmで設定してください。例: 1300"
    );
  }
  const endTime = process.env.END_TIME;
  if (!endTime) {
    errors.push(
      ".envにEND_TIMEの情報がありません。フォーマットはhhmmで設定してください。例: 2100"
    );
  }
  const targetDayOfWeek = process.env.TARGET_DAY_OF_WEEK;
  if (!targetDayOfWeek) {
    errors.push(
      ".envにTARGET_DAY_OF_WEEKの情報がありません。csv形式で対象の曜日を設定してください。例: 土曜日,日曜日"
    );
  }
  if (errors.length !== 0) {
    const msg = errors.join("\n");
    throw Error(msg);
  }
  return {
    userId: userId ?? "",
    password: password ?? "",
    startDate: startDate ?? "",
    endDate: endDate ?? "",
    startTime: startTime ?? "",
    endTime: endTime ?? "",
    targetDayOfWeek: targetDayOfWeek?.split(",") ?? [],
  };
};

async function main() {
  try {
    const envInfo = getEnvInfo();
    const spinner = ora(
      `以下の期間で開放待ちの施設情報を取得中...\n日付: ${envInfo.startDate}~${envInfo.endDate}\n時刻: ${envInfo.startTime}~${envInfo.endTime}`
    ).start();
    const results = await getPendingReleaseFacilities(envInfo);
    const choices = results.map(
      (val) =>
        `施設: ${val.facility.trim()} ${val.room.trim()}\n日付: ${val.date.trim()} ${val.time.trim()}\n開放時間: ${val.releaseDate.trim()}`
    );
    if (choices.length === 0) {
      spinner.fail("指定の期間では開放待ちの施設はありませんでした");
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
  } catch (error) {
    console.log(error.message);
    process.exit(0);
  }
}

await main();
