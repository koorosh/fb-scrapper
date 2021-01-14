export type JsonValue = string | number | null | boolean

export type JsonObject = {
  [key: string]: JsonValue | Array<JsonValue | JsonObject>
}

export type JsonArray = Array<JsonValue | JsonObject>

export type JsonType = JsonObject | JsonArray | Array<JsonArray>