export type EnvInfo = {
  userId: string;
  password: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  targetDayOfWeek: string[];
  purpose: string;
  isNoisy: boolean;
  isSurroundNoisy: boolean;
};

export type RowInfo = {
  facility: string;
  room: string;
  date: string;
  time: string;
  releaseDate: string;
};
