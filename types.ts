export interface Msg {
  id: string;
  act: "insert" | "update" | "delete";
  txt?: string;
  createdAt?: number;
}

export interface Fusen {
  id: string;
  txt: string;
  createdAt: number;
}
