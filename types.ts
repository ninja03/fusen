export type MsgIU = {
  id: string;
  act: "insert" | "update";
  txt: string;
  createdAt: number;
};

export type MsgD = {
  act: "delete";
  id: string;
};

export type Msg = MsgIU | MsgD;

export interface Fusen {
  id: string;
  txt: string;
  createdAt: number;
}
