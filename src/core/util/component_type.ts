import type { IMessage } from "../dialog/dialog_type";

export interface IParamPanel {

    createMessage : () => IMessage | null,

    createSystemMessage : () => IMessage,

    createConfig : () => any
}