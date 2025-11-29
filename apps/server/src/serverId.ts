// A small stable identifier for this server instance used to avoid re-broadcasting
export const SERVER_ID = process.env.SERVER_ID || `${process.pid}-${Math.random().toString(36).slice(2, 9)}`;

export default SERVER_ID;
