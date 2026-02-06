import { Browser, chromium, Page } from "@playwright/test";
import { EnvInfo, RowInfo } from "./type";
import path from "path";
import { promises as fs } from "fs";
import { dirname } from "./const";
import { getEnvInfo } from "./env";
import cron from "node-cron";
import { authFile, setupAuth } from "./setupAuth";
import ora from "ora";

type ReserveArg = RowInfo & EnvInfo & { page: Page };
var spinner = ora("6:55になったら認証を行いCookie情報を保存します...").start();
var browser: Browser;
var page: Page;
const START_RESERVE_HOUR = 5;
const START_RESERVE_MINUTE = 25;

const prepare = async ({
  facility,
  room,
  date,
  time,
  startDate,
  endDate,
  startTime,
  endTime,
  targetDayOfWeek,
  page,
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

const reserve = async ({ facility, room, date, time, page }: ReserveArg) => {
  await page.getByRole("button", { name: "検索" }).click();
  await page
    .getByRole("row", {
      name: `${facility} ${room} ${date} ${time}`,
    })
    .locator("label")
    .click();
  await page.getByRole("button", { name: "次へ進む" }).click();
  await page.getByText(formatTimeRange(time)).click();
  await page.getByRole("button", { name: "次へ進む" }).click();
};

function formatTimeRange(input: string): string {
  const match = input.match(/^(\d{2}):(\d{2})～(\d{2}):(\d{2})$/);

  if (!match) {
    throw new Error("Invalid time format");
  }

  const [, startHour, startMin, endHour, endMin] = match;

  // 分が 00 以外ならエラーにしたい場合はここでチェック
  // if (startMin !== '00' || endMin !== '00') {
  //   throw new Error('Minutes must be 00');
  // }

  const normalizeHour = (h: string) => Number(h).toString();

  return `${normalizeHour(startHour)}時から${normalizeHour(endHour)}時まで`;
}

const getRowInfo = async (): Promise<RowInfo> => {
  const filePath = path.join(dirname, "targetReserve.json");
  const data = await fs.readFile(filePath);
  return JSON.parse(data.toString());
};

cron.schedule(
  `${START_RESERVE_MINUTE - 5} ${START_RESERVE_HOUR} * * *`,
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
  `${START_RESERVE_MINUTE - 1} ${START_RESERVE_HOUR} * * *`,
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
      await prepare({ ...rowInfo, ...envInfo, page });
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

cron.schedule(
  `${START_RESERVE_MINUTE} ${START_RESERVE_HOUR} * * *`,
  async () => {
    try {
      const rowInfo = await getRowInfo();
      const envInfo = getEnvInfo();
      await reserve({ ...rowInfo, ...envInfo, page });
    } catch (error) {
      console.log((error as Error)?.message);
      process.exit(0);
    }
  },
  {
    timezone: "Asia/Tokyo",
  },
);
