import { Browser, chromium, Page } from "@playwright/test";
import { EnvInfo, RowInfo } from "./type";
import path from "path";
import { promises as fs } from "fs";
import { dirname } from "./const";
import { getEnvInfo } from "./env";
import cron from "node-cron";
import { authFile, setupAuth } from "./setupAuth";
import ora from "ora";
import { Facility, getFormType, inputForm } from "./form";
import inquirer from "inquirer";

const answer = await inquirer.prompt([
  {
    type: "input",
    name: "count",
    message: "今回の利用人数を入力してください",
    validate: (input) => {
      const value = Number(input);
      if (Number.isNaN(value)) {
        return "数値を入力してください";
      }
      return true;
    },
  },
]);

const users = Number(answer.count);

type ReserveArg = RowInfo & EnvInfo;
var spinner = ora("6:55になったら認証を行いCookie情報を保存します...").start();
var browser: Browser;
var page: Page;

const prepare = async ({
  startDate,
  endDate,
  startTime,
  endTime,
  targetDayOfWeek,
}: ReserveArg) => {
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
  await page.getByText("空きコマ").click();
};

const reserve = async ({
  facility,
  room,
  date,
  time,
  purpose,
  isNoisy,
  isSurroundNoisy,
}: ReserveArg) => {
  await page.getByRole("button", { name: "検索" }).click();
  await page
    .getByRole("row", {
      name: `${facility} ${room} ${date} ${time}`,
    })
    .locator("label")
    .click();
  await page
    .locator("button.btn-primary")
    .filter({ hasText: "次へ進む" })
    .click();
  await page
    .getByText(formatTimeRange(time))
    .locator("xpath=ancestor::label")
    .click();
  await page
    .locator("button.btn-primary")
    .filter({ hasText: "次へ進む" })
    .click();

  const formType = getFormType(facility as Facility);
  await inputForm(page, formType, { purpose, users, isNoisy, isSurroundNoisy });
};

function formatTimeRange(input: string): string {
  const match = input.match(/^(\d{1,2}):(\d{2})～(\d{1,2}):(\d{2})$/);

  if (!match) {
    throw new Error("Invalid time format");
  }

  const [, startHourStr, startMin, endHourStr, endMin] = match;

  const startHour = Number(startHourStr);
  const endHour = Number(endHourStr);

  // バリデーション（必要なら）
  if (
    startHour < 0 ||
    startHour > 24 ||
    endHour < 0 ||
    endHour > 24 ||
    startMin !== "00" ||
    endMin !== "00"
  ) {
    throw new Error("Invalid time value");
  }

  return `${startHour}時から${endHour}時まで`;
}

const getRowInfo = async (): Promise<RowInfo> => {
  const filePath = path.join(dirname, "targetReserve.json");
  const data = await fs.readFile(filePath);
  return JSON.parse(data.toString());
};

// 認証
cron.schedule(
  `55 6 * * *`,
  async () => {
    try {
      const envInfo = getEnvInfo();
      browser = await chromium.launch({
        headless: false,
      });
      page = await browser.newPage();
      await setupAuth({
        userId: envInfo.userId,
        password: envInfo.password,
        page,
      });
      await page.close();
      await browser.close();
      spinner.succeed("認証が完了しました。");
      spinner = ora("6:59になったら直前の画面で待機します...").start();
    } catch (error) {
      spinner.fail("認証が失敗しました");
      console.log((error as Error)?.message);
      process.exit(0);
    }
  },
  {
    timezone: "Asia/Tokyo",
  },
);

// 直前の画面で待機
cron.schedule(
  `59 6 * * *`,
  async () => {
    try {
      const rowInfo = await getRowInfo();
      const envInfo = getEnvInfo();
      browser = await chromium.launch({
        headless: false,
      });
      page = await browser.newPage({
        storageState: authFile,
      });
      await prepare({ ...rowInfo, ...envInfo });
      spinner.succeed("準備完了");
      spinner = ora("7:00になったら予約を開始します...").start();
    } catch (error) {
      spinner.fail("何かしらの操作に失敗しました");
      console.log((error as Error)?.message);
      await page.close();
      await browser.close();
      process.exit(0);
    }
  },
  {
    timezone: "Asia/Tokyo",
  },
);

// 予約実行
cron.schedule(
  `0 7 * * *`,
  async () => {
    try {
      const rowInfo = await getRowInfo();
      const envInfo = getEnvInfo();
      await reserve({ ...rowInfo, ...envInfo });
    } catch (error) {
      console.log((error as Error)?.message);
      process.exit(0);
    }
  },
  {
    timezone: "Asia/Tokyo",
  },
);
