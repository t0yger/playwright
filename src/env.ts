import dotenv from "dotenv";
import path from "path";
import { dirname } from "./const";
import { EnvInfo } from "./type";

export const getEnvInfo = (): EnvInfo => {
  dotenv.config({ path: path.resolve(dirname, "../.env") });

  const errors: string[] = [];
  const userId = process.env.USER_ID;
  if (!userId) {
    errors.push(
      ".envにUSER_IDの情報がありません。予約の際に使用するIDを設定してください。",
    );
  }
  const password = process.env.PASSWORD;
  if (!password) {
    errors.push(
      ".envにPASSWORDの情報がありません。予約の際に使用するPASSWORDを設定してください。",
    );
  }
  const startDate = process.env.START_DATE;
  if (!startDate) {
    errors.push(
      ".envにSTART_DATEの情報がありません。フォーマットはyyyy-MM-ddで設定してください。例: 2026-02-06",
    );
  }
  const endDate = process.env.END_DATE;
  if (!endDate) {
    errors.push(
      ".envにEND_DATEの情報がありません。フォーマットはyyyy-MM-ddで設定してください。例: 2026-02-06",
    );
  }
  const startTime = process.env.START_TIME;
  if (!startTime) {
    errors.push(
      ".envにSTART_TIMEの情報がありません。フォーマットはhhmmで設定してください。例: 1300",
    );
  }
  const endTime = process.env.END_TIME;
  if (!endTime) {
    errors.push(
      ".envにEND_TIMEの情報がありません。フォーマットはhhmmで設定してください。例: 2100",
    );
  }
  const targetDayOfWeek = process.env.TARGET_DAY_OF_WEEK;
  if (!targetDayOfWeek) {
    errors.push(
      ".envにTARGET_DAY_OF_WEEKの情報がありません。csv形式で対象の曜日を設定してください。例: 土曜日,日曜日",
    );
  }
  const purpose = process.env.PURPOSE ?? "バスケットボール";
  const isNoisy = process.env.IS_NOISY === "true";
  const isSurroundNoisy = process.env.IS_SURROUND_NOISY === "true";
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
    purpose,
    isNoisy,
    isSurroundNoisy,
  };
};
