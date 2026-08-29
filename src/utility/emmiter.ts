// utils/emitter.ts
import { EventEmitter } from "expo-modules-core";

export const appEmitter = new EventEmitter<Record<string, any>>();
