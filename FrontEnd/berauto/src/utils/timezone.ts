import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/hu';

dayjs.extend(utc);
dayjs.extend(timezone);

// Alapértelmezett locale és időzóna
dayjs.locale('hu');
dayjs.tz.setDefault('Europe/Budapest');

export const DEFAULT_TIMEZONE = 'Europe/Budapest';
