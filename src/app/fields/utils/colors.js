// Массив предопределенных цветов для треков
export const TRACK_COLORS = [
    '#FF4400', // оранжевый
    '#FF0000', // красный
    '#0088FF', // синий
    '#00CC00', // зеленый
    '#FF00FF', // пурпурный
    '#FFCC00', // желтый
    '#00FFFF', // голубой
    '#FF8800', // светло-оранжевый
];

// Функция для получения цвета по индексу
export const getTrackColor = (index) => {
    return TRACK_COLORS[index % TRACK_COLORS.length];
}; 