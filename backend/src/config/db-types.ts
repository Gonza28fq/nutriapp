// Tipos equivalentes a los de mysql2, para que los modelos no dependan del driver.
export interface RowDataPacket { [columna: string]: any }
export type { ResultHeader as ResultSetHeader } from "./database";
