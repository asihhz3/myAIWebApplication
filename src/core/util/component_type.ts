import type { IMessage } from "../dialog/dialog_type";
import type { IModelSource } from "../model/model_type";

export interface IParamPanel {

    createMessage : () => IMessage | null,

    createSystemMessage : () => IMessage,

    createConfig : () => any,
}