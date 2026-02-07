import { Page } from "@playwright/test";
import { EnvInfo } from "./type";

enum FormInfo {
  purpose, // 利用目的
  users, // 利用人数
  isSound, // 音出しの有無
  isSurroundSound, // 周辺の音を気にするか
  isAgree, // 規約に同意
}

export type FormType = "Normal" | "WithSound";
export type Facility =
  | "青葉スポーツセンター"
  | "旭スポーツセンター"
  | "磯子スポーツセンター"
  | "神奈川スポーツセンター"
  | "金沢スポーツセンター"
  | "港南スポーツセンター"
  | "港北スポーツセンター"
  | "栄スポーツセンター"
  | "瀬谷スポーツセンター"
  | "都筑スポーツセンター"
  | "鶴見スポーツセンター"
  | "戸塚スポーツセンター"
  | "中スポーツセンター"
  | "西スポーツセンター"
  | "保土ケ谷スポーツセンター"
  | "緑スポーツセンター"
  | "清水ケ丘公園体育館";

export const getFormType = (facility: Facility): FormType => {
  switch (facility) {
    case "神奈川スポーツセンター":
    case "都筑スポーツセンター":
    case "戸塚スポーツセンター":
    case "緑スポーツセンター":
      return "WithSound";
    default:
      return "Normal";
  }
};

export type NormalFormInfo = {
  purpose: string;
  users: number;
};

export type WithSoundFormInfo = NormalFormInfo & {
  isSound: boolean;
  isSurroundSound: boolean;
};

export const inputForm = async (
  page: Page,
  formType: FormType,
  envInfo: Pick<EnvInfo, "purpose" | "isNoisy" | "isSurroundNoisy"> & {
    users: number;
  },
) => {
  const { purpose, users, isNoisy, isSurroundNoisy } = envInfo;
  await page.getByText(purpose).locator("xpath=ancestor::label").click();
  await page
    .locator(
      'input[name="AvailabilityDetailModel.Items[0].Reservation.Number"]',
    )
    .nth(0)
    .fill(users.toString());

  if (formType === "WithSound") {
    const isNoisyLabel = isNoisy ? "音を出す" : "音を出さない";
    // await page.getByText(isNoisyLabel).locator("xpath=ancestor::label").click();
    await page.getByLabel(isNoisyLabel).click();
    const isSurroundNoisyLabel = isSurroundNoisy ? "気にする" : "気にしない";
    // await page
    //   .getByText(isSurroundNoisyLabel)
    //   .locator("xpath=ancestor::label")
    //   .click();
    await page.getByLabel(isSurroundNoisyLabel).click();
  }
  await page.getByLabel("すべての注意事項を確認し、同意します。").click();
};

// 青葉スポーツセンター
type AobaFormInfo = {
  purpose: string;
  users: number;
};

// 旭スポーツセンター
type AsahiFormInfo = {
  purpose: string;
  users: number;
};

// 磯子スポーツセンター
type IsogoFormInfo = {
  purpose: string;
  users: number;
};

// 神奈川スポーツセンター
type KanagawaFormInfo = {
  purpose: string;
  users: number;
  isSound: boolean;
  isSurroundSound: boolean;
};

// 金沢スポーツセンター
type KanazawaFormInfo = {
  purpose: string;
  users: number;
};

// 港南スポーツセンター
type KounanFormInfo = {
  purpose: string;
  users: number;
};

// 港北スポーツセンター
type KouhokuFormInfo = {
  purpose: string;
  users: number;
};

// 栄スポーツセンター
type SakaeFormInfo = {
  purpose: string;
  users: number;
};

// 瀬谷スポーツセンター
type SeyaFormInfo = {
  purpose: string;
  users: number;
};

// 都筑スポーツセンター
type TsudukiFormInfo = {
  purpose: string;
  users: number;
  isSound: boolean;
  isSurroundSound: boolean;
};

// 鶴見スポーツセンター
type TsurumiFormInfo = {
  purpose: string;
  users: number;
};

// 戸塚スポーツセンター
type TodukaFormInfo = {
  purpose: string;
  users: number;
  isSound: boolean;
  isSurroundSound: boolean;
};

// 中スポーツセンター
type NakaFormInfo = {
  purpose: string;
  users: number;
};

// 西スポーツセンター
type NishiFormInfo = {
  purpose: string;
  users: number;
};

// 保土ケ谷スポーツセンター
type HodogayaFormInfo = {
  purpose: string;
  users: number;
};

// 緑スポーツセンター
type MidoriFormInfo = {
  purpose: string;
  users: number;
  isSound: boolean;
  isSurroundSound: boolean;
};

// 清水ケ丘公園体育館
type ShimizugaokaFormInfo = {
  purpose: string;
  users: number;
};
