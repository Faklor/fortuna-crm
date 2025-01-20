export const wialonDateToTimestamp = (date) => {
    return Math.floor(new Date(date).getTime() / 1000);
};

export const timestampToWialonDate = (timestamp) => {
    return new Date(timestamp * 1000);
};

export const formatWialonParams = (params) => {
    return encodeURIComponent(JSON.stringify(params));
}; 