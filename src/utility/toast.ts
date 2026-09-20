import { appEmitter } from "./emitter";

export const showToast = (message: string) => {
	appEmitter.emit("showToast", message);
};
