import dayjs from 'dayjs';


export function getVersion() {
    const date = new Date();
    return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
}